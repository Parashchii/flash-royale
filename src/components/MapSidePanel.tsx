import {
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  clampDrawerWidth,
  defaultDrawerWidth,
  useMapDrawer,
} from "../hooks/useMapDrawer";
import { useLocale } from "../i18n/LocaleContext";

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm9.07 6.34-1.2-1.18-4.4 4.48-1.72-1.72-1.18 1.2 2.9 2.9 5.6-5.68z"
      />
    </svg>
  );
}

/** SF Symbol-style point.bottomleft.forward.to.point.topright.scurve */
function PathGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="18.2" r="2.05" />
        <path d="M8.2 18.2h2.7c2.55 0 3.05-1.72 1.15-2.88-1.85-1.12-2.8-1.8-2.8-3.52 0-2.18 2.5-3.4 6.45-3.4H17.6" />
        <path d="M14.55 5.25 17.95 8.05l-3.4 2.8" />
      </g>
    </svg>
  );
}

function pingMap() {
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
}

export function MapSidePanel({
  title,
  children,
  headerExtra,
  side = "left",
  icon = "burger",
}: {
  title: string;
  children: ReactNode;
  headerExtra?: ReactNode;
  side?: "left" | "right";
  icon?: "burger" | "check";
}) {
  const { t } = useLocale();
  const drawer = useMapDrawer();
  const [localOpen, setLocalOpen] = useState(false);
  const isRight = side === "right";
  const open = isRight
    ? (drawer?.checkOpen ?? localOpen)
    : (drawer?.open ?? localOpen);
  const setOpen = isRight
    ? (drawer?.setCheckOpen ?? setLocalOpen)
    : (drawer?.setOpen ?? setLocalOpen);
  const fallbackW = defaultDrawerWidth();
  const width = isRight
    ? (drawer?.rightWidth ?? fallbackW)
    : (drawer?.leftWidth ?? fallbackW);
  const setWidth = isRight ? drawer?.setRightWidth : drawer?.setLeftWidth;
  const otherOpen = isRight ? (drawer?.open ?? false) : (drawer?.checkOpen ?? false);
  const otherWidth = isRight
    ? (drawer?.leftWidth ?? fallbackW)
    : (drawer?.rightWidth ?? fallbackW);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const [host, setHost] = useState<Element | null>(null);

  useLayoutEffect(() => {
    setHost(btnRef.current?.closest(".map-page") ?? null);
  }, []);

  useLayoutEffect(() => {
    pingMap();
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      pingMap();
    };
  }, [open, setOpen]);

  useLayoutEffect(() => {
    if (!host) return;
    const el = host as HTMLElement;
    const prop = isRight ? "--drawer-w-right" : "--drawer-w-left";
    if (open) el.style.setProperty(prop, `${width}px`);
    else el.style.removeProperty(prop);
    return () => {
      el.style.removeProperty(prop);
    };
  }, [host, open, width, isRight]);

  const onResizePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!setWidth) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startW: width };
    document.documentElement.classList.add("is-drawer-resizing");
  };

  const onResizePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!setWidth || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const next = isRight
      ? dragRef.current.startW - dx
      : dragRef.current.startW + dx;
    setWidth(clampDrawerWidth(next, otherOpen, otherWidth));
    pingMap();
  };

  const onResizePointerUp = () => {
    dragRef.current = null;
    document.documentElement.classList.remove("is-drawer-resizing");
    pingMap();
  };

  const drawerNode =
    open && host
      ? createPortal(
          <aside
            id={panelId}
            className={isRight ? "map-drawer map-drawer-right" : "map-drawer"}
            role="dialog"
            aria-labelledby={`${panelId}-title`}
            style={{ ["--drawer-w" as string]: `${width}px` }}
          >
            <div
              className="map-drawer-resize"
              role="separator"
              aria-orientation="vertical"
              aria-label={title}
              onPointerDown={onResizePointerDown}
              onPointerMove={onResizePointerMove}
              onPointerUp={onResizePointerUp}
              onPointerCancel={onResizePointerUp}
            />
            <div
              className={
                headerExtra
                  ? "map-drawer-head map-drawer-head-stacked"
                  : "map-drawer-head"
              }
            >
              <div className="map-drawer-head-row">
                <span className="map-drawer-head-spacer" aria-hidden="true" />
                <h2 id={`${panelId}-title`}>{title}</h2>
                <button
                  type="button"
                  className="sheet-close"
                  onClick={() => setOpen(false)}
                  aria-label={t("close")}
                >
                  ×
                </button>
              </div>
              {headerExtra}
            </div>
            <div className="map-drawer-scroll">
              <div className="map-drawer-body">{children}</div>
            </div>
          </aside>,
          host,
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={open ? "map-burger open" : "map-burger"}
        aria-label={title}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {icon === "check" ? <CheckGlyph /> : <PathGlyph />}
        <span className="map-burger-label">{title}</span>
      </button>
      {drawerNode}
    </>
  );
}
