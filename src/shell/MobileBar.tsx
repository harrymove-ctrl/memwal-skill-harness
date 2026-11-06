import { AccountMenu, type ShellMember, ThemeButton } from "./AccountMenu";
import { LogoMark, PRODUCT_NAME } from "./Logo";
import { PLACE_ICONS, PlaceLink } from "./PlaceLink";
import { PLACES, PLACE_LABELS, type Place } from "./places";
import { type ShellSpace, SpaceSwitcher } from "./SpaceSwitcher";
import type { Theme } from "./theme";

export interface MobileTopBarProps {
  place: Place | null;
  space: ShellSpace | null;
  spaces: ShellSpace[];
  onSwitchSpace: (name: string) => void;
  onNewSpace?: () => void;
  member: ShellMember | null;
  onSignOut: () => void;
  onSignIn?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

/** Under 768px: the space switcher, the theme and the account share one row. */
export function MobileTopBar(props: MobileTopBarProps) {
  return (
    <header className="cc-topbar" data-testid="shell-topbar">
      <LogoMark size={24} title={PRODUCT_NAME} className="cc-brand__mark" glint glintKey={props.place} />
      <div className="cc-topbar__space">
        <SpaceSwitcher
          space={props.space}
          spaces={props.spaces}
          onSwitchSpace={props.onSwitchSpace}
          onNewSpace={props.onNewSpace}
          side="below"
        />
      </div>
      <ThemeButton theme={props.theme} onToggle={props.onToggleTheme} />
      <AccountMenu member={props.member} onSignOut={props.onSignOut} onSignIn={props.onSignIn} compact side="below" />
    </header>
  );
}

export interface MobileBarProps {
  place: Place | null;
  onNavigate: (place: Place) => void;
}

/** Under 768px: the five places, as a bottom bar. */
export function MobileBar({ place, onNavigate }: MobileBarProps) {
  return (
    <nav className="cc-bottombar" aria-label="Places" data-testid="shell-bottombar">
      {PLACES.map((target) => (
        <PlaceLink key={target} target={target} current={place} onNavigate={onNavigate} className="cc-tab">
          <span className="cc-tab__icon">{PLACE_ICONS[target]}</span>
          <span className="cc-tab__label cc-truncate">{PLACE_LABELS[target]}</span>
        </PlaceLink>
      ))}
    </nav>
  );
}
