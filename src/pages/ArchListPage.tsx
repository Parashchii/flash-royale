import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ARCH_ARTIFACTS, ARCH_REGIONS } from "../data/catalog";
import type { ArchArtifact } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { locAnomaly, locName, locRegion } from "../i18n/localize";
import type { Locale } from "../i18n/messages";
import { FilterCard, FilterChoiceList } from "../components/FilterCard";
import { ListToolbar } from "../components/ListToolbar";

type StatusFilter = "all" | "missing" | "collected";
type ViewMode = "list" | "grid";
type ArchStatus = "missing" | "collected";

const VIEW_STORAGE_KEY = "curiouser-list-view";

function readStoredView(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw === "list" || raw === "grid") return raw;
  } catch {
    /* ignore */
  }
  return "list";
}

function archIconSrc(id: string) {
  return `/arch-artifacts/${id}.png?v=1`;
}

function ArchStatusSelect({
  value,
  artifactName,
  onChange,
}: {
  value: ArchStatus;
  artifactName: string;
  onChange: (status: ArchStatus) => void;
}) {
  const { t } = useLocale();
  return (
    <label className={`mh-status-select status-${value}`}>
      <span className="visually-hidden">{t("artifactStatus")}</span>
      <select
        value={value}
        aria-label={`${t("artifactStatus")}: ${artifactName}`}
        onChange={(e) => onChange(e.target.value as ArchStatus)}
      >
        <option value="missing">{t("statusMissing")}</option>
        <option value="collected">{t("statusCollected")}</option>
      </select>
    </label>
  );
}

function ArchArtifactCard({
  artifact,
  got,
  view,
  locale,
  onStatusChange,
}: {
  artifact: ArchArtifact;
  got: boolean;
  view: ViewMode;
  locale: Locale;
  onStatusChange: (status: ArchStatus) => void;
}) {
  const status: ArchStatus = got ? "collected" : "missing";
  const primary = locName(artifact, locale);
  const secondary = locale === "uk" ? artifact.nameEn : artifact.nameUk;
  const anomaly = locAnomaly(artifact, locale);

  return (
    <li
      className={`mh-artifact mh-art-card mh-artifact-${view} mh-arch-card ${artifact.id} status-${status}`}
    >
      {view === "grid" ? (
        <span className="mh-rarity-tag mh-arch-tag">{anomaly}</span>
      ) : null}
      <div className="mh-artifact-row">
        <span className="mh-artifact-icon-wrap" aria-hidden="true">
          <img
            className="mh-artifact-icon"
            src={archIconSrc(artifact.id)}
            alt=""
            width={view === "grid" ? 160 : 128}
            height={view === "grid" ? 160 : 128}
            loading="lazy"
          />
        </span>
        <span className="mh-artifact-body">
          {view === "list" ? (
            <>
              <span className="mh-artifact-heading">
                <span className="mh-artifact-title">{primary}</span>
                <span className="mh-rarity-tag mh-arch-tag">{anomaly}</span>
              </span>
              <span className="mh-artifact-subtitle">{secondary}</span>
              {artifact.conditionUk ? (
                <span className="mh-artifact-subtitle">{artifact.conditionUk}</span>
              ) : null}
              <ArchStatusSelect
                value={status}
                artifactName={primary}
                onChange={onStatusChange}
              />
            </>
          ) : (
            <>
              <span className="mh-artifact-names">
                <span className="mh-artifact-title">{primary}</span>
                <span className="mh-artifact-subtitle">{secondary}</span>
              </span>
              <ArchStatusSelect
                value={status}
                artifactName={primary}
                onChange={onStatusChange}
              />
            </>
          )}
        </span>
      </div>
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
  const [view, setView] = useState<ViewMode>(() => readStoredView());

  const setViewPersist = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

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

  const statusCounts = useMemo(() => {
    const counts = { missing: 0, collected: 0 };
    const needle = q.trim().toLowerCase();
    for (const a of ARCH_ARTIFACTS) {
      if (region !== "all" && a.region !== region) continue;
      if (needle) {
        const hay =
          `${a.nameUk} ${a.nameEn} ${a.region} ${a.regionEn} ${a.anomalyUk} ${a.anomalyEn} ${a.accessUk}`.toLowerCase();
        if (!hay.includes(needle)) continue;
      }
      if (collectedArchArtifactIds.has(a.id)) counts.collected += 1;
      else counts.missing += 1;
    }
    return counts;
  }, [region, q, collectedArchArtifactIds]);

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
      <header className="page-header mh-list-header mh-list-header-tools">
        <ListToolbar
          search={q}
          onSearch={setQ}
          searchPlaceholder={t("searchGeneric")}
          view={view}
          onView={setViewPersist}
        />
      </header>

      <div className="filter-card-stack">
        <FilterCard title={t("region")}>
          <FilterChoiceList
            label={t("region")}
            value={region}
            variant="chips"
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
              {
                value: "missing",
                label: t("statusMissing"),
                count: statusCounts.missing,
              },
              {
                value: "collected",
                label: t("statusCollected"),
                count: statusCounts.collected,
              },
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
                  onStatusChange={(next) => {
                    const isCollected = collectedArchArtifactIds.has(a.id);
                    if (next === "collected" && !isCollected) {
                      toggleArchArtifact(a.id);
                    } else if (next === "missing" && isCollected) {
                      toggleArchArtifact(a.id);
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      ))}

      {grouped.length === 0 && <p className="hint">{t("noResults")}</p>}
    </div>
  );
}
