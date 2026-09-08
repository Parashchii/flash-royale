import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLocation } from "react-router-dom";
import { isAchievementId } from "../data/achievements";

function isMapPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/data") return false;
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 1 && isAchievementId(parts[0]);
}

/** ~458px at 1440px wide — grows and shrinks with the viewport. */
export const DEFAULT_DRAWER_RATIO = 0.32;
const MIN_DRAWER_WIDTH = 240;
const MIN_MAP_WIDTH = 280;
const MAX_DRAWER_RATIO = 0.45;
const LEFT_KEY = "map-drawer-w-left";
const RIGHT_KEY = "map-drawer-w-right";

function viewportWidth(): number {
  return typeof window === "undefined" ? 1280 : window.innerWidth;
}

export function defaultDrawerWidth(): number {
  return clampDrawerWidth(
    viewportWidth() * DEFAULT_DRAWER_RATIO,
    false,
    0,
  );
}

/** Fallback for panels rendered outside MapDrawerProvider. */
export const DEFAULT_DRAWER_WIDTH = 458;

function readStoredRatio(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    const n = raw ? Number(raw) : NaN;
    if (!Number.isFinite(n)) return DEFAULT_DRAWER_RATIO;
    if (n > 1.5) return n / viewportWidth();
    return n;
  } catch {
    return DEFAULT_DRAWER_RATIO;
  }
}

export function clampDrawerWidth(
  next: number,
  otherOpen: boolean,
  otherWidth: number,
): number {
  const vw = viewportWidth();
  const maxAlone = Math.floor(vw * MAX_DRAWER_RATIO);
  const maxBoth = Math.max(MIN_DRAWER_WIDTH, vw - otherWidth - MIN_MAP_WIDTH);
  const max = otherOpen ? Math.min(maxAlone, maxBoth) : maxAlone;
  return Math.min(max, Math.max(MIN_DRAWER_WIDTH, Math.round(next)));
}

function layoutWidths(
  vw: number,
  leftRatio: number,
  rightRatio: number,
  leftOpen: boolean,
  rightOpen: boolean,
): { left: number; right: number } {
  let left = vw * leftRatio;
  let right = vw * rightRatio;
  if (leftOpen && rightOpen) {
    const budget = vw - MIN_MAP_WIDTH;
    if (left + right > budget) {
      const scale = budget / (left + right);
      left *= scale;
      right *= scale;
    }
  }
  return {
    left: clampDrawerWidth(left, false, 0),
    right: clampDrawerWidth(right, false, 0),
  };
}

type MapDrawerContextValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  checkOpen: boolean;
  setCheckOpen: Dispatch<SetStateAction<boolean>>;
  leftWidth: number;
  rightWidth: number;
  setLeftWidth: (width: number) => void;
  setRightWidth: (width: number) => void;
};

const MapDrawerContext = createContext<MapDrawerContextValue | null>(null);

export function MapDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [leftRatio, setLeftRatio] = useState(() => readStoredRatio(LEFT_KEY));
  const [rightRatio, setRightRatio] = useState(() => readStoredRatio(RIGHT_KEY));
  const [vw, setVw] = useState(viewportWidth);
  const location = useLocation();

  useEffect(() => {
    if (!isMapPath(location.pathname)) {
      setOpen(false);
      setCheckOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const migrate = (key: string, setRatio: (ratio: number) => void) => {
      try {
        const raw = localStorage.getItem(key);
        const n = raw ? Number(raw) : NaN;
        if (!Number.isFinite(n) || n <= 1.5) return;
        const ratio = n / viewportWidth();
        persist(key, ratio);
        setRatio(ratio);
      } catch {
        /* ignore */
      }
    };
    migrate(LEFT_KEY, setLeftRatio);
    migrate(RIGHT_KEY, setRightRatio);
  }, []);

  useEffect(() => {
    const onResize = () => setVw(viewportWidth());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const persist = (key: string, ratio: number) => {
    try {
      localStorage.setItem(key, String(ratio));
    } catch {
      /* ignore */
    }
  };

  const { left: leftWidth, right: rightWidth } = layoutWidths(
    vw,
    leftRatio,
    rightRatio,
    open,
    checkOpen,
  );

  const setLeftWidth = useCallback((width: number) => {
    const ratio = width / viewportWidth();
    setLeftRatio(ratio);
    persist(LEFT_KEY, ratio);
  }, []);

  const setRightWidth = useCallback((width: number) => {
    const ratio = width / viewportWidth();
    setRightRatio(ratio);
    persist(RIGHT_KEY, ratio);
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      checkOpen,
      setCheckOpen,
      leftWidth,
      rightWidth,
      setLeftWidth,
      setRightWidth,
    }),
    [
      open,
      checkOpen,
      leftWidth,
      rightWidth,
      setLeftWidth,
      setRightWidth,
    ],
  );

  return (
    <MapDrawerContext.Provider value={value}>
      {children}
    </MapDrawerContext.Provider>
  );
}

export function useMapDrawer() {
  return useContext(MapDrawerContext);
}
