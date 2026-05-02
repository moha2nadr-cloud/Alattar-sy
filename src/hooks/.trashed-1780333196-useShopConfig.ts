import { useEffect, useRef, useState } from "react";
import { defaultShopConfig, type ShopConfig } from "@/data/herbalShop";

const LEGACY_STORAGE_KEY = "herbal-shop-config";
const POLL_INTERVAL_MS = 8000;

function normalizeConfig(saved: Partial<ShopConfig> | null | undefined): ShopConfig {
  const s = saved ?? {};
  return {
    ...defaultShopConfig,
    ...s,
    settings: { ...defaultShopConfig.settings, ...(s.settings ?? {}) },
    categories: s.categories ?? defaultShopConfig.categories,
    products: (s.products ?? defaultShopConfig.products).map((p) => ({
      availability: "available" as const,
      ...p,
    })),
    slides: s.slides ?? defaultShopConfig.slides,
    productDisplayMode: s.productDisplayMode ?? defaultShopConfig.productDisplayMode,
  };
}

async function fetchConfig(): Promise<{ data: Partial<ShopConfig> | null; updatedAt: string | null }> {
  const res = await fetch("/api/config", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
  return res.json();
}

async function saveRemote(data: ShopConfig): Promise<void> {
  const res = await fetch("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Save failed" }));
    throw new Error(err.error || "Save failed");
  }
}

export function useShopConfig() {
  const [config, setConfigState] = useState<ShopConfig>(defaultShopConfig);
  const [loaded, setLoaded] = useState(false);
  const lastSavedRef = useRef<string>("");
  const lastUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const applyRemote = (data: Partial<ShopConfig>, updatedAt: string | null) => {
      const normalized = normalizeConfig(data);
      const serialized = JSON.stringify(normalized);
      lastUpdatedAtRef.current = updatedAt;
      if (serialized === lastSavedRef.current) return;
      lastSavedRef.current = serialized;
      setConfigState(normalized);
    };

    const load = async () => {
      try {
        const { data, updatedAt } = await fetchConfig();
        if (cancelled) return;

        if (data) {
          applyRemote(data, updatedAt);
          setLoaded(true);
          return;
        }

        // No row yet — migrate any legacy localStorage config, else seed defaults
        let initial: ShopConfig = defaultShopConfig;
        if (typeof window !== "undefined") {
          const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            try {
              initial = normalizeConfig(JSON.parse(legacy));
            } catch {
              // ignore
            }
          }
        }

        try {
          await saveRemote(initial);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(LEGACY_STORAGE_KEY);
          }
        } catch {
          // ignore seed errors
        }

        lastSavedRef.current = JSON.stringify(initial);
        setConfigState(initial);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    };

    const poll = async () => {
      try {
        const { data, updatedAt } = await fetchConfig();
        if (cancelled || !data) return;
        if (updatedAt && updatedAt === lastUpdatedAtRef.current) return;
        applyRemote(data, updatedAt);
      } catch {
        // ignore transient errors
      }
    };

    load();
    timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  const refreshConfig = async (): Promise<ShopConfig> => {
    try {
      const { data, updatedAt } = await fetchConfig();
      if (!data) return config;
      const normalized = normalizeConfig(data);
      lastSavedRef.current = JSON.stringify(normalized);
      lastUpdatedAtRef.current = updatedAt;
      setConfigState(normalized);
      return normalized;
    } catch {
      return config;
    }
  };

  const setConfig = (updater: ShopConfig | ((prev: ShopConfig) => ShopConfig)) => {
    setConfigState((prev) =>
      typeof updater === "function" ? (updater as (p: ShopConfig) => ShopConfig)(prev) : updater
    );
  };

  const saveConfig = async (nextConfig: ShopConfig = config) => {
    const serialized = JSON.stringify(nextConfig);
    lastSavedRef.current = serialized;
    setConfigState(nextConfig);
    await saveRemote(nextConfig);
  };

  const resetConfig = async () => {
    lastSavedRef.current = JSON.stringify(defaultShopConfig);
    setConfigState(defaultShopConfig);
    await saveRemote(defaultShopConfig);
  };

  return { config, setConfig, saveConfig, resetConfig, refreshConfig, loaded };
}
