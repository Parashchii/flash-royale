import {
  TOTAL_ARCH_ARTIFACTS,
} from "../data/catalog";
import { ACHIEVEMENTS } from "../data/achievements";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { locName } from "../i18n/localize";
import { CountProgressMark } from "../components/AnomalyTypeIcon";

export function ArchOverviewPage() {
  const { t, locale } = useLocale();
  const { collectedArchArtifactIds } = useProgress();
  const done = collectedArchArtifactIds.size;
  const achName = locName(ACHIEVEMENTS["curiouser-curiouser"], locale);
  const allLabel = `${done}/${TOTAL_ARCH_ARTIFACTS} ${t("collectedOf")}`;

  return (
    <div className="page overview-page mh-overview-immersive">
      <header className="hero-home">
        <p className="lede">
          {locale === "uk"
            ? `Трекер 6 архіартефактів для досягнення ${achName}.`
            : `Tracker for 6 arch-artifacts for the ${achName} achievement.`}
        </p>
      </header>

      <div className="mh-progress-board mh-progress-board-single">
        <figure className="mh-progress-all">
          <CountProgressMark
            got={done}
            total={TOTAL_ARCH_ARTIFACTS}
            title={allLabel}
            size="lg"
          />
          <figcaption>{t("achArchDesc")}</figcaption>
          <span className="visually-hidden">{allLabel}</span>
        </figure>
      </div>

      <section className="overview-section" aria-labelledby="howto-title">
        <h2 id="howto-title">
          {locale === "uk" ? "Як користуватися" : "How to use"}
        </h2>
        <ol className="howto">
          <li>
            {locale === "uk"
              ? "Архіартефакти — унікальні «Дивні» предмети з архіаномалій; звичайний детектор їх не бачить."
              : "Arch-artifacts are unique “Weird” items from arch-anomalies; a normal detector won’t see them."}
          </li>
          <li>
            {locale === "uk"
              ? `Зберіть усі 6, щоб отримати ${achName}. Тримати разом необовʼязково для ачівки (на відміну від ${locName(ACHIEVEMENTS["miracle-hoarder"], locale)}).`
              : `Collect all 6 to unlock ${achName}. You don’t need to hold them together for the achievement (unlike ${locName(ACHIEVEMENTS["miracle-hoarder"], locale)}).`}
          </li>
          <li>
            {locale === "uk"
              ? "«Дивна вода» (Мандрівні вогні) — лише вночі, приблизно 22:00–04:00."
              : "Weird Water (Wandering Lights) — night only, about 22:00–04:00."}
          </li>
          <li>
            {locale === "uk"
              ? "Координати з Steam Console Commands; описи — з UA/EN Steam-гайдів про архіартефакти."
              : "Coordinates from Steam Console Commands; descriptions from UA/EN Steam arch-artifact guides."}
          </li>
        </ol>
      </section>
    </div>
  );
}
