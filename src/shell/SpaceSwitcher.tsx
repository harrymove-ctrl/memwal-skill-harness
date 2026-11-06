import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useMenu } from "./useMenu";

export interface ShellSpace {
  name: string;
  skillCount: number;
}

export function skillCountLabel(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${safe.toLocaleString("en-US")} ${safe === 1 ? "skill" : "skills"}`;
}

export interface SpaceSwitcherProps {
  space: ShellSpace | null;
  spaces: ShellSpace[];
  onSwitchSpace: (name: string) => void;
  onNewSpace?: () => void;
  side: "below" | "above";
}

export function SpaceSwitcher({ space, spaces, onSwitchSpace, onNewSpace, side }: SpaceSwitcherProps) {
  const menu = useMenu();

  return (
    <div className="cc-menu-anchor">
      <button
        ref={menu.triggerRef}
        type="button"
        className="cc-space"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-label={space ? `Space: ${space.name}. Switch space` : "No space selected. Choose a space"}
        title={space?.name}
        data-testid="shell-space-trigger"
        onClick={menu.toggle}
        onKeyDown={menu.onTriggerKeyDown}
      >
        <span className="cc-menu__text">
          <span className="cc-space__name cc-truncate" style={{ display: "block" }}>
            {space ? space.name : "No space yet"}
          </span>
          <span className="cc-meta cc-truncate" style={{ display: "block" }}>
            {space ? skillCountLabel(space.skillCount) : "Choose or create one"}
          </span>
        </span>
        <ChevronsUpDown size={14} strokeWidth={1.75} className="cc-space__icon" aria-hidden />
      </button>

      {menu.open && (
        <div
          ref={menu.menuRef}
          role="menu"
          aria-label="Spaces"
          className="cc-menu"
          data-side={side}
          data-testid="shell-space-menu"
          onKeyDown={menu.onMenuKeyDown}
        >
          {spaces.length === 0 && <div className="cc-menu__note">No spaces yet</div>}
          {spaces.map((item) => {
            const selected = item.name === space?.name;
            return (
              <button
                key={item.name}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className="cc-menu__item"
                title={item.name}
                data-testid="shell-space-option"
                onClick={() => {
                  menu.close();
                  if (!selected) onSwitchSpace(item.name);
                }}
              >
                <span className="cc-menu__text">
                  <span className="cc-truncate" style={{ display: "block", fontWeight: 500 }}>
                    {item.name}
                  </span>
                  <span className="cc-meta" style={{ display: "block" }}>
                    {skillCountLabel(item.skillCount)}
                  </span>
                </span>
                <span className="cc-menu__check" aria-hidden>
                  {selected && <Check size={16} strokeWidth={2} />}
                </span>
              </button>
            );
          })}
          {onNewSpace && (
            <>
              {spaces.length > 0 && <div className="cc-menu__divider" />}
              <button
                type="button"
                role="menuitem"
                className="cc-menu__item"
                data-testid="shell-new-space"
                onClick={() => {
                  menu.close();
                  onNewSpace();
                }}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden />
                <span className="cc-menu__text">New space</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
