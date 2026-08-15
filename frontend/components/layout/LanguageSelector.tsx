// frontend/components/layout/LanguageSelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { LANGUAGES, detectLanguage, setLanguage, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  onLanguageChange?: (lang: Language) => void;
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const [current, setCurrent] = useState<Language>("en");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(detectLanguage());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === current);

  function handleSelect(lang: Language) {
    setCurrent(lang);
    setLanguage(lang);
    setOpen(false);
    onLanguageChange?.(lang);
    // Set html lang attribute
    document.documentElement.lang = lang;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 px-2 text-[12px] font-semibold tracking-wider text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground"
        aria-label={`Language: ${currentLang?.label ?? "English"}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="hidden sm:inline">{currentLang?.nativeLabel ?? "English"}</span>
        <span className="sm:hidden">{current.toUpperCase()}</span>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="animate-scale-in absolute right-0 top-[calc(100%+6px)] z-50 max-h-80 w-52 overflow-y-auto border border-border bg-background py-1.5 shadow-panel custom-scrollbar"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={lang.code === current}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors",
                lang.code === current
                  ? "font-medium text-foreground"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-foreground",
              )}
            >
              <span>{lang.nativeLabel}</span>
              {lang.code === current && (
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
