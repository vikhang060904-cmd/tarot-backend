import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language, type Translations } from "./translations";

// ── Types ────────────────────────────────────────────────────
interface LanguageContextValue {
  lang: Language;
  t: Translations;
  toggleLang: () => void;
  setLang: (l: Language) => void;
}

// ── Context ──────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "tarot_lang";

// ── Provider ─────────────────────────────────────────────────
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === "en" || saved === "vi") return saved;
    // Auto-detect browser language
    const browser = navigator.language?.toLowerCase() ?? "vi";
    return browser.startsWith("vi") ? "vi" : "en";
  });

  // Persist whenever lang changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    // Optionally set <html lang="..."> for SEO/accessibility
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Language) => setLangState(l);
  const toggleLang = () => setLangState((prev) => (prev === "vi" ? "en" : "vi"));

  const value: LanguageContextValue = {
    lang,
    t: translations[lang],
    toggleLang,
    setLang,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────
export const useLang = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
};
