import { useLocale } from "../i18n/LocaleContext";
import type { Locale } from "../i18n/messages";

export function LangSwitcher() {
  const { locale, setLocale, t } = useLocale();

  const pick = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div className="lang-switcher" role="group" aria-label={t("langSwitcher")}>
      <button
        type="button"
        className={locale === "uk" ? "lang-btn active" : "lang-btn"}
        aria-pressed={locale === "uk"}
        onClick={() => pick("uk")}
      >
        {t("langUk")}
      </button>
      <button
        type="button"
        className={locale === "en" ? "lang-btn active" : "lang-btn"}
        aria-pressed={locale === "en"}
        onClick={() => pick("en")}
      >
        {t("langEn")}
      </button>
    </div>
  );
}
