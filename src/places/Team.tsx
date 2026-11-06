import { type FormEvent, useRef, useState } from "react";
import { type AccessRole, type Member, type MembersState, ROLE_LABELS, type Verification } from "../hooks/useMembers";
import { Card, Notice } from "../parts";
import { IdPill, useCopied } from "../parts/IdPill";
import { failureStatus, StateFrame } from "../parts/StateFrame";
import { Button } from "../shell/Button";
import { plainHandle, plural } from "../shell/copy";
import "./places.css";

const VERIFICATION_TEXT: Record<Verification, string> = {
  owner: "Owns the account, verified via Tatum Sui RPC",
  key: "Key on account, verified via Tatum Sui RPC",
  pending: "Pending: no key on the account yet",
  unknown: "Tatum could not read the account just now",
};

type AddNotice = { tone: "info" | "warn" | "danger"; text: string; offerAnyway?: boolean };

function RoleSelect({
  value,
  label,
  disabled,
  includeOwner,
  onChange,
}: {
  value: AccessRole;
  label: string;
  disabled?: boolean;
  includeOwner?: boolean;
  onChange: (role: AccessRole) => void;
}) {
  return (
    <select
      className="cc-field cc-select"
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as AccessRole)}
    >
      {includeOwner && <option value="owner">{ROLE_LABELS.owner}</option>}
      <option value="read-write">{ROLE_LABELS["read-write"]}</option>
      <option value="read-only">{ROLE_LABELS["read-only"]}</option>
    </select>
  );
}

function MemberRow({
  member,
  isYou,
  canManage,
  chainOwner,
  onRole,
  onRemove,
}: {
  member: Member;
  isYou: boolean;
  canManage: boolean;
  chainOwner: boolean;
  onRole: (role: AccessRole) => Promise<string | null>;
  onRemove: () => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = plainHandle(member.handle);

  const run = async (action: () => Promise<string | null>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const failed = await action();
    setBusy(false);
    setConfirming(false);
    setError(failed);
  };

  return (
    <div className="cc-member" data-testid="member-row" data-verification={member.verification}>
      <span className="cc-activity__glyph" data-person aria-hidden>
        {name.charAt(0).toUpperCase() || "?"}
      </span>
      <div className="cc-member__body">
        <div className="cc-member__name">
          <span className="cc-member__handle">{name}</span>
          {isYou && <span className="cc-meta">You</span>}
          <IdPill value={member.suiAddress} label={`${name}'s address`} />
        </div>
        <div className="cc-member__verify" data-state={member.verification}>
          {VERIFICATION_TEXT[member.verification]}
        </div>
        {error && (
          <div style={{ marginTop: 6 }}>
            <Notice tone="danger">{error}</Notice>
          </div>
        )}
        {confirming && (
          <div className="cc-actions" style={{ marginTop: 8, alignItems: "center" }} data-testid="member-confirm">
            <span>Remove {name} from this space?</span>
            <Button disabled={busy} onClick={() => void run(onRemove)}>Remove</Button>
            <Button onClick={() => setConfirming(false)}>Keep</Button>
          </div>
        )}
      </div>
      <div className="cc-member__side">
        {canManage && !chainOwner ? (
          <>
            <RoleSelect
              value={member.role}
              label={`Role for ${name}`}
              includeOwner
              disabled={busy}
              onChange={(role) => void run(() => onRole(role))}
            />
            {!confirming && (
              <button type="button" className="cc-textbtn" data-testid="member-remove" onClick={() => setConfirming(true)}>
                Remove
              </button>
            )}
          </>
        ) : (
          <span className="cc-rule__state">{ROLE_LABELS[member.role]}</span>
        )}
      </div>
    </div>
  );
}

function InviteBar({ state, namespace, inviteUrl }: { state: MembersState; namespace: string; inviteUrl: (token: string) => string }) {
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<AccessRole>("read-only");
  const [linkRole, setLinkRole] = useState<AccessRole>("read-only");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<AddNotice | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, copy] = useCopied();
  const pending = useRef(false);

  const submit = async (acceptUnchecked: boolean) => {
    const value = address.trim();
    if (!value || pending.current) return;
    pending.current = true;
    setAdding(true);
    setNotice(null);
    const outcome = await state.add(value, role, acceptUnchecked);
    pending.current = false;
    setAdding(false);
    if (outcome.status === "added") {
      setAddress("");
      setNotice({
        tone: outcome.verdict === "clean" ? "info" : "warn",
        text:
          outcome.verdict === "clean"
            ? "Added. The Tatum address check found nothing. They need an agent key before their agent can recall."
            : "Added without an address check, as you chose.",
      });
      return;
    }
    switch (outcome.code) {
      case "flagged":
        setNotice({ tone: "danger", text: "Not added. The Tatum address check flagged this address." });
        break;
      case "unchecked":
        setNotice({ tone: "warn", text: "Tatum could not check this address just now. Try again, or add it without a check.", offerAnyway: true });
        break;
      case "invalid":
      case "not_found":
        setNotice({ tone: "danger", text: "That is not a Sui address or a name we could find. Check it and try again." });
        break;
      case "exists":
        setNotice({ tone: "warn", text: "This address is already a member." });
        break;
      default:
        setNotice({ tone: "danger", text: outcome.message });
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };

  const makeLink = async () => {
    if (linkBusy) return;
    setLinkBusy(true);
    setLinkError(null);
    const created = await state.invite(linkRole);
    setLinkBusy(false);
    if (!created) {
      setLinkError("The invite link did not save. Please try again.");
      return;
    }
    const url = inviteUrl(created.token);
    setLink(url);
    await copy(url);
  };

  return (
    <Card title="Invite" meta={`To ${namespace}`} testId="team-invite">
      <form className="cc-invite" onSubmit={onSubmit}>
        <input
          className="cc-field cc-invite__field"
          aria-label="Sui address or name"
          placeholder="0x address or name.sui"
          autoComplete="off"
          spellCheck={false}
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            setNotice(null);
          }}
          data-testid="invite-address"
        />
        <RoleSelect value={role} label="Role for this person" onChange={setRole} />
        <Button type="submit" variant="primary" disabled={adding || !address.trim()} data-testid="invite-add">
          {adding ? "Checking" : "Invite"}
        </Button>
      </form>
      {notice && (
        <div style={{ marginTop: 8 }}>
          <Notice
            tone={notice.tone}
            testId="invite-notice"
            action={
              notice.offerAnyway ? (
                <Button disabled={adding} onClick={() => void submit(true)} data-testid="invite-anyway">
                  Add without a check
                </Button>
              ) : undefined
            }
          >
            {notice.text}
          </Notice>
        </div>
      )}
      <div className="cc-invite cc-invite--link">
        <span className="cc-meta">Or share a link that works for 7 days, for</span>
        <RoleSelect value={linkRole} label="Role for the invite link" onChange={setLinkRole} />
        <Button disabled={linkBusy} onClick={() => void makeLink()} data-testid="invite-link">
          {copied ? "Copied" : link ? "Copy a new link" : "Copy invite link"}
        </Button>
      </div>
      {link && !copied && (
        <input className="cc-field" style={{ marginTop: 8 }} readOnly aria-label="Invite link" value={link} data-testid="invite-link-value" onFocus={(event) => event.target.select()} />
      )}
      {linkError && (
        <div style={{ marginTop: 8 }}>
          <Notice tone="danger">{linkError}</Notice>
        </div>
      )}
    </Card>
  );
}

export interface TeamPlaceProps {
  namespace: string;
  state: MembersState;
  /** Builds the shareable address for an invite token. */
  inviteUrl: (token: string) => string;
  onSignIn?: () => void;
}

export function TeamPlace({ namespace, state, inviteUrl, onSignIn }: TeamPlaceProps) {
  const isOwner = state.you?.role === "owner";
  const you = state.you?.address;
  const frame =
    state.status === "loading" ? "loading" : state.status === "error" ? failureStatus() : state.members.length ? "ready" : "empty";

  return (
    <div className="cc-place" data-testid="team-view">
      {isOwner && <InviteBar state={state} namespace={namespace} inviteUrl={inviteUrl} />}
      {state.status === "ready" && !isOwner && (
        <Notice
          tone="info"
          testId="team-readonly"
          action={!state.you && onSignIn ? <Button onClick={onSignIn}>Sign in</Button> : undefined}
        >
          {state.you ? (state.you.role ? "Only an owner can invite or change members." : "You are signed in, but not a member of this space. Ask an owner for an invite.") : "Sign in as an owner to invite or change members."}
        </Notice>
      )}
      {state.status === "ready" && !state.accountRead && (
        <Notice tone="warn" onRetry={state.refresh} testId="team-unverified">
          Tatum could not read the account just now, so nobody is shown as verified.
        </Notice>
      )}
      <Card title="Members" meta={state.status === "ready" ? plural(state.members.length, "member") : undefined} testId="team-members">
        <StateFrame
          status={frame}
          onRetry={state.refresh}
          errorText="The member list did not load. Your skills and rules are unaffected."
          empty={<p style={{ margin: 0, color: "var(--cc-ink-2)" }}>Nobody is in this space yet.</p>}
        >
          <div className="cc-divided">
            {state.members.map((member) => (
              <MemberRow
                key={member.suiAddress}
                member={member}
                isYou={member.suiAddress === you}
                canManage={isOwner}
                chainOwner={member.verification === "owner"}
                onRole={(role) => state.setRole(member.suiAddress, role)}
                onRemove={() => state.remove(member.suiAddress)}
              />
            ))}
          </div>
        </StateFrame>
      </Card>
    </div>
  );
}
