import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Language = "en" | "es";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LANGUAGE_STORAGE_KEY = "portfolio-language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (savedLanguage === "en" || savedLanguage === "es") {
    return savedLanguage;
  }

  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
