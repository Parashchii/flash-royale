import { useEffect, useRef, useState } from "react";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";

export function ProfileMenu() {
  const { t } = useLocale();
  const { exportJson } = useProgress();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flash-royale-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-btn"
        aria-label={t("profileMenu")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"
          />
        </svg>
      </button>
      {open ? (
        <div className="profile-popover" role="dialog" aria-label={t("profileMenu")}>
          <p className="profile-status">{t("syncLocal")}</p>
          <button type="button" className="profile-action" onClick={onExport}>
            {t("exportData")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
