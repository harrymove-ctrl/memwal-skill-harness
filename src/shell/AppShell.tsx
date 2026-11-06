import type { ReactNode } from "react";
import type { ShellMember } from "./AccountMenu";
import { MobileBar, MobileTopBar } from "./MobileBar";
import type { Place } from "./places";
import { Sidebar } from "./Sidebar";
import type { ShellSpace } from "./SpaceSwitcher";
import "./shell.css";
import type { Theme } from "./theme";
import { TitleBar } from "./TitleBar";

export interface AppShellProps {
  /** The selected place, or null on a page outside the five, such as /bento. */
  place: Place | null;
  onNavigate: (place: Place) => void;
  /** Null while the member has no space yet. */
  space: ShellSpace | null;
  spaces: ShellSpace[];
  onSwitchSpace: (name: string) => void;
  /** Leave out for read only members; the New space item then hides. */
  onNewSpace?: () => void;
  member: ShellMember | null;
  onSignOut: () => void;
  /** Shown when member is null. */
  onSignIn?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  title: string;
  /** The current place's tools, with at most one primary. */
  toolbar?: ReactNode;
  /** Tools shown on every place, such as Share or Pull latest. */
  actions?: ReactNode;
  /** Quiet links above the account row on desktop, such as 3D Lab. */
  sidebarExtra?: ReactNode;
  children: ReactNode;
}

/** Layout only: every value and handler comes from props, and it fetches nothing. */
export function AppShell(props: AppShellProps) {
  return (
    <div className="cc-shell" data-testid="app-shell">
      <a className="cc-skip" href="#cc-main">
        Skip to content
      </a>

      <Sidebar
        place={props.place}
        onNavigate={props.onNavigate}
        space={props.space}
        spaces={props.spaces}
        onSwitchSpace={props.onSwitchSpace}
        onNewSpace={props.onNewSpace}
        member={props.member}
        onSignOut={props.onSignOut}
        onSignIn={props.onSignIn}
        theme={props.theme}
        onToggleTheme={props.onToggleTheme}
        extra={props.sidebarExtra}
      />

      <MobileTopBar
        space={props.space}
        spaces={props.spaces}
        onSwitchSpace={props.onSwitchSpace}
        onNewSpace={props.onNewSpace}
        member={props.member}
        onSignOut={props.onSignOut}
        onSignIn={props.onSignIn}
        theme={props.theme}
        onToggleTheme={props.onToggleTheme}
      />

      <div className="cc-page">
        <TitleBar title={props.title} toolbar={props.toolbar} actions={props.actions} />
        <main id="cc-main" className="cc-main" tabIndex={-1} data-testid="shell-main">
          {props.children}
        </main>
      </div>

      <MobileBar place={props.place} onNavigate={props.onNavigate} />
    </div>
  );
}
