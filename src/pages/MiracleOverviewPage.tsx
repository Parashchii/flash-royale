import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TOTAL_ARTIFACTS,
  artifactTypeProgress,
  trackedArtifactIds,
} from "../data/catalog";
import { ACHIEVEMENTS } from "../data/achievements";
import { ANOMALY_TYPES } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel, locName } from "../i18n/localize";
import {
  AnomalyTypeProgressMark,
  ProgressRing,
} from "../components/AnomalyTypeIcon";

export function MiracleOverviewPage() {
  const { t, locale } = useLocale();
  const { collectedArtifactIds, foundArtifactIds } = useProgress();
  const trackedIds = useMemo(
    () => trackedArtifactIds(collectedArtifactIds, foundArtifactIds),
    [collectedArtifactIds, foundArtifactIds],
  );
  const done = trackedIds.size;
  const typeProgress = useMemo(
    () => artifactTypeProgress(trackedIds),
    [trackedIds],
  );
  const achName = locName(ACHIEVEMENTS["miracle-hoarder"], locale);
  const allLabel = `${done}/${TOTAL_ARTIFACTS} ${t("collectedOf")}`;

  return (
    <div className="page overview-page mh-overview-immersive">
      <header className="hero-home">
        <p className="lede">
          {locale === "uk"
            ? `Трекер усіх артефактів для досягнення ${achName}.`
            : `Tracker for all artifacts for the ${achName} achievement.`}
        </p>
      </header>

      <div className="mh-progress-board">
        <figure className="mh-progress-all">
          <ProgressRing
            got={done}
            total={TOTAL_ARTIFACTS}
            title={allLabel}
            tone="all"
            size="lg"
          >
            <span className="mh-donut-count">
              <strong>{done}</strong>
              <span>/{TOTAL_ARTIFACTS}</span>
            </span>
          </ProgressRing>
          <figcaption>{t("achMiracleDesc")}</figcaption>
          <span className="visually-hidden">{allLabel}</span>
        </figure>

        <div className="mh-progress-types">
          {ANOMALY_TYPES.map((type) => {
            const p = typeProgress[type];
            const collectedLabel = `${p.got}/${p.total} ${t("collectedOf")}`;
            return (
              <figure key={type} className="mh-progress-type">
                <AnomalyTypeProgressMark
                  type={type}
                  got={p.got}
                  total={p.total}
                  title={collectedLabel}
                />
                <figcaption>{anomalyTypeLabel(type, locale)}</figcaption>
                <span className="visually-hidden">{collectedLabel}</span>
              </figure>
            );
          })}
        </div>
      </div>

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
            <Link to="/miracle-hoarder?view=list">списку</Link>.
          </li>
        </ol>
      </section>
    </div>
  );
}
