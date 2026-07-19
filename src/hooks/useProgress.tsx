import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_CHOICES,
  type ChoiceKey,
  type StoryChoices,
  type UserProgress,
} from "../data/types";

const LOCAL_KEY = "flash-royale-progress-v1";

type ProgressContextValue = {
  collectedKeys: Set<string>;
  verifiedGearIds: Set<string>;
  collectedArtifactIds: Set<string>;
  collectedScannerIds: Set<string>;
  collectedArchArtifactIds: Set<string>;
  choices: StoryChoices;
  updatedAt: number;
  mode: "local" | "cloud";
  canEdit: boolean;
  cloudReady: boolean;
  toggleCollected: (blueprintKey: string) => void;
  toggleVerified: (gearId: string) => void;
  toggleArtifact: (artifactId: string) => void;
  toggleScanner: (scannerId: string) => void;
  toggleArchArtifact: (archId: string) => void;
  setChoice: (key: ChoiceKey, value: boolean | null) => void;
  reset: () => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function normalizeProgress(parsed: Partial<UserProgress> | null): UserProgress {
  return {
    collectedKeys: [...new Set(parsed?.collectedKeys ?? [])],
    verifiedGearIds: [...new Set(parsed?.verifiedGearIds ?? [])],
    collectedArtifactIds: [...new Set(parsed?.collectedArtifactIds ?? [])],
    collectedScannerIds: [...new Set(parsed?.collectedScannerIds ?? [])],
    collectedArchArtifactIds: [...new Set(parsed?.collectedArchArtifactIds ?? [])],
    choices: { ...EMPTY_CHOICES, ...parsed?.choices },
    updatedAt: parsed?.updatedAt ?? 0,
  };
}

function readLocal(): UserProgress {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return normalizeProgress(null);
    return normalizeProgress(JSON.parse(raw) as Partial<UserProgress>);
  } catch {
    return normalizeProgress(null);
  }
}

function writeLocal(progress: UserProgress) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(progress));
}

export const authConfigured = Boolean(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
    import.meta.env.VITE_CONVEX_URL,
);

function useLocalProgressState(): ProgressContextValue {
  const [progress, setProgress] = useState<UserProgress>(() => readLocal());

  useEffect(() => {
    writeLocal(progress);
  }, [progress]);

  return useMemo(() => {
    return {
      collectedKeys: new Set(progress.collectedKeys),
      verifiedGearIds: new Set(progress.verifiedGearIds),
      collectedArtifactIds: new Set(progress.collectedArtifactIds),
      collectedScannerIds: new Set(progress.collectedScannerIds),
      collectedArchArtifactIds: new Set(progress.collectedArchArtifactIds),
      choices: progress.choices,
      updatedAt: progress.updatedAt,
      mode: "local" as const,
      canEdit: true,
      cloudReady: false,
      toggleCollected: (blueprintKey: string) => {
        setProgress((prev) => {
          const has = prev.collectedKeys.includes(blueprintKey);
          const collectedKeys = has
            ? prev.collectedKeys.filter((k) => k !== blueprintKey)
            : [...prev.collectedKeys, blueprintKey];
          return { ...prev, collectedKeys, updatedAt: Date.now() };
        });
      },
      toggleVerified: (gearId: string) => {
        setProgress((prev) => {
          const has = prev.verifiedGearIds.includes(gearId);
          const verifiedGearIds = has
            ? prev.verifiedGearIds.filter((k) => k !== gearId)
            : [...prev.verifiedGearIds, gearId];
          return { ...prev, verifiedGearIds, updatedAt: Date.now() };
        });
      },
      toggleArtifact: (artifactId: string) => {
        setProgress((prev) => {
          const has = prev.collectedArtifactIds.includes(artifactId);
          const collectedArtifactIds = has
            ? prev.collectedArtifactIds.filter((k) => k !== artifactId)
            : [...prev.collectedArtifactIds, artifactId];
          return { ...prev, collectedArtifactIds, updatedAt: Date.now() };
        });
      },
      toggleScanner: (scannerId: string) => {
        setProgress((prev) => {
          const has = prev.collectedScannerIds.includes(scannerId);
          const collectedScannerIds = has
            ? prev.collectedScannerIds.filter((k) => k !== scannerId)
            : [...prev.collectedScannerIds, scannerId];
          return { ...prev, collectedScannerIds, updatedAt: Date.now() };
        });
      },
      toggleArchArtifact: (archId: string) => {
        setProgress((prev) => {
          const has = prev.collectedArchArtifactIds.includes(archId);
          const collectedArchArtifactIds = has
            ? prev.collectedArchArtifactIds.filter((k) => k !== archId)
            : [...prev.collectedArchArtifactIds, archId];
          return { ...prev, collectedArchArtifactIds, updatedAt: Date.now() };
        });
      },
      setChoice: (key: ChoiceKey, value: boolean | null) => {
        setProgress((prev) => ({
          ...prev,
          choices: { ...prev.choices, [key]: value },
          updatedAt: Date.now(),
        }));
      },
      reset: () => {
        setProgress(normalizeProgress({ updatedAt: Date.now() }));
      },
      exportJson: () => JSON.stringify(progress, null, 2),
      importJson: (raw: string) => {
        const parsed = JSON.parse(raw) as Partial<UserProgress>;
        setProgress(normalizeProgress({ ...parsed, updatedAt: Date.now() }));
      },
    };
  }, [progress]);
}

function LocalProgressProvider({ children }: { children: ReactNode }) {
  const value = useLocalProgressState();
  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

function CloudProgressProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const remote = useQuery(api.progress.getMine);
  const ensure = useMutation(api.progress.ensure);
  const toggleRemote = useMutation(api.progress.toggleCollected);
  const toggleVerifiedRemote = useMutation(api.progress.toggleVerified);
  const toggleArtifactRemote = useMutation(api.progress.toggleArtifact);
  const toggleScannerRemote = useMutation(api.progress.toggleScanner);
  const toggleArchArtifactRemote = useMutation(api.progress.toggleArchArtifact);
  const setChoiceRemote = useMutation(api.progress.setChoice);
  const resetRemote = useMutation(api.progress.reset);
  const importRemote = useMutation(api.progress.importProgress);
  const [localFallback, setLocalFallback] = useState<UserProgress>(() =>
    readLocal(),
  );

  useEffect(() => {
    if (isSignedIn) void ensure().catch(() => undefined);
  }, [isSignedIn, ensure]);

  useEffect(() => {
    if (!isSignedIn) writeLocal(localFallback);
  }, [isSignedIn, localFallback]);

  const usingCloud = Boolean(isSignedIn && remote);
  const collectedList = usingCloud
    ? remote!.collectedKeys
    : localFallback.collectedKeys;
  const verifiedList = usingCloud
    ? (remote!.verifiedGearIds ?? [])
    : localFallback.verifiedGearIds;
  const artifactList = usingCloud
    ? (remote!.collectedArtifactIds ?? [])
    : localFallback.collectedArtifactIds;
  const scannerList = usingCloud
    ? (remote!.collectedScannerIds ?? [])
    : localFallback.collectedScannerIds;
  const archList = usingCloud
    ? (remote!.collectedArchArtifactIds ?? [])
    : localFallback.collectedArchArtifactIds;
  const choices = usingCloud ? remote!.choices : localFallback.choices;
  const updatedAt = usingCloud ? remote!.updatedAt : localFallback.updatedAt;

  const toggleCollected = useCallback(
    (blueprintKey: string) => {
      if (isSignedIn) {
        void toggleRemote({ blueprintKey });
        return;
      }
      setLocalFallback((prev) => {
        const has = prev.collectedKeys.includes(blueprintKey);
        const next = has
          ? prev.collectedKeys.filter((k) => k !== blueprintKey)
          : [...prev.collectedKeys, blueprintKey];
        return { ...prev, collectedKeys: next, updatedAt: Date.now() };
      });
    },
    [isSignedIn, toggleRemote],
  );

  const toggleVerified = useCallback(
    (gearId: string) => {
      if (isSignedIn) {
        void toggleVerifiedRemote({ gearId });
        return;
      }
      setLocalFallback((prev) => {
        const has = prev.verifiedGearIds.includes(gearId);
        const next = has
          ? prev.verifiedGearIds.filter((k) => k !== gearId)
          : [...prev.verifiedGearIds, gearId];
        return { ...prev, verifiedGearIds: next, updatedAt: Date.now() };
      });
    },
    [isSignedIn, toggleVerifiedRemote],
  );

  const toggleArtifact = useCallback(
    (artifactId: string) => {
      if (isSignedIn) {
        void toggleArtifactRemote({ artifactId });
        return;
      }
      setLocalFallback((prev) => {
        const has = prev.collectedArtifactIds.includes(artifactId);
        const next = has
          ? prev.collectedArtifactIds.filter((k) => k !== artifactId)
          : [...prev.collectedArtifactIds, artifactId];
        return { ...prev, collectedArtifactIds: next, updatedAt: Date.now() };
      });
    },
    [isSignedIn, toggleArtifactRemote],
  );

  const toggleScanner = useCallback(
    (scannerId: string) => {
      if (isSignedIn) {
        void toggleScannerRemote({ scannerId });
        return;
      }
      setLocalFallback((prev) => {
        const has = prev.collectedScannerIds.includes(scannerId);
        const next = has
          ? prev.collectedScannerIds.filter((k) => k !== scannerId)
          : [...prev.collectedScannerIds, scannerId];
        return { ...prev, collectedScannerIds: next, updatedAt: Date.now() };
      });
    },
    [isSignedIn, toggleScannerRemote],
  );

  const toggleArchArtifact = useCallback(
    (archId: string) => {
      if (isSignedIn) {
        void toggleArchArtifactRemote({ archId });
        return;
      }
      setLocalFallback((prev) => {
        const has = prev.collectedArchArtifactIds.includes(archId);
        const next = has
          ? prev.collectedArchArtifactIds.filter((k) => k !== archId)
          : [...prev.collectedArchArtifactIds, archId];
        return {
          ...prev,
          collectedArchArtifactIds: next,
          updatedAt: Date.now(),
        };
      });
    },
    [isSignedIn, toggleArchArtifactRemote],
  );

  const setChoice = useCallback(
    (key: ChoiceKey, value: boolean | null) => {
      if (isSignedIn) {
        void setChoiceRemote({ key, value });
        return;
      }
      setLocalFallback((prev) => ({
        ...prev,
        choices: { ...prev.choices, [key]: value },
        updatedAt: Date.now(),
      }));
    },
    [isSignedIn, setChoiceRemote],
  );

  const reset = useCallback(() => {
    if (isSignedIn) {
      void resetRemote();
      return;
    }
    setLocalFallback(normalizeProgress({ updatedAt: Date.now() }));
  }, [isSignedIn, resetRemote]);

  const exportJson = useCallback(
    () =>
      JSON.stringify(
        {
          collectedKeys: collectedList,
          verifiedGearIds: verifiedList,
          collectedArtifactIds: artifactList,
          collectedScannerIds: scannerList,
          collectedArchArtifactIds: archList,
          choices,
          updatedAt,
        },
        null,
        2,
      ),
    [
      collectedList,
      verifiedList,
      artifactList,
      scannerList,
      archList,
      choices,
      updatedAt,
    ],
  );

  const importJson = useCallback(
    (raw: string) => {
      const parsed = JSON.parse(raw) as Partial<UserProgress>;
      const payload = {
        collectedKeys: [...new Set(parsed.collectedKeys ?? [])],
        verifiedGearIds: [...new Set(parsed.verifiedGearIds ?? [])],
        collectedArtifactIds: [...new Set(parsed.collectedArtifactIds ?? [])],
        collectedScannerIds: [...new Set(parsed.collectedScannerIds ?? [])],
        collectedArchArtifactIds: [
          ...new Set(parsed.collectedArchArtifactIds ?? []),
        ],
        choices: { ...EMPTY_CHOICES, ...parsed.choices },
      };
      if (isSignedIn) {
        void importRemote(payload);
        return;
      }
      setLocalFallback({ ...payload, updatedAt: Date.now() });
    },
    [isSignedIn, importRemote],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      collectedKeys: new Set(collectedList),
      verifiedGearIds: new Set(verifiedList),
      collectedArtifactIds: new Set(artifactList),
      collectedScannerIds: new Set(scannerList),
      collectedArchArtifactIds: new Set(archList),
      choices,
      updatedAt,
      mode: isSignedIn ? "cloud" : "local",
      canEdit: true,
      cloudReady: Boolean(isLoaded && isSignedIn && remote !== undefined),
      toggleCollected,
      toggleVerified,
      toggleArtifact,
      toggleScanner,
      toggleArchArtifact,
      setChoice,
      reset,
      exportJson,
      importJson,
    }),
    [
      collectedList,
      verifiedList,
      artifactList,
      scannerList,
      archList,
      choices,
      updatedAt,
      isSignedIn,
      isLoaded,
      remote,
      toggleCollected,
      toggleVerified,
      toggleArtifact,
      toggleScanner,
      toggleArchArtifact,
      setChoice,
      reset,
      exportJson,
      importJson,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  if (authConfigured) {
    return <CloudProgressProvider>{children}</CloudProgressProvider>;
  }
  return <LocalProgressProvider>{children}</LocalProgressProvider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
