import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Stethoscope, AlertTriangle, BookOpen, MessageSquareMore } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function HelpAndFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "¿Cómo detecta VitaAI si un alimento es irritante o perjudicial?",
      a: "VitaAI utiliza modelos avanzados de visión artificial impulsados por la tecnología de Gemini. Al inspeccionar la fotografía de tus comidas con VitaScan, la IA identifica ingredientes, condimentos potenciales, grasas saturadas y carbohidratos fermentables, evaluando el nivel de riesgo en base a tu perfil personalizado o sensibilidades alimentarias."
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
      a: "No. Bajo ninguna circunstancia VitaAI sustituye el dictamen de profesionales médicos colegiados, nutricionistas calificados, laboratorios de sangre o exámenes clínicos. Las recomendaciones generadas son de apoyo de estilo de vida, preventivo y educativo general. Si experimentas dolor severo o síntomas agudos, acude de inmediato a urgencias."
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="help-faq-viewport">
      
      {/* Upper info card */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 h-56 w-56 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-4 max-w-xl">
          <h2 className="text-2xl font-bold sm:text-3xl flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-emerald-450 text-emerald-400" />
            <span>Biblioteca y Centro de Ayuda</span>
          </h2>
          <p className="text-slate-300 text-xs leading-normal">
            Aprende sobre nutrición inteligente y aprovecha el motor de análisis de VitaAI para potenciar tu salud diaria.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: FAQs Accordion */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Preguntas Frecuentes (FAQ)</h3>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-white shadow-xs overflow-hidden"
                  id={`faq-item-${idx}`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left px-5 py-4 font-bold text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-between text-sm"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-emerald-500" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-slate-50 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
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
              <span className="text-xs font-bold text-slate-700">soporte@vitaai.app</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-150 bg-amber-50/20 p-5 shadow-sm space-y-3.5">
            <div className="flex items-center space-x-2.5 text-amber-600 font-extrabold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Límite de Responsabilidad (GCP)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              La Inteligencia Artificial de VitaAI es generadora, de carácter preventivo o educativo general, y no posee habilitaciones clínicas vinculantes locales. Consulta siempre tus reportes de imagen y recetas con nutricionistas o médicos calificados antes de realizar variaciones drásticas en tu dieta diaria.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
