import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ARCH_ARTIFACTS,
  ARCH_REGIONS,
  TOTAL_ARCH_ARTIFACTS,
} from "../data/catalog";
import type { ArchArtifact } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { locAnomaly, locName, locRegion } from "../i18n/localize";
import type { Locale } from "../i18n/messages";

type StatusFilter = "all" | "missing" | "collected";
type ViewMode = "list" | "grid";

function archIconSrc(id: string) {
  return `/arch-artifacts/${id}.png?v=1`;
}

function ArchArtifactCard({
  artifact,
  got,
  view,
  locale,
  onToggle,
}: {
  artifact: ArchArtifact;
  got: boolean;
  view: ViewMode;
  locale: Locale;
  onToggle: () => void;
}) {
  const primary = locName(artifact, locale);
  const secondary = locale === "uk" ? artifact.nameEn : artifact.nameUk;
  return (
    <li
      className={`mh-artifact mh-artifact-${view} status-${got ? "collected" : "missing"}`}
    >
      <label className="mh-artifact-check">
        <input type="checkbox" checked={got} onChange={onToggle} />
        <span className="mh-artifact-icon-wrap" aria-hidden="true">
          <img
            className="mh-artifact-icon"
            src={archIconSrc(artifact.id)}
            alt=""
            width={view === "grid" ? 160 : 88}
            height={view === "grid" ? 160 : 88}
            loading="lazy"
          />
        </span>
        <span className="mh-artifact-body">
          <span className="mh-artifact-title">{primary}</span>
          <span className="mh-artifact-meta">
            {secondary} · {locAnomaly(artifact, locale)}
            {artifact.conditionUk ? ` · ${artifact.conditionUk}` : ""}
          </span>
        </span>
      </label>
    </li>
  );
}

export function ArchListPage() {
  const { t, locale } = useLocale();
  const { collectedArchArtifactIds, toggleArchArtifact } = useProgress();
  const [params] = useSearchParams();

  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [view, setView] = useState<ViewMode>("list");

  const filtered = useMemo(() => {
    return ARCH_ARTIFACTS.filter((a) => {
      if (region !== "all" && a.region !== region) return false;
      const got = collectedArchArtifactIds.has(a.id);
      if (status === "missing" && got) return false;
      if (status === "collected" && !got) return false;
      if (q.trim()) {
        const hay =
          `${a.nameUk} ${a.nameEn} ${a.region} ${a.regionEn} ${a.anomalyUk} ${a.anomalyEn} ${a.accessUk}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [region, status, q, collectedArchArtifactIds]);

  const grouped = useMemo(() => {
    return ARCH_REGIONS.map((reg) => {
      const sample = ARCH_ARTIFACTS.find((a) => a.region === reg);
      return {
        region: reg,
        regionLabel: sample ? locRegion(sample, locale) : reg,
        items: filtered.filter((a) => a.region === reg),
        got: ARCH_ARTIFACTS.filter(
          (a) => a.region === reg && collectedArchArtifactIds.has(a.id),
        ).length,
        total: ARCH_ARTIFACTS.filter((a) => a.region === reg).length,
      };
    }).filter((g) => g.items.length > 0 || region === g.region);
  }, [filtered, region, collectedArchArtifactIds, locale]);

  return (
    <div className="page">
      <header className="page-header mh-list-header">
        <div>
          <h1>{t("listTitle")}</h1>
          <p>
            {collectedArchArtifactIds.size} / {TOTAL_ARCH_ARTIFACTS} ·{" "}
            {t("listShowing")} {filtered.length}
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
            placeholder={t("searchGeneric")}
          />
        </label>
        <label>
          {t("region")}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="all">{t("statusAll")}</option>
            {ARCH_REGIONS.map((r) => {
              const sample = ARCH_ARTIFACTS.find((a) => a.region === r);
              return (
                <option key={r} value={r}>
                  {sample ? locRegion(sample, locale) : r}
                </option>
              );
            })}
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

      {grouped.map(({ region: reg, regionLabel, items, got, total }) => (
        <section
          key={reg}
          className="overview-section mh-section"
          aria-labelledby={`region-${reg}`}
        >
          <div className="mh-type-header">
            <div className="mh-type-heading">
              <h2 id={`region-${reg}`}>{regionLabel}</h2>
              <p className="mh-type-meta">
                {got}/{total} {t("collectedOf")}
              </p>
            </div>
            <Link className="btn mh-map-btn" to="/curiouser-curiouser">
              {t("seeMap")}
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="hint">{t("noResults")}</p>
          ) : (
            <ul className={`mh-artifact-list mh-artifact-list-${view}`}>
              {items.map((a) => (
                <ArchArtifactCard
                  key={a.id}
                  artifact={a}
                  got={collectedArchArtifactIds.has(a.id)}
                  view={view}
                  locale={locale}
                  onToggle={() => toggleArchArtifact(a.id)}
                />
              ))}
            </ul>
          )}
        </section>
      ))}

      {grouped.length === 0 && (
        <p className="hint">{t("noResults")}</p>
      )}
    </div>
  );
}
