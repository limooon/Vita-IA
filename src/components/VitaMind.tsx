import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "../types";
import { 
  Brain, 
  Wind, 
  Sparkles, 
  ArrowLeft, 
  Send, 
  Activity, 
  User, 
  BookOpen, 
  Music, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  Loader2, 
  Smile, 
  HelpCircle,
  Coffee,
  Frown,
  Zap,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VitaMindProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function VitaMind({ user, onViewChange }: VitaMindProps) {
  const isPremium = user.subscriptionStatus === "premium";
  // Psychological states
  const [activeFeeling, setActiveFeeling] = useState<string>("stress_laboral");
  const [activeFeelingAdvice, setActiveFeelingAdvice] = useState<any | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);

  // CBT thought restructuring states
  const [thoughtInput, setThoughtInput] = useState<string>("");
  const [thoughtResult, setThoughtResult] = useState<any | null>(null);
  const [analyzingThought, setAnalyzingThought] = useState<boolean>(false);

  // Audio Synthesizer states
  const [isSynthPlaying, setIsSynthPlaying] = useState<boolean>(false);
  const [selectedFreq, setSelectedFreq] = useState<number>(432); // 432Hz (Cosmic) or 528Hz (Transformation)
  const [soundType, setSoundType] = useState<"binaural" | "white_noise" | "solfeggio">("binaural");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{
    osc1?: OscillatorNode;
    osc2?: OscillatorNode;
    gainNode?: GainNode;
    noiseNode?: AudioWorkletNode | ScriptProcessorNode;
  }>({});

  // Breathing Engine states
  const [breathingMode, setBreathingMode] = useState<"box" | "relax" | "resonance">("box");
  const [breathingPhase, setBreathingPhase] = useState<"Inhala" | "Retén" | "Exhala" | "Espera">("Inhala");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick Mental Micro-doses Completion tracker
  const [completedMicroDoses, setCompletedMicroDoses] = useState<Record<string, boolean>>({});

  const feelingsDb: Record<string, { label: string; icon: any; defaultAdvice: any }> = {
    stress_laboral: {
      label: "Estrés Laboral / Burnout",
      icon: Zap,
      defaultAdvice: {
        psychological_insight: "La rumiación mental y presión laboral estimulan una secreción desmedida de catecolaminas. Esto provoca un vaciamiento gástrico acelerado o el espasmo repentino del intestino tensional posterior.",
        recommendations: [
          "Baja los párpados un 80%, exhala suspirando doble vez por la boca para forzar una respuesta vagal inmediata.",
          "Masajea tus sienes y la mandíbula inferior circularmente por 90 segundos desarticulando el estrés retenido.",
          "Escribe tus tres tareas ineludibles de hoy; acepta delegar o aplazar temporalmente las restantes sin culpa."
        ],
        breathing_pattern: "Respiración de Caja (Inhala 4s, Retén 4s, Exhala 4s, Espera 4s)",
        mantra: "Hago lo que está en mis manos en este momento; el descanso también es productivo."
      }
    },
    ansiedad: {
      label: "Ansiedad o Pensamiento Acelerado",
      icon: Smile,
      defaultAdvice: {
        psychological_insight: "El pánico corporal desvía el flujo circulatorio de las vísceras hacia los músculos motores periféricos. Esta isquemia parcial enmascara calambres, hinchazón y cólicos dolorosos.",
        recommendations: [
          "Elige 3 objetos de color azul cercanos, 2 sonidos del presente y una sensación táctil real (Método de Anclaje 3-2-1).",
          "Moja tus muñecas y nuca con agua fresca para reactivar el reflejo de inmersión y de-escalar las pulsaciones cardíacas.",
          "Bebe lentamente tres sorbos de agua templada, sintiendo de forma hiper-consciente su paso por la garganta."
        ],
        breathing_pattern: "Método 4-7-8 (Inhala 4s, Retén 7s, Exhala largo 8s)",
        mantra: "Estoy a salvo en este instante de transición. Mi cuerpo solo procesa energías habituales."
      }
    },
    insomnio: {
      label: "Insomnio e Hiperactividad Mental",
      icon: Moon,
      defaultAdvice: {
        psychological_insight: "La melatonina es desplazada de forma agresiva por la adrenalina tensional nocturna. Tu colon se desregula y estimula espasmos nocturnos que impiden un sueño reparador.",
        recommendations: [
          "Mantén el cuarto en oscuridad integral y retira el teléfono móvil de tu alcance de inmediato.",
          "Coloca una mano suave sobre tu estómago y respira sintiéndola subir y bajar para reorientar tu foco neural al abdomen.",
          "Haz un conteo regresivo mental del 100 al 0, restando 3 dígitos en cada paso secuencialmente."
        ],
        breathing_pattern: "Método 4-7-8 para apaciguamiento sináptico nocturno",
        mantra: "Suelto la obligación de resolver; hoy ya se resolvió todo lo que correspondía."
      }
    },
    abatimiento: {
      label: "Ánimo Decaído o Abatimiento",
      icon: Frown,
      defaultAdvice: {
        psychological_insight: "La baja motilidad digestiva y disbiosis suelen correlacionar con un desplome del triptófano, materia prima para sintetizar el 90% de la serotonina corporal en el aparato digestivo.",
        recommendations: [
          "Abre las cortinas para capturar luz solar directa por unos minutos regulando la dopamina corporal sana.",
          "Estira suavemente tus brazos hacia arriba, abriendo el pecho y respirando hondo sin tensiones.",
          "Escucha o lee un párrafo estimulante de gratitud sobre tres pequeños privilegios del presente."
        ],
        breathing_pattern: "Respiración de Resonancia (Inhala 5s, Exhala 5s)",
        mantra: "Me permito avanzar un paso a la vez, con ternura hacia mis propios procesos de sanación."
      }
    }
  };

  // Soundscape audio synthesizer mechanics
  const stopSynthesis = () => {
    try {
      if (synthNodesRef.current.osc1) {
        synthNodesRef.current.osc1.stop();
        synthNodesRef.current.osc1.disconnect();
      }
      if (synthNodesRef.current.osc2) {
        synthNodesRef.current.osc2.stop();
        synthNodesRef.current.osc2.disconnect();
      }
      if (synthNodesRef.current.gainNode) {
        synthNodesRef.current.gainNode.disconnect();
      }
      if (synthNodesRef.current.noiseNode) {
        synthNodesRef.current.noiseNode.disconnect();
      }
      setIsSynthPlaying(false);
    } catch (e) {
      console.warn("Synth stop error:", e);
    }
  };

  const startSynthesis = () => {
    stopSynthesis();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        alert("Tu navegador no soporta sintetizador de audio nativo.");
        return;
      }
      
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.08, ctx.currentTime); // Low elegant volume prevent spikes
      mainGain.connect(ctx.destination);
      synthNodesRef.current.gainNode = mainGain;

      if (soundType === "binaural") {
        // Left ear oscillator
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(selectedFreq, ctx.currentTime);
        
        // Right ear oscillator (slightly detuned by 4Hz to produce theta binaural waves)
        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(selectedFreq + 4.5, ctx.currentTime);

        const panner1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const panner2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        if (panner1 && panner2) {
          panner1.pan.setValueAtTime(-1, ctx.currentTime);
          panner2.pan.setValueAtTime(1, ctx.currentTime);
          osc1.connect(panner1).connect(mainGain);
          osc2.connect(panner2).connect(mainGain);
        } else {
          osc1.connect(mainGain);
          osc2.connect(mainGain);
        }

        osc1.start();
        osc2.start();
        synthNodesRef.current.osc1 = osc1;
        synthNodesRef.current.osc2 = osc2;

      } else if (soundType === "solfeggio") {
        // Pure single Solfeggio frequency
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(selectedFreq, ctx.currentTime);
        osc1.connect(mainGain);
        osc1.start();
        synthNodesRef.current.osc1 = osc1;

      } else if (soundType === "white_noise") {
        // Math generated aesthetic white noise to bypass missing browser files
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        // Connect through a bandpass filter to make it softer (pink rain noise vibe)
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 500;
        filter.Q.value = 0.5;

        whiteNoise.connect(filter).connect(mainGain);
        whiteNoise.start();
        synthNodesRef.current.osc1 = whiteNoise as unknown as OscillatorNode;
      }

      setIsSynthPlaying(true);
    } catch (e) {
      console.error("Synthesizer launch failed:", e);
    }
  };

  // Synth effect when variables change
  useEffect(() => {
    if (isSynthPlaying) {
      startSynthesis();
    }
  }, [selectedFreq, soundType]);

  // Clean up synth on unmount
  useEffect(() => {
    return () => {
      stopSynthesis();
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, []);

  // Fetch AI Feeling guidance under current selection
  const fetchFeelingAdvice = async (feelingKey: string) => {
    setLoadingAdvice(true);
    try {
      const response = await fetch("/api/mind-zen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "zen_advice",
          currentFeeling: feelingsDb[feelingKey]?.label || feelingKey
        })
      });
      const data = await response.json();
      if (data.success) {
        setActiveFeelingAdvice(data);
      } else {
        setActiveFeelingAdvice(null);
      }
    } catch (e) {
      console.error(e);
      setActiveFeelingAdvice(null);
    } finally {
      setLoadingAdvice(false);
    }
  };

  useEffect(() => {
    fetchFeelingAdvice(activeFeeling);
    setCompletedMicroDoses({});
  }, [activeFeeling]);

  // Handle CBT AI query
  const handleAnalyzeCbt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtInput.trim()) return;

    setAnalyzingThought(true);
    setThoughtResult(null);
    try {
      const resp = await fetch("/api/mind-zen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cbt_reframe",
          thought: thoughtInput.trim()
        })
      });
      const data = await resp.json();
      if (data.success) {
        setThoughtResult(data);
      } else {
        setThoughtResult({
          reframed: "Acepto este desafío un instante a la vez; puedo tolerar el agobio presente.",
          clinical_commentary: "No pudimos conectar con el consultorio clínico avanzado por ahora. Recuerda que no todo lo que piensas es un hecho objetivo.",
          breathing_technique: "Respiración Diafragmática (Inhalar desinflando hombros)"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingThought(false);
    }
  };

  // Brief chime sound synthesizer when breathing targets change phase
  const playPhaseChime = (phase: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      
      const frequencies: Record<string, number> = {
        "Inhala": 528, // Clear repair frequency
        "Retén": 396,  // Release stress frequency
        "Exhala": 432, // Soft earth cosmic
        "Espera": 340  // Dark grounding tone
      };

      osc.frequency.setValueAtTime(frequencies[phase] || 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  // Breathing loop configuration
  useEffect(() => {
    if (isBreathingActive) {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      playPhaseChime(breathingPhase);

      breathingTimerRef.current = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            // Change phase based on configuration rhythm
            let nextPhase: typeof breathingPhase = "Inhala";
            let nextDuration = 4;

            if (breathingMode === "box") {
              // 4-4-4-4
              if (breathingPhase === "Inhala") { nextPhase = "Retén"; nextDuration = 4; }
              else if (breathingPhase === "Retén") { nextPhase = "Exhala"; nextDuration = 4; }
              else if (breathingPhase === "Exhala") { nextPhase = "Espera"; nextDuration = 4; }
              else { nextPhase = "Inhala"; nextDuration = 4; }
            } else if (breathingMode === "relax") {
              // 4-7-8
              if (breathingPhase === "Inhala") { nextPhase = "Retén"; nextDuration = 7; }
              else if (breathingPhase === "Retén") { nextPhase = "Exhala"; nextDuration = 8; }
              else { nextPhase = "Inhala"; nextDuration = 4; } // Skip "espera" for 4-7-8
            } else {
              // 5-0-5 (Resonancia)
              if (breathingPhase === "Inhala") { nextPhase = "Exhala"; nextDuration = 5; }
              else { nextPhase = "Inhala"; nextDuration = 5; }
            }

            setBreathingPhase(nextPhase);
            playPhaseChime(nextPhase);
            return nextDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathingTimerRef.current) {
        clearInterval(breathingTimerRef.current);
        breathingTimerRef.current = null;
      }
    }

    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, [isBreathingActive, breathingPhase, breathingMode]);

  // Safe fallback if advice states are loading
  const currentAdvice = activeFeelingAdvice || feelingsDb[activeFeeling]?.defaultAdvice;

  // Render variables for expanding circles
  const getCircleScaleClass = () => {
    if (!isBreathingActive) return "scale-80 bg-emerald-100 border-emerald-200";
    if (breathingPhase === "Inhala") return "scale-115 bg-emerald-200 border-emerald-300 duration-4000";
    if (breathingPhase === "Retén") return "scale-115 bg-teal-200 border-teal-300 duration-1000";
    if (breathingPhase === "Exhala") return "scale-75 bg-slate-200 border-slate-300 duration-4000";
    return "scale-75 bg-amber-50 border-amber-200 duration-1000";
  };

  if (!isPremium) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="vitamind-paywall-gate">
        {/* Return Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => onViewChange("dashboard")}
            className="font-mono text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Volver al Dashboard</span>
          </button>
        </div>

        {/* Playful paywall layout */}
        <div className="rounded-3xl border border-indigo-100 bg-white p-8 md:p-12 text-center space-y-6 max-w-md mx-auto shadow-sm">
          <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-650 animate-pulse">
            <Brain className="h-8 w-8 text-indigo-500" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold py-0.5 px-3 rounded-full uppercase tracking-widest border border-indigo-250 inline-block font-mono">
              Módulo Plus (Mind Performance)
            </span>
            <h3 className="text-xl font-bold text-slate-850">
              Bienestar Mental y Registro Emocional
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Regula tu sistema autónomo, mitiga el cortisol elevado y alivia el eje intestino-cerebro mediante biofeedback respiratorio avanzado, terapia cognitiva racional (CBT), y sonidos de resonancia solfeggio.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-3">
            <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider block font-mono">
              Desbloquea VitaMind con Plus:
            </span>
            <ul className="space-y-2 text-xs text-slate-650">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">🧠</span>
                <span><strong>Mind Performance:</strong> Psicoterapia cognitiva para gases e inflamación por estrés.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">🌬️</span>
                <span><strong>Biofeedback respiratorio:</strong> Técnicas tensionales 4-7-8, de Caja y Coherencia.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">🎵</span>
                <span><strong>Sintetizador en Vivo:</strong> Ondas binaurales y solfeggio (432Hz y 528Hz).</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onViewChange("premium")}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 text-xs font-extrabold text-white transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>Desbloquear con Vita IA Plus</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" id="vitamind-main-wrapper">
      
      {/* Return Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => onViewChange("dashboard")}
          className="font-mono text-slate-450 hover:text-slate-800 transition-colors flex items-center gap-1 font-bold"
          id="vitamind-back-btn"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Volver al Dashboard</span>
        </button>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-xs font-mono font-bold text-slate-500">VitaMind IA</span>
      </div>

      {/* Hero Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600 animate-pulse" />
            <span>VitaMind: Espacio Decompresión Psicológica IA</span>
          </h2>
          <p className="text-sm text-slate-500">
            Regula tu sistema nervioso, disminuye el cortisol y calma el eje intestino-cerebro mediante biofeedback respiratorio, sonidos de resonancia y terapia cognitiva con IA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Main Stress check-in, Auditory, and respiration */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Psychological Check-in Section */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              <span>1. Consulta de Estado Emocional y Somático</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.keys(feelingsDb).map((key) => {
                const feel = feelingsDb[key];
                const Icon = feel.icon;
                const isSelected = activeFeeling === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveFeeling(key);
                      setBreathingPhase("Inhala");
                      setPhaseSecondsLeft(4);
                    }}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                      isSelected 
                        ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 font-bold" 
                        : "bg-white border-slate-100 hover:bg-slate-50 text-slate-650"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-50 text-slate-400"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] leading-tight block">{feel.label}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Medical/Psychological Axis Insight */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {loadingAdvice ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-400 justify-center">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-500" />
                  <span>Sincronizando diagnóstico clínico del eje gut-brain...</span>
                </div>
              ) : currentAdvice ? (
                <div className="space-y-3.5 animate-fade-in">
                  <div>
                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block font-mono">
                      🧬 Correlación Fisiológica (Eje Cerebro-Intestino)
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {currentAdvice.psychological_insight}
                    </p>
                  </div>
                  
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">
                      💆 Acciones de Mitigación Práctica (Sugeridas para Hoy)
                    </span>
                    <div className="space-y-2 mt-2">
                      {currentAdvice.recommendations?.map((rec: string, rIndex: number) => {
                        const checkKey = `${activeFeeling}_${rIndex}`;
                        const isCompleted = !!completedMicroDoses[checkKey];
                        return (
                          <label key={rIndex} className="flex items-start gap-2.5 cursor-pointer group text-xs">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => {
                                setCompletedMicroDoses(prev => ({ ...prev, [checkKey]: !prev[checkKey] }));
                              }}
                              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                            />
                            <span className={`text-xs leading-relaxed ${isCompleted ? "text-slate-400 line-through" : "text-slate-700 group-hover:text-slate-900"}`}>
                              {rec}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2.5 border-t border-slate-100 items-start sm:items-center justify-between text-[11px] leading-snug">
                    <div className="text-slate-500">
                      🎯 <strong>Mantra de Enfoque Pleno:</strong> <span className="text-indigo-950 font-semibold font-serif italic">"{currentAdvice.mantra}"</span>
                    </div>
                    {currentAdvice.breathing_pattern && (
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] rounded-full font-bold uppercase shrink-0">
                        {currentAdvice.breathing_pattern.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* 2. Interactive Breathing Engine */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Wind className="h-4.5 w-4.5 text-emerald-500" />
              <span>2. Entrenador de Respiración Diafragmática con Biofeedback</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left configurations */}
              <div className="md:col-span-5 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Utiliza las pausas respiratorias para re-sintonizar el ritmo respiratorio cardíaco celular directo:
                </p>

                <div className="space-y-2">
                  {[
                    { id: "box", label: "Práctica de Caja (4-4-4-4)", desc: "Estabiliza el estrés agudo y ansiedad" },
                    { id: "relax", label: "Calma Profunda 4-7-8", desc: "Reduce taquicardia y asienta el sueño" },
                    { id: "resonance", label: "Resonancia Coherente 5-5", desc: "Armoniza el sistema autónomo global" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setBreathingMode(mode.id as any);
                        setIsBreathingActive(false);
                        setBreathingPhase("Inhala");
                        setPhaseSecondsLeft(mode.id === "box" ? 4 : mode.id === "relax" ? 4 : 5);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                        breathingMode === mode.id
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold"
                          : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className="block">{mode.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">{mode.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsBreathingActive(!isBreathingActive);
                      if (!isBreathingActive) {
                        setPhaseSecondsLeft(breathingMode === "box" ? 4 : breathingMode === "relax" ? 4 : 5);
                        setBreathingPhase("Inhala");
                      }
                    }}
                    className={`w-full font-bold text-xs py-2 rounded-xl transition shadow-sm border ${
                      isBreathingActive
                        ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800"
                        : "bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white"
                    }`}
                  >
                    {isBreathingActive ? "⏹ Detener Práctica" : "▶️ Iniciar Respiración Guiada"}
                  </button>
                </div>
              </div>

              {/* Right: Circle dynamic visual feedback */}
              <div className="md:col-span-7 flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative overflow-hidden min-h-[260px]">
                
                {/* Visual pulsating background ripples */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className={`rounded-full border-2 border-emerald-400 h-44 w-44 transition-transform duration-3000 ${isBreathingActive ? "animate-ping" : ""}`} />
                </div>

                <div className="relative z-10 flex flex-col items-center space-y-4">
                  
                  {/* Expanding Respiratory Circle element */}
                  <div 
                    className={`h-24 w-24 rounded-full border-3 flex flex-col items-center justify-center transition-all shadow-inner relative transform ${getCircleScaleClass()}`}
                  >
                    <span className="text-sm font-extrabold text-slate-800 font-mono tracking-wide">{phaseSecondsLeft}s</span>
                  </div>

                  <div className="text-center space-y-1">
                    <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 font-mono">
                      {isBreathingActive ? breathingPhase : "Listo para iniciar"}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {isBreathingActive 
                        ? (breathingPhase === "Inhala" ? "Expande el abdomen lentamente" : breathingPhase === "Retén" ? "Mantén el aire con calma" : breathingPhase === "Exhala" ? "Suelta el aire con siseo largo" : "Espera vacío un momento")
                        : "Coloca tu cuerpo en postura cómoda"}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-mono text-slate-350 uppercase">Síntesis de Audio Transición Activa</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Column 3: CBT thoughts panel and Audio Synthesizer */}
        <div className="space-y-6">

          {/* 3. Real-time Soundscape Synthesizer (Sintetizador Binaural) */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1 border-b border-slate-50 pb-2">
              <Music className="h-4 w-4 text-indigo-500" />
              <span>Sintetizador Zen de Frecuencias</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Genera frecuencias vibracionales acústicas en tiempo real mediante el sintetizador integrado de tu navegador:
            </p>

            <div className="space-y-3 pt-1">
              {/* Type Select */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                {[
                  { id: "binaural", label: "Ondas Binaurales" },
                  { id: "solfeggio", label: "Frecuencia Solar" },
                  { id: "white_noise", label: "Ruido Blanco" }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSoundType(type.id as any)}
                    className={`py-1 rounded-lg border text-center transition ${
                      soundType === type.id 
                        ? "bg-slate-800 border-slate-800 text-white font-mono" 
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Frequency selection only visible for oscillators */}
              {soundType !== "white_noise" && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button
                    onClick={() => setSelectedFreq(432)}
                    className={`py-1 px-2 rounded-lg border flex flex-col items-center justify-center transition ${
                      selectedFreq === 432 ? "border-indigo-400 bg-indigo-50/50 text-indigo-950 font-bold" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span>432 Hz</span>
                    <span className="text-[8px] text-slate-400 font-normal italic">Cosmos y Armonía</span>
                  </button>
                  <button
                    onClick={() => setSelectedFreq(528)}
                    className={`py-1 px-2 rounded-lg border flex flex-col items-center justify-center transition ${
                      selectedFreq === 528 ? "border-indigo-400 bg-indigo-50/50 text-indigo-950 font-bold" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span>528 Hz</span>
                    <span className="text-[8px] text-slate-400 font-normal italic">Reparación Celular</span>
                  </button>
                </div>
              )}

              {/* Volume safe note */}
              <div className="bg-amber-500/5 rounded-xl p-2.5 border border-amber-500/10 text-[10px] text-amber-900 leading-normal">
                🎧 Se recomienda el uso de auriculares estereofónicos para optimizar el efecto del latido binaural cerebral de baja frecuencia.
              </div>

              {/* Launch / Stop triggers */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isSynthPlaying) stopSynthesis();
                    else startSynthesis();
                  }}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isSynthPlaying 
                      ? "bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
                      : "bg-slate-800 text-white hover:bg-slate-900"
                  }`}
                >
                  {isSynthPlaying ? (
                    <>
                      <VolumeX className="h-4.5 w-4.5 animation-pulse" />
                      <span>Silenciar Sintetizador</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4.5 w-4.5 text-indigo-300" />
                      <span>Emitir Sonido Terapéutico</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 4. CBT Cognitive Restructuring Journaling */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1 border-b border-slate-50 pb-2">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              <span>CBT: Reestructuración Cognitiva IA</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Escribe un pensamiento negativo disfuncional recurrente (ej: "No puedo con todo") para que la IA lo analice, identifique distorsiones y te brinde un enfoque racional curativo:
            </p>

            <form onSubmit={handleAnalyzeCbt} className="space-y-3">
              <textarea
                value={thoughtInput}
                onChange={(e) => setThoughtInput(e.target.value)}
                placeholder="Ejemplo: Voy a reprobar mi examen laboral y todos van a creer que soy inútil..."
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <button
                type="submit"
                disabled={analyzingThought || !thoughtInput.trim()}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 py-1.5 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1"
              >
                {analyzingThought ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Desarmando distorsiones...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span>Reestructurar Pensamiento</span>
                  </>
                )}
              </button>
            </form>

            {/* CBT Reframed Result Box */}
            {thoughtResult && (
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5 space-y-3 animate-fade-in">
                <div>
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block font-mono">
                    🧘 Pensamiento Alternativo Racional
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-1 leading-relaxed">
                    "{thoughtResult.reframed}"
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed border-t border-emerald-100 pt-2.5 space-y-1">
                  <strong>Análisis del Terapeuta:</strong> {thoughtResult.clinical_commentary}
                  {thoughtResult.breathing_technique && (
                    <div className="mt-2 text-[9px] bg-emerald-100/50 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-block">
                      ⚙️ {thoughtResult.breathing_technique}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
