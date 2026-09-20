import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import type { AnomalyField } from "../data/types";
import { useLocale } from "../i18n/LocaleContext";
import { locName } from "../i18n/localize";
import { AnomalyTypeIcon } from "./AnomalyTypeIcon";

export function AnomalyFieldPopup({
  field,
  onFound,
  onClose,
}: {
  field: AnomalyField;
  onFound: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        onFound();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onFound]);

  const name = locName(field, locale);
  const body = t("foundArtifactBtn");

  return createPortal(
    <div
      className="mh-field-popup-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mh-field-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mh-stalker-paper">
          <div className="mh-stalker-paper-content">
            <h2 id={titleId}>{name}</h2>
            <div className="mh-stalker-rule">
              <span className="mh-stalker-rule-line" />
              <AnomalyTypeIcon type={field.anomalyType} size={22} color="#1c1814" />
              <span className="mh-stalker-rule-line" />
            </div>
            <p>{body}</p>
          </div>
        </div>

        <div className="mh-stalker-actions">
          <button type="button" className="mh-stalker-action" onClick={onClose}>
            <kbd>Esc</kbd>
            <span>{t("dialogCancel")}</span>
          </button>
          <button type="button" className="mh-stalker-action" onClick={onFound}>
            <kbd>F</kbd>
            <span>{t("dialogAccept")}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
