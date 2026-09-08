import { useState, type ReactNode } from "react";
import { useLocale } from "../i18n/LocaleContext";

export function MapDrawerBlock({
  title,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className={className ? `mh-drawer-block ${className}` : "mh-drawer-block"}
      open={open}
    >
      <summary
        className="mh-drawer-block-title"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        {title}
      </summary>
      {children}
    </details>
  );
}

export function MapLegend({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  return (
    <MapDrawerBlock title={t("legendTitle")} className="map-legend-block">
      {children}
    </MapDrawerBlock>
  );
}
