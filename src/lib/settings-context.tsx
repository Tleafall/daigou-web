"use client";

import { createContext, useContext } from "react";
import type { Settings } from "@/lib/settings-store";

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({
  value,
  children,
}: {
  value: Settings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings 必須在 SettingsProvider 內使用");
  return ctx;
}
