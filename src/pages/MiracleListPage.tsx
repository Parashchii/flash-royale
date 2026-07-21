import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ARTIFACTS,
  TOTAL_ARTIFACTS,
  artifactTypeProgress,
} from "../data/catalog";
import {
  ANOMALY_TYPES,
  type AnomalyType,
  type Artifact,
  type ArtifactRarity,
  type ArtifactStatus,
} from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel, locName } from "../i18n/localize";
import type { Locale } from "../i18n/messages";
import { AnomalyTypeIcon } from "../components/AnomalyTypeIcon";

type StatusFilter = "all" | ArtifactStatus;
type ViewMode = "list" | "grid";

const VIEW_STORAGE_KEY = "miracle-hoarder-list-view";

const STATUS_OPTIONS: ArtifactStatus[] = ["missing", "found", "present"];

const RARITY_ORDER: ArtifactRarity[] = [
  "common",
  "uncommon",
  "rare",
  "legendary",
];

function rarityRank(rarity: ArtifactRarity | undefined) {
  if (!rarity) return RARITY_ORDER.length;
  const idx = RARITY_ORDER.indexOf(rarity);
  return idx === -1 ? RARITY_ORDER.length : idx;
}

function sortByRarity(items: Artifact[]) {
  return [...items].sort((a, b) => {
    const byRarity = rarityRank(a.rarity) - rarityRank(b.rarity);
    if (byRarity !== 0) return byRarity;
    return a.nameEn.localeCompare(b.nameEn);
  });
}

function readStoredView(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw === "list" || raw === "grid") return raw;
  } catch {
    /* ignore */
  }
  return "list";
}

function artifactIconSrc(id: string) {
  return `/artifacts/${id}.png?v=2`;
}

function StatusPicker({
  value,
  artifactName,
  onChange,
}: {
  value: ArtifactStatus;
  artifactName: string;
  onChange: (status: ArtifactStatus) => void;
}) {
  const { t } = useLocale();
  const labels: Record<ArtifactStatus, string> = {
    missing: t("artifactAbsent"),
    found: t("artifactFound"),
    present: t("artifactPresent"),
  };
  return (
    <div
      className="mh-status-picks mh-status-picks-list"
      role="group"
      aria-label={`${t("artifactStatus")}: ${artifactName}`}
    >
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className={`mh-status-pick status-${option}${value === option ? " active" : ""}`}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

function StatusSelect({
  value,
  artifactName,
  onChange,
}: {
  value: ArtifactStatus;
  artifactName: string;
  onChange: (status: ArtifactStatus) => void;
}) {
  const { t } = useLocale();
  return (
    <label className={`mh-status-select status-${value}`}>
      <span className="visually-hidden">{t("artifactStatus")}</span>
      <select
        value={value}
        aria-label={`${t("artifactStatus")}: ${artifactName}`}
        onChange={(e) => onChange(e.target.value as ArtifactStatus)}
      >
        <option value="missing">{t("artifactAbsent")}</option>
        <option value="found">{t("artifactFound")}</option>
        <option value="present">{t("artifactPresent")}</option>
      </select>
    </label>
  );
}

function ArtifactCard({
  artifact,
  status,
  view,
  locale,
  onStatusChange,
}: {
  artifact: Artifact;
  status: ArtifactStatus;
  view: ViewMode;
  locale: Locale;
  onStatusChange: (status: ArtifactStatus) => void;
}) {
  const primary = locName(artifact, locale);
  const secondary = locale === "uk" ? artifact.nameEn : artifact.nameUk;
  const rarity = artifact.rarity as ArtifactRarity | undefined;

  return (
    <li
      className={`mh-artifact mh-artifact-${view} mh-type-${artifact.anomalyType} status-${status}`}
    >
      {rarity ? (
        <span className={`mh-rarity-tag mh-rarity-${rarity}`}>{rarity}</span>
      ) : null}
      <div className="mh-artifact-row">
        <span className="mh-artifact-icon-wrap" aria-hidden="true">
          <img
            className="mh-artifact-icon"
            src={artifactIconSrc(artifact.id)}
            alt=""
            width={view === "grid" ? 160 : 88}
            height={view === "grid" ? 160 : 88}
            loading="lazy"
          />
        </span>
        <span className="mh-artifact-body">
          <span className="mh-artifact-names">
            <span className="mh-artifact-title">{primary}</span>
            <span className="mh-artifact-subtitle">{secondary}</span>
          </span>
          {view === "grid" ? (
            <StatusSelect
              value={status}
              artifactName={primary}
              onChange={onStatusChange}
            />
          ) : null}
        </span>
        {view === "list" ? (
          <StatusPicker
            value={status}
            artifactName={primary}
            onChange={onStatusChange}
          />
        ) : null}
      </div>
    </li>
  );
}

export function MiracleListPage() {
  const { t, locale } = useLocale();
  const { collectedArtifactIds, getArtifactStatus, setArtifactStatus } =
    useProgress();
  const [params] = useSearchParams();
  const typeParam = params.get("type");
  const initialType =
    typeParam && ANOMALY_TYPES.includes(typeParam as AnomalyType)
      ? (typeParam as AnomalyType | "all")
      : "all";

  const [anomalyType, setAnomalyType] = useState<"all" | AnomalyType>(
    initialType,
  );
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [view, setView] = useState<ViewMode>(() => readStoredView());

  const setViewPersist = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const typeProgress = useMemo(
    () => artifactTypeProgress(collectedArtifactIds),
    [collectedArtifactIds],
  );

  const filtered = useMemo(() => {
    return ARTIFACTS.filter((a) => {
      if (anomalyType !== "all" && a.anomalyType !== anomalyType) return false;
      const st = getArtifactStatus(a.id);
      if (status !== "all" && st !== status) return false;
      if (q.trim()) {
        const hay =
          `${a.nameUk} ${a.nameEn} ${anomalyTypeLabel(a.anomalyType, "uk")} ${anomalyTypeLabel(a.anomalyType, "en")}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [anomalyType, status, q, getArtifactStatus]);

  const grouped = useMemo(() => {
    return ANOMALY_TYPES.map((type) => ({
      type,
      items: sortByRarity(filtered.filter((a) => a.anomalyType === type)),
      progress: typeProgress[type],
    })).filter((g) => g.items.length > 0 || anomalyType === g.type);
  }, [filtered, typeProgress, anomalyType]);

  return (
    <div className="page">
      <header className="page-header mh-list-header">
        <div>
          <h1>{t("listTitle")}</h1>
          <p>
            {collectedArtifactIds.size} / {TOTAL_ARTIFACTS} · {t("listShowing")}{" "}
            {filtered.length}
          </p>
        </div>
        <div className="mh-view-toggle" role="group" aria-label={t("viewToggle")}>
          <button
            type="button"
            className={view === "list" ? "active" : undefined}
            aria-pressed={view === "list"}
            title={t("viewList")}
            onClick={() => setViewPersist("list")}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z"
              />
            </svg>
            <span>{t("viewList")}</span>
          </button>
          <button
            type="button"
            className={view === "grid" ? "active" : undefined}
            aria-pressed={view === "grid"}
            title={t("viewGrid")}
            onClick={() => setViewPersist("grid")}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z"
              />
            </svg>
            <span>{t("viewGrid")}</span>
          </button>
        </div>
      </header>

      <div className="filters sticky-filters">
        <label>
          {t("search")}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchArtifact")}
          />
        </label>
        <label>
          {t("anomalyType")}
          <select
            value={anomalyType}
            onChange={(e) =>
              setAnomalyType(e.target.value as typeof anomalyType)
            }
          >
            <option value="all">{t("statusAll")}</option>
            {ANOMALY_TYPES.map((type) => (
              <option key={type} value={type}>
                {anomalyTypeLabel(type, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("status")}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="all">{t("statusAll")}</option>
            <option value="missing">{t("artifactAbsent")}</option>
            <option value="found">{t("artifactFound")}</option>
            <option value="present">{t("artifactPresent")}</option>
          </select>
        </label>
      </div>

      {grouped.map(({ type, items, progress }) => (
        <section
          key={type}
          className={`overview-section mh-section mh-section-${type}`}
          aria-labelledby={`type-${type}`}
        >
          <div className="mh-type-header">
            <div className="mh-type-heading">
              <h2 id={`type-${type}`}>
                <AnomalyTypeIcon type={type} size={44} onColorBg />
                <span>{anomalyTypeLabel(type, locale)}</span>
              </h2>
              <p className="mh-type-meta">
                {progress.got}/{progress.total} {t("collectedOf")}
              </p>
            </div>
            <Link
              className="btn mh-map-btn"
              to={`/miracle-hoarder?type=${type}`}
            >
              {t("seeMap")}
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="hint">{t("noResults")}</p>
          ) : (
            <ul className={`mh-artifact-list mh-artifact-list-${view}`}>
              {items.map((a) => (
                <ArtifactCard
                  key={a.id}
                  artifact={a}
                  status={getArtifactStatus(a.id)}
                  view={view}
                  locale={locale}
                  onStatusChange={(next) => setArtifactStatus(a.id, next)}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
