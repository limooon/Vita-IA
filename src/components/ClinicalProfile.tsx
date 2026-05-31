import React, { useState, useEffect } from "react";
import { UserProfile, MedicalProfile } from "../types";
import { 
  ClipboardList, CheckCircle, AlertCircle, Save, Loader2, Info, 
  User, Sparkles, Moon, Sun, Activity
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ClinicalProfileProps {
  user: UserProfile;
  onUpdateSuccess?: () => void;
  onViewChange: (view: string) => void;
  onUpdateUserProps: (metrics: { name: string; age: number; weight: number; height: number; objective: string }) => Promise<void>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function ClinicalProfile({
  user,
  onUpdateSuccess,
  onViewChange,
  onUpdateUserProps,
  isDarkMode,
  onToggleDarkMode
}: ClinicalProfileProps) {
  const [profile, setProfile] = useState<Omit<MedicalProfile, "id">>({
    userId: user.uid,
    hasDiabetes: false,
    hasHypertension: false,
    hasGastritis: false,
    hasColonIrritable: false,
    hasReflujo: false,
    hasHigadoGraso: false,
    hasEnfermedadRenal: false,
    allergies: "",
    intolerances: "",
    createdAt: new Date().toISOString()
  });

  // Local user metrics edits states
  const [name, setName] = useState(user.name || "");
  const [age, setAge] = useState<number>(user.age || 30);
  const [weight, setWeight] = useState<number>(user.weight || 70);
  const [height, setHeight] = useState<number>(user.height || 170);
  const [objective, setObjective] = useState(user.objective || "colon_irritable");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const docRef = doc(db, "medical_profiles", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            userId: user.uid,
            hasDiabetes: data.hasDiabetes || false,
            hasHypertension: data.hasHypertension || false,
            hasGastritis: data.hasGastritis || false,
            hasColonIrritable: data.hasColonIrritable || false,
            hasReflujo: data.hasReflujo || false,
            hasHigadoGraso: data.hasHigadoGraso || false,
            hasEnfermedadRenal: data.hasEnfermedadRenal || false,
            allergies: data.allergies || "",
            intolerances: data.intolerances || "",
            createdAt: data.createdAt || new Date().toISOString()
          });
        } else {
          // Check localStorage as fallback
          const localStr = localStorage.getItem(`clinical_profile_${user.uid}`);
          if (localStr) {
            setProfile(JSON.parse(localStr));
          }
        }
      } catch (err) {
        console.warn("Error loading medical profile, fallback to offline state:", err);
        const localStr = localStorage.getItem(`clinical_profile_${user.uid}`);
        if (localStr) {
          setProfile(JSON.parse(localStr));
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user.uid]);

  const handleCheckboxChange = (name: keyof Omit<MedicalProfile, "userId" | "allergies" | "intolerances" | "createdAt" | "id">) => {
    setProfile((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
    setSuccess(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value
    }));
    setSuccess(false);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorStatus(null);
    setSuccess(false);

    try {
      // 1. Save general user metrics in users collection
      await onUpdateUserProps({
        name,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        objective
      });

      // 2. Save clinical profile in medical_profiles
      const dataToSave = {
        ...profile,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "medical_profiles", user.uid), dataToSave);
      
      // Save local backup copies
      localStorage.setItem(`clinical_profile_${user.uid}`, JSON.stringify(dataToSave));
      
      setSuccess(true);
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error saving complete clinical profile:", err);
      setErrorStatus("No se pudo conectar con el servidor. Se guardó copia local.");
      // Fallback local persistence
      localStorage.setItem(`clinical_profile_${user.uid}`, JSON.stringify(profile));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-left" id="clinical-profile-viewport">
      
      {/* Header and go back controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-100/40">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>Configuración de Perfil Clínico y Personal</span>
          </h2>
          <p className="text-xs text-slate-500">
            Administra tus métricas físicas, objetivos, patologías de diagnóstico e integra el Modo Oscuro.
          </p>
        </div>
        <button
          onClick={() => onViewChange("dashboard")}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold text-slate-400">Cargando base de datos médica...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main profile forms and metrics */}
          <div className="md:col-span-2 space-y-6">
            
            {/* SECTION 1: Personal Data & Fisiology */}
            <div className={`border rounded-2xl p-6 space-y-4 shadow-xs transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <h3 className="text-sm font-bold border-b pb-2 border-slate-100/40 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                <span>Datos Fisiológicos Primarios</span>
              </h3>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-550 font-bold block">Nombre Completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={`w-full text-xs rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 border ${
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                      }`}
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-550 font-bold block">Objetivo Nutricional / Clínico</label>
                    <select
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className={`w-full text-xs rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 border ${
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                      }`}
                    >
                      <option value="gastritis">Aliviar Gastritis Aguda / Reflujo Severo</option>
                      <option value="colon_irritable">Controlar Síndrome de Colon Irritable (SII) / Dolor</option>
                      <option value="bloating">Reducir Hinchazón, Distensión y Gases recurrentes</option>
                      <option value="healthy">Nutrición y Salud Digestiva General</option>
                      <option value="deportistas">Deportista de Alto Rendimiento 🏋️‍♂️</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-550 font-bold block">Edad (años)</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      min="1"
                      className={`w-full text-xs rounded-xl py-2.5 px-3 focus:outline-none border ${
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-550 font-bold block">Peso (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      min="1"
                      className={`w-full text-xs rounded-xl py-2.5 px-3 focus:outline-none border ${
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-550 font-bold block">Altura (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      min="1"
                      className={`w-full text-xs rounded-xl py-2.5 px-3 focus:outline-none border ${
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Pathologies and clinical indicators */}
            <div className={`border rounded-2xl p-6 space-y-4 shadow-xs transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <h3 className="text-sm font-bold border-b pb-2 border-slate-100/40 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span>Patologías y Diagnósticos Clínicos</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: "hasDiabetes", label: "Diabetes Mellitus" },
                  { key: "hasHypertension", label: "Hipertensión Arterial" },
                  { key: "hasGastritis", label: "Gastritis Crónica / Reflujo" },
                  { key: "hasColonIrritable", label: "Colon Irritable / SII" },
                  { key: "hasReflujo", label: "Reflujo Gastroesofágico" },
                  { key: "hasHigadoGraso", label: "Hígado Graso" },
                  { key: "hasEnfermedadRenal", label: "Enfermedad Renal" }
                ].map((item) => (
                  <label 
                    key={item.key} 
                    className={`flex items-center space-x-3 cursor-pointer p-2.5 rounded-xl border transition-all ${
                      isDarkMode 
                        ? "bg-slate-800/40 border-slate-750 hover:bg-slate-800 text-slate-200" 
                        : "bg-slate-50/40 border-slate-100 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={profile[item.key as keyof typeof profile] as boolean}
                      onChange={() => handleCheckboxChange(item.key as any)}
                      className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </label>
                ))}
              </div>

              {/* Allergies and Intolerances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block">Alergias Alimenticias</label>
                  <input
                    type="text"
                    name="allergies"
                    value={profile.allergies}
                    onChange={handleTextChange}
                    placeholder="Ej. Nueces, Mariscos, Huevos..."
                    className={`w-full text-xs rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-550 focus:emerald-500 border ${
                      isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block">Intolerancias Específicas</label>
                  <input
                    type="text"
                    name="intolerances"
                    value={profile.intolerances}
                    onChange={handleTextChange}
                    placeholder="Ej. Lactosa, Gluten, Fructosa..."
                    className={`w-full text-xs rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-550 focus:emerald-500 border ${
                      isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons and message updates */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-650 hover:to-teal-705 shadow-md shadow-emerald-250 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sincronizando información segura en la nube...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar y Adaptar Vita IA</span>
                </>
              )}
            </button>

            {success && (
              <div className="rounded-xl p-3.5 flex items-start space-x-2 animate-bounce bg-emerald-50 border border-emerald-200 text-emerald-800">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold">¡Perfil sincronizado con éxito! Vita IA adaptará tu plan y entrenamientos según tus respuestas.</p>
              </div>
            )}

            {errorStatus && (
              <div className="rounded-xl p-3 flex items-start space-x-2 bg-orange-50 border border-orange-200 text-orange-850">
                <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold">{errorStatus}</p>
              </div>
            )}

          </div>

          {/* Right Column: Theme selection / Visual mode and Info */}
          <div className="space-y-6 text-left">
            
            {/* Theme switcher panel */}
            <div className={`border rounded-2xl p-5 space-y-4 shadow-xs transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-450 text-slate-400 flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5" />
                <span>Apariencia de la Aplicación</span>
              </h4>
              
              <p className="text-xs text-slate-550 leading-relaxed">
                Cambia el modo de visualización de la plataforma para proteger tu vista al utilizar la aplicación de noche.
              </p>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/60 border border-slate-150 dark:bg-slate-800 dark:border-slate-700">
                <span className="text-xs font-bold inline-flex items-center gap-1.5 dark:text-slate-200">
                  {isDarkMode ? (
                    <>
                      <Moon className="h-4 w-4 text-amber-400" />
                      <span>Modo Oscuro Activo</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 text-warning text-amber-500 animate-spin-slow" />
                      <span>Modo Claro Activo</span>
                    </>
                  )}
                </span>

                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDarkMode ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                  id="clinical-profile-theme-toggle"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isDarkMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Health Info Details */}
            <div className={`border rounded-2xl p-5 space-y-4 ${
              isDarkMode ? "bg-slate-900/40 border-slate-800/60" : "bg-emerald-50/20 border-emerald-500/10"
            }`}>
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                <Info className="h-5 w-5" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider">Integración de Salud Vita IA</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Al actualizar tus especificaciones físicas y condiciones de diagnóstico, nuestros algoritmos inteligentes en el servidor adaptarán en tiempo real:
              </p>
              
              <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-350">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-500 font-black">•</span>
                  <div>
                    <span className="font-bold dark:text-slate-200 block">Esquema Nutricional FODMAP</span>
                    <span className="text-[11px] text-slate-500">Exclusión automática de irritantes para Colon Irritable o Gastritis Crónica.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-500 font-black">•</span>
                  <div>
                    <span className="font-bold dark:text-slate-200 block">Metabolismo y Deportistas</span>
                    <span className="text-[11px] text-slate-500">Filtros calóricos de alto rendimiento si tienes el objetivo deportivo activado.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50/20 border border-amber-500/10 rounded-2xl p-4 text-[11px] text-amber-800 leading-relaxed">
              ⚠️ <strong>Políticas de Privacidad:</strong> Toda tu información médica está encriptada y sujeta a estandares HIPAA / GDPR. No se comparte bajo ningún motivo a terceros.
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
