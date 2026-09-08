import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLocale } from "../i18n/LocaleContext";

export function GuaranteeFab({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="guarantee-fab-wrap">
      <button
        ref={btnRef}
        type="button"
        className={open ? "guarantee-fab open" : "guarantee-fab"}
        aria-label={title}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        !
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className="guarantee-popover"
          role="dialog"
          aria-labelledby={`${panelId}-title`}
        >
          <div className="guarantee-popover-head">
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
          {children}
        </div>
      ) : null}
    </div>
  );
}
