import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ACHIEVEMENT_LIST,
  ACHIEVEMENTS,
  DEFAULT_ACHIEVEMENT,
  type AchievementId,
  type AchievementMeta,
} from "../data/achievements";
import {
  swapAchievementPath,
  useAchievementOptional,
} from "../hooks/useAchievement";
import { useLocale } from "../i18n/LocaleContext";

const SHOW_ALL = ACHIEVEMENTS["show-all"];
const ACHIEVEMENT_OPTIONS = ACHIEVEMENT_LIST.filter((a) => a.id !== "show-all");

function OptionButton({
  achievement,
  selected,
  onPick,
}: {
  achievement: AchievementMeta;
  selected: boolean;
  onPick: (id: AchievementId) => void;
}) {
  const { locale } = useLocale();
  const primary = locale === "uk" ? achievement.nameUk : achievement.nameEn;
  const secondary = locale === "uk" ? achievement.nameEn : achievement.nameUk;
  return (
    <button
      type="button"
      className={
        selected ? "achievement-option active" : "achievement-option"
      }
      onClick={() => onPick(achievement.id)}
    >
      <span className="achievement-option-en">{primary}</span>
      <span className="achievement-option-uk">({secondary})</span>
    </button>
  );
}

export function AchievementSwitcher() {
  const ctx = useAchievementOptional();
  const { locale } = useLocale();
  const achievementId = ctx?.achievementId ?? DEFAULT_ACHIEVEMENT;
  const achievement = ctx?.achievement ?? ACHIEVEMENTS[DEFAULT_ACHIEVEMENT];
  const brandLabel =
    locale === "uk" ? achievement.nameUk : achievement.nameEn;
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setMenuPos(null);
      return;
    }
    const place = () => {
      const rect = btnRef.current!.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (id: AchievementId) => {
    setOpen(false);
    if (id === achievementId) return;
    if (ctx) {
      navigate(swapAchievementPath(location.pathname, id));
      return;
    }
    navigate(`/${id}`);
  };

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            ref={menuRef}
            className="achievement-menu"
            role="listbox"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <li role="option" aria-selected={achievementId === "show-all"}>
              <OptionButton
                achievement={SHOW_ALL}
                selected={achievementId === "show-all"}
                onPick={pick}
              />
            </li>
            <li
              className="achievement-menu-divider"
              role="separator"
              aria-hidden="true"
            />
            {ACHIEVEMENT_OPTIONS.map((a) => (
              <li
                key={a.id}
                role="option"
                aria-selected={a.id === achievementId}
              >
                <OptionButton
                  achievement={a}
                  selected={a.id === achievementId}
                  onPick={pick}
                />
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="achievement-switcher" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="achievement-switcher-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="achievement-switcher-label">{brandLabel}</span>
        <span className="achievement-switcher-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {menu}
    </div>
  );
}
