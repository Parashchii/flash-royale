import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import {
  TOTAL_ARCH_ARTIFACTS,
  TOTAL_ARTIFACTS,
  TOTAL_SCANNERS,
  TOTAL_UNIQUE,
  UNIQUE_BLUEPRINT_KEYS,
} from "../data/catalog";
import {
  isAchievementId,
  type AchievementId,
} from "../data/achievements";
import { authConfigured, useProgress } from "../hooks/useProgress";
import { useAchievementOptional } from "../hooks/useAchievement";
import { useLocale } from "../i18n/LocaleContext";
import { AuthControls } from "./AuthControls";
import { AchievementSwitcher } from "./AchievementSwitcher";
import { LangSwitcher } from "./LangSwitcher";
import { ProfileMenu } from "./ProfileMenu";
import radiationLogo from "../assets/radiation-logo.png";

function useNavLinks(achievementId: AchievementId) {
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
  const { t } = useLocale();

  const isHome = location.pathname === "/";

  const achievementId: AchievementId = achCtx?.achievementId
    ?? (isAchievementId(params.achievementId) ? params.achievementId : "flash-royale");

  const links = useNavLinks(achievementId);

  const { done, total } = progressFor(
    achievementId,
    collectedKeys,
    collectedArtifactIds,
    collectedScannerIds,
    collectedArchArtifactIds,
  );

  return (
    <div className={isHome ? "app app-home" : "app"}>
      <header className="topbar">
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
          {!isHome ? (
            <div className="brand-text">
              <div className="brand">
                <Link to="/" className="brand-primary">
                  {t("brandTitle")}
                </Link>
                <span className="brand-sep"> | </span>
                <AchievementSwitcher />
              </div>
              <p className="progress-pill">
                {Math.min(done, total)} / {total}
              </p>
            </div>
          ) : null}
        </div>
        <div className="auth-block">
          <LangSwitcher />
          {authConfigured ? <AuthControls /> : <ProfileMenu />}
        </div>
      </header>

      {!isHome && links.length > 0 ? (
        <nav className="nav" aria-label={t("navAria")}>
          <div className="nav-track">
            {links.map((l) => (
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
      ) : null}

      <main className="main">{children ?? <Outlet />}</main>
    </div>
  );
}
