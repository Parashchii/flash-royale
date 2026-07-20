import { Link } from "react-router-dom";
import { ACHIEVEMENTS, type AchievementId } from "../data/achievements";
import { useLocale } from "../i18n/LocaleContext";
import { locName } from "../i18n/localize";
import flashImg from "../assets/landing/landing-flashdrive.jpg";
import berryImg from "../assets/landing/landing-thunder-berry.jpg";
import scannerImg from "../assets/landing/landing-scanner.jpg";
import flowerImg from "../assets/landing/landing-weird-flower.jpg";
import poppyImg from "../assets/landing/landing-poppy-field.jpg";

type TrackerCard = {
  id: Exclude<AchievementId, "show-all">;
  to: string;
  image: string;
};

const TRACKERS: TrackerCard[] = [
  {
    id: "flash-royale",
    to: "/flash-royale",
    image: flashImg,
  },
  {
    id: "miracle-hoarder",
    to: "/miracle-hoarder",
    image: berryImg,
  },
  {
    id: "scanning-complete",
    to: "/scanning-complete",
    image: scannerImg,
  },
  {
    id: "curiouser-curiouser",
    to: "/curiouser-curiouser",
    image: flowerImg,
  },
];

export function LandingPage() {
  const { t, locale } = useLocale();

  return (
    <div className="page landing">
      <section className="landing-hero">
        <h1 className="landing-title">{t("landingTitle")}</h1>
      </section>

      <section className="landing-section" aria-labelledby="landing-show-all">
        <Link
          id="landing-show-all"
          className="landing-tile landing-show-all"
          to="/show-all"
          style={{ backgroundImage: `url(${poppyImg})` }}
        >
          <span className="landing-tile-label">
            {locName(ACHIEVEMENTS["show-all"], locale)}
          </span>
        </Link>
      </section>

      <section className="landing-section" aria-labelledby="landing-trackers">
        <h2 id="landing-trackers" className="visually-hidden">
          {t("landingSectionTrackers")}
        </h2>
        <div className="landing-grid landing-grid-trackers">
          {TRACKERS.map((card) => (
            <Link
              key={card.id}
              className={`landing-tile landing-tile-square landing-tile-${card.id}`}
              to={card.to}
              style={{ backgroundImage: `url(${card.image})` }}
            >
              <span className="landing-tile-label">
                {locName(ACHIEVEMENTS[card.id], locale)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
