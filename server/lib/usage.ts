/**
 * Server-side Usage Tracking with Firebase Admin SDK
 * 
 * Directly reads/writes Firestore for usage enforcement.
 * Cannot be bypassed by the client since it runs on the server.
 */

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// ─── Types ───────────────────────────────────────────────

export type SubscriptionPlan = "free" | "premium" | "vita_ia_max";

export interface ServerUsageRecord {
  userId: string;
  period: string;
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

// ─── Plan Limits ─────────────────────────────────────────

export const SERVER_PLAN_LIMITS: Record<SubscriptionPlan, { monthlyAnalyses: number; monthlyChatQueries: number }> = {
  free: { monthlyAnalyses: 12, monthlyChatQueries: 30 },
  premium: { monthlyAnalyses: 30, monthlyChatQueries: 200 },
  vita_ia_max: { monthlyAnalyses: 200, monthlyChatQueries: 500 },
};

// ─── Initialize Admin SDK ─────────────────────────────────

let db: FirebaseFirestore.Firestore | null = null;
let initialized = false;

export function initFirebaseAdmin(projectId?: string): void {
  if (initialized) return;

  try {
    // Try Application Default Credentials first (works on GCP/Cloud Run)
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: projectId || process.env.FIREBASE_PROJECT_ID || "vitaia-ea02e",
        credential: admin.credential.applicationDefault(),
      });
    }
    db = getFirestore();
    initialized = true;
    console.log("[VitaIA] Firebase Admin SDK initialized");
  } catch (err: any) {
    console.warn("[VitaIA] Firebase Admin init failed (will use in-memory fallback):", err.message);
  }
}

// ─── In-Memory Fallback ──────────────────────────────────

const memoryStore = new Map<string, ServerUsageRecord>();

function getPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getDocKey(userId: string, period?: string): string {
  return `${userId}_${period || getPeriod()}`;
}

// ─── Usage API ───────────────────────────────────────────

export async function getServerUsage(
  userId: string,
  period?: string
): Promise<ServerUsageRecord> {
  const p = period || getPeriod();

  // Firestore path
  if (db) {
    try {
      const docRef = db.collection("usage").doc(userId).collection("monthly").doc(p);
      const snap = await docRef.get();
      if (snap.exists) return snap.data() as ServerUsageRecord;
    } catch (err) {
      console.warn("[Usage] Firestore read failed, falling back to memory");
    }
  }

  // Memory fallback
  const key = getDocKey(userId, p);
  return (
    memoryStore.get(key) || {
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
    }
  );
}

export async function trackServerUsage(
  userId: string,
  event: "analysis" | "chat" | "recipe" | "meal_plan" | "fitness_routine" | "grocery_scan" | "digestive" | "mind_zen",
  incrementBy: number = 1
): Promise<ServerUsageRecord> {
  const period = getPeriod();
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

  // Firestore
  if (db) {
    try {
      const docRef = db.collection("usage").doc(userId).collection("monthly").doc(period);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        const current = snap.exists ? (snap.data()?.[field] || 0) : 0;
        tx.set(
          docRef,
          {
            userId,
            period,
            [field]: current + incrementBy,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
    } catch (err) {
      console.warn("[Usage] Firestore write failed, using memory fallback:", err);
    }
  }

  // Memory fallback
  const key = getDocKey(userId, period);
  const current = memoryStore.get(key) || {
    userId,
    period,
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
  (current as any)[field] =
    ((current as any)[field] || 0) + incrementBy;
  current.updatedAt = new Date().toISOString();
  memoryStore.set(key, current);
  return current;
}

export async function checkServerLimit(
  userId: string,
  plan: SubscriptionPlan,
  event: "analysis" | "chat"
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const limits = SERVER_PLAN_LIMITS[plan] || SERVER_PLAN_LIMITS.free;
  const usage = await getServerUsage(userId);
  const used = event === "analysis" ? usage.analyses : usage.chatQueries;
  const limit = event === "analysis" ? limits.monthlyAnalyses : limits.monthlyChatQueries;

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}
