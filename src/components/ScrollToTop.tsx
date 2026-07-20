import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window scroll on route changes (landing → achievement was keeping offset). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
