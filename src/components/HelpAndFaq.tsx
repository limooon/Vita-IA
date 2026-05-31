import React, { useState, useEffect } from "react";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Stethoscope, 
  AlertTriangle, 
  BookOpen, 
  FileText, 
  PlusCircle, 
  History, 
  Send, 
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { UserProfile, UserClaim } from "../types";

interface HelpAndFaqProps {
  user?: UserProfile;
}

export default function HelpAndFaq({ user }: HelpAndFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  // Reclamaciones states
  const [claims, setClaims] = useState<UserClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState<boolean>(false);
  const [claimTitle, setClaimTitle] = useState<string>("");
  const [claimCategory, setClaimCategory] = useState<string>("app_funcionamiento");
  const [claimDescription, setClaimDescription] = useState<string>("Especifica detalladamente tu sugerencia, reporte o reclamación...");
  const [claimDescriptionCustom, setClaimDescriptionCustom] = useState<string>("");
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const faqs = [
    {
      q: "¿Cómo detecta Vita IA si un alimento es irritante o perjudicial?",
      a: "Vita IA utiliza modelos avanzados de visión artificial impulsados por la tecnología de Gemini. Al inspeccionar la fotografía de tus comidas con VitaScan, la IA identifica ingredientes, condimentos potenciales, grasas saturadas y carbohidratos fermentables, evaluando el nivel de riesgo en base a tu perfil personalizado o sensibilidades alimentarias."
    },
    {
      q: "¿Cuáles son los principales desencadenantes de gastritis?",
      a: "Los estimulantes y alimentos irritantes más comunes para la mucosa estomacal incluyen: pimienta negra, ají picante, fritos con grasas refinadas, ajo y cebolla sin cocer del todo, tomates ácidos, cítricos crudos, cafeína y alcohol. Las recetas de VitaRecipes omiten o modifican de forma inteligente estos ingredientes para optimizar tu pH gástrico."
    },
    {
      q: "¿Qué significan los niveles de riesgo alimentario (Bajo, Medio, Alto)?",
      a: "• BAJO (Verde): Alimentos estables de fácil asimilación, bajos en FODMAPs y sin acidez añadida.\n• MEDIO (Amarillo): Tolerable para la mayoría de pacientes en remisión. Vigilancia individual (ej. lácteos ligeros, aguacates).\n• ALTO (Rojo): Alta probabilidad de causar espasmos, reflujo o inflamación del colon. Restricción inmediata si tienes brotes."
    },
    {
      q: "¿Cómo se calcula la estimación de calorías, proteínas y grasas?",
      a: "El algoritmo visual evalúa el volumen relativo de los alimentos identificados en los píxeles de la fotografía para deducir una porción promedio de restaurante. En función de la densidad calórica de los alimentos detectados, calcula un rango clínico estimado de macronutrientes."
    },
    {
      q: "¿Sustituye esta aplicación la consulta con un gastroenterólogo o nutricionista?",
      a: "No. Bajo ninguna circunstancia Vita IA sustituye el dictamen de profesionales médicos colegiados, nutricionistas calificados, laboratorios de sangre o exámenes clínicos. Las recomendaciones generadas son de apoyo de estilo de vida, preventivo y educativo general. Si experimentas dolor severo o síntomas agudos, acude de inmediato a urgencias."
    }
  ];

  // Fetch claims history
  const fetchClaims = async () => {
    if (!user) return;
    setClaimsLoading(true);
    try {
      const claimsRef = collection(db, "users", user.uid, "claims");
      const snap = await getDocs(claimsRef);
      const fetched: UserClaim[] = [];
      snap.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as UserClaim);
      });
      // Sort by date descending
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClaimsClaimsList(fetched);
    } catch (err) {
      console.warn("Firestore pull failure or rule block. Sourcing local storage backups instead.", err);
      // Fail proof backup
      try {
        const stored = localStorage.getItem(`vitaia_claims_${user.uid}`);
        if (stored) {
          setClaims(JSON.parse(stored));
        }
      } catch (_) {}
    } finally {
      setClaimsLoading(false);
    }
  };

  const setClaimsClaimsList = (list: UserClaim[]) => {
    setClaims(list);
    if (user) {
      try {
        localStorage.setItem(`vitaia_claims_${user.uid}`, JSON.stringify(list));
      } catch (_) {}
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [user]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const descText = claimDescriptionCustom.trim() || claimDescription;
    if (!claimTitle.trim() || !descText.trim()) return;

    setSubmittingClaim(true);
    setSuccessMessage("");

    const newClaim: Omit<UserClaim, "id"> = {
      userId: user.uid,
      title: claimTitle.trim(),
      category: claimCategory,
      description: descText,
      status: "Pendiente",
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save to firestore
      const claimsRef = collection(db, "users", user.uid, "claims");
      const savedDoc = await addDoc(claimsRef, newClaim);
      
      // Update state
      const claimWithId: UserClaim = { id: savedDoc.id, ...newClaim };
      const updated = [claimWithId, ...claims];
      setClaimsClaimsList(updated);

      setSuccessMessage("Tu reclamación o sugerencia ha sido registrada exitosamente. Nuestro equipo revisará los detalles a la brevedad.");
      setClaimTitle("");
      setClaimDescriptionCustom("");
    } catch (err) {
      console.warn("Database rules restriction or offline state. Backing up locally.", err);
      // 2. Safe local storage backup fallback
      const mockId = `claim_local_${Date.now()}`;
      const claimWithId: UserClaim = { id: mockId, ...newClaim };
      const updated = [claimWithId, ...claims];
      setClaimsClaimsList(updated);

      setSuccessMessage("Tu solicitud ha sido guardada de forma segura de manera offline e historial.");
      setClaimTitle("");
      setClaimDescriptionCustom("");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "servicio": return "Servicio al Cliente";
      case "app_funcionamiento": return "Funcionamiento de la App";
      case "pagos": return "Pagos/Suscripciones";
      case "nutricion": return "Errores de Nutrición";
      case "otro": default: return "Otro asunto";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="help-faq-viewport">
      
      {/* Upper info card */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 h-56 w-56 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-4 max-w-xl">
          <h2 className="text-2xl font-bold sm:text-3xl flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-emerald-400" />
            <span>Biblioteca y Centro de Ayuda</span>
          </h2>
          <p className="text-slate-300 text-xs leading-normal">
            Aprende sobre nutrición inteligente y aprovecha el motor de análisis de Vita IA para potenciar tu salud diaria.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: FAQs Accordion */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Preguntas Frecuentes (FAQ)</h3>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-colors"
                    id={`faq-item-${idx}`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between text-sm"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-emerald-500" /> : <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-550" />}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-slate-50 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Soportes e Historial de Reclamaciones */}
          {user && (
            <div className="space-y-6 pt-2" id="claims-management-section">
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Gestión de Reclamaciones y Sugerencias</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mb-6">
                  Queremos brindarte el mejor servicio. Si detectas un error en el diagnóstico de VitaScan, tienes incidentes con tu pago de suscripción Plus, o deseas reportar alguna falla técnica, puedes levantar un folio oficial a continuación.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Form to submit claim */}
                <div className="rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                    <span>Nueva Solicitud / Reclamación</span>
                  </h4>

                  {successMessage && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-2 animate-fade-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitClaim} className="space-y-4.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5">Motivo o Título breve *</label>
                      <input 
                        type="text"
                        required
                        value={claimTitle}
                        onChange={(e) => setClaimTitle(e.target.value)}
                        placeholder="Ej. Cobro doble mensual / Desalineación VitaScan"
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-755 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5">Categoría *</label>
                        <select
                          value={claimCategory}
                          onChange={(e) => setClaimCategory(e.target.value)}
                          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="app_funcionamiento">Falla de Funcionamiento en App</option>
                          <option value="servicio">Servicio al Cliente / Dudas</option>
                          <option value="pagos">Suscripción y Pagos de Membresía</option>
                          <option value="nutricion">Error de macronutrientes en Análisis</option>
                          <option value="otro">Asunto General o Sugerencia</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5">Descripción de la Reclamación *</label>
                      <textarea
                        required
                        rows={3}
                        value={claimDescriptionCustom}
                        onChange={(e) => setClaimDescriptionCustom(e.target.value)}
                        placeholder="Describe con precisión qué ocurrió, qué esperabas y las fechas aproximadas..."
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-750 p-3.5 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none leading-relaxed placeholder:text-slate-400"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingClaim || !claimTitle.trim() || (!claimDescriptionCustom.trim() && !claimDescription.trim())}
                      className="w-full rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-3 flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-55"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{submittingClaim ? "Registrando folio..." : "Enviar Reclamación Oficial"}</span>
                    </button>
                  </form>
                </div>

                {/* History list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <History className="h-4 w-4 text-emerald-500" />
                    <span>Historial de Reclamaciones ({claims.length})</span>
                  </h4>

                  {claimsLoading ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-500" />
                      <p className="text-xs text-slate-400">Consultando historial legal...</p>
                    </div>
                  ) : claims.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400">
                      No tienes reclamaciones activas o sugerencias iniciadas en el sistema. Todas tus solicitudes se listarán aquí en tiempo real de forma segura.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {claims.map((cl) => (
                        <div 
                          key={cl.id}
                          className="p-4 bg-white rounded-xl border border-slate-150 shadow-xxs space-y-2.5 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] bg-slate-100 text-slate-650 font-bold px-2 py-0.5 rounded-md inline-block mb-1">
                                {getCategoryLabel(cl.category)}
                              </span>
                              <h5 className="text-xs font-bold text-slate-800 leading-tight">{cl.title}</h5>
                            </div>
                            
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider block font-mono ${
                              cl.status === "Resuelto" 
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                : cl.status === "En Revisión"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {cl.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                            {cl.description}
                          </p>

                          {cl.response && (
                            <div className="mt-2.5 p-2.5 bg-emerald-500/5 border border-emerald-100 rounded-lg text-[11px] text-slate-750">
                              <span className="font-extrabold text-emerald-800 block text-[9px] uppercase tracking-wider mb-0.5">Respuesta de la Administración:</span>
                              {cl.response}
                            </div>
                          )}

                          <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 pt-1.5 border-t border-slate-50 justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{new Date(cl.createdAt).toLocaleDateString("es-ES")} a las {new Date(cl.createdAt).toLocaleTimeString("es-ES", {hour: "2-digit", minute:"2-digit"})}</span>
                            </span>
                            <span className="font-mono font-semibold text-slate-300">ID: {cl.id?.slice(-8) || "Local"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contact & Security disclosures */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">Soporte Médico</h3>

          <div className="rounded-2xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 text-emerald-600">
              <Stethoscope className="h-5 w-5" />
              <h4 className="text-sm font-bold">Asesoramiento Nutricional</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              ¿Tienes condiciones gastroenterológicas heredadas o eres intolerante al gluten severo? Te sugerimos usar el chat interactivo para detallarle tus diagnósticos al asistente virtual.
            </p>
            <div className="pt-2 border-t border-slate-50">
              <span className="text-[10px] text-slate-400 font-mono block">Canal de atención regular:</span>
              <span className="text-xs font-bold text-slate-700">soporte@vitaia.app</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-150 bg-amber-50/20 p-5 shadow-sm space-y-3.5">
            <div className="flex items-center space-x-2.5 text-amber-600 font-extrabold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Límite de Responsabilidad (GCP)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              La Inteligencia Artificial de Vita IA es generadora, de carácter preventivo o educativo general, y no posee habilitaciones clínicas vinculantes locales. Consulta siempre tus reportes de imagen y recetas con nutricionistas o médicos calificados antes de realizar variaciones drásticas en tu dieta diaria.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
