# 🧬 Vita IA

> **Tu asistente de nutrición inteligente, disponible 24/7.**
>
> Plataforma full-stack de análisis nutricional por IA, coaching digestivo, rendimiento deportivo y bienestar mental — desplegable en web, iOS y Android.

---

## 📐 Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                       CLIENTE (SPA)                          │
│  React 19 + TypeScript + Tailwind CSS v4 + Motion            │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────┐ │
│  │ Auth     │ Dashboard│ Analyzer │ Chat     │ Recipes    │ │
│  │ Panel    │ (19 mod) │ (Vision) │ (Coach)  │ (Catalog)  │ │
│  ├──────────┼──────────┼──────────┼──────────┼────────────┤ │
│  │ MealPlan │ Premium  │ Insights │ Scanner  │ VitaMind   │ │
│  │ Coach    │ Family   │ Goals    │ Perform  │ Vacation   │ │
│  │ Travel   │ Clinical │ Legal    │ Help     │ VitaMax    │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘ │
│  Context Providers: ThemeContext · DevModeContext             │
│  Lib: Firebase SDK · Payment Abstraction · Capacitor Bridge  │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP REST
┌──────────────────────▼───────────────────────────────────────┐
│                    SERVIDOR (Express)                         │
│  TypeScript · Node.js · Vite Middleware · Gemini AI SDK      │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 17 API Endpoints: food analysis, chat, recipes, plans,   ││
│  │ payments, supermarket scan, performance, mind-zen,       ││
│  │ digestive patterns, shopping, travel, fitness routines   ││
│  └──────────────────────────────────────────────────────────┘│
│  Stripe SDK: checkout sessions · webhooks · portal           │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                 SERVICIOS EXTERNOS                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Firebase    │  │ Google Gemini│  │ Stripe Payments      │ │
│  │ Auth        │  │ Vision+Chat  │  │ (Checkout + Billing) │ │
│  │ Firestore   │  │ 3.5 Flash    │  └──────────────────────┘ │
│  └─────────────┘  └──────────────┘                           │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ CAPACITOR: iOS (StoreKit) · Android (Play Billing)       ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React 19, TypeScript 5.8 | `^19.0.1` |
| Estilos | Tailwind CSS v4 | `^4.1.14` |
| Animaciones | Motion (Framer Motion) | `^12.23.24` |
| Íconos | Lucide React | `^0.546.0` |
| Backend | Express.js | `^4.21.2` |
| AI Engine | Google Gemini AI | `^2.4.0` |
| Auth / DB | Firebase Auth + Firestore | `^12.14.0` |
| Pagos Web | Stripe SDK | `^22.2.0` |
| Mobile Bridge | Capacitor | `^8.3.4` |
| Bundler | Vite + esbuild | `^6.2.3` |

---

## 🗂 Estructura del Proyecto

```
Vita-IA/
├── capacitor.config.ts          # Configuración Capacitor (iOS/Android)
├── firebase-applet-config.json  # Credenciales Firebase
├── firebase-blueprint.json      # Esquema de datos Firestore
├── firestore.rules              # Reglas de seguridad Firestore
├── vite.config.ts               # Configuración Vite + plugins
├── tsconfig.json                # Configuración TypeScript
├── package.json                 # Dependencias y scripts
├── .env / .env.example          # Variables de entorno
├── index.html                   # Entry point HTML
├── metadata.json                # Metadatos de la app
├── server.ts                    # Servidor Express (17 endpoints)
├── README.md                    # Este documento
│
├── src/
│   ├── main.tsx                 # Punto de entrada React
│   ├── App.tsx                  # Componente raíz (router, estado global)
│   ├── index.css                # Estilos globales + Tailwind
│   ├── vite-env.d.ts            # Tipos Vite
│   ├── types.ts                 # 22 interfaces TypeScript
│   │
│   ├── context/                 # Proveedores de estado global
│   │   ├── ThemeContext.tsx      # Tema claro/oscuro
│   │   └── DevModeContext.tsx    # Modo desarrollo
│   │
│   ├── lib/                     # Utilidades y configuraciones
│   │   ├── firebase.ts          # Cliente Firebase (auth, firestore)
│   │   └── payments.ts          # Abstracción de pagos
│   │
│   └── components/              # 22 componentes modulares
│       ├── Header.tsx           # Barra de navegación
│       ├── Dashboard.tsx        # Panel principal
│       ├── AuthPanel.tsx        # Login, registro, onboarding
│       ├── FoodAnalyzer.tsx     # Analizador de alimentos (VitaScan)
│       ├── NutritionChat.tsx    # Chat IA (VitaCoach)
│       ├── RecipesList.tsx      # Recetas (VitaRecipes)
│       ├── MealPlanner.tsx      # Plan nutricional (VitaPlan)
│       ├── PremiumPlans.tsx     # Planes de suscripción
│       ├── DigestiveInsights.tsx# Detective digestivo
│       ├── SupermarketScanner.tsx # Escáner supermercado
│       ├── VitaMind.tsx         # Bienestar mental
│       ├── NutritionCoach.tsx   # Coach diario + agua
│       ├── FamilyProfiles.tsx   # Perfiles familiares
│       ├── Achievements.tsx     # Logros y gamificación
│       ├── VitaPerformance.tsx  # Rendimiento deportivo
│       ├── ClinicalProfile.tsx  # Perfil clínico
│       ├── VitaVacation.tsx     # Planificador vacacional
│       ├── VitaTravel.tsx       # Viajes y jet-lag
│       ├── VitaIaMax.tsx        # Módulo Elite Max
│       ├── VitaStatsChart.tsx   # Gráficos de estadísticas
│       ├── LegalCenter.tsx      # Centro legal
│       └── HelpAndFaq.tsx       # Ayuda y reclamos
```

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves (ver sección Variables de Entorno)

# 3. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000

# 4. Compilar para producción
npm run build

# 5. Iniciar en producción
npm start
```

---

## 🔑 Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | ✅ | API Key de Google Gemini AI |
| `APP_URL` | ✅ | URL donde se despliega la app |
| `STRIPE_SECRET_KEY` | Prod | Clave secreta de Stripe (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Prod | Secreto de webhook Stripe (`whsec_...`) |
| `STRIPE_PRICE_PREMIUM` | Prod | Price ID del plan Plus ($7.99/mes) |
| `STRIPE_PRICE_MAX` | Prod | Price ID del plan Max ($15.00/mes) |

> **Nota**: Sin `STRIPE_SECRET_KEY`, los pagos se simulan automáticamente en modo desarrollo.

---

## 🧩 Módulos y Funcionalidades

### 🔬 VitaScan — Analizador de Alimentos
**Componente:** `FoodAnalyzer.tsx` · **Endpoint:** `POST /api/analyze-food`

- Captura multi-ángulo (superior, lateral, cercana, ingredientes) por cámara o archivo
- Análisis por Google Gemini Vision con esquema JSON estructurado
- Estimación de calorías, proteínas, carbohidratos, grasas
- Nivel de confianza del diagnóstico (Alta/Media/Baja)
- Riesgo digestivo personalizado según condición del usuario
- Recomendaciones clínicas y alternativas amigables
- Límite gratuito: 3 escaneos/día · Ilimitado en Premium

### 🤖 VitaCoach — Chat Nutricional IA
**Componente:** `NutritionChat.tsx` · **Endpoint:** `POST /api/chat`

- Chat con gastroenterólogo virtual especializado
- Contexto de condiciones del usuario (gastritis, SII, inflamación)
- Historial persistente en Firestore
- Sugerencias predefinidas para consultas rápidas
- Límite: 1 consulta/día gratis · Ilimitado en Premium

### 🍽️ VitaRecipes — Recetas Inteligentes
**Componente:** `RecipesList.tsx` · **Endpoint:** `POST /api/generate-recipe`

- Generación de recetas por IA según categoría digestiva
- Filtros por ingredientes a incluir/excluir
- Cálculo calórico validado por fórmula de Atwater
- Colección de recetas predefinidas + personalizadas
- CRUD completo con persistencia en Firestore

### 📅 VitaPlan — Plan Nutricional
**Componente:** `MealPlanner.tsx` · **Endpoint:** `POST /api/generate-meal-plan`

- Generación de dietas de 7, 14 o 30 días
- Personalizado por edad, peso, altura y objetivo
- Plan diario: desayuno, snack AM, almuerzo, snack PM, cena
- Consejos clínicos diarios específicos
- Modo deportista de alto rendimiento

### 🧠 VitaInsight — Detective Digestivo
**Componente:** `DigestiveInsights.tsx` · **Endpoint:** `POST /api/analyze-digestive-patterns`

- Registro de síntomas (inflamación, gases, reflujo, estreñimiento, dolor, diarrea)
- Correlación IA entre alimentos consumidos y síntomas
- Reportes clínicos estructurados con nivel de correlación
- Persistencia en colección `symptoms_logs`

### 🏪 VitaMarket — Escáner de Supermercado
**Componente:** `SupermarketScanner.tsx` · **Endpoint:** `POST /api/scan-grocery`

- Escaneo por cámara de etiquetas nutricionales
- Decodificación de ingredientes, azúcares, grasas, sodio
- Puntuación digestiva (1-100) y nutricional (1-100)
- Clasificación: Excelente / Bueno / Regular / Evitar
- Alternativas más saludables sugeridas por IA

### 🧘 VitaMind — Bienestar Mental
**Componente:** `VitaMind.tsx` · **Endpoint:** `POST /api/mind-zen`

- Reestructuración cognitiva (CBT) con IA
- Descompresión zen según estado emocional
- Motor de respiración con temporizador animado
- Sintetizador de audio Web API (binaural, ruido blanco, frecuencias solfeggio 432Hz/528Hz)

### 🏋️ VitaPerformance — Rendimiento Deportivo
**Componente:** `VitaPerformance.tsx` · **Endpoints:** `POST /api/generate-fitness-routine`, `POST /api/generate-coach-performance`

- Dashboard con VitaScore y Recovery Score
- Generador de rutinas IA (diarias, semanales, mesociclos)
- Registro de entrenamientos, recuperación, bienestar, medidas corporales
- Gráficos de tendencia de rendimiento
- 4 sub-tabs: Dashboard, Planner, Logs, Charts

### 👑 Vita IA Max — Módulo Elite
**Componente:** `VitaIaMax.tsx` · **Plan:** $15.00/mes

- **Vision**: Análisis biomecánico de screenshots, video con telemetría
- **Strength**: Calculadora 1RM (Epley/Brzycki), RPE/RIR, historial
- **Supps**: Temporizador y dosificador de suplementos
- **Mesocycle**: Calendario de mesociclos con grid visual

### 👨‍👩‍👧‍👦 VitaFamily — Perfiles Familiares
**Componente:** `FamilyProfiles.tsx`

- CRUD de perfiles familiares (nombre, edad, peso, altura, objetivo)
- Generación de menús de 3 días por miembro
- Restricciones alimentarias personalizadas

### 🏆 VitaGoals — Logros y Gamificación
**Componente:** `Achievements.tsx`

- Sistema de insignias con progreso (Iniciación, Explorador, Constancia, Proeza)
- Rachas diarias, comidas registradas, fotos analizadas
- Barras de progreso y condiciones de desbloqueo

### ✈️ VitaVacaciones & VitaTravel
**Componentes:** `VitaVacation.tsx`, `VitaTravel.tsx`

- Estrategia alimenticia vacacional por tipo de locación
- Compensador de excesos con planes de recuperación
- Rutinas exprés (Quemador Playero, Cardio Core, Tabata)
- Calculadora de jet-lag, kit de emergencia digestiva, hidratación en tránsito

---

## 🔐 Autenticación

### Flujo Híbrido Google OAuth

```
Usuario hace clic en "Vincular con Google"
         │
         ▼
┌─────────────────────┐
│ signInWithPopup()    │ ← Escritorio (funciona en Chrome/Safari/Firefox)
└──────┬──────────────┘
       │ ¿Error popup-blocked / web-storage-unsupported?
       ▼
┌─────────────────────┐
│ signInWithRedirect() │ ← Móvil / WebView (iOS WKWebView, Android WebView)
└──────┬──────────────┘
       │ Redirección a Google → vuelta a la app
       ▼
┌─────────────────────┐
│ getRedirectResult()  │ ← Se ejecuta al cargar la app (App.tsx)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ onAuthStateChanged() │ ← Listener permanente de sesión
└─────────────────────┘
```

### Modos de acceso adicionales
- **Email/Password**: Registro con onboarding (edad, peso, altura, objetivo)
- **Demo Bypass**: Acceso instantáneo sin credenciales para pruebas

---

## 💳 Sistema de Pagos

### Arquitectura Multi-plataforma

```
┌─────────────────────────────────────────────────────┐
│              Abstracción de Pagos                    │
│              src/lib/payments.ts                     │
├──────────────┬──────────────────┬───────────────────┤
│    Web       │      iOS         │     Android       │
│   Stripe     │    StoreKit      │  Google Play      │
│   Checkout   │  In-App Purchase │    Billing        │
├──────────────┼──────────────────┼───────────────────┤
│ Se redirige  │  needsNativeIAP  │  needsNativeIAP   │
│ a Stripe     │  Capacitor IAP   │  Capacitor IAP    │
│ Checkout     │  plugin          │  plugin           │
└──────────────┴──────────────────┴───────────────────┘
```

### Flujo de Pago Web (Stripe)

```
Usuario → Clic "Suscribirse"
  │
  ▼
POST /api/checkout-session → Crea sesión en Stripe
  │
  ▼
Redirección a checkout.stripe.com → Usuario paga
  │
  ▼
Stripe redirige a /?payment_success=true
  │
  ▼
App.tsx detecta URL params → Actualiza Firestore → Usuario Premium
  │
  ▼
Webhook Stripe → /api/stripe-webhook → Eventos: created, updated, deleted, failed
```

### Modo Desarrollo

Cuando `STRIPE_SECRET_KEY` no está configurada:
- Banner amarillo `🛠️ Modo Desarrollo` visible en la UI
- Pagos simulados automáticamente (1.5s de espera, actualización directa en Firestore)
- Sin necesidad de cuenta Stripe ni tarjeta de crédito

---

## 🗄️ Modelo de Datos (Firestore)

```
users/{userId}
  ├── name, email, subscriptionStatus, age, weight, height, objective
  ├── analyses/{analysisId}          ← Escaneos de alimentos
  │     foods_detected[], estimated_calories, protein, carbs, fat,
  │     confidence, digestive_risk, recommendations[], alternatives[]
  ├── meal_plans/{planId}            ← Planes nutricionales
  │     durationDays, goal, planDays[]
  ├── recipes/{recipeId}             ← Recetas personalizadas
  │     title, category, ingredients[], preparation[], benefits[]
  ├── notifications/{notifId}        ← Notificaciones in-app
  │     title, message, read
  ├── chat_history/{chatId}          ← Historial de chat
  │     messages[]
  ├── subscriptions/{subId}          ← Registro de suscripción
  │     status, priceId, expiresAt
  ├── payments/{paymentId}           ← Recibos de pago
  │     amount, status, stripeSessionId
  └── claims/{claimId}               ← Reclamos/soporte
        title, category, description, status, response

symptoms_logs/{logId}                ← Síntomas digestivos
  user_id, date, symptom, severity, notes

family_profiles/{profileId}          ← Perfiles familiares
  owner_id, name, age, weight, height, goal, restrictions

user_progress/{userId}               ← Progreso gamificación
  streakDays, mealsLoggedCount, photosAnalyzedCount

training_sessions/{sessionId}        ← Sesiones de entrenamiento
recovery_logs/{logId}                ← Registros de recuperación
wellness_logs/{logId}                ← Bienestar emocional
measurements/{measurementId}         ← Medidas corporales
```

---

## 🔌 API Endpoints

| # | Método | Ruta | Descripción |
|---|--------|------|-------------|
| 1 | `GET` | `/api/health` | Estado del servidor (env, Gemini, DB) |
| 2 | `POST` | `/api/analyze-food` | Análisis visual de alimentos (Gemini Vision) |
| 3 | `POST` | `/api/chat` | Chat nutricional IA |
| 4 | `POST` | `/api/mind-zen` | CBT y descompresión zen |
| 5 | `POST` | `/api/generate-recipe` | Generador de recetas IA |
| 6 | `POST` | `/api/generate-meal-plan` | Plan nutricional IA |
| 7 | `POST` | `/api/checkout-session` | Sesión de pago Stripe |
| 8 | `POST` | `/api/stripe-webhook` | Webhook de eventos Stripe |
| 9 | `POST` | `/api/create-portal-session` | Portal de cliente Stripe |
| 10 | `POST` | `/api/analyze-digestive-patterns` | Correlación alimentos-síntomas |
| 11 | `POST` | `/api/scan-grocery` | Escáner de etiquetas supermercado |
| 12 | `POST` | `/api/generate-coach-summary` | Resumen coaching nutricional |
| 13 | `POST` | `/api/generate-shopping-list` | Lista de compras semanal |
| 14 | `POST` | `/api/generate-coach-performance` | Asesoría rendimiento deportivo |
| 15 | `POST` | `/api/generate-fitness-routine` | Rutina de ejercicios IA |
| 16 | `POST` | `/api/verify-payment` | Verificación de pago |

Todos los endpoints de IA tienen fallback automático a datos mock si Gemini no está configurado.

---

## 🎨 Sistema de Diseño

### Tema Claro/Oscuro

- **Contexto**: `ThemeContext.tsx` — persistencia en localStorage
- **Detección**: Preferencia del sistema operativo en primera carga
- **Toggle**: Botón sol/luna en el Header
- **Implementación**: Clase `dark` en `<html>`, variantes `dark:` en Tailwind
- **Transiciones**: Suavizadas con `transition-colors duration-300`

### Paleta de Colores

| Uso | Claro | Oscuro |
|-----|-------|--------|
| Marca principal | `emerald-500` → `teal-600` | `emerald-400` → `teal-500` |
| Fondo | `slate-50` | `slate-950` |
| Superficie | `white` | `slate-900` |
| Texto primario | `slate-800` | `slate-100` |
| Riesgo alto | `rose-500` | `rose-400` |
| Riesgo medio | `amber-500` | `amber-400` |
| Riesgo bajo | `emerald-500` | `emerald-400` |

---

## 📱 Despliegue Multi-plataforma

### 🌐 Web (Cloud Run / Vercel / cualquier hosting Node.js)

```bash
npm run build
npm start
# → http://localhost:3000
```

El servidor Express sirve la SPA compilada desde `dist/` en producción.

### 🍎 iOS (App Store)

```bash
# 1. Compilar web
npm run build

# 2. Sincronizar con Capacitor
npx cap sync ios

# 3. Abrir en Xcode
npx cap open ios

# 4. Configurar StoreKit In-App Purchases en App Store Connect
#    - Crear productos: vita_premium_monthly, vita_max_monthly
#    - Implementar plugin IAP nativo en src/lib/payments.ts

# 5. Build y submit desde Xcode
```

### 🤖 Android (Play Store)

```bash
# 1. Compilar web
npm run build

# 2. Sincronizar con Capacitor
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android

# 4. Configurar Google Play Billing en Play Console
#    - Crear productos: vita_premium_monthly, vita_max_monthly
#    - Implementar plugin IAP nativo en src/lib/payments.ts

# 5. Build signed APK/AAB desde Android Studio
```

### Puente Nativo (IAP)

Para habilitar pagos nativos, instalar el plugin Capacitor IAP:

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

Luego implementar la interfaz en `src/lib/payments.ts` en la sección `if (result.needsNativeIAP)`.

---

## 🧪 Modo Desarrollo

El modo desarrollo se activa automáticamente cuando:
- El servidor corre en `NODE_ENV=development`
- `STRIPE_SECRET_KEY` no está configurada

**Comportamiento:**
- Banner amarillo visible en la UI
- Pagos simulados (1.5s de espera, éxito automático)
- Firebase usa credenciales de desarrollo
- Gemini retorna datos mock si no hay API key

---

## 📊 Planes de Suscripción

| | Free | Plus | Max |
|---|------|------|-----|
| **Precio** | $0 | $7.99/mes | $15.00/mes |
| Escaneos/día | 3 | ∞ | ∞ |
| Chat IA/día | 1 | ∞ | ∞ |
| Recetas | ✅ | ✅ | ✅ |
| Plan nutricional | ❌ | ✅ | ✅ |
| Insights digestivo | ❌ | ✅ | ✅ |
| Scanner supermercado | ❌ | ✅ | ✅ |
| Coach diario | ❌ | ✅ | ✅ |
| Perfiles familiares | ❌ | ✅ | ✅ |
| Rendimiento deportivo | ❌ | ✅ | ✅ |
| Perfil clínico | ❌ | ✅ | ✅ |
| Vacaciones/Travel | ❌ | ✅ | ✅ |
| VitaMind | ❌ | ✅ | ✅ |
| Vita IA Max Elite | ❌ | ❌ | ✅ |
| 1RM/RPE/Mesociclos | ❌ | ❌ | ✅ |
| Sin publicidad | ❌ | ✅ | ✅ |

---

## 🔒 Seguridad

### Firestore Rules (`firestore.rules`)

- **Default deny-all**: Acceso denegado por defecto
- **Owner-based access**: Cada usuario solo lee/escribe sus propios documentos
- **Validación de esquema**: Reglas estructurales para cada tipo de documento
- **Campos protegidos**: `subscriptionStatus` solo modificable por el servidor
- **Inmutabilidad**: Documentos de pago no modificables tras creación

### API Security

- Límite de payload: 25MB para imágenes base64
- Webhook Stripe: firma verificada con `stripe-webhook-secret`
- Gemini API Key: solo en servidor, nunca expuesta al cliente

---

## 🔄 Extensibilidad

### Agregar un nuevo módulo

1. Crear componente en `src/components/NuevoModulo.tsx`
2. Definir tipos en `src/types.ts` (si aplica)
3. Agregar endpoint en `server.ts` con mock fallback
4. Registrar vista en `App.tsx` (variable `currentView`)
5. Agregar card en `Dashboard.tsx` y link en `Header.tsx`

### Agregar un nuevo plan de suscripción

1. Agregar entrada en `PLANS` en `src/lib/payments.ts`
2. Crear producto/precio en Stripe Dashboard
3. Agregar card en `PremiumPlans.tsx`
4. Actualizar `UserProfile.subscriptionStatus` en `types.ts`

---

## 📝 Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor desarrollo (Express + Vite HMR) |
| `npm run build` | Compilar frontend + bundle servidor |
| `npm start` | Iniciar producción |
| `npm run lint` | TypeScript type check |
| `npm run clean` | Limpiar archivos de build |
| `npx cap add ios` | Agregar plataforma iOS |
| `npx cap add android` | Agregar plataforma Android |
| `npx cap sync` | Sincronizar web → nativo |
| `npx cap open ios` | Abrir en Xcode |
| `npx cap open android` | Abrir en Android Studio |

---

## 📄 Licencia

© 2026 Vita IA Tech Solutions Inc. — Software propietario. Todos los derechos reservados.

---

> **Nota para el equipo**: Este documento debe actualizarse con cada release significativo. Agregar nuevos módulos, endpoints, tipos de datos, y cambios en la arquitectura a medida que evoluciona el proyecto.
