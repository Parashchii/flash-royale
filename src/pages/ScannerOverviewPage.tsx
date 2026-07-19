import { Link } from "react-router-dom";
import { SCANNERS, TOTAL_SCANNERS } from "../data/catalog";
import { useProgress } from "../hooks/useProgress";

export function ScannerOverviewPage() {
  const { collectedScannerIds } = useProgress();
  const done = collectedScannerIds.size;
  const pct = TOTAL_SCANNERS
    ? Math.round((done / TOTAL_SCANNERS) * 100)
    : 0;

  return (
    <div className="page home">
      <header className="hero-home">
        <p className="lede">
          Трекер 10 стаціонарних сканерів для досягнення Scanning Complete
          (Сканування завершено).
        </p>
        <div
          className="big-progress"
          aria-label={`Прогрес ${done} з ${TOTAL_SCANNERS}`}
        >
          <div className="big-progress-bar" style={{ width: `${pct}%` }} />
          <span>
            {done} / {TOTAL_SCANNERS} · {pct}%
          </span>
        </div>
      </header>

      <section className="overview-section" aria-labelledby="scanners-title">
        <h2 id="scanners-title">За регіонами</h2>
        <ul className="mh-type-status">
          {SCANNERS.map((s) => {
            const complete = collectedScannerIds.has(s.id);
            return (
              <li key={s.id} className={complete ? "done" : "open"}>
                <div>
                  <strong>{s.region}</strong>
                  <span>
                    {s.artifactNameUk}
                    {complete ? " · зібрано" : " · ще шукати"}
                    {s.conditionUk ? ` · ${s.conditionUk}` : ""}
                  </span>
                </div>
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
      </section>

      <section className="overview-section" aria-labelledby="howto-title">
        <h2 id="howto-title">Як користуватися</h2>
        <ol className="howto">
          <li>
            Сканери — великі стаціонарні пристрої з артефактом, не ручні
            детектори.
          </li>
          <li>
            Активуйте сканер і заберіть артефакт — це зараховується до
            досягнення. Тримати всі артефакти разом не потрібно.
          </li>
          <li>
            На Хімзаводі сканер на даху трансформатора працює лише після
            півночі (00:00 ігрового часу).
          </li>
          <li>
            Координати з Steam teleport-гайду; описи — з{" "}
            <a
              href="https://stalker2.wiki.fextralife.com/Scanner+Locations"
              target="_blank"
              rel="noreferrer"
            >
              Fextralife
            </a>{" "}
            та Steam-гайдів.
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
          <Link className="btn" to="/scanning-complete/list">
            Відкрити список
          </Link>
          <Link className="btn btn-ghost" to="/scanning-complete">
            Відкрити мапу
          </Link>
        </div>
      </section>
    </div>
  );
}
