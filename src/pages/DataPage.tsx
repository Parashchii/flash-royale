import { useRef, useState } from "react";
import { useProgress } from "../hooks/useProgress";

export function DataPage() {
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
    setMessage("Експортовано.");
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      importJson(text);
      setMessage("Імпортовано.");
    } catch {
      setMessage("Не вдалося прочитати файл.");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Дані</h1>
        <p>
          Зберігається в цьому браузері
          {updatedAt > 0 && (
            <>
              {" "}
              · оновлено {new Date(updatedAt).toLocaleString("uk-UA")}
            </>
          )}
        </p>
      </header>

      <div className="choice-actions">
        <button type="button" className="btn" onClick={onExport}>
          Export JSON
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => fileRef.current?.click()}
        >
          Import JSON
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (confirm("Скинути весь прогрес?")) {
              reset();
              setMessage("Прогрес скинуто.");
            }
          }}
        >
          Скинути прогрес
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
