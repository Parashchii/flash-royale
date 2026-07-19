import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FLASHDRIVES,
  GEAR,
  REGIONS,
  TOTAL_UNIQUE,
  allLocationsForKey,
  gearById,
} from "../data/catalog";
import type { GearCategory } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { statusOf } from "../lib/status";

type StatusFilter = "all" | "missing" | "collected" | "locked" | "locked_missed";

export function FlashdrivesPage() {
  const { collectedKeys, choices, toggleCollected } = useProgress();
  const [params] = useSearchParams();
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState<"all" | GearCategory>("all");
  const [gearId, setGearId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [spoilers, setSpoilers] = useState(false);

  const uniqueList = useMemo(() => {
    const seen = new Set<string>();
    const list = [];
    for (const f of FLASHDRIVES) {
      if (seen.has(f.blueprintKey)) continue;
      seen.add(f.blueprintKey);
      list.push(f);
    }
    return list;
  }, []);

  const gearOptions = useMemo(() => {
    return GEAR.filter((g) => category === "all" || g.category === category);
  }, [category]);

  const filtered = useMemo(() => {
    return uniqueList.filter((f) => {
      const gear = gearById[f.gearId];
      if (region !== "all" && f.region !== region) {
        // also show if any alt location matches region
        const alts = allLocationsForKey(f.blueprintKey);
        if (!alts.some((a) => a.region === region)) return false;
      }
      if (category !== "all" && gear?.category !== category) return false;
      if (gearId !== "all" && f.gearId !== gearId) return false;
      const st = statusOf(f, collectedKeys, choices);
      if (status === "missing" && st !== "missing") return false;
      if (status === "collected" && st !== "collected") return false;
      if (status === "locked_missed" && st !== "locked_missed") return false;
      if (status === "locked" && !f.lock) return false;
      if (q.trim()) {
        const hay = `${f.nameUk} ${f.nameEn} ${f.region} ${gear?.nameUk ?? ""}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [uniqueList, region, category, gearId, status, q, collectedKeys, choices]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Список</h1>
        <p>
          {filtered.length} з {TOTAL_UNIQUE} унікальних креслень
        </p>
      </header>

      <div className="filters sticky-filters">
        <label>
          Пошук
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="назва, регіон…"
          />
        </label>
        <label>
          Регіон
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="all">Усі</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Тип
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as typeof category);
              setGearId("all");
            }}
          >
            <option value="all">Усі</option>
            <option value="weapon">Зброя</option>
            <option value="helmet">Шоломи</option>
            <option value="armor">Броня</option>
          </select>
        </label>
        <label>
          Предмет
          <select value={gearId} onChange={(e) => setGearId(e.target.value)}>
            <option value="all">Усі</option>
            {gearOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nameUk}
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
            <option value="locked">Сюжет / можна пропустити</option>
            <option value="locked_missed">Заблоковано вибором</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={spoilers}
            onChange={(e) => setSpoilers(e.target.checked)}
          />
          Показати спойлери
        </label>
      </div>

      <ul className="flash-list">
        {filtered.map((f) => {
          const st = statusOf(f, collectedKeys, choices);
          const gear = gearById[f.gearId];
          const alts = allLocationsForKey(f.blueprintKey);
          const questAlt = alts.find((a) => a.questOnly);
          const noteText = questAlt?.notes ?? f.notes;
          return (
            <li
              key={f.blueprintKey}
              className={`flash-row status-${st}${f.lock ? " has-lock" : ""}${questAlt ? " has-quest-only" : ""}`}
            >
              <label className="flash-check">
                <input
                  type="checkbox"
                  checked={st === "collected"}
                  onChange={() => toggleCollected(f.blueprintKey)}
                />
                <span className="flash-body">
                  <span className="flash-title">{f.nameUk}</span>
                  <span className="flash-meta">
                    {gear?.nameUk} ·{" "}
                    {alts.map((a) => a.region).join(" / ")}
                  </span>
                  {alts.map((a) =>
                    a.accessUk ? (
                      <span key={`${a.id}-access`} className="access-hint">
                        {alts.length > 1 ? `${a.region}: ` : ""}
                        {a.accessUk}
                      </span>
                    ) : null,
                  )}
                  {f.lock && (
                    <span className="lock-badge">
                      Сюжет / можна пропустити
                      {f.lock.questUk ? ` · ${f.lock.questUk}` : ""}
                    </span>
                  )}
                  {f.lock && (
                    <span className="lock-summary">{f.lock.summaryUk}</span>
                  )}
                  {f.lock && spoilers && (
                    <span className="lock-detail">{f.lock.detailUk}</span>
                  )}
                  {st === "locked_missed" && (
                    <span className="ps5-miss">
                      Заблоковано вашим вибором. На PS5 — інший сейв або нове
                      проходження.
                    </span>
                  )}
                  {questAlt && (
                    <span className="quest-only-badge">
                      Лише через квест НДІЧАЗ
                    </span>
                  )}
                  {noteText && (
                    <span className="notes">
                      {noteText}
                      {questAlt && (
                        <span className="platform-tags">
                          <span className="platform-tag platform-ok">
                            Працює на PS5 станом на 15 липня 2026, патч 1.010
                          </span>
                          <span className="platform-tag platform-unverified">
                            Не перевірено на PC
                          </span>
                          <span className="platform-tag platform-unverified">
                            Не перевірено на Xbox
                          </span>
                        </span>
                      )}
                    </span>
                  )}
                  <span className="map-links">
                    {alts.map((a) => (
                      <Link
                        key={a.id}
                        className="map-pin-link"
                        to={`/flash-royale?id=${encodeURIComponent(a.id)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        На мапі
                        {alts.length > 1 ? ` (${a.region})` : ""}
                      </Link>
                    ))}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
