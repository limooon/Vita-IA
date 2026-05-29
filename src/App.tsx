import React, { useState, useEffect } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { UserProfile, FoodAnalysis, Recipe, MealPlan, ChatMessage, InAppNotification } from "./types";

// Import custom modular views
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import FoodAnalyzer from "./components/FoodAnalyzer";
import NutritionChat from "./components/NutritionChat";
import RecipesList from "./components/RecipesList";
import MealPlanner from "./components/MealPlanner";
import PremiumPlans from "./components/PremiumPlans";
import HelpAndFaq from "./components/HelpAndFaq";
import AuthPanel from "./components/AuthPanel";

// Premium Modules
import DigestiveInsights from "./components/DigestiveInsights";
import SupermarketScanner from "./components/SupermarketScanner";
import NutritionCoach from "./components/NutritionCoach";
import ShoppingPlanner from "./components/ShoppingPlanner";
import FamilyProfiles from "./components/FamilyProfiles";
import Achievements from "./components/Achievements";
import VitaPerformance from "./components/VitaPerformance";
import ClinicalProfile from "./components/ClinicalProfile";
import VitaVacation from "./components/VitaVacation";
import SocialMeals from "./components/SocialMeals";
import VitaTravel from "./components/VitaTravel";
import SmartComparator from "./components/SmartComparator";
import LegalCenter from "./components/LegalCenter";

import { Bell, Check, Sparkles, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MAX_FREE_SCANS = 3;

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>("dashboard");

  // Core collections states
  const [analyses, setAnalyses] = useState<FoodAnalysis[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Remaining daily scan counters
  const [scansTodayCount, setScansTodayCount] = useState<number>(0);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        try {
          // Attempt to retrieve user configuration profiling from Firestore
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: data.name || firebaseUser.displayName || "Usuario VitaAI",
              subscriptionStatus: data.subscriptionStatus || "free",
              age: data.age,
              weight: data.weight,
              height: data.height,
              objective: data.objective,
              createdAt: data.createdAt || new Date().toISOString()
            });
          } else {
            // Document does not exist, provision new model
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "Usuario VitaAI",
              subscriptionStatus: "free",
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, newProfile);
            setCurrentUser(newProfile);
          }
        } catch (err) {
          console.warn("Database rules restriction or offline state. Loading mock user profiles.", err);
          // Fallback user setting
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "Usuario VitaAI",
            subscriptionStatus: "free",
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch collections from security-rules complaint directories when User logs in
  useEffect(() => {
    if (!currentUser) {
      // Clear local records
      setAnalyses([]);
      setRecipes([]);
      setMealPlans([]);
      setChatHistory([]);
      setNotifications([]);
      setScansTodayCount(0);
      return;
    }

    const pullUserData = async () => {
      try {
        // 1. Pull food analyses of current user
        const analysesRef = collection(db, "users", currentUser.uid, "analyses");
        // Rule compliant pull
        const snapshot = await getDocs(analysesRef);
        const parsedAnalyses: FoodAnalysis[] = [];
        snapshot.forEach((doc) => {
          parsedAnalyses.push({ id: doc.id, ...doc.data() } as FoodAnalysis);
        });
        
        // Sort by dates descending
        parsedAnalyses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAnalyses(parsedAnalyses);

        // Fetch user custom recipes
        const recipesRef = collection(db, "users", currentUser.uid, "recipes");
        const recipesSnap = await getDocs(recipesRef);
        const parsedRecipes: Recipe[] = [];
        recipesSnap.forEach((doc) => {
          parsedRecipes.push({ id: doc.id, ...doc.data() } as Recipe);
        });
        setRecipes(parsedRecipes);

        // Calculate count scanned today block limits
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayScans = parsedAnalyses.filter(a => new Date(a.createdAt).getTime() >= startOfToday.getTime());
        setScansTodayCount(todayScans.length);

        // 2. Fetch notifications
        const notifRef = collection(db, "users", currentUser.uid, "notifications");
        const notifSnap = await getDocs(notifRef);
        const parsedNotifs: InAppNotification[] = [];
        notifSnap.forEach((doc) => {
          parsedNotifs.push({ id: doc.id, ...doc.data() } as InAppNotification);
        });
        
        // Feed mock ones if none present to give beautiful UI
        if (parsedNotifs.length === 0) {
          const defaults: InAppNotification[] = [
            {
              id: "notif_welcome",
              userId: currentUser.uid,
              title: "¡Bienvenido a VitaAI! 💚",
              message: "Tu cuenta ha sido creada con éxito. Visita VitaScan para evaluar tus porciones de comida.",
              read: false,
              createdAt: new Date().toISOString()
            }
          ];
          setNotifications(defaults);
        } else {
          setNotifications(parsedNotifs);
        }

      } catch (err) {
        console.warn("Firestore permissions or offline mode. Loading localStorage buffers.", err);
        loadLocalStorageBuffers();
      }
    };

    pullUserData();
  }, [currentUser]);

  const loadLocalStorageBuffers = () => {
    if (!currentUser) return;
    const localAnalysesString = localStorage.getItem(`colonia_analyses_${currentUser.uid}`);
    if (localAnalysesString) {
      try {
        const parsed = JSON.parse(localAnalysesString);
        setAnalyses(parsed);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayScans = parsed.filter((a: any) => new Date(a.createdAt).getTime() >= startOfToday.getTime());
        setScansTodayCount(todayScans.length);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Profile physical parameters update trigger
  const handleUpdateMetrics = async (metrics: { age: number; weight: number; height: number; objective: string }) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, metrics);
      setCurrentUser((prev) => prev ? { ...prev, ...metrics } : null);
    } catch (err) {
      // Offline fallback
      setCurrentUser((prev) => prev ? { ...prev, ...metrics } : null);
    }
  };

  // Add a brand new scanned food logging in firestore
  const handleSaveAnalysis = async (analysis: Omit<FoodAnalysis, "id">) => {
    if (!currentUser) return;
    try {
      // Create new documents nested inside users subcollection folder
      const analysesSubcollectionRef = collection(db, "users", currentUser.uid, "analyses");
      const newDocRef = doc(analysesSubcollectionRef); // Generate auto-ID
      await setDoc(newDocRef, analysis);
      
      const newAnalysis: FoodAnalysis = { id: newDocRef.id, ...analysis };
      setAnalyses((prev) => [newAnalysis, ...prev]);
      setScansTodayCount((prev) => prev + 1);

      // Also serialize to local cache as reliable backups
      const updated = [newAnalysis, ...analyses];
      localStorage.setItem(`colonia_analyses_${currentUser.uid}`, JSON.stringify(updated));

    } catch (err) {
      // Sandbox fallback state append
      const fallbackAnalysis: FoodAnalysis = { id: Math.random().toString(36).substring(7), ...analysis };
      setAnalyses((prev) => [fallbackAnalysis, ...prev]);
      setScansTodayCount((prev) => prev + 1);
      
      const updated = [fallbackAnalysis, ...analyses];
      localStorage.setItem(`colonia_analyses_${currentUser.uid}`, JSON.stringify(updated));
    }
  };

  // Chat conversation logs persistence
  const handleSaveChatMessage = async (messages: ChatMessage[]) => {
    if (!currentUser) return;
    setChatHistory(messages);
    try {
      // Save full chat history context
      const chatDocRef = doc(db, "users", currentUser.uid, "chat_history", "current_session");
      await setDoc(chatDocRef, { messages, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore chat save skipped due to offline mode.", err);
    }
  };

  // New generated recipes record inside database
  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!currentUser) return;
    try {
      const recipesDocRef = collection(db, "users", currentUser.uid, "recipes");
      const newDocRef = doc(recipesDocRef);
      const recipeWithId = { ...recipe, id: newDocRef.id };
      await setDoc(newDocRef, recipeWithId);
      setRecipes((prev) => [recipeWithId, ...prev]);
    } catch (err) {
      console.warn("Recipes catalog persistent storage failed. Fallback to view buffer.", err);
      setRecipes((prev) => [recipe, ...prev]);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!currentUser) return;
    try {
      const recipeDocRef = doc(db, "users", currentUser.uid, "recipes", recipeId);
      await deleteDoc(recipeDocRef);
      setRecipes((prev) => prev.filter(r => r.id !== recipeId));
    } catch (err) {
      console.warn("Recipes catalog persistent delete failed.", err);
      setRecipes((prev) => prev.filter(r => r.id !== recipeId));
    }
  };

  // 7, 14, 30 digital schedules record
  const handleGeneratePlan = async (plan: Omit<MealPlan, "id">) => {
    if (!currentUser) return;
    try {
      const plansDocRef = collection(db, "users", currentUser.uid, "meal_plans");
      const newDocRef = doc(plansDocRef);
      const readyPlan: MealPlan = { id: newDocRef.id, ...plan };
      await setDoc(newDocRef, readyPlan);
      setMealPlans((prev) => [readyPlan, ...prev]);
    } catch (err) {
      const readyPlan: MealPlan = { id: Math.random().toString(36).substring(7), ...plan };
      setMealPlans((prev) => [readyPlan, ...prev]);
    }
  };

  // Hook checkout premium conversion
  const handleUpgradeSuccess = async () => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { subscriptionStatus: "premium" });
      setCurrentUser((prev) => prev ? { ...prev, subscriptionStatus: "premium" } : null);

      // Append success alert notification
      const notifRef = collection(db, "users", currentUser.uid, "notifications");
      const upgradeNotif: InAppNotification = {
        userId: currentUser.uid,
        title: "⚡ ¡Acceso Premium Conseguido! ⭐",
        message: "Se ha desbloqueado tu cuenta de forma exitosa. Tienes análisis de alimentos ilimitados por foto y dietas clínicas de 7, 14 y 30 días.",
        read: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(notifRef), upgradeNotif);
      setNotifications((prev) => [upgradeNotif, ...prev]);

    } catch (err) {
      setCurrentUser((prev) => prev ? { ...prev, subscriptionStatus: "premium" } : null);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    setCurrentView("dashboard");
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    setCurrentView("dashboard");
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleMarkNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    if (!currentUser) return;
    try {
      const notifCollection = collection(db, "users", currentUser.uid, "notifications");
      const snap = await getDocs(notifCollection);
      snap.forEach(async (dSnap) => {
        await updateDoc(doc(db, "users", currentUser.uid, "notifications", dSnap.id), { read: true });
      });
    } catch (e) {
      console.warn(e);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 flex-col space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
        <p className="text-xs font-mono text-slate-400">VitaAI está encendiendo el motor inteligente...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 flex flex-col justify-between">
      
      {/* Top Banner Global layout */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onLoginTrigger={() => setCurrentView("auth")}
        onViewChange={setCurrentView}
        currentView={currentView}
        onViewPremium={() => setCurrentView("premium")}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => {
          setShowNotificationsModal(true);
          handleMarkNotificationsAsRead();
        }}
      />

      {/* Main viewport area */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        
        {!currentUser ? (
          
          /* SignUp, Login, credential validation cards */
          <AuthPanel onAuthSuccess={handleAuthSuccess} />

        ) : (
          
          /* Modular view tabs switches */
          <div className="min-h-[70vh]">
            {currentView === "dashboard" && (
              <Dashboard
                user={currentUser}
                analyses={analyses}
                onViewChange={setCurrentView}
                onUpdateMetrics={handleUpdateMetrics}
                scansTodayCount={scansTodayCount}
                maxFreeScans={MAX_FREE_SCANS}
              />
            )}

            {currentView === "analyze" && (
              <FoodAnalyzer
                user={currentUser}
                scansTodayCount={scansTodayCount}
                maxFreeScans={MAX_FREE_SCANS}
                onSaveAnalysis={handleSaveAnalysis}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "chat" && (
              <NutritionChat
                user={currentUser}
                initialChatHistory={chatHistory}
                onSaveChatMessage={handleSaveChatMessage}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "recipes" && (
              <RecipesList
                user={currentUser}
                initialRecipes={[
                  {
                    id: "rec_oats",
                    title: "Crema de Avena Amigable con Puré de Papaya Dulce",
                    category: "gastritis",
                    ingredients: [
                      "1 taza de hojuelas de avena sin gluten",
                      "2 tazas de leche de almendras o agua purificada",
                      "1/2 taza de papaya dulce madura troceada",
                      "1 cucharadita de semillas de chía hidratadas",
                      "Una pizca de canela en polvo"
                    ],
                    preparation: [
                      "Pon a hervir el agua o la leche de almendras y añade las hojuelas de avena.",
                      "Cocina a fuego lento durante 8 minutos moviendo constantemente hasta espesar.",
                      "Sirve en un tazón tibio y corona con la papaya dulce madura picada y las semillas de chía hidratadas.",
                      "Espolvorea una pizca muy ligera de canela para mejorar la respuesta enzimática."
                    ],
                    calories: 220,
                    benefits: [
                      "La papaya madura contiene papaína, una enzima excelente para descomponer proteínas sin recargar la acidez.",
                      "La avena cocida tiene betaglucanos insolubles que recubren y suavizan la mucosa gástrica inflamada."
                    ],
                    isPremium: false
                  },
                  {
                    id: "rec_chicken_broth",
                    title: "Caldo Dorado Concentrado de Calabaza con Pollo y Jengibre",
                    category: "colon_irritable",
                    ingredients: [
                      "150g de pechuga de pollo desgrasada en cubos",
                      "1/2 taza de calabaza de castilla en trozos",
                      "1 cucharadita de jengibre fresco rallado",
                      "1 taza de puré o caldo de zanahorias",
                      "Hojas frescas de cilantro"
                    ],
                    preparation: [
                      "Hierve la calabaza y la pechuga de pollo en abundante agua pura.",
                      "Añade el jengibre fresco rallado durante los últimos 10 minutos de hervor para maximizar el aporte térmico.",
                      "Licúa la calabaza caliente con el caldo para lograr una textura cremosa de fácil absorción.",
                      "Sirve coronando con el cilantro fresco."
                    ],
                    calories: 280,
                    benefits: [
                      "El jengibre fresco posee gingeroles desinflamantes probados que disminuyen los espasmos intestinales y el SII.",
                      "La calabaza es baja en FODMAPs, evitando que la microbiota la fermente de forma rápida y cause hinchazón."
                    ],
                    isPremium: false
                  },
                  ...recipes
                ]}
                onSaveRecipe={handleSaveRecipe}
                onDeleteRecipe={handleDeleteRecipe}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "diet" && (
              <MealPlanner
                user={currentUser}
                initialPlans={mealPlans}
                onGeneratePlan={handleGeneratePlan}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "premium" && (
              <PremiumPlans
                user={currentUser}
                onUpgradeSuccess={handleUpgradeSuccess}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "digestive-insights" && (
              <DigestiveInsights
                user={currentUser}
                analyses={analyses}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "supermarket-scanner" && (
              <SupermarketScanner
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "nutrition-coach" && (
              <NutritionCoach
                user={currentUser}
                analyses={analyses}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "shopping-planner" && (
              <ShoppingPlanner
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "family-profiles" && (
              <FamilyProfiles
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "achievements" && (
              <Achievements
                user={currentUser}
                analysesCount={analyses.length}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "performance" && currentUser && (
              <VitaPerformance
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "clinical-profile" && currentUser && (
              <ClinicalProfile
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "vacations" && currentUser && (
              <VitaVacation
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "social-meals" && currentUser && (
              <SocialMeals
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "vitatravel" && currentUser && (
              <VitaTravel
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "smart-comparator" && currentUser && (
              <SmartComparator
                user={currentUser}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "legal-center" && (
              <LegalCenter
                onViewChange={setCurrentView}
              />
            )}

            {currentView === "help" && <HelpAndFaq />}
          </div>

        )}

      </main>

      {/* Persistent Footer and diagnostic disclaimers */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 w-full text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-slate-550 leading-relaxed text-slate-550 text-slate-500">
            © 2026 <strong>VitaAI Tech Solutions Inc.</strong> • Desarrollado con Inteligencia Artificial Generadora • <button onClick={() => setCurrentView("legal-center")} className="text-teal-600 hover:underline font-bold">Centro Legal</button>
          </p>
          <p className="max-w-xl mx-auto text-[10px] text-slate-450 leading-relaxed">
            *Advertencia Legal: Todo el contenido nutricional e hipótesis alimenticias emitidas son meramente explicativas e informativas. VitaAI no constituye una prescripción médica o terapéutica; consulta siempre a tu médico o nutricionista de cabecera.
          </p>
        </div>
      </footer>

      {/* Notifications overlay modal slidein panel */}
      <AnimatePresence>
        {showNotificationsModal && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="notifications-overlay-modal">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => setShowNotificationsModal(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-emerald-500" />
                    <span>Mis Alertas Alimenticias</span>
                  </h3>
                  <button 
                    onClick={() => setShowNotificationsModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                    id="close-notifications-btn"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  {notifications.map((notif, nIdx) => (
                    <div 
                      key={notif.id || nIdx} 
                      className={`p-4 rounded-xl border transition-all ${
                        notif.read ? "bg-slate-50/50 border-slate-100" : "bg-emerald-50/20 border-emerald-100/50"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-800">{notif.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">{notif.message}</p>
                      <span className="text-[9px] text-slate-400 mt-2 block font-mono">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  id="notifications-dismiss-all-btn"
                  onClick={() => setShowNotificationsModal(false)}
                  className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 transition-colors"
                >
                  Entendido, cerrar panel
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
