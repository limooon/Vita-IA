import React, { useState } from "react";
import { UserProfile } from "../types";
import { Check, X, Sparkles, CreditCard, Star, RefreshCcw, ShieldCheck, Dumbbell, Award, Flame } from "lucide-react";
import { motion } from "motion/react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { initiateCheckout, isDevMode } from "../lib/payments";

interface PremiumPlansProps {
  user: UserProfile;
  onUpgradeSuccess: () => Promise<void>;
  onViewChange: (view: string) => void;
}

export default function PremiumPlans({
  user,
  onUpgradeSuccess,
  onViewChange
}: PremiumPlansProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckoutSimulation = async (plan: "premium" | "vita_ia_max") => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const isMax = plan === "vita_ia_max";
      const result = await initiateCheckout(plan, user.uid, user.email);

      if (!result.success) {
        throw new Error(result.error || "No se pudo iniciar el pago");
      }

      if (result.needsNativeIAP) {
        // Mobile native IAP: platform-specific purchase flow
        // In production, trigger StoreKit / Google Play Billing here
        // For dev, simulate success
        setTimeout(async () => {
          const newStatus = isMax ? "vita_ia_max" : "premium";
          try { await updateDoc(doc(db, "users", user.uid), { subscriptionStatus: newStatus }); } catch (e) {}
          localStorage.setItem(`premium_checkout_completed_${user.uid}`, newStatus);
          await onUpgradeSuccess();
          setLoading(false);
          onViewChange(isMax ? "vita-ia-max" : "dashboard");
        }, 1500);
        return;
      }

      if (result.mock) {
        // Dev mode: simulate payment
        setTimeout(async () => {
          const newStatus = isMax ? "vita_ia_max" : "premium";
          try { await updateDoc(doc(db, "users", user.uid), { subscriptionStatus: newStatus }); } catch (e) {}
          localStorage.setItem(`premium_checkout_completed_${user.uid}`, newStatus);
          await onUpgradeSuccess();
          setLoading(false);
          onViewChange(isMax ? "vita-ia-max" : "dashboard");
        }, 1500);
        return;
      }

      // Real Stripe: redirect to checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      throw new Error("No se recibió URL de pago");

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "No se pudo conectar con la pasarela de pagos.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12" id="premium-plans-viewport">
      
      {/* Title block */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold py-0.5 px-3 rounded-full uppercase tracking-widest border border-amber-200 dark:border-amber-900 inline-block">Planes de Membresía</span>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Transforma Tu Rendimiento Con Inteligencia Artificial</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
          Elige la herramienta perfecta para tu nivel físico. Desde el análisis gástrico diario hasta la ciencia deportiva y biomecánica extrema de nivel profesional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
        
        {/* FREE TIER CARD */}
        <div className="rounded-3xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Vita IA Free</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Económico. Herramientas esenciales de nutrición inteligente.</p>
            </div>

            <div className="flex items-baseline space-x-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">$0.00</span>
              <span className="text-xs text-slate-450 dark:text-slate-500">USD / de por vida</span>
            </div>

            {/* Feature lists */}
            <ul className="space-y-3.5">
              {[
                { label: "3 Análisis de Alimentos diarios por foto (VitaScan)", ok: true },
                { label: "1 Consulta Chat IA por día (VitaCoach)", ok: true },
                { label: "Buscador de recetas sanas (VitaRecipes)", ok: true },
                { label: "Detector de ingredientes básicos", ok: true },
                { label: "Soporte con anuncios publicitarios integrados", ok: true },
                { label: "Planificador integral de dietas (VitaPlan)", ok: false },
                { label: "Bienestar Mental y Registro (VitaMind)", ok: false },
                { label: "Bitácora Deportiva y carga de RM inteligente", ok: false }
              ].map((f, i) => (
                <li key={i} className="flex items-center space-x-2.5 text-xs">
                  {f.ok ? (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-slate-300 dark:text-slate-700 shrink-0" />
                  )}
                  <span className={f.ok ? "text-slate-650 dark:text-slate-350" : "text-slate-400 dark:text-slate-500 line-through"}>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onViewChange("dashboard")}
              className="w-full text-center rounded-xl bg-slate-50 dark:bg-slate-800 py-3 text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
            >
              Continuar con Cuenta Libre
            </button>
          </div>
        </div>

        {/* PLUS TIER CARD */}
        <div className="rounded-3xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Vita IA Plus ✨</h3>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase border border-emerald-150">Sin límites</span>
            </div>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Óptimo para personas con molestias gástricas frecuentes.</p>

            <div className="flex items-baseline space-x-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">$7.99</span>
              <span className="text-xs text-slate-450 dark:text-slate-500">USD / mes</span>
            </div>

             {/* Feature lists */}
            <ul className="space-y-3 px-1">
              {[
                { label: "Análisis FOTOGRÁFICOS ILIMITADOS con VitaScan", ok: true },
                { label: "Consultorio Chat IA ilimitado 24/7 (VitaCoach)", ok: true },
                { label: "Programa de DIETAS e historial (VitaPlan)", ok: true },
                { label: "Asistente y Entrenador Deportivo (VitaPerformance)", ok: true },
                { label: "Seguimiento Deportivo y Métricas de Esfuerzo", ok: true },
                { label: "Registro Emocional y Bienestar Mental (VitaMind)", ok: true },
                { label: "Desafíos Diarios con Insignias de Nivel", ok: true },
                { label: "Experiencia 100% LIBRE de publicidad", ok: true }
              ].map((f, i) => (
                <li key={i} className="flex items-start space-x-2.5 text-xs">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-750 dark:text-slate-300 font-medium leading-tight">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 space-y-3">
            {user.subscriptionStatus === "premium" || user.subscriptionStatus === "vita_ia_max" ? (
              <div className="w-full text-center rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                ⭐ Acceso Plus habilitado
              </div>
            ) : (
              <button
                id="checkout-premium-gate-btn"
                onClick={() => handleCheckoutSimulation("premium")}
                disabled={loading}
                className="w-full text-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 text-xs font-extrabold text-white shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    <span>Conectando con Stripe...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Suscribirse por $7.99</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* VITA IA MAX ELITE TIER CARD - NEW CORE REQUIREMENT */}
        <div className="rounded-3xl border-2 border-rose-500 bg-white dark:bg-slate-900 p-6 shadow-xl flex flex-col justify-between relative overflow-hidden transform md:scale-[1.03] transition-all">
          
          {/* Best value tag */}
          <div className="absolute right-0 top-0 bg-rose-500 text-white text-[9px] font-extrabold uppercase py-1 px-4 rounded-bl-xl tracking-wider animate-pulse flex items-center gap-1">
            <Award className="h-3 w-3" />
            <span>Elite Maximo</span>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>Vita IA Max</span>
                <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full uppercase">VIP</span>
              </h3>
            </div>
            <p className="text-xs text-rose-500 font-extrabold">Para fisicoculturistas, deportistas y atletas de elite.</p>

            <div className="flex items-baseline space-x-1 border-b border-rose-150 dark:border-rose-950 pb-4">
              <span className="text-3xl font-black text-rose-500">$15.00</span>
              <span className="text-xs text-slate-450 dark:text-slate-500">USD / mes</span>
            </div>

             {/* Feature lists */}
            <ul className="space-y-3.5 px-1">
              {[
                { label: "Todo lo incluido en el Plan Plus ✨", ok: true },
                { label: "Coach Vision Max: Sube capturas de pantalla de rutinas y obtén biomecánica por IA", ok: true },
                { label: "Calculadora Avanzada de 1-Repetition Maximum (1RM) con fórmulas científicas", ok: true },
                { label: "Tracker de sobrecarga progresiva integrado con RPE y RIR para evitar estancamiento", ok: true },
                { label: "Dosificador deportivo de suplementos y ayudas ergogénicas pro basado en tu peso", ok: true },
                { label: "Diseñador de mesociclos periódicos de 4 semanas personalizado por nuestro motor IA", ok: true },
                { label: "Soporte VIP prioritario 24/7 directamente con el equipo de entrenadores de Vita IA", ok: true }
              ].map((f, i) => (
                <li key={i} className="flex items-start space-x-2.5 text-xs">
                  <Check className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-slate-750 dark:text-slate-200 font-extrabold leading-tight">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 space-y-3">
            {user.subscriptionStatus === "vita_ia_max" ? (
              <div className="w-full text-center rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 py-3 text-xs font-black text-rose-600 dark:text-rose-400">
                👑 Rango Max Masivo Activado
              </div>
            ) : (
              <button
                id="checkout-max-gate-btn"
                onClick={() => handleCheckoutSimulation("vita_ia_max")}
                disabled={loading}
                className="w-full text-center rounded-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-650 py-3 text-xs font-black text-white shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    <span>Iniciando Portal de Atleta...</span>
                  </>
                ) : (
                  <>
                    <Dumbbell className="h-4 w-4 animate-bounce" />
                    <span>Obtener Vita IA Max — $15.00/Mes</span>
                  </>
                )}
              </button>
            )}

            {errorMessage && (
              <p className="text-[10px] text-center text-rose-500 font-medium">{errorMessage}</p>
            )}

            <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-rose-500" />
              <span>Garantía absoluta de rendimiento de primer nivel.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
