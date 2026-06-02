import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { GoogleGenAI, Type } from "@google/genai";
import { getAIProvider } from "./src/lib/ai-providers";
import { initFirebaseAdmin, checkServerLimit, trackServerUsage } from "./server/lib/usage";
import { getCachedResponse, setCachedResponse, getCacheStats } from "./server/lib/cache";

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// High-limit parser for food images base64 data payloads
// IMPORTANT: Stripe webhook must receive raw body before JSON parsing
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// ─── Stripe ──────────────────────────────────────────────

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
let stripeClient: Stripe | null = null;

if (stripeSecretKey) {
  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2025-03-31.basil" as any,
  });
}

const STRIPE_PRICE_PREMIUM = process.env.STRIPE_PRICE_PREMIUM || "price_premium_monthly";
const STRIPE_PRICE_MAX = process.env.STRIPE_PRICE_MAX || "price_vita_max_monthly";

// ─── Multi-AI Provider ───────────────────────────────────

const aiProvider = getAIProvider();

// Legacy Gemini client for backward-compatible endpoints
const geminiKey = process.env.GEMINI_API_KEY || "";
const legacyGemini = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

// aiClient wraps the new provider + legacy Gemini as fallback
const aiClient = {
  isAvailable: !!aiProvider.isAvailable || !!legacyGemini,
  models: {
    generateContent: async (params: any): Promise<any> => {
      // Try new multi-provider first
      if (aiProvider.isAvailable) {
        try {
          return await adaptToProvider(params);
        } catch (e) {
          console.warn("Multi-provider call failed, falling back to Gemini:", (e as Error).message);
        }
      }
      // Legacy Gemini fallback
      if (legacyGemini) return legacyGemini.models.generateContent(params);
      throw new Error("No AI configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY in .env");
    },
  },
  chats: {
    create: (params: any) => ({
      sendMessage: async (msg: any) => {
        if (aiProvider.isAvailable) {
          try {
            const prompt = typeof msg.message === "string" ? msg.message : msg.message?.parts?.[0]?.text || "";
            const history = (params.history || []).map((h: any) => ({
              role: h.role === "model" ? "assistant" : "user",
              content: h.parts?.[0]?.text || "",
            }));
            const r = await aiProvider.execute({
              task: "chat",
              prompt,
              systemPrompt: params.config?.systemInstruction || "",
              history,
              model: "deepseek-chat",
            });
            return { text: r.text };
          } catch {}
        }
        if (legacyGemini) {
          const session = legacyGemini.chats.create(params);
          return session.sendMessage(msg);
        }
        return { text: "AI no disponible." };
      },
    }),
  },
};

async function adaptToProvider(params: any): Promise<{ text: string }> {
  const isVision = params.contents?.some?.((c: any) => c?.inlineData) || false;
  const contentParts = Array.isArray(params.contents) ? params.contents : [params.contents];
  const promptText = contentParts.find((c: any) => c?.text || typeof c === "string")?.text || "";
  const imgPart = contentParts.find((c: any) => c?.inlineData);
  const imageBase64 = imgPart?.inlineData?.data || null;
  const schema = params.config?.responseSchema || null;
  const sysInstruction = params.config?.systemInstruction || null;

  const result = await aiProvider.execute({
    task: isVision ? "vision" : (schema ? "structured" : "generate"),
    prompt: promptText,
    imageBase64: imageBase64 || undefined,
    systemPrompt: sysInstruction,
    schema: schema || undefined,
    temperature: params.config?.temperature,
  });

  return {
    text: result.parsed ? JSON.stringify(result.parsed) : result.text,
  };
}

// ─── Firebase Admin (Usage Tracking) ─────────────────────

initFirebaseAdmin();

// ─── Helpers ─────────────────────────────────────────────

function extractUserId(req: express.Request): string | null {
  return (req.body?.userId as string) || (req.headers["x-user-id"] as string) || null;
}

function extractPlan(req: express.Request): "free" | "premium" | "vita_ia_max" {
  const plan = (req.body?.plan || req.headers["x-user-plan"] || "free") as string;
  if (plan === "premium" || plan === "vita_ia_max") return plan;
  return "free";
}

async function enforceLimit(
  req: express.Request,
  res: express.Response,
  event: "analysis" | "chat"
): Promise<boolean> {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Usuario no autenticado. Incluye userId o x-user-id." });
    return false;
  }
  const plan = extractPlan(req);
  const check = await checkServerLimit(userId, plan, event);
  if (!check.allowed) {
    res.status(429).json({
      error: `Has alcanzado el límite de ${event === "analysis" ? "análisis" : "consultas"} de tu plan ${plan}.`,
      used: check.used,
      limit: check.limit,
      remaining: 0,
      upgradeUrl: "/?view=premium",
    });
    return false;
  }
  return true;
}

function getMockFallback(type: string, body: any): any {
  // Return mock data when AI is unavailable
  const mocks: Record<string, any> = {
    "analyze-food": {
      foods_detected: ["Pechuga de pollo", "Arroz integral", "Ensalada verde"],
      estimated_calories: 450,
      protein: 38,
      carbs: 42,
      fat: 14,
      confidence: "Media",
      digestive_risk: "Low",
      recommendations: [
        "Reduce las porciones de arroz si sufres de inflamación postprandial.",
        "Evita aderezos industriales con vinagre y conservadores."
      ],
      alternatives: [
        "Sustituye el arroz integral por quinoa cocida al vapor.",
        "Cambia la pechuga de pollo frita por filete de pescado al horno."
      ],
      imageUrl: body.imageBase64 || ""
    },
    "chat": "¡Hola! Soy tu nutricionista virtual. Como el motor de IA no está configurado, trabajo en modo offline. ¿En qué puedo ayudarte con tu alimentación y salud digestiva?",
    "generate-recipe": {
      title: "Bowl Nutritivo de Quinoa y Verduras al Vapor",
      category: body.category || "healthy",
      ingredients: ["1 taza de quinoa", "1/2 calabacín", "1 zanahoria", "Aceite de oliva virgen extra"],
      preparation: ["Cocina la quinoa 15 min.", "Saltea las verduras al vapor.", "Mezcla y sirve tibio."],
      calories: 380,
      benefits: ["Rico en fibra soluble que protege la mucosa intestinal."],
      isPremium: false
    },
    "meal-plan": {
      durationDays: body.durationDays || 7,
      goal: body.objective || "healthy",
      planDays: [{ day: 1, breakfast: "Avena con papaya", snack1: "Plátano", lunch: "Pollo con verduras", snack2: "Yogur natural", dinner: "Sopa de calabaza" }]
    },
    "digestive": { report: "No se detectaron patrones de inflamación significativos en tu historial reciente.", correlations: [] },
    "grocery": {
      productName: "Producto Genérico",
      sugars: "Medio", fats: "Bajo", sodium: "Moderado",
      preservatives: "Mínimos", colorants: "Ninguno",
      ultraprocessed: "Bajo", digestiveScore: 85, nutritionScore: 78,
      classification: "Bueno",
      alternatives: ["Opción casera sin aditivos.", "Versión orgánica sin conservadores."],
      analysisSummary: "Producto con perfil nutricional aceptable."
    },
    "coach-summary": "### Tu Coach IA 💚\n\n¡Gran trabajo esta semana! Mantén tu hidratación al día y prioriza alimentos frescos. Tu puntuación de bienestar digestivo es buena.",
    "shopping-list": {
      createdAt: new Date().toISOString(),
      items: [{ category: "Proteínas", name: "Pechuga de Pollo Orgánica", checked: false }, { category: "Verduras", name: "Calabaza de Castilla", checked: false }],
      estimatedCost: 350
    },
    "fitness-routine": {
      title: "Rutina Full Body", description: "Entrenamiento completo de 45 min.",
      timeframe: "daily",
      sessions: [{ name: "Día 1", exercises: [{ exercise: "Sentadillas", series: 3, repetitions: 12, time: "45s", rest: "60s" }] }]
    },
    "mind-zen": { reframed_thought: "Tu pensamiento ha sido reestructurado hacia una perspectiva más equilibrada y consciente.", zen_insight: "La calma no es ausencia de tormenta, sino paz en medio de ella." },
    "coach-performance": "### VitaCoach Performance ⚡\n\nTu rendimiento es estable. Recomendamos 7-8h de sueño para optimizar la recuperación."
  };
  return mocks[type] || {};
}

// 1. Health Status API
app.get("/api/health", (req, res) => {
  const cacheStats = getCacheStats();
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    ai: {
      gemini: !!process.env.GEMINI_API_KEY,
      deepseek: !!process.env.OPENROUTER_API_KEY,
      provider: aiClient.isAvailable ? "active" : "mock",
    },
    stripe: !!stripeClient,
    cache: cacheStats,
    timestamp: new Date().toISOString(),
  });
});

// 2. Food Image Analysis API (Gemini Vision + usage tracking + cache)
app.post("/api/analyze-food", async (req, res) => {
  const { imageBase64, imagesBase64, userConditions, userId } = req.body;

  // Enforce usage limit
  if (userId) {
    const limit = await enforceLimit(req, res, "analysis");
    if (!limit) return;
  }

  const imagesList = Array.isArray(imagesBase64) && imagesBase64.length > 0
    ? imagesBase64
    : (imageBase64 ? [imageBase64] : []);

  if (imagesList.length === 0) {
    return res.status(400).json({ error: "No se proporcionó ninguna imagen en base64" });
  }

  // Check cache
  const cacheKey = { imagesCount: imagesList.length, conditions: userConditions };
  const cached = getCachedResponse("analyze-food", cacheKey, "vision");
  if (cached) {
    return res.json({ success: true, cached: true, ...cached });
  }

  if (!aiClient.isAvailable) {
    const mock = getMockFallback("analyze-food", req.body);
    setCachedResponse("analyze-food", cacheKey, mock, "vision");
    if (userId) trackServerUsage(userId, "analysis");
    return res.json({ success: true, mock: true, imageUrl: imagesList[0], ...mock });
  }

  try {
    const conditionsStr = Array.isArray(userConditions) ? userConditions.join(", ") : "gastritis, colon irritable";

    const prompt = `
Eres un médico gastroenterólogo y nutricionista clínico de alta precisión.
Analiza la(s) fotografía(s) de este plato de comida.
1. Identifica alimentos/ingredientes visibles.
2. Estima calorías, proteínas (g), carbohidratos (g), grasas (g).
3. Confianza: "Alta", "Media", "Baja".
4. Riesgo digestivo para alguien con: ${conditionsStr} → "Low", "Medium", "High".
5. 3 recomendaciones clínicas para reducir irritación gástrica.
6. 3 alternativas más saludables.

IMPORTANTE: JSON estricto sin markdown. Esquema:
{
  "foods_detected": ["string"],
  "estimated_calories": int,
  "protein": float, "carbs": float, "fat": float,
  "confidence": "Alta|Media|Baja",
  "digestive_risk": "Low|Medium|High",
  "recommendations": ["string"],
  "alternatives": ["string"]
}`;

    const result = await aiProvider.execute({
      task: "vision",
      prompt,
      imageBase64: imagesList[0],
      model: "gemini",
      temperature: 0.3,
      schema: {
        type: "object",
        properties: {
          foods_detected: { type: "array", items: { type: "string" } },
          estimated_calories: { type: "integer" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          confidence: { type: "string" },
          digestive_risk: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          alternatives: { type: "array", items: { type: "string" } },
        },
      },
    });

    const data = result.parsed || {};
    setCachedResponse("analyze-food", cacheKey, data, "vision");
    if (userId) trackServerUsage(userId, "analysis");
    return res.json({ success: true, imageUrl: imagesList[0], model: result.model, ...(data as Record<string, any>) });

  } catch (err: any) {
    console.error("analyze-food error:", err.message);
    const mock = getMockFallback("analyze-food", req.body);
    if (userId) trackServerUsage(userId, "analysis");
    return res.json({ success: true, mock: true, imageUrl: imagesList[0], ...mock });
  }
});

// 3. Digestive Chatbot AI (DeepSeek via OpenRouter + usage tracking)
app.post("/api/chat", async (req, res) => {
  const { messages, userConditions, userId } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Historial de mensajes requerido" });
  }

  // Enforce usage limit
  if (userId) {
    const limit = await enforceLimit(req, res, "chat");
    if (!limit) return;
  }

  // Check cache (only for repeated queries)
  const lastMsg = messages[messages.length - 1]?.content?.slice(0, 200);
  const cached = lastMsg ? getCachedResponse("chat", { q: lastMsg, cond: userConditions }, "text") : null;
  if (cached) {
    return res.json({ success: true, reply: cached, cached: true });
  }

  if (!aiClient.isAvailable) {
    const mock = getMockFallback("chat", req.body);
    if (userId) trackServerUsage(userId, "chat");
    return res.json({ success: true, reply: mock, mock: true });
  }

  try {
    const history: { role: "user" | "assistant"; content: string }[] = messages.slice(0, -1).map((m: any) => ({
      role: (m.role === "model" ? "assistant" : "user") as "user" | "assistant",
      content: String(m.content || ""),
    }));

    const result = await aiProvider.execute({
      task: "chat",
      prompt: messages[messages.length - 1]?.content || "",
      systemPrompt: `Eres un médico gastroenterólogo virtual estrella y nutricionista clínico de VitaAI. Condiciones del usuario: ${userConditions || "Colon Irritable y Gastritis"}. Responde en español, tono cálido y profesional. Limita a 500 palabras. NUNCA recetes medicamentos, solo recomienda alimentos, infusiones, y hábitos.`,
      history,
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 1200,
    });

    const reply = result.text;
    if (lastMsg && reply) setCachedResponse("chat", { q: lastMsg, cond: userConditions }, reply, "text");
    if (userId) trackServerUsage(userId, "chat");
    return res.json({ success: true, reply, model: result.model });

  } catch (err: any) {
    console.error("chat error:", err.message);
    const mock = getMockFallback("chat", req.body);
    if (userId) trackServerUsage(userId, "chat");
    return res.json({ success: true, reply: mock, mock: true });
  }
});

// 3.5. VitaMind Psychological & Zen Decompression API
app.post("/api/mind-zen", async (req, res) => {
  const { action, thought, currentFeeling } = req.body;

  if (!aiClient) {
    // Return high quality diagnostic mock fallbacks if Gemini API key isn't provided.
    if (action === "cbt_reframe") {
      return res.json({
        success: true,
        mock: true,
        reframed: `Sé que tengo muchas pendientes hoy, pero las iré resolviendo paso a paso. He superado días complejos antes, y mi valor como persona no depende de terminar todo perfectamente hoy.`,
        clinical_commentary: "Este pensamiento contiene distorsiones de 'catastrofización' y 'adivinación del futuro'. El cuerpo interpreta este estrés mental como una señal de peligro real, deteniendo la irrigación sanguínea del estómago para enviarla a los músculos, lo que suele exacerbar el reflujo tensional y el espasmo digestivo.",
        breathing_technique: "Respiración de Resonancia (Inhala 5s, Exhala 5s) para calmar el nervio vago."
      });
    } else {
      return res.json({
        success: true,
        mock: true,
        recommendations: [
          "Suelta voluntariamente los hombros y destraba la mandíbula; la tensión gástrica suele reflejarse ahí.",
          "Toma una taza de infusión tibia de manzanilla o toronjil sin prisas para calentar el abdomen.",
          "Sal a caminar 5 minutos a paso lento, enfocándote únicamente en el contacto de la planta del pie con el suelo."
        ],
        breathing_pattern: "Método 4-7-8 (Inhala 4s, Retén 7s, Exhala largo 8s)",
        mantra: "Suelto la expectativa del control de lo incierto; este momento es suficiente.",
        psychological_insight: "Cuando percibes una amenaza emocional, tu amígdala cerebral activa el sistema simpático. Esto disminuye la secreción de moco protector de la barrera estomacal, acelerando el tránsito intestinal o cerrando el píloro, lo que causa acidez."
      });
    }
  }

  try {
    if (action === "cbt_reframe") {
      const promptText = `
        Eres un psicoterapeuta cognitivo-conductual estrella y experto en mindfulness científico de la plataforma VitaMind.
        El usuario está experimentando un espiral de pensamientos disfuncionales u origen de estrés agudo que le está afectando mentalmente y somatizando tensionalmente en la salud.
        Su pensamiento negativo literal es: "${thought || "Tengo demasiado estrés y no creo poder salir adelante."}"
        
        Realiza una reestructuración cognitiva clínica para:
        1. Identificar distorsiones (catastrofismo, blanco o negro, lectura de mente).
        2. Formular un pensamiento sumamente realista, adaptativo, racional y autocompasivo (reframed).
        3. Comentar brevemente cómo el estrés y este tipo de pensamientos tensionales bloquean el sistema digestivo a través de la vía del eje intestino-cerebro (nervio vago).
        4. Proponer 3 pasos breves para de-escalar este pensamiento.

        IMPORTANTE: Devuelve la respuesta estrictamente bajo el formato de esquema JSON especificado. No agregues texto antes ni después de las llaves del JSON.
      `;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reframed: {
                type: Type.STRING,
                description: "Pensamiento racional alternativo adaptativo muy pulido en español"
              },
              clinical_commentary: {
                type: Type.STRING,
                description: "Breve comentario psicológico explicativo sobre distorsiones afectando el eje cerebro-intestino"
              },
              breathing_technique: {
                type: Type.STRING,
                description: "Técnica de respiración práctica recomendada"
              }
            },
            required: ["reframed", "clinical_commentary", "breathing_technique"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        success: true,
        mock: false,
        ...parsed
      });

    } else {
      const promptText = `
        Eres un terapeuta zen, psicólogo clínico y guía clínico de reducción de estrés (MBSR).
        El usuario indica que se siente sobrepasado por el siguiente padecimiento o emoción: "${currentFeeling || "Estrés generalizado"}"
        
        Por favor, devuélveme una guía de anclaje de emergencia:
        1. Explícale brevemente la relación somática de esta emoción con su cuerpo (ej. tensión gástrica, vasoconstricción local).
        2. Proporciona una lista de 3 recomendaciones prácticas y oportunas que pueda ejecutar en menos de 5 minutos sentando las bases físicas de la calma.
        3. Define un patrón de respiración clínica óptimo (ej: 4-4-4-4 para equilibrio del sistema autónomo).
        4. Escribe un mantra o frase corta de anclaje para detener el monólogo mental rumiante.

        IMPORTANTE: Devuelve la respuesta estrictamente bajo el formato de esquema JSON especificado. No agregues texto antes ni después de las llaves del JSON.
      `;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Hasta 3 recomendaciones físicas breves y concretas"
              },
              breathing_pattern: {
                type: Type.STRING,
                description: "Patrón respiratorio recomendado con segundos"
              },
              mantra: {
                type: Type.STRING,
                description: "Frase de anclaje meditativo de atención plena en español"
              },
              psychological_insight: {
                type: Type.STRING,
                description: "Explicación breve del eje mente-cuerpo o efecto tensional"
              }
            },
            required: ["recommendations", "breathing_pattern", "mantra", "psychological_insight"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        success: true,
        mock: false,
        ...parsed
      });
    }
  } catch (error: any) {
    console.error("Gemini Mind-Zen Error:", error);
    return res.json({
      success: false,
      error: error.message,
      reframed: "Tengo un reto en mi día, pero tengo la capacidad y la compasión necesarias para manejarlo un momento a la vez.",
      clinical_commentary: "Error al invocar el análisis avanzado de Gemini, pero recuerda respirar hondo. Tu salud digestiva depende directamente de cómo le permitas a tu cuerpo asimilar las pausas.",
      breathing_technique: "Inhalación abdominal lenta 4 segundos, exhalar en siseo suave 6 segundos."
    });
  }
});

// 4. Recipe AI Generator
app.post("/api/generate-recipe", async (req, res) => {
  const { category, filterIngredients } = req.body;

  if (!aiClient) {
    return res.json({
      success: false,
      mock: true,
      recipe: getMockRecipe(category)
    });
  }

  try {
    const isDeportista = category === "deportistas";
    const promptText = `
      Genera una única receta saludable, gastroprotectora y nutricionalmente equilibrada.
      ${isDeportista ? "Esta receta está especialmente diseñada para DEPORTISTAS DE ALTO RENDIMIENTO, por lo que requiere un perfil macronutricional optimizado para el rendimiento físico, alto glucógeno, proteínas limpias de rápida asimilación y cuidado digestivo de nivel élite." : `Bajo la categoría digestiva: "${category || "gastritis"}".`}
      Ingredientes preferidos u omitidos por el usuario: ${filterIngredients || "ninguno"}.

      Entrega la receta exclusivamente en formato de objeto JSON estructurado que contenga:
      - title (nombre atractivo e inspirador de la receta)
      - category (debe ser uno de estos: gastritis, colon_irritable, weight_loss, bloating, healthy, deportistas)
      - ingredients (un listado / array de strings con cantidades detalladas y específicas)
      - preparation (un listado / array de strings con los pasos cronológicos del cocinado)
      - calories (un número entero de calorías estimadas)
      - protein (gramos de proteína enteros o decimales aproximados)
      - carbs (gramos de carbohidratos enteros o decimales aproximados)
      - fat (gramos de grasa enteros o decimales aproximados)
      - benefits (un listado / array de strings explicando por qué es excelente para la mucosa estomacal, motilidad y energía física)
      - isPremium (un valor booleano, estrénalo como false por defecto)

      REGLA DE CONCURRENCIA CALÓRICA (MATEMÁTICA EXACTA):
      Debes verificar rigurosamente que las calorías ('calories') reportadas correspondan con precisión matemática a los macronutrientes provistos. Utiliza la fórmula termodinámica estándar de Atwater:
      calorías = (protein * 4) + (carbs * 4) + (fat * 9)
      Redondea el resultado de 'calories' al entero más cercano. Asegúrate de que no haya discrepancias.

      No uses formato markdown wrap ni texto complementario, solo el objeto JSON limpio.
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8
      }
    });

    const parsedRecipe = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      recipe: parsedRecipe,
      mock: false
    });

  } catch (error) {
    console.error("Recipe Generator Error:", error);
    return res.json({
      success: false,
      mock: true,
      recipe: getMockRecipe(category)
    });
  }
});

function getMockRecipe(category: string) {
  const recipesMap: Record<string, any> = {
    gastritis: {
      title: "Crema Suave de Calabaza y Zanahoria Gástrica",
      category: "gastritis",
      ingredients: [
        "200g de calabaza madura pelada",
        "2 zanahorias raspadas",
        "1 cucharadita de aceite de oliva extra virgen",
        "1 pizca de sal marina",
        "2 tazas de caldo de verduras casero sin cebolla"
      ],
      preparation: [
        "Cortar la calabaza y las zanahorias en dados medianos.",
        "Hervir en el caldo de verduras por 20 minutos hasta ablandar por completo.",
        "Procesar en licuadora hasta lograr una textura cremosa y homogénea.",
        "Servir ligeramente tibio y coronar con el chorrito de aceite de oliva crudo."
      ],
      calories: 140,
      protein: 2.5,
      carbs: 22,
      fat: 5,
      benefits: [
        "Calabaza aporta mucílagos que lubrican y desinflaman la pared interna del estómago.",
        "Zanahoria es rica en betacarotenos, ayudando a regenerar la mucosa gástrica erosionada.",
        "Ausencia de ajo y cebolla evita espasmos gástricos."
      ],
      isPremium: false
    },
    colon_irritable: {
      title: "Bowl Digestivo de Quinoa, Pollo y Calabacín al Vapor",
      category: "colon_irritable",
      ingredients: [
        "60g de quinoa bien lavada",
        "120g de pechuga de pollo cortada en filetes",
        "1/2 calabacín (zucchini) pelado y en rodajas",
        "Aceite de oliva y pizca de orégano seco para sazonar"
      ],
      preparation: [
        "Cocinar la quinoa a fuego lento en proporción 1:2 de agua durante 15 minutos.",
        "Cocer el pollo a la plancha sin aceites excesivos, sazonándolo con una pizca de orégano y sal.",
        "Cocinar las rodajas de calabacín al vapor durante 7 minutos para que queden muy blandas.",
        "Emplatar en un tazón integrando todos los elementos y aderezar con una cucharadita de aceite de oliva."
      ],
      calories: 380,
      protein: 36,
      carbs: 35,
      fat: 8,
      benefits: [
        "Bajo contenido de FODMAPs, reduciendo los gases y las distensiones del colon.",
        "Fibra soluble de fácil asimilación gástrica.",
        "Proteína magra para mantener balance proteico sin esfuerzo intestinal."
      ],
      isPremium: false
    },
    weight_loss: {
      title: "Batido de Papaya, Avena y Semillas de Chía Desinflamante",
      category: "weight_loss",
      ingredients: [
        "1 taza de papaya dulce en cubos",
        "2 cucharadas de avena sin gluten precocida en agua",
        "1 cucharadita de chía pre-hidratada",
        "1 taza de agua purificada fría"
      ],
      preparation: [
        "Dejar las semillas de chía hidratando en un poco de agua por 15 minutos antes de iniciar.",
        "Colocar todos los ingredientes (papaya, avena, chía hidratada y agua) en la licuadora.",
        "Licuar a máxima potencia por 2 minutos hasta emulsionar.",
        "Beber de inmediato, preferiblemente en ayunas o de merienda saciante."
      ],
      calories: 190,
      protein: 4.5,
      carbs: 32,
      fat: 4,
      benefits: [
        "La papaína de la papaya acelera la ruptura proteica disminuyendo la acidez.",
        "La chía hidratada forma un gel mucilaginoso protector de la pared digestiva.",
        "Efecto altamente saciante y bajo en grasas, optimizando el metabolismo."
      ],
      isPremium: false
    }
  };

  return recipesMap[category] || recipesMap.gastritis;
}

// 5. Diet & Meal Plan Generator API
app.post("/api/generate-meal-plan", async (req, res) => {
  const { age, weight, height, objective, durationDays } = req.body;

  if (!aiClient) {
    return res.json({
      success: false,
      mock: true,
      plan: getMockMealPlan(durationDays || 7, objective)
    });
  }

  try {
    const daysRequested = Number(durationDays) || 7;
    const isDeportista = objective === "deportistas";
    const promptText = `
      Genera una dieta clínica alimenticia saludable estructurada de ${daysRequested} días.
      Perfil de usuario:
      - Edad: ${age || 30} años
      - Peso: ${weight || 70} kg
      - Altura: ${height || 170} cm
      - Objetivo principal de salud digestiva: ${objective || "Reducir inflamación / colon irritable"}

      ${isDeportista ? "ATENCIÓN ESPECIAL DEPORTISTAS: Como el usuario es un deportista de alto rendimiento, la dieta debe tener un excelente aporte energético, proteínas magras de alta absorción, carbohidratos complejos para mantener alto el glucógeno y evitar carnes grasas o condimentos que inflamen el aparato digestivo durante el esfuerzo físico intenso." : ""}

      La dieta total debe consistir de un listado / array JSON de exactamente ${daysRequested} elementos.
      Cada elemento representa un Día del plan y debe tener las siguientes llaves estrictas:
      - day (número entero, por ejemplo, 1)
      - meals (un objeto con: breakfast, snack1, lunch, snack2, dinner)
        En cada comida, describe el platillo, la porción, la cantidad de calorías estimadas y los ingredientes estomacalmente amigables.
      - dailyTips (un consejo clínico específico para regular la digestión de ese día)

      No uses markdown de empaquetado, solo el objeto JSON de salida.
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const parsedPlan = JSON.parse(response.text || "[]");
    return res.json({
      success: true,
      plan: {
        userId: "current-user",
        durationDays: daysRequested,
        goal: objective || "Mejorar salud estomacal",
        planDays: Array.isArray(parsedPlan) ? parsedPlan : (parsedPlan.planDays || parsedPlan.plan || []),
        createdAt: new Date().toISOString()
      },
      mock: false
    });

  } catch (error) {
    console.error("Meal Plan Generator Error:", error);
    return res.json({
      success: false,
      mock: true,
      plan: getMockMealPlan(durationDays || 7, objective)
    });
  }
});

function getMockMealPlan(days: number, objective: string) {
  const planDays = [];
  const mealsDb = [
    {
      breakfast: "Infusión de manzanilla tibia + Arepa de maíz blanco pelado a la plancha con queso fresco sin lactosa.",
      snack1: "Una taza de papaya picada con 5 almendras peladas.",
      lunch: "Cazuela de pollo hervido con patatas trituradas, zanahorias cocidas al vapor y orégano seco.",
      snack2: "Compota casera de manzana madura hervida sin cáscara ni azúcares añadidos.",
      dinner: "Filete de merluza al horno con calabacines cocidos y un chorrito de aceite de oliva crudo."
    },
    {
      breakfast: "Avena cocida en agua con rodajas de plátano (guineo) maduro y una pizca de canela.",
      snack1: "Puré de pera madura tibia con semillas de sésamo.",
      lunch: "Arroz blanco bien cocido con daditos de pechuga de pavo al vapor y judías verdes sin hilos.",
      snack2: "Té suave de hinojo + Dos galletas de arroz inflado.",
      dinner: "Caldo depurativo de pollo con zanahoria, calabaza y pechuga picada fina, sin grasa."
    },
    {
      breakfast: "Tapioca hidratada rellena de puré de plátano maduro + Huevo revuelto cocinado sin grasa.",
      snack1: "Melón dulce en porciones templadas, excelente diurético celular.",
      lunch: "Quinoa cocida con puré de calabaza moscada y filete de pollo marinado con tomillo.",
      snack2: "Yogur de coco desnatado o kéfir bien colado de agua.",
      dinner: "Crema de calabaza gástrica con zanahoria + Tiras delgadas de jamón de pavo hervido."
    }
  ];

  for (let i = 1; i <= days; i++) {
    const mealIdx = (i - 1) % mealsDb.length;
    planDays.push({
      day: i,
      meals: mealsDb[mealIdx],
      dailyTips: `Día ${i}: Mastica cada bocado 30 veces para aliviar la carga enzimática estomacal.`
    });
  }

  return {
    userId: "current-user",
    durationDays: days,
    goal: objective || "Alivio de Colon Irritable e Inflamación",
    planDays,
    createdAt: new Date().toISOString()
  };
}

// 6. Stripe Checkout Session (Real + Mock fallback)
app.post("/api/checkout-session", async (req, res) => {
  const { planName, priceAmount, userId, successUrl, cancelUrl } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: "userId requerido" });
  }

  // If Stripe is configured, create a real checkout session
  if (stripeClient) {
    try {
      const priceId = planName === "vita_ia_max" ? STRIPE_PRICE_MAX : STRIPE_PRICE_PREMIUM;
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

      const session = await stripeClient.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
          plan: planName,
        },
        success_url: successUrl || `${baseUrl}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${baseUrl}/?payment_cancelled=true`,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        customer_email: req.body.email || undefined,
        subscription_data: {
          metadata: {
            userId: userId,
            plan: planName,
          },
        },
      });

      return res.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        real: true,
      });
    } catch (err: any) {
      console.error("Stripe session creation error:", err);
      return res.status(500).json({
        success: false,
        error: "Error al crear sesión de pago con Stripe: " + err.message,
      });
    }
  }

  // Mock fallback when Stripe is not configured
  const mockSessionId = "cs_mock_" + Math.random().toString(36).substring(2, 11);
  return res.json({
    success: true,
    sessionId: mockSessionId,
    checkoutUrl: `${req.protocol}://${req.get("host")}/?payment_success=true&session_id=${mockSessionId}&plan=${encodeURIComponent(planName || "premium")}`,
    message: "Modo simulación: Stripe no está configurado. Agrega STRIPE_SECRET_KEY en Secrets.",
    mock: true,
  });
});

// 6b. Stripe Webhook for subscription lifecycle events
app.post("/api/stripe-webhook", async (req, res) => {
  if (!stripeClient || !stripeWebhookSecret) {
    return res.status(200).json({ received: true, note: "Webhook no configurado" });
  }

  const sig = req.headers["stripe-signature"] as string;

  try {
    const event = stripeClient.webhooks.constructEvent(
      req.body,
      sig,
      stripeWebhookSecret
    );

    // Handle subscription events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        console.log(`Pago completado: userId=${userId}, plan=${plan}`);
        // The Firestore update is handled by the frontend after redirect
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const status = subscription.status;
        console.log(`Suscripción actualizada: userId=${userId}, status=${status}`);
        // In production, update Firestore here based on subscription status
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Pago fallido: customer=${invoice.customer}`);
        break;
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

// 6c. Stripe Customer Portal for subscription management
app.post("/api/create-portal-session", async (req, res) => {
  const { customerId, returnUrl } = req.body;

  if (!stripeClient) {
    return res.status(400).json({ success: false, error: "Stripe no configurado" });
  }

  try {
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.APP_URL || ""}`,
    });

    return res.json({ success: true, portalUrl: portalSession.url });
  } catch (err: any) {
    console.error("Portal session error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Detective Digestivo IA Pattern Correlator
app.post("/api/analyze-digestive-patterns", async (req, res) => {
  const { userConditions, foodScans, symptoms } = req.body;

  if (!aiClient) {
    return res.json({
      success: true,
      report: `### Análisis de Correlación Clínica (Modo de Compatibilidad)

Basado en tus registros alimenticios y síntomas ingresados:

1. **Café e Inflamación Intestinal / Reflujo**:
   - Observamos que los días que desayunaste o tomaste café aumentaron un 80% los sucesos de **Reflujo / Acidez** en las siguientes 3 horas.
   - Las grasas medianas y quesos duros con lactosa (ej. aderezo, pollo frito) guardan correlación directa con la **Inflamación / Distensión**.

2. **Beneficio Soluble**:
   - Los días con consumo de papaya y caldo de calabaza mitigaron en un 90% el malestar digestivo general.`,
      correlations: [
        { cause: "Café / Cafeína", effect: "Reflujo gástrico", correlationLevel: "Alta", notes: "Alineación temporal perfecta entre ingesta y acidez." },
        { cause: "Lácteos enteros", effect: "Gases y distensión", correlationLevel: "Alta", notes: "Sensibilidad enzimática a grasas lácteas irritantes." }
      ]
    });
  }

  try {
    const prompt = `
      Eres un gastroenterólogo e inmunólogo de élite.
      Analiza la correlación de estos alimentos consumidos por el paciente con su bitácora de síntomas reportados.
      
      Condición clave del paciente: ${userConditions || "Colon irritable, gastritis"}.
      
      Registros de alimentos: ${JSON.stringify(foodScans || [])}
      Registros de síntomas experimentados: ${JSON.stringify(symptoms || [])}
      
      Emite un reporte estructurado y un listado de correlaciones causales precisas (causa, efecto, nivel de correlatividad 'Alta' o 'Media', y notas).
      
      IMPORTANTE: Retorna un JSON que cumpla exactamente este esquema:
      {
        "report": "Un análisis extenso describiendo los picos de inflamación, qué ingredientes se sospecha que causan el malestar y consejos preventivos.",
        "correlations": [
          {
            "cause": "Alimento o ingrediente",
            "effect": "Sintoma causado",
            "correlationLevel": "Alta" o "Media",
            "notes": "Breve explicación clínica o temporal"
          }
        ]
      }
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            report: { type: Type.STRING },
            correlations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cause: { type: Type.STRING },
                  effect: { type: Type.STRING },
                  correlationLevel: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["cause", "effect", "correlationLevel", "notes"]
              }
            }
          },
          required: ["report", "correlations"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed });

  } catch (err: any) {
    console.warn("Gemini correlation error, falling back:", err);
    return res.json({
      success: true,
      report: "Análisis completado. Encontramos una fuerte respuesta inflamatoria recurrente a conservantes sintéticos.",
      correlations: [
        { cause: "Aditivos y Ultraprocesados", effect: "Distensión estomacal ruda", correlationLevel: "Alta", notes: "Correlación directa tras subir fotos de alimentos procesados." }
      ]
    });
  }
});

// 8. Escáner de Supermercado IA Label Decoder
app.post("/api/scan-grocery", async (req, res) => {
  const { barcode, imageBase64 } = req.body;

  if (!aiClient) {
    // Return compliance mock analysis immediately
    return res.json({
      success: true,
      scan: {
        productName: barcode === "7501055904251" ? "Yogur Griego Natural Sin Azúcar" : "Producto de Despensa General",
        barcode: barcode || "Escaneado por Foto",
        sugars: "Bajo (0.5g/100g)",
        fats: "Bajo (2g/100g)",
        sodium: "Moderado (150mg)",
        preservatives: "Mínimos (Sin conservadores perjudiciales)",
        colorants: "Ninguno",
        ultraprocessed: "Bajo (Procesamiento artesanal)",
        digestiveScore: 92,
        nutritionScore: 88,
        classification: "Excelente",
        alternatives: [
          "Yogur de coco desgrasado sin endulzantes artificiales.",
          "Kéfir orgánico de agua de fácil absorción."
        ],
        analysisSummary: "El producto posee bacterias de cultivo láctico activas ideales para renovar y proteger las vellosidades de tu microbiota intestinal."
      }
    });
  }

  try {
    let response;
    
    if (imageBase64) {
      const rawImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: rawImage
            }
          },
          {
            text: `
              Eres un decodificador de etiquetas de alimentos de supermercado.
              Analiza la tabla de ingredientes de esta fotografía. Identifica grasas saturadas, azúcares añadidos, sales desproporcionadas, conservadores que alteran el pH estomacal y colorantes sintéticos.
              
              Calcula:
              1. productName (Nombre comercial aproximado de la comida)
              2. sugars, fats, sodium, preservatives, colorants
              3. ultraprocessed (Nivel de procesamiento: Bajo, Medio, Alto)
              4. digestiveScore (Score global de 1 a 100 para la salud de la barrera de moco intestinal)
              5. nutritionScore (Densidad de macros de 1 a 100)
              6. classification ("Excelente", "Bueno", "Regular", "Evitar")
              7. alternatives (Mínimo 2 alternativas de alimentos más digestivos y seguros)
              8. analysisSummary (Resumen de por qué obtuvo ese puntaje)
              
              IMPORTANTE: Retorna un JSON exacto bajo este esquema especificado. No incluyas marcas de bloques.
            `
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              sugars: { type: Type.STRING },
              fats: { type: Type.STRING },
              sodium: { type: Type.STRING },
              preservatives: { type: Type.STRING },
              colorants: { type: Type.STRING },
              ultraprocessed: { type: Type.STRING },
              digestiveScore: { type: Type.INTEGER },
              nutritionScore: { type: Type.INTEGER },
              classification: { type: Type.STRING },
              alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
              analysisSummary: { type: Type.STRING }
            },
            required: ["productName", "sugars", "fats", "sodium", "preservatives", "colorants", "digestiveScore", "nutritionScore", "classification", "alternatives", "analysisSummary"]
          }
        }
      });
    } else {
      // Barcode lookup simulated with clinical reasoning
      const prompt = `
        Eres un decodificador alimentario de supermercado de precisión.
        Analiza este código de barras del producto: ${barcode}. 
        Sabiendo que representa a un producto comercial de góndola:
        Identifica qué producto es o infiere su composición media si es desconocido.
        
        Calcula:
        productName, sugars, fats, sodium, preservatives, colorants, ultraprocessed, digestiveScore, nutritionScore, classification, alternatives, analysisSummary.
        
        IMPORTANTE: Retorna un JSON exacto con este esquema.
      `;

      response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              sugars: { type: Type.STRING },
              fats: { type: Type.STRING },
              sodium: { type: Type.STRING },
              preservatives: { type: Type.STRING },
              colorants: { type: Type.STRING },
              ultraprocessed: { type: Type.STRING },
              digestiveScore: { type: Type.INTEGER },
              nutritionScore: { type: Type.INTEGER },
              classification: { type: Type.STRING },
              alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
              analysisSummary: { type: Type.STRING }
            },
            required: ["productName", "sugars", "fats", "sodium", "preservatives", "colorants", "digestiveScore", "nutritionScore", "classification", "alternatives", "analysisSummary"]
          }
        }
      });
    }

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, scan: parsed });

  } catch (err: any) {
    console.warn("Scan label error, falling back:", err);
    return res.json({
      success: true,
      scan: {
        productName: "Producto de Selección Básica",
        barcode: barcode || "Fotos de ingredientes",
        sugars: "Medio",
        fats: "Moderado",
        sodium: "Bajo",
        preservatives: "Mínimos",
        colorants: "Ninguno",
        ultraprocessed: "Bajo",
        digestiveScore: 82,
        nutritionScore: 78,
        classification: "Bueno",
        alternatives: ["Elegir siempre opciones caseras libres de aditivos emulsionantes."],
        analysisSummary: "El producto se considera aceptable y libre de grasas hidrogenadas molestas."
      }
    });
  }
});

// 9. Coach Summary generator
app.post("/api/generate-coach-summary", async (req, res) => {
  const { timeframe, caloriesAvg, highRisksCount, objective, sport, recentScans } = req.body;

  if (!aiClient) {
    return res.json({
      success: true,
      summary: `### Tu Coach Clínico Diario IA 💚\n\n**Estilo de Vida y Deporte: ${sport || "Fitness General"}**\n\n**¡Extraordinario hoy!** Has mantenido un excelente balance nutritivo para tu rendimiento en **${sport || "Fitness General"}**. Promedias unas **${caloriesAvg || 1400} kcal**.\n\n* **Semáforo Digestivo**: No reportas acidez ni náuseas. Sigue así para conservar tu flora intacta.\n\n* **Pauta Deportiva Especial**: Para un óptimo desempeño en **${sport || "Fitness General"}**, recuerda mantener correctos tus niveles de sales minerales e hidratación antes de salir.`
    });
  }

  try {
    const prompt = `
      Eres un Coach Clínico de Estilo de Vida, Deporte Activo y Nutrición Intestinal de alta empatía.
      Genera un reporte de coaching '${timeframe}' para un atleta que practica: **${sport || "Fitness General"}** con meta: ${objective}.
      
      Métricas de la semana/día:
      - Calorías promedio: ${caloriesAvg} kcal
      - Registros con riesgo gástrico Alto: ${highRisksCount} porciones
      - Últimas comidas analizadas: ${JSON.stringify(recentScans || [])}
      
      Modula tus consejos adaptando proteínas (ej. 2.0g/kg para hipetrofia/crossfit), carbohidratos (altos para running/ciclismo), grasas limpias, pautas de hidratación y recuperación molecular post-esfuerzo protectoras de la mucosa intestinal para esta disciplina de: **${sport || "Fitness General"}**.
      
      Escribe un resumen motivacional, detallado, objetivo, con pautas clínicas sencillas y un tono inspiracional.
      Sugerencia de formato: Usa markdown limpio (### y bullets) e iconos/emojis amigables.
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    return res.json({ success: true, summary: response.text });

  } catch (err) {
    return res.json({
      success: true,
      summary: `### Tu Reporte Coach Diario IA 💚\n\n¡Excelente esfuerzo hoy entrenando ${sport || "Fitness General"}! Tu consumo estimado fue equilibrado. Recuerda de forma idónea hidratar tu cuerpo con suficiente agua simple para proteger tu moco gástrico hoy.`
    });
  }
});

// 10. Weekly Shopping list generator desglosada por pasillos
app.post("/api/generate-shopping-list", async (req, res) => {
  const { objective } = req.body;

  if (!aiClient) {
    return res.json({
      success: true,
      list: {
        createdAt: new Date().toISOString(),
        items: [
          { category: "Proteínas", name: "Pechuga de Pollo Orgánica (Fácil absorción)", checked: false },
          { category: "Verduras", name: "Calabaza de Castilla tierna (Bajo FODMAP)", checked: false },
          { category: "Frutas", name: "Papaya Dulce Grande", checked: false },
          { category: "Cereales", name: "Hojuelas de Avena sin Gluten", checked: false },
          { category: "Bebidas", name: "Té de Manzanilla / Toronjil natural", checked: false }
        ],
        estimatedCost: 350
      }
    });
  }

  try {
    const prompt = `
      Eres un especialista en gastronomía terapéutica y nutrición digestiva.
      Genera una lista de compras semanal optimizada para un paciente con: ${objective || "colon inflamado, acidez"}.
      Alinea los insumos para que sean bajos en FODMAPs, libres de lácteos irritantes, grasas trans y condimentos abrasivos (ajo, cebolla, vinagre, picantes fuertes).
      
      Debes retornar exactamente una lista de mínimo 6 ingredientes sanos agrupados exclusivamente en estas categorías:
      - Proteínas
      - Verduras
      - Frutas
      - Cereales
      - Bebidas
      - Aderezos / Semillas
      
      Calcula también un estimatedCost aproximado en pesos (ej. 450).
      
      IMPORTANTE: Retorna un JSON con exactitud según este esquema:
      {
        "createdAt": "Fecha actual en formato ISO",
        "items": [
          { "category": "Categoría exacta", "name": "Nombre claro del ingrediente y por qué es seguro", "checked": false }
        ],
        "estimatedCost": 420
      }
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            createdAt: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  name: { type: Type.STRING },
                  checked: { type: Type.BOOLEAN }
                },
                required: ["category", "name", "checked"]
              }
            },
            estimatedCost: { type: Type.INTEGER }
          },
          required: ["createdAt", "items", "estimatedCost"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, list: parsed });

  } catch (err) {
    console.warn("Error generating shopping list:", err);
    return res.json({
      success: true,
      list: {
        createdAt: new Date().toISOString(),
        items: [
          { category: "Proteínas", name: "Filete de Pescado Blanco", checked: false },
          { category: "Verduras", name: "Calabacita asada tierna", checked: false },
          { category: "Frutas", name: "Plátano maduro", checked: false },
          { category: "Cereales", name: "Arroz integral", checked: false }
        ],
        estimatedCost: 320
      }
    });
  }
});

// 11. VitaCoach Performance advisor
app.post("/api/generate-coach-performance", async (req, res) => {
  const { athleteGoal, sportType, userAge, userWeight, userHeight, trainingsThisWeek, recoveryDetails, mentalState, vitaScore, recoveryScore } = req.body;

  if (!aiClient) {
    return res.json({
      success: true,
      advice: `### VitaCoach Performance ⚡\n\nTu **VitaScore actual de ${vitaScore || 75}** y **Recovery de ${recoveryScore || 80}** muestran una base muscular saludable. Para tu meta de **${athleteGoal || "mejorar rendimiento"}** en **${sportType || "Fitness general"}**, te aconsejamos:\n- **Entrenamiento**: Mantener constancia. Entrenar suave hoy es ideal.\n- **Recuperación**: Procura 7.5+ horas de sueño de calidad para reparar fibras musculares y evitar dolores.`
    });
  }

  try {
    const prompt = `
      Eres un preparador físico de élite, coach deportivo de alto rendimiento y asesor en fisiología del ejercicio.
      Analiza el perfil del atleta del ecosistema VitaAI y genera recomendaciones prácticas, inspiracionales y específicas.
      
      Perfil de Rendimiento:
      - Disciplina / Deporte: ${sportType}
      - Objetivo: ${athleteGoal}
      - Edad: ${userAge} años
      - Peso y Altura: ${userWeight}kg, ${userHeight}cm
      - Sesiones registradas esta semana: ${trainingsThisWeek} entrenamientos
      - Estado de Descanso: ${recoveryDetails} (Recovery Score: ${recoveryScore}/100)
      - Ficha Psicoemocional: ${mentalState} (VitaScore Global: ${vitaScore}/100)

      Instrucciones:
      1. Evalúa el balance de fatiga y sueño.
      2. Recomienda de forma específica un ajuste de intensidad o descanso.
      3. Mantén un tono alentador y clínico. Evita terminología de fatiga crítica innecesaria.
      4. Incluye un ejemplo adaptado como: "Tu rendimiento disminuyó un X%... Se recomienda..." o similar si procede de forma natural.
      
      Escribe en markdown limpio con secciones de bullets simples.
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    return res.json({ success: true, advice: response.text });
  } catch (err) {
    console.warn("Error in performance coach api:", err);
    return res.json({
      success: true,
      advice: `### VitaCoach Performance ⚡\n\nTu balance de rendimiento está estable. Mantén una buena hidratación para retener la masa magra.`
    });
  }
});

// 12. VitaPerformance AI Routine generator
app.post("/api/generate-fitness-routine", async (req, res) => {
  const { age, weight, height, gender, physicalLevel, sport, objective, timeframe } = req.body;

  if (!aiClient) {
    return res.json({
      success: false,
      error: "El motor inteligente Gemini no está configurado."
    });
  }

  try {
    const prompt = `
      Eres un entrenador personal digital de élite con conocimientos profundos de biomecánica, nutrición deportiva e hipertrofia segura.
      Diseña un plan de entrenamiento adaptado específicamente al deporte de: ${sport} para lograr el objetivo de: ${objective}.
      
      Datos del atleta:
      - Edad: ${age} años
      - Peso: ${weight} kg
      - Altura: ${height} cm
      - Sexo: ${gender}
      - Nivel físico actual: ${physicalLevel}
      - Tipo de rutina solicitada: ${timeframe} (daily = día específico / weekly = semana de 7 días / monthly = mesociclo estructurado)

      Directrices del entrenamiento:
      - Adapta por completo los ejercicios a la disciplina elegida: ${sport}.
      - Incluye series, repeticiones, tiempo estimado y tiempo de descanso para cada ejercicio.
      - Distribuye las sesiones de forma balanceada.
      - Retorna la respuesta estrictamente bajo el formato de esquema JSON especificado. No agregues texto antes ni después de las llaves del JSON.
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título de la rutina coordinada." },
            description: { type: Type.STRING, description: "Breve descripción." },
            timeframe: { type: Type.STRING, description: "Frecuencia." },
            sessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        exercise: { type: Type.STRING },
                        series: { type: Type.INTEGER },
                        repetitions: { type: Type.INTEGER },
                        time: { type: Type.STRING },
                        rest: { type: Type.STRING }
                      },
                      required: ["exercise", "series", "repetitions", "time", "rest"]
                    }
                  }
                },
                required: ["name", "exercises"]
              }
            }
          },
          required: ["title", "description", "timeframe", "sessions"]
        }
      }
    });

    const parsedResult = JSON.parse(response.text || "{}");
    return res.json({ success: true, routine: parsedResult });

  } catch (err: any) {
    console.error("Routine generation api error:", err);
    return res.status(500).json({ success: false, error: err.message || "Fallo en la generación de rutinas de Gemini" });
  }
});

// 6d. Verify payment after Stripe redirect or native IAP
app.post("/api/verify-payment", async (req, res) => {
  const { userId, plan, sessionId } = req.body;

  if (!userId) {
    return res.status(400).json({ verified: false, error: "userId requerido" });
  }

  // If Stripe is configured, verify the session
  if (stripeClient && sessionId && !sessionId.startsWith("cs_mock_")) {
    try {
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" && session.metadata?.userId === userId) {
        return res.json({
          verified: true,
          subscriptionStatus: plan === "vita_ia_max" ? "vita_ia_max" : "premium",
        });
      }
      return res.json({ verified: false, subscriptionStatus: "free" });
    } catch (err: any) {
      console.error("Payment verification error:", err);
      return res.json({ verified: false, subscriptionStatus: "free", error: err.message });
    }
  }

  // Dev/mock mode: auto-verify
  return res.json({
    verified: true,
    subscriptionStatus: plan === "vita_ia_max" ? "vita_ia_max" : "premium",
  });
});

// Vite Middleware for client mounting and standalone production build compatibility
const setupServerAndRuntime = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VitaAI Full-Stack Server] Running on http://0.0.0.0:${PORT}`);
  });
};

setupServerAndRuntime().catch((err) => {
  console.error("Critical failure during Server initialization:", err);
});
