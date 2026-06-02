import React, { useState } from "react";
import { UserProfile, FoodAnalysis } from "../types";
import { 
  Camera, 
  MessageSquare, 
  Utensils, 
  Calendar, 
  History, 
  Activity, 
  UserPlus, 
  Sparkles, 
  Lock, 
  ShieldAlert, 
  RotateCcw,
  Clock,
  ExternalLink,
  BrainCircuit,
  Barcode,
  Brain,
  ShoppingCart,
  Users,
  Trophy,
  Dumbbell,
  Plane,
  ArrowLeftRight,
  X,
  ChevronLeft,
  ChevronRight,
  Image,
  AlertCircle,
  CheckCircle,
  Flame,
  Beef,
  Wheat,
  Droplets
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import VitaStatsChart from "./VitaStatsChart";

interface DashboardProps {
  user: UserProfile;
  analyses: FoodAnalysis[];
  onViewChange: (view: string) => void;
  onUpdateMetrics: (metrics: { name?: string; age: number; weight: number; height: number; objective: string }) => Promise<void>;
  scansTodayCount: number;
  maxFreeScans: number;
  isDarkMode: boolean;
}

export default function Dashboard({
  user,
  analyses,
  onViewChange,
  onUpdateMetrics,
  scansTodayCount,
  maxFreeScans,
  isDarkMode
}: DashboardProps) {
  const [editingMetrics, setEditingMetrics] = useState(
    !user.age || !user.weight || !user.height || !user.objective
  );
  
  const [age, setAge] = useState(user.age || 30);
  const [weight, setWeight] = useState(user.weight || 70);
  const [height, setHeight] = useState(user.height || 170);
  const [objective, setObjective] = useState(user.objective || "colon_irritable");
  const [saveLoading, setSaveLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<FoodAnalysis | null>(null);
  const [showAllTable, setShowAllTable] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<"semana" | "mes" | "año" | "todos">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filterAnalysesByPeriod = (list: FoodAnalysis[], period: typeof filterPeriod) => {
    if (period === "todos") return list;
    const now = new Date();
    const cutoff = new Date();
    if (period === "semana") cutoff.setDate(now.getDate() - 7);
    else if (period === "mes") cutoff.setMonth(now.getMonth() - 1);
    else if (period === "año") cutoff.setFullYear(now.getFullYear() - 1);
    return list.filter(a => new Date(a.createdAt).getTime() >= cutoff.getTime());
  };

  const filteredAnalyses = filterAnalysesByPeriod(analyses, filterPeriod);
  const totalPages = Math.max(1, Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE));
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await onUpdateMetrics({
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        objective
      });
      setEditingMetrics(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const getObjectiveLabel = (obj: string) => {
    switch (obj) {
      case "gastritis": return "Aliviar Gastritis / Reflujo";
      case "colon_irritable": return "Controlar Colon Irritable / SII";
      case "bloating": return "Reducir Inflamación y Distensión";
      case "weight_loss": return "Alimentación Balanceada y Control de Peso";
      case "healthy": return "Salud Gastrointestinal General";
      case "deportistas": return "Deportista de Alto Rendimiento 🏋️‍♂️";
      default: return obj;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-100 sm:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">¡Hola, {user.name || "Usuario Vita IA"}! 👋</h2>
            <p className="mt-2 text-emerald-50/90 text-sm max-w-xl">
              Tu asistente de nutrición inteligente está listo. Analiza tus porciones en tiempo real para optimizar tu bienestar general y alcanzar tu peso ideal.
            </p>
            {user.objective && (
              <span className="mt-3.5 inline-flex items-center space-x-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Activity className="h-3 w-3" />
                <span>Objetivo: {getObjectiveLabel(user.objective)}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col items-start bg-white/15 rounded-2xl p-4 border border-white/10 backdrop-blur-md min-w-[200px]">
            <p className="text-xs text-emerald-100 uppercase font-bold tracking-wider">Scans de Alimentos hoy</p>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold">
                {user.subscriptionStatus === "premium" ? "∞" : Math.max(0, maxFreeScans - scansTodayCount)}
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                {user.subscriptionStatus === "premium" ? "Análisis ilimitados" : `de ${maxFreeScans} diarios libres`}
              </span>
            </div>
            
            {/* Quick status bar */}
            {user.subscriptionStatus === "free" && (
              <div className="mt-2.5 w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-300 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (scansTodayCount / maxFreeScans) * 100)}%` }}
                />
              </div>
            )}
            
            {user.subscriptionStatus === "free" ? (
              <button
                onClick={() => onViewChange("premium")}
                className="mt-3 w-full rounded-lg bg-amber-400 py-1.5 text-center text-xs font-bold text-teal-950 hover:bg-amber-300 transition-colors"
                id="unlock-premium-btn"
              >
                Desbloquear Ilimitado
              </button>
            ) : (
              <span className="mt-3 inline-block text-[11px] text-amber-300 font-bold tracking-widest uppercase">
                👑 Usuario Premium Activo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Features and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left / Center Column: Action Cards */}
        <div className="lg:col-span-2 space-y-8">
          
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Servicios Clínicos Disponibles</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">

            {/* Vita IA Max Elite Fitness Modules Card */}
            <div 
              id="feature-card-viamax"
              onClick={() => onViewChange("vita-ia-max")}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-rose-450 dark:border-rose-900 bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 p-5 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between bg-transparent">
                <div className="rounded-xl bg-rose-500 p-3 text-white transition-transform group-hover:scale-110">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-350 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-900 animate-pulse">MAX ELITE $15/mes</span>
              </div>
              <div className="bg-transparent">
                <h4 className="text-base font-black text-rose-600 dark:text-rose-400 group-hover:text-rose-700 transition-colors flex items-center gap-1.5">
                  <span>🌟 Vita IA Max Elite</span>
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Capturador inteligente de logros, calculadora de 1RM & RPE/RIR, dosificador pro y calendario de mesociclos.</p>
              </div>
            </div>
            
            {/* Food Analyzer Card */}
            <div 
              id="feature-card-analyzer"
              onClick={() => onViewChange("analyze")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 uppercase">Principal</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">VitaScan</h4>
                <p className="mt-1 text-xs text-slate-400">Analiza tus alimentos mediante IA en tiempo real.</p>
              </div>
            </div>

            {/* Specialized AI Chat */}
            <div 
              id="feature-card-chat"
              onClick={() => onViewChange("chat")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 uppercase">IA Consultorio</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition-colors">VitaCoach</h4>
                <p className="mt-1 text-xs text-slate-400">Tu nutricionista inteligente personal disponible 24/7.</p>
              </div>
            </div>

            {/* Smart Recipes */}
            <div 
              id="feature-card-recipes"
              onClick={() => onViewChange("recipes")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 p-3 text-purple-600 dark:text-purple-400 transition-colors group-hover:bg-purple-100">
                  <Utensils className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-purple-50 dark:bg-purple-900/40 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">Gastronomía</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">VitaRecipes</h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">Recetas saludables generadas con IA para motivar tu bienestar diario.</p>
              </div>
            </div>

            {/* Customized Nutrition Plans */}
            <div 
              id="feature-card-diets"
              onClick={() => onViewChange("diet")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-600 dark:text-amber-400 transition-colors group-hover:bg-amber-100">
                  <Calendar className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 dark:bg-amber-900/40 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <span>VitaPlan</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Planes alimenticios personalizados y dietas estructuradas para tu salud.</p>
              </div>
            </div>

            {/* Detective Digestivo */}
            <div 
              id="feature-card-detective"
              onClick={() => onViewChange("digestive-insights")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 text-teal-600 dark:text-teal-400 transition-colors group-hover:bg-teal-100">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-teal-50 dark:bg-teal-900/40 px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span>VitaInsight</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Descubre qué alimentos afectan tu bienestar.</p>
              </div>
            </div>

            {/* Escáner de Supermercado (VitaMarket) */}
            <div 
              id="feature-card-scanner"
              onClick={() => onViewChange("supermarket-scanner")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-100">
                  <Barcode className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <span>VitaMarket</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Escanea productos y descubre opciones más saludables.</p>
              </div>
            </div>

            {/* Coach Nutricional */}
            <div 
              id="feature-card-coach"
              onClick={() => onViewChange("nutrition-coach")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 p-3 text-orange-600 dark:text-orange-450 transition-colors group-hover:bg-orange-100">
                  <Brain className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-orange-50 dark:bg-orange-900/40 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:text-orange-300 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-700 dark:group-hover:text-orange-450 transition-colors flex items-center gap-1.5">
                  <span>Vita Status</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Coach Nutricional y Seguimiento diario de agua.</p>
              </div>
            </div>

            {/* Modo Familiar */}
            <div 
              id="feature-card-family"
              onClick={() => onViewChange("family-profiles")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-600 dark:text-amber-400 transition-colors group-hover:bg-amber-100">
                  <Users className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 dark:bg-amber-900/40 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-450 transition-colors flex items-center gap-1.5">
                  <span>VitaFamily</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Gestiona la nutrición de toda tu familia.</p>
              </div>
            </div>

            {/* Gamificación */}
            <div 
              id="feature-card-gamification"
              onClick={() => onViewChange("achievements")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 text-rose-600 dark:text-rose-400 transition-colors group-hover:bg-rose-100">
                  <Trophy className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-rose-50 dark:bg-rose-900/40 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase">Insignias</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">VitaGoals</h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Logros y retos para mejorar tus hábitos saludables.</p>
              </div>
            </div>

            {/* VitaPerformance Card */}
            <div 
              id="feature-card-performance"
              onClick={() => onViewChange("performance")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 text-teal-600 dark:text-teal-400 transition-colors group-hover:bg-teal-100">
                  <Dumbbell className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-teal-50 dark:bg-teal-900/40 px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                  <span>VitaPerformance AI</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-455 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Planificador deportivo, retos, métricas de esfuerzo y recuperación mental.</p>
              </div>
            </div>

            {/* Perfil Clínico Especializado Card */}
            <div 
              id="feature-card-clinical-profile"
              onClick={() => onViewChange("clinical-profile")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 text-teal-600 dark:text-teal-400 transition-colors group-hover:bg-teal-100">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/40 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span>Perfil Clínico</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-455 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Expediente gástrico detallado, alergias, intolerancias y patologías gástricas.</p>
              </div>
            </div>

            {/* VitaVacation Card */}
            <div 
              id="feature-card-vacations"
              onClick={() => onViewChange("vacations")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-100">
                  <Calendar className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>VitaVacaciones</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-455 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Planificador vacacional, compensación de excesos e inflamación y ejercicios exprés.</p>
              </div>
            </div>

            {/* VitaTravel Card */}
            <div 
              id="feature-card-travel"
              onClick={() => onViewChange("vitatravel")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-100">
                  <Plane className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <span>VitaTravel AI</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-455 dark:text-slate-500" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Guía de vuelo y tránsito, re-sincronizador de jet-lag y botiquín gástrico digital.</p>
              </div>
            </div>

            {/* VitaMind Espacio de Meditación & Psicología (Mental IA) */}
            <div 
              id="feature-card-vitamind"
              onClick={() => onViewChange("vitamind")}
              className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-100">
                  <Brain className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                  <span>Mental IA</span>
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <span>VitaMind</span>
                </h4>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-450">Meditación, control de estrés y reestructuración cognitiva para tu salud mental.</p>
              </div>
            </div>

          </div>

          {/* Unified Nutritional and Sports Statistics Panel */}
          <VitaStatsChart 
            user={user} 
            analyses={analyses} 
            isDarkMode={isDarkMode} 
          />

          {/* History Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-500" />
                <span>Últimos Análisis Realizados</span>
              </h3>
              {analyses.length > 0 && (
                <button
                  onClick={() => { setShowAllTable(!showAllTable); setCurrentPage(1); setFilterPeriod("todos"); }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {showAllTable ? "Ocultar tabla" : "Ver todos"}
                </button>
              )}
            </div>

            {analyses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8 text-center">
                <Camera className="mx-auto h-10 w-10 text-slate-350 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Aún no se registran análisis</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">Sube una fotografía de tu platillo para estimar macros e identificar irritantes.</p>
                <button
                  onClick={() => onViewChange("analyze")}
                  className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 transition-colors"
                  id="dashboard-first-scan-btn"
                >
                  Hacer mi Primer Escaneo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analyses.slice(0, 4).map((record, index) => (
                  <div 
                    key={record.id || index}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          record.digestive_risk === "High" ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-305" :
                          record.digestive_risk === "Medium" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-305" : "bg-emerald-5/10 dark:bg-emerald-950/30 text-emerald-705 dark:text-emerald-305"
                        }`}>
                          Riesgo {record.digestive_risk === "High" ? "Alto 🚨" : record.digestive_risk === "Medium" ? "Medio ⚠️" : "Bajo ✅"}
                        </span>
                        <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-505 font-mono">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{new Date(record.createdAt).toLocaleDateString("es-ES")}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-150 truncate">
                        {record.foods_detected.slice(0, 3).join(", ") || "Platillo mixto"}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">Calorías estimadas: <strong className="text-slate-650 dark:text-slate-200 font-bold">{record.estimated_calories} kcal</strong></p>
                    </div>

                    <div className="border-t border-slate-50 dark:border-slate-800/60 mt-3 pt-3 flex items-center justify-between">
                      <div className="flex space-x-2 text-[10px] text-slate-400 dark:text-slate-350">
                        <span>P: {record.protein}g</span>
                        <span>C: {record.carbs}g</span>
                        <span>G: {record.fat}g</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailModal(record); }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- FULL HISTORY TABLE WITH FILTERS & PAGINATION --- */}
            <AnimatePresence>
              {showAllTable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-2">
                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 p-3 border-b border-slate-100 bg-slate-50/50 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-bold mr-2">Filtrar:</span>
                      {(["semana", "mes", "año", "todos"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => { setFilterPeriod(p); setCurrentPage(1); }}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            filterPeriod === p
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {p === "semana" ? "Semana" : p === "mes" ? "Mes" : p === "año" ? "Año" : "Todos"}
                        </button>
                      ))}
                      <span className="ml-auto text-[11px] text-slate-400 font-medium">
                        {filteredAnalyses.length} registro{filteredAnalyses.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Table */}
                    {paginatedAnalyses.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">
                        Sin registros para el período seleccionado.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px]">Imagen</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px]">Alimento</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px] text-center">Calorías</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px] text-center">P</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px] text-center">C</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px] text-center">G</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px] text-center">Riesgo</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px]">Fecha</th>
                              <th className="px-3 py-2.5 font-bold text-slate-500 uppercase text-[10px] text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {paginatedAnalyses.map((record, idx) => (
                              <tr key={record.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 py-2">
                                  {record.imageUrl ? (
                                    <img
                                      src={record.imageUrl}
                                      alt="comida"
                                      className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-sm"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                      <Image className="h-4 w-4 text-slate-350" />
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <p className="font-semibold text-slate-700 truncate max-w-[160px]">
                                    {record.foods_detected.slice(0, 2).join(", ") || "Platillo"}
                                  </p>
                                  {record.confidence && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                      record.confidence === "Alta" ? "bg-emerald-100 text-emerald-700" :
                                      record.confidence === "Media" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                                    }`}>
                                      {record.confidence}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-slate-700">{record.estimated_calories}</td>
                                <td className="px-3 py-2 text-center text-emerald-600 font-medium">{record.protein}g</td>
                                <td className="px-3 py-2 text-center text-blue-600 font-medium">{record.carbs}g</td>
                                <td className="px-3 py-2 text-center text-rose-600 font-medium">{record.fat}g</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    record.digestive_risk === "High" ? "bg-rose-100 text-rose-700" :
                                    record.digestive_risk === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                  }`}>
                                    {record.digestive_risk === "High" ? "Alto" : record.digestive_risk === "Medium" ? "Medio" : "Bajo"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                                  {new Date(record.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => setDetailModal(record)}
                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                                  >
                                    Detalle
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-100 bg-slate-50/30">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: Physical Metrics & Conditions */}
        <div className="space-y-8">
          
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Mi Perfil Digestivo</h3>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            
            {!editingMetrics ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Condición estomacal</span>
                  <button 
                    onClick={() => setEditingMetrics(true)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                    id="metrics-edit-btn"
                  >
                    Editar
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/50 py-1.5 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Objetivo Nutricional</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{getObjectiveLabel(user.objective || "colon_irritable")}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/50 py-1.5 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Edad</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.age || "No detallado"} años</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/50 py-1.5 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Peso</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.weight || "No detallado"} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/50 py-1.5 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Altura</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.height || "No detallado"} cm</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 flex items-start space-x-2 border border-slate-100 dark:border-slate-800">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tus métricas de hidratación, peso y condición estomacal alimentan directamente el motor de Inteligencia Artificial (Gemini Vision + Specialized Chat) para darte consejos clínicos que protegen tu flora estomacal.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveMetrics} className="space-y-4" id="metrics-editor-form">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-extrabold">Actualizar Datos Físicos</h4>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 dark:text-slate-450 font-semibold mb-1">Objetivo Gástrico Principal</label>
                  <select 
                    id="objective-select"
                    value={objective} 
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-750 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250"
                  >
                    <option value="gastritis">Aliviar Gastritis / Reflujo</option>
                    <option value="colon_irritable">Controlar Colon Irritable / SII</option>
                    <option value="bloating">Reducir Inflamación y Gases</option>
                    <option value="weight_loss">Pérdida de Peso Amigable</option>
                    <option value="healthy">Salud Digestiva General</option>
                    <option value="deportistas">Deportista de Alto Rendimiento 🏋️‍♂️</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Edad</label>
                    <input 
                      id="age-input"
                      type="number" 
                      min="1" 
                      max="120"
                      value={age} 
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-750 px-2 py-1.5 text-sm focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Peso (kg)</label>
                    <input 
                      id="weight-input"
                      type="number" 
                      min="20" 
                      max="300"
                      value={weight || ""} 
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-750 px-2 py-1.5 text-sm focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Altura (cm)</label>
                    <input 
                      id="height-input"
                      type="number" 
                      min="50" 
                      max="250"
                      value={height || ""} 
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-750 px-2 py-1.5 text-sm focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (user.age && user.weight) setEditingMetrics(false);
                    }}
                    className="w-1/2 rounded-lg border border-slate-200 dark:border-slate-75 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saveLoading}
                    className="w-1/2 rounded-lg bg-emerald-500 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                    id="save-metrics-btn"
                  >
                    {saveLoading ? "Guardando..." : "Guardar Ficha"}
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Useful Tips widget */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900/60 dark:to-emerald-950/20 p-5 shadow-sm border border-amber-100/50 dark:border-emerald-900/40 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Tip Desinflamatorio del Día</span>
            </h4>
            <p className="text-xs text-slate-650 dark:text-slate-305 leading-relaxed">
              <strong>Evita frutas altas en FODMAPs</strong> como manzanas y peras en la misma comida con legumbres. Prefiere comer papaya dulce madura antes del almuerzo principal para potenciar tus enzimas digestivas naturales.
            </p>
            <div className="pt-2 text-right">
              <button 
                onClick={() => onViewChange("help")}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center"
              >
                <span>Leer Guías Clínicas</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* --- DETAIL MODAL --- */}
      <AnimatePresence>
        {detailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDetailModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto z-10"
            >
              {/* Close button */}
              <button
                onClick={() => setDetailModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-20"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image */}
              {detailModal.imageUrl && (
                <div className="w-full h-48 sm:h-56 overflow-hidden rounded-t-2xl bg-slate-100">
                  <img
                    src={detailModal.imageUrl}
                    alt="Platillo analizado"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Diagnóstico Alimenticio</span>
                    <h3 className="text-lg font-bold text-slate-800">
                      {detailModal.foods_detected.join(", ")}
                    </h3>
                    {detailModal.confidence && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[11px] text-slate-500">Confianza:</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          detailModal.confidence === "Alta" ? "bg-emerald-100 text-emerald-800" :
                          detailModal.confidence === "Media" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {detailModal.confidence}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`rounded-xl px-3 py-1.5 border text-xs font-bold flex items-center gap-1 shrink-0 ${
                    detailModal.digestive_risk === "High" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    detailModal.digestive_risk === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Riesgo: {detailModal.digestive_risk === "High" ? "ALTO" : detailModal.digestive_risk === "Medium" ? "MEDIO" : "BAJO"}</span>
                  </div>
                </div>

                {/* Macronutrients grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <Flame className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <p className="text-lg font-extrabold text-slate-800">{detailModal.estimated_calories}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">kcal</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3 text-center">
                    <Beef className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                    <p className="text-lg font-extrabold text-emerald-700">{detailModal.protein}g</p>
                    <p className="text-[10px] text-emerald-600 uppercase font-bold">Proteínas</p>
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-3 text-center">
                    <Wheat className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-extrabold text-blue-700">{detailModal.carbs}g</p>
                    <p className="text-[10px] text-blue-600 uppercase font-bold">Carbos</p>
                  </div>
                  <div className="bg-rose-50/50 rounded-xl p-3 text-center">
                    <Droplets className="h-4 w-4 mx-auto text-rose-500 mb-1" />
                    <p className="text-lg font-extrabold text-rose-700">{detailModal.fat}g</p>
                    <p className="text-[10px] text-rose-600 uppercase font-bold">Grasas</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Advertencias Clínicas
                  </h4>
                  <ul className="space-y-2">
                    {detailModal.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="text-amber-500 font-extrabold mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alternatives */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Alternativas Amigables
                  </h4>
                  <ul className="space-y-2">
                    {detailModal.alternatives.map((alt, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="text-emerald-500 font-extrabold mt-0.5">✓</span>
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Date footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(detailModal.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[10px] text-slate-350 bg-slate-50 px-2 py-0.5 rounded-full">
                    ID: {detailModal.id?.slice(0, 8) || "N/A"}
                  </span>
                </div>

                {/* Disclaimer */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-[10px] text-slate-400 leading-normal text-center">
                  ⚠️ El análisis visual de VitaAI es netamente estimativo y educativo. No reemplaza un laboratorio presencial ni una consulta con tu médico o nutricionista.
                </div>

                {/* Close button footer */}
                <button
                  onClick={() => setDetailModal(null)}
                  className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 transition-colors"
                >
                  Cerrar Detalle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
