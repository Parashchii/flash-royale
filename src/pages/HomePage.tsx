import { useEffect, useMemo, useState } from "react";
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
import { statusOf } from "../lib/status";

const CATEGORY_LABEL: Record<GearCategory, string> = {
  weapon: "Зброя",
  helmet: "Шоломи",
  armor: "Броня",
};

export function HomePage() {
  const {
    collectedKeys,
    verifiedGearIds,
    choices,
    toggleCollected,
    toggleVerified,
  } = useProgress();
  const [openId, setOpenId] = useState<string | null>(null);
  const [cat, setCat] = useState<"all" | GearCategory>("all");

  const done = UNIQUE_BLUEPRINT_KEYS.filter((k) => collectedKeys.has(k)).length;
  const pct = Math.round((done / TOTAL_UNIQUE) * 100);

  const blocked = Object.values(choices).filter((v) => v === false).length;

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

  useEffect(() => {
    if (window.location.hash !== "#pda-check") return;
    requestAnimationFrame(() => {
      document.getElementById("pda-check")?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  return (
    <div className="page home">
      <header className="hero-home">
        <p className="lede">
          Трекер усіх флешок із покращеннями для досягнення Flash Royale.
        </p>
        <div
          className="big-progress"
          aria-label={`Прогрес ${done} з ${TOTAL_UNIQUE}`}
        >
          <div className="big-progress-bar" style={{ width: `${pct}%` }} />
          <span>
            {done} / {TOTAL_UNIQUE} · {pct}%
          </span>
        </div>
      </header>

      {blocked > 0 && (
        <p className="ps5-miss">
          Є вибори проходження, що блокують флешки ({blocked}).
        </p>
      )}

      <section className="overview-section" aria-labelledby="howto-title">
        <h2 id="howto-title">Як користуватися</h2>
        <ol className="howto">
          <li>
            Поки в Заліссі: візьми квест у Лінзи «Загублені хлопці» і обери бік
            Девʼятого.
          </li>
          <li>
            НДІЧАЗ: забери рюкзак під час втечі (будівля з записок експерименту,
            під сходами).
          </li>
          <li>
            Решту можна забрати без квестів у зручний час — орієнтуйтеся по мапі,
            щоб забирати флешки, поки ви поруч із ними.
          </li>
        </ol>
      </section>

      <section
        className="overview-section"
        id="pda-check"
        aria-labelledby="pda-title"
      >
        <h2 id="pda-title">Перевірка в КПК</h2>
        <p className="overview-lede">
          Ви можете перевірити наявність того чи іншого покращення, хоча це може
          бути довго та дорого. Щоб перевірити наявність покращення, необхідно
          мати предмет, для якого воно створено: візьміть його в інвентар →
          відкрийте КПК → «Покращення». Синя іконка на слоті означає, що
          креслення ще немає. Поставте «Перевірив», коли пройшли всі слоти
          предмета. Залишилось перевірити {unchecked} з {rows.length}.
        </p>

        <div className="filters">
          <label>
            Категорія
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as typeof cat)}
            >
              <option value="all">Усі</option>
              <option value="weapon">Зброя</option>
              <option value="helmet">Шоломи</option>
              <option value="armor">Броня</option>
            </select>
          </label>
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
                {open && (
                  <ul className="gear-drives">
                    {drives.map((d) => {
                      const st = statusOf(d, collectedKeys, choices);
                      return (
                        <li key={d.blueprintKey}>
                          <label className="flash-check compact">
                            <input
                              type="checkbox"
                              checked={st === "collected"}
                              onChange={() => toggleCollected(d.blueprintKey)}
                            />
                            <span>
                              <span className="flash-title">{d.upgradeUk}</span>
                              <span className="flash-meta">{d.region}</span>
                              {d.accessUk && (
                                <span className="access-hint">{d.accessUk}</span>
                              )}
                              {d.lock && (
                                <span className="lock-badge">
                                  {d.lock.summaryUk}
                                </span>
                              )}
                              {st === "locked_missed" && (
                                <span className="ps5-miss">
                                  Заблоковано вибором · PS5: новий сейв
                                </span>
                              )}
                              <Link
                                className="map-pin-link"
                                to={`/flash-royale?id=${encodeURIComponent(d.id)}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                На мапі
                              </Link>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <p className="hint">
          Усього унікальних креслень у каталозі: {TOTAL_UNIQUE} (локацій у гайді:{" "}
          {FLASHDRIVES.length}).{" "}
          <Link to="/flash-royale/list">Відкрити повний список</Link>
        </p>
      </section>
    </div>
  );
}
