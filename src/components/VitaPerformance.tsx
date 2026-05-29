import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  ArrowLeft, Dumbbell, Award, Flame, Zap, Heart, Brain, Moon, Info,
  LineChart, Sparkles, Plus, Check, Trophy, Trash2, Loader2, Calendar,
  TrendingUp, Compass, Smile, Activity, RefreshCw, BarChart2, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, limit, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

interface VitaPerformanceProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

// Sub-tabs in Performance
type PerfTab = "dashboard" | "planner" | "logs" | "charts";

export default function VitaPerformance({ user, onViewChange }: VitaPerformanceProps) {
  const isPremium = user.subscriptionStatus === "premium";
  const [activeTab, setActiveTab] = useState<PerfTab>("dashboard");
  const [loading, setLoading] = useState(false);

  // States for DB synced arrays
  const [trainingPlans, setTrainingPlans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [recoveryLogs, setRecoveryLogs] = useState<any[]>([]);
  const [wellnessLogs, setWellnessLogs] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);

  // Action status messages
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Plan Generator inputs
  const [age, setAge] = useState<number>(user.age || 28);
  const [weight, setWeight] = useState<number>(user.weight || 72);
  const [height, setHeight] = useState<number>(user.height || 175);
  const [gender, setGender] = useState<string>("Otro");
  const [physicalLevel, setPhysicalLevel] = useState<string>("Intermedio");
  const [sport, setSport] = useState<string>("Fitness general");
  const [objective, setObjective] = useState<string>("Bajar peso");
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [generatedRoutineResult, setGeneratedRoutineResult] = useState<any | null>(null);

  // Form Log Workout
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().substring(0, 10));
  const [workoutDuration, setWorkoutDuration] = useState<number>(45);
  const [workoutCalories, setWorkoutCalories] = useState<number>(350);
  const [workoutExercises, setWorkoutExercises] = useState("");
  const [workoutEffort, setWorkoutEffort] = useState<"Excelente" | "Bueno" | "Regular" | "Fatigado">("Excelente");
  const [savingSession, setSavingSession] = useState(false);

  // Form Log Sleep/Recovery
  const [recoveryDate, setRecoveryDate] = useState(new Date().toISOString().substring(0, 10));
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<"Excelente" | "Bueno" | "Regular" | "Pobre">("Excelente");
  const [fatigueLevel, setFatigueLevel] = useState<number>(3); // 1-10
  const [muscleSoreness, setMuscleSoreness] = useState<"Ninguno" | "Leve" | "Moderado" | "Severo">("Leve");
  const [savingRecovery, setSavingRecovery] = useState(false);

  // Form Log Mind Performance
  const [wellnessDate, setWellnessDate] = useState(new Date().toISOString().substring(0, 10));
  const [emotionText, setEmotionText] = useState("");
  const [stressLevel, setStressLevel] = useState<number>(3); // 1-10
  const [motivationLevel, setMotivationLevel] = useState<number>(8); // 1-10
  const [moodLevel, setMoodLevel] = useState<number>(8); // 1-10
  const [savingWellness, setSavingWellness] = useState(false);

  // Form Log Body measurements
  const [measureDate, setMeasureDate] = useState(new Date().toISOString().substring(0, 10));
  const [bodyWeight, setBodyWeight] = useState<number>(user.weight || 72);
  const [bodyFat, setBodyFat] = useState<number>(18);
  const [chest, setChest] = useState<number>(95);
  const [waist, setWaist] = useState<number>(80);
  const [hip, setHip] = useState<number>(95);
  const [arms, setArms] = useState<number>(32);
  const [savingMeasurements, setSavingMeasurements] = useState(false);

  // Gamification & Challenges
  const [gamifiedPoints, setGamifiedPoints] = useState<number>(350);
  const [gamifiedLevel, setGamifiedLevel] = useState<number>(2);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(["Meta de hidratación"]);

  // VitaCoach AI recommendations block
  const [coachRecommendation, setCoachRecommendation] = useState<string>(
    "¡Tu balance metabólico luce excelente! Mantienes una hidratación estable. Notamos un aumento leve de estrés acumulado a inicios de semana; te sugerimos realizar una sesión de respiración profunda (mindfulness) y reducir la intensidad de pesas por 1 día."
  );
  const [generatingCoachAdvice, setGeneratingCoachAdvice] = useState(false);

  // Load all logs on startup
  useEffect(() => {
    loadAllPerformanceData();
  }, [user]);

  // Handle temporary notification msgs
  const showToast = (txt: string, isErr = false) => {
    if (isErr) {
      setErrorMsg(txt);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setInfoMsg(txt);
      setTimeout(() => setInfoMsg(""), 4000);
    }
  };

  const loadAllPerformanceData = async () => {
    setLoading(true);
    const userId = user.uid;

    try {
      // Pull Firestore or load fallback
      const routinesCache = localStorage.getItem(`vitaai_training_plans_${userId}`);
      const sessionsCache = localStorage.getItem(`vitaai_training_sessions_${userId}`);
      const measuresCache = localStorage.getItem(`vitaai_body_measurements_${userId}`);
      const recoveryCache = localStorage.getItem(`vitaai_recovery_logs_${userId}`);
      const wellnessCache = localStorage.getItem(`vitaai_wellness_logs_${userId}`);
      const scoreCache = localStorage.getItem(`vitaai_performance_scores_${userId}`);

      if (routinesCache) setTrainingPlans(JSON.parse(routinesCache));
      if (sessionsCache) setSessions(JSON.parse(sessionsCache));
      if (measuresCache) setMeasurements(JSON.parse(measuresCache));
      if (recoveryCache) setRecoveryLogs(JSON.parse(recoveryCache));
      if (wellnessCache) setWellnessLogs(JSON.parse(wellnessCache));
      if (scoreCache) setScores(JSON.parse(scoreCache));

      // Try pulling from firesore if connected
      const routinesSnap = await getDocs(query(collection(db, "training_plans"), where("userId", "==", userId)));
      const plansList: any[] = [];
      routinesSnap.forEach(d => plansList.push({ id: d.id, ...d.data() }));
      if (plansList.length > 0) {
        setTrainingPlans(plansList);
        localStorage.setItem(`vitaai_training_plans_${userId}`, JSON.stringify(plansList));
        // Select latest routine as current result
        const sorted = [...plansList].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setGeneratedRoutineResult(sorted[0]);
      }

      const sessionsSnap = await getDocs(query(collection(db, "training_sessions"), where("userId", "==", userId)));
      const sessionsList: any[] = [];
      sessionsSnap.forEach(d => sessionsList.push({ id: d.id, ...d.data() }));
      if (sessionsList.length > 0) {
         setSessions(sessionsList);
         localStorage.setItem(`vitaai_training_sessions_${userId}`, JSON.stringify(sessionsList));
      }

      const measuresSnap = await getDocs(query(collection(db, "body_measurements"), where("userId", "==", userId)));
      const measuresList: any[] = [];
      measuresSnap.forEach(d => measuresList.push({ id: d.id, ...d.data() }));
      if (measuresList.length > 0) {
         setMeasurements(measuresList);
         localStorage.setItem(`vitaai_body_measurements_${userId}`, JSON.stringify(measuresList));
      }

      const recoverySnap = await getDocs(query(collection(db, "recovery_logs"), where("userId", "==", userId)));
      const recoveryList: any[] = [];
      recoverySnap.forEach(d => recoveryList.push({ id: d.id, ...d.data() }));
      if (recoveryList.length > 0) {
         setRecoveryLogs(recoveryList);
         localStorage.setItem(`vitaai_recovery_logs_${userId}`, JSON.stringify(recoveryList));
      }

      const wellnessSnap = await getDocs(query(collection(db, "mental_wellness_logs"), where("userId", "==", userId)));
      const wellnessList: any[] = [];
      wellnessSnap.forEach(d => wellnessList.push({ id: d.id, ...d.data() }));
      if (wellnessList.length > 0) {
         setWellnessLogs(wellnessList);
         localStorage.setItem(`vitaai_wellness_logs_${userId}`, JSON.stringify(wellnessList));
      }

      const scoresSnap = await getDocs(query(collection(db, "performance_scores"), where("userId", "==", userId)));
      const scoresList: any[] = [];
      scoresSnap.forEach(d => scoresList.push({ id: d.id, ...d.data() }));
      if (scoresList.length > 0) {
         setScores(scoresList);
         localStorage.setItem(`vitaai_performance_scores_${userId}`, JSON.stringify(scoresList));
      }

    } catch (err) {
      console.warn("Error pulling performance modules firestore data, using local state caches:", err);
    } finally {
      setLoading(false);
    }
  };

  // SCORE CALCULATIONS (0 to 100)
  const currentRecoveryScore = () => {
    if (recoveryLogs.length === 0) return 82; // Default baseline
    // Sort reverse to get latest
    const sorted = [...recoveryLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    
    // Formula weight
    let sleepPoints = latest.sleepHours * 10; // 8 hours * 10 = 80 pts
    if (sleepPoints > 100) sleepPoints = 100;
    
    let fatiguePenalty = latest.fatigueLevel * 4; // 10 fatigue = -40 pts
    let sorePenalty = latest.muscleSoreness === "Severo" ? 30 : latest.muscleSoreness === "Moderado" ? 18 : latest.muscleSoreness === "Leve" ? 6 : 0;
    
    const score = Math.round(sleepPoints - fatiguePenalty - sorePenalty);
    return Math.max(0, Math.min(100, score));
  };

  const getLatestWellness = () => {
    if (wellnessLogs.length === 0) return { mood: 8, motivation: 8, stress: 3 };
    const sorted = [...wellnessLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const l = sorted[0];
    return { mood: l.moodLevel, motivation: l.motivationLevel, stress: l.stressLevel };
  };

  const currentVitaScore = () => {
    // Balanced metrics calculation based on rest, mental, exercises, active challenges
    const recovery = currentRecoveryScore();
    const well = getLatestWellness();
    
    const mentalIndex = (well.mood * 10 + well.motivation * 10 - well.stress * 6) / 2; // ~70-100 average
    const sessionsDoneContribution = Math.min(30, sessions.length * 8); // +8 pts per training up to 30
    const challengesContribution = completedChallenges.length * 6; // up to 30

    const score = Math.round((recovery * 0.4) + (mentalIndex * 0.3) + sessionsDoneContribution + challengesContribution);
    return Math.max(0, Math.min(100, score));
  };

  // CHALLENGES PROGRESS CHECKBOXES
  const toggleChallenge = (id: string) => {
    let updated;
    if (completedChallenges.includes(id)) {
      updated = completedChallenges.filter(c => c !== id);
      setGamifiedPoints(prev => Math.max(0, prev - 50));
    } else {
      updated = [...completedChallenges, id];
      setGamifiedPoints(prev => prev + 50);
      showToast("¡Reto superado! +50 Puntos de Bienestar");
    }
    setCompletedChallenges(updated);

    // Dynamic level calculation
    const totalPoints = gamifiedPoints + (completedChallenges.includes(id) ? -50 : 50);
    const calculatedLevel = Math.max(1, Math.floor(totalPoints / 250) + 1);
    setGamifiedLevel(calculatedLevel);
  };

  // DYNAMIC REFRESH OF COACH RECOMMENDATION
  const handleGenerateCoachAdvice = async () => {
    setGeneratingCoachAdvice(true);
    try {
      // Pack historical contexts to give Gemini full view
      const bodyContext = measurements.length > 0 ? measurements[0] : { weight, height };
      const weekTrainingsCount = sessions.filter(s => {
        const diff = new Date().getTime() - new Date(s.date).getTime();
        return diff < (7 * 24 * 60 * 60 * 1000);
      }).length;

      const latestRecovery = recoveryLogs.length > 0 ? recoveryLogs[0] : null;
      const latestMental = wellnessLogs.length > 0 ? wellnessLogs[0] : null;

      const promptPayload = {
        athleteGoal: objective,
        sportType: sport,
        userAge: age,
        userWeight: bodyContext.weight || weight,
        userHeight: bodyContext.height || height,
        trainingsThisWeek: weekTrainingsCount,
        recoveryDetails: latestRecovery ? `Sueño: ${latestRecovery.sleepHours}h, Fatiga: ${latestRecovery.fatigueLevel}/10, Dolor: ${latestRecovery.muscleSoreness}` : "Regular",
        mentalState: latestMental ? `Estrés: ${latestMental.stressLevel}/10, Motivación: ${latestMental.motivationLevel}/10, Estado Emocional: ${latestMental.emotionText || "Bien"}` : "Equilibrado",
        vitaScore: currentVitaScore(),
        recoveryScore: currentRecoveryScore()
      };

      const res = await fetch("/api/generate-coach-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptPayload)
      });

      const data = await res.json();
      if (data.success && data.advice) {
        setCoachRecommendation(data.advice);
        showToast("VitaCoach analizó tu rendimiento con éxito.");
      } else {
        throw new Error("Respuesta de coaching vaga o vacía");
      }
    } catch (err: any) {
      console.warn("Fallback dynamic coaching:", err);
      setCoachRecommendation(
        `### Reporte de Coaching IA ⚡\n\nCon un **VitaScore de ${currentVitaScore()}** y tu meta de **${objective}** enfocada en **${sport}**, te aconsejamos:\n- **Entrenamiento**: Mantener ${sessions.length > 0 ? "la continuidad, tu esfuerzo hoy fue notable" : "un ritmo suave de 20 minutos hoy"}.\n- **Sueño y Recuperación**: Tus últimos datos reflejan desgaste muscular acumulado. Incorpora estiramientos de cadera y descansa un mínimo de 7.5 horas para propiciar la síntesis de glucógeno.\n- **Sugerencia Mental**: Tu nivel de estrés aconseja pausar cargas pesadas de entrenamiento hoy.`
      );
    } finally {
      setGeneratingCoachAdvice(false);
    }
  };

  // IA ROUTINE GENERATOR
  const handleGenerateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingRoutine(false);
    setGeneratingRoutine(true);
    setGeneratedRoutineResult(null);

    const specs = {
      userId: user.uid,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      gender,
      physicalLevel,
      sport,
      objective,
      timeframe,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch("/api/generate-fitness-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specs)
      });

      const data = await response.json();
      if (data.success && data.routine) {
        // Build document to save to DB / state
        const completePlan: any = {
          ...specs,
          routine: data.routine
        };

        // Try adding to Firestore
        try {
          const docRef = await addDoc(collection(db, "training_plans"), completePlan);
          completePlan.id = docRef.id;
        } catch (dbErr) {
          console.warn("Could not save fitness plan doc to remote firebase, saving locally:", dbErr);
          completePlan.id = Math.random().toString(36).substring(7);
        }

        const updated = [completePlan, ...trainingPlans];
        setTrainingPlans(updated);
        setGeneratedRoutineResult(completePlan);
        localStorage.setItem(`vitaai_training_plans_${user.uid}`, JSON.stringify(updated));
        showToast("¡Rutina deportiva personalizada generada con Gemini!");
      } else {
        throw new Error(data.error || "No se pudo interpretar el formato de entrenamiento de la IA");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback local generated mock routine tailored beautifully to selected sport & objective
      const fallbackPlan = {
        id: "mock_routine_" + Date.now(),
        ...specs,
        routine: getLocalMockRoutine(objective, sport, physicalLevel)
      };
      
      const updated = [fallbackPlan, ...trainingPlans];
      setTrainingPlans(updated);
      setGeneratedRoutineResult(fallbackPlan);
      localStorage.setItem(`vitaai_training_plans_${user.uid}`, JSON.stringify(updated));
      showToast("Fórmula deportiva de emergencia cargada localmente.", true);
    } finally {
      setGeneratingRoutine(false);
    }
  };

  // LOG SAVE METHODS
  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutExercises.trim()) return;
    setSavingSession(true);

    const newSession = {
      userId: user.uid,
      date: workoutDate,
      duration: Number(workoutDuration),
      calories: Number(workoutCalories),
      exercises: workoutExercises.trim(),
      feeling: workoutEffort,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "training_sessions"), newSession);
      const sessionWithId = { id: docRef.id, ...newSession };
      const updated = [sessionWithId, ...sessions];
      setSessions(updated);
      localStorage.setItem(`vitaai_training_sessions_${user.uid}`, JSON.stringify(updated));
      showToast("Sesión de entrenamiento guardada correctamente ✨");
      setWorkoutExercises("");
      // Add points for logging effort
      setGamifiedPoints(p => p + 30);
    } catch (err) {
      const fallbackId = "ses_" + Math.random().toString(36).substring(7);
      const updated = [{ id: fallbackId, ...newSession }, ...sessions];
      setSessions(updated);
      localStorage.setItem(`vitaai_training_sessions_${user.uid}`, JSON.stringify(updated));
      showToast("Entrenamiento guardado en la memoria local (offline)");
      setWorkoutExercises("");
      setGamifiedPoints(p => p + 30);
    } finally {
      setSavingSession(false);
    }
  };

  const handleSaveRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRecovery(true);

    const newRec = {
      userId: user.uid,
      date: recoveryDate,
      sleepHours: Number(sleepHours),
      sleepQuality,
      fatigueLevel: Number(fatigueLevel),
      muscleSoreness,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "recovery_logs"), newRec);
      const recWithId = { id: docRef.id, ...newRec };
      const updated = [recWithId, ...recoveryLogs];
      setRecoveryLogs(updated);
      localStorage.setItem(`vitaai_recovery_logs_${user.uid}`, JSON.stringify(updated));
      showToast("Registro de descanso consolidado 🛌");
      setGamifiedPoints(p => p + 15);
    } catch (err) {
      const fallbackId = "rec_" + Math.random().toString(36).substring(7);
      const updated = [{ id: fallbackId, ...newRec }, ...recoveryLogs];
      setRecoveryLogs(updated);
      localStorage.setItem(`vitaai_recovery_logs_${user.uid}`, JSON.stringify(updated));
      showToast("Registro de descanso consolidado localmente");
      setGamifiedPoints(p => p + 15);
    } finally {
      setSavingRecovery(false);
    }
  };

  const handleSaveWellness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWellness(true);

    const newWell = {
      userId: user.uid,
      date: wellnessDate,
      emotionText: emotionText.trim() || "Neutro",
      stressLevel: Number(stressLevel),
      motivationLevel: Number(motivationLevel),
      moodLevel: Number(moodLevel),
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "mental_wellness_logs"), newWell);
      const wellWithId = { id: docRef.id, ...newWell };
      const updated = [wellWithId, ...wellnessLogs];
      setWellnessLogs(updated);
      localStorage.setItem(`vitaai_wellness_logs_${user.uid}`, JSON.stringify(updated));
      showToast("Reporte mental Mind Performance analizado 🧘");
      setEmotionText("");
      setGamifiedPoints(p => p + 20);
    } catch (err) {
      const fallbackId = "wel_" + Math.random().toString(36).substring(7);
      const updated = [{ id: fallbackId, ...newWell }, ...wellnessLogs];
      setWellnessLogs(updated);
      localStorage.setItem(`vitaai_wellness_logs_${user.uid}`, JSON.stringify(updated));
      showToast("Métricas Mind Performance guardadas correctamente");
      setEmotionText("");
      setGamifiedPoints(p => p + 20);
    } finally {
      setSavingWellness(false);
    }
  };

  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMeasurements(true);
    
    // Formula for IMC = weight / (height/100)^2
    const heightInMeters = height / 100;
    const calculatedImc = Number((bodyWeight / (heightInMeters * heightInMeters)).toFixed(1));

    const newMeasure = {
      userId: user.uid,
      date: measureDate,
      weight: Number(bodyWeight),
      imc: calculatedImc,
      bodyFat: Number(bodyFat),
      chest: Number(chest),
      waist: Number(waist),
      hip: Number(hip),
      arms: Number(arms),
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "body_measurements"), newMeasure);
      const measureWithId = { id: docRef.id, ...newMeasure };
      const updated = [measureWithId, ...measurements];
      setMeasurements(updated);
      localStorage.setItem(`vitaai_body_measurements_${user.uid}`, JSON.stringify(updated));
      showToast("Mediciones antropométricas actualizadas con éxito 📏");
      setGamifiedPoints(p => p + 25);
    } catch (err) {
      const fallbackId = "mea_" + Math.random().toString(36).substring(7);
      const updated = [{ id: fallbackId, ...newMeasure }, ...measurements];
      setMeasurements(updated);
      localStorage.setItem(`vitaai_body_measurements_${user.uid}`, JSON.stringify(updated));
      showToast("Ficha antropométrica actualizada de forma local (offline)");
      setGamifiedPoints(p => p + 25);
    } finally {
      setSavingMeasurements(false);
    }
  };

  // CLEAN CORES LOGS
  const handleDeleteItem = async (colName: string, id: string) => {
    try {
      if (colName === "sessions") {
        setSessions(prev => prev.filter(s => s.id !== id));
        localStorage.setItem(`vitaai_training_sessions_${user.uid}`, JSON.stringify(sessions.filter(s => s.id !== id)));
      } else if (colName === "measurements") {
        setMeasurements(prev => prev.filter(m => m.id !== id));
        localStorage.setItem(`vitaai_body_measurements_${user.uid}`, JSON.stringify(measurements.filter(m => m.id !== id)));
      } else if (colName === "recovery") {
        setRecoveryLogs(prev => prev.filter(r => r.id !== id));
        localStorage.setItem(`vitaai_recovery_logs_${user.uid}`, JSON.stringify(recoveryLogs.filter(r => r.id !== id)));
      } else if (colName === "wellness") {
        setWellnessLogs(prev => prev.filter(w => w.id !== id));
        localStorage.setItem(`vitaai_wellness_logs_${user.uid}`, JSON.stringify(wellnessLogs.filter(w => w.id !== id)));
      }
      await deleteDoc(doc(db, colName, id));
      showToast("Registro eliminado.");
    } catch (e) {
      showToast("Registro removido del historial local.");
    }
  };

  // LOCAL GENERATION OF ROUTINES AS PREDICTABLE FALLBACKS
  const getLocalMockRoutine = (goal: string, sportSelected: string, lvl: string) => {
    const isAdv = lvl === "Avanzado" ? "Fuerza extrema e hipertrofia" : lvl === "Intermedio" ? "Progresivo controlado" : "Tono muscular adaptativo básico";
    return {
      title: `Plan Deportivo VitaAI: ${sportSelected} para ${goal}`,
      timeframe: timeframe === "daily" ? "Sesión Básica" : timeframe === "weekly" ? "Microciclo de 7 Días" : "Mesociclo de 30 Días",
      description: `Plan adaptado para atleta nivel ${lvl} practicante de ${sportSelected}. Optimiza las vías energéticas respiratorias evitando irritaciones digestivas secundarias inducidas por sobreesfuerzo agudo.`,
      sessions: [
        {
          name: "Día 1: Activación de Potencia Muscular y Estabilidad",
          exercises: [
            { exercise: "Sentadillas libres dinámicas", series: 3, repetitions: 12, time: "N/A", rest: "60s" },
            { exercise: "Flexiones de pecho o Lagartijas", series: 3, repetitions: lvl === "Avanzado" ? 20 : 10, time: "N/A", rest: "45s" },
            { exercise: isAdv, series: 4, repetitions: 12, time: "N/A", rest: "60s" },
            { exercise: `Zancadas o lunges específicos de ${sportSelected}`, series: 3, repetitions: 12, time: "N/A", rest: "60s" },
            { exercise: "Plancha frontal isométrica abdominal", series: 3, repetitions: 0, time: "45s", rest: "45s" }
          ]
        },
        {
          name: "Día 2: Capacidad Aeróbica y Recuperación Activa",
          exercises: [
            { exercise: "Movilidad articular controlada de tobillo y cadera", series: 1, repetitions: 10, time: "5 min", rest: "30s" },
            { exercise: `Entrenamiento simulado o trote suave para ${sportSelected}`, series: 1, repetitions: 1, time: "30 min", rest: "90s" },
            { exercise: "Estiramientos focalizados de isquiotibiales", series: 2, repetitions: 0, time: "45s", rest: "30s" }
          ]
        }
      ]
    };
  };

  // CHECK USER PREMIUM RIGHTS
  if (!isPremium) {
    return (
      <div className="space-y-8 animate-fade-in" id="performance-locked-view">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold py-0.5 px-3 rounded-full uppercase tracking-widest border border-emerald-200 inline-block">Módulo de Rendimiento Físico</span>
          <h2 className="text-3xl font-extrabold text-slate-800">VitaPerformance AI</h2>
          <p className="text-xs text-slate-500 leading-normal">
            Potencia tu entrenamiento cotidiano, monitorea tu descanso y alinea tu bienestar mental con el asistente definitivo de rendimiento deportivo de VitaAI.
          </p>
        </div>

        {/* Promo grid */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm max-w-2xl mx-auto text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
            <Zap className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-3">
            <span className="text-[11px] bg-amber-100 text-amber-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">🔒 Función de Miembros VitaAI Plus</span>
            <h3 className="text-xl font-bold text-slate-800">Planificador Deportivo y Entrenador IA Personalizado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              La Inteligencia Artificial de Gemini evalúa tu edad, nivel, peso y deporte preferido para forjar rutinas exactas (series, reps, tiempo de descanso). Además, correlaciona tus niveles de descanso, hidratación y estrés diario para darte la pauta exacta de recuperación.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left pt-2">
            {[
              "Creación de rutinas adaptadas por IA",
              "Evaluación con Recovery Score",
              "Correlación mental Mind Performance",
              "Logros y retos gamificados",
              "Historial antropométrico con IMC",
              "13 Tipos de Deporte y Disciplinas"
            ].map((f, i) => (
              <div key={i} className="flex items-center space-x-1.5 text-xs text-slate-600">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="font-medium">{f}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => onViewChange("premium")}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-extrabold text-white rounded-xl shadow-md transition-all uppercase tracking-widest"
            >
              Obtener VitaAI Plus ✨
            </button>
            <p className="text-[10px] text-slate-400">
              Desbloquea el acceso ilimitado a todas nuestras herramientas analíticas de estilo de vida saludable por solo $7.99/mes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="vitaperformance-viewport">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] bg-teal-50 text-teal-700 font-extrabold py-0.5 px-3 rounded-full uppercase tracking-wider border border-teal-200 inline-block">Módulo de Élite Deportivo</span>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-teal-600" />
            <span>VitaPerformance AI</span>
          </h2>
          <p className="text-xs text-slate-400">
            Optimiza tus entrenamientos, haz seguimiento de tus medidas y equilibra tu bienestar con Inteligencia Artificial.
          </p>
        </div>

        {/* Quick info score pill */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center space-x-3 shadow-xs">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">VitaScore</p>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-lg font-black text-slate-800">{currentVitaScore()}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center space-x-3 shadow-xs">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Recovery</p>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-lg font-black text-slate-800">{currentRecoveryScore()}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Sub Navigation tabs */}
      <div className="flex border-b border-style-200 overflow-x-auto space-x-1.5 p-1 bg-slate-100 rounded-xl max-w-md">
        {[
          { id: "dashboard", label: "Dashboard & Retos", icon: Trophy },
          { id: "planner", label: "IA Planificador", icon: Sparkles },
          { id: "logs", label: "Registros Diarios", icon: Calendar },
          { id: "charts", label: "Estadísticas", icon: TrendingUp }
        ].map((t) => {
          const IconComp = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PerfTab)}
              className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                active 
                  ? "bg-white text-teal-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <IconComp className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast notifications */}
      <AnimatePresence>
        {infoMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl"
          >
            {infoMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER ACTIVE SCREEN CONTROLLER */}
      <div className="min-h-[50vh]">
        
        {/* TAB 1: DASHBOARD & GAMIFICATION */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in" id="perf-tab-dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* VitaCoach Coach Summary */}
              <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-55 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">VitaCoach Performance ⚡</h4>
                      <p className="text-[10px] text-slate-400">Recomendaciones personalizadas del entrenador IA</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateCoachAdvice}
                    disabled={generatingCoachAdvice}
                    className="flex items-center space-x-1 text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 py-1.5 px-3 rounded-lg transition-all"
                  >
                    {generatingCoachAdvice ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 h-3 text-teal-600" />
                        <span>Re-calcular Reporte IA</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <p className="whitespace-pre-wrap">{coachRecommendation}</p>
                </div>
                
                <div className="text-[10px] text-slate-400 leading-tight flex items-start space-x-1.5 bg-amber-50/40 p-2.5 rounded-lg">
                  <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Análisis de Cargas</strong>: VitaCoach asimilará tus horas de sueño, nivel de fatiga muscular, variaciones de peso e ingestas alimenticias cada vez que los actualices para prevenir lesiones deportivas o fatiga extrema.</span>
                </div>
              </div>

              {/* Atleta Gamificación Status Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">Nivel de Atleta</h4>
                    <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase">Rendimiento</span>
                  </div>
                  
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm">
                      L{gamifiedLevel}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium leading-none">Puntos de Bienestar</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{gamifiedPoints} Pts</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Siguiente nivel: {gamifiedLevel * 250} pts</p>
                    </div>
                  </div>

                  {/* Level progress bar */}
                  <div className="mt-4 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, (gamifiedPoints / (gamifiedLevel * 250)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tus Insignias Colectadas:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center space-x-1 text-[10px] bg-slate-50 border border-slate-250 py-1 px-2.5 rounded-lg font-bold text-slate-650" title="Alcanzado al registrar un descanso excelente">
                      <Moon className="h-3 w-1.5 text-blue-500 shrink-0" />
                      <span>Récord de Sueño</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[10px] bg-slate-50 border border-slate-250 py-1 px-2.5 rounded-lg font-bold text-slate-650" title="Alcanzado al tomar agua todos los días">
                      <Flame className="h-3 w-1.5 text-rose-500 shrink-0" />
                      <span>Mente Indomable</span>
                    </span>
                    {gamifiedPoints >= 380 && (
                      <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-50 border border-emerald-150 py-1 px-2.5 rounded-lg font-bold text-emerald-800" title="Otorgado por acumular más de 380 puntos">
                        <Trophy className="h-3 w-1.5 text-amber-500 shrink-0" />
                        <span>Fuerza Vital</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Gamification Challenges Section */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span>Retos Activos de Estilo de Vida</span>
                </h3>
                <span className="text-[11px] text-slate-400">Completa actividades diarias para elevar tus niveles de Atleta</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { id: "7 dias activos", title: "7 días activos de Deporte", desc: "Registra entrenos regulares en el mes", points: "+50 Pts" },
                  { id: "30 dias entrenando", title: "30 días de bienestar", desc: "Hacer actividades saludables 30 veces", points: "+100 Pts" },
                  { id: "Meta de pasos", title: "Meta de Pasos Diaria", desc: "Completar 10,000 pasos hoy", points: "+50 Pts" },
                  { id: "Meta de hidratación", title: "Meta de Hidratación", desc: "Consumo de 2.5 litros de agua filtrada", points: "+50 Pts" },
                  { id: "Meta de sueño", title: "Meta de Sueño", desc: "Dormir más de 7.5 horas de calidad", points: "+50 Pts" }
                ].map((ch) => {
                  const completed = completedChallenges.includes(ch.id);
                  return (
                    <div 
                      key={ch.id} 
                      onClick={() => toggleChallenge(ch.id)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all text-left flex flex-col justify-between space-y-3 ${
                        completed 
                          ? "bg-emerald-50/30 border-emerald-200 shadow-inner" 
                          : "bg-white border-slate-105 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md ${completed ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                          {ch.points}
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${completed ? "bg-emerald-500 border-none text-white" : "border-slate-300"}`}>
                          {completed && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs font-bold leading-snug ${completed ? "text-emerald-900 line-through" : "text-slate-800"}`}>
                          {ch.title}
                        </p>
                        <p className="text-[10px] text-slate-450 leading-tight mt-1">{ch.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI ROUTINE GENERATOR */}
        {activeTab === "planner" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" id="perf-tab-planner">
            
            {/* Inputs Panel */}
            <form onSubmit={handleGenerateRoutine} className="lg:col-span-1 border border-slate-100 bg-white rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Planificador Deportivo inteligente</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Edad (años)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2"
                    min="14"
                    max="90"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Género u Horario</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro / Prefiero omitir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Peso (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2"
                    min="35"
                    max="180"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Altura (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2"
                    min="100"
                    max="220"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Tu Disciplina / Deporte Favorito</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-medium text-slate-700"
                >
                  {[
                    "Running", "Ciclismo", "Natación", "CrossFit", "Fútbol", "Basquetbol", 
                    "Tenis", "Artes Marciales", "Fitness General", "Hipertrofia", "Pérdida de Peso"
                  ].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Objetivo Físico & Estilo de Vida</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 font-medium"
                >
                  <option value="Bajar peso">Bajar peso</option>
                  <option value="Ganar masa muscular">Ganar masa muscular</option>
                  <option value="Mejorar resistencia">Mejorar resistencia</option>
                  <option value="Aliviar gastritis">Aliviar gastritis</option>
                  <option value="Controlar colon irritable">Controlar colon irritable</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Nivel de Condición</label>
                  <select
                    value={physicalLevel}
                    onChange={(e) => setPhysicalLevel(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado / Atleta Élite</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Frecuencia / Enfoque</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as "daily" | "weekly" | "monthly")}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white"
                  >
                    <option value="daily">Rutina Diaria (Focalizada)</option>
                    <option value="weekly">Rutina Semanal Completa</option>
                    <option value="monthly">Rutina Mensual (Mesociclo)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingRoutine}
                className="w-full mt-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 font-extrabold text-xs text-white py-3 transition-all tracking-wider flex items-center justify-center space-x-2"
              >
                {generatingRoutine ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Calculando Rutina con Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-200" />
                    <span>Redactar Rutina Especializada ⚡</span>
                  </>
                )}
              </button>
            </form>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-4">
              {generatedRoutineResult ? (
                <div className="border border-slate-100 bg-white rounded-2xl p-6 shadow-xs space-y-6">
                  
                  {/* Header result */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[9px] bg-teal-50 text-teal-700 font-mono py-1 px-3.5 rounded-full uppercase border border-teal-200">
                        {generatedRoutineResult.sport} • {generatedRoutineResult.timeframe === "daily" ? "Sesión" : generatedRoutineResult.timeframe === "weekly" ? "Microciclo 7 días" : "Mesociclo 30 días"}
                      </span>
                      <h3 className="text-xl font-black text-slate-800 mt-2">{generatedRoutineResult.routine.title || "Plan de Entrenamiento VitaAI"}</h3>
                      <p className="text-xs text-slate-400 mt-1 italic">{generatedRoutineResult.routine.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 py-1 px-3 rounded-full font-bold">
                        Nivel {generatedRoutineResult.physicalLevel}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono mt-2">Creado: {new Date(generatedRoutineResult.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Sessions / Days exercises array */}
                  <div className="space-y-6">
                    {generatedRoutineResult.routine.sessions?.map((session: any, sIdx: number) => (
                      <div key={sIdx} className="space-y-3 bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-slate-755 border-b border-slate-200 pb-1.5 text-teal-800">
                          {session.name}
                        </h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-[11px] text-left text-slate-600">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-200 uppercase tracking-wider font-bold">
                                <th className="py-2">Ejercicio</th>
                                <th className="py-2">Series</th>
                                <th className="py-2">Reps</th>
                                <th className="py-2">Duración</th>
                                <th className="py-2">Descanso</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {session.exercises?.map((ex: any, eIdx: number) => (
                                <tr key={eIdx} className="hover:bg-white/40">
                                  <td className="py-2.5 font-bold text-slate-800">{ex.exercise}</td>
                                  <td className="py-2.5">{ex.series || "-"}</td>
                                  <td className="py-2.5">{ex.repetitions || "-"}</td>
                                  <td className="py-2.5">{ex.time || "-"}</td>
                                  <td className="py-2.5 font-mono text-slate-500">{ex.rest || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl leading-normal text-[10px] text-slate-400 flex items-start space-x-1.5">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Nota de Esfuerzo Seguro</strong>: Los entrenamientos previstos contemplan descansos controlados para evitar el agotamiento metabólico secundario. Si sientes dolor articular o mareo bajo esfuerzo extremo, suspende el ejercicio de inmediato.</span>
                  </div>

                </div>
              ) : (
                <div className="border border-slate-100 bg-white rounded-2xl p-12 shadow-xs text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Aún no has generado ninguna rutina activa</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Completa los filtros deportivos en la columna de la izquierda y haz clic en generar. Gemini analizará tus condiciones antropométricas para forjar un microciclo de soporte metabólico.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: REGISTRO HISTÓRICO DE LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-8 animate-fade-in" id="perf-tab-logs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form 1: Log Workout */}
              <form onSubmit={handleSaveWorkout} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
                  <Flame className="h-5 w-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Registrar Sesión de Deporte</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-bold text-slate-500">Fecha</label>
                    <input
                      type="date"
                      value={workoutDate}
                      onChange={(e) => setWorkoutDate(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Duración (min)</label>
                    <input
                      type="number"
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                      min="5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Gasto Calorías (Kcal)</label>
                    <input
                      type="number"
                      value={workoutCalories}
                      onChange={(e) => setWorkoutCalories(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                      min="10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Ejercicios realizados u observaciones</label>
                  <textarea
                    value={workoutExercises}
                    onChange={(e) => setWorkoutExercises(e.target.value)}
                    placeholder="Ej. Trote suave 5k, 4x10 Sentadillas, Crunches de abdomen."
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 h-16"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Sensación de esfuerzo / Fatiga muscular</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Excelente", "Bueno", "Regular", "Fatigado"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setWorkoutEffort(opt as any)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold tracking-tight border ${
                          workoutEffort === opt 
                            ? "bg-teal-50 text-teal-700 border-teal-300" 
                            : "bg-white text-slate-500 border-slate-205"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSession}
                  className="w-full bg-teal-600 hover:bg-teal-700 font-extrabold text-xs text-white py-2.5 rounded-xl transition-all"
                >
                  {savingSession ? "Guardando..." : "Consolidar Sesión de Entrenamiento (+30 Pts)"}
                </button>
              </form>

              {/* Form 2: Log Sleep & Recovery */}
              <form onSubmit={handleSaveRecovery} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
                  <Moon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Descanso & Recuperación (Dolor/Sueño)</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-bold text-slate-500">Fecha</label>
                    <input
                      type="date"
                      value={recoveryDate}
                      onChange={(e) => setRecoveryDate(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Horas de Sueño</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                      min="3"
                      max="18"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Calidad de Sueño</label>
                    <select
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(e.target.value as any)}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-white"
                    >
                      <option value="Excelente">Excelente / Reparador</option>
                      <option value="Bueno">Bueno / Despierto bien</option>
                      <option value="Regular">Regular / Ligera fatiga</option>
                      <option value="Pobre">Pobre / Interrumpido</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500">Estrés acumulado / Fatiga física</label>
                    <span className="text-[10px] font-bold text-rose-600 font-mono">Nivel {fatigueLevel} de 10</span>
                  </div>
                  <input
                    type="range"
                    value={fatigueLevel}
                    onChange={(e) => setFatigueLevel(Number(e.target.value))}
                    className="w-full"
                    min="1"
                    max="10"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                    <span>Sin Fatiga</span>
                    <span>Moderado</span>
                    <span>Extremo</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Dolor o sobrecarga muscular (DOMS)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Ninguno", "Leve", "Moderado", "Severo"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setMuscleSoreness(opt as any)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold tracking-tight border ${
                          muscleSoreness === opt 
                            ? "bg-blue-50 text-blue-700 border-blue-300" 
                            : "bg-white text-slate-500 border-slate-205"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingRecovery}
                  className="w-full bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white py-2.5 rounded-xl transition-all"
                >
                  {savingRecovery ? "Calculando..." : "Guardar Métricas de Descanso (Actualizar Score)"}
                </button>
              </form>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Form 3: Mind Performance & Emotional connection */}
              <form onSubmit={handleSaveWellness} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
                  <Smile className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Mind Performance (Bienestar Mental)</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500">¿Cómo te sientes emocionalmente hoy?</label>
                  <input
                    type="text"
                    value={emotionText}
                    onChange={(e) => setEmotionText(e.target.value)}
                    placeholder="Ej. Calmado, con mucha energía, o algo fatigado por el trabajo..."
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Motivación</span>
                      <span className="text-purple-600">{motivationLevel}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={motivationLevel}
                      onChange={(e) => setMotivationLevel(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Ánimo</span>
                      <span className="text-purple-600">{moodLevel}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodLevel}
                      onChange={(e) => setMoodLevel(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Estrés Laboral</span>
                      <span className="text-purple-600">{stressLevel}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={stressLevel}
                      onChange={(e) => setStressLevel(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-purple-50/50 p-2.5 rounded-xl">
                  💡 <strong>Correlación de Gemini</strong>: Te ayudaremos a identificar si tus bajas de motivación o altos niveles de estrés laboral se asocian con inflamación estomacal o baja en tu rendimiento físico.
                </div>

                <button
                  type="submit"
                  disabled={savingWellness}
                  className="w-full bg-purple-600 hover:bg-purple-700 font-extrabold text-xs text-white py-2.5 rounded-xl transition-all"
                >
                  {savingWellness ? "Guardando..." : "Consolidar Ficha Psicoemocional (+20 Pts)"}
                </button>
              </form>

              {/* Form 4: Physical Measures / Antropometría */}
              <form onSubmit={handleSaveMeasurements} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Antropometría & Mediciones Corporales</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Peso (kg)</label>
                    <input
                      type="number"
                      value={bodyWeight}
                      onChange={(e) => setBodyWeight(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">% Grasa Estimado</label>
                    <input
                      type="number"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Cintura (cm)</label>
                    <input
                      type="number"
                      value={waist}
                      onChange={(e) => setWaist(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Pecho (cm)</label>
                    <input
                      type="number"
                      value={chest}
                      onChange={(e) => setChest(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Caderas (cm)</label>
                    <input
                      type="number"
                      value={hip}
                      onChange={(e) => setHip(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Brazos (cm)</label>
                    <input
                      type="number"
                      value={arms}
                      onChange={(e) => setArms(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingMeasurements}
                  className="w-full bg-amber-600 hover:bg-amber-700 font-extrabold text-xs text-white py-2.5 rounded-xl transition-all"
                >
                  {savingMeasurements ? "Guardando..." : "Actualizar Ficha Antropométrica (Calcular IMC)"}
                </button>
              </form>

            </div>

            {/* List Panels of past exercises */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Histórico Reciente de Entrenamientos</h4>
              
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No has registrado entrenamientos todavía. Complétalo arriba para iniciar la gamificación.</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 text-xs text-slate-650 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                          <Flame className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{s.exercises}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Fecha: {s.date} • Duración: {s.duration} min • Gasto: {s.calories} Kcal • Esfuerzo: <strong className="text-teal-600">{s.feeling}</strong>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteItem("sessions", s.id)} 
                        className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STATISTICS & GRAPHS */}
        {activeTab === "charts" && (
          <div className="space-y-8 animate-fade-in" id="perf-tab-charts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Chart 1: Peso Corporal Progress */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Progreso de Peso Corporal (kg)</h4>
                  <p className="text-[10px] text-slate-400">Variaciones antropométricas de tu diario deportivo</p>
                </div>

                <div className="h-48 border-b border-l border-slate-100 relative mt-4 flex items-end justify-between px-4 pb-1">
                  {measurements.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">
                      Completa tus mediciones en la pestaña Registros para graficar
                    </div>
                  ) : (
                    <>
                      {/* Grid background lines */}
                      <div className="absolute left-0 right-0 top-1/3 border-t border-slate-100/50" />
                      <div className="absolute left-0 right-0 top-2/3 border-t border-slate-100/50" />
                      
                      {/* Plotting points */}
                      {[...measurements].reverse().slice(0, 8).map((m, idx, arr) => {
                        // Max min scale weight
                        const maxWeight = Math.max(...arr.map(item => item.weight)) + 5;
                        const minWeight = Math.max(0, Math.min(...arr.map(item => item.weight)) - 5);
                        const range = maxWeight - minWeight || 10;
                        const pct = ((m.weight - minWeight) / range) * 100;

                        return (
                          <div key={m.id || idx} className="flex flex-col items-center flex-1 group relative z-10">
                            {/* Hover tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-8 bg-slate-800 text-white rounded text-[10px] py-1 px-2 pointer-events-none text-center shadow-xs">
                              {m.weight} kg<br/><span className="text-[8px] text-slate-300">IMC {m.imc}</span>
                            </div>
                            
                            {/* Dot */}
                            <div 
                              className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm hover:scale-130 transition-transform cursor-pointer" 
                              style={{ marginBottom: `${Math.max(10, Math.min(90, pct))}%` }}
                            />
                            
                            {/* Date line label */}
                            <span className="text-[9px] text-slate-400 font-mono mt-2 origin-left truncate max-w-[45px]">
                              {m.date.substring(5)}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Chart 2: Wellness vs Performance Correlation */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Cohesión: Motivación vs Estrés Laboral</h4>
                  <p className="text-[10px] text-slate-400">Análisis Mind Performance de resiliencia celular</p>
                </div>

                <div className="h-48 border-b border-l border-slate-100 relative mt-4 flex items-end justify-around px-4 pb-1">
                  {wellnessLogs.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">
                      Registra tu Ficha Psicoemocional en la pestaña de Registros
                    </div>
                  ) : (
                    <>
                      {/* Grid background lines */}
                      <div className="absolute left-0 right-0 top-1/2 border-t border-slate-100/50" />
                      
                      {/* Plotting points */}
                      {[...wellnessLogs].reverse().slice(0, 6).map((log, idx) => {
                        // Stress percentage height
                        const stressHeight = log.stressLevel * 10; // Stress on 1-10 scale
                        const motHeight = log.motivationLevel * 10; // Motivation on 1-10 scale

                        return (
                          <div key={log.id || idx} className="flex flex-col items-center flex-1 relative group z-10 max-h-40">
                            {/* Tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-10 bg-slate-800 text-white rounded text-[9px] py-1 px-1.5 pointer-events-none shadow-xs text-center min-w-[100px]">
                              Motivación: {log.motivationLevel}/10<br/>
                              Estrés: {log.stressLevel}/10
                            </div>

                            {/* Dual bars */}
                            <div className="flex space-x-1 items-end h-[100px] w-full justify-center">
                              {/* Stress bar in purple */}
                              <div 
                                className="w-2.5 bg-purple-400 rounded-t-sm" 
                                style={{ height: `${stressHeight}%` }}
                              />
                              {/* Motivation bar in emerald */}
                              <div 
                                className="w-2.5 bg-emerald-400 rounded-t-sm" 
                                style={{ height: `${motHeight}%` }}
                              />
                            </div>

                            {/* Date line label */}
                            <span className="text-[9px] text-slate-400 font-mono mt-2">
                              {log.date.substring(5)}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center space-x-4 text-[9px] font-bold uppercase mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-xs" />
                    <span className="text-slate-500">Motivación</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-xs" />
                    <span className="text-slate-500">Estrés</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Antropometría measurements list */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Histórico de Ficha Antropométrica</h4>

              {measurements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No has registrado medidas corporales todavía.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-150 uppercase tracking-wider font-bold">
                        <th className="py-2.5">Fecha</th>
                        <th className="py-2.5">Peso (kg)</th>
                        <th className="py-2.5">IMC</th>
                        <th className="py-2.5">% Grasa</th>
                        <th className="py-2.5">Waist (Cintura)</th>
                        <th className="py-2.5">Pecho</th>
                        <th className="py-2.5">Caderas</th>
                        <th className="py-2.5">Brazos</th>
                        <th className="py-2.5 text-right">Aciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {measurements.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/55">
                          <td className="py-2.5 font-semibold text-slate-800">{m.date}</td>
                          <td className="py-2.5 font-bold">{m.weight} kg</td>
                          <td className="py-2.5">
                            <span className="bg-slate-100 text-slate-700 py-0.5 px-2 rounded-md font-mono font-bold">
                              {m.imc}
                            </span>
                          </td>
                          <td className="py-2.5">{m.bodyFat}%</td>
                          <td className="py-2.5">{m.waist} cm</td>
                          <td className="py-2.5">{m.chest} cm</td>
                          <td className="py-2.5">{m.hip} cm</td>
                          <td className="py-2.5">{m.arms} cm</td>
                          <td className="py-2.5 text-right">
                            <button 
                              onClick={() => handleDeleteItem("measurements", m.id)} 
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
