import { BookOpen, ChevronsUpDown, FlaskConical, House, Plug, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "../kit";

export type Place = "home" | "skills" | "try" | "team" | "agents";

const NAV: { id: Place; label: string; icon: ReactNode }[] = [
  { id: "home", label: "Home", icon: <House size={16} strokeWidth={1.75} /> },
  { id: "skills", label: "Skills", icon: <BookOpen size={16} strokeWidth={1.75} /> },
  { id: "try", label: "Try it", icon: <FlaskConical size={16} strokeWidth={1.75} /> },
  { id: "team", label: "Team", icon: <Users size={16} strokeWidth={1.75} /> },
  { id: "agents", label: "Agents", icon: <Plug size={16} strokeWidth={1.75} /> },
];

/** The app's sidebar: space switcher, five places, the signed in member. */
export function Sidebar({ place, counts = {} }: { place: Place; counts?: Partial<Record<Place, string>> }) {
  return (
    <div className="mx-side">
      <div className="mx-space">
        <div className="mx-space__text">
          <div className="mx-space__name">memwal-team-skills</div>
          <div className="mx-space__meta">Team space</div>
        </div>
        <ChevronsUpDown size={14} strokeWidth={1.75} className="mx-faint" />
      </div>
      <nav className="mx-nav">
        {NAV.map((n) => (
          <div key={n.id} className="mx-nav__item" data-on={n.id === place || undefined}>
            <span className="mx-nav__icon">{n.icon}</span>
            <span className="mx-nav__label">{n.label}</span>
            {counts[n.id] && <span className="mx-nav__count">{counts[n.id]}</span>}
          </div>
        ))}
      </nav>
      <div className="mx-me">
        <Avatar name="harrymove-ctrl" size={24} />
        <div className="mx-me__text">
          <div className="mx-me__name">harrymove-ctrl</div>
          <div className="mx-me__meta">Owner</div>
        </div>
      </div>
    </div>
  );
}

export function Card({ title, meta, children, className }: { title?: ReactNode; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mx-card${className ? ` ${className}` : ""}`}>
      {(title || meta) && (
        <div className="mx-card__head">
          {title && <div className="mx-card__title">{title}</div>}
          {meta && <div className="mx-card__meta">{meta}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({ children, primary, icon }: { children: ReactNode; primary?: boolean; icon?: ReactNode }) {
  return (
    <span className="mx-btn" data-primary={primary || undefined}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

/** A truncated identifier, monospace, single line. */
export function IdPill({ children }: { children: ReactNode }) {
  return <span className="mx-id">{children}</span>;
}

/** An agent's tile: a quiet icon tile, no invented logo. */
export function AgentGlyph({ children, size = 28 }: { children: ReactNode; size?: number }) {
  return (
    <span className="mx-glyph" style={{ width: size, height: size }}>
      {children}
    </span>
  );
}
