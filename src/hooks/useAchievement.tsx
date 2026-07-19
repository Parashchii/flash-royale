import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  ACHIEVEMENTS,
  DEFAULT_ACHIEVEMENT,
  isAchievementId,
  type AchievementId,
  type AchievementMeta,
} from "../data/achievements";

type AchievementContextValue = {
  achievement: AchievementMeta;
  achievementId: AchievementId;
};

const AchievementContext = createContext<AchievementContextValue | null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { achievementId: raw } = useParams();
  const valid = isAchievementId(raw);
  const id: AchievementId = valid ? raw : DEFAULT_ACHIEVEMENT;

  const value = useMemo(() => {
    return { achievement: ACHIEVEMENTS[id], achievementId: id };
  }, [id]);

  if (!valid) {
    return <Navigate to={`/${DEFAULT_ACHIEVEMENT}`} replace />;
  }

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievement() {
  const ctx = useContext(AchievementContext);
  if (!ctx) {
    throw new Error("useAchievement must be used within AchievementProvider");
  }
  return ctx;
}

export function useAchievementOptional() {
  return useContext(AchievementContext);
}

/** Swap achievement prefix, keep the rest of the path when possible. */
export function swapAchievementPath(
  pathname: string,
  nextId: AchievementId,
): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${nextId}`;
  if (isAchievementId(parts[0])) {
    // Show-all is map-only — drop list/overview suffixes.
    if (nextId === "show-all") return `/${nextId}`;
    parts[0] = nextId;
    return `/${parts.join("/")}`;
  }
  return `/${nextId}`;
}
