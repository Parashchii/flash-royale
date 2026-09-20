const CHIP_MS = 4200;

export function showViewportChip(text: string) {
  document.querySelector(".mh-viewport-chip")?.remove();
  const el = document.createElement("div");
  el.className = "mh-viewport-chip";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => {
    el.remove();
  }, CHIP_MS);
}
