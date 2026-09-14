import type { CSSProperties, ReactNode } from "react";
import type { AnomalyType } from "../data/types";
import gravIcon from "../assets/anomaly-icons/gravitational.png";
import thermalIcon from "../assets/anomaly-icons/thermal.png";

export const ANOMALY_TYPE_COLORS: Record<AnomalyType, string> = {
  chemical: "#00d636",
  gravitational: "#6b28ff",
  thermal: "#ff4d00",
  electro: "#00b8f5",
};

/** Map marker diameter; ~85% of the previous 36px. */
export const ANOMALY_MARKER_SIZE = 31;
const MARKER_GLYPH_SIZE = 22;

const GLYPH_ON_COLOR = "#fff8ef";
const GLYPH_ON_MUTED = "#e8ece8";

const PNG_ICONS: Partial<Record<AnomalyType, string>> = {
  gravitational: gravIcon,
  thermal: thermalIcon,
};

const ICON_PATHS: Partial<Record<AnomalyType, string>> = {
  // Test tube / flask
  chemical:
    "M9 2h6v2h-1v5.2l4.55 6.82A2.75 2.75 0 0 1 16.3 21H7.7a2.75 2.75 0 0 1-2.25-4.98L10 9.2V4H9V2zm2 2v5.55L6.9 16.3a.75.75 0 0 0 .6 1.2h9a.75.75 0 0 0 .6-1.2L13 9.55V4h-2z",
  // Lightning bolt
  electro: "M13 2 4 14h7l-1 8 10-13h-7l0-7z",
};

function pngMaskHtml(url: string, size: number, color: string) {
  return `<span style="display:block;width:${size}px;height:${size}px;background:${color};-webkit-mask:url('${url}') center / contain no-repeat;mask:url('${url}') center / contain no-repeat;"></span>`;
}

function svgInner(type: AnomalyType, size: number, fill: string) {
  const path = ICON_PATHS[type];
  if (!path) return "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path fill="${fill}" d="${path}"/></svg>`;
}

function glyphHtml(type: AnomalyType, size: number, fill: string) {
  const png = PNG_ICONS[type];
  if (png) return pngMaskHtml(png, size, fill);
  return svgInner(type, size, fill);
}

/** HTML for Leaflet divIcon markers. */
export function anomalyTypeMarkerHtml(
  type: AnomalyType,
  opts: { done?: boolean; approx?: boolean; routeIndex?: number } = {},
): string {
  const done = opts.done ? " mh-marker-done" : " mh-marker-worth";
  const approx = opts.approx ? " mh-marker-approx" : "";
  const onRoute =
    opts.routeIndex != null ? " mh-marker-on-route" : "";
  const fill = opts.done ? GLYPH_ON_MUTED : GLYPH_ON_COLOR;
  const badge =
    opts.routeIndex != null
      ? `<span class="mh-route-index">${opts.routeIndex}</span>`
      : "";
  return `<span class="mh-marker mh-marker-type mh-marker-${type}${done}${approx}${onRoute}">${glyphHtml(type, MARKER_GLYPH_SIZE, fill)}${badge}</span>`;
}

export function AnomalyTypeIcon({
  type,
  size = 24,
  className,
  title,
  color,
  onColorBg = false,
}: {
  type: AnomalyType;
  size?: number;
  className?: string;
  title?: string;
  color?: string;
  /** Light glyph on colored circular badge. */
  onColorBg?: boolean;
}) {
  const glyph = color ?? (onColorBg ? GLYPH_ON_COLOR : ANOMALY_TYPE_COLORS[type]);
  const glyphSize = size * 0.76;
  const png = PNG_ICONS[type];
  const path = ICON_PATHS[type];

  return (
    <span
      className={`mh-type-icon mh-type-icon-${type}${onColorBg ? " mh-type-icon-badge" : ""}${className ? ` ${className}` : ""}`}
      style={{
        color: glyph,
        width: size,
        height: size,
      }}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {png ? (
        <span
          className="mh-type-icon-mask"
          style={{
            width: glyphSize,
            height: glyphSize,
            backgroundColor: glyph,
            WebkitMaskImage: `url(${png})`,
            maskImage: `url(${png})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      ) : path ? (
        <svg
          viewBox="0 0 24 24"
          width={glyphSize}
          height={glyphSize}
          focusable="false"
        >
          <path fill={glyph} d={path} />
        </svg>
      ) : null}
    </span>
  );
}

export function ProgressRing({
  got,
  total,
  title,
  tone,
  size = "md",
  children,
}: {
  got: number;
  total: number;
  title: string;
  tone: AnomalyType | "all";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const pct = total > 0 ? Math.min(100, (got / total) * 100) : 0;
  const complete = pct >= 99.5;
  return (
    <span
      className={`mh-type-ring mh-type-ring-${tone}${size !== "md" ? ` is-${size}` : ""}`}
      style={{ "--mh-ring-pct": pct } as CSSProperties}
      title={title}
    >
      <svg className="mh-type-ring-svg" viewBox="0 0 36 36" aria-hidden="true">
        <circle
          className="mh-type-ring-track"
          cx="18"
          cy="18"
          r="15.6"
          fill="none"
          strokeWidth="2.35"
        />
        {pct > 0 ? (
          <circle
            className="mh-type-ring-value"
            cx="18"
            cy="18"
            r="15.6"
            fill="none"
            strokeWidth="2.35"
            pathLength="100"
            strokeDasharray={complete ? "100 0" : `${pct} 100`}
            strokeLinecap={complete ? "butt" : "round"}
            transform="rotate(-90 18 18)"
          />
        ) : null}
      </svg>
      {children}
    </span>
  );
}

export function AnomalyTypeProgressMark({
  type,
  got,
  total,
  title,
  size = "md",
}: {
  type: AnomalyType;
  got: number;
  total: number;
  title: string;
  size?: "sm" | "md" | "lg";
}) {
  const iconPx = size === "lg" ? 44 : size === "sm" ? 26 : 30;
  return (
    <ProgressRing
      got={got}
      total={total}
      title={title}
      tone={type}
      size={size}
    >
      <AnomalyTypeIcon type={type} size={iconPx} onColorBg />
    </ProgressRing>
  );
}

export function CountProgressMark({
  got,
  total,
  title,
  size = "md",
}: {
  got: number;
  total: number;
  title: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <ProgressRing
      got={got}
      total={total}
      title={title}
      tone="all"
      size={size}
    >
      <span className={`mh-donut-count${size === "lg" ? "" : " is-compact"}`}>
        <strong>{got}</strong>
        <span>/{total}</span>
      </span>
    </ProgressRing>
  );
}
