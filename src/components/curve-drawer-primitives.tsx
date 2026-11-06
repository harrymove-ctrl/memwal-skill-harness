"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

const CURVE_EASE = [0.76, 0, 0.24, 1] as const;

interface CurveEdgeProps {
  side?: "left" | "right";
  className?: string;
  curveWidth?: number;
  open?: boolean;
}

function CurveEdge({
  side = "left",
  className,
  curveWidth = 100,
  open = true,
}: CurveEdgeProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [height, setHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    const updateHeight = () => {
      const parent = svgRef.current?.parentElement;
      const h = (parent && parent.offsetHeight) || window.innerHeight;
      if (!height) setHeight(h);
    };
    updateHeight();
    const parent = svgRef.current?.parentElement;
    const observer = new ResizeObserver(updateHeight);
    if (parent) observer.observe(parent);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [height]);

  const isLeft = side === "left";
  const baseX = isLeft ? 0 : curveWidth;
  const controlX = isLeft ? 2 * curveWidth : -curveWidth;

  const bulgedPath = `M${baseX} 0 L${baseX} ${height} Q${controlX} ${height / 2} ${baseX} 0`;
  const straightPath = `M${baseX} 0 L${baseX} ${height} Q${baseX} ${height / 2} ${baseX} 0`;

  const initialPath = open ? bulgedPath : straightPath;
  const animatePath = open
    ? straightPath
    : [straightPath, straightPath, bulgedPath, straightPath];
  const offsetPx = `-${curveWidth - 1}px`;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      stroke="none"
      className={cn(
        "pointer-events-none absolute top-0 z-10 h-full overflow-visible fill-white/85 dark:fill-neutral-950/85",
        className
      )}
      style={{
        width: curveWidth,
        ...(isLeft ? { right: offsetPx } : { left: offsetPx }),
      }}
    >
      {height > 0 ? (
        <motion.path
          key={`${open ? "open" : "closed"}-${height}`}
          d={straightPath}
          initial={{ d: initialPath }}
          animate={{ d: animatePath }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : open
                ? { type: "tween", duration: 1, ease: CURVE_EASE }
                : {
                    type: "tween",
                    duration: 0.8,
                    ease: CURVE_EASE,
                    times: [0, 0.36, 0.52, 1],
                  }
          }
        />
      ) : null}
    </svg>
  );
}

type DrawerDirection = "top" | "bottom" | "left" | "right";

const CurveDrawerContext = React.createContext<{
  open: boolean;
  direction: DrawerDirection;
}>({
  open: false,
  direction: "bottom",
});

export type CurveDrawerProps = React.ComponentProps<
  typeof DrawerPrimitive.Root
> & {
  direction?: DrawerDirection;
};

export function CurveDrawer({
  open: openProp,
  onOpenChange,
  children,
  direction = "bottom",
  modal,
  ...props
}: CurveDrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isOpen = openProp ?? uncontrolledOpen;
  const [vaulOpen, setVaulOpen] = React.useState(isOpen);
  const [visualOpen, setVisualOpen] = React.useState(isOpen);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isSideDrawer = direction === "left" || direction === "right";
  const effectiveModal = modal ?? !isSideDrawer;

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const clearBodyPointerLock = () => {
      if (!effectiveModal && document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    };
    clearBodyPointerLock();
    const raf = requestAnimationFrame(clearBodyPointerLock);
    const t1 = setTimeout(clearBodyPointerLock, 20);
    const t2 = setTimeout(clearBodyPointerLock, 120);

    const observer = new MutationObserver(() => {
      clearBodyPointerLock();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    };
  }, [effectiveModal, isOpen, vaulOpen]);

  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (isOpen) {
      t = setTimeout(() => {
        setVaulOpen(true);
        setVisualOpen(true);
        if (!effectiveModal && typeof document !== "undefined") {
          document.body.style.pointerEvents = "";
        }
      }, 0);
      return () => {
        if (t) clearTimeout(t);
      };
    }

    t = setTimeout(() => {
      setVisualOpen(false);
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = "";
      }
    }, 0);
    closeTimerRef.current = setTimeout(() => {
      setVaulOpen(false);
      closeTimerRef.current = null;
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = "";
      }
    }, 800);

    return () => {
      if (t) clearTimeout(t);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, effectiveModal]);

  return (
    <CurveDrawerContext.Provider value={{ open: visualOpen, direction }}>
      <DrawerPrimitive.Root
        data-slot="curve-drawer"
        direction={direction}
        modal={effectiveModal}
        open={vaulOpen}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          if (openProp === undefined) setUncontrolledOpen(next);
        }}
        {...props}
      >
        {children}
      </DrawerPrimitive.Root>
    </CurveDrawerContext.Provider>
  );
}

export function CurveDrawerTrigger(
  props: React.ComponentProps<typeof DrawerPrimitive.Trigger>
) {
  return <DrawerPrimitive.Trigger data-slot="curve-drawer-trigger" {...props} />;
}

export function CurveDrawerPortal(
  props: React.ComponentProps<typeof DrawerPrimitive.Portal>
) {
  return <DrawerPrimitive.Portal data-slot="curve-drawer-portal" {...props} />;
}

export function CurveDrawerClose(
  props: React.ComponentProps<typeof DrawerPrimitive.Close>
) {
  return <DrawerPrimitive.Close data-slot="curve-drawer-close" {...props} />;
}

export function CurveDrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  const { direction } = React.useContext(CurveDrawerContext);
  const isSideDrawer = direction === "left" || direction === "right";
  if (isSideDrawer) {
    return null;
  }
  return (
    <DrawerPrimitive.Overlay
      data-slot="curve-drawer-overlay"
      className={cn(
        "fixed inset-0 z-[110] bg-black/25 backdrop-blur-xs",
        className
      )}
      {...props}
    />
  );
}

export interface CurveDrawerContentProps
  extends React.ComponentProps<typeof DrawerPrimitive.Content> {
  curveSide?: "left" | "right";
  curveWidth?: number;
}

export function CurveDrawerContent({
  className,
  children,
  curveSide,
  curveWidth = 100,
  style,
  onPointerDownOutside,
  onInteractOutside,
  ...props
}: CurveDrawerContentProps) {
  const { open, direction } = React.useContext(CurveDrawerContext);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const ref = React.useRef<HTMLDivElement | null>(null);

  const effectiveSide =
    curveSide ??
    (direction === "left" || direction === "right" ? direction : undefined);
  const hasSideCurve = effectiveSide === "left" || effectiveSide === "right";
  const offscreenX =
    effectiveSide === "left"
      ? `calc(-100% - ${curveWidth}px)`
      : effectiveSide === "right"
        ? `calc(100% + ${curveWidth}px)`
        : "0";

  return (
    <CurveDrawerPortal data-slot="curve-drawer-portal">
      <CurveDrawerOverlay />
      <DrawerPrimitive.Content
        onPointerDownOutside={(e) => {
          if (hasSideCurve) e.preventDefault();
          onPointerDownOutside?.(e);
        }}
        onInteractOutside={(e) => {
          if (hasSideCurve) e.preventDefault();
          onInteractOutside?.(e);
        }}
        {...props}
        asChild
      >
        <motion.div
          ref={ref}
          data-slot="curve-drawer-content"
          initial={{ x: offscreenX }}
          animate={{
            x: open ? "0" : offscreenX,
            transition: {
              duration: prefersReducedMotion ? 0.01 : 0.8,
              ease: CURVE_EASE,
            },
          }}
          style={{
            ...style,
            animation: "none",
            transition: "none",
            pointerEvents: open ? "auto" : "none",
          }}
          className={cn(
            "group/curve-drawer-content fixed z-[110] flex h-auto flex-col overflow-visible bg-white/82 text-sm text-neutral-900 shadow-2xl backdrop-blur-2xl outline-none dark:bg-neutral-950/82 dark:text-neutral-100",
            "data-[vaul-drawer-direction=left]:top-[66px] data-[vaul-drawer-direction=left]:bottom-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:h-[calc(100vh-66px)] data-[vaul-drawer-direction=left]:w-[92vw] data-[vaul-drawer-direction=left]:max-w-[540px] data-[vaul-drawer-direction=left]:rounded-tr-2xl data-[vaul-drawer-direction=left]:border-t data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:border-neutral-900/15 dark:data-[vaul-drawer-direction=left]:border-white/15",
            "data-[vaul-drawer-direction=right]:top-[66px] data-[vaul-drawer-direction=right]:bottom-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:h-[calc(100vh-66px)] data-[vaul-drawer-direction=right]:w-[94vw] data-[vaul-drawer-direction=right]:max-w-[780px] lg:data-[vaul-drawer-direction=right]:max-w-[840px] data-[vaul-drawer-direction=right]:rounded-tl-2xl data-[vaul-drawer-direction=right]:border-t data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:border-neutral-900/15 dark:data-[vaul-drawer-direction=right]:border-white/15",
            "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t",
            "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b",
            className
          )}
        >
          <div className="relative flex h-full w-full flex-col overflow-visible">
            {children}
            {hasSideCurve && effectiveSide ? (
              <CurveEdge
                curveWidth={curveWidth}
                open={open}
                side={effectiveSide}
              />
            ) : null}
          </div>
        </motion.div>
      </DrawerPrimitive.Content>
    </CurveDrawerPortal>
  );
}

export function CurveDrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="curve-drawer-header"
      className={cn(
        "sticky top-0 z-30 flex flex-col gap-0.5 rounded-t-2xl bg-white/75 p-4 backdrop-blur-xl group-data-[vaul-drawer-direction=bottom]/curve-drawer-content:text-center group-data-[vaul-drawer-direction=top]/curve-drawer-content:text-center md:gap-0.5 md:text-left dark:bg-neutral-950/75",
        className
      )}
      {...props}
    />
  );
}

export function CurveDrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="curve-drawer-title"
      className={cn(
        "text-base font-bold text-neutral-900 dark:text-neutral-100",
        className
      )}
      {...props}
    />
  );
}

export function CurveDrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="curve-drawer-description"
      className={cn(
        "text-xs text-neutral-500 dark:text-neutral-400",
        className
      )}
      {...props}
    />
  );
}
