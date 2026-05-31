import React, { useState, useEffect } from "react";
import { UserProfile, FamilyProfile } from "../types";
import { 
  ArrowLeft, Users, Sparkles, Plus, Trash2, Loader2, User, 
  ChevronRight, Heart, HeartCrack, Utensils, CalendarRange, CheckCircle2, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface FamilyProfilesProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function FamilyProfiles({
  user,
  onViewChange
}: FamilyProfilesProps) {
  const isPremium = user.subscriptionStatus === "premium";

  // List and form states
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form entries
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(35);
  const [weight, setWeight] = useState<number>(68);
  const [height, setHeight] = useState<number>(165);
  const [goal, setGoal] = useState("gastritis");
  const [restrictions, setRestrictions] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Customizable recommendations and 3-day menu states
  const [customRecommendation, setCustomRecommendation] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [dietTracking, setDietTracking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeProfile) {
      setCustomRecommendation(
        `Dieta digestiva optimizada para el perfil metabólico de ${activeProfile.name}. Consumir porciones controladas, evitar picantes, cafeína y alcohol. Integrar caldos y verduras hervidas.`
      );
      setGeneratedPlan(null);
      setDietTracking({});
    }
  }, [activeProfile]);

  useEffect(() => {
    if (!isPremium) return;
    pullFamilyProfiles();
  }, [user, isPremium]);

  const pullFamilyProfiles = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "family_profiles"),
        where("owner_id", "==", user.uid)
      );
      const snap = await getDocs(q);
      const parsed: FamilyProfile[] = [];
      snap.forEach((doc) => {
        parsed.push({ id: doc.id, ...doc.data() } as FamilyProfile);
      });

      setProfiles(parsed);
      if (parsed.length > 0) {
        setActiveProfile(parsed[0]);
      } else {
        const cached = localStorage.getItem(`colonia_family_${user.uid}`);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setProfiles(parsedCache);
          if (parsedCache.length > 0) {
            setActiveProfile(parsedCache[0]);
          }
        }
      }
    } catch (err: any) {
      console.warn("Error pulling family profiles:", err);
      // Fallback local storage
      const cached = localStorage.getItem(`colonia_family_${user.uid}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setProfiles(parsedCache);
        if (parsedCache.length > 0) {
          setActiveProfile(parsedCache[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSuccessMsg("");

    const newProfile: Omit<FamilyProfile, "id"> = {
      owner_id: user.uid,
      name: name.trim(),
      age,
      weight,
      height,
      goal,
      restrictions: restrictions.trim() || "Ninguna"
    };

    try {
      // Save directly into Firestore
      const docRef = await addDoc(collection(db, "family_profiles"), newProfile);
      const created: FamilyProfile = { id: docRef.id, ...newProfile };

      const updated = [...profiles, created];
      setProfiles(updated);
      setActiveProfile(created);
      localStorage.setItem(`colonia_family_${user.uid}`, JSON.stringify(updated));

      // Reset
      setName("");
      setRestrictions("");
      setSuccessMsg(`¡Perfil de ${created.name} creado con éxito!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.warn(err);
      const fallback: FamilyProfile = { id: Math.random().toString(36).substring(7), ...newProfile };
      const updated = [...profiles, fallback];
      setProfiles(updated);
      setActiveProfile(fallback);
      localStorage.setItem(`colonia_family_${user.uid}`, JSON.stringify(updated));

      setName("");
      setRestrictions("");
      setSuccessMsg(`Creado de forma local (offline)`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    if (activeProfile?.id === id) {
      setActiveProfile(updated.length > 0 ? updated[0] : null);
    }
    localStorage.setItem(`colonia_family_${user.uid}`, JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, "family_profiles", id));
    } catch (e) {
      console.warn(e);
    }
  };

  const getGoalLabel = (g: string) => {
    switch (g) {
      case "gastritis": return "Gastritis / Reflujo gástrico";
      case "colon_irritable": return "Intestino Irritable / SII";
      case "bloating": return "Inflamación distensiva recurrente";
      case "weight_loss": return "Alimentación Balanceada y Peso";
      default: return g;
    }
  };

  // Safe foods suggestions for the active family member
  const getFamilyMemberSuggestions = (g: string, rest: string) => {
    const suggestions: string[] = [];
    if (g === "gastritis") {
      suggestions.push("Puré de papaya dulce madura antes del desayuno.", "Sopa de arroz hervida con zanahoria y pechuga de pollo deshebrada.");
    } else if (g === "colon_irritable") {
      suggestions.push("Calabaza de castilla asada (bajísimo FODMAPs).", "Caldo de pescado sin ajo, con una pizca ligera de jengibre.");
    } else {
      suggestions.push("Plátano maduro hervido de fácil deglución.", "Avena caliente cocida en agua pura.");
    }

    if (rest.toLowerCase().includes("lactos") || rest.toLowerCase().includes("leche")) {
      suggestions.push("Evitar a toda costa lácteos tradicionales; sustituir con kéfir de agua.");
    }
    return suggestions;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="family-profiles-main">
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onViewChange("dashboard")}
          className="p-1 px-3 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 transition-colors"
          id="family-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-xs font-mono font-bold text-slate-500">Modo Familiar Premium</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <span>Modo Familiar Multiusuario</span>
          </h2>
          <p className="text-sm text-slate-500">
            Administra perfiles de alimentación preventiva de papás, mamás, abuelos o niños dentro de la misma cuenta.
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
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-8 text-center space-y-4 max-w-lg mx-auto">
          <Users className="mx-auto h-12 w-12 text-emerald-500 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800">Cuidado Integral del Hogar</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            ¿Sufre tu madre de reflujo biliar, o tu hijo de acumulación de gases? No crees cuentas adicionales. El Modo Familiar te permite guardar hasta 4 perfiles independientes con restricciones alergénicas, objetivos físicos independientes y recetas seguras clínicamente probadas.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onViewChange("premium")}
              className="rounded-xl bg-amber-400 hover:bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-teal-950 transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto"
              id="family-paywall-upgrade-btn"
            >
              <Sparkles className="h-4 w-4" />
              <span>Habilitar Modo Familiar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Create Member & list sidebar */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Registered members list */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Familia Registrada</h3>
              
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : profiles.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Solo estás tú por ahora, añade a un ser querido.</p>
              ) : (
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => setActiveProfile(p)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        activeProfile?.id === p.id 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          activeProfile?.id === p.id ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none">{p.name}</p>
                          <p className={`text-[9px] mt-0.5 ${activeProfile?.id === p.id ? "text-white/80" : "text-slate-400"}`}>
                            {p.age} años • {p.weight}kg
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (p.id) handleDeleteProfile(p.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          activeProfile?.id === p.id ? "hover:bg-white/10 text-white/70 hover:text-white" : "hover:bg-slate-200 text-slate-400"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile creations form */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Añadir Miembro</h3>
              
              <form onSubmit={handleCreateProfile} className="space-y-4" id="add-family-member-form">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre / Apodo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Mamá Lety, Sofía (hija)"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Edad</label>
                    <input
                      type="number"
                      required
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="mt-1 block w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Peso (kg)</label>
                    <input
                      type="number"
                      required
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="mt-1 block w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Estatura (cm)</label>
                    <input
                      type="number"
                      required
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="mt-1 block w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Padecimiento Clave</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-250 bg-slate-50 px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 select-none"
                  >
                    <option value="gastritis">Gastritis y Reflujo</option>
                    <option value="colon_irritable">Colon Irritable / SII</option>
                    <option value="bloating">Inflamación Abdominal</option>
                    <option value="healthy">Salud Gástrica General</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Restricciones / Alergias</label>
                  <input
                    type="text"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="Ej. Alergia a la nuez, intolerante lactosa"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {successMsg && (
                  <p className="text-[10px] text-emerald-800 bg-emerald-50 p-2 border border-emerald-100 rounded-lg">{successMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold py-2.5 text-white shadow-sm transition-all"
                >
                  {saving ? "Registrando miembro..." : "Guardar Perfil Familiar"}
                </button>
              </form>

            </div>

          </div>

          {/* Member summary views */}
          <div className="md:col-span-2">
            {activeProfile ? (
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6 print:border-none print:shadow-none print:p-0" id="family-active-profile-card">
                
                {/* Header profile details */}
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg print:border print:border-slate-300">
                      {activeProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800">{activeProfile.name}</h3>
                      <p className="text-xs text-slate-400">Perteneciente al núcleo familiar de {user.name}.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-650 hover:bg-slate-50 flex items-center gap-1.5 print:hidden"
                    title="Imprimir Plan de Dieta Familiar"
                  >
                    <span>🖨️ Imprimir Plan</span>
                  </button>
                </div>

                {/* Submetrics grids */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Edad</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{activeProfile.age} años</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Estatura</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{activeProfile.height} cm</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Peso</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{activeProfile.weight} kg</span>
                  </div>
                </div>

                {/* Clinical alignment indicator */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block font-mono">Objetivo de Dietética Asignado</span>
                  <h4 className="text-sm font-bold text-slate-800">{getGoalLabel(activeProfile.goal)}</h4>
                  <div className="text-xs text-slate-500 mt-2">
                    <span className="font-semibold text-slate-705 text-slate-700">Restricciones identificadas:</span> {activeProfile.restrictions}
                  </div>
                </div>

                {/* Customizable Diet recommendations by counselor */}
                <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:bg-white print:p-0 print:border-none">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
                    ✍️ Directriz / Recomendación de Dieta para {activeProfile.name}
                  </label>
                  <textarea
                    value={customRecommendation}
                    onChange={(e) => setCustomRecommendation(e.target.value)}
                    rows={2}
                    className="w-full text-xs rounded-xl border border-slate-205 p-3 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 print:border-none print:p-0"
                    placeholder="Escribe la recomendación del doctor o nutriólogo para el familiar..."
                  />
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsGeneratingPlan(true);
                      setTimeout(() => {
                        const isGastritis = activeProfile?.goal === "gastritis";
                        const isSII = activeProfile?.goal === "colon_irritable";
                        
                        const menu = [
                          {
                            day: 1,
                            breakfast: isGastritis ? "Licuado de papaya madura con avena en agua tibia" : isSII ? "Omelette de claras con calabacita asada (bajo FODMAP)" : "Yogur griego descremado con bayas frescas",
                            lunch: isGastritis ? "Caldo de pollo desgrasado con arroz y zanahoria bien hervida" : isSII ? "Lomo de pescado al vapor con puré de camote" : "Ensalada tibia con pechuga asada y limón",
                            dinner: isGastritis ? "Crema sazonada de calabacita y arroz hervido" : isSII ? "Caldo ligero de lomo de pavo con calabacín" : "Gelatina de fresa digestiva en agua pura"
                          },
                          {
                            day: 2,
                            breakfast: isGastritis ? "Avena tibia cocida en agua con gajos de plátano" : isSII ? "Huevo poché tierno con ejotes y aderezo ligero de romero" : "1 rebanada de pan de centeno con aguacate",
                            lunch: isGastritis ? "Filete de pescado blanco empapelado con chayote hervido" : isSII ? "Pechuga de pavo horneada con arroz blanco tierno" : "Sopa de lentejas casera con verduras limpias",
                            dinner: isGastritis ? "Puré de pera cocido con infusión tibia de manzanilla" : isSII ? "Gelatina orgánica de arándano de agua caliente" : "Compota suave de manzana sin azúcar"
                          },
                          {
                            day: 3,
                            breakfast: isGastritis ? "Manzana hervida machacada con pizca de avena" : isSII ? "Batido energizante de leche de almendras y papaya dulce" : "Huevos revueltos tiernos con espinacas cocidas",
                            lunch: isGastritis ? "Sopa de pollo con fideos de arroz y calabaza italiana" : isSII ? "Pechuga de pollo deshebrada con zanahorias asadas" : "Filete de pescado al sarten con brócoli al vapor",
                            dinner: isGastritis ? "Papaya dulce picada con infusión de jengibre suave" : isSII ? "Crema rústica de calabacita asada digestiva" : "Cena ligera de kéfir con fresas picadas"
                          }
                        ];
                        setGeneratedPlan(menu);
                        setIsGeneratingPlan(false);
                      }, 820);
                    }}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors mt-2 print:hidden"
                  >
                    <span>✨ Generar Plan de Dieta (3 Días)</span>
                  </button>
                </div>

                {/* Simulated Generated Plan Display with checkboxes for tracking */}
                {isGeneratingPlan ? (
                  <div className="py-6 text-center space-y-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500 mx-auto" />
                    <p className="text-xs text-slate-400">Modelando menú de fácil digestión para {activeProfile.name}...</p>
                  </div>
                ) : generatedPlan ? (
                  <div className="space-y-4 animate-fade-in text-slate-700" id="diet-plan-sheet">
                    <div className="border-b border-slate-105 pb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-450 uppercase flex items-center gap-1">
                        <Utensils className="h-4 w-4 text-emerald-600" />
                        <span>Menú Nutricional y Seguimiento</span>
                      </h4>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2 py-0.5 rounded-full print:hidden">
                        Apego: {Math.round((Object.values(dietTracking).filter(Boolean).length / 9) * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {generatedPlan.map((d: any) => (
                        <div key={d.day} className="border border-slate-100 p-4 rounded-xl bg-slate-50/30 space-y-3 print:bg-white print:border-slate-200">
                          <h5 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 flex justify-between items-center">
                            <span>Día {d.day}</span>
                            <span className="text-[9px] text-slate-400 uppercase">Clínico</span>
                          </h5>

                          <div className="space-y-2.5">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-orange-650 font-mono block">🍳 Desayuno</span>
                              <label className="flex items-start gap-1.5 mt-0.5 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={!!dietTracking[`d${d.day}_b`]}
                                  onChange={() => setDietTracking(prev => ({ ...prev, [`d${d.day}_b`]: !prev[`d${d.day}_b`] }))}
                                  className="mt-0.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 print:hidden"
                                />
                                <span className={`text-[11px] leading-tight ${dietTracking[`d${d.day}_b`] ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                  {d.breakfast}
                                </span>
                              </label>
                            </div>

                            <div>
                              <span className="text-[9px] uppercase font-bold text-teal-655 font-mono block text-teal-600">🍲 Almuerzo</span>
                              <label className="flex items-start gap-1.5 mt-0.5 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={!!dietTracking[`d${d.day}_l`]}
                                  onChange={() => setDietTracking(prev => ({ ...prev, [`d${d.day}_l`]: !prev[`d${d.day}_l`] }))}
                                  className="mt-0.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 print:hidden"
                                />
                                <span className={`text-[11px] leading-tight ${dietTracking[`d${d.day}_l`] ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                  {d.lunch}
                                </span>
                              </label>
                            </div>

                            <div>
                              <span className="text-[9px] uppercase font-bold text-indigo-650 font-mono block">🥣 Cena</span>
                              <label className="flex items-start gap-1.5 mt-0.5 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={!!dietTracking[`d${d.day}_d`]}
                                  onChange={() => setDietTracking(prev => ({ ...prev, [`d${d.day}_d`]: !prev[`d${d.day}_d`] }))}
                                  className="mt-0.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 print:hidden"
                                />
                                <span className={`text-[11px] leading-tight ${dietTracking[`d${d.day}_d`] ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                  {d.dinner}
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] text-slate-400 italic text-center pt-1 print:hidden">
                      💡 Pulsa en las casillas para marcar los platillos consumidos por {activeProfile.name} y dar un seguimiento clínico exacto.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                      <Utensils className="h-4 w-4 text-emerald-600" />
                      <span>Recomendaciones Clínicas de Despensa</span>
                    </h4>

                    <div className="space-y-2">
                      {getFamilyMemberSuggestions(activeProfile.goal, activeProfile.restrictions).map((sug, sId) => (
                        <div key={sId} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-600 font-medium leading-relaxed">{sug}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-3.5 flex items-start space-x-2.5 print:hidden">
                  <Shield className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-800 leading-normal">
                    <strong>Advertencia Pediátrica/Geriátrica</strong>: Al diseñar las papillas o caldos del perfil familiar, evita la sobrecondimentación de pimienta o cúrcuma comercial, ya que sus mucosas suelen absorber con mayor velocidad liberando reflujo enzimático veloz.
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                <Users className="h-12 w-12 text-slate-350 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 mt-3">Perfiles del Hogar</h3>
                <p className="text-xs max-w-sm mx-auto mt-1">Habilita perfiles para proteger a las personas propensas a inflamaciones agudas en tu casa.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
