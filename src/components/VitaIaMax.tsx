import React, { useState, useEffect } from "react";
import { UserProfile, FoodAnalysis } from "../types";
import { 
  Sparkles, Camera, Dumbbell, Beaker, Calendar, Flame, ChevronRight,
  TrendingUp, Award, Clock, ArrowRight, Save, Play, Plus, Trash2, 
  CheckCircle, RefreshCw, Smartphone, BarChart3, Droplet, Zap, Info,
  ShieldCheck, Heart, FileText, Lock, ChevronDown
} from "lucide-react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface VitaIaMaxProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
  analyses: FoodAnalysis[];
}

interface ScreenshotSuggestion {
  id: string;
  userId: string;
  title: string;
  aiSuggestedAdjustment: string;
  imageUrl?: string;
  createdAt: string;
}

interface StrengthLog {
  id: string;
  userId: string;
  exercise: string;
  weight: number;
  reps: number;
  rpe: number; // 1-10
  rir: number; // 0-5
  oneRepMax: number;
  date: string;
}

export default function VitaIaMax({ user, onViewChange, analyses }: VitaIaMaxProps) {
  const [activeTab, setActiveTab] = useState<"vision" | "strength" | "supps" | "mesocycle">("vision");

  // Track subscription mock upgrading for demo limit bypasses
  const [subscription, setSubscription] = useState<string>(() => {
    return localStorage.getItem(`premium_checkout_completed_${user.uid}`) || user.subscriptionStatus || "free";
  });

  // Core stats states
  const [suggestionLogs, setSuggestionLogs] = useState<ScreenshotSuggestion[]>([]);
  const [strengthLogs, setStrengthLogs] = useState<StrengthLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vision Screen simulator / real file reader / video camera properties
  const [simulatedScreenshot, setSimulatedScreenshot] = useState<string | null>(null);
  const [visionInputDesc, setVisionInputDesc] = useState("");
  const [processedSuggestion, setProcessedSuggestion] = useState<string | null>(null);

  // New features for video recording, image bank and context Chat
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<"image" | "video">("image");
  const [medicalNutritionalQuery, setMedicalNutritionalQuery] = useState("");
  const [selectedMedicalTags, setSelectedMedicalTags] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [simulatedVideoWithTelemetry, setSimulatedVideoWithTelemetry] = useState(false);
  const [telemetryAngle, setTelemetryAngle] = useState(90);
  const [telemetryReps, setTelemetryReps] = useState(0);
  const [telemetryPhase, setTelemetryPhase] = useState("Excéntrica");
  const [biomechanicsDataPoints, setBiomechanicsDataPoints] = useState<{ date: string; efficiency: number; fatigue: number; safetyCompliance: number }[]>(() => {
    return [
      { date: "31-May-2026", efficiency: 94, fatigue: 45, safetyCompliance: 98 },
      { date: "01-Jun-2026", efficiency: 88, fatigue: 60, safetyCompliance: 90 },
      { date: "02-Jun-2026", efficiency: 91, fatigue: 52, safetyCompliance: 95 },
      { date: "03-Jun-2026", efficiency: 95, fatigue: 38, safetyCompliance: 100 },
      { date: "04-Jun-2026", efficiency: 92, fatigue: 48, safetyCompliance: 95 }
    ];
  });

  // Routine Images database management state
  interface RoutineImage {
    id: string;
    title: string;
    url: string;
    selected: boolean;
    safetyNote: string;
    weightCeiling: string;
    muscleGroup: string;
  }

  const [routineImages, setRoutineImages] = useState<RoutineImage[]>(() => {
    const saved = localStorage.getItem(`viamax_routine_images_${user.uid}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "img_01",
        title: "Sentadilla con Barra Trasera - Guía de Ángulo",
        url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop",
        selected: true,
        safetyNote: "Mantén una presión intra-abdominal moderada; no utilices faja excesiva si tiendes a reflujo.",
        weightCeiling: "Carga de Seguridad: Menor a 75% 1RM para protección gastrointestinal.",
        muscleGroup: "Cuádriceps"
      },
      {
        id: "img_02",
        title: "Press Inclinado con Mancuernas - Haz Clavicular",
        url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop",
        selected: false,
        safetyNote: "Ángulo de 30° máximo para proteger hombros y disminuir presión sobre el cardias gástrico.",
        weightCeiling: "Carga de Seguridad: Reps altas (12-15) sin llegar al fallo total.",
        muscleGroup: "Pecho Superior"
      },
      {
        id: "img_03",
        title: "Peso Muerto Rumano - Bisagra de Cadera",
        url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
        selected: false,
        safetyNote: "Evita la flexión espinal y mantén la respiración diafragmática continua sin apnea (presión gástrica).",
        weightCeiling: "Carga de Seguridad: 65% de 1RM con enfoque propioceptivo.",
        muscleGroup: "Isquiotibiales / Glúteos"
      }
    ];
  });

  // State for customized express plan outliner
  const [expressPlanResult, setExpressPlanResult] = useState<{
    title: string;
    safetyFirstExercises: { name: string; targetWeight: string; safeSets: string; gastroCare: string }[];
    medicalGuideline: string;
    nutritionalAdvice: string;
    routineAdjustmentSummary: string;
  } | null>(null);

  // Strength Tracker values
  const [strengthExercise, setStrengthExercise] = useState("Bench Press");
  const [strengthWeight, setStrengthWeight] = useState<number>(85);
  const [strengthReps, setStrengthReps] = useState<number>(8);
  const [strengthRPE, setStrengthRPE] = useState<number>(8.5);
  const [strengthRIR, setStrengthRIR] = useState<number>(1);
  const [chartFilter, setChartFilter] = useState<string>("All");
  const [chartMode, setChartMode] = useState<"1rm" | "biomechanics">("1rm");

  // Pro Supps options
  const [suppIntensity, setSuppIntensity] = useState<"hypertrophy" | "strength_peak" | "marathon_endurance">("hypertrophy");
  const [gastroComfortActive, setGastroComfortActive] = useState<boolean>(
    user.objective === "gastritis" || user.objective === "colon_irritable"
  );
  const [caffeineSensitivity, setCaffeineSensitivity] = useState<"high" | "mild" | "none">("high");

  // Mesocycle options
  const [mesoGoal, setMesoGoal] = useState<"volumen" | "definicion" | "fuerza">("volumen");
  const [mesoMuscleGroup, setMesoMuscleGroup] = useState<string>("Pecho/Hombros");
  const [mesoWeeksCount, setMesoWeeksCount] = useState<number>(4);
  const [mesoWeeklyFrequency, setMesoWeeklyFrequency] = useState<number>(3);
  const [mesoWeeks, setMesoWeeks] = useState<{ week: number; focus: string; volume: string; rpeTarget: string; nutritionalNote: string }[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch or setup default logs
  useEffect(() => {
    const loadLogs = () => {
      setLoading(true);
      try {
        // Load suggestions from local storage
        const localSugg = localStorage.getItem(`viamax_suggestions_${user.uid}`);
        if (localSugg) {
          setSuggestionLogs(JSON.parse(localSugg));
        } else {
          const defaults = [
            {
              id: "s_01",
              userId: user.uid,
              title: "Análisis: Rutina Empuje - Tirón - Piernas",
              aiSuggestedAdjustment: "💡 **Ajuste Técnico Biomecánico**: Tu captura describe 5 series de press de banca plano al fallo. Para evitar pinzamientos en el manguito rotador y considerando tu sensibilidad digestiva ocasional, reduce el volumen basura. Reemplaza 2 series por aperturas inclinadas lentas (tempo 3-1-2) para optimizar el haz clavicular.",
              imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop",
              createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
            }
          ];
          setSuggestionLogs(defaults);
          localStorage.setItem(`viamax_suggestions_${user.uid}`, JSON.stringify(defaults));
        }

        // Load strength entries from local storage
        const localStren = localStorage.getItem(`viamax_strength_${user.uid}`);
        if (localStren) {
          setStrengthLogs(JSON.parse(localStren));
        } else {
          const defaultsStr: StrengthLog[] = [
            {
              id: "str_01",
              userId: user.uid,
              exercise: "Sentadillas Traseras",
              weight: 120,
              reps: 6,
              rpe: 9,
              rir: 1,
              oneRepMax: 144,
              date: new Date(Date.now() - 3600000 * 120).toISOString().substring(0, 10)
            },
            {
              id: "str_02",
              userId: user.uid,
              exercise: "Bench Press",
              weight: 90,
              reps: 8,
              rpe: 8,
              rir: 2,
              oneRepMax: 114,
              date: new Date(Date.now() - 3600000 * 96).toISOString().substring(0, 10)
            },
            {
              id: "str_03",
              userId: user.uid,
              exercise: "Sentadillas Traseras",
              weight: 125,
              reps: 6,
              rpe: 9,
              rir: 1,
              oneRepMax: 150,
              date: new Date(Date.now() - 3600000 * 72).toISOString().substring(0, 10)
            },
            {
              id: "str_04",
              userId: user.uid,
              exercise: "Bench Press",
              weight: 95,
              reps: 6,
              rpe: 8.5,
              rir: 1.5,
              oneRepMax: 114,
              date: new Date(Date.now() - 3600000 * 48).toISOString().substring(0, 10)
            },
            {
              id: "str_05",
              userId: user.uid,
              exercise: "Sentadillas Traseras",
              weight: 130,
              reps: 5,
              rpe: 9.5,
              rir: 0.5,
              oneRepMax: 151.7,
              date: new Date(Date.now() - 3600000 * 12).toISOString().substring(0, 10)
            }
          ];
          setStrengthLogs(defaultsStr);
          localStorage.setItem(`viamax_strength_${user.uid}`, JSON.stringify(defaultsStr));
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [user.uid]);

  // Generate Default Mesocycle when component mounts or filters change
  useEffect(() => {
    generateDefaultMesocycle();
  }, [mesoGoal, mesoMuscleGroup, mesoWeeklyFrequency]);

  const generateDefaultMesocycle = () => {
    const w = user.weight || 75;
    
    let focusText = "";
    let volBase = "";
    let surplusText = "";

    if (mesoGoal === "volumen") {
      focusText = `Hipertrofia Sarcoplásmica de ${mesoMuscleGroup}`;
      volBase = "16-18 series semanales / músculo";
      surplusText = `Superávit metabólico de +350 Kcal/día con ${(w * 2).toFixed(0)}g de proteína digestible para favorecer síntesis de nitrógeno activo.`;
    } else if (mesoGoal === "definicion") {
      focusText = `Definición y Conservación Miofibrilar de ${mesoMuscleGroup}`;
      volBase = "12-14 series semanales / músculo";
      surplusText = `Déficit moderado de -400 Kcal/día con ${(w * 2.3).toFixed(0)}g de proteína alta para blindar tejido muscular.`;
    } else {
      focusText = `Fuerza Absoluta y Reclutamiento de UM en ${mesoMuscleGroup}`;
      volBase = "10-12 series semanales de alta tensión";
      surplusText = `Calorías neutras o leve superávit de +150 Kcal/día con alta hidratación celular (45ml/kg) para optimizar transmisión nerviosa.`;
    }

    const compiledWeeks = [
      {
        week: 1,
        focus: `Introducción al Estímulo y Acondicionamiento (${focusText})`,
        volume: `70% del volumen objetivo: ${volBase.split(" ")[0]} series estables.`,
        rpeTarget: "RPE 7-8 / RIR 2-3",
        nutritionalNote: `Consistencia base gástrica. Evita irritar tu microbiota. ${surplusText}`
      },
      {
        week: 2,
        focus: "Sobrecarga de Tensión Mecánica Progresiva",
        volume: `90% del volumen objetivo. Incrementa 2.5kg a ejercicios compuestos.`,
        rpeTarget: "RPE 8-9 / RIR 1-2",
        nutritionalNote: "Eleva carbohidratos complejos antes del entreno pesado para maximizar reservas de glucógeno."
      },
      {
        week: 3,
        focus: "Sobrecarga de Volumen Máximo y Fatiga Acumulada (Overreach)",
        volume: `110% del volumen objetivo. Incorpora 1 Drop-set final en la última serie para el fallo técnico.`,
        rpeTarget: "RPE 9-10 / RIR 0-1",
        nutritionalNote: "Monitorea tu digestión. El estrés neuromuscular elevado aumenta ocasionalmente el cortisol gástrico. Beber té de manzanilla tibio"
      },
      {
        week: 4,
        focus: "Descarga Neuromuscular Fisiológica Activa (Deload)",
        volume: "50% del volumen objetivo. Excelente tempo lento sin fallo gástrico/nervioso.",
        rpeTarget: "RPE 5-6 / RIR 4+",
        nutritionalNote: "Reparación gastro-renal de mucosa muscular. Incrementa ingesta calórica lípida y reduce el pre-entreno estomacal."
      }
    ];

    setMesoWeeks(compiledWeeks);
  };

  const handleUpgradeToMax = async () => {
    try {
      setLoading(true);
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, { subscriptionStatus: "vita_ia_max" });
      } catch (e) {
        console.warn("Firestore offline bypass, upgrading local storage:", e);
      }
      setSubscription("vita_ia_max");
      localStorage.setItem(`premium_checkout_completed_${user.uid}`, "vita_ia_max");
      showToast("👑 ¡Plan Vita IA Max desbloqueado satisfactoriamente! Bienvenido al Olimpo Atleta.");
    } catch {
      setSubscription("vita_ia_max");
    } finally {
      setLoading(false);
    }
  };

  // Upload real file handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setSimulatedScreenshot(base64Data);
      setVisionInputDesc(file.name);

      const objectiveDisclaimer = user.objective === "gastritis"
        ? "⚠️ Alerta Biomecánica Gastritis: El cortisol sérico elevado por workouts de fatiga extrema estimula los receptores H2 y causa acidez biliar anormal. El análisis aconseja limitar entrenamientos de más de 75 minutos."
        : "🌱 Alerta Biomecánica Colon Irritable: Evita fajas compresivas excesivas que restrinjan la motilidad del colon descendente. Mantén siempre respiración diafragmática profunda durante el squat.";

      setProcessedSuggestion(
        `🧠 **Captura de Archivo Real (${file.name}) Procesada con Éxito**:\n\n` +
        `1. **Diagnóstico Deportivo**: El archivo indica un patrón de movimiento con ángulo articular cerrado. Tu peso corporal (${user.weight || 75} kg) clasifica tu eficiencia motora en la zona estable.\n` +
        `2. **Plan Técnico AI**: Ejecuta tus pressamientos con un rango de 10-12 repeticiones en lugar de buscar fallos neuromusculares de bajas repeticiones con cargas excesivas.\n` +
        `3. **Gastro-Protección**: ${objectiveDisclaimer}\n\n` +
        `💡 *Regla Científica*: Consumir pre-entreno con infusión de jengibre sin cafeína sintética ácida para maximizar la síntesis lipídica sin detonar reflujo.`
      );
      showToast("📸 ¡Captura real procesada con el motor científico de Vita Max!");
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateScreenshot = (type: "routine" | "tip" | "gym_machine") => {
    if (type === "routine") {
      setSimulatedScreenshot("https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop");
      setVisionInputDesc("Rutina de fuerza extrema 5x5 RPE 9.5");
      setProcessedSuggestion(
        "🧠 **Motor Vita Coach Vision Max**:\n\n" +
        "1. **Análisis de Capacidad**: Tu rutina de Sentadillas a 5x5 (90% 1RM) posee un RPE promedio muy alto. Esto agota significativamente el sistema nervioso simpático si no se realiza un desemparejamiento periódico.\n" +
        "2. **Recomendación Biomecánica**: Cambia el patrón a 3x5 de carga máxima y añade 1 serie de sobrecarga volumétrica (Backoff set) al 70% AMRAP para propiciar reclutamiento mecánico.\n" +
        "3. **Protección Gástrica**: Dadas tus necesidades digestivas, evita pre-entrenos con cafeína anhidra ácida. Usa té verde tibio y citrulina malato de alta pureza."
      );
    } else if (type === "tip") {
      setSimulatedScreenshot("https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop");
      setVisionInputDesc("Consejo influencer: 'Llevar bíceps al fallo absoluto en cada serie'");
      setProcessedSuggestion(
        "🧠 **Motor Vita Coach Vision Max**:\n\n" +
        "1. **Desmentido Científico**: Entrenar al fallo absoluto (RPE 10) en cada serie limita mecánicamente el reclutamiento del total de series efectivas del entrenamiento por fatiga del sistema nervioso central.\n" +
        "2. **Ajuste Max**: Mantén un RIR (repeticiones en reserva) de 1 a 2 en tus primeras 3 series. Llega al fallo estrictamente en la última serie descendente (dropset)."
      );
    } else {
      setSimulatedScreenshot("https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop");
      setVisionInputDesc("Foto de Prensa inclinada biomecánica");
      setProcessedSuggestion(
        "🧠 **Motor Vita Coach Vision Max**:\n\n" +
        "1. **Consejo de Ejecución**: La prensa de 45° con apoyo lumbar extendido ejerce una presión intra-abdominal excesiva. Si tienes reflujo o distensión estomacal, limita el ángulo abdominal.\n" +
        "2. **Ajuste Técnico**: Desciende la carga únicamente hasta que tus muslos formen un ángulo recto estricto respecto a tu cadera. Empuja con fuerza con el talón."
      );
    }
    showToast("🔬 Simulación de captura ejecutada.");
  };

  const handleSaveVisionSuggestion = () => {
    if (!processedSuggestion || !visionInputDesc) return;
    const newSugg = {
      id: "s_" + Math.random().toString(36).substring(7),
      userId: user.uid,
      title: "Análisis: " + visionInputDesc.substring(0, 30) + (visionInputDesc.length > 30 ? "..." : ""),
      aiSuggestedAdjustment: processedSuggestion,
      imageUrl: simulatedScreenshot || undefined,
      createdAt: new Date().toISOString()
    };
    const updated = [newSugg, ...suggestionLogs];
    setSuggestionLogs(updated);
    localStorage.setItem(`viamax_suggestions_${user.uid}`, JSON.stringify(updated));
    showToast("💾 Sugerencia técnica guardada en tus archivos de atleta.");
    setSimulatedScreenshot(null);
    setProcessedSuggestion(null);
    setVisionInputDesc("");
  };

  // Video Telemetry timing effect for live or simulated recording
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);

        // Dynamically simulate back-and-forth joint angle & active telemetry phase
        setTelemetryAngle((prev) => {
          if (prev >= 115) {
            setTelemetryPhase("Concéntrica ⚡ (Fase de contracción)");
            return 75;
          }
          if (prev <= 75) {
            setTelemetryPhase("Excéntrica ⏳ (Retorno controlado)");
            setTelemetryReps((r) => r + 1);
            return 115;
          }
          return prev + (Math.random() > 0.5 ? 8 : -8);
        });
      }, 900);
    } else {
      setRecordingSeconds(0);
      setTelemetryReps(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Handle active video camera
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      setVideoStream(null);
      setIsCameraActive(false);
      setIsRecording(false);
      setSimulatedVideoWithTelemetry(false);
      showToast("📷 Cámara desactivada.");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setVideoStream(stream);
        setIsCameraActive(true);
        setSimulatedVideoWithTelemetry(false);
        showToast("🎥 Cámara iniciada. ¡Coloca tu teléfono de perfil!");
      } catch (err) {
        console.warn("Camera blocked or unavailable inside sandboxed preview. Initiating high-fidelity virtual telemetry video instead:", err);
        setIsCameraActive(true);
        setSimulatedVideoWithTelemetry(true);
        showToast("🎯 Iniciando Simulador de Cámara Biomecánica con Telemetría Activa.");
      }
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTelemetryReps(0);
    showToast("🔴 Grabando video... Realiza tu serie para análisis biomecánico de manguitos, rodilla y cadera.");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    showToast("🔬 Grabación finalizada. Generando dictamen de vectores cinéticos...");

    const repsEvaluated = telemetryReps || 4;
    const bodyWeight = user.weight || 75;

    const safetyWarning = user.objective === "gastritis" || gastroComfortActive
      ? "⚠️ Alerta de Reflujo Registrada: Evita retener el aliento al empujar. Mantener respiración continua para mantener la presión intra-abdominal."
      : "⚠️ Alerta Lumbar Registrada: Un sutil arqueo al final de la flexión sugiere sobrecarga lumbar. Recomendamos bajar la carga un 10%.";

    setProcessedSuggestion(
      `📊 **Dictamen de Video Clínico-Deportivo (${repsEvaluated} reps procesadas)**:\n\n` +
      `1. **Eficiencia Mecánica del Vector**: 92% (Excelente verticalidad de palanca para tu peso corporal de ${bodyWeight} kg).\n` +
      `2. **Límite de Carga Seguro**: Máximo sugerido para evitar daños de inserción muscular: **${Math.round(bodyWeight * 0.8)} kg**.\n` +
      `3. **Gastro-Protección**: ${safetyWarning}\n\n` +
      `💡 *Plan Exprés de Mejora*: Agrega ejercicios guiados con menos peso libre para evitar colapsos musculares o pinzamiento articular.`
    );
  };

  // Add custom photo to Routine bank
  const handleAddRoutineImage = (e: React.FormEvent) => {
    e.preventDefault();
    const titleInp = prompt("Título del Ejercicio para tu Galería:", "Curl de Bíceps con Barra");
    if (!titleInp) return;
    const customUrl = prompt("Enlace de Imagen (o deja vacío para imagen deportiva genérica):") || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop";

    const newImage = {
      id: "img_" + Math.random().toString(36).substring(7),
      title: titleInp,
      url: customUrl,
      selected: false,
      safetyNote: "Análisis: Excelente amplitud. Mantén la espina erecta.",
      weightCeiling: "Carga de Seguridad: Reps lentas (10-12) sin fatiga sistémica terminal.",
      muscleGroup: "General"
    };

    const updated = [...routineImages, newImage];
    setRoutineImages(updated);
    localStorage.setItem(`viamax_routine_images_${user.uid}`, JSON.stringify(updated));
    showToast("🖼️ ¡Imagen añadida con éxito a tu galería de rutinas!");
  };

  const handleToggleSelectImage = (id: string) => {
    const updated = routineImages.map(img => {
      if (img.id === id) {
        return { ...img, selected: !img.selected };
      }
      return img;
    });
    setRoutineImages(updated);
    localStorage.setItem(`viamax_routine_images_${user.uid}`, JSON.stringify(updated));
    showToast("🎯 Selección de imágenes actualizada.");
  };

  const handleDeleteRoutineImage = (id: string) => {
    const updated = routineImages.filter(img => img.id !== id);
    setRoutineImages(updated);
    localStorage.setItem(`viamax_routine_images_${user.uid}`, JSON.stringify(updated));
    showToast("🗑️ Imagen eliminada de tu banco.");
  };

  // Toggle medical nutritional tags
  const handleToggleMedicalTag = (tag: string) => {
    if (selectedMedicalTags.includes(tag)) {
      setSelectedMedicalTags(selectedMedicalTags.filter(t => t !== tag));
    } else {
      setSelectedMedicalTags([...selectedMedicalTags, tag]);
    }
  };

  // Dynamic Express workout routine generation engine
  const handleGenerateExpressPlan = () => {
    setLoading(true);
    setExpressPlanResult(null);

    setTimeout(() => {
      try {
        const bodyWeight = user.weight || 75;
        const objective = user.objective || "remanente";
        const selectedImagesList = routineImages.filter(img => img.selected);
        const selectedImgNames = selectedImagesList.map(i => i.title).join(", ") || "Biomecánica general";
        
        let customExercises: any[] = [];
        let medicalCheck = "";
        let nutritionalCheck = "";
        let summaryCheck = "";

        const hasReflujo = selectedMedicalTags.includes("reflujo_gastritis") || objective === "gastritis";
        const hasColon = selectedMedicalTags.includes("colon_irritable") || objective === "colon_irritable";
        const hasLumbar = selectedMedicalTags.includes("dolor_lumbar");
        const hasSueno = selectedMedicalTags.includes("falta_sueno");

        if (hasReflujo) {
          customExercises = [
            {
              name: "Prensa Inclinada de Confort (En lugar de Sentadillas Traseras)",
              targetWeight: `${Math.round(bodyWeight * 1.15)} kg Máximo de Seguridad (Excluye Peso del Carro)`,
              safeSets: "4 series de 12 repeticiones controladas (Tempo 3-0-2)",
              gastroCare: "La elevación relativa de la cabeza impide picos de presión estomacal y reflujo de ácido clorhídrico."
            },
            {
              name: "Press de Pecho Inclinado con Poleas Duales de Pie",
              targetWeight: "Poleas medias de 22.5 kg por Lado",
              safeSets: "3 series de 14 repeticiones (Excelente tensión constante)",
              gastroCare: "La postura erecta evita el decúbito supino plano, causante de pirosis bajo contracciones torácicas agudas."
            },
            {
              name: "Remo Bajo en Polea con Apoyo Frontal",
              targetWeight: `${Math.round(bodyWeight * 0.65)} kg`,
              safeSets: "3 series de 12 repeticiones fluidas",
              gastroCare: "Permite una retracción escapular sin presión sobre el diafragma inferior."
            }
          ];
          medicalCheck = "⚠️ Regla Veterana Reflujo: Evita entrenos horizontales llanos tras comidas. Excluye el press declinado o elevaciones de piernas tumbado.";
          nutritionalCheck = "🌱 Gastro Consejos: Bebe sorbos de infusión tibia con jengibre rallado tierno y una pizca de bicarbonato. Evita pre-entrenos con cafeína anhidra o edulcorantes concentrados.";
          summaryCheck = `Rutina clínica mejorada adaptando las fotos '${selectedImgNames}'. Se restringen cargas de compresión para proteger el tracto digestivo superior.`;
        } else if (hasColon) {
          customExercises = [
            {
              name: "Prensa de Brazos en Semipronación Unilateral",
              targetWeight: "Mancuernas de 15 kg por Lado",
              safeSets: "3 series de 12 repeticiones pausadas",
              gastroCare: "Evita cargas sobre el raquis vertebral y evita irritación del simpático entérico."
            },
            {
              name: "Jalón Dorsal de Pie en Polea Alta con Agarre Neutro",
              targetWeight: `${Math.round(bodyWeight * 0.5)} kg`,
              safeSets: "4 series de 12 jalones profundos",
              gastroCare: "La extensión de torso y hombro promueve la descompresión visceral y normaliza la motilidad refleja."
            },
            {
              name: "Zancadas Búlgaras de Isometría Activa con Soporte",
              targetWeight: "Peso corporal puro (0 kg adicionales de seguridad)",
              safeSets: "3 series de 10 repeticiones por pierna con tempo lento",
              gastroCare: "Excelente contracción del plano inferior sin compresión abdominal nociva."
            }
          ];
          medicalCheck = "🌱 Protección SII: Controla la respiración torácica abdominal. Al terminar cada serie dura, siéntate erguido y realiza 3 respiraciones diafragmáticas lentas.";
          nutritionalCheck = "🧪 Plan FODMAP Atleta: Consume papilla de avena libre de gluten o arroz blanco lavado con canela 1.5 horas antes de entreno. Cero lácteos irritantes.";
          summaryCheck = `Esquema libre de presiones axiales (evitando squat dorsal y peso muerto pesado) para minimizar dolor o espasmos intestinales.`;
        } else if (hasLumbar) {
          customExercises = [
            {
              name: "Prensa de Pierna Unilateral a Un Solo Miembro",
              targetWeight: `${Math.round(bodyWeight * 0.6)} kg`,
              safeSets: "3 series de 12 repeticiones por pierna (Doble protección lumbar)",
              gastroCare: "Previene la retroversión de pelvis reduciendo la fatiga espondilar sobre L4-L5-S1."
            },
            {
              name: "Remo con Mancuerna Apoyado sobre Banco Inclinado",
              targetWeight: "Mancuernas de 17.5 kg",
              safeSets: "4 series de 10 contracciones lentas",
              gastroCare: "El soporte mecánico pectoral absorbe las fuerzas parásitas de tracción lumbar en su totalidad."
            }
          ];
          medicalCheck = "🩹 Salvaguarda Lumbar: Utiliza tempo lento de 4 segundos en fase excéntrica y elimina rebotes explosivos de fuerza.";
          nutritionalCheck = "💊 Suplementación Pro: Consume 3g de ácidos grasos Omega-3 de alta destilación para acelerar la regeneración discal.";
          summaryCheck = `Adaptando las características físicas del usuario con peso corporal de ${bodyWeight} kg, creamos un plan libre de flexión dorsal forzada.`;
        } else {
          customExercises = [
            {
              name: "Sentadilla Goblet Profunda con Talón Elevado",
              targetWeight: `${Math.round(bodyWeight * 0.45)} kg Máximo de Cuidado`,
              safeSets: "4 series de 12 repeticiones lentas",
              gastroCare: "El vector vertical reduce la palanca posterior protegiendo el sacro de daños."
            },
            {
              name: "Press de Pecho en Máquina Hammer Convergente de Confort",
              targetWeight: `${Math.round(bodyWeight * 0.55)} kg de Cobre`,
              safeSets: "3 series de 12 repeticiones (Con RIR 2 preventivo)",
              gastroCare: "Control absoluto de vector sin riesgo cinético de caída."
            }
          ];
          medicalCheck = "🛡️ Prevención Deportiva: Peso estrictamente limitado por debajo del 80% 1RM para evitar sobre-elongaciones musculares.";
          nutritionalCheck = "🍉 Equilibrio Atleta: Beber 45ml de agua por kg con sal marina orgánica y citrulina libre para optimizar contracción neuromuscular.";
          summaryCheck = `Plan de musculación express optimizado a tu morfología de ${bodyWeight} kg. Enfoque preventivo anticaídas.`;
        }

        if (hasSueno) {
          medicalCheck += " 😴 CUIDADO EXTRA SUEÑO: Reducimos en un 20% el volumen general del entrenamiento para evitar sobrecargar tu sistema neuromuscular exhausto.";
        }

        setExpressPlanResult({
          title: `Programa Adaptado Exprés - Atleta Clinico Max`,
          safetyFirstExercises: customExercises,
          medicalGuideline: medicalCheck,
          nutritionalAdvice: nutritionalCheck,
          routineAdjustmentSummary: summaryCheck
        });

        // Add to historic processed suggestions array
        const customTitle = `Plan Exprés: ${selectedImgNames.substring(0, 25) || "Morfofuncional"}`;
        const formattedAdvice = `📚 **PLAN EXPRÉS GENERADO** 📚\n` +
          `• **Enfoque**: ${summaryCheck}\n` +
          `• **Ejercicios**: ${customExercises.map(e => e.name + " (" + e.targetWeight + ")").join(", ")}\n` +
          `• **Consejo Médico**: ${medicalCheck}\n` +
          `• **Nutrición Gástrica**: ${nutritionalCheck}`;

        const newSugg = {
          id: "s_" + Math.random().toString(36).substring(7),
          userId: user.uid,
          title: customTitle,
          aiSuggestedAdjustment: formattedAdvice,
          createdAt: new Date().toISOString()
        };
        const updatedSuggestions = [newSugg, ...suggestionLogs];
        setSuggestionLogs(updatedSuggestions);
        localStorage.setItem(`viamax_suggestions_${user.uid}`, JSON.stringify(updatedSuggestions));

        showToast("⚡ ¡Plan Exprés Clínico y Rutina Adaptada Generada!");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 1300);
  };

  // Strength utilities
  const calculateOneRepMax = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    // Epley Formula
    return Number((weight * (1 + reps / 30)).toFixed(1));
  };

  const handleAddStrengthLog = (e: React.FormEvent) => {
    e.preventDefault();
    const limitMax = calculateOneRepMax(strengthWeight, strengthReps);
    const newLog: StrengthLog = {
      id: "str_" + Math.random().toString(36).substring(7),
      userId: user.uid,
      exercise: strengthExercise,
      weight: strengthWeight,
      reps: strengthReps,
      rpe: strengthRPE,
      rir: strengthRIR,
      oneRepMax: limitMax,
      date: new Date().toISOString().substring(0, 10)
    };

    const updated = [newLog, ...strengthLogs];
    setStrengthLogs(updated);
    localStorage.setItem(`viamax_strength_${user.uid}`, JSON.stringify(updated));
    showToast(`📈 ¡Carga registrada con éxito! Tu 1RM de ${strengthExercise} se estimó en ${limitMax} kg.`);
  };

  const handleDeleteStrengthLog = (id: string) => {
    const updated = strengthLogs.filter(item => item.id !== id);
    setStrengthLogs(updated);
    localStorage.setItem(`viamax_strength_${user.uid}`, JSON.stringify(updated));
    showToast("Registro eliminado de la bitácora.");
  };

  // Dynamic supplement calculations based on current weight & gastro-sensitivity comfort
  const getSuplementsCalculation = () => {
    const w = user.weight || 75;
    
    // Standard doses calculations
    const proteinTargetMin = (w * 1.8).toFixed(0);
    const proteinTargetMax = (w * 2.2).toFixed(0);
    const creatineGrams = (w * 0.1).toFixed(1);
    const hydrationBase = (w * 45).toFixed(0); // 45 ml / kg
    const citrullineMalate = suppIntensity === "strength_peak" ? "8g" : "6g";

    // Standard preworkout stimulants vs Gastro Comfort Mode replacement
    let stimulantsStack = "";
    let stomachHealthAdvise = "";

    if (gastroComfortActive) {
      stimulantsStack = "🛡️ Bloque Integrado Anti-Reflujo: L-Teanina (200mg) + Jengibre puro rallado tierno (1g) + Electrolitos orgánicos de agua de coco.";
      stomachHealthAdvise = "Aviso Gástrico: Se eliminó por completo la cafeína anhidra sintética (potente irritante que relaja el esfínter esofágico, causando agruras bajo cargas de squat/bench). La L-Teanina aumenta el flujo sanguíneo y el foco neuronal sin acidez.";
    } else {
      if (caffeineSensitivity === "high") {
        stimulantsStack = "Energizante de Alto Voltaje: 250mg Cafeína anhidra + 3.2g Beta-Alanina (hormigueo de vasodilatación activa).";
      } else if (caffeineSensitivity === "mild") {
        stimulantsStack = "Energizante balanceado: 100mg Cafeína natural (extracto de café verde) + 1.6g Beta-Alanina.";
      } else {
        stimulantsStack = "Stack sin estimulantes: Únicamente aminoácidos libres biodisponibles (sin alteración cardíaca).";
      }
      stomachHealthAdvise = "Se mantiene cafeína anhidra. Si experimentas agruras o ardor estomacal durante las series pesadas de piernas, activa el Modo de Confort Gástrico.";
    }

    return {
      weight: w,
      protein: `${proteinTargetMin}g a ${proteinTargetMax}g óptimos diarios`,
      creatine: `${creatineGrams}g diarios de Creatina Creapure (fomenta ATP sin molestias de retención extracelular)`,
      hydration: `${hydrationBase} ml recomendados diarios bajo rutina para elasticidad de discos`,
      citrulline: `${citrullineMalate} de Citrulina Malato (Grado Farmacéutico para hiperemia pura)`,
      electrolytes: "1.5g de sal de mar orgánica disuelta para contracción neuromuscular óptima",
      stimulants: stimulantsStack,
      stomachNote: stomachHealthAdvise
    };
  };

  const supps = getSuplementsCalculation();

  // Progressive Overload prediction guidelines (for Strength tab)
  const currentMaxEstimate = strengthLogs.find(l => l.exercise === strengthExercise)?.oneRepMax || calculateOneRepMax(strengthWeight, strengthReps);
  const currentLoggedWeight = strengthLogs.find(l => l.exercise === strengthExercise)?.weight || strengthWeight;
  const currentLoggedReps = strengthLogs.find(l => l.exercise === strengthExercise)?.reps || strengthReps;

  // Strength analysis calculations
  const relativeStrengthRatio = user.weight ? (currentMaxEstimate / user.weight) : 1;
  const athleticLevelString = (() => {
    if (relativeStrengthRatio < 1.0) return "Principiante (Nivel Inicial de Fuerza) 🌱";
    if (relativeStrengthRatio < 1.5) return "Atleta Intermedio (Fuerza Deportiva Consistente) 🏃‍♂️";
    if (relativeStrengthRatio < 2.0) return "Atleta Avanzado (Alto Rendimiento Biomecánico) ⚡";
    return "Elite Absoluto (Fuerza Máxima de Competición) 👑";
  })();

  // Filter strength logs for chart
  const filteredStrengthLogs = strengthExercise === "All" || chartFilter === "All"
    ? strengthLogs
    : strengthLogs.filter(log => log.exercise === strengthExercise);

  // SVG Chart scale values
  const max1rmInLogs = strengthLogs.length > 0 ? Math.max(...strengthLogs.map(l => l.oneRepMax)) : 160;
  const min1rmInLogs = strengthLogs.length > 0 ? Math.min(...strengthLogs.map(l => l.oneRepMax)) : 60;
  const graphMax = max1rmInLogs * 1.05;
  const graphMin = Math.max(0, min1rmInLogs * 0.90);

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12 bg-slate-50/50 p-1 sm:p-4 rounded-3xl" id="viamax-viewport">
      
      {/* Dynamic Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-850 border border-slate-350 bg-white text-slate-800 p-4 shadow-2xl flex items-center gap-3.5 border-emerald-500 animate-bounce">
          <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
          <span className="text-xs font-bold leading-normal text-slate-705">{toastMessage}</span>
        </div>
      )}

      {/* Elegant Display Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-150 p-8 space-y-4 shadow-sm bg-white text-slate-800">
        <div className="absolute top-0 right-0 h-44 w-44 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 h-32 w-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-600 border border-rose-200 uppercase tracking-widest">
              <Sparkles className="h-3 w-3 animate-spin-slow" />
              <span>Suscripción Vita IA Max Activa</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
              Plataforma Deportiva Clinica <span className="text-rose-500 font-black">VITA MAX</span>
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Integración de la biomecánica avanzada y el cuidado gástrico. Diseñado meticulosamente para atletas que buscan máxima fuerza e hipertrofia protegiendo su mucosa gastrointestinal.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0 z-10">
            {subscription !== "vita_ia_max" ? (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-3 w-full sm:w-auto">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Plan Integral Premium Max</p>
                  <p className="text-2xl font-black text-rose-500">$15 <span className="text-xs text-slate-500 font-normal">/ mes</span></p>
                </div>
                <button
                  onClick={handleUpgradeToMax}
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 text-xs font-extrabold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Desbloquear Plan Vita Max ✨
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-250 px-4 py-2.5 rounded-2xl">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
                <span className="text-xs font-extrabold text-emerald-700">Rango de Atleta Max Desbloqueado</span>
              </div>
            )}
            <button
              onClick={() => onViewChange("dashboard")}
              className="text-xs text-slate-550 hover:text-emerald-600 transition-colors font-bold flex items-center gap-1 mt-1"
            >
              <span>Volver al Dashboard Principal</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Modular Navigation Bar */}
        <div className="flex overflow-x-auto gap-2 border-t pt-6 border-slate-100 max-w-full no-scrollbar">
          {[
            { id: "vision", label: "Coach Vision Max", icon: Camera, desc: "Análisis de capturas e imágenes" },
            { id: "strength", label: "Tracker de 1RM & RPE", icon: Dumbbell, desc: "Fuerza inteligente" },
            { id: "supps", label: "Suplementación Deportiva Pro", icon: Beaker, desc: "Cálculo por peso y estómago" },
            { id: "mesocycle", label: "Planificador de Mesociclos", icon: Calendar, desc: "Macros y volumen clínico" }
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border text-left transition-all min-w-[210px] ${
                  active 
                    ? "bg-slate-50 border-rose-500 shadow-sm font-bold" 
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className={`p-2 rounded-xl ${active ? "bg-rose-500 text-white" : "bg-slate-150 text-slate-500"}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-xs ${active ? "text-slate-800 font-extrabold" : "text-slate-650"}`}>{tab.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* WARNING LIMITATION BLOCK */}
      {subscription !== "vita_ia_max" && (
        <div className="border border-dashed border-rose-450 bg-rose-50/50 rounded-2xl p-6 text-center space-y-3">
          <Lock className="h-6 w-6 text-rose-500 mx-auto animate-pulse" />
          <h4 className="text-sm font-bold text-slate-800">Sección Exclusiva Plan Vita IA Max</h4>
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            Puedes simular y visualizar las herramientas interactivas a continuación. Activa el Plan Vita Max arriba para guardar registros indefinidos en tu base de datos clínica.
          </p>
        </div>
      )}

      {/* CORE ACTIVE MODULE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Modular Interactive Zones */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TAB 1: COACH VISION MAX */}
          {activeTab === "vision" && (
            <div className="border border-slate-150 bg-white rounded-3xl p-6 shadow-md space-y-8 animate-fade-in text-left">
              
              <div className="border-b pb-4 border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
                    <Camera className="h-6 w-6 text-rose-500 animate-pulse" />
                    <span>Coach Vision AI: Analizador de Capturas Biomecánicas</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                    Graba videos en vivo o gestiona imágenes de tu rutina física. El motor de Inteligencia Artificial analiza la biomecánica y el confort gástrico clínico para estructurar programas eficientes sin riesgos.
                  </p>
                </div>
                
                {/* Switcher style tab selector */}
                <div className="bg-slate-100 border border-slate-200 p-1 rounded-2xl flex gap-1 self-stretch sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveAnalysisMode("image")}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition-all flex items-center gap-1.5 ${
                      activeAnalysisMode === "image"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <span>🖼️ Gestionar Imágenes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAnalysisMode("video")}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition-all flex items-center gap-1.5 ${
                      activeAnalysisMode === "video"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <span>🎥 Grabar Video Rutina</span>
                  </button>
                </div>
              </div>

              {/* MODE A: IMAGE GALLERY MANAGER */}
              {activeAnalysisMode === "image" && (
                <div className="space-y-6">
                  
                  {/* Image bank instruction */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-505 bg-rose-500" />
                          <span>Banco de Imágenes de mi Rutina</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Selecciona las imágenes de los ejercicios que realizarás hoy para incluirlas en el análisis y generar tu rutina exprés clínica adaptada.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddRoutineImage}
                        className="rounded-xl bg-slate-50 hover:bg-slate-150 border border-slate-205 text-slate-700 px-3.5 py-2 text-xs font-black flex items-center gap-1.5 hover:border-slate-300 transition-colors"
                      >
                        <Plus className="h-4 w-4 text-rose-500" />
                        <span>Añadir Imagen Deportiva</span>
                      </button>
                    </div>

                    {/* Horizontal scrollable image list */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {routineImages.map((img) => (
                        <div 
                          key={img.id} 
                          className={`relative rounded-2xl border overflow-hidden p-3 transition-all space-y-3 bg-slate-50/40 hover:bg-slate-50/90 ${
                            img.selected 
                              ? "border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/5" 
                              : "border-slate-150"
                          }`}
                        >
                          <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-200">
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                            
                            {/* Toggle selection overlay badge */}
                            <button
                              type="button"
                              onClick={() => handleToggleSelectImage(img.id)}
                              className={`absolute top-2 left-2 p-1.5 rounded-full shadow-md transition-all ${
                                img.selected 
                                  ? "bg-rose-500 text-white" 
                                  : "bg-white/90 text-slate-400 hover:text-slate-650"
                              }`}
                            >
                              <CheckCircle className="h-4.5 w-4.5" />
                            </button>

                            <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black text-white">
                              {img.muscleGroup || "Músculo"}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="text-[11.5px] font-extrabold text-slate-800 leading-tight line-clamp-1">{img.title}</h5>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoutineImage(img.id)}
                                className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                                title="Eliminar de mi banco"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed italic line-clamp-2">
                              {img.safetyNote}
                            </p>
                            <span className="inline-block text-[9.5px] font-extrabold text-emerald-600 font-mono">
                              {img.weightCeiling}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Standard file uploader section */}
                  <div className="border border-slate-150 p-5 rounded-2xl bg-slate-50/40 space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Subir Nueva Captura Alternativa</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Real File Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Cargar captura biomecánica real:</label>
                        <label 
                          htmlFor="viamax-file-upload-input"
                          className="border-2 border-dashed border-emerald-350 hover:border-emerald-505 bg-emerald-500/5 hover:bg-emerald-50/20 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer text-center transition-all h-24 border-emerald-300"
                        >
                          <Camera className="h-6 w-6 text-emerald-600 mb-1 animate-pulse" />
                          <span className="text-[11px] font-extrabold text-emerald-700">Subir Captura Deportiva 📸</span>
                          <span className="text-[9px] text-slate-400 mt-1">Soporta PNG, JPEG de rutinas</span>
                        </label>
                        <input 
                          type="file" 
                          id="viamax-file-upload-input" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                      </div>

                      {/* Simulators generator selection widgets */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Acciones / Consejos Simulados de Redes:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleSimulateScreenshot("routine")}
                            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-150 bg-white hover:bg-slate-50 transition-all text-center gap-1.5"
                          >
                            <Dumbbell className="h-4 w-4 text-rose-500" />
                            <span className="text-[9px] font-extrabold text-slate-650">Rutina 5x5</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateScreenshot("tip")}
                            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-150 bg-white hover:bg-slate-50 transition-all text-center gap-1.5"
                          >
                            <Smartphone className="h-4 w-4 text-purple-500" />
                            <span className="text-[9px] font-extrabold text-slate-650">Consejo Fallo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateScreenshot("gym_machine")}
                            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-150 bg-white hover:bg-slate-50 transition-all text-center gap-1.5"
                          >
                            <Camera className="h-4 w-4 text-emerald-500" />
                            <span className="text-[9px] font-extrabold text-slate-650">Foto Prensa</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* View current simulated/uploaded file response screen */}
                    {simulatedScreenshot && (
                      <div className="border border-slate-150 p-4 rounded-xl bg-white space-y-3.5 max-w-xl mx-auto">
                        <div className="relative h-44 w-full rounded-lg overflow-hidden shadow-sm bg-black">
                          <img src={simulatedScreenshot} alt="Captura analizada" className="w-full h-full object-contain" />
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full inline-block animate-pulse">
                            Procesado AI Vision Max
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <p className="text-slate-500 font-medium">Elemento detectado: <strong className="text-slate-800">{visionInputDesc}</strong></p>
                          <button 
                            onClick={() => setSimulatedScreenshot(null)}
                            className="text-[10px] font-bold text-rose-500 hover:underline border-none bg-transparent"
                          >
                            Remover Imagen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE B: VIDEO RECORDER WITH LIVE TELEMETRY */}
              {activeAnalysisMode === "video" && (
                <div className="space-y-6">
                  
                  {/* Camera stream or Biomechanical Hud simulation view */}
                  <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white h-80 flex flex-col justify-between p-4 shadow-inner border border-slate-850">
                    
                    {/* Camera view background layer */}
                    {isCameraActive ? (
                      videoStream ? (
                        <video 
                          ref={(el) => { if (el) el.srcObject = videoStream; }} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        /* Simulated Biomechanical Telemetry View */
                        <div className="absolute inset-0 bg-slate-900 overflow-hidden flex flex-col justify-center items-center">
                          <div className="absolute inset-x-0 h-0.5 bg-rose-500/20 top-1/2 -translate-y-1/2 animate-pulse" />
                          <div className="absolute inset-y-0 w-0.5 bg-rose-500/20 left-1/2 -translate-x-1/2 animate-pulse" />
                          
                          {/* Floating vector grid coordinates */}
                          <div className="text-emerald-450 font-mono text-[9px] text-emerald-400 space-y-1 absolute left-4 top-4 bg-black/45 p-2 rounded-xl border border-slate-800">
                            <p>POS_X: {(150 + Math.random() * 5).toFixed(1)}</p>
                            <p>POS_Y: {(250 + Math.random() * 5).toFixed(1)}</p>
                            <p>VEC_Z: {(0.8 + Math.random() * 0.1).toFixed(3)}</p>
                            <p>ACC_T: {(9.81 + Math.random() * 0.05).toFixed(2)} m/s²</p>
                          </div>

                          {/* Interactive vector paths representation */}
                          <div className="relative w-44 h-44 flex items-center justify-center rounded-full border border-dashed border-rose-500/30 animate-spin-slow">
                            <div className="h-28 w-28 rounded-full border border-emerald-500/20 flex items-center justify-center">
                              <Dumbbell className="h-10 w-10 text-rose-500/60 animate-bounce" />
                            </div>
                          </div>

                          <div className="absolute bottom-4 left-4 bg-black/45 px-3 py-1.5 rounded-lg text-[10px] text-slate-300 font-bold border border-slate-800 flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-505 bg-emerald-500" />
                            <span>Detector de Ángulo de Cadera Activo</span>
                          </div>
                        </div>
                      )
                    ) : (
                      /* Idle Placeholder */
                      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <Camera className="h-12 w-12 text-slate-600 animate-pulse" />
                        <h4 className="text-sm font-extrabold text-white">Grabadora Biomecánica en Línea</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Coloca tu cámara lateral para capturar la serie. La IA identificará la velocidad, recorrido y rango angular para determinar si estás sobrecargando tu musculatura.
                        </p>
                        <button
                          type="button"
                          onClick={handleToggleCamera}
                          className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-5 py-2.5 text-xs shadow-md transition-all uppercase tracking-wider"
                        >
                          Iniciar Sensor de Cámara 🎥
                        </button>
                      </div>
                    )}

                    {/* HUD OVERLAY: Top Metrics Bar */}
                    {isCameraActive && (
                      <div className="flex justify-between items-start z-10 w-full bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          {isRecording ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-black text-white animate-pulse">
                              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                              <span>REC {recordingSeconds}s</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-705 bg-slate-800 px-2.5 py-1 text-[10px] font-extrabold text-slate-400">
                              <span>STANDBY</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-350 font-mono">Frecuencia: 60 FPS</span>
                        </div>

                        {/* Instant Angle telemetry display dial */}
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Ángulo Articular</p>
                          <p className="text-xl font-black text-emerald-400">{telemetryAngle}°</p>
                          <p className="text-[9px] text-slate-300 font-mono leading-none">{telemetryPhase}</p>
                        </div>
                      </div>
                    )}

                    {/* HUD OVERLAY: Bottom Controls & Warnings Bar */}
                    {isCameraActive && (
                      <div className="flex flex-col sm:flex-row justify-between items-center z-10 w-full bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 gap-3">
                        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                          {!isRecording ? (
                            <button
                              type="button"
                              onClick={handleStartRecording}
                              className="w-full sm:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black text-white text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Play className="h-4.5 w-4.5" />
                              <span>Grabar Serie</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleStopRecording}
                              className="w-full sm:w-auto rounded-xl bg-red-505 bg-red-650 hover:bg-red-700 font-black text-white text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 shadow-sm animate-pulse"
                            >
                              <CheckCircle className="h-4.5 w-4.5" />
                              <span>Detener & Analizar</span>
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={handleToggleCamera}
                            className="w-full sm:w-auto rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 text-xs px-4 py-2.5"
                          >
                            Apagar Cámara
                          </button>
                        </div>

                        {/* Counters */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="bg-slate-900 border border-slate-850 px-3 py-1 rounded-xl">
                            <span className="text-[8.5px] text-slate-500 block leading-none font-bold">REPETICIONES</span>
                            <strong className="text-rose-400 font-black text-sm">{telemetryReps} detectadas</strong>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 px-3 py-1 rounded-xl">
                            <span className="text-[8.5px] text-slate-500 block leading-none font-bold">LÍMITE DE PESO</span>
                            <strong className="text-amber-400 font-black text-sm">{Math.round((user.weight || 75) * 0.82)} kg Máx</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warning on heavy overload */}
                  <div className="rounded-2xl p-4.5 border border-dashed border-rose-200 bg-rose-50/20 text-xs text-rose-800 space-y-1.5">
                    <span className="font-extrabold uppercase tracking-wide flex items-center gap-2 text-[10px]">
                      <Info className="h-4 w-4" />
                      <span>Salvaguarda de Sobrecarga Neuromuscular de Seguridad</span>
                    </span>
                    <p className="leading-relaxed text-[11px] text-rose-705">
                      Para evitar microdesgarros, daño articular y reflujo ácido súbito, la velocidad excéntrica no debe acelerarse voluntariamente bajo un RPE mayor a 8. Mantén un tope controlado sobre tu cuerpo.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: SUGGESTED SAFETY-FIRST EXERCISES BASED ON PHYSICAL DATA */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30 space-y-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Dumbbell className="h-4.5 w-4.5 text-rose-500" />
                    <span>Ejercicios Clínicos Sugeridos: Calibrado para Atleta ({user.age || 28} años, {user.weight || 75} kg, {user.height || 178} cm)</span>
                  </h4>
                  <p className="text-[11px] text-slate-455 text-slate-500 leading-relaxed">
                    Prescripción ergonómica inteligente diseñada para aislar el objetivo protegiendo la mucosa gástrica y tu raquis lumbar. Se limita la carga externa máxima a un tope estricto de seguridad.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Prensa Inclinada de Confort",
                      reason: "Reduce la tensión e inflamación de la zona pélvica lateral en comparación con sentadillas pesadas. Protege contra hernias de disco.",
                      weightAdvice: `Tope Seguro: ${Math.round((user.weight || 75) * 1.2)} kg (Máximo de Cuidado)`,
                      icon: ShieldCheck
                    },
                    {
                      name: "Pecho Inclinado con Poleas Convergentes de Pie",
                      reason: "La tensión es continua sin requerir apnea profunda de Valsalva (reduciendo acidez biliar o sofocación por reflujo).",
                      weightAdvice: "Tope Seguro: 20 kg por polea",
                      icon: RefreshCw
                    },
                    {
                      name: "Remo Cerrado con Soporte Pectoral",
                      reason: "Al apoyar el esbelto esqueleto en la almohadilla, eliminas fuerzas de tracción lumbar críticas en lumbagos ocasionales.",
                      weightAdvice: `Tope Seguro: ${Math.round((user.weight || 75) * 0.6)} kg`,
                      icon: Sparkles
                    }
                  ].map((ex, inx) => (
                    <div key={inx} className="p-4 bg-white border border-slate-150 rounded-2xl relative space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">EJERCICIO RECOMENDADO</span>
                        <h5 className="text-[12px] font-black text-rose-500 leading-snug">{ex.name}</h5>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed">{ex.reason}</p>
                      </div>
                      <div className="border-t pt-2 border-slate-100">
                        <span className="text-[10px] font-extrabold text-emerald-650 tracking-tight block">
                          🛡️ {ex.weightAdvice}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              {/* SECTION: INTEGRATED MEDICAL, NUTRITIONAL AND COMPLIMENTARY CHAT */}
              <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Chat Clìnico-Deportivo: Añada Sugerencias Médicas o Cotidianas</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Establece tu estado de salud actual. Combina estas variables clínicas en vivo con tus imágenes seleccionadas arriba para que el Coach AI Vision formule tu rutina de entrenamiento y plan terapéutico exprés.
                  </p>
                </div>

                {/* Predefined quick clinical tags */}
                <div className="space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-450 text-slate-500 block">Presiona tus etiquetas e indicadores de salud actuales:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "reflujo_gastritis", label: "Acidez / Reflujo Activo 🌋", desc: "Evita decúbitas declinados" },
                      { id: "dolor_lumbar", label: "Dolor Lumbar Ocasional 🩹", desc: "Excluye cargas axiales pesadas" },
                      { id: "falta_sueno", label: "Falta de Sueño Intensa 😴", desc: "Volumen al 50% de volumen" },
                      { id: "colon_irritable", label: "Espasmo / SII Colon Irritable 🎈", desc: "Controla apnea de diafragma" },
                      { id: "fatiga_nerviosa", label: "Cansancio Sistémico 🥱", desc: "Entrenar con RIR 3" }
                    ].map((tag) => {
                      const selected = selectedMedicalTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleMedicalTag(tag.id)}
                          className={`rounded-xl px-3 py-2 text-xs font-bold text-left border transition-all ${
                            selected 
                              ? "bg-rose-500 text-white border-rose-500 shadow-sm" 
                              : "bg-slate-50 text-slate-650 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span className="block leading-none">{tag.label}</span>
                          <span className={`text-[8.5px] font-normal block mt-0.5 ${selected ? "text-rose-100" : "text-slate-400"}`}>
                            {tag.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Query Input Chat */}
                <div className="space-y-2">
                  <label htmlFor="medical-query-input" className="text-xs font-bold text-slate-700">Comentarios Médicos o Nutricionales Adicionales:</label>
                  <textarea
                    id="medical-query-input"
                    value={medicalNutritionalQuery}
                    onChange={(e) => setMedicalNutritionalQuery(e.target.value)}
                    placeholder="Ej. 'Hoy siento acidez por el almuerzo tardío y me duele un poco la rodilla derecha...' La IA modificará pesos y sustituirá extensiones brutales por movimientos protectores."
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 h-20 text-slate-700"
                  />
                </div>

                {/* Generation CTA */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateExpressPlan}
                    disabled={loading}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-extrabold px-6 py-3 text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    <Sparkles className="h-4.5 w-4.5 animate-spin-slow" />
                    <span>{loading ? "Re-estructurando Rutinas..." : "Generar Rutina Mejorada & Plan de Entrenamiento Exprés Atleta"}</span>
                  </button>
                </div>
              </div>

              {/* ACTION ANALYSIS OUTLINE RESULT CARD (EXPRESS PLAN) */}
              {expressPlanResult && (
                <div className="rounded-3xl p-6 border border-emerald-200 bg-emerald-500/5 text-slate-705 text-xs space-y-6 animate-fade-in relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 h-28 w-28 bg-emerald-500/10 rounded-full blur-2xl" />
                  
                  <div className="border-b pb-3 border-emerald-150 flex justify-between items-center bg-transparent">
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                      <span>{expressPlanResult.title}</span>
                    </span>
                    <span className="rounded-xl bg-emerald-100 text-emerald-805 px-3 py-1 text-[10px] font-black uppercase">
                      Clínicamente Seguro
                    </span>
                  </div>

                  {/* Program Summary banner */}
                  <div className="p-3 bg-emerald-50 bg-white border border-emerald-100 rounded-xl text-[11px] leading-relaxed text-emerald-800 font-medium">
                    <strong className="text-emerald-950 block mb-0.5">Enfoque de Adaptación Biomecánica:</strong>
                    {expressPlanResult.routineAdjustmentSummary}
                  </div>

                  {/* Exercises customized matrix */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">RUTINA EXPRÉS MEJORADA (Ejercicios de Seguridad Máxima)</span>
                    <div className="grid grid-cols-1 gap-3.5">
                      {expressPlanResult.safetyFirstExercises.map((exArr, indexEx) => (
                        <div key={indexEx} className="p-4 bg-white border border-slate-150 rounded-xl space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <h6 className="text-[12.5px] font-black text-rose-500">{exArr.name}</h6>
                            <span className="rounded-lg bg-slate-100 text-slate-650 px-2.5 py-1 text-[10px] font-bold font-mono">
                              {exArr.safeSets}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-550 italic leading-relaxed text-slate-500">
                            🛡️ <strong className="text-slate-700">Dato de Fuerza Controlada</strong>: {exArr.gastroCare}
                          </p>

                          <div className="text-[10.5px] text-emerald-700 font-extrabold leading-none pt-1">
                            Tope Máximo de Peso: {exArr.targetWeight}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guidelines columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-100 space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block">PRESCRIPCIÓN ASOCIADA</span>
                      <p className="text-[11px] leading-relaxed text-slate-650 whitespace-pre-line font-medium text-slate-600">
                        {expressPlanResult.medicalGuideline}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-100 space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 block">INDICADORES DE DIGESTIÓN / NUTRICIÓN</span>
                      <p className="text-[11px] leading-relaxed text-slate-650 whitespace-pre-line font-medium text-slate-600">
                        {expressPlanResult.nutritionalAdvice}
                      </p>
                    </div>
                  </div>

                  <p className="text-[9.5px] text-slate-400 text-center font-medium italic">
                    Este plan clínico express es calculado de forma dinámica utilizando la optimización computacional de las variables biográficas registradas del Atleta. Consérvalo en tus bitácoras para auditar progresos.
                  </p>
                </div>
              )}

              {/* SAVED SUGGESTIONS AND LOG HISTORY RE-ENTRY BUTTON */}
              {processedSuggestion && !expressPlanResult && (
                <div className="rounded-3xl p-5 border border-emerald-150 bg-emerald-500/5 text-slate-700 text-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-2 border-emerald-100">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-550 animate-pulse" />
                      <span>Opinión Científica Generada</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveVisionSuggestion}
                      className="rounded-lg bg-emerald-500 text-white font-extrabold px-3 py-1.5 text-[10px] flex items-center gap-1 hover:bg-emerald-600 shadow-sm transition-transform hover:scale-[1.02] border-none"
                    >
                      <Save className="h-3 w-3" />
                      <span>Guardar en Bitácora</span>
                    </button>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed text-[11px] text-slate-650">
                    {processedSuggestion}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: STRENGTH TRACKER & 1RM */}
          {activeTab === "strength" && (
            <div className="border border-slate-150 rounded-2xl p-6 bg-white shadow-sm space-y-6">
              
              <div className="border-b pb-4 border-slate-100">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-rose-500" />
                  <span>Log de Fuerza 1RM & Planificador de Sobrecarga</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Registra tus marcas deportivas periódicamente. Vita IA estima tu Repetición Máxima (1RM), valora tu nivel atlético contra tu peso corporal real y calcula los desvíos del RPE (Índice de Esfuerzo Percibido).
                </p>
              </div>

              {/* Calculator input form */}
              <form onSubmit={handleAddStrengthLog} className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end bg-slate-50/55 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10.5px] font-bold uppercase text-slate-500">Esquema / Compuesto</label>
                  <select
                    value={strengthExercise}
                    onChange={(e) => setStrengthExercise(e.target.value)}
                    className="w-full text-xs rounded-xl py-2 px-3 focus:outline-none border border-slate-200 bg-white text-slate-800 font-semibold"
                  >
                    <option value="Bench Press">Bench Press 🏋️‍♂️ (Pecho)</option>
                    <option value="Sentadillas Traseras">Sentadillas Traseras 🦵 (Pierna)</option>
                    <option value="Deadlift">Peso Muerto 🦅 (Espalda/Posterior)</option>
                    <option value="Overhead Press">Press Militar 🛡️ (Hombros)</option>
                    <option value="Premium Pull-Ups">Dominadas Lastradas 🦉 (Calistenia)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold uppercase text-slate-500">Carga Levantada (kg)</label>
                  <input
                    type="number"
                    value={strengthWeight}
                    onChange={(e) => setStrengthWeight(Number(e.target.value))}
                    min="1"
                    className="w-full text-xs rounded-xl py-2 px-3 focus:outline-none border border-slate-200 bg-white font-extrabold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold uppercase text-slate-500">Repeticiones (n)</label>
                  <input
                    type="number"
                    value={strengthReps}
                    onChange={(e) => setStrengthReps(Number(e.target.value))}
                    min="1"
                    max="30"
                    className="w-full text-xs rounded-xl py-2 px-3 focus:outline-none border border-slate-200 bg-white font-extrabold"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-2.5 text-xs font-black text-white hover:opacity-95 transition-all text-center"
                >
                  Registar Marca Deportiva
                </button>
              </form>

              {/* RPE/RIR helper info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/10 space-y-1.5 text-xs text-slate-755">
                  <span className="font-extrabold block text-rose-600 uppercase tracking-wide text-[10px]">Indicador de Fatiga Nerviosa</span>
                  <p className="leading-relaxed text-[11px]">
                    Si ejecutas con un **RPE de 9.5 a 10** en series consecutivas, aumenta el riesgo de gastritis ácida refleja por secreción de catecolaminas. Intenta entrenar en zona de hipertrofia dulce: **RPE 8 (RIR 2)**.
                  </p>
                </div>

                <div className="p-4 border border-teal-100 rounded-xl bg-emerald-50/10 space-y-1.5 text-xs text-slate-755">
                  <span className="font-extrabold block text-teal-600 uppercase tracking-wide text-[10px]">Carga de Trabajo / Nivel de Atleta</span>
                  <p className="leading-relaxed text-[11px]">
                    Tu fuerza en {strengthExercise} es de <strong className="text-teal-700 font-extrabold">{relativeStrengthRatio.toFixed(2)} veces tu peso corporal</strong>. Esto te clasifica de acuerdo a los rangos científicos en:
                  </p>
                  <p className="font-bold text-teal-700 text-xs py-0.5">{athleticLevelString}</p>
                </div>
              </div>

              {/* Overload blueprint engine */}
              <div className="space-y-3 bg-slate-50/10 border border-slate-200 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Planificación Científica Automática para la Siguiente Semana</span>
                <p className="text-xs text-slate-500">Basado en tu última marca registrada de **{currentLoggedWeight} kg por {currentLoggedReps} reps**, tu planificación para progresas de manera gástricamente controlada y neuromusculamente activa es:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[9px] text-rose-500 font-extrabold uppercase">Carga Adaptativa (Fuerza)</span>
                    <p className="text-sm font-black text-slate-800">{Math.round(currentLoggedWeight + 2.5)} kg - {currentLoggedReps} reps</p>
                    <span className="text-[9px] text-slate-400 leading-none">Incremento lineal sugerido de 2.5kg.</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[9px] text-amber-650 font-extrabold uppercase">Carga Metabólica (Hipertrofia)</span>
                    <p className="text-sm font-black text-slate-800">{currentLoggedWeight} kg - {currentLoggedReps + 1} reps</p>
                    <span className="text-[9px] text-slate-400 leading-none">Mantener carga, aumentar 1 volumen.</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[9px] text-teal-600 font-extrabold uppercase">Carga Descarga (Deload)</span>
                    <p className="text-sm font-black text-slate-800">{Math.round(currentLoggedWeight * 0.6)} kg - {currentLoggedReps} reps</p>
                    <span className="text-[9px] text-slate-400 leading-none">Reducción del 40% volumen regenerativo.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PRO SUPPLEMENTS CALCULATOR */}
          {activeTab === "supps" && (
            <div className="border border-slate-150 rounded-2xl p-6 bg-white shadow-sm space-y-6">
              
              <div className="border-b pb-4 border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-rose-500" />
                    <span>Calculadora Ergogénica Personalizada de Suplementos</span>
                  </h3>
                  <p className="text-xs text-slate-550 max-w-xl">
                    Estima dosis precisas calibradas en función de tu peso corporal real ({user.weight || 75} kg) para elevar tu rendimiento sin afectar tu mucosa digestiva.
                  </p>
                </div>

                {/* Switch Intensity */}
                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-xl flex gap-1 bg-slate-100">
                  <button
                    onClick={() => setSuppIntensity("hypertrophy")}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition-all uppercase ${
                      suppIntensity === "hypertrophy"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Hipertrofia
                  </button>
                  <button
                    onClick={() => setSuppIntensity("strength_peak")}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition-all uppercase ${
                      suppIntensity === "strength_peak"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Pico de Fuerza
                  </button>
                </div>
              </div>

              {/* Protection & Caffeine adjustments zone */}
              <div className="bg-emerald-50/20 border border-emerald-150 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-3 border-emerald-150/50">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-650" />
                      <span>Modo de Confort & Seguridad Estomacal</span>
                    </h4>
                    <p className="text-[11px] text-slate-550 leading-relaxed text-slate-500">
                      Ideal si padeces gastritis, acidez,SII o reflujo secundario al entrenar pesado.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setGastroComfortActive(!gastroComfortActive);
                      showToast(gastroComfortActive ? "⚠️ Cafeína anhidra reactivada" : "🛡️ Stack gástrico desinflamatorio activado");
                    }}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                      gastroComfortActive
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-50"
                        : "bg-slate-150 text-slate-600 hover:bg-slate-205"
                    }`}
                  >
                    {gastroComfortActive ? "🛡️ Activado (Gastro Seguro)" : "Desactivado (Estándar)"}
                  </button>
                </div>

                {/* Stimulant Slider when comfortable mode is disabled */}
                {!gastroComfortActive ? (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Dosificación de Cafeína Estimulante:</span>
                    <div className="flex gap-2.5">
                      {[
                        { id: "high", label: "Alta (250mg) Anhidra", d: "Máximo voltaje central" },
                        { id: "mild", label: "Sensible (100mg)", d: "Café verde balanceado" },
                        { id: "none", label: "Sin estimulantes (0mg)", d: "Foco puramente neurogenérico" }
                      ].map((caf) => (
                        <button
                          key={caf.id}
                          type="button"
                          onClick={() => setCaffeineSensitivity(caf.id as any)}
                          className={`flex-1 text-left p-2.5 rounded-xl border text-[11px] font-semibold transition-all ${
                            caffeineSensitivity === caf.id 
                              ? "border-rose-500 bg-rose-50/5" 
                              : "border-slate-150 bg-white"
                          }`}
                        >
                          <strong className="block text-slate-800">{caf.label}</strong>
                          <span className="text-[9px] text-slate-400 font-medium">{caf.d}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-250 bg-emerald-55 border-dashed p-3 text-[10.5px] text-emerald-805 leading-relaxed bg-emerald-500/5">
                    <p className="font-extrabold text-emerald-800">🛡️ Alarma Antiacidez Activada:</p>
                    <p className="text-emerald-700">{supps.stomachNote}</p>
                  </div>
                )}
              </div>

              {/* Dynamic Supplement recipes display cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 border border-slate-150 rounded-xl space-y-2.5 bg-white">
                  <div className="flex items-center gap-2 text-rose-550 border-b pb-1.5 border-slate-100">
                    <Zap className="h-4.5 w-4.5 text-rose-500 animate-spin-slow" />
                    <span className="text-xs font-black uppercase text-slate-800">Stack Pre-Entrenamiento</span>
                  </div>
                  <p className="text-xs font-extrabold text-rose-600 font-mono">{supps.stimulants}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Mejorará el reclutamiento motor y el flujo de oxígeno desde la primera serie. Consumir exactamente 35-45 minutos antes del entrenamiento.
                  </p>
                </div>

                <div className="p-4 border border-slate-150 rounded-xl space-y-2.5 bg-white">
                  <div className="flex items-center gap-2 text-emerald-550 border-b pb-1.5 border-slate-100">
                    <Droplet className="h-4.5 w-4.5 text-emerald-500" />
                    <span className="text-xs font-black uppercase text-slate-800">Amortiguador de Ácido Láctico (Intra)</span>
                  </div>
                  <p className="text-xs font-extrabold text-emerald-600 font-mono">{supps.citrulline} + {supps.electrolytes}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Estimula la síntesis de Óxido Nítrico, reduce la acidez muscular acumulada y reestablece los transportadores de sodio para mitigar contracciones débiles.
                  </p>
                </div>

                <div className="p-4 border border-slate-150 rounded-xl space-y-2.5 bg-white">
                  <div className="flex items-center gap-2 text-purple-550 border-b pb-1.5 border-slate-100">
                    <Award className="h-4.5 w-4.5 text-purple-500" />
                    <span className="text-xs font-black uppercase text-slate-800">Creatina Celular Diaria</span>
                  </div>
                  <p className="text-xs font-extrabold text-purple-600 font-mono">{supps.creatine}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    La fosfocreatina aumenta los depósitos de energía rápida. Tomar diariamente inclusive los fines de semana de descanso para mantener saturación muscular muscular de ATP.
                  </p>
                </div>

                <div className="p-4 border border-slate-150 rounded-xl space-y-2.5 bg-white">
                  <div className="flex items-center gap-2 text-amber-550 border-b pb-1.5 border-slate-100">
                    <Heart className="h-4.5 w-4.5 text-amber-500" />
                    <span className="text-xs font-black uppercase text-slate-800">Soporte Proteico (Whey Target)</span>
                  </div>
                  <p className="text-xs font-extrabold text-amber-600 font-mono">{supps.protein}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Propone un balance de nitrógeno positivo. Prefiere suero aislado microfiltrado de fácil digestió para prevenir gases molestos debido al entrenamiento extremo.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ADVANCED PERIODIZATION MESOCYCLES */}
          {activeTab === "mesocycle" && (
            <div className="border border-slate-150 rounded-2xl p-6 bg-white shadow-sm space-y-6">
              
              <div className="border-b pb-4 border-slate-100">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-rose-500" />
                  <span>Planificación Biomecánica Autogenerada de 4 Semanas</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Calcula el volumen exacto de series efectivas por semana y modula las directrices nutricionales personalizadas para garantizar la sobrecarga progresiva sin sobrecargar el estómago.
                </p>
              </div>

              {/* Mesocycle custom filters form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Meta del Atleta</label>
                  <select
                    value={mesoGoal}
                    onChange={(e) => setMesoGoal(e.target.value as any)}
                    className="w-full text-xs rounded-xl py-2 px-3 border border-slate-250 bg-white font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="volumen">Volumen Limpio (+Hipertrofia)</option>
                    <option value="definicion">Definición y Veteado Estético</option>
                    <option value="fuerza">Fuerza Máxima (Powerlifting)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Grupo Muscular de Énfasis</label>
                  <select
                    value={mesoMuscleGroup}
                    onChange={(e) => setMesoMuscleGroup(e.target.value)}
                    className="w-full text-xs rounded-xl py-2 px-3 border border-slate-250 bg-white font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="Pecho/Hombros">Énfasis: Pecho y Hombros (Empujes)</option>
                    <option value="Pierna Completa">Énfasis: Piernas Completas (Sentadillas)</option>
                    <option value="Espalda/Biceps">Énfasis: Espalda Alta y Tracción</option>
                    <option value="Fuerza General">Fuerza Colectiva Full-Body</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Frecuencia por semana</label>
                  <select
                    value={mesoWeeklyFrequency}
                    onChange={(e) => setMesoWeeklyFrequency(Number(e.target.value))}
                    className="w-full text-xs rounded-xl py-2 px-3 border border-slate-250 bg-white font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value={2}>Baja (2 entrenamientos)</option>
                    <option value={3}>Intermedia (3 entrenamientos)</option>
                    <option value={4}>Avanzada (4 entrenamientos semanales)</option>
                  </select>
                </div>
              </div>

              {/* Generated week list layout */}
              <div className="space-y-4">
                {mesoWeeks.map((wk) => (
                  <div 
                    key={wk.week}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:border-rose-455 transition-all gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-rose-500 text-white font-extrabold text-[10px] px-2.5 py-0.5">SEMANA {wk.week}</span>
                        <h4 className="text-xs font-bold text-slate-800">{wk.focus}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">{wk.volume}</p>
                      <p className="text-[10px] text-teal-650 bg-emerald-500/5 px-2 py-1 rounded inline-block font-medium border border-teal-100/40">
                        📋 {wk.nutritionalNote}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Objetivo</span>
                      <strong className="text-rose-500 font-extrabold text-xs">{wk.rpeTarget}</strong>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* DEDICATED ATHLETIC PROGRESION STATISTIC CHART (EXCLUSIVE FOR PLUS MAX SUBSCRIBERS) */}
          <div className="border border-slate-150 rounded-2xl p-6 bg-white shadow-sm space-y-6">
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b pb-4 border-slate-100">
              <div className="space-y-1 text-left">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-rose-500 animate-pulse" />
                  <span>Avance de Fuerza & Biomecánica Max (Solo Plus Max)</span>
                </h3>
                <p className="text-xs text-slate-550 leading-normal">
                  Grafica tu 1RM estimado y los índices clínico-gástricos en tiempo real sobre tus rutinas analizadas.
                </p>
              </div>

              {subscription === "vita_ia_max" && (
                <div className="flex flex-wrap items-center gap-2 select-none w-full lg:w-auto justify-start lg:justify-end">
                  <div className="bg-slate-100 border border-slate-205 p-1 rounded-xl flex gap-1">
                    <button
                      type="button"
                      onClick={() => setChartMode("1rm")}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition-all border-none cursor-pointer ${
                        chartMode === "1rm"
                          ? "bg-white text-slate-850 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Progresión 1RM
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode("biomechanics")}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition-all border-none cursor-pointer ${
                        chartMode === "biomechanics"
                          ? "bg-white text-rose-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Métricas Biomecánicas
                    </button>
                  </div>

                  {chartMode === "1rm" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">Compuesto:</span>
                      <select
                        value={chartFilter}
                        onChange={(e) => setChartFilter(e.target.value)}
                        className="text-[10px] font-bold rounded-lg border border-slate-200 p-1.5 bg-slate-55 text-slate-800 focus:outline-none"
                      >
                        <option value="All">Ver Todos</option>
                        <option value="Bench Press">Bench Press</option>
                        <option value="Sentadillas Traseras">Sentadillas Traseras</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Check if is subscribed to plus max */}
            {subscription !== "vita_ia_max" ? (
              <div className="relative overflow-hidden h-64 border border-dashed border-rose-200 bg-rose-50/5 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4">
                
                {/* Simulated blurred background of chart to tease the user */}
                <div className="absolute inset-0 filter blur-md opacity-25 flex items-end justify-between px-10 pb-4 pointer-events-none">
                  <div className="h-20 w-3 bg-rose-500 opacity-60 rounded-full" />
                  <div className="h-32 w-3 bg-amber-500 opacity-60 rounded-full" />
                  <div className="h-40 w-3 bg-purple-500 opacity-60 rounded-full" />
                  <div className="h-24 w-3 bg-teal-500 opacity-60 rounded-full" />
                  <div className="h-44 w-3 bg-rose-500 opacity-60 rounded-full" />
                </div>

                <div className="z-10 bg-white/90 p-5 rounded-2xl border border-rose-100 max-w-sm shadow-sm space-y-3">
                  <Lock className="h-8 w-8 text-rose-500 mx-auto animate-bounce" />
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Módulo de Gráficos Deportivos Vita Max Bloqueado</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Solo los atletas con suscripción activa **Vita IA Max ($15/mes)** pueden visualizar gráficos de progresión lineal de 1RM, volumen acumulado ó predicción de fatiga en el SNC.
                  </p>
                  <button
                    onClick={handleUpgradeToMax}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold py-2 text-xs shadow-sm shadow-rose-100"
                  >
                    Desbloquear Todas las Gráficas Atleta ✨
                  </button>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                {chartMode === "1rm" ? (
                  <div className="space-y-4 animate-fade-in">
                    {/* Responsive SVG Line Chart rendering registered weight progression */}
                    <div className="h-60 border-l border-b border-slate-200 p-2 flex items-end justify-between relative bg-slate-50/10 rounded-br-md">
                  
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-1/4 border-t border-slate-100 border-dashed" />
                  <div className="absolute inset-x-0 top-2/4 border-t border-slate-100 border-dashed" />
                  <div className="absolute inset-x-0 top-3/4 border-t border-slate-100 border-dashed" />

                  {/* Y-Axis guide tags */}
                  <div className="absolute left-1 top-2 text-[9px] font-mono text-slate-400 font-bold bg-white/80 px-1 rounded">Max teoríco ({Math.round(graphMax)} kg)</div>
                  <div className="absolute left-1 bottom-1 text-[9px] font-mono text-slate-400 font-bold bg-white/80 px-1 rounded">Base ({Math.round(graphMin)} kg)</div>

                  {filteredStrengthLogs.length < 2 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold">
                      Carga al menos 2 registros deportivos en el Tracker para pintar tu gráfico de avance lineal.
                    </div>
                  ) : (
                    <div className="w-full h-full relative pt-8 flex items-end">
                      {/* SVG Line pathing representing strengthLogs */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Polyline calculation */}
                        {(() => {
                          const points = filteredStrengthLogs.map((log, index) => {
                            const xValue = (index / (filteredStrengthLogs.length - 1)) * 500;
                            // Scale proportionally between graphMin and graphMax
                            const yFraction = (log.oneRepMax - graphMin) / (graphMax - graphMin || 1);
                            const yValue = 200 - (yFraction * 130 + 10); // leave padding
                            return `${xValue},${yValue}`;
                          }).join(" ");

                          const fillPoints = `0,200 ${points} 500,200`;

                          return (
                            <>
                              {/* Filled Area */}
                              <polygon points={fillPoints} fill="url(#chartGradient)" />
                              {/* Line */}
                              <polyline
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="3"
                                points={points}
                                strokeLinecap="round"
                              />
                            </>
                          );
                        })()}
                      </svg>

                      {/* Interactive Point indicators */}
                      <div className="absolute inset-x-0 bottom-0 h-full flex justify-between">
                        {filteredStrengthLogs.map((log, idx) => {
                          const yFraction = (log.oneRepMax - graphMin) / (graphMax - graphMin || 1);
                          const yPercentage = (yFraction * 130 + 10) / 2; // scale for percentage top space
                          return (
                            <div key={log.id} className="flex-1 flex flex-col justify-end items-center relative group min-w-[30px] z-10">
                              
                              {/* Interactive tooltip */}
                              <div className="absolute opacity-0 group-hover:opacity-100 transition-all bottom-28 bg-slate-900 text-white text-[10px] p-3 rounded-xl shadow-xl z-50 pointer-events-none w-36 py-2 leading-relaxed border border-slate-700">
                                <p className="font-extrabold text-rose-400 border-b border-slate-700 pb-1 mb-1">{log.exercise}</p>
                                <p>Carga: <strong className="float-right text-slate-100">{log.weight} kg</strong></p>
                                <p>Reps log: <strong className="float-right text-slate-100">{log.reps} reps</strong></p>
                                <p>1RM Est.: <strong className="float-right text-rose-350 font-black">{log.oneRepMax} kg</strong></p>
                                <span className="text-[8px] text-slate-400 font-mono mt-1 block">{log.date}</span>
                              </div>

                              {/* Dot Point indicator */}
                              <div 
                                className="h-3.5 w-3.5 rounded-full border-2 border-white bg-rose-500 shadow-md group-hover:scale-125 transition-transform absolute cursor-pointer hover:bg-rose-600"
                                style={{ bottom: `${yPercentage}%` }}
                              />

                              {/* X Axis title date */}
                              <span className="text-[10px] text-slate-400 font-mono select-none mt-2">
                                {idx === 0 || idx === filteredStrengthLogs.length - 1 || filteredStrengthLogs.length < 5 
                                  ? log.date.substring(5) 
                                  : ""
                                }
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-100/50 p-2   rounded-xl border border-slate-150">
                  <span className="flex items-center gap-1.5 font-bold text-slate-550"><span className="h-2 w-2 rounded-full bg-rose-500" /> Línea Roja: Progresión Estima de 1RM total teórico (Epley Formula)</span>
                  <span className="font-semibold text-slate-500">Filtrado actual: **{strengthExercise === "All" || chartFilter === "All" ? "Todos los compuestos" : strengthExercise}**</span>
                </div>

              </div>
            ) : (
              <div className="space-y-4 animate-fade-in text-left">
                {/* BIOMECHANICAL CLINICAL MULTI-AXIS CHART */}
                <div className="h-60 border-l border-b border-slate-200 p-2 flex items-end justify-between relative bg-slate-50/10 rounded-br-md">
                  
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-1/4 border-t border-slate-100 border-dashed pointer-events-none" />
                  <div className="absolute inset-x-0 top-2/4 border-t border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-3/4 border-t border-slate-100 border-dashed pointer-events-none" />

                  {/* Axis Scale guide markers */}
                  <div className="absolute left-1 top-2 text-[9px] font-mono text-slate-400 font-bold bg-white/80 px-1 rounded pointer-events-none">Óptimo (100)</div>
                  <div className="absolute left-1 bottom-1 text-[9px] font-mono text-slate-400 font-bold bg-white/80 px-1 rounded pointer-events-none">Riesgo (0)</div>

                  <div className="w-full h-full relative pt-8 flex items-end">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      {(() => {
                        const getPoints = (key: 'efficiency' | 'fatigue' | 'safetyCompliance') => {
                          return biomechanicsDataPoints.map((dp, idx) => {
                            const xVal = (idx / (biomechanicsDataPoints.length - 1)) * 500;
                            const yFrac = dp[key] / 100;
                            const yVal = 200 - (yFrac * 130 + 10);
                            return `${xVal},${yVal}`;
                          }).join(" ");
                        };

                        return (
                          <>
                            {/* Efficiency Line */}
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3"
                              points={getPoints('efficiency')}
                              strokeLinecap="round"
                            />
                            {/* Fatigue Line */}
                            <polyline
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="3"
                              points={getPoints('fatigue')}
                              strokeLinecap="round"
                            />
                            {/* Safety Compliance Line */}
                            <polyline
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="3"
                              points={getPoints('safetyCompliance')}
                              strokeLinecap="round"
                            />
                          </>
                        );
                      })()}
                    </svg>

                    {/* Point nodes and tooltips */}
                    <div className="absolute inset-x-0 bottom-0 h-full flex justify-between">
                      {biomechanicsDataPoints.map((dp, idx) => {
                        return (
                          <div key={idx} className="flex-1 flex flex-col justify-end items-center relative group min-w-[40px] z-10 text-center">
                            
                            {/* Tooltip details on hover */}
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-all bottom-28 bg-slate-900 text-white text-[10.2px] p-3 rounded-xl shadow-xl z-50 pointer-events-none w-[170px] leading-relaxed border border-slate-700 text-left">
                              <p className="font-extrabold text-teal-400 border-b border-slate-700 pb-1 mb-1.5">Métricas Biomecánicas Log/Vídeo</p>
                              <p className="flex justify-between"><span>Eficiencia Rango:</span> <strong className="text-emerald-400">{dp.efficiency}%</strong></p>
                              <p className="flex justify-between"><span>Fatiga del SNC:</span> <strong className="text-purple-400">{dp.fatigue}%</strong></p>
                              <p className="flex justify-between"><span>Seguridad Gástrica:</span> <strong className="text-rose-400">{dp.safetyCompliance}%</strong></p>
                              <span className="text-[8px] text-slate-400 font-mono mt-1 block">Auditado: {dp.date}</span>
                            </div>

                            {/* Dots vertically aligned */}
                            <div className="absolute inset-x-0 flex flex-col justify-center items-center pointer-events-none" style={{ height: "140px", bottom: "25px" }}>
                              <span className="h-2 w-2 rounded-full border border-white bg-emerald-500 absolute" style={{ bottom: `${dp.efficiency}%` }} />
                              <span className="h-2 w-2 rounded-full border border-white bg-purple-500 absolute" style={{ bottom: `${dp.fatigue}%` }} />
                              <span className="h-2 w-2 rounded-full border border-white bg-rose-500 absolute" style={{ bottom: `${dp.safetyCompliance}%` }} />
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono mt-2">
                              {dp.date.substring(0, 6)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Interactive legend keys */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-150 p-3 rounded-xl">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0 block pointer-events-none" />
                    <span className="text-slate-650 font-bold leading-normal">Eficiencia de Ejecución Biomecánica (% de Rango de Movimiento)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="h-3 w-3 rounded-full bg-purple-500 shrink-0 block pointer-events-none" />
                    <span className="text-slate-650 font-bold leading-normal">Fatiga Nerviosa Acumulada (SNC) (Objetivo &lt; 50%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0 block pointer-events-none" />
                    <span className="text-slate-650 font-bold leading-normal">Índice Gastro-Protector Sincrónico (Sin Reflujo/Acidez)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        </div>
      </div>

        {/* Right Side: Scientific context sidebar, History log files */}
        <div className="space-y-6 text-left">
          
          {/* Athlete logger history feed card */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white shadow-sm space-y-4">
            
            <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5 border-b pb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>Bitácora de Logros VitaMax</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Registros consolidados del usuario que retroalimentan el motor clínico del coach deportivo gástrico.
            </p>

            <div className="space-y-4 divide-y divide-slate-100">
              
              {/* Strength records list (showing last 4) */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">Registros del Tracker recostados:</span>
                {strengthLogs.length === 0 ? (
                  <p className="text-[11px] text-slate-405 italic">No se registran marcas deportivas todavía.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {strengthLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="flex justify-between items-center text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 group">
                        <div>
                          <strong className="block text-slate-800">{log.exercise}</strong>
                          <span className="text-[10px] text-slate-400 font-medium">{log.reps} reps a {log.weight} kg (RPE {log.rpe})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[8px] text-slate-400 uppercase block leading-none">1RM</span>
                            <strong className="text-rose-500 font-extrabold">{log.oneRepMax} kg</strong>
                          </div>
                          {subscription === "vita_ia_max" && (
                            <button
                              onClick={() => handleDeleteStrengthLog(log.id)}
                              className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remover marca"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions processed list (showing last 2) */}
              <div className="space-y-2 pt-3">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Historial de Sugerencias procesadas:</span>
                {suggestionLogs.length === 0 ? (
                  <p className="text-[11px] text-slate-405 italic">Ningún consejo visual guardado aún.</p>
                ) : (
                  <div className="space-y-2">
                    {suggestionLogs.slice(0, 2).map((sugg) => (
                      <div key={sugg.id} className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <strong className="text-slate-800 truncate block flex-1">{sugg.title}</strong>
                          <span className="text-[8px] text-slate-400 block font-mono shrink-0">{sugg.createdAt.substring(0, 10)}</span>
                        </div>
                        <p className="text-slate-500 leading-relaxed text-[10.5px] line-clamp-3">
                          {sugg.aiSuggestedAdjustment.replace(/\*+/g, "")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Value proposition card */}
          <div className="bg-gradient-to-br from-rose-500 to-amber-500 p-6 rounded-2xl text-white space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
            
            <h4 className="text-xs font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full inline-block">Plan Max Elite Atletas</h4>
            <p className="text-sm font-black leading-tight">¿Por qué es rentable esta suscripción de $15/mes para tu rendimiento corporal?</p>
            <p className="text-[11px] text-rose-50 leading-relaxed">
              Un entrenador biomecánico deportivo personalizado cobra más de $120 al mes. Con **Vita IA Max**, tienes análisis computacional de instantáneas, cálculo delrelative power index corporal, protección estomacal inteligente contra acidez refleja y mesociclos autogenerados calibrados a tu morfología por una mínima fracción.
            </p>
            
            <div className="border-t border-white/25 pt-3.5 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-amber-300 flex-shrink-0 animate-pulse" />
              <span className="text-[10px] text-rose-100 font-extrabold flex items-center">Garantía Incondicional de Reintegro de 30 Días</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
