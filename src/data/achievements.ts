import {
  TOTAL_ARCH_ARTIFACTS,
  TOTAL_ARTIFACTS,
  TOTAL_SCANNERS,
  TOTAL_UNIQUE,
} from "./catalog";

export type AchievementId =
  | "flash-royale"
  | "miracle-hoarder"
  | "scanning-complete"
  | "curiouser-curiouser"
  | "show-all";

export type AchievementMeta = {
  id: AchievementId;
  nameEn: string;
  nameUk: string;
  /** Short label in the brand bar */
  brandLabel: string;
  totalItems: number;
};

export const ACHIEVEMENTS: Record<AchievementId, AchievementMeta> = {
  "flash-royale": {
    id: "flash-royale",
    nameEn: "Flash Royale",
    nameUk: "Флешка Рояль",
    brandLabel: "Flash Royale",
    totalItems: TOTAL_UNIQUE,
  },
  "miracle-hoarder": {
    id: "miracle-hoarder",
    nameEn: "Miracle Hoarder",
    nameUk: "Збирач див",
    brandLabel: "Miracle Hoarder",
    totalItems: TOTAL_ARTIFACTS,
  },
  "scanning-complete": {
    id: "scanning-complete",
    nameEn: "Scanning Complete",
    nameUk: "Сканування завершено",
    brandLabel: "Scanning Complete",
    totalItems: TOTAL_SCANNERS,
  },
  "curiouser-curiouser": {
    id: "curiouser-curiouser",
    nameEn: "Curiouser and Curiouser!",
    nameUk: "Все цікавіше й цікавіше",
    brandLabel: "Curiouser and Curiouser!",
    totalItems: TOTAL_ARCH_ARTIFACTS,
  },
  "show-all": {
    id: "show-all",
    nameEn: "Show all",
    nameUk: "показати всі",
    brandLabel: "Show all (показати всі)",
    totalItems:
      TOTAL_UNIQUE + TOTAL_ARTIFACTS + TOTAL_SCANNERS + TOTAL_ARCH_ARTIFACTS,
  },
};

export const ACHIEVEMENT_LIST = Object.values(ACHIEVEMENTS);

export const DEFAULT_ACHIEVEMENT: AchievementId = "flash-royale";

export function isAchievementId(
  value: string | undefined,
): value is AchievementId {
  return (
    value === "flash-royale" ||
    value === "miracle-hoarder" ||
    value === "scanning-complete" ||
    value === "curiouser-curiouser" ||
    value === "show-all"
  );
}
