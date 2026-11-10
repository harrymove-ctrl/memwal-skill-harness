import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { SignerOrb3D } from "../components/ui/walrus-3d-icons";
import type { Theme } from "./theme";
import { useMenu } from "./useMenu";

export type MemberRole = "Owner" | "Editor" | "Viewer";

export interface ShellMember {
  handle: string;
  role: MemberRole;
}

/** A wallet address reads as 0x463e…eb1d; a person's handle stays as written. */
export function displayHandle(handle: string): { text: string; isAddress: boolean } {
  if (/^0x[0-9a-fA-F]{12,}$/.test(handle)) {
    return { text: `${handle.slice(0, 6)}…${handle.slice(-4)}`, isAddress: true };
  }
  return { text: handle, isAddress: false };
}

export interface AccountMenuProps {
  member: ShellMember | null;
  onSignOut: () => void;
  onSignIn?: () => void;
  /** The mobile top bar has room for the avatar only. */
  compact?: boolean;
  side: "below" | "above";
}

export function AccountMenu({ member, onSignOut, onSignIn, compact, side }: AccountMenuProps) {
  const menu = useMenu();

  if (!member) {
    if (onSignIn) {
      return (
        <button type="button" className="cc-btn cc-signin" data-testid="shell-sign-in" onClick={onSignIn}>
          <LogIn size={16} strokeWidth={1.75} aria-hidden />
          Sign in
        </button>
      );
    }
    return compact ? null : (
      <div className="cc-account__text cc-meta" style={{ padding: "0 6px" }} data-testid="shell-signed-out">
        Not signed in
      </div>
    );
  }

  const { text, isAddress } = displayHandle(member.handle);
  const avatar = (
    <span className="cc-avatar cc-avatar--orb" aria-hidden>
      <SignerOrb3D handle={member.handle} size={26} online />
    </span>
  );

  return (
    <div className="cc-menu-anchor" style={{ flex: compact ? "none" : 1 }}>
      <button
        ref={menu.triggerRef}
        type="button"
        className="cc-account"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-label={`Account: ${text}, ${member.role}`}
        title={member.handle}
        data-testid="shell-account-trigger"
        onClick={menu.toggle}
        onKeyDown={menu.onTriggerKeyDown}
      >
        {avatar}
        {!compact && (
          <span className="cc-account__text">
            <span
              className={`cc-account__name cc-truncate${isAddress ? " cc-mono" : ""}`}
              style={{ display: "block" }}
            >
              {text}
            </span>
            <span className="cc-meta" style={{ display: "block" }}>
              {member.role}
            </span>
          </span>
        )}
      </button>

      {menu.open && (
        <div
          ref={menu.menuRef}
          role="menu"
          aria-label="Account"
          className="cc-menu"
          data-side={side}
          data-testid="shell-account-menu"
          onKeyDown={menu.onMenuKeyDown}
        >
          <div className="cc-menu__head">
            <div className={`cc-truncate${isAddress ? " cc-mono" : ""}`} style={{ fontWeight: 500 }} title={member.handle}>
              {text}
            </div>
            <div className="cc-meta">{member.role}</div>
          </div>
          <div className="cc-menu__divider" />
          <button
            type="button"
            role="menuitem"
            className="cc-menu__item"
            data-testid="shell-sign-out"
            onClick={() => {
              menu.close();
              onSignOut();
            }}
          >
            <LogOut size={16} strokeWidth={1.75} aria-hidden />
            <span className="cc-menu__text">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function ThemeButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="cc-icon-btn"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-testid="shell-theme-toggle"
      onClick={onToggle}
    >
      {theme === "dark" ? (
        <Sun size={16} strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon size={16} strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
