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
  ArrowLeftRight
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  user: UserProfile;
  analyses: FoodAnalysis[];
  onViewChange: (view: string) => void;
  onUpdateMetrics: (metrics: { age: number; weight: number; height: number; objective: string }) => Promise<void>;
  scansTodayCount: number;
  maxFreeScans: number;
}

export default function Dashboard({
  user,
  analyses,
  onViewChange,
  onUpdateMetrics,
  scansTodayCount,
  maxFreeScans
}: DashboardProps) {
  const [editingMetrics, setEditingMetrics] = useState(
    !user.age || !user.weight || !user.height || !user.objective
  );
  
  const [age, setAge] = useState(user.age || 30);
  const [weight, setWeight] = useState(user.weight || 70);
  const [height, setHeight] = useState(user.height || 170);
  const [objective, setObjective] = useState(user.objective || "colon_irritable");
  const [saveLoading, setSaveLoading] = useState(false);

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
            <h2 className="text-2xl font-bold sm:text-3xl">¡Hola, {user.name || "Usuario VitaAI"}! 👋</h2>
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
          
          <h3 className="text-lg font-bold text-slate-800">Servicios Clínicos Disponibles</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
            
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
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-600 transition-colors group-hover:bg-purple-100">
                  <Utensils className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 uppercase">Gastronomía</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors">VitaRecipes</h4>
                <p className="mt-1 text-xs text-slate-400">Recetas saludables generadas con IA para motivar tu bienestar diario.</p>
              </div>
            </div>

            {/* Customized Nutrition Plans */}
            <div 
              id="feature-card-diets"
              onClick={() => onViewChange("diet")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <Calendar className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                  <span>VitaPlan</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Planes alimenticios personalizados y dietas estructuradas para tu salud.</p>
              </div>
            </div>

            {/* Detective Digestivo */}
            <div 
              id="feature-card-detective"
              onClick={() => onViewChange("digestive-insights")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-teal-50 p-3 text-teal-600 transition-colors group-hover:bg-teal-100">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
                  <span>VitaInsight</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Descubre qué alimentos afectan tu bienestar.</p>
              </div>
            </div>

            {/* Escáner de Supermercado */}
            <div 
              id="feature-card-scanner"
              onClick={() => onViewChange("supermarket-scanner")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <Barcode className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                  <span>VitaMarket</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Escanea productos y descubre opciones más saludables.</p>
              </div>
            </div>

            {/* Coach Nutricional */}
            <div 
              id="feature-card-coach"
              onClick={() => onViewChange("nutrition-coach")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-orange-50 p-3 text-orange-600 transition-colors group-hover:bg-orange-100">
                  <Brain className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-orange-700 transition-colors flex items-center gap-1.5">
                  <span>VitaCoach Hábitos</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Coach Nutricional y Seguimiento diario de agua.</p>
              </div>
            </div>

            {/* Planificador de Compras */}
            <div 
              id="feature-card-shopping-planner"
              onClick={() => onViewChange("shopping-planner")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                  <span>VitaPlan de Compras</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Planificador de compras semanal con costeo y listado descargable.</p>
              </div>
            </div>

            {/* Modo Familiar */}
            <div 
              id="feature-card-family"
              onClick={() => onViewChange("family-profiles")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <Users className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 uppercase">Disponible</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                  <span>VitaFamily</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Gestiona la nutrición de toda tu familia.</p>
              </div>
            </div>

            {/* Gamificación */}
            <div 
              id="feature-card-gamification"
              onClick={() => onViewChange("achievements")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-rose-50 p-3 text-rose-600 transition-colors group-hover:bg-rose-100">
                  <Trophy className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 uppercase">Insignias</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-rose-700 transition-colors">VitaGoals</h4>
                <p className="mt-1 text-xs text-slate-400">Logros y retos para mejorar tus hábitos saludables.</p>
              </div>
            </div>

            {/* VitaPerformance Card */}
            <div 
              id="feature-card-performance"
              onClick={() => onViewChange("performance")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-teal-50 p-3 text-teal-600 transition-colors group-hover:bg-teal-100">
                  <Dumbbell className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
                  <span>VitaPerformance AI</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Planificador deportivo, retos, métricas de esfuerzo y recuperación mental.</p>
              </div>
            </div>

            {/* Perfil Clínico Especializado Card */}
            <div 
              id="feature-card-clinical-profile"
              onClick={() => onViewChange("clinical-profile")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-teal-50 p-3 text-teal-600 transition-colors group-hover:bg-teal-100">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
                  <span>Perfil Clínico</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Expediente gástrico detallado, alergias, intolerancias y patologías gástricas.</p>
              </div>
            </div>

            {/* VitaVacation Card */}
            <div 
              id="feature-card-vacations"
              onClick={() => onViewChange("vacations")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <Calendar className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                  <span>VitaVacaciones</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Planificador vacacional, compensación de excesos e inflamación y ejercicios exprés.</p>
              </div>
            </div>

            {/* Vida Social AI Card */}
            <div 
              id="feature-card-social-meals"
              onClick={() => onViewChange("social-meals")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <Users className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                  <span>Vida Social AI</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Modulador mucoso gástrico, buscadores éticos y planners de fiestas.</p>
              </div>
            </div>

            {/* VitaTravel Card */}
            <div 
              id="feature-card-travel"
              onClick={() => onViewChange("vitatravel")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <Plane className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                  <span>VitaTravel AI</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Guía de vuelo y tránsito, re-sincronizador de jet-lag y botiquín gástrico digital.</p>
              </div>
            </div>

            {/* Smart Comparator Card */}
            <div 
              id="feature-card-comparator"
              onClick={() => onViewChange("smart-comparator")}
              className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <ArrowLeftRight className="h-6 w-6" />
                </div>
                {user.subscriptionStatus === "free" ? (
                  <span className="rounded-full bg-slate-150 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Plus</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 uppercase">Premium</span>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                  <span>VitaMarket Precios</span>
                  {user.subscriptionStatus === "free" && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Compara proteínas, suplementos deportivos, probióticos y marcas aliadas.</p>
              </div>
            </div>

          </div>

          {/* History Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-500" />
                <span>Últimos Análisis Realizados</span>
              </h3>
              {analyses.length > 0 && (
                <button
                  onClick={() => onViewChange("analyze")}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Ver todos
                </button>
              )}
            </div>

            {analyses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <Camera className="mx-auto h-10 w-10 text-slate-350" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Aún no se registran análisis</p>
                <p className="mt-1 text-xs text-slate-400">Sube una fotografía de tu platillo para estimar macros e identificar irritantes.</p>
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
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          record.digestive_risk === "High" ? "bg-rose-50 text-rose-700" :
                          record.digestive_risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          Riesgo {record.digestive_risk === "High" ? "Alto 🚨" : record.digestive_risk === "Medium" ? "Medio ⚠️" : "Bajo ✅"}
                        </span>
                        <div className="flex items-center text-[10px] text-slate-400 font-mono">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{new Date(record.createdAt).toLocaleDateString("es-ES")}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        {record.foods_detected.slice(0, 3).join(", ") || "Platillo mixto"}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Calorías estimadas: <strong className="text-slate-600 font-bold">{record.estimated_calories} kcal</strong></p>
                    </div>

                    <div className="border-t border-slate-50 mt-3 pt-3 flex items-center justify-between">
                      <div className="flex space-x-2 text-[10px] text-slate-400">
                        <span>P: {record.protein}g</span>
                        <span>C: {record.carbs}g</span>
                        <span>G: {record.fat}g</span>
                      </div>
                      <button
                        onClick={() => onViewChange("analyze")} // Direct to analyze results section
                        className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Physical Metrics & Conditions */}
        <div className="space-y-8">
          
          <h3 className="text-lg font-bold text-slate-800">Mi Perfil Digestivo</h3>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            
            {!editingMetrics ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Condición estomacal</span>
                  <button 
                    onClick={() => setEditingMetrics(true)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    id="metrics-edit-btn"
                  >
                    Editar
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-50 py-1.5 text-sm">
                    <span className="text-slate-500">Objetivo Nutricional</span>
                    <span className="font-semibold text-slate-800">{getObjectiveLabel(user.objective || "colon_irritable")}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5 text-sm">
                    <span className="text-slate-500">Edad</span>
                    <span className="font-semibold text-slate-800">{user.age || "No detallado"} años</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5 text-sm">
                    <span className="text-slate-500">Peso</span>
                    <span className="font-semibold text-slate-800">{user.weight || "No detallado"} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5 text-sm">
                    <span className="text-slate-500">Altura</span>
                    <span className="font-semibold text-slate-800">{user.height || "No detallado"} cm</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 flex items-start space-x-2 border border-slate-100">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tus métricas de hidratación, peso y condición estomacal alimentan directamente el motor de Inteligencia Artificial (Gemini Vision + Specialized Chat) para darte consejos clínicos que protegen tu flora estomacal.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveMetrics} className="space-y-4" id="metrics-editor-form">
                <h4 className="text-sm font-bold text-slate-800">Actualizar Datos Físicos</h4>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Objetivo Gástrico Principal</label>
                  <select 
                    id="objective-select"
                    value={objective} 
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white"
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
                    <label className="text-[11px] text-slate-400 font-medium">Edad</label>
                    <input 
                      id="age-input"
                      type="number" 
                      min="1" 
                      max="120"
                      value={age} 
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Peso (kg)</label>
                    <input 
                      id="weight-input"
                      type="number" 
                      min="20" 
                      max="300"
                      value={weight || ""} 
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Altura (cm)</label>
                    <input 
                      id="height-input"
                      type="number" 
                      min="50" 
                      max="250"
                      value={height || ""} 
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (user.age && user.weight) setEditingMetrics(false);
                    }}
                    className="w-1/2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm border border-amber-100/50 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Tip Desinflamatorio del Día</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Evita frutas altas en FODMAPs</strong> como manzanas y peras en la misma comida con legumbres. Prefiere comer papaya dulce madura antes del almuerzo principal para potenciar tus enzimas digestivas naturales.
            </p>
            <div className="pt-2 text-right">
              <button 
                onClick={() => onViewChange("help")}
                className="text-[11px] font-bold text-amber-700 hover:underline inline-flex items-center"
              >
                <span>Leer Guías Clínicas</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
