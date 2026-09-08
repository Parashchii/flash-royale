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
import { FilterCard, FilterChoiceList } from "../components/FilterCard";
import { ListToolbar } from "../components/ListToolbar";

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
      <header className="page-header mh-list-header">
        <p>
          {filtered.length} з {TOTAL_UNIQUE} унікальних креслень
        </p>
        <ListToolbar
          search={q}
          onSearch={setQ}
          searchPlaceholder="назва, регіон…"
        />
      </header>

      <div className="filter-card-stack">
        <FilterCard title="Регіон">
          <FilterChoiceList
            label="Регіон"
            value={region}
            onChange={setRegion}
            options={[
              { value: "all", label: "Усі" },
              ...REGIONS.map((r) => ({ value: r, label: r })),
            ]}
          />
        </FilterCard>
        <FilterCard title="Тип">
          <FilterChoiceList
            label="Тип"
            value={category}
            onChange={(next) => {
              setCategory(next as typeof category);
              setGearId("all");
            }}
            options={[
              { value: "all", label: "Усі" },
              { value: "weapon", label: "Зброя" },
              { value: "helmet", label: "Шоломи" },
              { value: "armor", label: "Броня" },
            ]}
          />
        </FilterCard>
        <FilterCard title="Предмет">
          <FilterChoiceList
            label="Предмет"
            value={gearId}
            onChange={setGearId}
            options={[
              { value: "all", label: "Усі" },
              ...gearOptions.map((g) => ({ value: g.id, label: g.nameUk })),
            ]}
          />
        </FilterCard>
        <FilterCard title="Статус">
          <FilterChoiceList
            label="Статус"
            value={status}
            variant="chips"
            onChange={(next) => setStatus(next as StatusFilter)}
            options={[
              { value: "all", label: "Усі" },
              { value: "missing", label: "Не зібрано" },
              { value: "collected", label: "Зібрано" },
              { value: "locked", label: "Сюжет / можна пропустити" },
              { value: "locked_missed", label: "Заблоковано вибором" },
            ]}
          />
        </FilterCard>
        <FilterCard title="Спойлери">
          <label className="check-label">
            <input
              type="checkbox"
              checked={spoilers}
              onChange={(e) => setSpoilers(e.target.checked)}
            />
            Показати спойлери
          </label>
        </FilterCard>
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
