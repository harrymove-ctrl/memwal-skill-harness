#[test_only]
module memwal_namespace_guard::namespace_skill_vault_tests {
    use std::string;
    use sui::clock;
    use sui::test_scenario::{Self as ts};
    use memwal::account::{Self, AccountRegistry, MemWalAccount};
    use memwal_namespace_guard::namespace_skill_vault::{
        Self,
        NamespaceSkillVault,
    };

    const OWNER: address = @0xA11CE;
    const UNAUTHORIZED: address = @0xBAD;

    fun sample_ed25519_pubkey(): vector<u8> {
        vector[
            1, 2, 3, 4, 5, 6, 7, 8,
            9, 10, 11, 12, 13, 14, 15, 16,
            17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32
        ]
    }

    #[test]
    fun test_delegate_same_namespace_verification_and_commit() {
        let mut scenario = ts::begin(OWNER);
        let pk = sample_ed25519_pubkey();
        let delegate_addr = account::derive_sui_address(&pk);

        // 1. Initialize MemWal AccountRegistry & finalize migration latch
        {
            account::test_init(scenario.ctx());
        };
        scenario.next_tx(OWNER);
        {
            let mut registry = scenario.take_shared<AccountRegistry>();
            account::test_set_migration_finalized(&mut registry, true);
            let clk = clock::create_for_testing(scenario.ctx());
            account::create_account(&mut registry, &clk, scenario.ctx());
            clock::destroy_for_testing(clk);
            ts::return_shared(registry);
        };

        // 2. Owner adds delegate key & creates NamespaceSkillVault
        scenario.next_tx(OWNER);
        {
            let registry = scenario.take_shared<AccountRegistry>();
            let mut acct = scenario.take_shared<MemWalAccount>();
            let clk = clock::create_for_testing(scenario.ctx());

            account::add_delegate_key(
                &mut acct,
                &registry,
                pk,
                string::utf8(b"Claude Code Worker"),
                &clk,
                scenario.ctx(),
            );

            namespace_skill_vault::create_namespace_vault(
                &acct,
                vector[string::utf8(b"memwal-team-skills"), string::utf8(b"design-skills")],
                &clk,
                scenario.ctx(),
            );

            clock::destroy_for_testing(clk);
            ts::return_shared(acct);
            ts::return_shared(registry);
        };

        // 3. Owner binds delegate_addr to "memwal-team-skills"
        scenario.next_tx(OWNER);
        {
            let acct = scenario.take_shared<MemWalAccount>();
            let mut vault = scenario.take_shared<NamespaceSkillVault>();

            namespace_skill_vault::authorize_delegate_for_namespace(
                &acct,
                &mut vault,
                delegate_addr,
                string::utf8(b"memwal-team-skills"),
                scenario.ctx(),
            );

            assert!(
                namespace_skill_vault::is_connected_delegate_in_namespace(
                    &acct,
                    &vault,
                    &string::utf8(b"memwal-team-skills"),
                    delegate_addr,
                ),
                0,
            );
            assert!(
                !namespace_skill_vault::is_connected_delegate_in_namespace(
                    &acct,
                    &vault,
                    &string::utf8(b"design-skills"),
                    delegate_addr,
                ),
                1,
            );
            assert!(
                !namespace_skill_vault::is_connected_delegate_in_namespace(
                    &acct,
                    &vault,
                    &string::utf8(b"memwal-team-skills"),
                    UNAUTHORIZED,
                ),
                2,
            );

            ts::return_shared(vault);
            ts::return_shared(acct);
        };

        // 4. Delegate signs PTB asserting same namespace and committing SKILL.md blob
        scenario.next_tx(delegate_addr);
        {
            let registry = scenario.take_shared<AccountRegistry>();
            let acct = scenario.take_shared<MemWalAccount>();
            let mut vault = scenario.take_shared<NamespaceSkillVault>();
            let clk = clock::create_for_testing(scenario.ctx());

            namespace_skill_vault::commit_skill_blob(
                &registry,
                &acct,
                &mut vault,
                string::utf8(b"memwal-team-skills"),
                string::utf8(b"memwal-team-skills::expense-watchdog"),
                string::utf8(b"expense-watchdog"),
                string::utf8(b"blob_walrus_9f2a4c8d10"),
                0,
                &clk,
                scenario.ctx(),
            );

            clock::destroy_for_testing(clk);
            ts::return_shared(vault);
            ts::return_shared(acct);
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }
}
