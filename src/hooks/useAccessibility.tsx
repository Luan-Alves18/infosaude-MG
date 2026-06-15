import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type FontSize = "base" | "lg" | "xl";
type Ctx = {
  highContrast: boolean;
  toggleContrast: () => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
  cycleFont: () => void;
  underlineLinks: boolean;
  toggleUnderlineLinks: () => void;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
  reset: () => void;
};

const AccessibilityCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "a11y_prefs_v1";

type Persisted = {
  highContrast: boolean;
  fontSize: FontSize;
  underlineLinks: boolean;
  reduceMotion: boolean;
};

const load = (): Persisted => {
  if (typeof window === "undefined")
    return { highContrast: false, fontSize: "base", underlineLinks: false, reduceMotion: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no");
    return JSON.parse(raw);
  } catch {
    return { highContrast: false, fontSize: "base", underlineLinks: false, reduceMotion: false };
  }
};

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const initial = load();
  const [highContrast, setHighContrast] = useState(initial.highContrast);
  const [fontSize, setFontSize] = useState<FontSize>(initial.fontSize);
  const [underlineLinks, setUnderlineLinks] = useState(initial.underlineLinks);
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("high-contrast", highContrast);
    root.classList.remove("font-size-lg", "font-size-xl");
    if (fontSize === "lg") root.classList.add("font-size-lg");
    if (fontSize === "xl") root.classList.add("font-size-xl");
    root.classList.toggle("a11y-underline-links", underlineLinks);
    root.classList.toggle("a11y-reduce-motion", reduceMotion);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ highContrast, fontSize, underlineLinks, reduceMotion }),
      );
    } catch {
      /* ignore */
    }
  }, [highContrast, fontSize, underlineLinks, reduceMotion]);

  const cycleFont = () =>
    setFontSize((s) => (s === "base" ? "lg" : s === "lg" ? "xl" : "base"));

  const reset = () => {
    setHighContrast(false);
    setFontSize("base");
    setUnderlineLinks(false);
    setReduceMotion(false);
  };

  return (
    <AccessibilityCtx.Provider
      value={{
        highContrast,
        toggleContrast: () => setHighContrast((v) => !v),
        fontSize,
        setFontSize,
        cycleFont,
        underlineLinks,
        toggleUnderlineLinks: () => setUnderlineLinks((v) => !v),
        reduceMotion,
        toggleReduceMotion: () => setReduceMotion((v) => !v),
        reset,
      }}
    >
      {children}
    </AccessibilityCtx.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityCtx);
  if (!ctx) throw new Error("useAccessibility outside provider");
  return ctx;
};
