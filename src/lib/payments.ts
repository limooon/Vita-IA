import { Capacitor } from "@capacitor/core";

// Payment plans configuration
export const PLANS = {
  premium: {
    id: "premium",
    name: "Vita IA Plus",
    price: 7.99,
    storeProductId: "vita_premium_monthly", // iOS/Android product ID
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PREMIUM || "price_premium_monthly",
  },
  vita_ia_max: {
    id: "vita_ia_max",
    name: "Vita IA Max",
    price: 15.00,
    storeProductId: "vita_max_monthly",
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MAX || "price_vita_max_monthly",
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Detect platform
export function getPlatform(): "web" | "ios" | "android" {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return "web";
}

// Dev mode: simulates successful payment for testing without real Stripe/IAP
export async function isDevMode(): Promise<boolean> {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    return data.environment === "development";
  } catch {
    return true; // Assume dev if can't reach server
  }
}

// Payment gateway abstraction
export async function initiateCheckout(
  plan: PlanId,
  userId: string,
  email: string
): Promise<{
  success: boolean;
  checkoutUrl?: string;
  mock?: boolean;
  error?: string;
  needsNativeIAP?: boolean;
}> {
  const platform = getPlatform();
  const dev = await isDevMode();

  // Dev mode: simulate payment immediately
  if (dev) {
    return {
      success: true,
      mock: true,
      checkoutUrl: `${window.location.origin}/?payment_success=true&plan=${plan}`,
    };
  }

  // Native mobile: trigger in-app purchase flow
  if (platform === "ios" || platform === "android") {
    return { success: true, needsNativeIAP: true, mock: false };
  }

  // Web: use Stripe checkout
  const planConfig = PLANS[plan];
  const response = await fetch("/api/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planName: plan,
      priceAmount: planConfig.price,
      userId,
      email,
      successUrl: `${window.location.origin}/?payment_success=true&plan=${plan}`,
      cancelUrl: `${window.location.origin}/?payment_cancelled=true`,
    }),
  });

  const data = await response.json();
  return data;
}

// Verify payment after redirect from Stripe or native IAP
export async function verifyPayment(
  plan: PlanId,
  userId: string
): Promise<{
  verified: boolean;
  subscriptionStatus: "free" | "premium" | "vita_ia_max";
}> {
  const dev = await isDevMode();

  // In dev mode, just return the subscribed plan
  if (dev) {
    return {
      verified: true,
      subscriptionStatus: plan === "vita_ia_max" ? "vita_ia_max" : "premium",
    };
  }

  // In production, verify with server
  try {
    const res = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { verified: false, subscriptionStatus: "free" };
  }
}
