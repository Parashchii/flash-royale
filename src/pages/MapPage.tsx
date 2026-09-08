import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FLASHDRIVES,
  REGIONS,
  allLocationsForKey,
  gearById,
} from "../data/catalog";
import type { FlashDrive, GearCategory } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { statusOf } from "../lib/status";
import {
  pdaMapOptions,
  pdaTileLayer,
  worldToLatLng,
} from "../lib/mapCoords";
import { addRegionHoverLayer } from "../lib/regionOverlay";
import { useLocale } from "../i18n/LocaleContext";
import { locField, locName, locRegion, locUpgrade } from "../i18n/localize";
import { FilterChoiceList } from "../components/FilterCard";
import { GuaranteeFab } from "../components/GuaranteeFab";
import { MapDrawerBlock, MapLegend } from "../components/MapLegend";
import { MapSidePanel } from "../components/MapSidePanel";
import { MapDocsDrawer } from "../components/MapDocsDrawer";
import { FlashdrivesPage } from "./FlashdrivesPage";
import { HomePage } from "./HomePage";
import {
  FlashGlyph,
  TRACKER_MARKER_SIZE,
  flashMarkerHtml,
} from "../components/TrackerMarkerGlyphs";

type StatusFilter = "all" | "missing" | "collected" | "locked" | "locked_missed";

/** Verified platform note for the SIRCAA save-reload trick. */
const QUEST_ONLY_PATCH = "1.010";

function isDuplicateLocation(f: FlashDrive): boolean {
  return allLocationsForKey(f.blueprintKey).length > 1;
}

function markerHtml(
  status: string,
  approx: boolean,
  duplicate: boolean,
  questOnly: boolean,
): string {
  // Quest-only (НДІЧАЗ) stays red so it remains identifiable on the map
  let tone: string;
  if (questOnly) {
    tone = "quest-only";
  } else if (status === "collected" || status === "locked_missed") {
    tone = status;
  } else if (duplicate) {
    tone = "duplicate";
  } else {
    tone = status;
  }
  return flashMarkerHtml(tone, approx ? " fr-marker-approx" : "");
}

export function MapPage() {
  const { t, locale } = useLocale();
  const { collectedKeys, choices, toggleCollected } = useProgress();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("id");

  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState<"all" | GearCategory>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [spoilers, setSpoilers] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const filtered = useMemo(() => {
    return FLASHDRIVES.filter((f) => {
      if (f.worldX == null || f.worldY == null) return false;
      const gear = gearById[f.gearId];
      if (region !== "all" && f.region !== region) return false;
      if (category !== "all" && gear?.category !== category) return false;
      const st = statusOf(f, collectedKeys, choices);
      if (status === "missing" && st !== "missing") return false;
      if (status === "collected" && st !== "collected") return false;
      if (status === "locked_missed" && st !== "locked_missed") return false;
      if (status === "locked" && !f.lock) return false;
      return true;
    });
  }, [region, category, status, collectedKeys, choices]);

  const selected: FlashDrive | null = useMemo(() => {
    if (!selectedId) return null;
    return FLASHDRIVES.find((f) => f.id === selectedId) ?? null;
  }, [selectedId]);

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, pdaMapOptions());

    pdaTileLayer().addTo(map);

    addRegionHoverLayer(map);
    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = group;

    // Fix size after layout
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    markersRef.current.clear();

    for (const f of filtered) {
      if (f.worldX == null || f.worldY == null) continue;
      const st = statusOf(f, collectedKeys, choices);
      const icon = L.divIcon({
        className: "fr-marker-wrap",
        html: markerHtml(
          st,
          Boolean(f.coordApprox),
          isDuplicateLocation(f),
          Boolean(f.questOnly),
        ),
        iconSize: [TRACKER_MARKER_SIZE, TRACKER_MARKER_SIZE],
        iconAnchor: [TRACKER_MARKER_SIZE / 2, TRACKER_MARKER_SIZE / 2],
      });
      const marker = L.marker(worldToLatLng(f.worldX, f.worldY), { icon });
      marker.on("click", () => {
        setSelectedId(f.id);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("id", f.id);
          return next;
        });
      });
      marker.addTo(group);
      markersRef.current.set(f.id, marker);
    }
  }, [filtered, collectedKeys, choices, setParams]);

  // Focus from URL / selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const f = FLASHDRIVES.find((d) => d.id === selectedId);
    if (!f || f.worldX == null || f.worldY == null) return;
    const ll = worldToLatLng(f.worldX, f.worldY);
    map.setView(ll, Math.max(map.getZoom(), 4), { animate: true });
    setSelectedId(selectedId);
  }, [selectedId, focusId]);

  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

  const closeSheet = () => {
    setSelectedId(null);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
  };

  return (
    <div className="page map-page">
      <div className="map-tools">
        <MapSidePanel title={t("routeBuildTitle")}>
          <div className="map-filters-card">
            <MapDrawerBlock title={t("mapPanelTitle")} defaultOpen>
              <div className="mh-filter-stack">
                <div>
                  <h3 className="filter-card-title">{t("region")}</h3>
                  <FilterChoiceList
                    label={t("region")}
                    value={region}
                    onChange={setRegion}
                    options={[
                      { value: "all", label: t("statusAll") },
                      ...REGIONS.map((r) => ({ value: r, label: r })),
                    ]}
                  />
                </div>
                <div>
                  <h3 className="filter-card-title">{t("category")}</h3>
                  <FilterChoiceList
                    label={t("category")}
                    value={category}
                    onChange={(next) => setCategory(next as typeof category)}
                    options={[
                      { value: "all", label: t("statusAll") },
                      { value: "weapon", label: t("categoryWeapon") },
                      { value: "helmet", label: t("categoryHelmet") },
                      { value: "armor", label: t("categoryArmor") },
                    ]}
                  />
                </div>
                <div>
                  <h3 className="filter-card-title">{t("status")}</h3>
                  <FilterChoiceList
                    label={t("status")}
                    value={status}
                    onChange={(next) => setStatus(next as StatusFilter)}
                    options={[
                      { value: "all", label: t("statusAll") },
                      { value: "missing", label: t("statusMissing") },
                      { value: "collected", label: t("statusCollected") },
                      { value: "locked", label: t("statusLocked") },
                      { value: "locked_missed", label: t("statusLockedMissed") },
                    ]}
                  />
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={spoilers}
                    onChange={(e) => setSpoilers(e.target.checked)}
                  />
                  {t("spoilers")}
                </label>
              </div>
            </MapDrawerBlock>
            <MapDrawerBlock title={t("routeFarm")} defaultOpen>
              <p className="mh-route-wip">{t("routeWip")}</p>
            </MapDrawerBlock>
          </div>

          <MapLegend>
            <ul className="hint map-legend">
            <li>
              <span className="fr-marker fr-marker-missing legend-swatch">
                <FlashGlyph size={16} />
              </span>
              {t("legendMissing")}
            </li>
            <li>
              <span className="fr-marker fr-marker-duplicate legend-swatch">
                <FlashGlyph size={16} />
              </span>
              {t("legendDuplicate")}
            </li>
            <li>
              <span className="fr-marker fr-marker-quest-only legend-swatch">
                <FlashGlyph size={16} />
              </span>
              {t("legendQuestSircaa")}
            </li>
            <li>
              <span className="fr-marker fr-marker-collected legend-swatch">
                <FlashGlyph size={16} />
              </span>
              {t("legendCollected")}
            </li>
            <li>
              <span className="fr-marker fr-marker-locked_missed legend-swatch">
                <FlashGlyph size={16} />
              </span>
              {t("legendLocked")}
            </li>
            </ul>
          </MapLegend>
        </MapSidePanel>
        <GuaranteeFab title={t("flashGuaranteeTitle")}>
        <ul className="guarantee-list">
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              {t("flashGuarantee1Before")}{" "}
              <Link
                className="guarantee-link"
                to="/flash-royale?id=integral-a-return-mechanism-sircaa"
              >
                {t("flashGuarantee1Link")}
              </Link>{" "}
              {t("flashGuarantee1After")}
            </span>
          </li>
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              {t("flashGuarantee2Before")}{" "}
              <strong>{t("flashGuarantee2Strong")}</strong>
              {t("flashGuarantee2After")}
            </span>
          </li>
        </ul>
      </GuaranteeFab>
      </div>

      <MapDocsDrawer list={<FlashdrivesPage />} overview={<HomePage />} />

      <div className="map-stage">
        <div ref={mapEl} className="pda-map" role="application" aria-label={t("mapAria")} />

        {selected && (
          <aside className="map-sheet" aria-live="polite">
            <button
              type="button"
              className="sheet-close"
              onClick={closeSheet}
              aria-label={t("close")}
            >
              ×
            </button>
            <h2 className="sheet-title">
              {locName(selected, locale)}
              <span className="sheet-title-en">
                {locale === "uk" ? selected.nameEn : selected.nameUk}
              </span>
            </h2>
            <p className="flash-meta">
              {gearById[selected.gearId]
                ? locName(gearById[selected.gearId], locale)
                : selected.gearId}{" "}
              · {locRegion(selected, locale)}
              {selected.coordApprox ? ` · ${t("approxCoords")}` : ""}
            </p>
            {selected.questOnly && (
              <span className="quest-only-badge">{t("questOnlyBadge")}</span>
            )}
            {isDuplicateLocation(selected) && (
              <span className="dup-badge">
                {t("duplicateBadge")} ·{" "}
                {allLocationsForKey(selected.blueprintKey)
                  .map((a) => locRegion(a, locale))
                  .join(" / ")}
              </span>
            )}
            {selected.accessUk && (
              <p className="access-hint sheet-access">{selected.accessUk}</p>
            )}
            {selected.lock && (
              <>
                <span className="lock-badge">
                  {t("statusLocked")}
                  {selected.lock.questUk
                    ? ` · ${locField(selected.lock.questUk, selected.lock.questEn, locale)}`
                    : ""}
                </span>
                <p className="lock-summary">
                  {locField(
                    selected.lock.summaryUk,
                    selected.lock.summaryEn,
                    locale,
                  )}
                </p>
                {spoilers && (
                  <p className="lock-detail">
                    {locField(
                      selected.lock.detailUk,
                      selected.lock.detailEn,
                      locale,
                    )}
                  </p>
                )}
              </>
            )}
            {selected.questOnly && selected.notes && (
              <div className="quest-only-note">
                <p>{selected.notes}</p>
                <div className="platform-tags">
                  <span className="platform-tag platform-ok">
                    {t("platformOkPrefix")} {t("verifyDate")},{" "}
                    {t("platformOkPatch")} {QUEST_ONLY_PATCH}
                  </span>
                  <span className="platform-tag platform-unverified">
                    {t("platformPcNo")}
                  </span>
                  <span className="platform-tag platform-unverified">
                    {t("platformXboxNo")}
                  </span>
                </div>
              </div>
            )}
            {!selected.questOnly && selected.notes && (
              <p className="notes">{selected.notes}</p>
            )}
            {statusOf(selected, collectedKeys, choices) === "locked_missed" && (
              <p className="ps5-miss">{t("lockedMissedNote")}</p>
            )}
            <label className="flash-check compact sheet-check">
              <input
                type="checkbox"
                checked={collectedKeys.has(selected.blueprintKey)}
                onChange={() => toggleCollected(selected.blueprintKey)}
              />
              <span>{t("statusCollected")}</span>
            </label>
            <div className="choice-actions">
              <Link
                className="btn btn-ghost"
                to={`/flash-royale?view=list&q=${encodeURIComponent(locUpgrade(selected, locale))}`}
              >
                {t("inList")}
              </Link>
              <Link className="btn btn-ghost" to="/flash-royale?view=overview">
                {t("overview")}
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
