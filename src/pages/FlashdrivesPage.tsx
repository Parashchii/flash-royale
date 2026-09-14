import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useLocale } from "../i18n/LocaleContext";
import { locName, locRegion } from "../i18n/localize";
import { statusOf } from "../lib/status";
import { FilterCard, FilterChoiceList } from "../components/FilterCard";
import { FlashDriveCard } from "../components/FlashDriveCard";
import { ListToolbar } from "../components/ListToolbar";

type StatusFilter = "all" | "missing" | "collected" | "locked" | "locked_missed";

export function FlashdrivesPage() {
  const { collectedKeys, choices, toggleCollected } = useProgress();
  const { t, locale } = useLocale();
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
        <FilterCard title={t("region")}>
          <FilterChoiceList
            label={t("region")}
            value={region}
            variant="grid"
            onChange={setRegion}
            options={[
              { value: "all", label: t("statusAll") },
              ...REGIONS.map((r) => ({
                value: r,
                label: locRegion({ region: r }, locale),
              })),
            ]}
          />
        </FilterCard>
        <FilterCard title={t("category")}>
          <FilterChoiceList
            label={t("category")}
            value={category}
            variant="grid"
            onChange={(next) => {
              setCategory(next as typeof category);
              setGearId("all");
            }}
            options={[
              { value: "all", label: t("statusAll") },
              { value: "weapon", label: t("categoryWeapon") },
              { value: "helmet", label: t("categoryHelmet") },
              { value: "armor", label: t("categoryArmor") },
            ]}
          />
        </FilterCard>
        <FilterCard title={t("item")}>
          <FilterChoiceList
            label={t("item")}
            value={gearId}
            variant="grid"
            scroll
            onChange={setGearId}
            options={[
              { value: "all", label: t("statusAll") },
              ...gearOptions.map((g) => ({
                value: g.id,
                label: locName(g, locale),
              })),
            ]}
          />
        </FilterCard>
        <FilterCard title={t("status")}>
          <FilterChoiceList
            label={t("status")}
            value={status}
            variant="grid"
            onChange={(next) => setStatus(next as StatusFilter)}
            options={[
              { value: "all", label: t("statusAll") },
              { value: "missing", label: t("statusMissing") },
              { value: "collected", label: t("statusCollected") },
              { value: "locked", label: t("statusLocked") },
              { value: "locked_missed", label: t("statusLockedMissed") },
            ]}
          />
        </FilterCard>
        <FilterCard title={t("spoilers")}>
          <div className="mh-region-grid">
            <label className="check-label mh-region-check">
              <input
                type="checkbox"
                checked={spoilers}
                onChange={(e) => setSpoilers(e.target.checked)}
              />
              <span className="mh-region-check-text">{t("showSpoilers")}</span>
            </label>
          </div>
        </FilterCard>
      </div>

      <ul className="flash-list">
        {filtered.map((f) => {
          const st = statusOf(f, collectedKeys, choices);
          const alts = allLocationsForKey(f.blueprintKey);
          const questAlt = alts.find((a) => a.questOnly);
          return (
            <li
              key={f.blueprintKey}
              className={`flash-row status-${st}${f.lock ? " has-lock" : ""}${questAlt ? " has-quest-only" : ""}`}
            >
              <FlashDriveCard
                flash={f}
                title={locName(f, locale)}
                checked={st === "collected"}
                onToggle={() => toggleCollected(f.blueprintKey)}
                alts={alts}
                spoilers={spoilers}
                lockedMissed={st === "locked_missed"}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
