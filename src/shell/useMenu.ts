import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

const ITEM_SELECTOR = '[role^="menuitem"]';

/**
 * Open state and keyboard behavior for a shell menu: arrows, Home and End move,
 * Escape and Tab close and return focus, an outside press or a resize closes.
 */
export function useMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    const first =
      menu?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      menu?.querySelector<HTMLElement>(ITEM_SELECTOR);
    first?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    const onResize = () => close(false);

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  const onMenuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" || event.key === "Tab") {
        event.preventDefault();
        close(true);
        return;
      }
      const items = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
      );
      if (items.length === 0) return;
      const index = items.indexOf(document.activeElement as HTMLElement);
      const targets: Record<string, number> = {
        ArrowDown: (index + 1) % items.length,
        ArrowUp: (index - 1 + items.length) % items.length,
        Home: 0,
        End: items.length - 1,
      };
      const next = targets[event.key];
      if (next === undefined) return;
      event.preventDefault();
      items[next]?.focus();
    },
    [close],
  );

  const onTriggerKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }, []);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  return { open, toggle, close, triggerRef, menuRef, onMenuKeyDown, onTriggerKeyDown };
}
