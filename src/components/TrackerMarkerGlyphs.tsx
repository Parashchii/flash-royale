import nonStopIcon from "../assets/markers/nonstop-can.png";

/** Match anomaly map pins. */
export const TRACKER_MARKER_SIZE = 31;
const GLYPH_SIZE = 20;

const STAR_PATH =
  "M12 2.05 14.9 8.2l6.8.58-5.18 4.5 1.58 6.64L12 16.62l-6.1 3.3 1.58-6.64-5.18-4.5 6.8-.58z";

/** USB flash drive traced from the Flash Royale marker icon. */
const FLASH_PATH =
  "M7.74 1.23C7.58 1.29 7.42 1.43 7.35 1.56L7.28 1.69V6.6H6.84C6.37 6.61 6.29 6.64 6.11 6.82C5.9 7.02 5.92 6.45 5.93 13.55C5.94 19.55 5.94 19.92 5.98 20.11C6.06 20.43 6.16 20.7 6.31 20.99C6.76 21.88 7.61 22.53 8.62 22.75C8.84 22.8 9.03 22.8 12.01 22.8H15.18L15.42 22.74C16.76 22.41 17.69 21.47 18.02 20.11C18.06 19.92 18.06 19.55 18.07 13.55C18.08 6.45 18.1 7.02 17.89 6.82C17.71 6.64 17.63 6.61 17.16 6.6H16.73V1.69L16.65 1.56C16.58 1.43 16.42 1.29 16.26 1.23C16.2 1.21 15.13 1.2 12 1.2C8.87 1.2 7.8 1.21 7.74 1.23zM15.38 4.57V6.6H8.62V2.55H15.38V4.57zM16.72 13.87C16.72 20.54 16.74 19.89 16.51 20.35C16.41 20.54 16.35 20.63 16.12 20.86C15.89 21.08 15.81 21.15 15.62 21.24C15.16 21.47 15.42 21.45 12 21.45C8.58 21.45 8.84 21.47 8.38 21.24C8.19 21.15 8.1 21.08 7.89 20.87C7.61 20.59 7.47 20.38 7.35 20.04L7.28 19.83V7.95H16.73V13.87zM9.97 4.57V5.25H11.32V3.9H9.97V4.57zM12.68 4.57V5.25H14.03V3.9H12.68V4.57z";

/** Drafting compass traced from the scanner marker icon. */
const SCANNER_PATH =
  "M11.29 1.79C10.83 2.01 10.5 2.81 10.5 3.74C10.5 4.45 10.45 4.57 10.08 4.82C8.83 5.65 8.38 7.6 9.08 8.99C9.41 9.66 10.47 10.43 11.26 10.62C13.07 11.06 14.93 9.83 15.22 7.99C15.41 6.81 14.86 5.44 13.92 4.82C13.55 4.57 13.5 4.45 13.5 3.74C13.5 2.07 12.51 1.2 11.29 1.79zM12.69 6.61C13.52 7.32 13.08 8.52 12 8.52C11.32 8.52 10.9 8.11 10.9 7.44C10.9 6.91 11.5 6.27 12 6.27C12.15 6.27 12.47 6.43 12.69 6.61zM7.79 13.3L6.8 15.51L6.02 15.55C5.4 15.58 5.19 15.68 4.94 15.99C4.56 16.49 4.56 16.8 4.95 17.3L5.25 17.69H18.75L19.05 17.3C19.44 16.8 19.44 16.49 19.06 15.99C18.81 15.68 18.6 15.58 17.98 15.55L17.2 15.51L16.22 13.33C15.7 12.13 15.25 11.14 15.22 11.11C15.2 11.08 14.93 11.23 14.63 11.45C14.31 11.66 13.79 11.9 13.44 12.01C13.1 12.1 12.77 12.22 12.71 12.28C12.65 12.34 12.86 12.95 13.19 13.66C14.04 15.55 14.06 15.58 13.55 15.58C13.22 15.58 13.08 15.46 12.9 15.09C12.69 14.65 12.62 14.61 12 14.61C11.38 14.61 11.31 14.65 11.1 15.09C10.92 15.46 10.78 15.58 10.45 15.58C9.94 15.58 9.96 15.55 10.81 13.66C11.14 12.95 11.35 12.34 11.29 12.28C11.23 12.22 10.9 12.1 10.56 12.01C10.21 11.9 9.69 11.66 9.38 11.45C9.08 11.24 8.81 11.08 8.8 11.08C8.78 11.08 8.33 12.08 7.79 13.3zM4.74 20.12C4.23 21.3 4.23 21.75 4.72 22.33C5.04 22.72 5.22 22.8 5.75 22.8C6.56 22.8 6.84 22.5 7.54 20.97C8.42 19.03 8.5 19.19 6.71 19.19H5.15L4.74 20.12zM15.83 19.51C16.07 20.26 17.01 22.15 17.31 22.45C17.53 22.71 17.79 22.8 18.25 22.8C18.78 22.8 18.96 22.72 19.28 22.33C19.77 21.75 19.77 21.3 19.26 20.12L18.85 19.19H17.29C15.79 19.19 15.74 19.21 15.83 19.51z";

function svgHtml(path: string, size: number, fillRule?: "evenodd") {
  const rule = fillRule ? ` fill-rule="${fillRule}"` : "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="${path}"${rule}/></svg>`;
}

export function FlashGlyph({ size = GLYPH_SIZE }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d={FLASH_PATH} fillRule="evenodd" />
    </svg>
  );
}

export function StarGlyph({ size = GLYPH_SIZE }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

export function ScannerGlyph({ size = GLYPH_SIZE }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d={SCANNER_PATH} fillRule="evenodd" />
    </svg>
  );
}

export function NonStopGlyph({ height = 22 }: { height?: number }) {
  return (
    <img
      className="ns-marker-can"
      src={nonStopIcon}
      alt=""
      height={height}
    />
  );
}

export function flashMarkerHtml(tone: string, extraClass = ""): string {
  return `<span class="fr-marker fr-marker-${tone}${extraClass}">${svgHtml(FLASH_PATH, GLYPH_SIZE, "evenodd")}</span>`;
}

export function archMarkerHtml(got: boolean): string {
  const tone = got ? "collected" : "missing";
  return `<span class="aa-marker aa-marker-${tone}">${svgHtml(STAR_PATH, GLYPH_SIZE)}</span>`;
}

export function scannerMarkerHtml(got: boolean): string {
  const tone = got ? "collected" : "missing";
  return `<span class="sc-marker sc-marker-${tone}">${svgHtml(SCANNER_PATH, GLYPH_SIZE, "evenodd")}</span>`;
}

export function nonStopMarkerHtml(got: boolean): string {
  const tone = got ? "collected" : "missing";
  return `<span class="ns-marker ns-marker-${tone}"><img class="ns-marker-can" src="${nonStopIcon}" alt="" height="22" /></span>`;
}
