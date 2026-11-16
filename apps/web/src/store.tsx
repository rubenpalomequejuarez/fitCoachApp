import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppData } from "./types";
import { initialData } from "./data";
import { normalizeData } from "./domain";
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
          return normalizeData(p, initialData);
      }
    } catch {}
    return normalizeData(structuredClone(initialData), initialData);
  });
  const [toast, setToast] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
    } catch {
      setToast(
        "No queda espacio para guardar en este navegador. Exporta tus datos antes de cerrar la página.",
      );
    }
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
          setData(normalizeData(structuredClone(initialData), initialData));
          setToast("Datos de demostración restablecidos");
        },
      }}
    >
      {children}
    </Store.Provider>
  );
}
export const useStore = () => useContext(Store);
