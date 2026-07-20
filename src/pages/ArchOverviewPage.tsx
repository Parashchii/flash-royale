import { Link } from "react-router-dom";
import { ARCH_ARTIFACTS, TOTAL_ARCH_ARTIFACTS } from "../data/catalog";
import { ACHIEVEMENTS } from "../data/achievements";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { locAnomaly, locName, locRegion } from "../i18n/localize";

export function ArchOverviewPage() {
  const { t, locale } = useLocale();
  const { collectedArchArtifactIds } = useProgress();
  const done = collectedArchArtifactIds.size;
  const pct = TOTAL_ARCH_ARTIFACTS
    ? Math.round((done / TOTAL_ARCH_ARTIFACTS) * 100)
    : 0;
  const achName = locName(ACHIEVEMENTS["curiouser-curiouser"], locale);

  return (
    <div className="page home">
      <header className="hero-home">
        <p className="lede">
          {locale === "uk"
            ? `Трекер 6 архіартефактів для досягнення ${achName}.`
            : `Tracker for 6 arch-artifacts for the ${achName} achievement.`}
        </p>
        <div
          className="big-progress"
          aria-label={`${done} / ${TOTAL_ARCH_ARTIFACTS}`}
        >
          <div className="big-progress-bar" style={{ width: `${pct}%` }} />
          <span>
            {done} / {TOTAL_ARCH_ARTIFACTS} · {pct}%
          </span>
        </div>
      </header>

      <section className="overview-section" aria-labelledby="arch-title">
        <h2 id="arch-title">
          {locale === "uk" ? "За архіаномаліями" : "By arch-anomalies"}
        </h2>
        <ul className="mh-type-status aa-overview-list">
          {ARCH_ARTIFACTS.map((a) => {
            const complete = collectedArchArtifactIds.has(a.id);
            return (
              <li key={a.id} className={complete ? "done" : "open"}>
                <div className="aa-overview-item">
                  <img
                    className="aa-overview-icon"
                    src={`/arch-artifacts/${a.id}.png?v=1`}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                  <div>
                    <strong>{locName(a, locale)}</strong>
                    <span>
                      {locAnomaly(a, locale)} · {locRegion(a, locale)}
                      {complete
                        ? locale === "uk"
                          ? " · зібрано"
                          : " · collected"
                        : locale === "uk"
                          ? " · ще шукати"
                          : " · still missing"}
                      {a.conditionUk ? ` · ${a.conditionUk}` : ""}
                    </span>
                  </div>
                </div>
                <Link
                  className="btn btn-ghost"
                  to={`/curiouser-curiouser?id=${a.id}`}
                >
                  {t("map")}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

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

      <section className="overview-section" aria-labelledby="pda-title">
        <h2 id="pda-title">
          {locale === "uk" ? "Перевірка" : "Tracking"}
        </h2>
        <p className="overview-lede">
          {locale === "uk"
            ? "Відмічайте зібране в списку або на мапі — прогрес зберігається в цьому браузері (або в хмарі, якщо увійти)."
            : "Mark collected items in the list or on the map — progress is saved in this browser (or in the cloud if you sign in)."}
        </p>
        <div className="choice-actions">
          <Link className="btn" to="/curiouser-curiouser/list">
            {locale === "uk" ? "Відкрити список" : "Open list"}
          </Link>
          <Link className="btn btn-ghost" to="/curiouser-curiouser">
            {locale === "uk" ? "Відкрити мапу" : "Open map"}
          </Link>
        </div>
      </section>
    </div>
  );
}
