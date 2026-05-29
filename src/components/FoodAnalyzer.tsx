import React, { useState, useRef } from "react";
import { UserProfile, FoodAnalysis } from "../types";
import { Camera, Upload, AlertCircle, Sparkles, PlusCircle, CheckCircle, HelpCircle, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FoodAnalyzerProps {
  user: UserProfile;
  scansTodayCount: number;
  maxFreeScans: number;
  onSaveAnalysis: (analysis: Omit<FoodAnalysis, "id">) => Promise<void>;
  onViewChange: (view: string) => void;
}

export default function FoodAnalyzer({
  user,
  scansTodayCount,
  maxFreeScans,
  onSaveAnalysis,
  onViewChange
}: FoodAnalyzerProps) {
  const [images, setImages] = useState<{ [key: string]: string | null }>({
    superior: null,
    lateral: null,
    cercana: null,
    ingredientes: null
  });
  const [activeSlot, setActiveSlot] = useState<string>("superior");
  const [analyzing, setAnalyzing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<FoodAnalysis | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [simulationPrompt, setSimulationPrompt] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      setErrorStatus(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err: any) {
      console.error(err);
      setErrorStatus("No se pudo acceder a la cámara. Asegúrate de otorgar los permisos necesarios.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImages(prev => ({
          ...prev,
          ...({ [activeSlot]: dataUrl })
        }));
        stopCamera();
        setErrorStatus(null);
        setCurrentResult(null);
      }
    }
  };

  // Check if free user is blocked
  const isLimitReached = user.subscriptionStatus === "free" && scansTodayCount >= maxFreeScans;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorStatus("Por favor selecciona un archivo de imagen compatible (PNG, JPEG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (reader.result) {
        setImages(prev => ({
          ...prev,
          [activeSlot]: reader.result as string
        }));
        setErrorStatus(null);
        setCurrentResult(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset food image loader to simplify mock testing
  const selectPresetFood = (presetUrl: string, foodsLabel: string) => {
    setImages({
      superior: presetUrl,
      lateral: null,
      cercana: null,
      ingredientes: null
    });
    setActiveSlot("superior");
    setSimulationPrompt(foodsLabel);
    setErrorStatus(null);
    setCurrentResult(null);
  };

  const executeAnalysis = async () => {
    // We need at least one image (usually superior is the primary)
    const activeImages = Object.values(images).filter((img): img is string => img !== null);
    if (activeImages.length === 0) {
      setErrorStatus("Sube al menos un tipo de vista antes de analizar (ej. Vista superior).");
      return;
    }
    if (isLimitReached) {
      onViewChange("premium");
      return;
    }

    setAnalyzing(true);
    setErrorStatus(null);

    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagesBase64: activeImages,
          userConditions: [user.objective || "gastritis, colon irritable"]
        })
      });

      const data = await response.json();

      if (data.analysis) {
        const analysisData: Omit<FoodAnalysis, "id"> = {
          userId: user.uid,
          imageUrl: activeImages[0], // Use first one as thumbnail representation
          foods_detected: data.analysis.foods_detected || ["Comida mixta"],
          estimated_calories: Number(data.analysis.estimated_calories) || 300,
          protein: Number(data.analysis.protein) || 12,
          fat: Number(data.analysis.fat) || 10,
          carbs: Number(data.analysis.carbs) || 28,
          confidence: data.analysis.confidence || "Alta",
          digestive_risk: data.analysis.digestive_risk || "Low",
          recommendations: data.analysis.recommendations || ["Comer despacio"],
          alternatives: data.analysis.alternatives || ["Infusión de manzanilla"],
          createdAt: new Date().toISOString()
        };

        // Save scan in database
        await onSaveAnalysis(analysisData);
        
        setCurrentResult({
          ...analysisData,
          id: Math.random().toString(36).substring(7)
        });
      } else {
        throw new Error(data.error || "Ocurrió un error en el servidor.");
      }

    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "No se pudo realizar el análisis de alimento.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="food-analyzer-viewport">
      
      {/* Upper header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Analizador Inteligente de Alimentos</h2>
        <p className="text-slate-500 text-sm mt-1">
          Sube o captura una fotografía de tus comidas para desglosar sus macronutrientes esenciales y evaluar su compatibilidad digestiva.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left pane: File upload / selector */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Sube tu Platillo (Múltiples Vistas)</h3>
            
            {/* Limit Warning banner */}
            {isLimitReached && (
              <div className="rounded-xl bg-amber-50 p-3 flex items-start space-x-2 border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Has alcanzado tu límite diario de análisis gratuitos</p>
                  <p className="text-[11px] text-amber-700 mt-1">Desbloquea escaneos ilimitados por solo $7.99 USD/mes.</p>
                  <button 
                    onClick={() => onViewChange("premium")}
                    className="mt-2 text-xs font-bold text-amber-900 underline block"
                  >
                    Obtener Premium Ahora
                  </button>
                </div>
              </div>
            )}

            {/* Slot selector tabs */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Prepara hasta 4 ángulos del platillo:</span>
              <div className="grid grid-cols-4 gap-1">
                {(["superior", "lateral", "cercana", "ingredientes"] as const).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setActiveSlot(slot)}
                    className={`rounded-lg py-1.5 px-0.5 text-center text-[10px] font-bold border transition-all ${
                      activeSlot === slot
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                        : images[slot]
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-50 text-slate-500 border-slate-150 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block capitalize">{slot === "superior" ? "Superior" : slot === "lateral" ? "Lateral" : slot === "cercana" ? "Cercana" : "Ingredientes"}</span>
                    <span className="text-[8px] block font-normal opacity-75">
                      {images[slot] ? "✓ Súper" : "Vacío"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop or Live Camera Area */}
            {cameraActive ? (
              <div className="relative rounded-2xl border border-slate-200 bg-slate-950 p-4 text-center space-y-3">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="mx-auto h-48 w-full rounded-xl object-cover bg-black border border-slate-800"
                />
                <div className="flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Capturar Foto ({activeSlot})</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                id="file-dropzone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.camera-btn')) return; // ignore click if camera button is pressed
                  if (!isLimitReached) fileInputRef.current?.click();
                }}
                className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  dragActive ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                } ${isLimitReached ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <input 
                  id="analyzer-file-input"
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  disabled={isLimitReached}
                  className="hidden"
                />

                {images[activeSlot] ? (
                  <div className="space-y-2">
                    <img 
                      src={images[activeSlot]!} 
                      alt={`Previsualización ${activeSlot}`} 
                      className="mx-auto max-h-36 rounded-xl object-cover shadow-sm bg-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-[10px] text-slate-550 font-medium">Click para cambiar archivo, arrastra o usa el botón de cámara</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Arrastra o sube foto de vista {activeSlot}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Haz clic para buscar un archivo de imagen</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!cameraActive && !isLimitReached && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="camera-btn w-full py-2.5 px-4 rounded-xl border border-dashed border-teal-300 bg-teal-50/30 text-teal-800 hover:bg-teal-50 hover:border-teal-400 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Camera className="h-4 w-4 text-teal-600" />
                  <span>Usar Cámara de mi Dispositivo ({activeSlot})</span>
                </button>
              </div>
            )}

            {/* List of uploaded previews */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Fotos cargadas de este plato: {Object.values(images).filter(Boolean).length}/4</span>
              {Object.values(images).filter(Boolean).length > 0 && (
                <button
                  type="button"
                  onClick={() => setImages({ superior: null, lateral: null, cercana: null, ingredientes: null })}
                  className="text-[11px] text-rose-500 hover:underline"
                >
                  Limpiar todas
                </button>
              )}
            </div>

            {/* Demo Presets selector to ease app evaluations */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">¿No tienes fotos? Prueba estas demos:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="preset-lemon-chicken"
                  onClick={() => selectPresetFood("https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400", "Pechuga de pollo al limón con quinoa y espárragos")}
                  className="rounded-xl border border-slate-150 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
                >
                  🥗 Pollo con Quinoa (Bajo Riesgo)
                </button>
                <button
                  id="preset-spicy-tacos"
                  onClick={() => selectPresetFood("https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=400", "Tacos mexicanos extra picantes con salsa de chipotle y jalapeños fritos")}
                  className="rounded-xl border border-slate-150 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
                >
                  🌮 Tacos Picantes (Alto Riesgo)
                </button>
              </div>
            </div>

            {Object.values(images).some((img) => img !== null) && (
              <button
                id="trigger-analysis-btn"
                onClick={executeAnalysis}
                disabled={analyzing || isLimitReached}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    <span>IA Combinando y Analizando ({Object.values(images).filter(Boolean).length} fotos)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Iniciar Análisis Inteligente</span>
                  </>
                )}
              </button>
            )}

            {errorStatus && (
              <div className="rounded-xl bg-rose-50 p-3 flex items-start space-x-2 border border-rose-200">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">{errorStatus}</p>
              </div>
            )}

          </div>

        </div>

        {/* Right pane: Analysis outcomes */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            
            {analyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm space-y-4 flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-emerald-500 animate-bounce" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-base font-bold text-slate-800">Analizando con Gemini AI Vision</h4>
                  <p className="text-xs text-slate-400">
                    Estamos desglosando el valor calórico estimado, verificando posibles desencadenantes de gastritis e identificando irritantes de bajo FODMAP en tu plato.
                  </p>
                </div>
              </motion.div>
            )}

            {!analyzing && !currentResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]"
              >
                <Camera className="h-10 w-10 text-slate-350" />
                <h4 className="text-sm font-semibold text-slate-600 mt-3">Esperando imagen de alimento</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Sube una foto de tu comida favorita. Nuestro sistema clínico evaluará el riesgo para SII/Gastritis y te entregará alternativas.
                </p>
              </motion.div>
            )}

            {!analyzing && currentResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
                id="analyzer-results-panel"
              >
                {/* Result Main Specs banner */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Diagnóstico alimenticio</span>
                      <h3 className="text-base font-bold text-slate-800">
                        {currentResult.foods_detected.join(", ")}
                      </h3>
                      {currentResult.confidence && (
                        <div className="mt-1.5 flex items-center space-x-1">
                          <span className="text-[11px] text-slate-500 font-medium">Nivel de Confianza:</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            currentResult.confidence === "Alta" ? "bg-emerald-100 text-emerald-800" :
                            currentResult.confidence === "Media" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {currentResult.confidence}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`rounded-xl px-3.5 py-1.5 border text-xs font-bold leading-relaxed shrink-0 flex items-center space-x-1 ${getRiskColor(currentResult.digestive_risk)}`}>
                      <span>Riesgo Digestivo: {currentResult.digestive_risk === "High" ? "ALTO 🚨" : currentResult.digestive_risk === "Medium" ? "MEDIO ⚠️" : "BAJO ✅"}</span>
                    </div>
                  </div>

                  {/* Macronutrient Tracks */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Calorías</p>
                      <p className="text-xl font-extrabold text-slate-800 mt-1">{currentResult.estimated_calories} <span className="text-[10px] font-normal">kcal</span></p>
                    </div>
                    <div className="bg-emerald-50/40 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-700 uppercase font-bold">Proteínas</p>
                      <p className="text-xl font-extrabold text-emerald-800 mt-1">{currentResult.protein} <span className="text-xs font-medium text-emerald-700">g</span></p>
                    </div>
                    <div className="bg-blue-50/40 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-700 uppercase font-bold">Carbohidratos</p>
                      <p className="text-xl font-extrabold text-blue-800 mt-1">{currentResult.carbs} <span className="text-xs font-medium text-blue-700">g</span></p>
                    </div>
                    <div className="bg-rose-50/40 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-700 uppercase font-bold">Grasas</p>
                      <p className="text-xl font-extrabold text-rose-800 mt-1">{currentResult.fat} <span className="text-xs font-medium text-rose-700">g</span></p>
                    </div>
                  </div>

                </div>

                {/* Recommendations and Friendly Alternatives */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Warnings section */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                      <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                      <span>Advertencias Clínicas</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {currentResult.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                          <span className="text-amber-500 font-extrabold mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Alternatives section */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                      <span>Alternativas Amigables</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {currentResult.alternatives.map((alt, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                          <span className="text-emerald-500 font-extrabold mt-0.5">✓</span>
                          <span>{alt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Final support warning footer */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-[11px] text-slate-400 leading-normal text-center">
                  ⚠️ <strong>Disclaimer Nutricional</strong>: El análisis visual de VitaAI es netamente estimativo y educativo. No reemplaza un laboratorio presencial ni una consulta con tu médico o nutricionista de cabecera.
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
