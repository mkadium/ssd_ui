import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  LanguageContext,
  translations,
  type LanguageContextValue,
  type SupportedLanguage,
} from "@/providers/language-context";

const storageKey = "ssd-ui-language";

function readInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en-IN";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "hi-IN" ? "hi-IN" : "en-IN";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(readInitialLanguage);

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(storageKey, nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => translations[language][key] ?? translations["en-IN"][key] ?? key,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
