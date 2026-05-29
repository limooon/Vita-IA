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
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
                
                {/* Header profile details */}
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                    {activeProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">{activeProfile.name}</h3>
                    <p className="text-xs text-slate-400">Perteneciente al núcleo familiar de {user.name}.</p>
                  </div>
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
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block">Objetivo de Dietética Asignado</span>
                  <h4 className="text-sm font-bold text-slate-800">{getGoalLabel(activeProfile.goal)}</h4>
                  <div className="text-xs text-slate-500 mt-2">
                    <span className="font-semibold text-slate-705 text-slate-700">Restricciones identificadas:</span> {activeProfile.restrictions}
                  </div>
                </div>

                {/* Safe food alternatives suggestions */}
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

                <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-3.5 flex items-start space-x-2.5">
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
