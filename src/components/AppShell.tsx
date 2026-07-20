import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import {
  TOTAL_ARCH_ARTIFACTS,
  TOTAL_ARTIFACTS,
  TOTAL_SCANNERS,
  TOTAL_UNIQUE,
  UNIQUE_BLUEPRINT_KEYS,
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

const TRACKER_NAV_ORDER: AchievementId[] = ACHIEVEMENT_LIST.filter(
  (a) => a.id !== "show-all",
).map((a) => a.id);

function useSectionLinks(achievementId: AchievementId) {
  const { t } = useLocale();
  if (achievementId === "show-all") {
    return [];
  }
  return [
    { to: `/${achievementId}`, label: t("navMap"), end: true },
    { to: `/${achievementId}/list`, label: t("navList") },
    { to: `/${achievementId}/overview`, label: t("navOverview") },
    { to: "/data", label: t("navData") },
  ];
}

function progressFor(
  achievementId: AchievementId,
  collectedKeys: Set<string>,
  collectedArtifactIds: Set<string>,
  collectedScannerIds: Set<string>,
  collectedArchArtifactIds: Set<string>,
): { done: number; total: number } {
  const flashDone = UNIQUE_BLUEPRINT_KEYS.filter((k) =>
    collectedKeys.has(k),
  ).length;

  if (achievementId === "miracle-hoarder") {
    return { done: collectedArtifactIds.size, total: TOTAL_ARTIFACTS };
  }
  if (achievementId === "scanning-complete") {
    return { done: collectedScannerIds.size, total: TOTAL_SCANNERS };
  }
  if (achievementId === "curiouser-curiouser") {
    return { done: collectedArchArtifactIds.size, total: TOTAL_ARCH_ARTIFACTS };
  }
  if (achievementId === "show-all") {
    return {
      done:
        flashDone +
        collectedArtifactIds.size +
        collectedScannerIds.size +
        collectedArchArtifactIds.size,
      total:
        TOTAL_UNIQUE +
        TOTAL_ARTIFACTS +
        TOTAL_SCANNERS +
        TOTAL_ARCH_ARTIFACTS,
    };
  }
  return { done: flashDone, total: TOTAL_UNIQUE };
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const {
    collectedKeys,
    collectedArtifactIds,
    collectedScannerIds,
    collectedArchArtifactIds,
  } = useProgress();
  const location = useLocation();
  const params = useParams();
  const achCtx = useAchievementOptional();
  const { t, locale } = useLocale();

  const isHome = location.pathname === "/";

  const achievementId: AchievementId = achCtx?.achievementId
    ?? (isAchievementId(params.achievementId) ? params.achievementId : "flash-royale");

  const sectionLinks = useSectionLinks(achievementId);
  const showProgress = !isHome;

  const { done, total } = progressFor(
    achievementId,
    collectedKeys,
    collectedArtifactIds,
    collectedScannerIds,
    collectedArchArtifactIds,
  );

  return (
    <>
      <div className="app-chrome">
        <div className="app-chrome-inner">
          <header className="topbar">
            <div className="topbar-start">
              <div className="brand-block">
                <Link to="/" className="brand-home-link" aria-label={t("navHome")}>
                  <img
                    className="brand-logo"
                    src={radiationLogo}
                    alt=""
                    width={36}
                    height={36}
                  />
                </Link>
                <Link to="/" className="brand-name" aria-label={t("brandTitle")}>
                  <span className="brand-stalker">stalker</span>
                  <span className="brand-solutions"> solutions</span>
                </Link>
              </div>
              <NavLink
                to="/show-all"
                className={({ isActive }) =>
                  isActive || location.pathname.startsWith("/show-all/")
                    ? "ach-nav-link active"
                    : "ach-nav-link"
                }
              >
                {locName(ACHIEVEMENTS["show-all"], locale)}
              </NavLink>
            </div>

            <nav className="ach-nav" aria-label={t("achNavAria")}>
              {TRACKER_NAV_ORDER.map((id) => {
                const meta = ACHIEVEMENTS[id];
                const active =
                  location.pathname === `/${id}` ||
                  location.pathname.startsWith(`/${id}/`);
                return (
                  <NavLink
                    key={id}
                    to={`/${id}`}
                    className={active ? "ach-nav-link active" : "ach-nav-link"}
                  >
                    {locName(meta, locale)}
                  </NavLink>
                );
              })}
            </nav>

            <div className="auth-block">
              {showProgress ? (
                <p className="progress-pill">
                  {Math.min(done, total)} / {total}
                </p>
              ) : null}
              <LangSwitcher />
              {authConfigured ? <AuthControls /> : <ProfileMenu />}
            </div>
          </header>
        </div>

        {!isHome && sectionLinks.length > 0 ? (
          <div className="section-nav-bar">
            <nav className="nav" aria-label={t("navAria")}>
              <div className="nav-track">
                {sectionLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) => {
                      const onMap =
                        l.end &&
                        (location.pathname === `/${achievementId}` ||
                          location.pathname === `/${achievementId}/`);
                      return isActive || onMap ? "nav-link active" : "nav-link";
                    }}
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        ) : null}
      </div>

      <div className={isHome ? "app app-home" : "app"}>
        <main className="main">{children ?? <Outlet />}</main>
      </div>
    </>
  );
}
