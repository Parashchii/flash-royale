import { useRef, useState } from "react";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";

export function ProgressDataControls({ onDone }: { onDone?: () => void }) {
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
    onDone?.();
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      importJson(text);
      setMessage(t("imported"));
      onDone?.();
    } catch {
      setMessage(t("importFailed"));
    }
  };

  return (
    <div className="data-controls">
      <p className="profile-status">
        {t("dataStoredLocal")}
        {updatedAt > 0 ? (
          <>
            {" "}
            · {t("dataUpdated")}{" "}
            {new Date(updatedAt).toLocaleString(
              locale === "uk" ? "uk-UA" : "en-US",
            )}
          </>
        ) : null}
      </p>
      <div className="data-controls-actions">
        <button type="button" className="profile-action" onClick={onExport}>
          {t("exportJson")}
        </button>
        <button
          type="button"
          className="profile-action"
          onClick={() => fileRef.current?.click()}
        >
          {t("importJson")}
        </button>
        <button
          type="button"
          className="profile-action profile-action-danger"
          onClick={() => {
            if (confirm(t("resetConfirm"))) {
              reset();
              setMessage(t("resetDone"));
              onDone?.();
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
      {message ? <p className="hint">{message}</p> : null}
    </div>
  );
}
