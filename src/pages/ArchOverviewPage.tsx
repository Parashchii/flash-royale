import { Link } from "react-router-dom";
import { ARCH_ARTIFACTS, TOTAL_ARCH_ARTIFACTS } from "../data/catalog";
import { useProgress } from "../hooks/useProgress";

export function ArchOverviewPage() {
  const { collectedArchArtifactIds } = useProgress();
  const done = collectedArchArtifactIds.size;
  const pct = TOTAL_ARCH_ARTIFACTS
    ? Math.round((done / TOTAL_ARCH_ARTIFACTS) * 100)
    : 0;

  return (
    <div className="page home">
      <header className="hero-home">
        <p className="lede">
          Трекер 6 архіартефактів для досягнення Curiouser and Curiouser! (Все
          цікавіше й цікавіше).
        </p>
        <div
          className="big-progress"
          aria-label={`Прогрес ${done} з ${TOTAL_ARCH_ARTIFACTS}`}
        >
          <div className="big-progress-bar" style={{ width: `${pct}%` }} />
          <span>
            {done} / {TOTAL_ARCH_ARTIFACTS} · {pct}%
          </span>
        </div>
      </header>

      <section className="overview-section" aria-labelledby="arch-title">
        <h2 id="arch-title">За архіаномаліями</h2>
        <ul className="mh-type-status">
          {ARCH_ARTIFACTS.map((a) => {
            const complete = collectedArchArtifactIds.has(a.id);
            return (
              <li key={a.id} className={complete ? "done" : "open"}>
                <div>
                  <strong>{a.nameUk}</strong>
                  <span>
                    {a.anomalyUk} · {a.region}
                    {complete ? " · зібрано" : " · ще шукати"}
                    {a.conditionUk ? ` · ${a.conditionUk}` : ""}
                  </span>
                </div>
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
      </section>

      <section className="overview-section" aria-labelledby="howto-title">
        <h2 id="howto-title">Як користуватися</h2>
        <ol className="howto">
          <li>
            Архіартефакти — унікальні «Дивні» предмети з архіаномалій; звичайний
            детектор їх не бачить.
          </li>
          <li>
            Зберіть усі 6, щоб отримати Curiouser and Curiouser! Тримати разом
            необовʼязково для ачівки (на відміну від Miracle Hoarder).
          </li>
          <li>
            «Дивна вода» (Мандрівні вогні) — лише вночі, приблизно 22:00–04:00.
          </li>
          <li>
            Координати з Steam Console Commands; описи — з UA/EN Steam-гайдів
            про архіартефакти.
          </li>
        </ol>
      </section>

      <section className="overview-section" aria-labelledby="pda-title">
        <h2 id="pda-title">Перевірка</h2>
        <p className="overview-lede">
          Відмічайте зібране в списку або на мапі — прогрес зберігається в
          цьому браузері (або в хмарі, якщо увійти).
        </p>
        <div className="choice-actions">
          <Link className="btn" to="/curiouser-curiouser/list">
            Відкрити список
          </Link>
          <Link className="btn btn-ghost" to="/curiouser-curiouser">
            Відкрити мапу
          </Link>
        </div>
      </section>
    </div>
  );
}
