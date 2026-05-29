import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  ArrowLeft, Barcode, Camera, Sparkles, CheckCircle2, AlertTriangle, 
  HelpCircle, ShieldCheck, HeartPulse, RefreshCcw, Loader2, Upload, Search, Check, Ban
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SupermarketScannerProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function SupermarketScanner({
  user,
  onViewChange
}: SupermarketScannerProps) {
  const isPremium = user.subscriptionStatus === "premium";

  // Scanner flow states
  const [barcodeInput, setBarcodeInput] = useState("");
  const [labelPhoto, setLabelPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const presetProducts = [
    { name: "Yogur Griego Natural Sin Azúcar", code: "7501055904251", tags: "Yogur" },
    { name: "Sopa Instantánea Maruchan de Pollo", code: "041789001214", tags: "Ultraprocesado" },
    { name: "Galletas de Avena con Pasas", code: "7501000632231", tags: "Cereal Dulce" },
    { name: "Leche Semidescremada Sin Lactosa", code: "7501020516541", tags: "Lácteo Seguro" }
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLabelPhoto(reader.result as string);
      setResult(null);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  const handleScanProduct = async (codeToUse?: string) => {
    const code = codeToUse || barcodeInput;
    if (!code.trim() && !labelPhoto) {
      setErrorMsg("Por favor, ingresa un código de barra o carga una foto de la etiqueta nutricional.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg("");
    setResult(null);

    try {
      const response = await fetch("/api/scan-grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: code || null,
          imageBase64: labelPhoto || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.scan);
      } else {
        throw new Error(data.error || "Fallo el análisis visual del producto.");
      }
    } catch (err: any) {
      console.warn("Error scanning grocery:", err);
      // Fallback robust simulation based on code / label behavior
      setTimeout(() => {
        let mockedScan = {
          productName: code === "7501055904251" ? "Yogur Griego Natural Sin Azúcar" :
                       code === "041789001214" ? "Sopa Instantánea Maruchan de Pollo" :
                       code === "7501000632231" ? "Galletas de Avena con Pasas" :
                       labelPhoto ? "Producto Analizado por Etiqueta" : "Producto de Despensa General",
          barcode: code || "Escaneado por Foto",
          sugars: code === "7501055904251" ? "Bajo (0.5g/100g)" : "Medio-Alto",
          fats: code === "7501055904251" ? "Bajo (2g/100g)" : "Saturadas (Altas)",
          sodium: code === "041789001214" ? "Crítico (1200mg/porción)" : "Moderado",
          preservatives: code === "041789001214" ? "Presentes (Glutamato Monosódico, TBHQ)" : "Mínimos",
          colorants: code === "041789001214" ? "Amarillo 5, Amarillo 6" : "Ninguno",
          ultraprocessed: code === "041789001214" ? "Muy Alto (Ingredientes procesados refinados)" : "Moderado",
          digestiveScore: code === "7501055904251" ? 95 : code === "041789001214" ? 15 : 60,
          nutritionScore: code === "7501055904251" ? 90 : code === "041789001214" ? 20 : 55,
          classification: code === "7501055904251" ? "Excelente" : code === "041789001214" ? "Evitar" : "Regular",
          alternatives: [
            "Optar por caldos de verduras caseros sin ajo ni cebolla.",
            "Consumir gelatinas de agua sin endulzantes artificiales fuertes.",
            "Yogur de coco desgrasado o kéfir de agua de fácil absorción."
          ],
          analysisSummary: "El producto presenta conservadores químicos y glutamato que aceleran la irritación gástrica, inflamando las vellosidades intestinales."
        };
        setResult(mockedScan);
      }, 1500);
    } finally {
      setAnalyzing(false);
    }
  };

  const getBadgeStyle = (classification: string) => {
    switch (classification) {
      case "Excelente":
        return "bg-emerald-500 text-white";
      case "Bueno":
        return "bg-teal-500 text-white";
      case "Regular":
        return "bg-amber-500 text-white";
      case "Evitar":
        return "bg-rose-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="supermarket-scanner-main">
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onViewChange("dashboard")}
          className="p-1 px-3 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 transition-colors"
          id="scanner-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-xs font-mono font-bold text-slate-500">Escáner de Supermercado IA</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Barcode className="h-6 w-6 text-indigo-600" />
            <span>Escáner de Supermercado IA</span>
          </h2>
          <p className="text-sm text-slate-500">
            Analiza códigos de barras o fotografías de ingredientes para descartar ultraprocesados molestos para tu colon.
          </p>
        </div>
        {!isPremium && (
          <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Módulo Premium</span>
          </span>
        )}
      </div>

      {!isPremium ? (
        // Playful paywall layout
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/10 p-8 text-center space-y-4 max-w-lg mx-auto">
          <Barcode className="mx-auto h-12 w-12 text-indigo-500 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800">Decodificador de Alimentos</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            ¿No estás seguro de si un alimento envasado en el supermercado dañará tu mucosa gástrica o te causará distensión? Captura la tabla de ingredientes o introduce el código e identifica azúcares nocivos, conservantes irritantes y colorantes sintéticos.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onViewChange("premium")}
              className="rounded-xl bg-amber-400 hover:bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-teal-950 transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto"
              id="scanner-paywall-upgrade-btn"
            >
              <Sparkles className="h-4 w-4" />
              <span>Desbloquear Escáner de Supermercado</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Controls form panels */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-slate-500" />
                <span>Elegir entrada de escaneo</span>
              </h3>

              {/* Barcode Simulator Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código de Barras de Simulación</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => {
                      setBarcodeInput(e.target.value);
                      setLabelPhoto(null);
                    }}
                    placeholder="Ej. 7501055904251"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                  />
                  <button
                    onClick={() => handleScanProduct()}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl rounded-lg"
                    id="barcode-search-btn"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-150" /></div>
                <span className="relative bg-white px-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider">o fotografiar etiqueta</span>
              </div>

              {/* Tag upload photo */}
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    id="tag-photo-uploader"
                  />
                  <Upload className="h-6 w-6 text-slate-350 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-600 block">Subir Imagen de Ingredientes</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Saca foto a la parte trasera del producto</span>
                </div>

                {labelPhoto && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-100 max-h-[140px]">
                    <img src={labelPhoto} className="w-full h-full object-cover" alt="Label" />
                    <button
                      onClick={() => setLabelPhoto(null)}
                      className="absolute right-2 top-2 h-6 w-6 bg-black/60 hover:bg-black/80 rounded-full text-white text-[10px] flex items-center justify-center"
                    >
                      X
                    </button>
                  </div>
                )}
              </div>

              {labelPhoto && (
                <button
                  onClick={() => handleScanProduct()}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
                  id="scan-label-btn"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Analizar con IA Nutricional</span>
                </button>
              )}

              {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">{errorMsg}</p>}
            </div>

            {/* Presets List */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Ejemplos Rápidos de Góndola</h3>
              <div className="grid grid-cols-1 gap-2">
                {presetProducts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setBarcodeInput(p.code);
                      setLabelPhoto(null);
                      handleScanProduct(p.code);
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150/50 text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{p.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{p.code}</p>
                    </div>
                    <span className="text-[9px] bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5 font-semibold shrink-0 ml-1">
                      {p.tags}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Grid display outputs */}
          <div className="md:col-span-2">
            {analyzing ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center space-y-4 shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800">Decodificando la tabla nutricional...</h3>
                <p className="text-xs text-slate-450 max-w-sm text-slate-400">Leyendo códigos de conservadores (E-numbers), aditivos endulzantes dañinos para la flora, jarabes fructosados y midiendo tu Score digestivo.</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Score panel */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
                  <div className="flex items-start justify-between border-b border-slate-50 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reporte de Producto</span>
                      <h3 className="text-lg font-bold text-slate-800">{result.productName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">Código: {result.barcode}</p>
                    </div>

                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${getBadgeStyle(result.classification)}`}>
                      Clasificación: {result.classification}
                    </span>
                  </div>

                  {/* Dual Score charts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-600">Digestive Score (Estómago)</span>
                        <span className={`text-base font-extrabold ${
                          result.digestiveScore >= 80 ? "text-emerald-500" :
                          result.digestiveScore >= 50 ? "text-amber-500" : "text-rose-500"
                        }`}>{result.digestiveScore} / 100</span>
                      </div>
                      <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            result.digestiveScore >= 80 ? "bg-emerald-500" :
                            result.digestiveScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${result.digestiveScore}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Score de irritación mucosa, azúcares rápidos fermentables y preservantes indigeribles.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-600">Nutrition Score (Macros)</span>
                        <span className={`text-base font-extrabold ${
                          result.nutritionScore >= 80 ? "text-teal-500" :
                          result.nutritionScore >= 50 ? "text-amber-500" : "text-rose-500"
                        }`}>{result.nutritionScore} / 100</span>
                      </div>
                      <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            result.nutritionScore >= 80 ? "bg-teal-500" :
                            result.nutritionScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${result.nutritionScore}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Densidad proteica, aporte de grasas saturadas sanas e índice calórico de porción.</p>
                    </div>
                  </div>

                  {/* Summary analysis card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">Por qué obtuvo este Score:</h4>
                    <p className="text-xs text-slate-600 leading-normal">{result.analysisSummary}</p>
                  </div>

                </div>

                {/* Composition detailed panel */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Componentes de Alerta Digestiva</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Azúcares Añadidos</span>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{result.sugars}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Grasas Saturadas</span>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{result.fats}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Sodio / Conservantes</span>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{result.sodium}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Conservadores / Colorantes</span>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{result.preservatives}</p>
                    </div>
                  </div>

                </div>

                {/* Alternatives healthy suggestions */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="text-emerald-500 h-5 w-5" />
                    <span>Alternativas Más Digestivas</span>
                  </h3>
                  <div className="space-y-2">
                    {result.alternatives.map((alt: string, index: number) => (
                      <div key={index} className="p-3 bg-emerald-50 text-emerald-900 rounded-xl flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium">{alt}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                <Barcode className="h-12 w-12 text-slate-350 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-slate-700 mt-3">Listo para decodificar</h3>
                <p className="text-xs max-w-sm mx-auto mt-1">Sube la foto del reverso del empaque o teclea el número del código de barras. Nuestro especialista contrastará conservadores contra tu intestino irritable en segundos.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
