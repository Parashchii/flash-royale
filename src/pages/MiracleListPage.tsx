import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ARTIFACTS,
  artifactTypeProgress,
  trackedArtifactIds,
} from "../data/catalog";
import {
  ANOMALY_TYPES,
  type Artifact,
  type ArtifactRarity,
} from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel } from "../i18n/localize";
import { AnomalyTypeProgressMark } from "../components/AnomalyTypeIcon";
import { ListToolbar } from "../components/ListToolbar";
import { MiracleArtifactShelf } from "../components/MiracleArtifactShelf";

type ViewMode = "list" | "grid";

const VIEW_STORAGE_KEY = "miracle-hoarder-list-view";

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

export function MiracleListPage() {
  const { t, locale } = useLocale();
  const { collectedArtifactIds, foundArtifactIds, getArtifactStatus, setArtifactStatus } =
    useProgress();
  const [params] = useSearchParams();
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
    const needle = q.trim().toLowerCase();
    if (!needle) return ARTIFACTS;
    return ARTIFACTS.filter((a) => {
      const hay =
        `${a.nameUk} ${a.nameEn} ${anomalyTypeLabel(a.anomalyType, "uk")} ${anomalyTypeLabel(a.anomalyType, "en")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q]);

  const grouped = useMemo(() => {
    return ANOMALY_TYPES.map((type) => ({
      type,
      items: sortByRarity(filtered.filter((a) => a.anomalyType === type)),
      progress: typeProgress[type],
    })).filter((g) => g.items.length > 0);
  }, [filtered, typeProgress]);

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

      {grouped.length === 0 ? (
        <p className="hint">{t("noResults")}</p>
      ) : (
        grouped.map(({ type, items, progress }) => {
          const collectedLabel = `${progress.got}/${progress.total} ${t("collectedOf")}`;
          return (
            <section
              key={type}
              className={`overview-section mh-section mh-section-${type} mh-section-immersive`}
              aria-labelledby={`type-${type}`}
            >
              <div className="mh-type-header">
                <div className="mh-type-heading">
                  <h2 id={`type-${type}`}>
                    <AnomalyTypeProgressMark
                      type={type}
                      got={progress.got}
                      total={progress.total}
                      title={collectedLabel}
                    />
                    <span>{anomalyTypeLabel(type, locale)}</span>
                    <span className="visually-hidden">{collectedLabel}</span>
                  </h2>
                </div>
              </div>
              <MiracleArtifactShelf
                artifacts={items}
                statusOf={getArtifactStatus}
                onStatusChange={setArtifactStatus}
              />
            </section>
          );
        })
      )}
    </div>
  );
}
