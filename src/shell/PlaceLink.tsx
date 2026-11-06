import { BookOpen, FlaskConical, House, Plug, Users } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { PLACE_LABELS, PLACE_PATHS, type Place } from "./places";

export const PLACE_ICONS: Record<Place, ReactNode> = {
  home: <House size={16} strokeWidth={1.75} aria-hidden />,
  skills: <BookOpen size={16} strokeWidth={1.75} aria-hidden />,
  try: <FlaskConical size={16} strokeWidth={1.75} aria-hidden />,
  team: <Users size={16} strokeWidth={1.75} aria-hidden />,
  agents: <Plug size={16} strokeWidth={1.75} aria-hidden />,
};

/**
 * A real link, so open in new tab and copy link keep working. A plain click goes
 * through onNavigate; clicking the current place does nothing, which keeps
 * rapid clicks from stacking duplicate history entries.
 */
export function PlaceLink({
  target,
  current,
  onNavigate,
  className,
  children,
}: {
  target: Place;
  current: Place | null;
  onNavigate: (place: Place) => void;
  className: string;
  children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (target !== current) onNavigate(target);
  };

  return (
    <a
      href={PLACE_PATHS[target]}
      className={className}
      aria-current={target === current ? "page" : undefined}
      aria-label={PLACE_LABELS[target]}
      data-testid={`shell-place-${target}`}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
