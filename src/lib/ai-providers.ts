/**
 * Multi-AI Provider Abstraction Layer
 * 
 * ┌─────────────┐  ┌──────────────────┐  ┌─────────────────┐
 * │   Gemini     │  │   DeepSeek R1    │  │  DeepSeek Chat  │
 * │  (Vision)    │  │  (via OpenRouter) │  │  (via OpenRouter)│
 * └──────┬───────┘  └────────┬─────────┘  └────────┬────────┘
 *        │                   │                      │
 *        └───────────────────┼──────────────────────┘
 *                            │
 *              ┌─────────────▼─────────────┐
 *              │     AIProviderManager      │
 *              │  - route by task type      │
 *              │  - cost optimization       │
 *              │  - usage tracking          │
 *              └─────────────────────────────┘
 */

import { GoogleGenAI, Type } from "@google/genai";

// ─── Types ───────────────────────────────────────────────

export type AIModel = "gemini" | "deepseek-chat" | "deepseek-r1";

export interface AIRequest {
  task: "vision" | "chat" | "generate" | "structured";
  prompt?: string;
  imageBase64?: string;
  systemPrompt?: string;
  schema?: Record<string, any>;
  model?: AIModel; // override auto-selection
  temperature?: number;
  maxTokens?: number;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AIResponse {
  text: string;
  parsed?: Record<string, any>;
  model: AIModel;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ─── Provider Configuration ───────────────────────────────

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_MAP: Record<AIModel, string> = {
  gemini: "gemini-2.5-flash",
  "deepseek-chat": "deepseek/deepseek-chat-v3-0324:free",
  "deepseek-r1": "deepseek/deepseek-r1-distill-llama-70b:free",
};

// ─── Provider Manager ─────────────────────────────────────

export class AIProviderManager {
  private geminiClient: GoogleGenAI | null = null;
  private openRouterKey: string;

  constructor(geminiApiKey?: string, openRouterApiKey?: string) {
    if (geminiApiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    }
    this.openRouterKey = openRouterApiKey || "";
  }

  get isAvailable(): boolean {
    return !!(this.geminiClient || this.openRouterKey);
  }

  /**
   * Auto-select best model based on task type:
   * - vision → Gemini (only Gemini does vision)
   * - chat → DeepSeek Chat (cheapest text model)
   * - generate → DeepSeek Chat
   * - structured → Gemini (better JSON schema support)
   */
  autoSelectModel(task: AIRequest["task"]): AIModel {
    switch (task) {
      case "vision":
        return "gemini";
      case "chat":
        return "deepseek-chat";
      case "generate":
        return this.openRouterKey ? "deepseek-chat" : "gemini";
      case "structured":
        return "gemini";
    }
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    const model = request.model || this.autoSelectModel(request.task);

    if (model === "gemini" && request.task === "vision") {
      return this.callGeminiVision(request);
    }
    if (model === "gemini") {
      return this.callGeminiText(request);
    }
    return this.callOpenRouter(model, request);
  }

  // ─── Gemini Vision ──────────────────────────────────

  private async callGeminiVision(request: AIRequest): Promise<AIResponse> {
    if (!this.geminiClient) throw new Error("Gemini not configured");

    const rawImage = request.imageBase64?.replace(/^data:image\/\w+;base64,/, "") || "";

    const parts: any[] = [{ text: request.prompt }];
    if (rawImage) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: rawImage } });
    }

    const config: any = { temperature: request.temperature ?? 0.3 };
    if (request.schema) {
      config.responseMimeType = "application/json";
      config.responseSchema = this.buildGeminiSchema(request.schema);
    }

    const response = await this.geminiClient.models.generateContent({
      model: MODEL_MAP.gemini,
      contents: parts,
      config,
    });

    const text = response.text || "";
    let parsed: Record<string, any> | undefined;
    if (request.schema && text) {
      try { parsed = JSON.parse(text); } catch { /* keep raw text */ }
    }

    return {
      text,
      parsed,
      model: "gemini",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  // ─── Gemini Text ────────────────────────────────────

  private async callGeminiText(request: AIRequest): Promise<AIResponse> {
    if (!this.geminiClient) throw new Error("Gemini not configured");

    const config: any = { temperature: request.temperature ?? 0.7 };
    if (request.schema) {
      config.responseMimeType = "application/json";
      config.responseSchema = this.buildGeminiSchema(request.schema);
    }

    let contents: any = request.prompt || "";
    if (request.history?.length) {
      contents = request.history.map((h) => ({ role: h.role, parts: [{ text: h.content }] }));
      contents.push({ role: "user", parts: [{ text: request.prompt }] });
    }
    if (request.systemPrompt) {
      config.systemInstruction = request.systemPrompt;
    }

    const response = await this.geminiClient.models.generateContent({
      model: MODEL_MAP.gemini,
      contents,
      config,
    });

    const text = response.text || "";
    let parsed: Record<string, any> | undefined;
    if (request.schema && text) {
      try { parsed = JSON.parse(text); } catch { /* keep raw text */ }
    }

    return {
      text,
      parsed,
      model: "gemini",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  // ─── OpenRouter (DeepSeek) ──────────────────────────

  private async callOpenRouter(model: AIModel, request: AIRequest): Promise<AIResponse> {
    if (!this.openRouterKey) throw new Error("OpenRouter not configured");

    const messages: any[] = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    if (request.history?.length) {
      request.history.forEach((h) =>
        messages.push({ role: h.role, content: h.content })
      );
    }
    messages.push({ role: "user", content: request.prompt || "" });

    const body: any = {
      model: MODEL_MAP[model],
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (request.schema) {
      body.response_format = { type: "json_object" };
      body.messages[0].content =
        `You MUST respond ONLY with a valid JSON object matching this schema. ` +
        `Do not include markdown code blocks or any other text.\n\n` +
        (request.prompt || "");
    }

    const res = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openRouterKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Vita IA",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const usage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };

    let parsed: Record<string, any> | undefined;
    if (request.schema && text) {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      try { parsed = JSON.parse(cleaned); } catch { /* keep raw text */ }
    }

    return { text, parsed, model, usage };
  }

  // ─── Schema Builder ─────────────────────────────────

  private buildGeminiSchema(schema: Record<string, any>): any {
    // Convert flat schema definition to Gemini Type format
    if (schema.type === "object") {
      return this.convertToGeminiType(schema);
    }
    return schema;
  }

  private convertToGeminiType(schema: any): any {
    if (schema.type === "string") return Type.STRING;
    if (schema.type === "number" || schema.type === "integer") return Type.NUMBER;
    if (schema.type === "boolean") return Type.BOOLEAN;
    if (schema.type === "array") {
      return {
        type: Type.ARRAY,
        items: schema.items ? this.convertToGeminiType(schema.items) : Type.STRING,
      };
    }
    if (schema.type === "object" && schema.properties) {
      const props: Record<string, any> = {};
      const required: string[] = [];
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        props[key] = this.convertToGeminiType(propSchema as any);
        if ((propSchema as any).required) required.push(key);
      }
      return { type: Type.OBJECT, properties: props, required };
    }
    return Type.STRING;
  }
}

// ─── Singleton ─────────────────────────────────────────────

let managerInstance: AIProviderManager | null = null;

export function getAIProvider(): AIProviderManager {
  if (!managerInstance) {
    managerInstance = new AIProviderManager(
      process.env.GEMINI_API_KEY,
      process.env.OPENROUTER_API_KEY
    );
  }
  return managerInstance;
}

export function resetAIProvider(): void {
  managerInstance = null;
}
