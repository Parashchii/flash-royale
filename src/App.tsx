import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ScrollToTop } from "./components/ScrollToTop";
import { ProgressProvider } from "./hooks/useProgress";
import { AchievementProvider } from "./hooks/useAchievement";
import { MapDrawerProvider } from "./hooks/useMapDrawer";
import { LandingPage } from "./pages/LandingPage";
import { DataPage } from "./pages/DataPage";
import { MapPage } from "./pages/MapPage";
import { MiracleMapPage } from "./pages/MiracleMapPage";
import { ScannerMapPage } from "./pages/ScannerMapPage";
import { ArchMapPage } from "./pages/ArchMapPage";
import { AllMapPage } from "./pages/AllMapPage";
import { NonStopMapPage } from "./pages/NonStopMapPage";
import { useAchievement } from "./hooks/useAchievement";

function AchievementMap() {
  const { achievementId } = useAchievement();
  if (achievementId === "miracle-hoarder") return <MiracleMapPage />;
  if (achievementId === "scanning-complete") return <ScannerMapPage />;
  if (achievementId === "curiouser-curiouser") return <ArchMapPage />;
  if (achievementId === "non-stop") return <NonStopMapPage />;
  if (achievementId === "show-all") return <AllMapPage />;
  return <MapPage />;
}

function AchievementList() {
  const { achievementId } = useAchievement();
  return (
    <Navigate
      to={
        achievementId === "show-all" || achievementId === "non-stop"
          ? `/${achievementId}`
          : `/${achievementId}?view=list`
      }
      replace
    />
  );
}

function AchievementOverview() {
  const { achievementId } = useAchievement();
  return (
    <Navigate
      to={
        achievementId === "show-all" || achievementId === "non-stop"
          ? `/${achievementId}`
          : `/${achievementId}?view=overview`
      }
      replace
    />
  );
}

function AchievementLayout() {
  return (
    <AchievementProvider>
      <MapDrawerProvider>
        <AppShell />
      </MapDrawerProvider>
    </AchievementProvider>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <AppShell>
                <LandingPage />
              </AppShell>
            }
          />
          <Route path="/data" element={<AppShell><DataPage /></AppShell>} />

          <Route path="/:achievementId" element={<AchievementLayout />}>
            <Route index element={<AchievementMap />} />
            <Route path="list" element={<AchievementList />} />
            <Route path="overview" element={<AchievementOverview />} />
          </Route>

          <Route path="/flashdrives" element={<Navigate to="/flash-royale?view=list" replace />} />
          <Route path="/overview" element={<Navigate to="/flash-royale?view=overview" replace />} />
          <Route path="/map" element={<Navigate to="/flash-royale" replace />} />
          <Route path="/pda" element={<Navigate to="/flash-royale?view=overview" replace />} />
          <Route path="/choices" element={<Navigate to="/flash-royale?view=overview" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  );
}
