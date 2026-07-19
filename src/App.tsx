import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProgressProvider } from "./hooks/useProgress";
import { AchievementProvider } from "./hooks/useAchievement";
import { HomePage } from "./pages/HomePage";
import { FlashdrivesPage } from "./pages/FlashdrivesPage";
import { DataPage } from "./pages/DataPage";
import { MapPage } from "./pages/MapPage";
import { MiracleMapPage } from "./pages/MiracleMapPage";
import { MiracleListPage } from "./pages/MiracleListPage";
import { MiracleOverviewPage } from "./pages/MiracleOverviewPage";
import { ScannerMapPage } from "./pages/ScannerMapPage";
import { ScannerListPage } from "./pages/ScannerListPage";
import { ScannerOverviewPage } from "./pages/ScannerOverviewPage";
import { ArchMapPage } from "./pages/ArchMapPage";
import { ArchListPage } from "./pages/ArchListPage";
import { ArchOverviewPage } from "./pages/ArchOverviewPage";
import { AllMapPage } from "./pages/AllMapPage";
import { useAchievement } from "./hooks/useAchievement";

function AchievementMap() {
  const { achievementId } = useAchievement();
  if (achievementId === "miracle-hoarder") return <MiracleMapPage />;
  if (achievementId === "scanning-complete") return <ScannerMapPage />;
  if (achievementId === "curiouser-curiouser") return <ArchMapPage />;
  if (achievementId === "show-all") return <AllMapPage />;
  return <MapPage />;
}

function AchievementList() {
  const { achievementId } = useAchievement();
  if (achievementId === "show-all") {
    return <Navigate to="/show-all" replace />;
  }
  if (achievementId === "miracle-hoarder") return <MiracleListPage />;
  if (achievementId === "scanning-complete") return <ScannerListPage />;
  if (achievementId === "curiouser-curiouser") return <ArchListPage />;
  return <FlashdrivesPage />;
}

function AchievementOverview() {
  const { achievementId } = useAchievement();
  if (achievementId === "show-all") {
    return <Navigate to="/show-all" replace />;
  }
  if (achievementId === "miracle-hoarder") return <MiracleOverviewPage />;
  if (achievementId === "scanning-complete") return <ScannerOverviewPage />;
  if (achievementId === "curiouser-curiouser") return <ArchOverviewPage />;
  return <HomePage />;
}

function AchievementLayout() {
  return (
    <AchievementProvider>
      <AppShell />
    </AchievementProvider>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/data" element={<AppShell><DataPage /></AppShell>} />

          <Route path="/:achievementId" element={<AchievementLayout />}>
            <Route index element={<AchievementMap />} />
            <Route path="list" element={<AchievementList />} />
            <Route path="overview" element={<AchievementOverview />} />
          </Route>

          <Route path="/flashdrives" element={<Navigate to="/flash-royale/list" replace />} />
          <Route path="/overview" element={<Navigate to="/flash-royale/overview" replace />} />
          <Route path="/map" element={<Navigate to="/flash-royale" replace />} />
          <Route path="/pda" element={<Navigate to="/flash-royale/overview#pda-check" replace />} />
          <Route path="/choices" element={<Navigate to="/flash-royale/overview" replace />} />
          <Route path="/" element={<Navigate to="/flash-royale" replace />} />
          <Route path="*" element={<Navigate to="/flash-royale" replace />} />
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  );
}
