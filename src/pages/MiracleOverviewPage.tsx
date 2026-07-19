import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TOTAL_ARTIFACTS,
  artifactTypeProgress,
} from "../data/catalog";
import {
  ANOMALY_TYPE_LABELS,
  ANOMALY_TYPES,
} from "../data/types";
import { useProgress } from "../hooks/useProgress";

export function MiracleOverviewPage() {
  const { collectedArtifactIds } = useProgress();
  const done = collectedArtifactIds.size;
  const pct = TOTAL_ARTIFACTS
    ? Math.round((done / TOTAL_ARTIFACTS) * 100)
    : 0;
  const typeProgress = useMemo(
    () => artifactTypeProgress(collectedArtifactIds),
    [collectedArtifactIds],
  );

  return (
    <div className="page home">
      <header className="hero-home">
        <p className="lede">
          Трекер усіх артефактів для досягнення Miracle Hoarder (Збирач див).
        </p>
        <div
          className="big-progress"
          aria-label={`Прогрес ${done} з ${TOTAL_ARTIFACTS}`}
        >
          <div className="big-progress-bar" style={{ width: `${pct}%` }} />
          <span>
            {done} / {TOTAL_ARTIFACTS} · {pct}%
          </span>
        </div>
      </header>

      <section className="overview-section" aria-labelledby="types-title">
        <h2 id="types-title">За типами аномалій</h2>
        <ul className="mh-type-status">
          {ANOMALY_TYPES.map((type) => {
            const p = typeProgress[type];
            const complete = p.got >= p.total && p.total > 0;
            return (
              <li key={type} className={complete ? "done" : "open"}>
                <div>
                  <strong>{ANOMALY_TYPE_LABELS[type]}</strong>
                  <span>
                    {p.got}/{p.total}
                    {complete ? " · тип закрито" : " · ще фармити"}
                  </span>
                </div>
                <Link
                  className="btn btn-ghost"
                  to={`/miracle-hoarder?type=${type}`}
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
            Збирайте звичайні артефакти якомога раніше — з прогресом гри вони
            стають рідшими.
          </li>
          <li>
            Усі 69 мають бути в інвентарі або особистому ящику одночасно, щоб
            досягнення зарахувалось.
          </li>
          <li>
            Артефакти зі сканерів інколи не рахуються — викиньте на землю і
            підберіть знову.
          </li>
          <li>
            На мапі підсвічені поля аномалій, поки для їхнього типу ще є
            незабрані артефакти в{" "}
            <Link to="/miracle-hoarder/list">списку</Link>.
          </li>
        </ol>
      </section>

      <section className="overview-section" aria-labelledby="pda-title">
        <h2 id="pda-title">Перевірка</h2>
        <p className="overview-lede">
          Відмічайте зібране в списку — прогрес зберігається в цьому браузері.
          Мапа показує поля аномалій для фарму артефактів (координати з teleport-гайду).
        </p>
        <div className="choice-actions">
          <Link className="btn" to="/miracle-hoarder/list">
            Відкрити список
          </Link>
          <Link className="btn btn-ghost" to="/miracle-hoarder">
            Мапа аномалій
          </Link>
        </div>
      </section>
    </div>
  );
}
