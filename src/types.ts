export interface UserMetrics {
  age?: number;
  weight?: number;
  height?: number;
  objective?: string;
}

export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  subscriptionStatus: "free" | "premium" | "vita_ia_max";
  createdAt: string;
  age?: number;
  weight?: number;
  height?: number;
  objective?: string;
}

export interface FoodAnalysis {
  id?: string;
  userId: string;
  imageUrl: string;
  foods_detected: string[];
  estimated_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence?: "Alta" | "Media" | "Baja" | string;
  digestive_risk: "Low" | "Medium" | "High";
  recommendations: string[];
  alternatives: string[];
  createdAt: string;
}

export interface MedicalProfile {
  id?: string;
  userId: string;
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasGastritis: boolean;
  hasColonIrritable: boolean;
  hasReflujo: boolean;
  hasHigadoGraso: boolean;
  hasEnfermedadRenal: boolean;
  allergies: string;
  intolerances: string;
  createdAt: string;
}

export interface VacationLog {
  id?: string;
  userId: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  currentWeight?: number;
  exerciseMinutes?: number;
  notes?: string;
  adjustedGoal?: string;
  createdAt: string;
  vacationLocation?: string;
  vacationStrategy?: string;
  vacationExercises?: string;
  mealPlanEasy?: string;
  excessCompensated?: string;
  expressRoutineChosen?: string;
}

export interface ProductComparison {
  id?: string;
  userId: string;
  prodAName?: string;
  prodBName?: string;
  prodAPrice?: number;
  prodBPrice?: number;
  prodAWeightG?: number;
  prodBWeightG?: number;
  prodAServingG?: number;
  prodBServingG?: number;
  prodAProteinG?: number;
  prodBProteinG?: number;
  unitPriceA?: number;
  unitPriceB?: number;
  kgPriceA?: number;
  kgPriceB?: number;
  servingCostA?: number;
  servingCostB?: number;
  recommendation?: string;
  ratingRatio?: string;
  createdAt: string;
  productQuery?: string;
  bestPriceStore?: string;
  competitorPricesJson?: string;
}

export interface SocialMealLog {
  id?: string;
  userId: string;
  placeType?: "Restaurante" | "Fiesta" | "Evento" | "Reunión" | string;
  placeName?: string;
  estimatedCalories?: number;
  description?: string;
  photoUrl?: string; // base64 string
  digestiveRisk?: string;
  date?: string;
  createdAt: string;
  eventType?: string;
  restaurantFriendlyChosen?: string;
  preShieldUsed?: string;
  postRecoveryUsed?: string;
}

export interface TravelLog {
  id?: string;
  userId: string;
  city?: string;
  state?: string;
  country?: string;
  durationDays?: number;
  startDate?: string;
  recommendations?: string[];
  createdAt: string;
  departureCity?: string;
  destinationCity?: string;
  emergencyPillsKit?: string;
  transitHydrationOz?: number;
}

export interface Recipe {
  id?: string;
  title: string;
  category: "gastritis" | "colon_irritable" | "weight_loss" | "bloating" | "healthy";
  ingredients: string[];
  preparation: string[];
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  benefits: string[];
  isPremium: boolean;
}

export interface MealPlanDay {
  day: number;
  meals: {
    breakfast: string;
    snack1: string;
    lunch: string;
    snack2: string;
    dinner: string;
  };
  dailyTips?: string;
}

export interface MealPlan {
  id?: string;
  userId: string;
  durationDays: number;
  goal: string;
  targetConditions?: string[];
  planDays: MealPlanDay[];
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  createdAt?: string;
}

export interface InAppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SubscriptionRegister {
  id?: string;
  userId: string;
  status: "active" | "cancelled";
  priceId: string;
  expiresAt: string;
  createdAt: string;
}

export interface PaymentReceipt {
  id?: string;
  userId: string;
  amount: number;
  status: "succeeded" | "failed";
  stripeSessionId: string;
  createdAt: string;
}

export interface SymptomLog {
  id?: string;
  user_id: string;
  date: string;
  symptom: "inflamacion" | "gases" | "reflujo" | "estrenimiento" | "dolor_abdominal" | "diarrea" | string;
  severity: "Baja" | "Media" | "Alta" | string;
  notes: string;
}

export interface FamilyProfile {
  id?: string;
  owner_id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  restrictions: string;
}

export interface ShoppingItem {
  category: "Proteínas" | "Verduras" | "Frutas" | "Cereales" | "Bebidas" | string;
  name: string;
  checked: boolean;
  price?: number;
}

export interface ShoppingList {
  id?: string;
  userId: string;
  createdAt: string;
  items: ShoppingItem[];
  estimatedCost: number;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  target: number;
}

export interface UserProgress {
  userId: string;
  streakDays: number;
  lastLogDate: string;
  mealsLoggedCount: number;
  recipesLoggedCount: number;
  photosAnalyzedCount: number;
}

export interface UserClaim {
  id?: string;
  userId: string;
  title: string;
  category: "servicio" | "app_funcionamiento" | "pagos" | "nutricion" | "otro" | string;
  description: string;
  status: "Pendiente" | "En Revisión" | "Resuelto" | string;
  createdAt: string;
  response?: string;
}

