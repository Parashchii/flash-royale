export type GearCategory = "weapon" | "helmet" | "armor";

export type ChoiceKey = "spark" | "polissya" | "ninth";

export type AnomalyType =
  | "chemical"
  | "gravitational"
  | "thermal"
  | "electro";

export type ArtifactRarity = "common" | "uncommon" | "rare" | "legendary";

export type Gear = {
  id: string;
  nameUk: string;
  nameEn: string;
  category: GearCategory;
  blueprintCount: number;
};

export type FlashLock = {
  kind: "story" | "choice" | "quest";
  summaryUk: string;
  summaryEn?: string;
  detailUk: string;
  detailEn?: string;
  choiceKey?: ChoiceKey | null;
  questUk?: string | null;
  questEn?: string | null;
};

export type FlashDrive = {
  id: string;
  nameUk: string;
  nameEn: string;
  upgradeUk: string;
  upgradeEn: string;
  gearId: string;
  region: string;
  regionEn: string;
  blueprintKey: string;
  /** In-game world X (east). */
  worldX?: number;
  /** In-game world Y (south). */
  worldY?: number;
  worldZ?: number;
  /** True when coordinates are region-approximate, not teleport-verified. */
  coordApprox?: boolean;
  /** How to reach the stash (Ukrainian). */
  accessUk?: string;
  lock?: FlashLock;
  notes?: string;
  /** Highlight on map as quest-gated (cannot reach without story). */
  questOnly?: boolean;
};

export type Artifact = {
  id: string;
  nameUk: string;
  nameEn: string;
  anomalyType: AnomalyType;
  rarity?: ArtifactRarity;
};

export type AnomalyField = {
  id: string;
  nameUk: string;
  nameEn: string;
  region: string;
  anomalyType: AnomalyType;
  worldX: number;
  worldY: number;
  coordApprox?: boolean;
  notes?: string;
};

/** Stationary scanner for Scanning Complete (10 required). */
export type Scanner = {
  id: string;
  nameUk: string;
  nameEn: string;
  region: string;
  regionEn: string;
  poiUk: string;
  poiEn: string;
  artifactId: string;
  artifactNameUk: string;
  artifactNameEn: string;
  worldX: number;
  worldY: number;
  worldZ?: number;
  accessUk: string;
  conditionUk?: string;
  notes?: string;
};

/** Arch-artifact for Curiouser and Curiouser! (6 required). */
export type ArchArtifact = {
  id: string;
  nameUk: string;
  nameEn: string;
  anomalyUk: string;
  anomalyEn: string;
  region: string;
  regionEn: string;
  worldX: number;
  worldY: number;
  worldZ?: number;
  accessUk: string;
  conditionUk?: string;
  notes?: string;
};

export type ArtifactStatus = "missing" | "found" | "present";

export type StoryChoices = {
  spark: boolean | null;
  polissya: boolean | null;
  ninth: boolean | null;
};

export type UserProgress = {
  collectedKeys: string[];
  /** Gear IDs marked as checked in the PDA audit screen. */
  verifiedGearIds: string[];
  /**
   * Miracle Hoarder: artifacts currently present in inventory/stash.
   * Counts toward the achievement.
   */
  collectedArtifactIds: string[];
  /**
   * Miracle Hoarder: artifacts seen/found in an anomaly field,
   * but not (yet) held for the achievement.
   */
  foundArtifactIds: string[];
  /** Scanner IDs activated for Scanning Complete. */
  collectedScannerIds: string[];
  /** Arch-artifact IDs collected for Curiouser and Curiouser! */
  collectedArchArtifactIds: string[];
  choices: StoryChoices;
  updatedAt: number;
};

export const EMPTY_CHOICES: StoryChoices = {
  spark: null,
  polissya: null,
  ninth: null,
};

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  chemical: "Хімічні",
  gravitational: "Гравітаційні",
  thermal: "Термічні",
  electro: "Електричні",
};

export const ANOMALY_TYPES: AnomalyType[] = [
  "chemical",
  "gravitational",
  "thermal",
  "electro",
];

export const CHOICE_LABELS: Record<
  ChoiceKey,
  { title: string; yes: string; no: string; help: string }
> = {
  spark: {
    title: "НДІЧАЗ — сторона «Іскра»",
    yes: "Обрав Іскру",
    no: "Не обрав Іскру",
    help: "Потрібно для флешки «Зубр-19: Анатомічне припасування» на Дузі.",
  },
  polissya: {
    title: "Маршрут через «Полісся»",
    yes: "Йду через Полісся",
    no: "Інший маршрут",
    help: "Потрібно для «Сайга Д-12: Ребаланс приклада».",
  },
  ninth: {
    title: "Квест «Потеряні хлопці» — Девʼятий",
    yes: "Допоміг Девʼятому",
    no: "Не допомагав / інший вибір",
    help: "Потрібно для «M10 Gordon: Гумовий шар».",
  },
};

export const CHOICE_LABELS_EN: Record<
  ChoiceKey,
  { title: string; yes: string; no: string; help: string }
> = {
  spark: {
    title: "SIRCAA — Spark side",
    yes: "Chose Spark",
    no: "Did not choose Spark",
    help: "Required for the Zubr-19 Anatomical Adjustment flash drive on Duga.",
  },
  polissya: {
    title: "Route via Polissya",
    yes: "Going through Polissya",
    no: "Another route",
    help: "Required for Saiga D-12 Stock Rebalance.",
  },
  ninth: {
    title: "The Lost Boys quest — The Ninth",
    yes: "Helped The Ninth",
    no: "Did not help / other choice",
    help: "Required for M10 Gordon Rubber Layer.",
  },
};
