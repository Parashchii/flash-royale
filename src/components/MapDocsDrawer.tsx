import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TOTAL_ARCH_ARTIFACTS,
  TOTAL_ARTIFACTS,
  TOTAL_SCANNERS,
  TOTAL_UNIQUE,
  UNIQUE_BLUEPRINT_KEYS,
  trackedArtifactIds,
} from "../data/catalog";
import { useAchievement } from "../hooks/useAchievement";
import { useMapDrawer } from "../hooks/useMapDrawer";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { MapSidePanel } from "./MapSidePanel";

export function MapDocsDrawer({
  list,
  overview,
}: {
  list: ReactNode;
  overview: ReactNode;
}) {
  const { t } = useLocale();
  const { achievementId } = useAchievement();
  const {
    collectedKeys,
    collectedArtifactIds,
    foundArtifactIds,
    collectedScannerIds,
    collectedArchArtifactIds,
  } = useProgress();
  const drawer = useMapDrawer();
  const [params, setParams] = useSearchParams();
  const progress = useMemo(() => {
    const artifacts = trackedArtifactIds(
      collectedArtifactIds,
      foundArtifactIds,
    );
    if (achievementId === "miracle-hoarder") {
      return { done: artifacts.size, total: TOTAL_ARTIFACTS };
    }
    if (achievementId === "scanning-complete") {
      return { done: collectedScannerIds.size, total: TOTAL_SCANNERS };
    }
    if (achievementId === "curiouser-curiouser") {
      return {
        done: collectedArchArtifactIds.size,
        total: TOTAL_ARCH_ARTIFACTS,
      };
    }
    const flashDone = UNIQUE_BLUEPRINT_KEYS.filter((k) =>
      collectedKeys.has(k),
    ).length;
    return { done: flashDone, total: TOTAL_UNIQUE };
  }, [
    achievementId,
    collectedArchArtifactIds,
    collectedArtifactIds,
    collectedKeys,
    collectedScannerIds,
    foundArtifactIds,
  ]);
  const setCheckOpen = drawer?.setCheckOpen;
  const viewParam = params.get("view");
  const view = viewParam === "list" ? "list" : "overview";
  const openedForView = useRef<string | null>(null);

  useEffect(() => {
    if (viewParam !== "list" && viewParam !== "overview") {
      openedForView.current = null;
      return;
    }
    if (openedForView.current === viewParam) return;
    openedForView.current = viewParam;
    setCheckOpen?.(true);
  }, [viewParam, setCheckOpen]);

  const setView = (next: "list" | "overview") => {
    setParams((prev) => {
      const copy = new URLSearchParams(prev);
      copy.set("view", next);
      return copy;
    }, { replace: true });
  };

  return (
    <div className="map-tools-end">
      <MapSidePanel
        title={t("pdaCheckTitle")}
        side="right"
        icon="check"
        headerExtra={
          <nav className="check-seg check-seg-strong" aria-label={t("navAria")}>
            <button
              type="button"
              className={
                view === "list" ? "section-seg-btn active" : "section-seg-btn"
              }
              onClick={() => setView("list")}
            >
              {t("navList")}
            </button>
            <button
              type="button"
              className={
                view === "overview" ? "section-seg-btn active" : "section-seg-btn"
              }
              onClick={() => setView("overview")}
            >
              {t("navProgress")} {progress.done}/{progress.total}
            </button>
          </nav>
        }
      >
        <div className="check-panel">
          <div className="check-panel-body drawer-docs">
            {view === "list" ? list : overview}
          </div>
        </div>
      </MapSidePanel>
    </div>
  );
}
