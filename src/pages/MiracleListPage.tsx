import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ARTIFACTS,
  TOTAL_ARTIFACTS,
  artifactTypeProgress,
} from "../data/catalog";
import {
  ANOMALY_TYPE_LABELS,
  ANOMALY_TYPES,
  type AnomalyType,
  type Artifact,
} from "../data/types";
import { useProgress } from "../hooks/useProgress";

type StatusFilter = "all" | "missing" | "collected";
type ViewMode = "list" | "grid";

function artifactIconSrc(id: string) {
  return `/artifacts/${id}.png?v=2`;
}

function ArtifactCard({
  artifact,
  got,
  view,
  onToggle,
}: {
  artifact: Artifact;
  got: boolean;
  view: ViewMode;
  onToggle: () => void;
}) {
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
          <span className="mh-artifact-title">{artifact.nameUk}</span>
          <span className="mh-artifact-meta">
            {artifact.nameEn}
            {artifact.rarity ? ` · ${artifact.rarity}` : ""}
          </span>
        </span>
      </label>
    </li>
  );
}

export function MiracleListPage() {
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
        const hay = `${a.nameUk} ${a.nameEn} ${ANOMALY_TYPE_LABELS[a.anomalyType]}`.toLowerCase();
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
          <h1>Список</h1>
          <p>
            {collectedArtifactIds.size} / {TOTAL_ARTIFACTS} артефактів · показуємо{" "}
            {filtered.length}
          </p>
        </div>
        <div className="mh-view-toggle" role="group" aria-label="Вигляд списку">
          <button
            type="button"
            className={view === "list" ? "active" : undefined}
            aria-pressed={view === "list"}
            title="Список"
            onClick={() => setView("list")}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z"
              />
            </svg>
            <span>Список</span>
          </button>
          <button
            type="button"
            className={view === "grid" ? "active" : undefined}
            aria-pressed={view === "grid"}
            title="Сітка"
            onClick={() => setView("grid")}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z"
              />
            </svg>
            <span>Сітка</span>
          </button>
        </div>
      </header>

      <div className="filters sticky-filters">
        <label>
          Пошук
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="назва артефакту…"
          />
        </label>
        <label>
          Тип аномалії
          <select
            value={anomalyType}
            onChange={(e) =>
              setAnomalyType(e.target.value as typeof anomalyType)
            }
          >
            <option value="all">Усі</option>
            {ANOMALY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ANOMALY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Статус
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="all">Усі</option>
            <option value="missing">Не зібрано</option>
            <option value="collected">Зібрано</option>
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
              <h2 id={`type-${type}`}>{ANOMALY_TYPE_LABELS[type]}</h2>
              <p className="mh-type-meta">
                {progress.got}/{progress.total} зібрано · на мапі підсвічені поля
                цього типу, поки є незабрані артефакти
              </p>
            </div>
            <Link
              className="btn mh-map-btn"
              to={`/miracle-hoarder?type=${type}`}
            >
              Дивитися мапу
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="hint">Немає артефактів за поточним фільтром.</p>
          ) : (
            <ul className={`mh-artifact-list mh-artifact-list-${view}`}>
              {items.map((a) => (
                <ArtifactCard
                  key={a.id}
                  artifact={a}
                  got={collectedArtifactIds.has(a.id)}
                  view={view}
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
