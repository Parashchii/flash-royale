import { useRef, useState } from "react";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";

export function DataPage() {
  const { t, locale } = useLocale();
  const { exportJson, importJson, reset, updatedAt } = useProgress();
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flash-royale-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t("exported"));
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      importJson(text);
      setMessage(t("imported"));
    } catch {
      setMessage(t("importFailed"));
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("dataTitle")}</h1>
        <p>
          {t("dataStoredLocal")}
          {updatedAt > 0 && (
            <>
              {" "}
              · {t("dataUpdated")}{" "}
              {new Date(updatedAt).toLocaleString(
                locale === "uk" ? "uk-UA" : "en-US",
              )}
            </>
          )}
        </p>
      </header>

      <div className="choice-actions">
        <button type="button" className="btn" onClick={onExport}>
          {t("exportJson")}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => fileRef.current?.click()}
        >
          {t("importJson")}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (confirm(t("resetConfirm"))) {
              reset();
              setMessage(t("resetDone"));
            }
          }}
        >
          {t("resetProgress")}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onImportFile(f);
          e.target.value = "";
        }}
      />
      {message && <p className="hint">{message}</p>}
    </div>
  );
}
