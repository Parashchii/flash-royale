import type { ReactNode } from "react";
import { ANOMALY_TYPES, type AnomalyType } from "../data/types";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel } from "../i18n/localize";
import { AnomalyTypeIcon } from "./AnomalyTypeIcon";

export function FilterCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className ? `filter-card ${className}` : "filter-card"}>
      {title ? <h3 className="filter-card-title">{title}</h3> : null}
      {children}
    </section>
  );
}

export function FilterChoiceList({
  label,
  value,
  options,
  onChange,
  variant = "stack",
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string; count?: number }[];
  onChange: (value: string) => void;
  variant?: "stack" | "chips";
}) {
  return (
    <ul
      className={
        variant === "chips" ? "filter-chip-row" : "filter-choice-list"
      }
      role="listbox"
      aria-label={label}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <li key={opt.value} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={
                variant === "chips"
                  ? selected
                    ? "filter-chip active"
                    : "filter-chip"
                  : selected
                    ? "active"
                    : undefined
              }
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
              {opt.count != null ? (
                <span className="filter-chip-count">{opt.count}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function AnomalyTypeFilter({
  value,
  onChange,
  embedded = false,
  showTitle = true,
}: {
  value: "all" | AnomalyType;
  onChange: (value: "all" | AnomalyType) => void;
  embedded?: boolean;
  showTitle?: boolean;
}) {
  const { t, locale } = useLocale();
  const list = (
      <ul
        className="filter-chip-row"
        role="listbox"
        aria-label={t("anomalyType")}
      >
        <li role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={value === "all"}
            className={value === "all" ? "filter-chip active" : "filter-chip"}
            onClick={() => onChange("all")}
          >
            {t("statusAll")}
          </button>
        </li>
        {ANOMALY_TYPES.map((type) => {
          const selected = value === type;
          const label = anomalyTypeLabel(type, locale);
          return (
            <li key={type} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={`filter-chip filter-chip-type filter-chip-${type}${selected ? " active" : ""}`}
                onClick={() => onChange(type)}
              >
                <span
                  className={`mh-marker mh-marker-type mh-marker-${type} mh-marker-worth filter-type-swatch`}
                >
                  <AnomalyTypeIcon type={type} size={16} color="#fff8ef" />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
  );

  const heading = showTitle ? (
    <h3 className="filter-card-title">{t("anomalyType")}</h3>
  ) : null;

  if (embedded || !showTitle) {
    return (
      <div className={embedded ? "anomaly-type-filter-embedded" : undefined}>
        {heading}
        {list}
      </div>
    );
  }

  return <FilterCard title={t("anomalyType")}>{list}</FilterCard>;
}
