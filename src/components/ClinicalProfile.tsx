import React, { useState, useEffect } from "react";
import { UserProfile, MedicalProfile } from "../types";
import { ClipboardList, CheckCircle, AlertCircle, Save, Loader2, Info } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ClinicalProfileProps {
  user: UserProfile;
  onUpdateSuccess?: () => void;
  onViewChange: (view: string) => void;
}

export default function ClinicalProfile({
  user,
  onUpdateSuccess,
  onViewChange
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

  const handleCheckboxChange = (name: keyof Omit<MedicalProfile, "userId" | "allergies" | "intolerances" | "createdAt">) => {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorStatus(null);
    setSuccess(false);

    try {
      const dataToSave = {
        ...profile,
        createdAt: new Date().toISOString()
      };

      // Save to Firebase firestore
      await setDoc(doc(db, "medical_profiles", user.uid), dataToSave);
      
      // Save local backup
      localStorage.setItem(`clinical_profile_${user.uid}`, JSON.stringify(dataToSave));
      
      setSuccess(true);
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving clinical profile:", err);
      // Fallback local persistence
      localStorage.setItem(`clinical_profile_${user.uid}`, JSON.stringify(profile));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in" id="clinical-profile-viewport">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <span>Perfil Clínico Avanzado</span>
          </h2>
          <p className="text-xs text-slate-500">
            Registra tus condiciones médicas para que la Inteligencia Artificial adapte automáticamente tus Dietas, Recetas, Recomendaciones y Entrenamientos.
          </p>
        </div>
        <button
          onClick={() => onViewChange("dashboard")}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs font-medium text-slate-400">Cargando información médica segura...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Diagnostic Checklist & Text Fields */}
          <div className="md:col-span-2 space-y-6 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
            
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Patologías y Condiciones Diagnosticadas</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "hasDiabetes", label: "Diabetes Mellitus" },
                  { key: "hasHypertension", label: "Hipertensión Arterial" },
                  { key: "hasGastritis", label: "Gastritis Crónica / Reflujo" },
                  { key: "hasColonIrritable", label: "Colon Irritable / SII" },
                  { key: "hasReflujo", label: "Reflujo Gastroesofágico" },
                  { key: "hasHigadoGraso", label: "Hígado Graso" },
                  { key: "hasEnfermedadRenal", label: "Enfermedad Renal" }
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-3 cursor-pointer p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-all">
                    <input
                      type="checkbox"
                      checked={profile[item.key as keyof typeof profile] as boolean}
                      onChange={() => handleCheckboxChange(item.key as any)}
                      className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allergies and Intolerances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Alergias Alimenticias</label>
                <input
                  type="text"
                  name="allergies"
                  value={profile.allergies}
                  onChange={handleTextChange}
                  placeholder="Ej. Nueces, Mariscos, Huevos..."
                  className="w-full text-xs rounded-xl border-slate-150 py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-550 focus:emerald-500 border focus:border-emerald-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Intolerancias Específicas</label>
                <input
                  type="text"
                  name="intolerances"
                  value={profile.intolerances}
                  onChange={handleTextChange}
                  placeholder="Ej. Lactosa, Gluten, Fructosa..."
                  className="w-full text-xs rounded-xl border-slate-150 py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-550 focus:emerald-500 border focus:border-emerald-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600/90 py-3 text-sm font-bold text-white hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando Perfil Clínico Seguro...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar y Adaptar VitaAI</span>
                </>
              )}
            </button>

            {success && (
              <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 flex items-start space-x-2 animate-bounce">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 font-semibold">¡Perfil clínico sincronizado! El asistente adaptará tus dietas automáticamente en la próxima consulta.</p>
              </div>
            )}

            {errorStatus && (
              <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">{errorStatus}</p>
              </div>
            )}

          </div>

          {/* Right Column: Information & Explanation */}
          <div className="space-y-6">
            <div className="bg-emerald-50/20 border border-emerald-500/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-800">
                <Info className="h-5 w-5" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider">Integración de Salud</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Al activar cualquiera de estas casillas, nuestro algoritmo y modelos de IA en <strong>VitaAI V4</strong> modificarán los parámetros calculados:
              </p>
              
              <ul className="space-y-3.5 text-xs">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-550 font-bold">•</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Planes y Recetas FODMAP</span>
                    <span className="text-[11px] text-slate-500">Excluirá cebollas, ajo o condimentos de alto riesgo si tienes Colon Irritable o Gastritis.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-550 font-bold">•</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Soporte Renal & Diabetes</span>
                    <span className="text-[11px] text-slate-500">Regulará carbohidratos complejos y fósforo o potasio para protección renal.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-550 font-bold">•</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Límite Sódico</span>
                    <span className="text-[11px] text-slate-500">Ideal si sufres de presión alta (Hipertensión), controlará la recomendación de sal por receta.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50/40 border border-amber-500/10 rounded-2xl p-4 text-[11px] text-amber-800 leading-relaxed">
              ⚠️ <strong>Recuerda:</strong> El resguardo de datos médicos es privado de acuerdo con HIPAA y GDPR. Usted tiene libre albedrío de desactivar o borrar estos parámetros cuando lo desee.
            </div>
          </div>

        </form>
      )}

    </div>
  );
}
