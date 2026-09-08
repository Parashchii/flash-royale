import { useEffect, useRef, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";

function SearchGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.5 3a5.5 5.5 0 0 1 4.38 8.82l3.65 3.65-1.06 1.06-3.65-3.65A5.5 5.5 0 1 1 8.5 3zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
      />
    </svg>
  );
}

function ListGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z"
      />
    </svg>
  );
}

function GridGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z"
      />
    </svg>
  );
}

export function CollapsibleSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(value.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const expanded = open || value.length > 0;

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  if (!expanded) {
    return (
      <button
        type="button"
        className="list-search-btn"
        aria-label={t("search")}
        onClick={() => setOpen(true)}
      >
        <SearchGlyph />
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      className="list-search-input"
      type="search"
      value={value}
      placeholder={placeholder}
      aria-label={t("search")}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        if (!value) setOpen(false);
      }}
    />
  );
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: "list" | "grid";
  onChange: (value: "list" | "grid") => void;
}) {
  const { t } = useLocale();
  return (
    <div className="lang-switcher" role="group" aria-label={t("viewToggle")}>
      <button
        type="button"
        className={value === "list" ? "lang-btn active" : "lang-btn"}
        aria-pressed={value === "list"}
        title={t("viewList")}
        onClick={() => onChange("list")}
      >
        <ListGlyph />
        <span className="sr-only">{t("viewList")}</span>
      </button>
      <button
        type="button"
        className={value === "grid" ? "lang-btn active" : "lang-btn"}
        aria-pressed={value === "grid"}
        title={t("viewGrid")}
        onClick={() => onChange("grid")}
      >
        <GridGlyph />
        <span className="sr-only">{t("viewGrid")}</span>
      </button>
    </div>
  );
}

export function ListToolbar({
  search,
  onSearch,
  searchPlaceholder,
  view,
  onView,
}: {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  view?: "list" | "grid";
  onView?: (value: "list" | "grid") => void;
}) {
  return (
    <div className="list-toolbar">
      <CollapsibleSearch
        value={search}
        onChange={onSearch}
        placeholder={searchPlaceholder}
      />
      {view && onView ? <ViewToggle value={view} onChange={onView} /> : null}
    </div>
  );
}
