import React, { useState, useEffect } from "react";
import { UserProfile, TravelLog } from "../types";
import { 
  Plane, Compass, ShieldAlert, Sparkles, AlertCircle, Dumbbell, Clock, 
  Check, Droplets, MapPin, Eye, Loader2, RefreshCw, ClipboardList, Info, HelpCircle
} from "lucide-react";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

interface VitaTravelProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function VitaTravel({
  user,
  onViewChange
}: VitaTravelProps) {
  const isPremium = user.subscriptionStatus === "premium";

  // State
  const [logs, setLogs] = useState<TravelLog[]>([]);
  const [activeTab, setActiveTab] = useState<"survival" | "firstaid" | "transit">("survival");

  // Transit state
  const [transitWaterCount, setTransitWaterCount] = useState<number>(3);
  const [jetLagZoneDifference, setJetLagZoneDifference] = useState<number>(0);
  const [jetLagAdvice, setJetLagAdvice] = useState<string | null>(null);
  const [generatingJetLag, setGeneratingJetLag] = useState(false);

  // Load logs
  useEffect(() => {
    const local = localStorage.getItem(`travel_logs_${user.uid}`);
    if (local) {
      setLogs(JSON.parse(local));
    }
  }, [user.uid]);

  const handleCalculateJetLag = () => {
    setGeneratingJetLag(true);
    setJetLagAdvice(null);

    // Simulate clinical jet lag adviser
    setTimeout(() => {
      let advice = `### Plan de Reducción de Jet-Lag Digestivo (Diferencia: ${jetLagZoneDifference}h) ⏰\n\n`;
      if (jetLagZoneDifference === 0) {
        advice += `Tu destino se mantiene en el mismo huso horario. Solo mantén un ritmo normal de comidas y no alteres tus horarios habituales de sueño para evitar picos gástricos de cortisol.`;
      } else {
        advice += `1. **Sintonización del Marcapasos Gástrico**: Realiza tu primera comida en el destino exactamente en su horario local correspondiente. Tu reloj interno gastrointestinal se sincroniza con el primer bocado.\n\n`;
        advice += `2. **Descanso Digestivo de Viaje**: Durante las horas de vuelo o trayecto, mantén un ayuno parcial bebiendo únicamente infusiones de menta o agua mineral simple. La presurización en cabina hincha las asas del colon.\n\n`;
        advice += `3. **Suplementación**: Ingiere 3mg de Melatonina por la noche local durante los primeros 2 días para regular la producción de melatonina intestinal (que es 400 veces mayor que la cerebral).`;
      }
      setJetLagAdvice(advice);
      setGeneratingJetLag(false);

      // Log travel info
      const newLog: TravelLog = {
        id: Math.random().toString(36).substring(7),
        userId: user.uid,
        departureCity: "Origen",
        destinationCity: `Destino (Huso: ${jetLagZoneDifference}h)`,
        emergencyPillsKit: "Probióticos + Lactasa",
        transitHydrationOz: transitWaterCount * 8,
        createdAt: new Date().toISOString()
      };
      const updated = [newLog, ...logs];
      setLogs(updated);
      localStorage.setItem(`travel_logs_${user.uid}`, JSON.stringify(updated));

      // Save Firebase
      try {
        setDoc(doc(collection(db, "travel_logs")), newLog);
      } catch (e) {
        console.warn(e);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="vitatravel-viewport">
      
      {/* Upper header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-sky-600 to-indigo-700 p-6 text-white flex items-center justify-between shadow-md">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-indigo-50 font-extrabold">Viajero Saludable Premium</span>
          <h2 className="text-xl font-bold flex items-center gap-2 mt-1">
            <Plane className="h-5.5 w-5.5 text-blue-105" />
            <span>VitaTravel AI</span>
          </h2>
          <p className="text-xs text-sky-50 mt-1">Evita gases en avión, estreñimiento por cambio de cama y jet lag digestivo.</p>
        </div>
        <button
          onClick={() => onViewChange("dashboard")}
          className="rounded-xl bg-white/20 hover:bg-white/30 border border-white/10 text-xs font-bold py-1.5 px-3 block transition-all"
        >
          Volver
        </button>
      </div>

      {!isPremium ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-8 text-center space-y-4 max-w-md mx-auto">
          <Plane className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800">Tu Asistente de Tránsito Estomacal</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consigue guías para volar sin inflarte, listas de enzimas digestivas permitidas en el equipaje de mano, y calculador de Jet-Lag para re-sincronizar tus marcapasos intestinales.
          </p>
          <button
            onClick={() => onViewChange("premium")}
            className="rounded-xl bg-slate-900 text-white font-bold text-xs py-2.5 px-6 hover:bg-slate-800 transition-all shadow"
          >
            Suscribirse a Premium ⭐
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Menu column */}
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase pl-1">Menú de Viaje</span>
              
              <button
                onClick={() => setActiveTab("survival")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "survival" ? "bg-indigo-600 border-indigo-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Vuelos y Retención de Gases</span>
                <HelpCircle className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("firstaid")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "firstaid" ? "bg-indigo-600 border-indigo-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Botiquín de Emergencia</span>
                <ClipboardList className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("transit")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "transit" ? "bg-indigo-600 border-indigo-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Tránsito e Hidratación</span>
                <Droplets className="h-4 w-4" />
              </button>
            </div>

            {/* Travel tips */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-[11px] leading-relaxed text-blue-800 space-y-1.5">
              <h4 className="font-bold uppercase tracking-wider flex items-center gap-1">💺 ¿Sabías que?</h4>
              <p>
                A una altitud de cabina típica (2,400m), los gases biológicos se expanden hasta un 30% en volumen físico dentro del tracto gastrointestinal. Esto produce los característicos cólicos de aire en vuelos.
              </p>
            </div>
          </div>

          {/* Active section column */}
          <div className="md:col-span-2 space-y-6">
            
            {activeTab === "survival" && (
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Guía de Supervivencia: Avión y Carretera</h3>
                  <p className="text-xs text-slate-505 text-slate-500">Sigue estas reglas clínicas para inhibir cólicos en tus trayectos.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">✈️ En Avión (Ayer y Hoy)</h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                      <li>Evita ensaladas crujientes crudas o leguminosas (FODMAPs) 24h antes del despegue.</li>
                      <li>Viste ropa de talle holgado que no comprima el colon descendente.</li>
                      <li>Bebe infusión de hinojo o jengibre caliente durante la escala.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">🚗 En Auto / Autobús</h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                      <li>Haz pausas de marcha activa de 5 minutos cada 2 horas para reactivar el peristaltismo intestinal.</li>
                      <li>Mantén las piernas sin cruzar prolongadamente.</li>
                      <li>Ingiere chicle libre de sorbitol (el sorbitol incrementa el gas).</li>
                    </ul>
                  </div>
                </div>

                {/* Jet lag calculations form */}
                <div className="border-t border-slate-50 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">⏰ Calculadora de Sincronización Jet-Lag</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Ingresa la diferencia de hora (zonas horarias) entre tu origen y tu nuevo destino vacacional:</p>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="-12"
                      max="12"
                      value={jetLagZoneDifference}
                      onChange={(e) => setJetLagZoneDifference(Number(e.target.value))}
                      className="w-20 text-center rounded-xl border border-slate-200 py-1 px-2.5 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleCalculateJetLag}
                      disabled={generatingJetLag}
                      className="bg-indigo-600 hover:bg-slate-850 px-4 py-2 font-bold text-white text-xs rounded-xl shadow transition-all"
                    >
                      Calcular Ajuste de Marcapasos
                    </button>
                  </div>

                  {jetLagAdvice && (
                    <div className="p-4 rounded-xl bgcolor bg-indigo-50/40 border border-indigo-200/40 text-xs text-slate-700 leading-relaxed font-normal space-y-2">
                      {jetLagAdvice.split("\n").map((line, idx) => {
                        if (line.startsWith("### ")) {
                          return <h4 key={idx} className="font-bold text-sm text-slate-850 border-b border-indigo-200/20 pb-1.5 mb-2 mt-2 text-indigo-950">{line.substring(4)}</h4>;
                        }
                        if (line.startsWith("* ") || line.startsWith("- ") || /^\d+\./.test(line)) {
                          return (
                            <div key={idx} className="pl-3 py-0.5 flex items-start">
                              <span className="mr-1.5 text-indigo-500 font-extrabold">•</span>
                              <span>{line.replace(/^\d+\.\s*/, "").substring(1)}</span>
                            </div>
                          );
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "firstaid" && (
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Botiquín de Emergencia Digital del Viajero</h3>
                  <p className="text-xs text-slate-500">¿Qué llevar en tu maleta o bolso de mano gástrico? Listado de suplementos seguros y permitidos según rigurosas regulaciones de aeropuertos.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: "💊 Enzimas & Ayudas", desc: "Lactasa de alta densidad (9000 FCC) para tolerar buffets con lácteos ocultos y enzimas de amplio espectro antes de comer grasas." },
                    { title: "🌱 Mucílagos Solubles", desc: "Sobres de cáscara de psyllium (Ispagula) o viales de extracto de regaliz de-glicirrizado (DGL) para neutralizar reflujo gástrico nocturno." },
                    { title: "🔬 Probióticos Estables", desc: "Saccharomyces Boulardii (no requiere refrigeración) para prevenir y compensar la famosa diarrea del viajero producida por agua local." },
                    { title: "🔋 Electrolitos Clínicos", desc: "Sobres de hidratación oral electrolítica en polvo, con estevia o sin saborizadores irritantes para compensar deshidratación por sol o sudor." }
                  ].map((med, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-4 space-y-1 hover:bg-slate-50/50 transition-all">
                      <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-indigo-500" />
                        <span>{med.title}</span>
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed pl-5">{med.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "transit" && (
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Monitoreo de Hidratación en Tránsito</h3>
                  <p className="text-xs text-slate-500">Las cabinas presurizadas deshidratan tu cuerpo un 20% más rápido que en tierra firme. Registra tu volumen de agua ingerida durante el transporte:</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-500">Volumen Registrado</span>
                    <p className="text-xl font-extrabold text-slate-800">{transitWaterCount} Vasos / {transitWaterCount * 250} ml</p>
                    <p className="text-[10px] text-slate-500">Tu meta de viaje saludable es de al menos 10 vasos.</p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTransitWaterCount(prev => Math.max(0, prev - 1))}
                      className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold transition-all"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setTransitWaterCount(prev => prev + 1)}
                      className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      +
                    </button>
                  </div>
                </div>

                {transitWaterCount >= 8 ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                    <span className="text-lg">👑</span>
                    <p className="font-semibold">¡Súper hidratación activa! Tu mucosa celular estomacal está blindada de forma idónea frente a la sequedad.</p>
                  </div>
                ) : (
                  <p className="text-xs text-center text-slate-400">Te sugerimos beber {8 - transitWaterCount} vasos más durante tu trayecto para blindar la barrera gástrica.</p>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
