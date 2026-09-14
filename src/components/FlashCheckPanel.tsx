import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FLASHDRIVES,
  GEAR,
  TOTAL_UNIQUE,
  UNIQUE_BLUEPRINT_KEYS,
  flashdrivesForGear,
} from "../data/catalog";
import type { GearCategory } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { locUpgrade } from "../i18n/localize";
import { statusOf } from "../lib/status";
import { FilterCard, FilterChoiceList } from "./FilterCard";
import { FlashDriveCard } from "./FlashDriveCard";

const CATEGORY_LABEL: Record<GearCategory, string> = {
  weapon: "Зброя",
  helmet: "Шоломи",
  armor: "Броня",
};

export function FlashProgressBar() {
  const { collectedKeys, choices } = useProgress();
  const done = UNIQUE_BLUEPRINT_KEYS.filter((k) => collectedKeys.has(k)).length;
  const pct = Math.round((done / TOTAL_UNIQUE) * 100);
  const blocked = Object.values(choices).filter((v) => v === false).length;

  return (
    <>
      <div
        className="big-progress"
        aria-label={`Прогрес ${done} з ${TOTAL_UNIQUE}`}
      >
        <div className="big-progress-bar" style={{ width: `${pct}%` }} />
        <span>
          {done} / {TOTAL_UNIQUE} · {pct}%
        </span>
      </div>
      {blocked > 0 ? (
        <p className="ps5-miss">
          Є вибори проходження, що блокують флешки ({blocked}).
        </p>
      ) : null}
    </>
  );
}

export function FlashHowTo() {
  return (
    <ol className="howto">
      <li>
        Поки в Заліссі: візьми квест у Лінзи «Загублені хлопці» і обери бік
        Девʼятого.
      </li>
      <li>
        НДІЧАЗ: забери рюкзак під час втечі (будівля з записок експерименту, під
        сходами).
      </li>
      <li>
        Решту можна забрати без квестів у зручний час — орієнтуйтеся по мапі,
        щоб забирати флешки, поки ви поруч із ними.
      </li>
    </ol>
  );
}

export function FlashPdaCheck() {
  const { t, locale } = useLocale();
  const {
    collectedKeys,
    verifiedGearIds,
    choices,
    toggleCollected,
    toggleVerified,
  } = useProgress();
  const [openId, setOpenId] = useState<string | null>(null);
  const [cat, setCat] = useState<"all" | GearCategory>("all");

  const rows = useMemo(() => {
    return GEAR.filter((g) => cat === "all" || g.category === cat).map((g) => {
      const drives = flashdrivesForGear(g.id);
      const got = drives.filter((d) => collectedKeys.has(d.blueprintKey)).length;
      return {
        gear: g,
        drives,
        done: got,
        total: drives.length,
        verified: verifiedGearIds.has(g.id),
      };
    });
  }, [cat, collectedKeys, verifiedGearIds]);

  const unchecked = rows.filter((r) => !r.verified).length;

  return (
    <section className="overview-section pda-check-section" id="pda-check">
      <h2 id="pda-title">Перевірка в КПК</h2>
      <p className="overview-lede">
        Ви можете перевірити наявність того чи іншого покращення, хоча це може
        бути довго та дорого. Щоб перевірити наявність покращення, необхідно
        мати предмет, для якого воно створено: візьміть його в інвентар →
        відкрийте КПК → «Покращення». Синя іконка на слоті означає, що креслення
        ще немає. Поставте «Перевірив», коли пройшли всі слоти предмета.
        Залишилось перевірити {unchecked} з {rows.length}.
      </p>

      <div className="filter-card-stack">
        <FilterCard title={t("category")}>
          <FilterChoiceList
            label={t("category")}
            value={cat}
            variant="grid"
            onChange={(next) => setCat(next as typeof cat)}
            options={[
              { value: "all", label: t("statusAll") },
              { value: "weapon", label: t("categoryWeapon") },
              { value: "helmet", label: t("categoryHelmet") },
              { value: "armor", label: t("categoryArmor") },
            ]}
          />
        </FilterCard>
      </div>

      <ul className="gear-list">
        {rows.map(({ gear, drives, done: got, total, verified }) => {
          const open = openId === gear.id;
          return (
            <li
              key={gear.id}
              className={`gear-card${got === total ? " done" : ""}${verified ? " verified" : ""}`}
            >
              <div className="gear-row">
                <label className="gear-verified">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={() => toggleVerified(gear.id)}
                  />
                  <span>Перевірив</span>
                </label>
                <button
                  type="button"
                  className="gear-head"
                  onClick={() => setOpenId(open ? null : gear.id)}
                  aria-expanded={open}
                >
                  <span>
                    <span className="gear-name">{gear.nameUk}</span>
                    <span className="gear-sub">
                      {CATEGORY_LABEL[gear.category]} · потрібно в інвентарі
                    </span>
                  </span>
                  <span className="gear-count">
                    {got}/{total}
                  </span>
                </button>
              </div>
              {open ? (
                <ul className="gear-drives">
                  {drives.map((d) => {
                    const st = statusOf(d, collectedKeys, choices);
                    return (
                      <li
                        key={d.blueprintKey}
                        className={`flash-row status-${st}${d.lock ? " has-lock" : ""}`}
                      >
                        <FlashDriveCard
                          flash={d}
                          title={locUpgrade(d, locale)}
                          checked={st === "collected"}
                          onToggle={() => toggleCollected(d.blueprintKey)}
                          compact
                          lockedMissed={st === "locked_missed"}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="hint">
        Усього унікальних креслень у каталозі: {TOTAL_UNIQUE} (локацій у гайді:{" "}
        {FLASHDRIVES.length}).{" "}
        <Link to="/flash-royale?view=list">Відкрити повний список</Link>
      </p>
    </section>
  );
}
