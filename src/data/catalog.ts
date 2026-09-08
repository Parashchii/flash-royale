import gearJson from "./gear.json";
import flashdrivesJson from "./flashdrives.json";
import artifactsJson from "./artifacts.json";
import anomalyFieldsJson from "./anomalyFields.json";
import scannersJson from "./scanners.json";
import archArtifactsJson from "./archArtifacts.json";
import nonStopJson from "./nonStop.json";
import type {
  AnomalyField,
  AnomalyType,
  ArchArtifact,
  Artifact,
  FlashDrive,
  Gear,
  NonStopCan,
  Scanner,
} from "./types";

export const GEAR = gearJson as Gear[];
export const FLASHDRIVES = flashdrivesJson as FlashDrive[];
export const ARTIFACTS = artifactsJson as Artifact[];
export const ANOMALY_FIELDS = anomalyFieldsJson as AnomalyField[];
export const SCANNERS = scannersJson as Scanner[];
export const ARCH_ARTIFACTS = archArtifactsJson as ArchArtifact[];
export const NON_STOP_CANS = nonStopJson as NonStopCan[];

/** Unique blueprint keys required for the achievement (alt locations share a key). */
export const UNIQUE_BLUEPRINT_KEYS = [
  ...new Set(FLASHDRIVES.map((f) => f.blueprintKey)),
];

export const TOTAL_UNIQUE = UNIQUE_BLUEPRINT_KEYS.length;

export const TOTAL_ARTIFACTS = ARTIFACTS.length;

/** Artifacts marked found (in anomaly) or present (elsewhere) both count as collected. */
export function trackedArtifactIds(
  presentIds: Set<string>,
  foundIds: Set<string>,
): Set<string> {
  if (foundIds.size === 0) return presentIds;
  const ids = new Set(presentIds);
  for (const id of foundIds) ids.add(id);
  return ids;
}

export const TOTAL_SCANNERS = SCANNERS.length;

export const SCANNER_REGIONS = [
  ...new Set(SCANNERS.map((s) => s.region)),
].sort((a, b) => a.localeCompare(b, "uk"));

export const scannerById = Object.fromEntries(
  SCANNERS.map((s) => [s.id, s]),
) as Record<string, Scanner>;

export const TOTAL_ARCH_ARTIFACTS = ARCH_ARTIFACTS.length;

export const ARCH_REGIONS = [
  ...new Set(ARCH_ARTIFACTS.map((a) => a.region)),
].sort((a, b) => a.localeCompare(b, "uk"));

export const archArtifactById = Object.fromEntries(
  ARCH_ARTIFACTS.map((a) => [a.id, a]),
) as Record<string, ArchArtifact>;

export const TOTAL_NON_STOP = NON_STOP_CANS.length;

export const nonStopById = Object.fromEntries(
  NON_STOP_CANS.map((c) => [c.id, c]),
) as Record<string, NonStopCan>;

export const REGIONS = [
  ...new Set(FLASHDRIVES.map((f) => f.region)),
].sort((a, b) => a.localeCompare(b, "uk"));

export const gearById = Object.fromEntries(GEAR.map((g) => [g.id, g])) as Record<
  string,
  Gear
>;

export const artifactById = Object.fromEntries(
  ARTIFACTS.map((a) => [a.id, a]),
) as Record<string, Artifact>;

export function flashdrivesForGear(gearId: string): FlashDrive[] {
  const seen = new Set<string>();
  const out: FlashDrive[] = [];
  for (const f of FLASHDRIVES) {
    if (f.gearId !== gearId) continue;
    if (seen.has(f.blueprintKey)) continue;
    seen.add(f.blueprintKey);
    out.push(f);
  }
  return out;
}

export function allLocationsForKey(blueprintKey: string): FlashDrive[] {
  return FLASHDRIVES.filter((f) => f.blueprintKey === blueprintKey);
}

export function artifactsForType(type: AnomalyType): Artifact[] {
  return ARTIFACTS.filter((a) => a.anomalyType === type);
}

export function anomalyFieldsForType(type: AnomalyType): AnomalyField[] {
  return ANOMALY_FIELDS.filter((f) => f.anomalyType === type);
}

export const ANOMALY_REGIONS = [
  ...new Set(ANOMALY_FIELDS.map((f) => f.region)),
].sort((a, b) => a.localeCompare(b, "uk"));

export const ANOMALY_REGION_EN: Record<string, string> = {
  Болота: "Swamps",
  Градирні: "Cooling Towers",
  "Дикий острів": "Wild Island",
  Дуга: "Duga",
  Затон: "Zaton",
  "Згорілий ліс": "Burnt Forest",
  Кордон: "Cordon",
  Малахіт: "Malachite",
  "Прип'ять": "Prypiat",
  Росток: "Rostok",
  "Рудий ліс": "Red Forest",
  Смітник: "Garbage",
  Хімзавод: "Chemical Plant",
  "Цементний завод": "Cement Factory",
  Юпітер: "Jupiter",
  Янів: "Yaniv",
  Янтар: "Yantar",
};

export function missingArtifactTypes(
  collectedIds: Set<string>,
): Set<AnomalyType> {
  const missing = new Set<AnomalyType>();
  for (const a of ARTIFACTS) {
    if (!collectedIds.has(a.id)) missing.add(a.anomalyType);
  }
  return missing;
}

export function artifactTypeProgress(collectedIds: Set<string>): Record<
  AnomalyType,
  { got: number; total: number }
> {
  const out: Record<AnomalyType, { got: number; total: number }> = {
    chemical: { got: 0, total: 0 },
    gravitational: { got: 0, total: 0 },
    thermal: { got: 0, total: 0 },
    electro: { got: 0, total: 0 },
  };
  for (const a of ARTIFACTS) {
    out[a.anomalyType].total += 1;
    if (collectedIds.has(a.id)) out[a.anomalyType].got += 1;
  }
  return out;
}
