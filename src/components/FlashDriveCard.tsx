import { useState } from "react";
import { Link } from "react-router-dom";
import type { FlashDrive } from "../data/types";
import { useLocale } from "../i18n/LocaleContext";
import { locField, locRegion } from "../i18n/localize";

export const FLASH_DRIVE_ICON = "/flashdrives/usb-upgrade.png?v=1";

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

export function FlashDriveCard({
  flash,
  title,
  checked,
  onToggle,
  alts,
  spoilers = false,
  compact = false,
  lockedMissed = false,
}: {
  flash: FlashDrive;
  title: string;
  checked: boolean;
  onToggle: () => void;
  alts?: FlashDrive[];
  spoilers?: boolean;
  compact?: boolean;
  lockedMissed?: boolean;
}) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const locations = alts && alts.length > 0 ? alts : [flash];
  const questAlt = locations.find((a) => a.questOnly);
  const noteText = questAlt?.notes ?? flash.notes;
  const accessItems = locations.filter((a) => a.accessUk);
  const hasDetails = Boolean(
    accessItems.length ||
      flash.lock?.summaryUk ||
      (spoilers && flash.lock?.detailUk) ||
      noteText ||
      lockedMissed,
  );
  const lockLabel = flash.lock
    ? `${t("statusLocked")}${
        flash.lock.questUk
          ? ` · ${locField(flash.lock.questUk, flash.lock.questEn, locale)}`
          : ""
      }`
    : "";

  return (
    <div className={`flash-card${compact ? " compact" : ""}`}>
      <div className="flash-media">
        <span className="flash-icon-wrap" aria-hidden="true">
          <img
            className="flash-icon"
            src={FLASH_DRIVE_ICON}
            alt=""
            width={compact ? 72 : 96}
            height={compact ? 72 : 96}
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
          {flash.lock || questAlt ? (
            <span className="flash-tags">
              {flash.lock ? (
                <span className="lock-badge" title={lockLabel}>
                  {lockLabel}
                </span>
              ) : null}
              {questAlt ? (
                <span className="quest-only-badge" title={t("questOnlyBadge")}>
                  {t("questOnlyBadge")}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="flash-tags" />
          )}
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
            {accessItems.map((a) => (
              <span key={`${a.id}-access`} className="access-hint">
                {locations.length > 1 ? `${locRegion(a, locale)}: ` : ""}
                {a.accessUk}
              </span>
            ))}
            {flash.lock ? (
              <span className="lock-summary">{flash.lock.summaryUk}</span>
            ) : null}
            {flash.lock && spoilers ? (
              <span className="lock-detail">{flash.lock.detailUk}</span>
            ) : null}
            {lockedMissed ? (
              <span className="ps5-miss">{t("lockedMissedNote")}</span>
            ) : null}
            {noteText ? (
              <span className="notes">
                {noteText}
                {questAlt ? (
                  <span className="platform-tags">
                    <span className="platform-tag platform-ok">
                      {t("platformOkPrefix")} {t("verifyDate")},{" "}
                      {t("platformOkPatch")} 1.010
                    </span>
                    <span className="platform-tag platform-unverified">
                      {t("platformPcNo")}
                    </span>
                    <span className="platform-tag platform-unverified">
                      {t("platformXboxNo")}
                    </span>
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flash-card-foot">
          {locations.map((a) => {
            const region = locRegion(a, locale);
            return (
              <Link
                key={a.id}
                className="flash-region-btn"
                to={`/flash-royale?id=${encodeURIComponent(a.id)}`}
                onClick={(e) => e.stopPropagation()}
              >
                <span>{region}</span>
                <ArrowUpRight />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
