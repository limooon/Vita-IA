import React, { useState, useEffect } from "react";
import { UserProfile, VacationLog } from "../types";
import { 
  Sun, Palmtree, Compass, Flame, ShieldAlert, Sparkles, AlertCircle, Dumbbell, 
  Clock, Plus, Check, Loader2, RefreshCw, Undo, Wine, Cake, Pizza 
} from "lucide-react";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

interface VitaVacationProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function VitaVacation({
  user,
  onViewChange
}: VitaVacationProps) {
  const isPremium = user.subscriptionStatus === "premium";

  // State
  const [logs, setLogs] = useState<VacationLog[]>([]);
  const [activeTab, setActiveTab] = useState<"planner" | "compensator" | "fitness">("planner");
  const [submittingExceso, setSubmittingExceso] = useState(false);
  const [excesoFood, setExcesoFood] = useState<string[]>([]);
  const [compensacionResult, setCompensacionResult] = useState<string | null>(null);

  // Mini-planner state
  const [locationType, setLocationType] = useState<"hotel_buffet" | "depa_turistico" | "rural_camping">("hotel_buffet");
  const [plannerResult, setPlannerResult] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Express routines to display
  const expressRoutines = [
    {
      title: "🔥 Quemador Express Playero",
      duration: "10 mins",
      difficulty: "Todo nivel",
      equipment: "Ninguno (Peso corporal)",
      steps: [
        "Jumping Jacks - 45s",
        "Sentadillas libres - 45s",
        "Flexiones de brazos inclinadas (en borde de cama o sofá) - 45s",
        "Plancha abdominal isométrica - 45s",
        "Descanso activo de 30 segundos. ¡Repetir 3 rondas!"
      ],
      description: "Ideal para activar el metabolismo y quemar glucógeno matutino en el cuarto de hotel."
    },
    {
      title: "🧘 Cardio Core Desinflamatorio",
      duration: "12 mins",
      difficulty: "Fácil",
      equipment: "Ninguno",
      steps: [
        "Rotaciones de cadera suaves - 1 min",
        "Escaladores de montaña controlados - 45s",
        "Puente de glúteos - 45s",
        "Abdominales de insecto herido (Deadbug) - 45s",
        "Descansar 40s. Repetir 3 rondas."
      ],
      description: "Fomenta la motilidad intestinal gástrica y reduce la hinchazón producida por viajes largos en avión o bus."
    },
    {
      title: "⚡ Tabata Potente sin Equipamiento",
      duration: "15 mins",
      difficulty: "Avanzado",
      equipment: "Ninguno",
      steps: [
        "Burpees limpios - 20s (máxima intensidad/10s descanso)",
        "Sentadilla con salto - 20s (10s descanso)",
        "Zancadas alternas - 20s (10s descanso)",
        "Flexiones cerradas - 20s (10s descanso)",
        "Repetir todo el circuito por 4 vueltas completas."
      ],
      description: "Para atletas que disponen de poco tiempo pero desean preservar su masa muscular."
    }
  ];

  // Load logs
  useEffect(() => {
    const local = localStorage.getItem(`vacation_logs_${user.uid}`);
    if (local) {
      setLogs(JSON.parse(local));
    }
  }, [user.uid]);

  const toggleExcesoItem = (item: string) => {
    setExcesoFood((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleExcesoCompensate = async () => {
    if (excesoFood.length === 0) return;
    setSubmittingExceso(true);
    setCompensacionResult(null);

    try {
      const response = await fetch("/api/generate-vacation-compensation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          excesos: excesoFood,
          clinicalProfile: user.objective || "colon_irritable"
        })
      });

      const data = await response.json();
      if (data.success) {
        setCompensacionResult(data.advice);
        
        // Save log
        const newLog: VacationLog = {
          id: Math.random().toString(36).substring(7),
          userId: user.uid,
          vacationLocation: "Hotel o Destino",
          mealPlanEasy: "Ajuste compensatorio programado",
          excessCompensated: excesoFood.join(", "),
          expressRoutineChosen: "Cardio Express",
          createdAt: new Date().toISOString()
        };

        const updated = [newLog, ...logs];
        setLogs(updated);
        localStorage.setItem(`vacation_logs_${user.uid}`, JSON.stringify(updated));

        // Save firebase
        try {
          const docRef = doc(collection(db, "vacations"));
          await setDoc(docRef, newLog);
        } catch (e) {
          console.warn("DB offline save vacation.", e);
        }
      }
    } catch (err) {
      // Offline fallback calculated advice
      setTimeout(() => {
        let text = `### Ajuste de Compensación Personalizado 🌴\n\nIdentificamos excesos de: **${excesoFood.join(", ")}**.\n\n`;
        text += `1. **Plan de Hidratación Gástrica**: Incrementar consumo de agua fresca en 1 litro adicional al día de hoy para ayudar a la digestión de la grasa acumulada y compensar la pérdida de sodio.\n\n`;
        text += `2. **Descanso Metabólico**: Realiza un ayuno fisiológico nocturno digestivo de 12 a 13 horas. Permite que el páncreas y el estómago descansen.\n\n`;
        text += `3. **Siguiente Porción Inteligente**: Opta por una porción generosa de calabacín al vapor o caldo de pollo desgrasado con zanahoria cocida para neutralizar la acidez residual. ¡Evita té negro o café hoy!`;
        setCompensacionResult(text);
      }, 1200);
    } finally {
      setSubmittingExceso(false);
    }
  };

  const handleGenerateVacationPlan = async () => {
    setLoadingPlan(true);
    setPlannerResult(null);

    try {
      const response = await fetch("/api/generate-vacation-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          locationType,
          objective: user.objective || "colon_irritable"
        })
      });
      const data = await response.json();
      if (data.success) {
        setPlannerResult(data.plan);
      }
    } catch (e) {
      setTimeout(() => {
        let text = "";
        if (locationType === "hotel_buffet") {
          text = `### Plan de Comidas: Hotel Buffet 🏨\n\n* **Desayuno**: Huevos revueltos bien cocidos en agua/mantequilla baja en grasa, acompañados de piña o papaya digestiva. Evita jugos ácidos procesados.\n* **Postre opcional**: Yogur sin lactosa o avena de cocción lenta.\n* **Cena**: Salmón a la plancha u otra carne blanca fácil, puré de patata natural y espinaca cocida.\n\n*Recuerda masticar lento en las áreas comunes.*`;
        } else if (locationType === "depa_turistico") {
          text = `### Plan de Comidas: Departamento con Cocina 🍳\n\n* **Comida Rápida**: Recurrir a enlatados saludables como atún o sardinas en base acuosa. Quinoa pre-cocida de microondas y judías verdes enlatadas cocidas.\n* **Tentempié**: Plátano maduro o almendras tostadas hidratadas.\n* **Caldos**: Pasta de arroz con pollo cocido y calabacita gástrica. Se arma en <15 minutos.`;
        } else {
          text = `### Plan de Comidas: Rural / Camping ⛺\n\n* **Supervivencia gástrica**: Copos de avena hidratados directamente en agua tibia con frambuesas silvestres o plátano picado.\n* **Proteína limpia**: Conservas de pollo o pavo cocido en agua. Galletas de arroz integral tostadas.\n* **Cena digestiva**: Zanahorias baby crudas ralladas, aguacate entero maduro machacado con sal y aceite de oliva rústico.`;
        }
        setPlannerResult(text);
      }, 1000);
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="vacation-viewport">
      
      {/* Banner info Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 p-6 text-white shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block">Módulo Premium Vacacional</span>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Sun className="h-5.5 w-5.5 animate-spin-slow text-amber-100" />
            <span>VitaVacation AI</span>
          </h2>
          <p className="text-xs text-amber-50">Mantén el equilibrio estomacal y físico durante tus viajes sin culpas ni restricciones.</p>
        </div>
        <button
          onClick={() => onViewChange("dashboard")}
          className="rounded-xl bg-white/25 border border-white/20 hover:bg-white/30 text-xs font-bold py-1.5 px-3 block transition-all"
        >
          Volver
        </button>
      </div>

      {!isPremium ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/20 p-8 text-center space-y-4 max-w-md mx-auto">
          <Palmtree className="mx-auto h-12 w-12 text-amber-500 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-800">Desbloquea Programación de Vacaciones</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consigue ideas de buffet seguras, un corrector inteligente de excesos (alcohol, frituras, dulces) y entrenamientos express sin equipo para el cuarto de hotel.
          </p>
          <button
            onClick={() => onViewChange("premium")}
            className="rounded-xl bg-slate-900 text-white font-bold text-xs py-2.5 px-6 hover:bg-slate-800 transition-all shadow"
          >
            Suscripción Premium ⚡
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sub Navigation pane */}
          <div className="md:col-span-1 space-y-3">
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest pl-1">Menú de Herramientas</span>
              
              <button
                onClick={() => setActiveTab("planner")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "planner" ? "bg-amber-500 border-amber-500 text-white" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Planner de Comida Rápida</span>
                <Compass className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("compensator")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "compensator" ? "bg-amber-500 border-amber-500 text-white" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Compensador de Excesos</span>
                <ShieldAlert className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("fitness")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "fitness" ? "bg-amber-500 border-amber-500 text-white" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Rutinas Express sin Equipo</span>
                <Dumbbell className="h-4 w-4" />
              </button>

            </div>

            {/* Micro warning */}
            <div className="rounded-xl border border-slate-105 bg-slate-50 p-4 text-[11px] text-slate-500 leading-normal">
              🏝️ <strong>Recordatorio Gástrico:</strong> Las vacaciones son para disfrutar y recargar tu salud cerebral. No te obsesiones con el peso; regular la inflamación es el único factor de resguardo relevante.
            </div>
          </div>

          {/* Active section viewport */}
          <div className="md:col-span-2 space-y-6">
            
            {activeTab === "planner" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800">Planificador de Comida Vacacional IA</h3>
                <p className="text-xs text-slate-500">¿Dónde estás hospedándote? La IA diseñará snacks rápidos que no inflamarán tu colon ni activarán picos de reflujo gástrico.</p>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLocationType("hotel_buffet")}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      locationType === "hotel_buffet" ? "border-amber-500 bg-amber-50/40 text-amber-800" : "border-slate-150 hover:bg-slate-50 text-slate-650 text-slate-600"
                    }`}
                  >
                    <span className="block text-lg">🏨</span>
                    <span className="block text-[11px] font-bold mt-1">Hotel Buffet</span>
                  </button>
                  <button
                    onClick={() => setLocationType("depa_turistico")}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      locationType === "depa_turistico" ? "border-amber-500 bg-amber-50/40 text-amber-800" : "border-slate-150 hover:bg-slate-50 text-slate-650 text-slate-600"
                    }`}
                  >
                    <span className="block text-lg">🍳</span>
                    <span className="block text-[11px] font-bold mt-1">Depa Turístico</span>
                  </button>
                  <button
                    onClick={() => setLocationType("rural_camping")}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      locationType === "rural_camping" ? "border-amber-500 bg-amber-50/40 text-amber-800" : "border-slate-150 hover:bg-slate-50 text-slate-650 text-slate-600"
                    }`}
                  >
                    <span className="block text-lg">⛺</span>
                    <span className="block text-[11px] font-bold mt-1">Camping / Rural</span>
                  </button>
                </div>

                <button
                  onClick={handleGenerateVacationPlan}
                  disabled={loadingPlan}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-550 to-amber-500 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {loadingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Plasmando Plan de Supervivencia...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generar Alternativas Inteligentes</span>
                    </>
                  )}
                </button>

                {plannerResult && (
                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-50/5 text-xs text-slate-700 leading-relaxed font-normal space-y-2">
                    {plannerResult.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={idx} className="font-bold text-sm text-slate-800 border-b border-slate-50 pb-1.5 mb-2 mt-2">{line.substring(4)}</h4>;
                      }
                      if (line.startsWith("* ") || line.startsWith("- ")) {
                        return (
                          <div key={idx} className="pl-3 py-0.5 flex items-start">
                            <span className="mr-1.5 text-amber-500">•</span>
                            <span>{line.substring(2)}</span>
                          </div>
                        );
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "compensator" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800">Compensador de Excesos</h3>
                <p className="text-xs text-slate-500">¿Hubo excesos en la cena de anoche? Marca las categorías y tu Coach IA calculará ajustes sutiles sin forzar ayunos extremos perjudiciales.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "alcohol", label: "Copas / Alcohol", icon: "🍺" },
                    { id: "fried", label: "Fritos / Embutidos", icon: "🍟" },
                    { id: "desserts", label: "Postres / Azúcar", icon: "🍰" },
                    { id: "overeating", label: "Atracón / Volumen", icon: "🍕" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleExcesoItem(item.label)}
                      className={`rounded-xl border p-3 flex flex-col items-center justify-center transition-all ${
                        excesoFood.includes(item.label) ? "border-rose-500 bg-rose-50/30 text-rose-800 font-extrabold" : "border-slate-150 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-[10px] mt-1 text-center font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleExcesoCompensate}
                    disabled={submittingExceso || excesoFood.length === 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {submittingExceso ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analizando Carga Digestiva...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="h-4 w-4" />
                        <span>Calcular Compensación Óptima</span>
                      </>
                    )}
                  </button>
                </div>

                {compensacionResult && (
                  <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-50/5 text-xs text-slate-700 leading-relaxed space-y-2">
                    {compensacionResult.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={idx} className="font-bold text-sm text-slate-800 border-b border-rose-50 pb-1.5 mb-2 mt-2">{line.substring(4)}</h4>;
                      }
                      if (line.startsWith("* ") || line.startsWith("- ") || /^\d+\./.test(line)) {
                        return (
                          <div key={idx} className="pl-3 py-0.5 flex items-start">
                            <span className="mr-1.5 text-rose-500">•</span>
                            <span>{line.replace(/^\d+\.\s*/, "").substring(1)}</span>
                          </div>
                        );
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "fitness" && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <Dumbbell className="h-5 w-5 text-amber-500" />
                    <span>Rutinas Express de Supervivencia</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Preserva tu resistencia y activa tu tránsito intestinal con estos circuitos de solo 10 a 15 minutos que puedes realizar con cero recursos.</p>
                </div>

                {expressRoutines.map((r, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{r.title}</h4>
                      <div className="flex space-x-2">
                        <span className="text-[10px] bg-slate-100 rounded-full py-0.5 px-2.5 font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{r.duration}</span>
                        </span>
                        <span className="text-[10px] bg-amber-550/20 text-amber-900 bg-amber-50 rounded-full py-0.5 px-2.5 font-bold uppercase">
                          {r.difficulty}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{r.description}</p>
                    
                    <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paso a paso del circuito:</span>
                      {r.steps.map((st, sIdx) => (
                        <div key={sIdx} className="flex items-center space-x-2 text-xs text-slate-700">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
