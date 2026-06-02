import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUsage, getPlanLimits, type UsageRecord, type SubscriptionPlan, type PlanLimits } from "../lib/usage-limits";

interface UsageContextType {
  usage: UsageRecord | null;
  limits: PlanLimits;
  remaining: { analyses: number; chats: number };
  loading: boolean;
  refreshUsage: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType>({
  usage: null,
  limits: { monthlyAnalyses: 12, monthlyChatQueries: 30 },
  remaining: { analyses: 0, chats: 0 },
  loading: false,
  refreshUsage: async () => {},
});

export function UsageProvider({
  children,
  userId,
  plan = "free",
}: {
  children: React.ReactNode;
  userId: string | null;
  plan: SubscriptionPlan;
}) {
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const limits = getPlanLimits(plan);

  const refreshUsage = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getUsage(userId);
      setUsage(data);
    } catch {
      // Keep previous usage
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) refreshUsage();
  }, [userId, refreshUsage]);

  const remaining = {
    analyses: Math.max(0, limits.monthlyAnalyses - (usage?.analyses || 0)),
    chats: Math.max(0, limits.monthlyChatQueries - (usage?.chatQueries || 0)),
  };

  return (
    <UsageContext.Provider value={{ usage, limits, remaining, loading, refreshUsage }}>
      {children}
    </UsageContext.Provider>
  );
}

export const useUsage = () => useContext(UsageContext);
