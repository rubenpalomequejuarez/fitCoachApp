import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppData } from "./types";
import { initialData } from "./data";
const STORAGE = "fitcoach-prototype-v1";
const Store = createContext<{
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  notify: (s: string) => void;
  toast: string;
  reset: () => void;
}>(null!);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    try {
      const v = localStorage.getItem(STORAGE);
      if (v) {
        const p = JSON.parse(v);
        if (
          Array.isArray(p.clients) &&
          Array.isArray(p.exercises) &&
          p.completed
        )
          return p;
      }
    } catch {}
    return structuredClone(initialData);
  });
  const [toast, setToast] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
    } catch {}
  }, [data]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  return (
    <Store.Provider
      value={{
        data,
        setData,
        notify: setToast,
        toast,
        reset: () => {
          setData(structuredClone(initialData));
          setToast("Datos de demostración restablecidos");
        },
      }}
    >
      {children}
    </Store.Provider>
  );
}
export const useStore = () => useContext(Store);
