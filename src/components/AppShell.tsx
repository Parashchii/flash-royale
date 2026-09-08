import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import {
  TOTAL_ARCH_ARTIFACTS,
  TOTAL_ARTIFACTS,
  TOTAL_NON_STOP,
  TOTAL_SCANNERS,
  TOTAL_UNIQUE,
  UNIQUE_BLUEPRINT_KEYS,
  trackedArtifactIds,
} from "../data/catalog";
import {
  ACHIEVEMENT_LIST,
  ACHIEVEMENTS,
  isAchievementId,
  type AchievementId,
} from "../data/achievements";
import { authConfigured, useProgress } from "../hooks/useProgress";
import { useAchievementOptional } from "../hooks/useAchievement";
import { useLocale } from "../i18n/LocaleContext";
import { locName } from "../i18n/localize";
import { AuthControls } from "./AuthControls";
import { LangSwitcher } from "./LangSwitcher";
import { ProfileMenu } from "./ProfileMenu";
import radiationLogo from "../assets/radiation-logo.png";

const ACH_TAB_ORDER: AchievementId[] = [
  "show-all",
  ...ACHIEVEMENT_LIST.filter((a) => a.id !== "show-all").map((a) => a.id),
];

function isMapPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/data") return false;
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 1 && isAchievementId(parts[0]);
}

function progressFor(
  achievementId: AchievementId,
  collectedKeys: Set<string>,
  artifactIds: Set<string>,
  collectedScannerIds: Set<string>,
  collectedArchArtifactIds: Set<string>,
  collectedNonStopIds: Set<string>,
): { done: number; total: number } {
  const flashDone = UNIQUE_BLUEPRINT_KEYS.filter((k) =>
    collectedKeys.has(k),
  ).length;

  if (achievementId === "miracle-hoarder") {
    return { done: artifactIds.size, total: TOTAL_ARTIFACTS };
  }
  if (achievementId === "scanning-complete") {
    return { done: collectedScannerIds.size, total: TOTAL_SCANNERS };
  }
  if (achievementId === "curiouser-curiouser") {
    return { done: collectedArchArtifactIds.size, total: TOTAL_ARCH_ARTIFACTS };
  }
  if (achievementId === "non-stop") {
    return { done: collectedNonStopIds.size, total: TOTAL_NON_STOP };
  }
  if (achievementId === "show-all") {
    return {
      done:
        flashDone +
        artifactIds.size +
        collectedScannerIds.size +
        collectedArchArtifactIds.size +
        collectedNonStopIds.size,
      total:
        TOTAL_UNIQUE +
        TOTAL_ARTIFACTS +
        TOTAL_SCANNERS +
        TOTAL_ARCH_ARTIFACTS +
        TOTAL_NON_STOP,
    };
  }
  return { done: flashDone, total: TOTAL_UNIQUE };
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const {
    collectedKeys,
    collectedArtifactIds,
    foundArtifactIds,
    collectedScannerIds,
    collectedArchArtifactIds,
    collectedNonStopIds,
  } = useProgress();
  const location = useLocation();
  const params = useParams();
  const achCtx = useAchievementOptional();
  const { t, locale } = useLocale();

  const isHome = location.pathname === "/";
  const isMapPage = isMapPath(location.pathname);

  const achievementId: AchievementId = achCtx?.achievementId
    ?? (isAchievementId(params.achievementId) ? params.achievementId : "flash-royale");

  const showProgress = !isHome;
  const artifactIds = trackedArtifactIds(collectedArtifactIds, foundArtifactIds);

  return (
    <>
      <div className={isMapPage ? "app-chrome app-chrome-overlay" : "app-chrome"}>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand-block">
              <Link to="/" className="brand-home-link" aria-label={t("navHome")}>
                <span className="brand-logo-glow" aria-hidden="true" />
                <img
                  className="brand-logo"
                  src={radiationLogo}
                  alt=""
                  width={28}
                  height={28}
                />
              </Link>
              <Link to="/" className="brand-name" aria-label={t("brandTitle")}>
                <span className="brand-stalker">stalker</span>
                <span className="brand-solutions">solutions</span>
              </Link>
            </div>

            <div className="auth-block">
              <LangSwitcher />
              {authConfigured ? <AuthControls /> : <ProfileMenu />}
            </div>
          </div>
        </header>

        {!isHome ? (
          <nav className="ach-tabs" aria-label={t("achNavAria")}>
            {ACH_TAB_ORDER.map((id) => {
              const meta = ACHIEVEMENTS[id];
              const active =
                location.pathname === `/${id}` ||
                location.pathname.startsWith(`/${id}/`);
              const tabProgress = progressFor(
                id,
                collectedKeys,
                artifactIds,
                collectedScannerIds,
                collectedArchArtifactIds,
                collectedNonStopIds,
              );
              return (
                <NavLink
                  key={id}
                  to={`/${id}`}
                  className={active ? "ach-tab active" : "ach-tab"}
                >
                <span className="ach-tab-label">
                  {id === "show-all" ? t("achAllShort") : locName(meta, locale)}
                  {showProgress
                    ? `  ${Math.min(tabProgress.done, tabProgress.total)} / ${tabProgress.total}`
                    : null}
                </span>
                </NavLink>
              );
            })}
          </nav>
        ) : null}
      </div>

      <div
        className={
          isHome ? "app app-home" : isMapPage ? "app app-map" : "app app-tracker"
        }
      >
        <main className="main">{children ?? <Outlet />}</main>
      </div>
    </>
  );
}
