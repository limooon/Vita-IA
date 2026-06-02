/**
 * LRU Response Cache
 * 
 * Caches AI responses to avoid redundant API calls.
 * - Text responses: TTL 30 minutes
 * - Vision/image: TTL 1 hour
 * - Structured JSON: TTL 1 hour
 * 
 * Cache key = SHA256 hash of (endpoint + request body)
 */

import crypto from "crypto";

interface CacheEntry<V = any> {
  value: V;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

interface CacheConfig {
  maxEntries?: number;
  defaultTTLMs?: number;
}

// ─── LRU Cache Implementation ────────────────────────────

class LRUCache<K, V> {
  private map = new Map<K, CacheEntry<V>>();
  private maxEntries: number;
  private defaultTTLMs: number;

  constructor(config: CacheConfig = {}) {
    this.maxEntries = config.maxEntries || 500;
    this.defaultTTLMs = config.defaultTTLMs || 30 * 60 * 1000; // 30 min
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    // Check TTL expiry
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // LRU: move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, { ...entry, hits: entry.hits + 1 });
    return entry.value;
  }

  set(key: K, value: V, ttlMs?: number): void {
    // Evict oldest if at capacity
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }

    this.map.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTLMs),
      createdAt: Date.now(),
      hits: 0,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  getStats() {
    let totalHits = 0;
    let expired = 0;
    const now = Date.now();
    this.map.forEach((entry) => {
      totalHits += entry.hits;
      if (now > entry.expiresAt) expired++;
    });
    return { entries: this.map.size, totalHits, expired };
  }
}

// ─── Cache Key Generator ──────────────────────────────────

function generateKey(endpoint: string, body: any): string {
  const payload = JSON.stringify({ endpoint, body });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// ─── Cache Instances ──────────────────────────────────────

// Text cache: 30 min TTL
const textCache = new LRUCache<string, any>({
  maxEntries: 300,
  defaultTTLMs: 30 * 60 * 1000,
});

// Vision cache: 1 hour TTL
const visionCache = new LRUCache<string, any>({
  maxEntries: 100,
  defaultTTLMs: 60 * 60 * 1000,
});

// Structured JSON cache: 1 hour TTL
const structuredCache = new LRUCache<string, any>({
  maxEntries: 200,
  defaultTTLMs: 60 * 60 * 1000,
});

// ─── Public API ──────────────────────────────────────────

export function getCachedResponse(
  endpoint: string,
  body: any,
  type: "text" | "vision" | "structured" = "text"
): any | undefined {
  const key = generateKey(endpoint, body);
  switch (type) {
    case "vision": return visionCache.get(key);
    case "structured": return structuredCache.get(key);
    default: return textCache.get(key);
  }
}

export function setCachedResponse(
  endpoint: string,
  body: any,
  response: any,
  type: "text" | "vision" | "structured" = "text"
): void {
  const key = generateKey(endpoint, body);
  // Don't cache empty or error responses
  if (!response) return;
  switch (type) {
    case "vision": visionCache.set(key, response); break;
    case "structured": structuredCache.set(key, response); break;
    default: textCache.set(key, response); break;
  }
}

export function clearCache(type?: "text" | "vision" | "structured"): void {
  if (!type || type === "text") textCache.clear();
  if (!type || type === "vision") visionCache.clear();
  if (!type || type === "structured") structuredCache.clear();
}

export function getCacheStats() {
  return {
    text: textCache.getStats(),
    vision: visionCache.getStats(),
    structured: structuredCache.getStats(),
  };
}
