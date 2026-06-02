import React, { createContext, useContext, useState, useEffect } from "react";
import { isDevMode } from "../lib/payments";

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
  isDevMode: false,
  toggleDevMode: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDev, setIsDev] = useState(() => {
    return localStorage.getItem("vita_dev_mode") === "true";
  });

  useEffect(() => {
    // Check server environment on mount
    isDevMode().then((serverDev) => {
      if (serverDev && !localStorage.getItem("vita_dev_mode")) {
        setIsDev(true);
        localStorage.setItem("vita_dev_mode", "true");
      }
    });
  }, []);

  const toggleDevMode = () => {
    setIsDev((prev) => {
      const next = !prev;
      localStorage.setItem("vita_dev_mode", String(next));
      return next;
    });
  };

  return (
    <DevModeContext.Provider value={{ isDevMode: isDev, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
