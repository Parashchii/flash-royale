import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Artifact, ArtifactRarity, ArtifactStatus } from "../data/types";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel, locName } from "../i18n/localize";
import type { MessageKey } from "../i18n/messages";

export const RARITY_LABEL: Record<ArtifactRarity, MessageKey> = {
  common: "rarityCommon",
  uncommon: "rarityUncommon",
  rare: "rarityRare",
  legendary: "rarityLegendary",
};

export function artifactIconSrc(id: string) {
  return `/artifacts/${id}.png?v=2`;
}

export function archIconSrc(id: string) {
  return `/arch-artifacts/${id}.png?v=1`;
}

function FoundCheckIcon() {
  return (
    <svg
      className="mh-art-check"
      viewBox="0 0 20 20"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.86-9.81a.75.75 0 0 0-1.22-.88l-3.48 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.14-.09l4-5.5z"
      />
    </svg>
  );
}

export function ArtifactStatusSelect({
  value,
  artifactName,
  onChange,
}: {
  value: ArtifactStatus;
  artifactName: string;
  onChange: (status: ArtifactStatus) => void;
}) {
  const { t } = useLocale();
  return (
    <label className={`mh-status-select status-${value}`}>
      <span className="visually-hidden">{t("artifactStatus")}</span>
      <select
        value={value}
        aria-label={`${t("artifactStatus")}: ${artifactName}`}
        onChange={(e) => onChange(e.target.value as ArtifactStatus)}
      >
        <option value="missing">{t("artifactAbsent")}</option>
        <option value="found">{t("artifactFound")}</option>
        <option value="present">{t("artifactPresent")}</option>
      </select>
    </label>
  );
}

export type InspectableShelfItem = {
  id: string;
  name: string;
  iconSrc: string;
  found: boolean;
  collected: boolean;
  rarity?: ArtifactRarity;
  extraClass?: string;
  popover: ReactNode;
};

export function InspectableShelf({ items }: { items: InspectableShelfItem[] }) {
  const shelfRef = useRef<HTMLUListElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId) return;

    const selectStillOpen = () => {
      const active = document.activeElement;
      return (
        active instanceof HTMLSelectElement &&
        Boolean(shelfRef.current?.contains(active))
      );
    };

    const nodeInsideShelfHit = (node: EventTarget | null) => {
      if (!(node instanceof Element) || !shelfRef.current) return false;
      return Boolean(
        shelfRef.current.contains(node) &&
          node.closest(".mh-art-hit, .mh-art-pop"),
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      if (nodeInsideShelfHit(event.target)) return;
      setActiveId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveId(null);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (selectStillOpen()) return;
      const under = document.elementFromPoint(event.clientX, event.clientY);
      if (nodeInsideShelfHit(under)) return;
      setActiveId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeId]);

  const closeIfMouseLeft = (
    event: { pointerType?: string; relatedTarget: EventTarget | null },
    inside: Element,
  ) => {
    if (event.pointerType !== "mouse") return;
    const next = event.relatedTarget;
    if (next instanceof Node && inside.contains(next)) return;
    if (next instanceof Element && next.closest(".mh-art-hit, .mh-art-pop")) {
      return;
    }
    if (
      document.activeElement instanceof HTMLSelectElement &&
      Boolean(shelfRef.current?.contains(document.activeElement))
    ) {
      return;
    }
    setActiveId(null);
  };

  return (
    <ul
      ref={shelfRef}
      className={`mh-art-shelf${activeId ? " is-inspecting" : ""}`}
      onPointerLeave={(event) => closeIfMouseLeft(event, event.currentTarget)}
    >
      {items.map((item, index) => {
        const active = activeId === item.id;
        return (
          <li
            key={item.id}
            className={[
              "mh-art-float",
              item.rarity ? `mh-art-rarity-${item.rarity}` : "",
              item.extraClass ?? "",
              item.found ? "is-found" : "",
              item.collected ? "is-collected" : "",
              active ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ "--mh-art-delay": `${(index % 8) * 0.42}s` } as CSSProperties}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setActiveId(item.id);
            }}
            onPointerLeave={(event) => closeIfMouseLeft(event, event.currentTarget)}
          >
            <button
              type="button"
              className="mh-art-hit"
              aria-expanded={active}
              aria-controls={`mh-art-pop-${item.id}`}
              onClick={() => {
                const fineHover = window.matchMedia(
                  "(hover: hover) and (pointer: fine)",
                ).matches;
                if (fineHover) {
                  setActiveId(item.id);
                  return;
                }
                setActiveId((current) =>
                  current === item.id ? null : item.id,
                );
              }}
            >
              <span className="mh-art-stage">
                <span
                  className="mh-art-motion"
                  style={{ animationDelay: `var(--mh-art-delay)` }}
                >
                  <img
                    className="mh-art-icon"
                    src={item.iconSrc}
                    alt=""
                    width={128}
                    height={128}
                    loading="lazy"
                  />
                </span>
              </span>
              <span className="mh-art-name">
                {item.found ? <FoundCheckIcon /> : null}
                <span className="mh-art-name-text">{item.name}</span>
              </span>
            </button>
            <div
              className="mh-art-pop"
              id={`mh-art-pop-${item.id}`}
              hidden={!active}
            >
              {item.popover}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MiracleArtifactShelf({
  artifacts,
  statusOf,
  onStatusChange,
}: {
  artifacts: Artifact[];
  statusOf: (id: string) => ArtifactStatus;
  onStatusChange: (id: string, status: ArtifactStatus) => void;
}) {
  const { t, locale } = useLocale();
  return (
    <InspectableShelf
      items={artifacts.map((artifact) => {
        const status = statusOf(artifact.id);
        const name = locName(artifact, locale);
        const rarity = artifact.rarity;
        return {
          id: artifact.id,
          name,
          iconSrc: artifactIconSrc(artifact.id),
          found: status !== "missing",
          collected: status === "present",
          rarity,
          popover: (
            <>
              {rarity ? (
                <p className="mh-art-pop-meta">
                  {t(RARITY_LABEL[rarity])}
                  <span aria-hidden="true"> · </span>
                  {anomalyTypeLabel(artifact.anomalyType, locale)}
                </p>
              ) : (
                <p className="mh-art-pop-meta">
                  {anomalyTypeLabel(artifact.anomalyType, locale)}
                </p>
              )}
              <ArtifactStatusSelect
                value={status}
                artifactName={name}
                onChange={(next) => onStatusChange(artifact.id, next)}
              />
            </>
          ),
        };
      })}
    />
  );
}
