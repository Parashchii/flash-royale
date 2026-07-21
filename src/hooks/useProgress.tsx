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
  type ArtifactStatus,
  type ChoiceKey,
  type StoryChoices,
  type UserProgress,
} from "../data/types";

const LOCAL_KEY = "flash-royale-progress-v1";

type ProgressContextValue = {
  collectedKeys: Set<string>;
  verifiedGearIds: Set<string>;
  collectedArtifactIds: Set<string>;
  foundArtifactIds: Set<string>;
  collectedScannerIds: Set<string>;
  collectedArchArtifactIds: Set<string>;
  choices: StoryChoices;
  updatedAt: number;
  mode: "local" | "cloud";
  canEdit: boolean;
  cloudReady: boolean;
  toggleCollected: (blueprintKey: string) => void;
  toggleVerified: (gearId: string) => void;
  /** @deprecated Prefer setArtifactStatus */
  toggleArtifact: (artifactId: string) => void;
  setArtifactStatus: (artifactId: string, status: ArtifactStatus) => void;
  getArtifactStatus: (artifactId: string) => ArtifactStatus;
  toggleScanner: (scannerId: string) => void;
  toggleArchArtifact: (archId: string) => void;
  setChoice: (key: ChoiceKey, value: boolean | null) => void;
  reset: () => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function exclusiveArtifactLists(
  present: string[],
  found: string[],
): { collectedArtifactIds: string[]; foundArtifactIds: string[] } {
  const collectedArtifactIds = [...new Set(present)];
  const presentSet = new Set(collectedArtifactIds);
  const foundArtifactIds = [...new Set(found)].filter((id) => !presentSet.has(id));
  return { collectedArtifactIds, foundArtifactIds };
}

function normalizeProgress(parsed: Partial<UserProgress> | null): UserProgress {
  const { collectedArtifactIds, foundArtifactIds } = exclusiveArtifactLists(
    parsed?.collectedArtifactIds ?? [],
    parsed?.foundArtifactIds ?? [],
  );
  return {
    collectedKeys: [...new Set(parsed?.collectedKeys ?? [])],
    verifiedGearIds: [...new Set(parsed?.verifiedGearIds ?? [])],
    collectedArtifactIds,
    foundArtifactIds,
    collectedScannerIds: [...new Set(parsed?.collectedScannerIds ?? [])],
    collectedArchArtifactIds: [...new Set(parsed?.collectedArchArtifactIds ?? [])],
    choices: { ...EMPTY_CHOICES, ...parsed?.choices },
    updatedAt: parsed?.updatedAt ?? 0,
  };
}

function applyArtifactStatus(
  prev: UserProgress,
  artifactId: string,
  status: ArtifactStatus,
): UserProgress {
  const withoutPresent = prev.collectedArtifactIds.filter((id) => id !== artifactId);
  const withoutFound = prev.foundArtifactIds.filter((id) => id !== artifactId);
  if (status === "present") {
    return {
      ...prev,
      collectedArtifactIds: [...withoutPresent, artifactId],
      foundArtifactIds: withoutFound,
      updatedAt: Date.now(),
    };
  }
  if (status === "found") {
    return {
      ...prev,
      collectedArtifactIds: withoutPresent,
      foundArtifactIds: [...withoutFound, artifactId],
      updatedAt: Date.now(),
    };
  }
  return {
    ...prev,
    collectedArtifactIds: withoutPresent,
    foundArtifactIds: withoutFound,
    updatedAt: Date.now(),
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
    const collectedArtifactIds = new Set(progress.collectedArtifactIds);
    const foundArtifactIds = new Set(progress.foundArtifactIds);

    const getArtifactStatus = (artifactId: string): ArtifactStatus => {
      if (collectedArtifactIds.has(artifactId)) return "present";
      if (foundArtifactIds.has(artifactId)) return "found";
      return "missing";
    };

    return {
      collectedKeys: new Set(progress.collectedKeys),
      verifiedGearIds: new Set(progress.verifiedGearIds),
      collectedArtifactIds,
      foundArtifactIds,
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
          const status = prev.collectedArtifactIds.includes(artifactId)
            ? "present"
            : prev.foundArtifactIds.includes(artifactId)
              ? "found"
              : "missing";
          const next: ArtifactStatus =
            status === "missing"
              ? "found"
              : status === "found"
                ? "present"
                : "missing";
          return applyArtifactStatus(prev, artifactId, next);
        });
      },
      setArtifactStatus: (artifactId: string, status: ArtifactStatus) => {
        setProgress((prev) => applyArtifactStatus(prev, artifactId, status));
      },
      getArtifactStatus,
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
  const setArtifactStatusRemote = useMutation(api.progress.setArtifactStatus);
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
  const artifactLists = exclusiveArtifactLists(
    usingCloud
      ? (remote!.collectedArtifactIds ?? [])
      : localFallback.collectedArtifactIds,
    usingCloud
      ? (remote!.foundArtifactIds ?? [])
      : localFallback.foundArtifactIds,
  );
  const artifactList = artifactLists.collectedArtifactIds;
  const foundList = artifactLists.foundArtifactIds;
  const scannerList = usingCloud
    ? (remote!.collectedScannerIds ?? [])
    : localFallback.collectedScannerIds;
  const archList = usingCloud
    ? (remote!.collectedArchArtifactIds ?? [])
    : localFallback.collectedArchArtifactIds;
  const choices = usingCloud ? remote!.choices : localFallback.choices;
  const updatedAt = usingCloud ? remote!.updatedAt : localFallback.updatedAt;

  const collectedArtifactIds = useMemo(
    () => new Set(artifactList),
    [artifactList],
  );
  const foundArtifactIds = useMemo(() => new Set(foundList), [foundList]);

  const getArtifactStatus = useCallback(
    (artifactId: string): ArtifactStatus => {
      if (collectedArtifactIds.has(artifactId)) return "present";
      if (foundArtifactIds.has(artifactId)) return "found";
      return "missing";
    },
    [collectedArtifactIds, foundArtifactIds],
  );

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

  const setArtifactStatus = useCallback(
    (artifactId: string, status: ArtifactStatus) => {
      if (isSignedIn) {
        void setArtifactStatusRemote({ artifactId, status });
        return;
      }
      setLocalFallback((prev) => applyArtifactStatus(prev, artifactId, status));
    },
    [isSignedIn, setArtifactStatusRemote],
  );

  const toggleArtifact = useCallback(
    (artifactId: string) => {
      const status = getArtifactStatus(artifactId);
      const next: ArtifactStatus =
        status === "missing"
          ? "found"
          : status === "found"
            ? "present"
            : "missing";
      setArtifactStatus(artifactId, next);
    },
    [getArtifactStatus, setArtifactStatus],
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
          foundArtifactIds: foundList,
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
      foundList,
      scannerList,
      archList,
      choices,
      updatedAt,
    ],
  );

  const importJson = useCallback(
    (raw: string) => {
      const parsed = JSON.parse(raw) as Partial<UserProgress>;
      const lists = exclusiveArtifactLists(
        parsed.collectedArtifactIds ?? [],
        parsed.foundArtifactIds ?? [],
      );
      const payload = {
        collectedKeys: [...new Set(parsed.collectedKeys ?? [])],
        verifiedGearIds: [...new Set(parsed.verifiedGearIds ?? [])],
        collectedArtifactIds: lists.collectedArtifactIds,
        foundArtifactIds: lists.foundArtifactIds,
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
      collectedArtifactIds,
      foundArtifactIds,
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
      setArtifactStatus,
      getArtifactStatus,
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
      collectedArtifactIds,
      foundArtifactIds,
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
      setArtifactStatus,
      getArtifactStatus,
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
