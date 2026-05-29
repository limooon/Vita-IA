import React, { useState, useEffect } from "react";
import { UserProfile, SocialMealLog } from "../types";
import { 
  Users, PartyPopper, Flame, Sparkles, AlertCircle, Dumbbell, Clock, 
  MapPin, Check, Eye, Loader2, RefreshCw, MessageSquare, GlassWater 
} from "lucide-react";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

interface SocialMealsProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function SocialMeals({
  user,
  onViewChange
}: SocialMealsProps) {
  const isPremium = user.subscriptionStatus === "premium";

  // State
  const [logs, setLogs] = useState<SocialMealLog[]>([]);
  const [activeTab, setActiveTab] = useState<"planner" | "modulator" | "finder">("planner");
  
  // Planner State
  const [mealTypeSelection, setMealTypeSelection] = useState<string>("Mexican");
  const [plannerResult, setPlannerResult] = useState<string | null>(null);
  const [loadingPlanner, setLoadingPlanner] = useState(false);

  // Modulator State
  const [timeStage, setTimeStage] = useState<"before" | "during" | "after">("before");

  // Finder State
  const [selectedZoneStyle, setSelectedZoneStyle] = useState<string>("Italian");
  const [foundRestaurants, setFoundRestaurants] = useState<any[]>([]);

  const zoneStyleOptions = [
    { type: "Italian", name: "Italiano / Pizzerías Masa Madre", icon: "🍕" },
    { type: "Sushi", name: "Sushi / Cocina Asiática bajo Sodio", icon: "🍣" },
    { type: "Salad", name: "Green Bars / Ensaladeras Orgánicas", icon: "🥗" },
    { type: "Steakhouse", name: "Asadores Rústicos / Parrillas Limpias", icon: "🥩" }
  ];

  const handleGenerateSocialPlan = async () => {
    setLoadingPlanner(true);
    setPlannerResult(null);

    try {
      const response = await fetch("/api/generate-social-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          style: mealTypeSelection,
          objective: user.objective || "colon_irritable"
        })
      });

      const data = await response.json();
      if (data.success) {
        setPlannerResult(data.plan);

        // Save log
        const newLog: SocialMealLog = {
          id: Math.random().toString(36).substring(7),
          userId: user.uid,
          eventType: mealTypeSelection,
          restaurantFriendlyChosen: "Buscador social amigable",
          preShieldUsed: "Protección mucosa gástrica activa",
          postRecoveryUsed: "Té digestivo hinojo",
          createdAt: new Date().toISOString()
        };

        const updated = [newLog, ...logs];
        setLogs(updated);
        localStorage.setItem(`social_meals_logs_${user.uid}`, JSON.stringify(updated));

        // Save firestore
        try {
          const docRef = doc(collection(db, "social_meals"));
          await setDoc(docRef, newLog);
        } catch (e) {
          console.warn("Firestore social meal log skipped due to offline mode.", e);
        }
      }
    } catch (err) {
      setTimeout(() => {
        let text = `### Plan de Supervivencia Social: Cocina ${mealTypeSelection} 🌶️\n\n`;
        text += `1. **Qué ordenar**: Elige platos a la parrilla con nulo picante. Pide salsas y aderezos de crema o jitomate por separado.\n\n`;
        text += `2. **Qué evitar rotundamente**: Bebidas azucaradas carbonatadas, alimentos rebosados en frituras rancias, aderezos muy cargados con ajo crudo.\n\n`;
        text += `3. **Escudo de Amortiguación**: Ingiere una cucharadita de gel de aloe vera o toma dos vasos de agua simple 15 minutos antes de ordenar. ¡Evita comer con prisa mientras pláticas!`;
        setPlannerResult(text);
      }, 1000);
    } finally {
      setLoadingPlanner(false);
    }
  };

  const executeRestaurantSearch = (style: string) => {
    setSelectedZoneStyle(style);
    
    // Simulate smart restaurant picker by zone
    let options: any[] = [];
    if (style === "Italian") {
      options = [
        { name: "La Rustica Masa Madre", address: "Av. Providencia 4920", rating: "4.8", safety: "Alta (Masa fermentada >48h)", recommendation: "Focaccia de romero y pizza margarita simple" },
        { name: "Pasta & Flora Orgánico", address: "Calle Jardines del Sol 110", rating: "4.7", safety: "Media (Salsas frescas sin conservadores)", recommendation: "Espagueti al pesto sin ajo adicional" }
      ];
    } else if (style === "Sushi") {
      options = [
        { name: "Zen Garden Sushi", address: "Calle de la Paz 88", rating: "4.9", safety: "Alta (Salsa de soya reducida en sodio original)", recommendation: "Maki de pepino y aguacate, Sashimi de salmón" },
        { name: "Koto Bistro", address: "Paseo de la República 1024", rating: "4.6", safety: "Media (Pescados frescos, evitar tempuras)", recommendation: "Nigiris de lubina y sopa miso tradicional desinflamatoria" }
      ];
    } else if (style === "Salad") {
      options = [
        { name: "Green Garden Orgánico", address: "Blvd. Aviación Central 23", rating: "4.9", safety: "Alta (Ingredientes libres de lactosa / FODMAP personalizables)", recommendation: "Bowl templado de quinoa, brotes germinados y pechuga asada" },
        { name: "Vida Sana Boutique", address: "Av. Américas 154", rating: "4.5", safety: "Alta (Aguas termales e infusiones naturales sin endulzantes artificiales)", recommendation: "Ensalada desintoxicante de lechuga francesa, zanahoria y aceite de coco" }
      ];
    } else {
      options = [
        { name: "El Horno de Leña", address: "Valle de Atemajac 550", rating: "4.8", safety: "Alta (Carnes magras desgrasadas lentamente)", recommendation: "Brocheta de pollo o filete con vegetales asados, evitar marinar picantes" },
        { name: "Parrilla del Chef", address: "Av. Vallarta 820", rating: "4.4", safety: "Media (Carnes rojas asadas sin carbón excesivo)", recommendation: "Corte de carne blanca limpia con patata asada, salsa aparte" }
      ];
    }

    setFoundRestaurants(options);
  };

  useEffect(() => {
    executeRestaurantSearch("Italian");
    const local = localStorage.getItem(`social_meals_logs_${user.uid}`);
    if (local) {
      setLogs(JSON.parse(local));
    }
  }, [user.uid]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="social-meals-viewport">
      
      {/* Upper header navigation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-550 via-teal-600 to-teal-700 bg-teal-600 p-6 text-white flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest bg-teal-500/30 px-2.5 py-1 rounded-full text-teal-100 font-extrabold">Funcionalidad Premium</span>
          <h2 className="text-xl font-extrabold flex items-center gap-2 mt-1">
            <Users className="h-5.5 w-5.5 text-teal-105" />
            <span>Vida Social AI</span>
          </h2>
          <p className="text-xs text-teal-50 mt-1">Gestiona cenas corporativas, bodas o salidas familiares protegiendo tu bienestar digestivo.</p>
        </div>
        <button
          onClick={() => onViewChange("dashboard")}
          className="rounded-xl bg-white/20 hover:bg-white/30 border border-white/10 text-xs font-bold py-1.5 px-3 block transition-all"
        >
          Volver
        </button>
      </div>

      {!isPremium ? (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/20 p-8 text-center space-y-4 max-w-md mx-auto">
          <PartyPopper className="mx-auto h-12 w-12 text-teal-600 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-800">Cenas y Eventos sin Malestares</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consigue el escudo de preparación mucosa inteligente, buscador clínico de restaurantes locales (italiano de masa madre, asadores, sushi bajo sodio) y guías rápidas para reducir distensión.
          </p>
          <button
            onClick={() => onViewChange("premium")}
            className="rounded-xl bg-slate-900 text-white font-bold text-xs py-2.5 px-6 hover:bg-slate-800 transition-all shadow"
          >
            Adquirir Acceso Premium ⚡
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sub Navigation */}
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase pl-1">Módulos Sociales</span>
              
              <button
                onClick={() => setActiveTab("planner")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "planner" ? "bg-teal-600 border-teal-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Planificador de Comida Social</span>
                <Sparkles className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("modulator")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "modulator" ? "bg-teal-600 border-teal-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Modulador Gástrico</span>
                <GlassWater className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("finder")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "finder" ? "bg-teal-600 border-teal-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Buscador Local Amigable</span>
                <MapPin className="h-4 w-4" />
              </button>
            </div>

            {/* Social disclaimer alert */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
              <h4 className="text-[11px] font-extrabold text-emerald-850 flex items-center gap-1 uppercase tracking-wider">💡 Tip Súper-Fácil:</h4>
              <p className="text-[11px] text-emerald-900 leading-relaxed font-semibold">
                Beber agua mineral gasificada con rodajas de limón es la mejor alternativa cuando tus amigos piden cócteles con alto contenido de alcohol y azúcar quemante.
              </p>
            </div>
          </div>

          {/* Tab content renderer */}
          <div className="md:col-span-2 space-y-6">
            
            {activeTab === "planner" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Planificador de Bodas, Salidas o Reuniones</h3>
                  <p className="text-xs text-slate-500">Elige el estilo de cocina a la que asistirás para recibir recomendaciones seguras de platillos clínicos tolerados.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Italiana", "Mexicana", "Sushi", "Argentina / Parrilla", "Vegetariana / Vegana"
                  ].map((style) => (
                    <button
                      key={style}
                      onClick={() => setMealTypeSelection(style)}
                      className={`px-3 py-2 text-[11px] font-bold border rounded-lg transition-all ${
                        mealTypeSelection === style ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-150 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      🍴 {style}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateSocialPlan}
                  disabled={loadingPlanner}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {loadingPlanner ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analizando Menú Social Seguro...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generar Guía de Ordenado Seguro</span>
                    </>
                  )}
                </button>

                {plannerResult && (
                  <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 text-xs text-slate-700 leading-relaxed space-y-2">
                    {plannerResult.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={idx} className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-1.5 mb-2 mt-2">{line.substring(4)}</h4>;
                      }
                      if (line.startsWith("* ") || line.startsWith("- ") || /^\d+\./.test(line)) {
                        return (
                          <div key={idx} className="pl-3 py-0.5 flex items-start">
                            <span className="mr-1.5 text-teal-650 font-extrabold text-teal-600">•</span>
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

            {activeTab === "modulator" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Modulador Estomacal Clínico</h3>
                  <p className="text-xs text-slate-500">Modifica y modula tu digestión antes, durante y después del compromiso social.</p>
                </div>

                <div className="flex border-b border-slate-100">
                  {(["before", "during", "after"] as const).map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setTimeStage(stage)}
                      className={`flex-1 text-center py-2 text-xs font-bold border-b-2 transition-all ${
                        timeStage === stage ? "border-teal-500 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {stage === "before" ? "Antes de Salir" : stage === "during" ? "Durante la Cena" : "Post Compromiso"}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-100 p-4 space-y-3.5 bg-slate-50/40">
                  {timeStage === "before" && (
                    <>
                      <h4 className="text-xs font-bold text-slate-850 text-slate-800">🛡️ Escudo de Preparación Mucosa</h4>
                      <p className="text-xs text-slate-605 text-slate-600 leading-relaxed">
                        Toma una porción hidratada de semillas de chía o linaza disuelta en agua tibia. Esto produce un mucílago (fibra soluble) que recubre de forma segura la pared del estómago y reduce el impacto abrasivo de aceites calientes o condimentos picantes que puedas encontrar fuera.
                      </p>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-[11px] text-emerald-800 leading-normal">
                        <strong>Tip Extra:</strong> Evita salir al evento con hambre acumulada para prevenir comer con desesperación y tragar aire.
                      </div>
                    </>
                  )}

                  {timeStage === "during" && (
                    <>
                      <h4 className="text-xs font-bold text-slate-850 text-slate-800">🍷 Modulación en la Mesa</h4>
                      <p className="text-xs text-slate-605 text-slate-600 leading-relaxed">
                        Evita refrescos con gas y no abuses de hielos extremes si tienes digestiones lentas (hipoclorhidria). Mantiene una masticación rítmica, dedicando tiempo a charlar.
                      </p>
                      <div className="rounded-lg bg-teal-50 border border-teal-100 p-2 text-[11px] text-teal-800 leading-normal">
                        <strong>Tip Extra:</strong> En caso de incomodidad, presiona el centro de tu muñeca (punto Neiguan) para reducir espasmos y náuseas de forma neuropática.
                      </div>
                    </>
                  )}

                  {timeStage === "after" && (
                    <>
                      <h4 className="text-xs font-bold text-slate-850 text-slate-800">🍵 Recuperación Nocturna</h4>
                      <p className="text-xs text-slate-605 text-slate-600 leading-relaxed">
                        Al volver a casa, tómate una taza de infusión caliente de manzanilla con anís estrellado o jengibre fresco. Esto relajará los esfínteres e impedirá el reflujo laringofaríngeo mientras duermes.
                      </p>
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 text-[11px] text-blue-800 leading-normal">
                        <strong>Tip Extra:</strong> Duerme ligeramente reclinado sobre tu costado izquierdo (posición de decúbito lateral izquierdo) para impedir que los jugos ácidos asciendan por gravedad hacia el esófago.
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "finder" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Restaurantes Digestión Amigables</h3>
                  <p className="text-xs text-slate-500">Encuentra locales que ofrezcan opciones seguras, masa madre auténtica, asados limpios o alternativas reducidas en sodio.</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {zoneStyleOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => executeRestaurantSearch(opt.type)}
                      className={`text-[10px] font-bold border rounded-lg px-2.5 py-1.5 transition-all ${
                        selectedZoneStyle === opt.type ? "border-teal-500 bg-teal-50 text-teal-850 text-teal-800" : "border-slate-150 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className="mr-1">{opt.icon}</span>
                      <span>{opt.name}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3.5 pt-3 border-t border-slate-50">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Establecimientos sugeridos por cercanía:</span>
                  
                  {foundRestaurants.map((rest, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-150 p-4 hover:border-teal-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-black text-slate-800">{rest.name}</h4>
                          <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded">★ {rest.rating}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{rest.address}</span>
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-2">✨ Plato sugerido: <span className="font-normal text-slate-600">{rest.recommendation}</span></p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                          {rest.safety}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
