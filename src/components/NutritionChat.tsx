import React, { useState, useRef, useEffect } from "react";
import { UserProfile, ChatMessage } from "../types";
import { Send, ArrowLeft, RefreshCcw, HeartHandshake, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface NutritionChatProps {
  user: UserProfile;
  initialChatHistory: ChatMessage[];
  onSaveChatMessage: (messages: ChatMessage[]) => Promise<void>;
  onViewChange: (view: string) => void;
}

export default function NutritionChat({
  user,
  initialChatHistory,
  onSaveChatMessage,
  onViewChange
}: NutritionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialChatHistory.length > 0 
      ? initialChatHistory 
      : [
          {
            role: "model",
            content: `Hola, soy tu especialista de **VitaCoach** de **VitaAI**. Estoy entrenado para resolver tus dudas sobre nutrición, guiarte en hábitos saludables, planificar tus ingestas y ayudarte a mejorar tu bienestar integral digestivo.\n\n¿Tienes alguna duda sobre qué alimentos son ideales para ti hoy, o cómo estructurar tu próxima comida saludable?`
          }
        ]
  );
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || sending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userConditions: user.objective || "colon irritable"
        })
      });

      const data = await response.json();

      const modelMessage: ChatMessage = {
        role: "model",
        content: data.reply || "Disculpas, no obtuve respuesta adecuada. Te aconsejo tomar agua templada e infusiones suaves.",
        createdAt: new Date().toISOString()
      };

      const updatedHistory = [...messages, userMessage, modelMessage];
      setMessages(updatedHistory);
      
      // Save history inside firestore
      await onSaveChatMessage(updatedHistory);

    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Ocurrió un error en la conexión. Para regular la mucosa gástrica, es aconsejable evitar alimentos procesados, picantes y calientes. Inténtalo de nuevo en unos minutos.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const presetQueries = [
    "¿Qué puedo cenar si tengo gastritis aguda?",
    "¿Qué bebidas desinflaman el Colon Irritable?",
    "¿Puedo comer aguacate si tengo SII?",
    "Lista de alimentos con alto FODMAP que debo evitar"
  ];

  return (
    <div className="flex flex-col h-[600px] border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden animate-fade-in" id="nutrition-chat-viewport">
      
      {/* Chat header panel */}
      <div className="bg-slate-50 border-b border-slate-150 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-extrabold shadow-sm">
            <span>IA</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Asistente de Salud Digestiva</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Especialidad: Gastroenterología & Nutrición</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setMessages([
              {
                role: "model",
                content: `Hola. He reiniciado la sesión de consulta. Estoy listo para ayudarte con tus dudas gastrointestinales.`
              }
            ]);
          }}
          className="p-1 px-2.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors"
          id="clear-chat-history-btn"
        >
          <RefreshCcw className="h-3 w-3" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Warning Alert banner */}
      <div className="bg-amber-50/50 border-b border-amber-100 px-4 py-2 flex items-start space-x-2">
        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-700 leading-tight">
          <strong>Atención</strong>: Las respuestas de VitaCoach / VitaAI son de carácter dietético y de apoyo educativo, no sustituyen una consulta profesional médica ni diagnósticos de laboratorios.
        </p>
      </div>

      {/* Messages layout */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-slate-50/20">
        {messages.map((msg, index) => {
          const isModel = msg.role === "model";
          return (
            <div 
              key={index} 
              className={`flex ${isModel ? "justify-start" : "justify-end"}`}
              id={`chat-bubble-${index}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                isModel 
                  ? "bg-white border border-slate-100 text-slate-700 rounded-tl-none" 
                  : "bg-emerald-500 text-white rounded-tr-none"
              }`}>
                {/* Formatter for block headers and item structures inside responses */}
                <div className="whitespace-pre-wrap">
                  {msg.content.split("\n").map((line, lIdx) => {
                    // Render simple lists/bold headers to create polished look in Chat response
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                      return (
                        <div key={lIdx} className="pl-4 py-0.5 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      );
                    }
                    if (line.startsWith("### ")) {
                      return <h4 key={lIdx} className="font-bold text-sm text-slate-800 mt-2 mb-1">{line.substring(4)}</h4>;
                    }
                    if (line.startsWith("## ")) {
                      return <h3 key={lIdx} className="font-extrabold text-base text-slate-800 mt-3 mb-1">{line.substring(3)}</h3>;
                    }
                    // Basic bold formatting replacements
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    if (boldRegex.test(line)) {
                      const pieces = line.split(boldRegex);
                      return (
                        <p key={lIdx} className="mb-1.5">
                          {pieces.map((piece, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-slate-900">{piece}</strong> : piece)}
                        </p>
                      );
                    }
                    
                    return <p key={lIdx} className="mb-1.5">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          );
        })}
        
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-white border border-slate-100 text-slate-400 text-sm italic rounded-tl-none flex items-center space-x-1.5">
              <span>VitaCoach está formulando tu respuesta inteligente</span>
              <span className="flex space-x-0.5 mt-1.5">
                <span className="h-1.5 w-1.5 bg-slate-350 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-350 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-350 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Preset prompt indicators */}
      {messages.length <= 1 && !sending && (
        <div className="px-4 py-3 border-t border-slate-150 bg-slate-50/50 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sugerencias Clínicas comunes:</span>
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((query, idx) => (
              <button
                key={idx}
                id={`preset-chat-query-${idx}`}
                onClick={() => handleSendMessage(query)}
                className="text-xs bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 rounded-lg px-2.5 py-1.5 transition-all text-left truncate"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat bottom control bar */}
      <div className="p-3 border-t border-slate-150 bg-white">
        <form 
          id="chat-submit-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            id="chat-message-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={sending}
            placeholder={sending ? "Procesando aclaratoria..." : "Pregúntale a VitaCoach (ej. ¿Qué snack saludable me recomiendas para la tarde?)"}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={sending || !inputValue.trim()}
            className="rounded-xl bg-emerald-500 p-2.5 text-white hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-40"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
