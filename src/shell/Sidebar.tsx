import type { ReactNode } from "react";
import { WalrusLogo3D } from "../components/ui/walrus-3d-icons";
import { AccountMenu, type ShellMember, ThemeButton } from "./AccountMenu";
import { PLACE_ICONS, PlaceLink } from "./PlaceLink";
import { PLACES, PLACE_LABELS, type Place } from "./places";
import { type ShellSpace, SpaceSwitcher } from "./SpaceSwitcher";
import type { Theme } from "./theme";

export interface SidebarProps {
  place: Place | null;
  onNavigate: (place: Place) => void;
  space: ShellSpace | null;
  spaces: ShellSpace[];
  onSwitchSpace: (name: string) => void;
  onNewSpace?: () => void;
  member: ShellMember | null;
  onSignOut: () => void;
  onSignIn?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  extra?: ReactNode;
}

function countLabel(count: number | undefined): string | null {
  if (!count || !Number.isFinite(count) || count <= 0) return null;
  return count > 999 ? "999+" : String(Math.floor(count));
}

export function Sidebar(props: SidebarProps) {
  const skillCount = countLabel(props.space?.skillCount);

  return (
    <aside className="cc-sidebar" data-testid="shell-sidebar">
      <div className="cc-brand">
        <WalrusLogo3D size="sm" />
        <span className="cc-truncate">Walrus Memory</span>
      </div>

      <SpaceSwitcher
        space={props.space}
        spaces={props.spaces}
        onSwitchSpace={props.onSwitchSpace}
        onNewSpace={props.onNewSpace}
        side="below"
      />

      <nav className="cc-nav" aria-label="Places">
        {PLACES.map((target) => (
          <PlaceLink
            key={target}
            target={target}
            current={props.place}
            onNavigate={props.onNavigate}
            className="cc-nav__item"
          >
            <span className="cc-nav__icon">{PLACE_ICONS[target]}</span>
            <span className="cc-nav__label">{PLACE_LABELS[target]}</span>
            {target === "skills" && skillCount && <span className="cc-nav__count">{skillCount}</span>}
          </PlaceLink>
        ))}
      </nav>

      {props.extra && <div className="cc-sidebar__extra">{props.extra}</div>}

      <div className="cc-sidebar__foot">
        <AccountMenu member={props.member} onSignOut={props.onSignOut} onSignIn={props.onSignIn} side="above" />
        <ThemeButton theme={props.theme} onToggle={props.onToggleTheme} />
      </div>
    </aside>
  );
}
