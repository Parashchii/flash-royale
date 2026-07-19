import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ARCH_ARTIFACTS,
  ARCH_REGIONS,
  TOTAL_ARCH_ARTIFACTS,
} from "../data/catalog";
import { useProgress } from "../hooks/useProgress";

type StatusFilter = "all" | "missing" | "collected";

export function ArchListPage() {
  const { collectedArchArtifactIds, toggleArchArtifact } = useProgress();
  const [params] = useSearchParams();

  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState(params.get("q") ?? "");

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

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Список</h1>
          <p>
            {collectedArchArtifactIds.size} / {TOTAL_ARCH_ARTIFACTS}{" "}
            архіартефактів · показуємо {filtered.length}
          </p>
        </div>
      </header>

      <div className="filters sticky-filters">
        <label>
          Пошук
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="назва, аномалія, регіон…"
          />
        </label>
        <label>
          Регіон
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="all">Усі</option>
            {ARCH_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
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

      <ul className="flash-list">
        {filtered.map((a) => {
          const got = collectedArchArtifactIds.has(a.id);
          return (
            <li
              key={a.id}
              className={`flash-row status-${got ? "collected" : "missing"}`}
            >
              <label className="flash-check">
                <input
                  type="checkbox"
                  checked={got}
                  onChange={() => toggleArchArtifact(a.id)}
                />
                <span className="flash-body">
                  <span className="flash-title">{a.nameUk}</span>
                  <span className="flash-meta">
                    {a.region} · {a.anomalyUk} ({a.anomalyEn}) · {a.nameEn}
                  </span>
                  {a.conditionUk && (
                    <span className="lock-badge">{a.conditionUk}</span>
                  )}
                  <span className="access-hint">{a.accessUk}</span>
                  {a.notes && <span className="notes">{a.notes}</span>}
                </span>
              </label>
              <Link
                className="btn btn-ghost"
                to={`/curiouser-curiouser?id=${a.id}`}
              >
                Мапа
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="hint">Немає архіартефактів за поточним фільтром.</p>
      )}
    </div>
  );
}
