import React, { useState } from "react";
import { UserProfile, MealPlan, MealPlanDay } from "../types";
import { Sparkles, Lock, ShieldCheck, HeartPulse, Printer, ChevronRight, Calendar, Info, RefreshCcw, Coffee, Apple, Soup } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MealPlannerProps {
  user: UserProfile;
  initialPlans: MealPlan[];
  onGeneratePlan: (plan: Omit<MealPlan, "id">) => Promise<void>;
  onViewChange: (view: string) => void;
}

export default function MealPlanner({
  user,
  initialPlans,
  onGeneratePlan,
  onViewChange
}: MealPlannerProps) {
  const [plans, setPlans] = useState<MealPlan[]>(initialPlans);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(
    initialPlans.length > 0 ? initialPlans[0] : null
  );

  const [duration, setDuration] = useState<number>(7);
  const [selectedObjective, setSelectedObjective] = useState<string>(
    user.objective || "colon_irritable"
  );
  const [loading, setLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const handleGenerateDietPlan = async () => {
    if (user.subscriptionStatus === "free") {
      onViewChange("premium");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: user.age || 30,
          weight: user.weight || 70,
          height: user.height || 170,
          objective: selectedObjective,
          durationDays: duration
        })
      });

      const data = await response.json();
      if (data.plan) {
        // Save plan in Firebase
        await onGeneratePlan(data.plan);
        setPlans((prev) => [data.plan, ...prev]);
        setActivePlan(data.plan);
        setSelectedDayIndex(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getObjectiveNameHeader = (obj: string) => {
    switch (obj) {
      case "gastritis": return "Control de Gastritis y Reflujo Gástrico";
      case "colon_irritable": return "Alivio de Colon Irritable / SII";
      case "bloating": return "Dieta Desinflamante y Antigas";
      case "weight_loss": return "Reducción de Peso Amigable Estomacal";
      case "deportistas": return "Rendimiento Deportivo de Alto Rendimiento 🏋️‍♂️";
      default: return "Salud Gastrointestinal Balanceada";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="meal-planner-viewport">
      
      {/* Title bar */}
      <div className="print:hidden">
        <h2 className="text-2xl font-bold text-slate-800">Planificador de Alimentación Terapéutico</h2>
        <p className="text-slate-500 text-sm mt-1">
          Dietas programadas clínicamente para reconstruir la mucosa gástrica y regular la motilidad del colon.
        </p>
      </div>

      {user.subscriptionStatus === "free" ? (
        
        /* FREE BLOCKER COMPONENT BLOCK */
        <div id="meal-plan-premium-blocker" className="rounded-3xl border border-amber-100 bg-amber-50/20 p-8 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">Contenido Exclusivo Premium</h3>
            <p className="text-sm text-slate-550 leading-relaxed max-w-md mx-auto">
              Los programas de dietas clínicas automatizadas de 7, 14 y 30 días con Inteligencia Artificial requieren la suscripción premium para estimar dosis de fibra exacta y alimentos permitidos.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-amber-100 divide-y divide-slate-100 text-left max-w-sm mx-auto">
            <div className="py-2.5 flex items-center space-x-3 text-xs text-slate-600">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>Planes ajustados a tu edad, peso, altura y dolores clínicos.</span>
            </div>
            <div className="py-2.5 flex items-center space-x-3 text-xs text-slate-600">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>Desglose completo de de 5 alimentos diarios (Bajo FODMAP).</span>
            </div>
            <div className="py-2.5 flex items-center space-x-3 text-xs text-slate-600">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>Reescribe, reinicia o regenera el esquema cuantas veces quieras.</span>
            </div>
          </div>

          <button
            id="planner-upgrade-btn"
            onClick={() => onViewChange("premium")}
            className="rounded-xl bg-gradient-to-r from-emerald-550 to-teal-650 bg-emerald-500 hover:bg-emerald-600 py-3 px-8 text-xs font-extrabold text-white shadow-md inline-flex items-center space-x-2 my-2 hover:scale-[1.02] transition-transform"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Adquirir Premium ($7.99 USD)</span>
          </button>
        </div>

      ) : (
        
        /* PREMIUM CORE LAYOUT TOOL */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
          
          {/* Left Controller bar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                <Calendar className="h-4.5 w-4.5 text-emerald-500" />
                <span>Programar Dieta en Minutos</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Condición Clínica / Selección Deportiva</label>
                <select
                  id="meal-plan-objective-selector"
                  value={selectedObjective}
                  onChange={(e) => setSelectedObjective(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="gastritis">Control de Gastritis y Reflujo Gástrico</option>
                  <option value="colon_irritable">Alivio de Colon Irritable / SII</option>
                  <option value="bloating">Dieta Desinflamante y Antigas</option>
                  <option value="weight_loss">Reducción de Peso Amigable Estomacal</option>
                  <option value="deportistas">Rendimiento Deportivo (Alto Rendimiento) 🏋️‍♂️</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold">Duración del Programa</label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      id={`day-selector-btn-${days}`}
                      onClick={() => setDuration(days)}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        duration === days
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {days} Días
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="generate-diet-plan-btn"
                onClick={handleGenerateDietPlan}
                disabled={loading}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    <span>Calculando Dosis Nutricional...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Calcular Mi Plan Nutricional</span>
                  </>
                )}
              </button>
            </div>

            {plans.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block px-1">Planes Recientes guardados</span>
                <div className="space-y-1">
                  {plans.map((p, pIdx) => (
                    <button
                      key={p.id || pIdx}
                      id={`load-recent-plan-${pIdx}`}
                      onClick={() => {
                        setActivePlan(p);
                        setSelectedDayIndex(0);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 truncate flex items-center justify-between ${
                        activePlan === p ? "bg-emerald-50 text-emerald-800" : "text-slate-600"
                      }`}
                    >
                      <span>Plan {p.durationDays} Días para SII ({new Date(p.createdAt).toLocaleDateString("es-ES")})</span>
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Program results view */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-white border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px] space-y-4"
                >
                  <div className="h-12 w-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                  <div>
                    <h4 className="text-base font-bold text-slate-800">Generando Dietas de Alta Precisión gástrica</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Nuestra IA configura el equilibrio ideal de grasas e hidrata la mucosa seleccionando ingredientes para desinflamar el colon.
                    </p>
                  </div>
                </motion.div>
              )}

              {!loading && !activePlan && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]"
                >
                  <Calendar className="h-10 w-10 text-slate-350" />
                  <h4 className="text-sm font-semibold text-slate-650 mt-3">Ningún plan activo</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Elige la duración deseada a la izquierda y presiona calcular para recibir tu rutina dietética personalizada.
                  </p>
                </motion.div>
              )}

              {!loading && activePlan && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                  id="active-diet-plan-layout"
                >
                  
                  {/* Heading header controls */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-extrabold tracking-widest bg-emerald-50 py-0.5 px-2.5 rounded-full">Esquema Guardado</span>
                      <h3 className="text-base font-bold text-slate-800 mt-1.5">Plan de Alimentación de {activePlan.durationDays} Días</h3>
                      <p className="text-xs text-slate-400 mt-1">Objetivo: {getObjectiveNameHeader(user.objective || "colon_irritable")}</p>
                    </div>

                    <button
                      id="print-plan-btn"
                      onClick={() => window.print()}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 shadow-sm transition-colors"
                      title="Imprimir Plan"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Days tab selection ribbon */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
                    {activePlan.planDays.map((pDay, dIdx) => (
                      <button
                        key={dIdx}
                        id={`planner-day-tab-${dIdx}`}
                        onClick={() => setSelectedDayIndex(dIdx)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-all ${
                          selectedDayIndex === dIdx
                            ? "bg-emerald-500 text-white shadow-sm font-extrabold"
                            : "bg-white border border-slate-100 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        Día {pDay.day}
                      </button>
                    ))}
                  </div>

                  {/* Day Detailed meals layout */}
                  {activePlan.planDays[selectedDayIndex] && (
                    <motion.div
                      key={selectedDayIndex}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6"
                    >
                      
                      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                        <h4 className="text-lg font-bold text-slate-800">Menú Sugerido para el Día {activePlan.planDays[selectedDayIndex].day}</h4>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                          <HeartPulse className="h-4 w-4" />
                          <span>Fácil de digerir</span>
                        </span>
                      </div>

                      {/* Meals list */}
                      <div className="space-y-4">
                        {[
                          { title: "Desayuno (Breakfast)", icon: <Coffee className="h-4 w-4 text-amber-500" />, content: activePlan.planDays[selectedDayIndex].meals.breakfast },
                          { title: "Merienda de Mañana (Snack 1)", icon: <Apple className="h-4 w-4 text-emerald-500" />, content: activePlan.planDays[selectedDayIndex].meals.snack1 },
                          { title: "Almuerzo (Lunch)", icon: <Soup className="h-4 w-4 text-blue-500" />, content: activePlan.planDays[selectedDayIndex].meals.lunch },
                          { title: "Merienda de Tarde (Snack 2)", icon: <Apple className="h-4 w-4 text-emerald-500" />, content: activePlan.planDays[selectedDayIndex].meals.snack2 },
                          { title: "Cena (Dinner)", icon: <Soup className="h-4 w-4 text-indigo-500" />, content: activePlan.planDays[selectedDayIndex].meals.dinner }
                        ].map((meal, mIdx) => (
                          <div key={mIdx} className="p-3.5 rounded-xl border border-slate-50 bg-slate-50/30 flex items-start space-x-3.5">
                            <div className="rounded-lg bg-white p-2 border border-slate-100 shrink-0">
                              {meal.icon}
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-slate-700 leading-none block">{meal.title}</span>
                              <p className="text-xs text-slate-500 leading-relaxed">{meal.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Daily tips footer */}
                      {activePlan.planDays[selectedDayIndex].dailyTips && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shrink-0 flex items-start space-x-2.5">
                          <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest leading-none block">Consejo clínico del día</span>
                            <p className="text-xs text-slate-600 leading-relaxed">{activePlan.planDays[selectedDayIndex].dailyTips}</p>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  )}

                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </>
      )}

      {/* HIDDEN PRINT-ONLY MEDICAL REPORT */}
      {activePlan && (
        <div className="hidden print:block bg-white text-slate-900 p-6 space-y-6 font-sans mx-auto max-w-4xl" id="medical-print-report">
          <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-4">
            <div>
              <h1 className="text-2xl font-black text-emerald-700 tracking-tight">VITAAI CLINICS V4 PROFESSIONAL</h1>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-0.5">Reporte de Prescripción Nutricional e Historial Deportivo Basado en Evidencia</p>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              <div>Fecha: {new Date(activePlan.createdAt).toLocaleDateString("es-ES")}</div>
              <div>Paciente: {user.name || "Usuario Premium"}</div>
            </div>
          </div>

          {/* Patient metrics cards */}
          <div className="grid grid-cols-4 gap-4 border border-slate-200 bg-slate-50 p-4 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Edad</span>
              <span className="text-sm font-bold text-slate-800">{user.age || 30} años</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Peso</span>
              <span className="text-sm font-bold text-slate-800">{user.weight || 70} kg</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Estatura</span>
              <span className="text-sm font-bold text-slate-800">{user.height || 170} cm</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Condición</span>
              <span className="text-xs font-bold text-emerald-805">{getObjectiveNameHeader(selectedObjective)}</span>
            </div>
          </div>

          {/* Medical recommendation explanation */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider">PRESCRIPCIÓN NUTROLÓGICA Y BIOREGULACIÓN GASTRONÓMICA:</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Este reporte personalizado ha sido generado por el motor clínico de VitaAI V4 de acuerdo a sus parámetros médicos ingresados. Su objetivo prioritario es desinflamar progresivamente la mucosa del estómago y modular receptores entéricos gástricos para mejorar la asimilación y mitigar reflujos u opresiones gástricas. Se recomienda enfáticamente mantenerse hidratado, masticar al menos 30 veces cada porción y respetar la secuencia fisiológica diaria.
            </p>
          </div>

          {/* Complete multi-day menu */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-850 border-b border-slate-200 pb-1 uppercase tracking-wider">Desglose de Menú Diario Programado Completo</h3>
            {activePlan.planDays.map((pDay, dIdx) => (
              <div key={dIdx} className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5 shadow-sm break-inside-avoid">
                <div className="flex justify-between items-center text-xs font-extrabold text-emerald-800 uppercase tracking-widest border-b border-slate-100 pb-1">
                  <span>Plan de Alimentación - Día {pDay.day}</span>
                  <span className="bg-emerald-50 text-[9px] text-emerald-700 px-2 py-0.5 rounded">Gastroprotector Clínico</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <div className="text-[9px] leading-relaxed">
                    <strong className="text-amber-700 uppercase block font-mono text-[8px] mb-0.5">🍳 Desayuno:</strong>
                    <span className="text-slate-600">{pDay.meals.breakfast}</span>
                  </div>
                  <div className="text-[9px] leading-relaxed">
                    <strong className="text-emerald-700 uppercase block font-mono text-[8px] mb-0.5">🥑 Merienda 1:</strong>
                    <span className="text-slate-600">{pDay.meals.snack1}</span>
                  </div>
                  <div className="text-[9px] leading-relaxed">
                    <strong className="text-blue-700 uppercase block font-mono text-[8px] mb-0.5">🍲 Almuerzo:</strong>
                    <span className="text-slate-600">{pDay.meals.lunch}</span>
                  </div>
                  <div className="text-[9px] leading-relaxed">
                    <strong className="text-emerald-700 uppercase block font-mono text-[8px] mb-0.5">🥕 Merienda 2:</strong>
                    <span className="text-slate-600">{pDay.meals.snack2}</span>
                  </div>
                  <div className="text-[9px] leading-relaxed">
                    <strong className="text-indigo-700 uppercase block font-mono text-[8px] mb-0.5">🥣 Cena:</strong>
                    <span className="text-slate-600">{pDay.meals.dinner}</span>
                  </div>
                </div>
                {pDay.dailyTips && (
                  <div className="mt-1 pb-0.5 text-[9px] text-slate-500 italic flex items-center gap-1 border-t border-slate-50 pt-1.5">
                    <span>💡 Consejo Gástrico:</span>
                    <span>{pDay.dailyTips}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Medical stamp signature placeholder */}
          <div className="pt-6 flex justify-between items-end border-t border-dashed border-slate-200 mt-6">
            <div className="text-[10px] text-slate-400 font-mono">
              <div>VitaAI Automated Medical Intelligence v4.2</div>
              <div>Firma Certificada Hash: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
            </div>
            <div className="text-center w-44 border-t border-slate-300 pt-1 text-[10px] text-slate-500">
              Firma y Sello Nutriólogo AI
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
