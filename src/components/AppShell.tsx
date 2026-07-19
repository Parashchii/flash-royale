import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
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
import { AuthControls } from "./AuthControls";
import { AchievementSwitcher } from "./AchievementSwitcher";
import radiationLogo from "../assets/radiation-logo.png";

function useNavLinks(achievementId: AchievementId) {
  if (achievementId === "show-all") {
    return [
      { to: `/${achievementId}`, label: "Мапа", end: true },
      { to: "/data", label: "Дані" },
    ];
  }
  return [
    { to: `/${achievementId}`, label: "Мапа", end: true },
    { to: `/${achievementId}/list`, label: "Список" },
    { to: `/${achievementId}/overview`, label: "Огляд" },
    { to: "/data", label: "Дані" },
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
    mode,
  } = useProgress();
  const location = useLocation();
  const params = useParams();
  const achCtx = useAchievementOptional();

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
    <div className="app">
      <header className="topbar">
        <div className="brand-block">
          <img
            className="brand-logo"
            src={radiationLogo}
            alt=""
            width={36}
            height={36}
          />
          <div className="brand-text">
            <div className="brand">
              <span className="brand-primary">Stalker 2 Achievements</span>
              <span className="brand-sep"> | </span>
              <AchievementSwitcher />
            </div>
            <p className="progress-pill">
              {Math.min(done, total)} / {total}
            </p>
          </div>
        </div>
        <div className="auth-block">
          {authConfigured ? (
            <AuthControls />
          ) : (
            <span className="sync-tag" title="Локальний режим без Clerk/Convex">
              {mode === "local" ? "локально" : mode}
            </span>
          )}
        </div>
      </header>

      <nav className="nav" aria-label="Основна навігація">
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
      </nav>

      <main className="main">{children ?? <Outlet />}</main>
    </div>
  );
}
