import type { AnomalyType } from "../data/types";
import type { Locale } from "./messages";

/** Pick a bilingual field by active locale. */
export function locName(
  item: { nameUk: string; nameEn: string },
  locale: Locale,
): string {
  return locale === "uk" ? item.nameUk : item.nameEn;
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

export function locField(
  uk: string,
  en: string | undefined,
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
