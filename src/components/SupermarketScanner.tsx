import React, { useState, useRef, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  ArrowLeft, 
  Camera, 
  Upload,
  Video,
  VideoOff,
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  RotateCcw,
  FileText,
  BadgeAlert,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SupermarketScannerProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

interface ScanResult {
  productName: string;
  barcode: string;
  sugars: string;
  fats: string;
  sodium: string;
  preservatives: string;
  colorants: string;
  ultraprocessed: string;
  digestiveScore: number;
  nutritionScore: number;
  classification: string;
  alternatives: string[];
  analysisSummary: string;
}

export default function SupermarketScanner({ user, onViewChange }: SupermarketScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

  // Drag and drop / file upload
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Live Camera state
  const [isCameraLive, setIsCameraLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const triggerScan = async (payload: { imageBase64?: string; barcode?: string }) => {
    setScanning(true);
    setErrorMsg("");
    setResult(null);

    try {
      // If we don't have barcode, supply a placeholder ID
      const finalPayload = {
        ...payload,
        barcode: payload.barcode || "FOTO_ESCANEO_" + Math.floor(Math.random() * 1000000)
      };

      const response = await fetch("/api/scan-grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload)
      });
      const data = await response.json();
      if (data.success && data.scan) {
        setResult(data.scan);
      } else {
        throw new Error("No se pudo decodificar o analizar la etiqueta alimenticia. Intenta con otra toma más nítida.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error al conectar con la IA de decodificación.");
    } finally {
      setScanning(false);
    }
  };

  // Turn on live in-app camera helper
  const startCamera = async () => {
    setIsCameraLive(true);
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Direct webcam access failed (possibly due to iframe restrictions):", err);
      setErrorMsg("El acceso directo a la cámara falló. Por favor, utiliza la opción 'Tomar foto nativa' o 'Subir Imagen' que funcionan de manera compatible.");
      setIsCameraLive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraLive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const canvas = document.createElement("canvas");
        // Ensure accurate proportions
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg");
          setSelectedImage(dataUrl);
          stopCamera();
          triggerScan({ imageBase64: dataUrl });
        }
      } catch (err) {
        setErrorMsg("Error al capturar la imagen. Intenta cargando un archivo.");
      }
    }
  };

  useEffect(() => {
    return () => {
      // Safety clean
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Convert uploaded image or native system camera file to base64
  const handleImageFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      triggerScan({ imageBase64: base64String });
    };
    reader.readAsDataURL(file);
  };

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
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const getClassificationColor = (classification: string) => {
    const cls = classification.toLowerCase();
    if (cls.includes("excelente") || cls.includes("bueno")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (cls.includes("regular") || cls.includes("moderado")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    return "bg-rose-50 text-rose-800 border-rose-200";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 55) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="supermarket-scanner-main">
      
      {/* Back button */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => {
            stopCamera();
            onViewChange("dashboard");
          }}
          className="font-mono text-slate-450 hover:text-slate-800 transition-colors flex items-center gap-1 font-bold"
          id="scanner-back-btn"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Volver al Dashboard</span>
        </button>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-xs font-mono font-bold text-slate-500">Decodificador Alimentario</span>
      </div>

      {/* Head banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Camera className="h-6 w-6 text-emerald-600" />
          <span>VitaMarket: Cámara Decodificadora de Etiquetas IA</span>
        </h2>
        <p className="text-sm text-slate-500">
          Analiza al instante cualquier producto tomando una foto real o cargándola desde tu dispositivo. Nuestra IA procesará la tabla de ingredientes y desglosará aditivos perjudiciales, azúcares ocultos y estresores digestivos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Upload & Camera Capture Panel */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center justify-between">
              <span>Captura de Imagen</span>
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            </h3>

            {/* Direct Device Action Triggers */}
            <div className="space-y-2">
              
              {/* Option 1: Native Mobile/Desktop System Camera File Capture */}
              <button
                type="button"
                onClick={() => document.getElementById("native-camera-capture")?.click()}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 text-white py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>Tomar Foto con Cámara</span>
              </button>
              
              {/* Hidden native input with capture="environment" to force system camera application on mobile */}
              <input
                id="native-camera-capture"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    stopCamera();
                    handleImageFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Option 2: Live HTML5 webcam toggle wrapper */}
              {!isCameraLive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Video className="h-4 w-4 text-indigo-500" />
                  <span>Transmitir Cámara Web</span>
                </button>
              ) : (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-200">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                      <span>LIVE</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 text-xs font-bold transition"
                    >
                      📸 Obturar Foto
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <VideoOff className="h-3.5 w-3.5" />
                      <span>Apagar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-black tracking-widest">O Carga un Archivo</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Drag and Drop label block */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                dragActive 
                  ? "border-emerald-400 bg-emerald-50/30" 
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
              }`}
              onClick={() => document.getElementById("label-file-upload")?.click()}
            >
              <input
                id="label-file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    stopCamera();
                    handleImageFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-emerald-600">
                <Upload className="h-6 w-6" />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block">Sube un archivo existente</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Arrastra el archivo o haz clic para importarlo</span>
              </div>
            </div>

            {/* Quick preset demos */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Espectro de Demostraciones Básicas</span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    triggerScan({ barcode: "7501055904251" });
                  }}
                  className="py-1 px-2 text-left rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-650 truncate block font-medium"
                >
                  🥛 Demo 1: Yogur Griego (Saludable)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    triggerScan({ barcode: "75005829" });
                  }}
                  className="py-1 px-2 text-left rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-650 truncate block font-medium"
                >
                  🥣 Demo 2: Cereal Irritante
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Dynamic Decoded Results */}
        <div className="md:col-span-7">
          <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-100 rounded-2xl p-10 shadow-sm text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]"
              >
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">Analizando con Inteligencia de VitaDecodificador</h4>
                  <p className="text-xs text-slate-404 text-slate-400 max-w-sm mx-auto">
                    Escudriñando componentes químicos activos, nivel de edulcoración extrema y estabilidad osmótica estomacal...
                  </p>
                </div>
              </motion.div>
            ) : errorMsg ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-rose-100 rounded-2xl p-8 shadow-sm text-center space-y-4 min-h-[300px] flex flex-col justify-center items-center"
              >
                <div className="p-3 bg-rose-50 rounded-full text-rose-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">Inconveniente de Análisis</h4>
                  <p className="text-xs text-rose-800 max-w-sm leading-relaxed">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setErrorMsg("")}
                  className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm"
                >
                  Reintentar Captura
                </button>
              </motion.div>
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5"
              >
                
                {/* Result header banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Producto Detectado</span>
                    <h3 className="text-lg font-bold text-slate-800">{result.productName}</h3>
                  </div>

                  <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded-full border ${getClassificationColor(result.classification)}`}>
                    {result.classification}
                  </span>
                </div>

                {/* Score meters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/50 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block font-mono">Digestión Score</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">No irrita mucosa</span>
                    </div>
                    <span className={`text-2xl font-black font-mono ${getScoreColor(result.digestiveScore)}`}>
                      {result.digestiveScore}
                    </span>
                  </div>

                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/50 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block font-mono">Densidad Macronutrientes</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Grasas & Aminoácidos</span>
                    </div>
                    <span className={`text-2xl font-black font-mono ${getScoreColor(result.nutritionScore)}`}>
                      {result.nutritionScore}
                    </span>
                  </div>
                </div>

                {/* Detailed Parameters */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Análisis Detallado de Ingredientes</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/30 border border-slate-50">
                      <span className="font-medium text-slate-500">Azúcares Libres</span>
                      <span className="font-bold text-slate-800 text-[11px]">{result.sugars}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/30 border border-slate-50">
                      <span className="font-medium text-slate-500">Grasas Saturadas</span>
                      <span className="font-bold text-slate-800 text-[11px]">{result.fats}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/30 border border-slate-50">
                      <span className="font-medium text-slate-500">Sodio Contenido</span>
                      <span className="font-bold text-slate-800 text-[11px]">{result.sodium}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/30 border border-slate-50">
                      <span className="font-medium text-slate-500">Nivel Ultraprocesado</span>
                      <span className="font-bold text-slate-800 text-[11px]">{result.ultraprocessed || "Medio"}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/30 border border-slate-50">
                      <span className="font-medium text-slate-500">Preservativos</span>
                      <span className="font-bold text-slate-800 text-[11px]">{result.preservatives}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/30 border border-slate-50">
                      <span className="font-medium text-slate-500">Colorantes Síntéticos</span>
                      <span className="font-bold text-slate-800 text-[11px]">{result.colorants}</span>
                    </div>

                  </div>
                </div>

                {/* Clinical Interpretation */}
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-100/50 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block font-mono flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                    <span>Interpretación Digestiva IA</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {result.analysisSummary}
                  </p>
                </div>

                {/* Healthy Safer Alternatives */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Alternativas más Amigables</h4>
                  
                  <div className="space-y-2">
                    {result.alternatives?.map((alt, altIndex) => (
                      <div key={altIndex} className="bg-slate-50/30 border border-emerald-100 p-3 rounded-xl flex items-start space-x-2.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-700 font-medium">
                          {alt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear current results to look for more */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      setSelectedImage(null);
                    }}
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Analizar un Nuevo Producto</span>
                  </button>
                </div>

              </motion.div>
            ) : (
              <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                <FileText className="h-10 w-10 text-slate-350" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700">Esperando Captura</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Toma una captura o fotografía en tiempo real de la tabla de ingredientes de tu alimento o carga la imagen para analizarla.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
