import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SCANNERS, SCANNER_REGIONS, TOTAL_SCANNERS } from "../data/catalog";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { locField, locName, locRegion } from "../i18n/localize";

type StatusFilter = "all" | "missing" | "collected";

export function ScannerListPage() {
  const { t, locale } = useLocale();
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
          <h1>{t("listTitle")}</h1>
          <p>
            {collectedScannerIds.size} / {TOTAL_SCANNERS} · {t("listShowing")}{" "}
            {filtered.length}
          </p>
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
            {SCANNER_REGIONS.map((r) => {
              const sample = SCANNERS.find((s) => s.region === r);
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
                  <span className="flash-title">{locName(s, locale)}</span>
                  <span className="flash-meta">
                    {locRegion(s, locale)} · {s.poiUk} ·{" "}
                    {locField(s.artifactNameUk, s.artifactNameEn, locale)}
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
                {t("map")}
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="hint">{t("noResults")}</p>
      )}
    </div>
  );
}
