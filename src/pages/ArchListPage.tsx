import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ARCH_ARTIFACTS, TOTAL_ARCH_ARTIFACTS } from "../data/catalog";
import type { ArchArtifact } from "../data/types";
import { useMapDrawer } from "../hooks/useMapDrawer";
import { useProgress } from "../hooks/useProgress";
import { useLocale } from "../i18n/LocaleContext";
import { locAnomaly, locName, locRegion } from "../i18n/localize";
import { CountProgressMark } from "../components/AnomalyTypeIcon";
import { ListToolbar } from "../components/ListToolbar";
import {
  InspectableShelf,
  archIconSrc,
} from "../components/MiracleArtifactShelf";

type ViewMode = "list" | "grid";
type ArchStatus = "missing" | "collected";

const VIEW_STORAGE_KEY = "curiouser-list-view";

function readStoredView(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw === "list" || raw === "grid") return raw;
  } catch {
    /* ignore */
  }
  return "list";
}

function ArchStatusSelect({
  value,
  artifactName,
  onChange,
}: {
  value: ArchStatus;
  artifactName: string;
  onChange: (status: ArchStatus) => void;
}) {
  const { t } = useLocale();
  return (
    <label className={`mh-status-select status-${value}`}>
      <span className="visually-hidden">{t("artifactStatus")}</span>
      <select
        value={value}
        aria-label={`${t("artifactStatus")}: ${artifactName}`}
        onChange={(e) => onChange(e.target.value as ArchStatus)}
      >
        <option value="missing">{t("statusMissing")}</option>
        <option value="collected">{t("statusCollected")}</option>
      </select>
    </label>
  );
}

export function ArchListPage() {
  const { t, locale } = useLocale();
  const { collectedArchArtifactIds, toggleArchArtifact } = useProgress();
  const drawer = useMapDrawer();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [view, setView] = useState<ViewMode>(() => readStoredView());

  const setViewPersist = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ARCH_ARTIFACTS;
    return ARCH_ARTIFACTS.filter((a) => {
      const hay =
        `${a.nameUk} ${a.nameEn} ${a.region} ${a.regionEn} ${a.anomalyUk} ${a.anomalyEn} ${a.accessUk}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q]);

  const collectedLabel = `${collectedArchArtifactIds.size}/${TOTAL_ARCH_ARTIFACTS} ${t("collectedOf")}`;

  return (
    <div className="page">
      <header className="page-header mh-list-header mh-list-header-tools">
        <ListToolbar
          search={q}
          onSearch={setQ}
          searchPlaceholder={t("searchGeneric")}
          view={view}
          onView={setViewPersist}
        />
      </header>

      {filtered.length === 0 ? (
        <p className="hint">{t("noResults")}</p>
      ) : (
        <section
          className="overview-section mh-section mh-section-immersive"
          aria-labelledby="arch-shelf-title"
        >
          <div className="mh-type-header">
            <div className="mh-type-heading">
              <h2 id="arch-shelf-title">
                <CountProgressMark
                  got={collectedArchArtifactIds.size}
                  total={TOTAL_ARCH_ARTIFACTS}
                  title={collectedLabel}
                />
                <span>{t("achArchDesc")}</span>
                <span className="visually-hidden">{collectedLabel}</span>
              </h2>
            </div>
          </div>
          <InspectableShelf
            items={filtered.map((artifact: ArchArtifact) => {
              const gotItem = collectedArchArtifactIds.has(artifact.id);
              const name = locName(artifact, locale);
              return {
                id: artifact.id,
                name,
                iconSrc: archIconSrc(artifact.id),
                found: gotItem,
                collected: gotItem,
                extraClass: `is-arch mh-art-arch-${artifact.id}`,
                popover: (
                  <>
                    <p className="mh-art-pop-meta">
                      {locAnomaly(artifact, locale)}
                      <span aria-hidden="true"> · </span>
                      {locRegion(artifact, locale)}
                    </p>
                    {artifact.conditionUk ? (
                      <p className="mh-art-pop-meta">{artifact.conditionUk}</p>
                    ) : null}
                    <ArchStatusSelect
                      value={gotItem ? "collected" : "missing"}
                      artifactName={name}
                      onChange={(next) => {
                        if (next === "collected" && !gotItem) {
                          toggleArchArtifact(artifact.id);
                        } else if (next === "missing" && gotItem) {
                          toggleArchArtifact(artifact.id);
                        }
                      }}
                    />
                    <Link
                      className="mh-art-pop-map"
                      to={`/curiouser-curiouser?id=${encodeURIComponent(artifact.id)}`}
                      onClick={() => drawer?.setCheckOpen(false)}
                    >
                      {t("onMap")}
                    </Link>
                  </>
                ),
              };
            })}
          />
        </section>
      )}
    </div>
  );
}
