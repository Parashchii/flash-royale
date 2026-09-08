import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ARTIFACTS,
  artifactTypeProgress,
  trackedArtifactIds,
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
import type { Locale, MessageKey } from "../i18n/messages";
import { AnomalyTypeIcon } from "../components/AnomalyTypeIcon";
import { AnomalyTypeFilter, FilterCard, FilterChoiceList } from "../components/FilterCard";
import { ListToolbar } from "../components/ListToolbar";

type StatusFilter = "all" | ArtifactStatus;
type ViewMode = "list" | "grid";

const VIEW_STORAGE_KEY = "miracle-hoarder-list-view";

const RARITY_ORDER: ArtifactRarity[] = [
  "common",
  "uncommon",
  "rare",
  "legendary",
];

const RARITY_LABEL: Record<ArtifactRarity, MessageKey> = {
  common: "rarityCommon",
  uncommon: "rarityUncommon",
  rare: "rarityRare",
  legendary: "rarityLegendary",
};

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
  const { t } = useLocale();
  const primary = locName(artifact, locale);
  const secondary = locale === "uk" ? artifact.nameEn : artifact.nameUk;
  const rarity = artifact.rarity as ArtifactRarity | undefined;

  return (
    <li
      className={`mh-artifact mh-art-card mh-artifact-${view} mh-type-${artifact.anomalyType} status-${status}`}
    >
      {view === "grid" && rarity ? (
        <span className={`mh-rarity-tag mh-rarity-${rarity}`}>
          {t(RARITY_LABEL[rarity])}
        </span>
      ) : null}
      <div className="mh-artifact-row">
        <span className="mh-artifact-icon-wrap" aria-hidden="true">
          <img
            className="mh-artifact-icon"
            src={artifactIconSrc(artifact.id)}
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
                {rarity ? (
                  <span className={`mh-rarity-tag mh-rarity-${rarity}`}>
                    {t(RARITY_LABEL[rarity])}
                  </span>
                ) : null}
              </span>
              <span className="mh-artifact-subtitle">{secondary}</span>
              <StatusSelect
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
              <StatusSelect
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

export function MiracleListPage() {
  const { t, locale } = useLocale();
  const { collectedArtifactIds, foundArtifactIds, getArtifactStatus, setArtifactStatus } =
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

  const trackedIds = useMemo(
    () => trackedArtifactIds(collectedArtifactIds, foundArtifactIds),
    [collectedArtifactIds, foundArtifactIds],
  );
  const typeProgress = useMemo(
    () => artifactTypeProgress(trackedIds),
    [trackedIds],
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

  const statusCounts = useMemo(() => {
    const counts = { missing: 0, found: 0, present: 0 };
    const needle = q.trim().toLowerCase();
    for (const a of ARTIFACTS) {
      if (anomalyType !== "all" && a.anomalyType !== anomalyType) continue;
      if (needle) {
        const hay =
          `${a.nameUk} ${a.nameEn} ${anomalyTypeLabel(a.anomalyType, "uk")} ${anomalyTypeLabel(a.anomalyType, "en")}`.toLowerCase();
        if (!hay.includes(needle)) continue;
      }
      counts[getArtifactStatus(a.id)] += 1;
    }
    return counts;
  }, [anomalyType, q, getArtifactStatus]);

  const grouped = useMemo(() => {
    return ANOMALY_TYPES.map((type) => ({
      type,
      items: sortByRarity(filtered.filter((a) => a.anomalyType === type)),
      progress: typeProgress[type],
    })).filter((g) => g.items.length > 0 || anomalyType === g.type);
  }, [filtered, typeProgress, anomalyType]);

  return (
    <div className="page">
      <header className="page-header mh-list-header mh-list-header-tools">
        <ListToolbar
          search={q}
          onSearch={setQ}
          searchPlaceholder={t("searchArtifact")}
          view={view}
          onView={setViewPersist}
        />
      </header>

      <div className="filter-card-stack">
        <FilterCard className="filter-card-combined">
          <AnomalyTypeFilter
            value={anomalyType}
            onChange={setAnomalyType}
            showTitle={false}
          />
          <div className="filter-stack-divider" role="separator" />
          <FilterChoiceList
            label={t("status")}
            value={status}
            variant="chips"
            onChange={(next) => setStatus(next as StatusFilter)}
            options={[
              { value: "all", label: t("statusAll") },
              {
                value: "missing",
                label: t("artifactAbsent"),
                count: statusCounts.missing,
              },
              {
                value: "found",
                label: t("artifactFound"),
                count: statusCounts.found,
              },
              {
                value: "present",
                label: t("artifactPresent"),
                count: statusCounts.present,
              },
            ]}
          />
        </FilterCard>
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
                <AnomalyTypeIcon type={type} size={37} onColorBg />
                <span>{anomalyTypeLabel(type, locale)}</span>
              </h2>
              <p className="mh-type-meta">
                {progress.got}/{progress.total} {t("collectedOf")}
              </p>
            </div>
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
