import type { ReactNode } from "react";

export interface TitleBarProps {
  title: string;
  /** The current place's tools, with at most one primary. */
  toolbar?: ReactNode;
  /** Tools shown on every place, such as Share. They sit after the place's tools. */
  actions?: ReactNode;
}

export function TitleBar({ title, toolbar, actions }: TitleBarProps) {
  return (
    <div className="cc-titlebar" data-testid="shell-titlebar">
      <h1 className="cc-titlebar__title cc-truncate" title={title}>
        {title}
      </h1>
      {(toolbar || actions) && (
        <div className="cc-titlebar__tools">
          {toolbar}
          {actions}
        </div>
      )}
    </div>
  );
}
