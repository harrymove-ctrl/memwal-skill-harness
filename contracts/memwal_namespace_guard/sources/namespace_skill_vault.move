/// Walrus Memory — Namespace & Delegate Account Guard (`memwal_namespace_guard::namespace_skill_vault`)
///
/// Enforces on-chain that a connected delegate key address (`blake2b256(0x00 || pubkey)`)
/// belongs to the target `MemWalAccount` AND is bound to the exact same shared
/// skill namespace (e.g., `"memwal-team-skills"`, `"design-skills"`).
///
/// ## 4-Gate On-Chain Invariant
/// - **G1 (Identity Derivation)**: `connected_addr == memwal::account::derive_sui_address(&pk)`
/// - **G2 (Account Membership)**: `connected_addr == account.owner || account::is_delegate_address(account, connected_addr)`
/// - **G3 (Same Namespace Guard)**: `contains(&vault.delegate_namespaces[connected_addr], &namespace)`
/// - **G4 (SEAL Counter Fence)**: `account::is_active(account) && counter == account::access_counter_version(account)`
module memwal_namespace_guard::namespace_skill_vault {
    use std::string::String;
    use sui::clock::Clock;
    use sui::event;
    use sui::table::{Self, Table};
    use memwal::account::{Self, AccountRegistry, MemWalAccount};

    // ============================================================
    // Error Codes
    // ============================================================

    /// Caller is not the MemWalAccount owner
    const ENotAccountOwner: u64 = 200;
    /// Connected address is neither the account owner nor an authorized delegate key
    const EDelegateNotAuthorizedOnAccount: u64 = 201;
    /// Namespace is not registered on this MemWalAccount vault
    const ENamespaceNotFound: u64 = 202;
    /// Connected delegate address is not bound to the requested namespace
    const EDelegateNamespaceMismatch: u64 = 203;
    /// Vault account_id does not match the supplied MemWalAccount object
    const EAccountVaultMismatch: u64 = 204;
    /// MemWalAccount is deactivated or frozen
    const EAccountInactive: u64 = 205;
    /// Stale SEAL access counter version detected during skill blob commit
    const EStaleAccessCounter: u64 = 206;

    // ============================================================
    // Structs
    // ============================================================

    /// Metadata for a versioned `SKILL.md` or Flow Memory blob anchored in a namespace.
    public struct SkillBlobRecord has store, copy, drop {
        skill_id: String,
        namespace: String,
        walrus_blob_id: String,
        version: u64,
        committed_by: address,
        access_counter_version: u64,
        updated_at_ms: u64,
    }

    /// Shared object binding a `MemWalAccount` to its authorized skill namespaces
    /// and tracking which delegate Sui addresses are connected to each namespace.
    public struct NamespaceSkillVault has key {
        id: UID,
        /// The `MemWalAccount` object ID this vault guards
        account_id: ID,
        /// Owner Sui address of the `MemWalAccount`
        owner: address,
        /// List of registered skill namespaces (e.g. ["memwal-team-skills", "design-skills"])
        namespaces: vector<String>,
        /// Maps delegate `sui_address` -> list of namespaces that delegate can read/write
        delegate_namespaces: Table<address, vector<String>>,
        /// Latest Walrus blob pointer per `"namespace::skill_id"` key
        skill_blobs: Table<String, SkillBlobRecord>,
        /// Mirrors `MemWalAccount::access_counter_version` at last namespace sync
        last_synced_counter_version: u64,
        /// Created timestamp (epoch ms)
        created_at: u64,
    }

    // ============================================================
    // Events
    // ============================================================

    public struct NamespaceVaultCreated has copy, drop {
        vault_id: ID,
        account_id: ID,
        owner: address,
    }

    public struct DelegateJoinedNamespace has copy, drop {
        vault_id: ID,
        account_id: ID,
        delegate_address: address,
        namespace: String,
        access_counter_version: u64,
    }

    public struct DelegateLeftNamespace has copy, drop {
        vault_id: ID,
        account_id: ID,
        delegate_address: address,
        namespace: String,
        access_counter_version: u64,
    }

    public struct NamespaceAccessVerified has copy, drop {
        vault_id: ID,
        account_id: ID,
        connected_address: address,
        namespace: String,
        access_counter_version: u64,
    }

    public struct SkillBlobCommitted has copy, drop {
        vault_id: ID,
        account_id: ID,
        namespace: String,
        skill_id: String,
        walrus_blob_id: String,
        version: u64,
        committed_by: address,
        access_counter_version: u64,
    }

    // ============================================================
    // Entry Functions
    // ============================================================

    /// Create a shared `NamespaceSkillVault` linked 1:1 with an existing `MemWalAccount`.
    entry fun create_namespace_vault(
        account: &MemWalAccount,
        initial_namespaces: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(account::owner(account) == sender, ENotAccountOwner);
        assert!(account::is_active(account), EAccountInactive);

        let account_id = object::id(account);
        let vault = NamespaceSkillVault {
            id: object::new(ctx),
            account_id,
            owner: sender,
            namespaces: initial_namespaces,
            delegate_namespaces: table::new(ctx),
            skill_blobs: table::new(ctx),
            last_synced_counter_version: account::access_counter_version(account),
            created_at: clock.timestamp_ms(),
        };

        event::emit(NamespaceVaultCreated {
            vault_id: object::id(&vault),
            account_id,
            owner: sender,
        });

        transfer::share_object(vault);
    }

    /// Bind an authorized delegate address on `MemWalAccount` to the same `namespace`.
    /// Aborts if `delegate_address` is not an active delegate key on `account`.
    entry fun authorize_delegate_for_namespace(
        account: &MemWalAccount,
        vault: &mut NamespaceSkillVault,
        delegate_address: address,
        namespace: String,
        ctx: &TxContext,
    ) {
        assert!(account::owner(account) == ctx.sender(), ENotAccountOwner);
        assert!(object::id(account) == vault.account_id, EAccountVaultMismatch);
        assert!(account::is_active(account), EAccountInactive);

        // G2: Must be owner or registered delegate key on the MemWalAccount
        assert!(
            delegate_address == account::owner(account) ||
            account::is_delegate_address(account, delegate_address),
            EDelegateNotAuthorizedOnAccount,
        );

        // Ensure namespace is registered on vault
        if (!contains_string(&vault.namespaces, &namespace)) {
            vault.namespaces.push_back(namespace);
        };

        if (!vault.delegate_namespaces.contains(delegate_address)) {
            vault.delegate_namespaces.add(delegate_address, vector::empty());
        };

        let bound_list = vault.delegate_namespaces.borrow_mut(delegate_address);
        if (!contains_string(bound_list, &namespace)) {
            bound_list.push_back(namespace);
        };

        vault.last_synced_counter_version = account::access_counter_version(account);

        event::emit(DelegateJoinedNamespace {
            vault_id: object::id(vault),
            account_id: vault.account_id,
            delegate_address,
            namespace,
            access_counter_version: vault.last_synced_counter_version,
        });
    }

    /// Revoke a delegate address from a namespace and sync the SEAL rotation counter.
    entry fun revoke_delegate_from_namespace(
        account: &MemWalAccount,
        vault: &mut NamespaceSkillVault,
        delegate_address: address,
        namespace: String,
        ctx: &TxContext,
    ) {
        assert!(account::owner(account) == ctx.sender(), ENotAccountOwner);
        assert!(object::id(account) == vault.account_id, EAccountVaultMismatch);

        if (vault.delegate_namespaces.contains(delegate_address)) {
            let bound_list = vault.delegate_namespaces.borrow_mut(delegate_address);
            let mut i = 0;
            let len = bound_list.length();
            while (i < len) {
                if (&bound_list[i] == &namespace) {
                    bound_list.remove(i);
                    break
                };
                i = i + 1;
            };
        };

        vault.last_synced_counter_version = account::access_counter_version(account);

        event::emit(DelegateLeftNamespace {
            vault_id: object::id(vault),
            account_id: vault.account_id,
            delegate_address,
            namespace,
            access_counter_version: vault.last_synced_counter_version,
        });
    }

    // ============================================================
    // Core Verification: Connected Address + Delegate Account + Same Namespace
    // ============================================================

    /// Pure view check: returns `true` iff:
    /// 1. `account` is active and matches `vault.account_id`
    /// 2. `connected_address` is the `account` owner OR in `account.delegate_keys`
    /// 3. `namespace` is registered in `vault.namespaces`
    /// 4. `connected_address` is bound to `namespace` (or is the account owner)
    public fun is_connected_delegate_in_namespace(
        account: &MemWalAccount,
        vault: &NamespaceSkillVault,
        namespace: &String,
        connected_address: address,
    ): bool {
        if (!account::is_active(account)) return false;
        if (object::id(account) != vault.account_id) return false;
        if (!contains_string(&vault.namespaces, namespace)) return false;

        if (connected_address == account::owner(account)) {
            return true
        };

        if (!account::is_delegate_address(account, connected_address)) {
            return false
        };

        if (!vault.delegate_namespaces.contains(connected_address)) {
            return false
        };

        let bound_list = vault.delegate_namespaces.borrow(connected_address);
        contains_string(bound_list, namespace)
    }

    /// Strict on-chain assertion used by SEAL dry_run and relayer session preflight:
    /// Verifies that the connected signer (`ctx.sender()`) is an authorized delegate
    /// on `account` AND uses the exact same `namespace`.
    entry fun assert_connected_delegate_same_namespace(
        _registry: &AccountRegistry,
        account: &MemWalAccount,
        vault: &NamespaceSkillVault,
        namespace: String,
        ctx: &TxContext,
    ) {
        assert!(account::is_active(account), EAccountInactive);
        assert!(object::id(account) == vault.account_id, EAccountVaultMismatch);
        assert!(contains_string(&vault.namespaces, &namespace), ENamespaceNotFound);

        let connected_address = ctx.sender();
        let is_owner = connected_address == account::owner(account);
        let is_delegate = account::is_delegate_address(account, connected_address);
        assert!(is_owner || is_delegate, EDelegateNotAuthorizedOnAccount);

        if (!is_owner) {
            assert!(
                vault.delegate_namespaces.contains(connected_address),
                EDelegateNamespaceMismatch,
            );
            let bound_list = vault.delegate_namespaces.borrow(connected_address);
            assert!(contains_string(bound_list, &namespace), EDelegateNamespaceMismatch);
        };

        event::emit(NamespaceAccessVerified {
            vault_id: object::id(vault),
            account_id: vault.account_id,
            connected_address,
            namespace,
            access_counter_version: account::access_counter_version(account),
        });
    }

    /// Anchor a new `SKILL.md` or Flow Memory Walrus blob into `namespace` after passing
    /// all 4 gates (`G1`–`G4`), including the SEAL access counter linearization fence.
    entry fun commit_skill_blob(
        registry: &AccountRegistry,
        account: &MemWalAccount,
        vault: &mut NamespaceSkillVault,
        namespace: String,
        skill_key: String,
        skill_id: String,
        walrus_blob_id: String,
        expected_counter_version: u64,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert_connected_delegate_same_namespace(registry, account, vault, namespace, ctx);

        let current_counter = account::access_counter_version(account);
        assert!(current_counter == expected_counter_version, EStaleAccessCounter);

        let next_version = if (vault.skill_blobs.contains(skill_key)) {
            let prev = vault.skill_blobs.remove(skill_key);
            prev.version + 1
        } else {
            1
        };

        let record = SkillBlobRecord {
            skill_id,
            namespace,
            walrus_blob_id,
            version: next_version,
            committed_by: ctx.sender(),
            access_counter_version: current_counter,
            updated_at_ms: clock.timestamp_ms(),
        };

        event::emit(SkillBlobCommitted {
            vault_id: object::id(vault),
            account_id: vault.account_id,
            namespace: record.namespace,
            skill_id: record.skill_id,
            walrus_blob_id: record.walrus_blob_id,
            version: next_version,
            committed_by: record.committed_by,
            access_counter_version: current_counter,
        });

        vault.skill_blobs.add(skill_key, record);
        vault.last_synced_counter_version = current_counter;
    }

    /// SEAL key-server policy entry point that enforces both `memwal::account::seal_approve`
    /// AND namespace membership on `NamespaceSkillVault`.
    entry fun seal_approve_namespace(
        id: vector<u8>,
        registry: &AccountRegistry,
        account: &MemWalAccount,
        vault: &NamespaceSkillVault,
        namespace: String,
        ctx: &TxContext,
    ) {
        account::seal_approve(id, registry, account, ctx);
        assert_connected_delegate_same_namespace(registry, account, vault, namespace, ctx);
    }

    // ============================================================
    // Internal Helpers
    // ============================================================

    fun contains_string(list: &vector<String>, target: &String): bool {
        let mut i = 0;
        let len = list.length();
        while (i < len) {
            if (&list[i] == target) return true;
            i = i + 1;
        };
        false
    }
}
