import { ProgressDataControls } from "../components/ProgressDataControls";
import { useLocale } from "../i18n/LocaleContext";

export function DataPage() {
  const { t } = useLocale();

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("dataTitle")}</h1>
        <p>{t("dataStoredLocal")}</p>
      </header>
      <ProgressDataControls />
    </div>
  );
}
