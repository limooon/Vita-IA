import React, { useState, useEffect } from "react";
import { UserProfile, UserProgress, Achievement } from "../types";
import { 
  ArrowLeft, Award, Trophy, Sparkles, Flame, CheckCircle, 
  Lock, Zap, Star, LayoutGrid, CalendarRange, HeartHandshake, HelpCircle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AchievementsProps {
  user: UserProfile;
  analysesCount: number;
  onViewChange: (view: string) => void;
}

export default function Achievements({
  user,
  analysesCount,
  onViewChange
}: AchievementsProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pullUserProgress();
  }, [user, analysesCount]);

  const pullUserProgress = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "user_progress", user.uid);
      const snap = await getDoc(docRef);

      let currentProg: UserProgress;

      if (snap.exists()) {
        currentProg = snap.data() as UserProgress;
      } else {
        // Initialize user progress
        currentProg = {
          userId: user.uid,
          streakDays: 3, // Starter streak encouragement
          lastLogDate: new Date().toISOString(),
          mealsLoggedCount: analysesCount || 1,
          recipesLoggedCount: 0,
          photosAnalyzedCount: analysesCount || 1
        };
        await setDoc(docRef, currentProg);
      }

      // Sync active inputs
      if (analysesCount !== currentProg.photosAnalyzedCount) {
        currentProg.photosAnalyzedCount = analysesCount;
        currentProg.mealsLoggedCount = analysesCount;
        await updateDoc(docRef, { 
          photosAnalyzedCount: analysesCount,
          mealsLoggedCount: analysesCount 
        });
      }

      setProgress(currentProg);
      buildAchievementsList(currentProg);

    } catch (e) {
      console.warn("Progress query exception; fallback local variables:", e);
      let cached = localStorage.getItem(`colonia_progress_${user.uid}`);
      let currentProg: UserProgress;

      if (cached) {
        currentProg = JSON.parse(cached);
      } else {
        currentProg = {
          userId: user.uid,
          streakDays: 3,
          lastLogDate: new Date().toISOString(),
          mealsLoggedCount: analysesCount || 2,
          recipesLoggedCount: 1,
          photosAnalyzedCount: analysesCount || 2
        };
        localStorage.setItem(`colonia_progress_${user.uid}`, JSON.stringify(currentProg));
      }
      setProgress(currentProg);
      buildAchievementsList(currentProg);
    } finally {
      setLoading(false);
    }
  };

  const buildAchievementsList = (prog: UserProgress) => {
    const list: Achievement[] = [
      {
        id: "ach_first_photo",
        userId: user.uid,
        title: "Microbiólogo Novato 📸",
        description: "Captura tu primera fotografía nutricional para identificar posibles irritantes gástricos.",
        icon: "Camera",
        progress: Math.min(1, prog.photosAnalyzedCount),
        target: 1,
        unlockedAt: prog.photosAnalyzedCount >= 1 ? new Date().toISOString() : undefined
      },
      {
        id: "ach_streak_3",
        userId: user.uid,
        title: "Intestino de Hierro 🔥",
        description: "Mantén una racha impecable de registro de hábitos de 3 días consecutivos.",
        icon: "Flame",
        progress: Math.min(3, prog.streakDays),
        target: 3,
        unlockedAt: prog.streakDays >= 3 ? new Date().toISOString() : undefined
      },
      {
        id: "ach_scans_5",
        userId: user.uid,
        title: "Coleccionista Clínico 🧪",
        description: "Analiza al menos 5 porciones de alimento para cruzar patrones gastrointestinales.",
        icon: "Trophy",
        progress: Math.min(5, prog.photosAnalyzedCount),
        target: 5,
        unlockedAt: prog.photosAnalyzedCount >= 5 ? new Date().toISOString() : undefined
      },
      {
        id: "ach_recipes",
        userId: user.uid,
        title: "Cocinero Gástrico 🍳",
        description: "Elabora o guarda tu primera receta con bajo contenido de FODMAPs y jengibre.",
        icon: "Star",
        progress: Math.min(1, prog.recipesLoggedCount + 1), // Emulamos inicio con las porciones base
        target: 1,
        unlockedAt: new Date().toISOString()
      }
    ];
    setAchievements(list);
  };

  const handleClaimStreakPoint = async () => {
    if (!progress) return;
    try {
      const nextStreak = progress.streakDays + 1;
      const updated = { ...progress, streakDays: nextStreak, lastLogDate: new Date().toISOString() };
      setProgress(updated);
      buildAchievementsList(updated);

      localStorage.setItem(`colonia_progress_${user.uid}`, JSON.stringify(updated));
      await updateDoc(doc(db, "user_progress", user.uid), { 
        streakDays: nextStreak,
        lastLogDate: new Date().toISOString()
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="achievements-page-main">
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onViewChange("dashboard")}
          className="p-1 px-3 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 transition-colors"
          id="ach-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-xs font-mono font-bold text-slate-500">Logros y Gamificación</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500 animate-bounce" />
            <span>Sistema de Logros y Desafíos</span>
          </h2>
          <p className="text-sm text-slate-500">
            Mantente motivado en tu tratamiento digestivo reclamando insignias por tus buenos hábitos de nutrición.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Sincronizando tus medallas estomacales...</p>
        </div>
      ) : progress && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Streak status box */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Racha Card */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-rose-600 p-6 text-white text-center space-y-4 shadow-lg shadow-orange-100">
              <div className="relative inline-block">
                <Flame className="h-16 w-16 mx-auto text-amber-300 animate-pulse" />
                <span className="absolute bottom-0 right-1 bg-white text-amber-600 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold leading-none shadow shadow-amber-900/10 border-2 border-amber-500">
                  ⚡
                </span>
              </div>
              
              <div>
                <p className="text-xs uppercase tracking-widest text-orange-105 font-bold text-amber-100">Racha Alimenticia Actual</p>
                <h3 className="text-4xl font-black mt-1">{progress.streakDays} Días</h3>
                <p className="text-xs text-orange-50 font-medium opacity-80 mt-1.5">Has mantenido tus defensas de colon activas cuidando irritantes.</p>
              </div>

              <button
                onClick={handleClaimStreakPoint}
                className="w-full py-2.5 bg-white text-rose-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-sm"
                id="claim-streak-btn"
              >
                ¡Reclamar Racha del Día!
              </button>
            </div>

            {/* Quick stats logs */}
            <div className="rounded-2xl border border-slate-105 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5">Estadísticas Clínicas</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-medium text-slate-650">
                  <span className="text-slate-505 text-slate-500">Escaneos fotografiados</span>
                  <span className="font-mono font-bold text-slate-800">{progress.photosAnalyzedCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-650">
                  <span className="text-slate-505 text-slate-500">Comidas seguras analizadas</span>
                  <span className="font-mono font-bold text-slate-800">{progress.mealsLoggedCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-650">
                  <span className="text-slate-505 text-slate-500">Recetas con jengibre</span>
                  <span className="font-mono font-bold text-slate-800">1</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Achievements grid panels */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
              
              {/* Progress counter */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tus Medallas del Desafío</h3>
                  <p className="text-xs text-slate-400">Has desbloqueado {unlockedCount} de {achievements.length} insignias.</p>
                </div>

                <span className="text-xs font-bold bg-amber-50 border border-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>Nivel 2 Practitioner</span>
                </span>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((ach) => {
                  const percent = Math.round((ach.progress / ach.target) * 100);
                  const isUnlocked = !!ach.unlockedAt;

                  return (
                    <div 
                      key={ach.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isUnlocked 
                          ? "bg-slate-50/50 border-emerald-200 shadow-sm" 
                          : "bg-white border-slate-100 opacity-80"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className={`h-10 w-10 text-xl rounded-xl flex items-center justify-center ${
                            isUnlocked ? "bg-emerald-100" : "bg-slate-100 text-slate-450"
                          }`}>
                            {ach.icon === "Flame" ? "🔥" : ach.icon === "Trophy" ? "🏆" : ach.icon === "Star" ? "🌟" : "📸"}
                          </div>

                          {isUnlocked ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 border border-emerald-100">
                              <CheckCircle className="h-3 w-3" />
                              <span>Liberado</span>
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 border border-slate-150">
                              <Lock className="h-2.5 w-2.5" />
                              <span>Bloqueado</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{ach.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-normal mt-1">{ach.description}</p>
                        </div>
                      </div>

                      {/* Progress bar inside card */}
                      <div className="space-y-1 mt-4">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>Progreso</span>
                          <span>{ach.progress} / {ach.target} ({percent}%)</span>
                        </div>
                        <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isUnlocked ? "bg-emerald-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
