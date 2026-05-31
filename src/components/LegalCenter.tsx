import React from "react";
import { ShieldCheck, AlertTriangle, FileText, Lock, MessageSquare } from "lucide-react";

export default function LegalCenter() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto" id="legal-center-viewport">
      
      {/* Upper header */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Centro Legal y de Cumplimiento</h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          En Vita IA nos tomamos muy en serio tu privacidad, la responsabilidad clínica y el uso ético y transparente de la Inteligencia Artificial.
        </p>
      </div>

      {/* Mandatory Clinical Warning Banner */}
      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-6 flex items-start space-x-4 shadow-sm" id="mandatory-clinical-disclaimer">
        <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-rose-900">Mensaje Obligatorio y de Descargo Médico</h4>
          <p className="text-xs text-rose-800 leading-relaxed font-semibold">
            "Vita IA proporciona orientación general de bienestar y nutrición. No sustituye el diagnóstico ni tratamiento de profesionales de la salud."
          </p>
          <p className="text-[11px] text-rose-700 leading-relaxed mt-1">
            Cualquier sugerencia alimentaria, receta, rutina o análisis clínico de imagen proporcionada por el sistema automatizado asistido por Gemini AI es estrictamente educativo de carácter informativo. No tomes decisiones clínicas críticas sin consultar a un médico especialista calificado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Descargo Médico */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-850 flex items-center space-x-1.5 text-slate-800">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
            <span>Descargo de Responsabilidad Médica</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vita IA es un software de optimización y bienestar de hábitos alimentarios diarios para personas que experimentan colitis o acidez leve. Esta aplicación no posee habilitación como dispositivo médico o herramienta de diagnóstico.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pl-4 list-disc">
            <li>La interpretación de imágenes es netamente estimativa y probabilística.</li>
            <li>Las sugerencias de restricciones de calabazas, lácteos u otros alérgenos gástricos deben ser validadas.</li>
            <li>En caso de dolor agudo, sangrado o síntomas severos, acuda a urgencias inmediatamente.</li>
          </ul>
        </div>

        {/* Términos y Condiciones */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-850 flex items-center space-x-1.5 text-slate-800">
            <FileText className="h-4.5 w-4.5 text-blue-600" />
            <span>Términos y Condiciones de Uso</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Al acceder a Vita IA, aceptas el uso responsable de nuestros chatbots e intercomunicadores interactivos. Queda prohibida la automatización externa o el scraping de las funciones de análisis visual por lote.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pl-4 list-disc">
            <li>El usuario es único responsable de los alimentos ingeridos en su día a día.</li>
            <li>La suscripción premium otorga un derecho de uso intransferible y personal.</li>
            <li>El abuso del chat de entrenamiento resultará en una suspensión temporal para regular costos de servicios.</li>
          </ul>
        </div>

        {/* Política de Privacidad */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-850 flex items-center space-x-1.5 text-slate-800">
            <Lock className="h-4.5 w-4.5 text-teal-600" />
            <span>Política de Privacidad y Datos</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sus datos, perfiles familiares, diagnósticos de comidas registradas y respuestas del chat clínico se procesan con altísima seguridad mediante encriptación SSL y bases de datos Firestore privadas.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pl-4 list-disc">
            <li>Las imágenes que cargas no se guardan de forma permanente para entrenar modelos públicos externos.</li>
            <li>Usted posee el derecho de borrar todo el historial en cualquier momento.</li>
            <li>No vendemos ni alquilamos registros clínicos y médicos a laboratorios farmacéuticos o aseguradoras.</li>
          </ul>
        </div>

        {/* Uso Responsable de IA */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-850 flex items-center space-x-1.5 text-slate-800">
            <MessageSquare className="h-4.5 w-4.5 text-violet-600" />
            <span>Uso Ético y Responsable de IA</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            La inteligencia artificial generativa asistida por Google Gemini es una poderosa herramienta para acelarar ideas culinarias, pero carece de la empatía humana de un médico físico.
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pl-4 list-disc">
            <li>No intente engañar deliberadamente a la IA ingresando imágenes no comestibles.</li>
            <li>Reconozca el riesgo de "alucinaciones de IA" en conteo calórico extremo.</li>
            <li>Promovemos un ecosistema libre de sesgos para personas de todas las edades y complexiones biológicas.</li>
          </ul>
        </div>

      </div>

      {/* Certification sign warning */}
      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-[11px] text-slate-400 leading-relaxed text-center">
        © 2026 Vita IA Inc. Todos los derechos reservados. El cumplimiento normativo de este software se apega a las pautas éticas globales de salud digital preventiva.
      </div>

    </div>
  );
}
