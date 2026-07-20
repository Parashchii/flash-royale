import type { AnomalyType } from "../data/types";
import type { Locale } from "./messages";

/** Pick a bilingual field by active locale. */
export function locName(
  item: { nameUk: string; nameEn: string },
  locale: Locale,
): string {
  return locale === "uk" ? item.nameUk : item.nameEn;
}

export function locUpgrade(
  item: { upgradeUk: string; upgradeEn: string },
  locale: Locale,
): string {
  return locale === "uk" ? item.upgradeUk : item.upgradeEn;
}

export function locRegion(
  item: { region: string; regionEn?: string },
  locale: Locale,
): string {
  if (locale === "en" && item.regionEn) return item.regionEn;
  return item.region;
}

export function locAnomaly(
  item: { anomalyUk: string; anomalyEn: string },
  locale: Locale,
): string {
  return locale === "uk" ? item.anomalyUk : item.anomalyEn;
}

export function locPoi(
  item: { poiUk: string; poiEn?: string },
  locale: Locale,
): string {
  if (locale === "en" && item.poiEn) return item.poiEn;
  return item.poiUk;
}

export function locField(
  uk: string,
  en: string | undefined | null,
  locale: Locale,
): string {
  return locale === "en" && en ? en : uk;
}

const ANOMALY_TYPE_I18N: Record<AnomalyType, { uk: string; en: string }> = {
  chemical: { uk: "Хімічні", en: "Chemical" },
  gravitational: { uk: "Гравітаційні", en: "Gravitational" },
  thermal: { uk: "Термічні", en: "Thermal" },
  electro: { uk: "Електричні", en: "Electro" },
};

export function anomalyTypeLabel(type: AnomalyType, locale: Locale): string {
  return ANOMALY_TYPE_I18N[type][locale];
}
