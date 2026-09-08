import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { FilterCard, FilterChoiceList } from "../components/FilterCard";
import { ListToolbar } from "../components/ListToolbar";

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
        <p>
          {collectedArchArtifactIds.size} / {TOTAL_ARCH_ARTIFACTS} ·{" "}
          {t("listShowing")} {filtered.length}
        </p>
        <ListToolbar
          search={q}
          onSearch={setQ}
          searchPlaceholder={t("searchGeneric")}
          view={view}
          onView={setView}
        />
      </header>

      <div className="filter-card-stack">
        <FilterCard title={t("region")}>
          <FilterChoiceList
            label={t("region")}
            value={region}
            onChange={setRegion}
            options={[
              { value: "all", label: t("statusAll") },
              ...ARCH_REGIONS.map((r) => {
                const sample = ARCH_ARTIFACTS.find((a) => a.region === r);
                return {
                  value: r,
                  label: sample ? locRegion(sample, locale) : r,
                };
              }),
            ]}
          />
        </FilterCard>
        <FilterCard title={t("status")}>
          <FilterChoiceList
            label={t("status")}
            value={status}
            variant="chips"
            onChange={(next) => setStatus(next as StatusFilter)}
            options={[
              { value: "all", label: t("statusAll") },
              { value: "missing", label: t("statusMissing") },
              { value: "collected", label: t("statusCollected") },
            ]}
          />
        </FilterCard>
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
