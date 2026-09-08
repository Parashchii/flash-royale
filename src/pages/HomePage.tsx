import { useEffect } from "react";
import {
  FlashHowTo,
  FlashPdaCheck,
  FlashProgressBar,
} from "../components/FlashCheckPanel";

export function HomePage() {
  useEffect(() => {
    if (window.location.hash !== "#pda-check") return;
    requestAnimationFrame(() => {
      document.getElementById("pda-check")?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  return (
    <div className="page overview-page">
      <header className="hero-home">
        <p className="lede">
          Трекер усіх флешок із покращеннями для досягнення Flash Royale.
        </p>
        <FlashProgressBar />
      </header>

      <section className="overview-section" aria-labelledby="howto-title">
        <h2 id="howto-title">Як користуватися</h2>
        <FlashHowTo />
      </section>

      <FlashPdaCheck />
    </div>
  );
}
