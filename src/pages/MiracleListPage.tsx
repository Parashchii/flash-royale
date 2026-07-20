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
} from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel, locName } from "../i18n/localize";
import type { Locale } from "../i18n/messages";

type StatusFilter = "all" | "missing" | "collected";
type ViewMode = "list" | "grid";

function artifactIconSrc(id: string) {
  return `/artifacts/${id}.png?v=2`;
}

function ArtifactCard({
  artifact,
  got,
  view,
  locale,
  onToggle,
}: {
  artifact: Artifact;
  got: boolean;
  view: ViewMode;
  locale: Locale;
  onToggle: () => void;
}) {
  const primary = locName(artifact, locale);
  const secondary = locale === "uk" ? artifact.nameEn : artifact.nameUk;
  return (
    <li
      className={`mh-artifact mh-artifact-${view} mh-type-${artifact.anomalyType} status-${got ? "collected" : "missing"}`}
    >
      <label className="mh-artifact-check">
        <input type="checkbox" checked={got} onChange={onToggle} />
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
          <span className="mh-artifact-title">{primary}</span>
          <span className="mh-artifact-meta">
            {secondary}
            {artifact.rarity ? ` · ${artifact.rarity}` : ""}
          </span>
        </span>
      </label>
    </li>
  );
}

export function MiracleListPage() {
  const { t, locale } = useLocale();
  const { collectedArtifactIds, toggleArtifact } = useProgress();
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
  const [view, setView] = useState<ViewMode>("list");

  const typeProgress = useMemo(
    () => artifactTypeProgress(collectedArtifactIds),
    [collectedArtifactIds],
  );

  const filtered = useMemo(() => {
    return ARTIFACTS.filter((a) => {
      if (anomalyType !== "all" && a.anomalyType !== anomalyType) return false;
      const got = collectedArtifactIds.has(a.id);
      if (status === "missing" && got) return false;
      if (status === "collected" && !got) return false;
      if (q.trim()) {
        const hay =
          `${a.nameUk} ${a.nameEn} ${anomalyTypeLabel(a.anomalyType, "uk")} ${anomalyTypeLabel(a.anomalyType, "en")}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [anomalyType, status, q, collectedArtifactIds]);

  const grouped = useMemo(() => {
    return ANOMALY_TYPES.map((type) => ({
      type,
      items: filtered.filter((a) => a.anomalyType === type),
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
            onClick={() => setView("list")}
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
            onClick={() => setView("grid")}
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
            <option value="missing">{t("statusMissing")}</option>
            <option value="collected">{t("statusCollected")}</option>
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
              <h2 id={`type-${type}`}>{anomalyTypeLabel(type, locale)}</h2>
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
                  got={collectedArtifactIds.has(a.id)}
                  view={view}
                  locale={locale}
                  onToggle={() => toggleArtifact(a.id)}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
