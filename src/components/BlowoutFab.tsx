import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../i18n/LocaleContext";

export function BlowoutFab({ onConfirm }: { onConfirm: () => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const confirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <div className="blowout-fab-wrap">
      <button
        type="button"
        className="blowout-fab"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {t("blowoutFab")}
      </button>
      {open
        ? createPortal(
            <div
              className="mh-modal-backdrop"
              onClick={() => setOpen(false)}
              role="presentation"
            >
              <div
                className="mh-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="sheet-close"
                  onClick={() => setOpen(false)}
                  aria-label={t("close")}
                >
                  ×
                </button>
                <h2 id={titleId}>{t("blowoutModalTitle")}</h2>
                <p>{t("blowoutModalBody")}</p>
                <button type="button" className="btn btn-danger" onClick={confirm}>
                  {t("blowoutConfirm")}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
