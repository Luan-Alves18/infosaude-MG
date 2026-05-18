import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type FontSize = "base" | "lg" | "xl";
type Ctx = {
  highContrast: boolean;
  toggleContrast: () => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
  cycleFont: () => void;
};

const AccessibilityCtx = createContext<Ctx | null>(null);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("base");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("high-contrast", highContrast);
    root.classList.remove("font-size-lg", "font-size-xl");
    if (fontSize === "lg") root.classList.add("font-size-lg");
    if (fontSize === "xl") root.classList.add("font-size-xl");
  }, [highContrast, fontSize]);

  const cycleFont = () =>
    setFontSize((s) => (s === "base" ? "lg" : s === "lg" ? "xl" : "base"));

  return (
    <AccessibilityCtx.Provider
      value={{
        highContrast,
        toggleContrast: () => setHighContrast((v) => !v),
        fontSize,
        setFontSize,
        cycleFont,
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
