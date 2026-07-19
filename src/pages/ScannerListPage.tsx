import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SCANNERS, SCANNER_REGIONS, TOTAL_SCANNERS } from "../data/catalog";
import { useProgress } from "../hooks/useProgress";

type StatusFilter = "all" | "missing" | "collected";

export function ScannerListPage() {
  const { collectedScannerIds, toggleScanner } = useProgress();
  const [params] = useSearchParams();

  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState(params.get("q") ?? "");

  const filtered = useMemo(() => {
    return SCANNERS.filter((s) => {
      if (region !== "all" && s.region !== region) return false;
      const got = collectedScannerIds.has(s.id);
      if (status === "missing" && got) return false;
      if (status === "collected" && !got) return false;
      if (q.trim()) {
        const hay =
          `${s.nameUk} ${s.nameEn} ${s.region} ${s.regionEn} ${s.poiUk} ${s.artifactNameUk} ${s.artifactNameEn} ${s.accessUk}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [region, status, q, collectedScannerIds]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Список</h1>
          <p>
            {collectedScannerIds.size} / {TOTAL_SCANNERS} сканерів · показуємо{" "}
            {filtered.length}
          </p>
        </div>
      </header>

      <div className="filters sticky-filters">
        <label>
          Пошук
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="регіон, артефакт, POI…"
          />
        </label>
        <label>
          Регіон
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="all">Усі</option>
            {SCANNER_REGIONS.map((r) => (
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
        {filtered.map((s) => {
          const got = collectedScannerIds.has(s.id);
          return (
            <li
              key={s.id}
              className={`flash-row status-${got ? "collected" : "missing"}`}
            >
              <label className="flash-check">
                <input
                  type="checkbox"
                  checked={got}
                  onChange={() => toggleScanner(s.id)}
                />
                <span className="flash-body">
                  <span className="flash-title">{s.nameUk}</span>
                  <span className="flash-meta">
                    {s.region} · {s.poiUk} · {s.artifactNameUk} (
                    {s.artifactNameEn})
                  </span>
                  {s.conditionUk && (
                    <span className="lock-badge">{s.conditionUk}</span>
                  )}
                  <span className="access-hint">{s.accessUk}</span>
                  {s.notes && <span className="notes">{s.notes}</span>}
                </span>
              </label>
              <Link
                className="btn btn-ghost"
                to={`/scanning-complete?id=${s.id}`}
              >
                Мапа
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="hint">Немає сканерів за поточним фільтром.</p>
      )}
    </div>
  );
}
