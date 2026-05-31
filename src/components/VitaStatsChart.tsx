import React, { useState, useEffect } from "react";
import { UserProfile, FoodAnalysis } from "../types";
import { 
  TrendingUp, Activity, Dumbbell, Flame, Utensils, Heart, Info,
  Sparkles, Calendar, Award, Shield, AlertCircle, PieChart, BarChart
} from "lucide-react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";

interface VitaStatsChartProps {
  user: UserProfile;
  analyses: FoodAnalysis[];
  isDarkMode: boolean;
}

export default function VitaStatsChart({ user, analyses, isDarkMode }: VitaStatsChartProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7days" | "30days">("7days");
  const [selectedChart, setSelectedChart] = useState<"calories" | "macros" | "digestive">("calories");

  // Load sports training sessions to unify dataset
  useEffect(() => {
    async function loadSportsData() {
      setLoading(true);
      try {
        // First look in localStorage cache
        const sessionsCache = localStorage.getItem(`vitaai_training_sessions_${user.uid}`);
        if (sessionsCache) {
          setSessions(JSON.parse(sessionsCache));
        }

        // Pull from firestore
        const sessionsRef = collection(db, "training_sessions");
        const q = query(sessionsRef, where("userId", "==", user.uid), orderBy("date", "desc"));
        const snap = await getDocs(q);
        const parsed: any[] = [];
        snap.forEach((doc) => {
          parsed.push({ id: doc.id, ...doc.data() });
        });
        if (parsed.length > 0) {
          setSessions(parsed);
          localStorage.setItem(`vitaai_training_sessions_${user.uid}`, JSON.stringify(parsed));
        }
      } catch (err) {
        console.warn("Offline or permissions block fetching sports sessions, keeping backup:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSportsData();
  }, [user.uid]);

  // Aggregate stats based on YYYY-MM-DD
  const getAggregatedData = () => {
    const daysLimit = timeRange === "7days" ? 7 : 30;
    const aggregated: { [dateStr: string]: { date: string; calCons: number; calBurn: number; duration: number; protein: number; carbs: number; fat: number; count: number } } = {};

    // Prep empty array of recent days
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      aggregated[dateStr] = {
        date: dateStr,
        calCons: 0,
        calBurn: 0,
        duration: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        count: 0
      };
    }

    // Accumulate Food analysis calories
    analyses.forEach((item) => {
      if (!item.createdAt) return;
      const dateStr = item.createdAt.substring(0, 10);
      if (aggregated[dateStr]) {
        aggregated[dateStr].calCons += item.estimated_calories || 0;
        aggregated[dateStr].protein += item.protein || 0;
        aggregated[dateStr].carbs += item.carbs || 0;
        aggregated[dateStr].fat += item.fat || 0;
        aggregated[dateStr].count += 1;
      }
    });

    // Accumulate Sports Workout sessions
    sessions.forEach((sess) => {
      if (!sess.date) return;
      const dateStr = sess.date.substring(0, 10);
      if (aggregated[dateStr]) {
        aggregated[dateStr].calBurn += sess.calories || 0;
        aggregated[dateStr].duration += sess.duration || 0;
      }
    });

    return Object.values(aggregated).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = getAggregatedData();

  // Pre-calculate aggregate sports vs nutrition highlights
  const totalCalConsumed = chartData.reduce((acc, c) => acc + c.calCons, 0);
  const totalCalBurned = chartData.reduce((acc, c) => acc + c.calBurn, 0);
  const totalWorkoutMinutes = chartData.reduce((acc, c) => acc + c.duration, 0);
  const totalMealsLogged = chartData.reduce((acc, c) => acc + c.count, 0);

  // Average digestive risk counts
  const digestiveStats = { Low: 0, Medium: 0, High: 0 };
  analyses.forEach(item => {
    const risk = item.digestive_risk || "Low";
    if (risk === "Low" || risk === "Medium" || risk === "High") {
      digestiveStats[risk]++;
    } else {
      digestiveStats["Low"]++;
    }
  });
  const totalDigestiveLogged = (digestiveStats.Low + digestiveStats.Medium + digestiveStats.High) || 1;

  // Calculates max value to scale visual charts properly
  const maxCaloriesRaw = Math.max(...chartData.map(d => Math.max(d.calCons, d.calBurn)), 400);

  return (
    <div 
      className={`rounded-3xl border p-6 transition-all duration-300 shadow-sm ${
        isDarkMode 
          ? "bg-slate-900 border-slate-800 text-slate-150" 
          : "bg-white border-slate-100 text-slate-800"
      }`}
      id="vita-unified-stats-viewport"
    >
      {/* Title Header with Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-6 border-slate-100/40">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-550 text-emerald-500 animate-pulse" />
            <span>Panel de Avances Estadísticos</span>
          </h3>
          <p className="text-xs text-slate-400">
            Sinergia histórica de ingesta nutricional (VitaScan) y desgaste deportivo (Entrenamientos).
          </p>
        </div>

        {/* Filters and Configs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range switch */}
          <div className="inline-flex rounded-lg bg-slate-100/60 p-0.5 border border-slate-150 dark:bg-slate-800/60 dark:border-slate-700">
            <button
              onClick={() => setTimeRange("7days")}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
                timeRange === "7days"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-slate-700 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Últimos 7 Días
            </button>
            <button
              onClick={() => setTimeRange("30days")}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
                timeRange === "30days"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-slate-700 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Este Mes
            </button>
          </div>

          {/* Metric Selector Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100/60 p-0.5 border border-slate-150 dark:bg-slate-800/60 dark:border-slate-700">
            <button
              onClick={() => setSelectedChart("calories")}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
                selectedChart === "calories"
                  ? "bg-emerald-50 px-2.5 py-1 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Flame className="h-3 w-3" />
              <span>Calorías Balance</span>
            </button>
            <button
              onClick={() => setSelectedChart("macros")}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
                selectedChart === "macros"
                  ? "bg-emerald-50 px-2.5 py-1 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Utensils className="h-3 w-3" />
              <span>Macronutrientes</span>
            </button>
            <button
              onClick={() => setSelectedChart("digestive")}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
                selectedChart === "digestive"
                  ? "bg-emerald-50 px-2.5 py-1 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "text-slate-400"
              }`}
            >
              <Heart className="h-3 w-3" />
              <span>Riesgo Digestivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800/40 border-slate-750" : "bg-emerald-50/20 border-emerald-100/40"} space-y-1`}>
          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold flex items-center gap-1">
            <Utensils className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ingesta Total</span>
          </span>
          <p className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{totalCalConsumed.toLocaleString()} Kcal</p>
          <span className="text-[10px] text-slate-400">{totalMealsLogged} comidas escaneadas</span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800/40 border-slate-750" : "bg-purple-50/20 border-purple-150/40"} space-y-1`}>
          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5 text-purple-600" />
            <span>Quema Deportiva</span>
          </span>
          <p className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{totalCalBurned.toLocaleString()} Kcal</p>
          <span className="text-[10px] text-slate-400">{totalWorkoutMinutes}m acumulados</span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800/40 border-slate-750" : "bg-indigo-50/20 border-indigo-150/40"} space-y-1 col-span-2`}>
          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            <span>Resumen del Período</span>
          </span>
          <div className="flex justify-between items-center mt-1">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {totalCalConsumed > totalCalBurned 
                  ? `Superávit Neto: +${(totalCalConsumed - totalCalBurned).toLocaleString()} Kcal`
                  : `Déficit Activo: -${(totalCalBurned - totalCalConsumed).toLocaleString()} Kcal`
                }
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">Mide la correlación entre energía digerida y deporte realizado.</p>
            </div>
            <Award className="h-7 w-7 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Charts Box */}
      <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/40 border-slate-100"} relative`}>
        
        {/* CHART TYPE 1: Calories Balance */}
        {selectedChart === "calories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ingesta v/s Desgasto Energético Diario</h4>
                <p className="text-[11px] text-slate-400">Barras dobles comparando calorías comidas frente a quemadas por ejercicio físico.</p>
              </div>
              <div className="flex gap-4 text-[10px] font-extrabold uppercase">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Ingesta (VitaScan)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span>Ejercicio</span>
                </span>
              </div>
            </div>

            {/* Responsive Chart Stage */}
            <div className="h-60 flex items-end justify-between px-2 pt-6 border-b border-l border-slate-150 dark:border-slate-800 relative">
              
              {/* Horizontal Reference Lines */}
              <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-200/50 dark:border-slate-800/40" />
              <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-200/50 dark:border-slate-800/40" />
              <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-slate-200/50 dark:border-slate-800/40" />
              
              {chartData.map((d, index) => {
                const heightConsPct = (d.calCons / maxCaloriesRaw) * 100 || 2;
                const heightBurnPct = (d.calBurn / maxCaloriesRaw) * 100 || 2;
                
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group relative z-10 mx-1 max-w-[80px]">
                    
                    {/* Hover tooltips */}
                    <div className="absolute opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all -top-16 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-[10px] p-2.5 rounded-xl z-50 pointer-events-none shadow-lg text-left min-w-[120px] leading-relaxed border border-slate-700">
                      <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-emerald-400">{d.date}</p>
                      <p className="flex justify-between"><span>Ingesta o Comida:</span> <strong className="text-emerald-350">{d.calCons} Kcal</strong></p>
                      <p className="flex justify-between"><span>Deporte / Entrenamiento:</span> <strong className="text-purple-350">{d.calBurn} Kcal</strong></p>
                    </div>

                    {/* Doubled bar visualizer */}
                    <div className="flex gap-1.5 items-end h-44 w-full justify-center">
                      {/* Calories Consumed */}
                      <div 
                        className="w-3 bg-emerald-500 rounded-t-sm hover:opacity-85 transition-opacity"
                        style={{ height: `${Math.max(4, heightConsPct)}%` }}
                      />
                      {/* Calories Burned */}
                      <div 
                        className="w-3 bg-purple-500 rounded-t-sm hover:opacity-85 transition-opacity"
                        style={{ height: `${Math.max(4, heightBurnPct)}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono mt-2 select-none">
                      {timeRange === "30days" && index % 5 !== 0 ? "" : d.date.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHART TYPE 2: Macronutrients Breakdown */}
        {selectedChart === "macros" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tendencia Nutricional de Macronutrientes</h4>
              <p className="text-[11px] text-slate-400">Gramos calculados de Proteína, Carbohidratos y Grasas a partir de tus fotos detectadas.</p>
            </div>

            {/* Multi-line stack chart or comparative bars */}
            <div className="h-60 flex items-end justify-between px-2 pt-6 border-b border-l border-slate-150 dark:border-slate-800 relative">
              <div className="absolute inset-y-0 right-4 flex flex-col justify-center space-y-1 text-[10px] font-semibold text-slate-400 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-xs bg-emerald-400" />Proteínas (g)</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-xs bg-amber-400" />Carbohidratos (g)</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-xs bg-rose-400" />Grasas (g)</span>
              </div>

              {chartData.map((d, index) => {
                const totalGrams = (d.protein + d.carbs + d.fat) || 1;
                const protPct = (d.protein / totalGrams) * 100;
                const carbsPct = (d.carbs / totalGrams) * 100;
                const fatPct = (d.fat / totalGrams) * 100;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group relative z-10 mx-1 max-w-[80px]">
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all -top-20 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-[10px] p-2.5 rounded-xl z-50 pointer-events-none shadow-lg text-left min-w-[140px] leading-relaxed border border-slate-700">
                      <p className="font-bold border-b border-slate-750 pb-1 mb-1 text-amber-400">{d.date}</p>
                      <p className="flex justify-between"><span>Proteínas:</span> <strong>{d.protein.toFixed(1)}g</strong></p>
                      <p className="flex justify-between"><span>Carboidratos:</span> <strong>{d.carbs.toFixed(1)}g</strong></p>
                      <p className="flex justify-between"><span>Grasas:</span> <strong>{d.fat.toFixed(1)}g</strong></p>
                    </div>

                    {/* Stacking bar blocks */}
                    <div className="w-6 h-44 flex flex-col justify-end rounded-sm overflow-hidden bg-slate-200/30">
                      {d.protein + d.carbs + d.fat > 0 ? (
                        <>
                          <div className="bg-rose-400" style={{ height: `${fatPct}%` }} />
                          <div className="bg-amber-400" style={{ height: `${carbsPct}%` }} />
                          <div className="bg-emerald-400" style={{ height: `${protPct}%` }} />
                        </>
                      ) : (
                        <div className="h-1 bg-slate-100 w-full" />
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono mt-2">
                       {timeRange === "30days" && index % 5 !== 0 ? "" : d.date.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHART TYPE 3: Digestive Risk Indicator */}
        {selectedChart === "digestive" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Métricas de Alergenos y Riesgo Gástrico</h4>
              <p className="text-[11px] text-slate-400">Balance del grado de compatibilidad digestiva analizada en tus ingestas clínicas.</p>
            </div>

            {analyses.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                Escanea alimentos en la sección VitaScan para rellenar este gráfico interactivo.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                
                {/* Visual donut representation */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative h-40 w-40 flex items-center justify-center">
                    {/* SVG Circular Donut representation */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="3" />
                      
                      {/* Low Risk Segment (Green) */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" 
                        strokeDasharray={`${(digestiveStats.Low / totalDigestiveLogged) * 100} ${100 - ((digestiveStats.Low / totalDigestiveLogged) * 100)}`}
                        strokeDashoffset="0"
                      />

                      {/* Medium Risk Segment (Yellow) */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" 
                        strokeDasharray={`${(digestiveStats.Medium / totalDigestiveLogged) * 100} ${100 - ((digestiveStats.Medium / totalDigestiveLogged) * 100)}`}
                        strokeDashoffset={`-${(digestiveStats.Low / totalDigestiveLogged) * 100}`}
                      />

                      {/* High Risk Segment (Red) */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3" 
                        strokeDasharray={`${(digestiveStats.High / totalDigestiveLogged) * 100} ${100 - ((digestiveStats.High / totalDigestiveLogged) * 100)}`}
                        strokeDashoffset={`-${((digestiveStats.Low + digestiveStats.Medium) / totalDigestiveLogged) * 100}`}
                      />
                    </svg>

                    {/* Centered overall health score text */}
                    <div className="absolute text-center space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estabilidad</span>
                      <strong className="text-2xl font-black text-slate-800 dark:text-slate-100">
                        {Math.round((digestiveStats.Low / totalDigestiveLogged) * 100)}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators detailed values */}
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>Esquemas Seguros / Riesgo Bajo</span>
                      </span>
                      <strong className="font-mono text-slate-700 dark:text-slate-300">{digestiveStats.Low} ({Math.round((digestiveStats.Low / totalDigestiveLogged) * 100)}%)</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(digestiveStats.Low / totalDigestiveLogged) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>Riesgo Moderado / Alerta de Síntomas</span>
                      </span>
                      <strong className="font-mono text-slate-700 dark:text-slate-300">{digestiveStats.Medium} ({Math.round((digestiveStats.Medium / totalDigestiveLogged) * 100)}%)</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(digestiveStats.Medium / totalDigestiveLogged) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        <span>Riesgo Alto / Irritantes Gástricos</span>
                      </span>
                      <strong className="font-mono text-slate-700 dark:text-slate-300">{digestiveStats.High} ({Math.round((digestiveStats.High / totalDigestiveLogged) * 100)}%)</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(digestiveStats.High / totalDigestiveLogged) * 100}%` }} />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
