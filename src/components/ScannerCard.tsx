import { useState } from "react";
import { Link } from "react-router-dom";
import type { Scanner } from "../data/types";
import { useLocale } from "../i18n/LocaleContext";
import { locField, locPoi, locRegion } from "../i18n/localize";

export const SCANNER_ICON = "/scanners/topa-3.png?v=1";

function ArrowUpRight({ size = 12 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 3.5h7.5V11M12.5 3.5 3.5 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScannerCard({
  scanner,
  checked,
  onToggle,
}: {
  scanner: Scanner;
  checked: boolean;
  onToggle: () => void;
}) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const title = locPoi(scanner, locale);
  const artifact = locField(
    scanner.artifactNameUk,
    scanner.artifactNameEn,
    locale,
  );
  const region = locRegion(scanner, locale);
  const hasDetails = Boolean(scanner.accessUk || scanner.notes);

  return (
    <div className="flash-card is-scanner">
      <div className="flash-media">
        <span className="flash-icon-wrap" aria-hidden="true">
          <img
            className="flash-icon"
            src={SCANNER_ICON}
            alt=""
            width={96}
            height={96}
            loading="lazy"
          />
        </span>
        <button
          type="button"
          className={`flash-collected-btn${checked ? " is-on" : ""}`}
          aria-pressed={checked}
          onClick={onToggle}
        >
          {t("statusCollected")}
        </button>
      </div>
      <div className="flash-body">
        <div className="flash-card-head">
          <span className="flash-tags">
            <span className="flash-tag" title={`${t("artifactLabel")}: ${artifact}`}>
              {artifact}
            </span>
            {scanner.conditionUk ? (
              <span className="lock-badge" title={scanner.conditionUk}>
                {scanner.conditionUk}
              </span>
            ) : null}
          </span>
          {hasDetails ? (
            <button
              type="button"
              className="flash-more-btn"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? t("showLess") : t("showMore")}
            </button>
          ) : null}
        </div>

        <span className="flash-title">{title}</span>

        {open ? (
          <div className="flash-details">
            {scanner.accessUk ? (
              <span className="access-hint">{scanner.accessUk}</span>
            ) : null}
            {scanner.notes ? (
              <span className="notes">{scanner.notes}</span>
            ) : null}
          </div>
        ) : null}

        <div className="flash-card-foot">
          <Link
            className="flash-region-btn"
            to={`/scanning-complete?id=${encodeURIComponent(scanner.id)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span>{region}</span>
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
