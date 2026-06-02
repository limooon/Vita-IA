/**
 * Usage Limits & Tracking System
 * 
 * Plan limits:
 * ┌──────────┬─────────────────────┬──────────────────┐
 * │ Plan     │ AI Analyses / month │ Cost (USD)       │
 * ├──────────┼─────────────────────┼──────────────────┤
 * │ free     │ 12 (3/week)         │ $0               │
 * │ premium  │ 30 / month          │ $7.99            │
 * │ vita_ia_max│ 200 / month       │ $15.00           │
 * └──────────┴─────────────────────┴──────────────────┘
 * 
 * Usage tracked in Firestore:
 *   usage/{userId}/monthly/{YYYY-MM}
 */

import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ───────────────────────────────────────────────

export type SubscriptionPlan = "free" | "premium" | "vita_ia_max";

export interface UsageRecord {
  userId: string;
  period: string; // "YYYY-MM"
  analyses: number;
  chatQueries: number;
  recipeGenerations: number;
  mealPlanGenerations: number;
  fitnessRoutines: number;
  groceryScans: number;
  digestiveInsights: number;
  mindZenSessions: number;
  updatedAt: string;
}

export interface PlanLimits {
  monthlyAnalyses: number;
  monthlyChatQueries: number;
}

// ─── Plan Configuration ──────────────────────────────────

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    monthlyAnalyses: 12,   // ~3/week
    monthlyChatQueries: 30,
  },
  premium: {
    monthlyAnalyses: 30,
    monthlyChatQueries: 200,
  },
  vita_ia_max: {
    monthlyAnalyses: 200,
    monthlyChatQueries: 500,
  },
};

// ─── Helpers ─────────────────────────────────────────────

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPeriodKey(userId: string, period?: string): string {
  return `usage/${userId}/monthly/${period || getCurrentPeriod()}`;
}

// ─── Usage Tracking ──────────────────────────────────────

/**
 * Get current usage for a user in the current month
 */
export async function getUsage(userId: string, period?: string): Promise<UsageRecord> {
  const p = period || getCurrentPeriod();
  try {
    const docRef = doc(db, getPeriodKey(userId, p));
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UsageRecord;
    }
  } catch { /* Fallback below */ }

  return {
    userId,
    period: p,
    analyses: 0,
    chatQueries: 0,
    recipeGenerations: 0,
    mealPlanGenerations: 0,
    fitnessRoutines: 0,
    groceryScans: 0,
    digestiveInsights: 0,
    mindZenSessions: 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Track an AI usage event atomically in Firestore
 */
export async function trackUsage(
  userId: string,
  event:
    | "analysis"
    | "chat"
    | "recipe"
    | "meal_plan"
    | "fitness_routine"
    | "grocery_scan"
    | "digestive"
    | "mind_zen",
  incrementBy: number = 1
): Promise<UsageRecord> {
  const period = getCurrentPeriod();
  const docRef = doc(db, getPeriodKey(userId, period));

  const fieldMap: Record<string, string> = {
    analysis: "analyses",
    chat: "chatQueries",
    recipe: "recipeGenerations",
    meal_plan: "mealPlanGenerations",
    fitness_routine: "fitnessRoutines",
    grocery_scan: "groceryScans",
    digestive: "digestiveInsights",
    mind_zen: "mindZenSessions",
  };

  const field = fieldMap[event];
  if (!field) throw new Error(`Unknown event: ${event}`);

  try {
    await setDoc(
      docRef,
      {
        userId,
        period,
        [field]: increment(incrementBy),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Firestore offline/inaccessible — don't block the request
    console.warn(`Could not track usage for ${userId}/${event}`);
  }

  return getUsage(userId, period);
}

/**
 * Check if user has exceeded their plan limits for a given action
 * Returns { allowed: boolean, used: number, limit: number, remaining: number }
 */
export async function checkLimit(
  userId: string,
  plan: SubscriptionPlan,
  event: "analysis" | "chat"
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const usage = await getUsage(userId);

  const used = event === "analysis" ? usage.analyses : usage.chatQueries;
  const limit = event === "analysis" ? limits.monthlyAnalyses : limits.monthlyChatQueries;

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Get plan limits for display in UI
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}
