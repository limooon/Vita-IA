import React, { useState } from "react";
import { UserProfile } from "../types";
import { LogOut, User, Sparkles, Bell, Heart, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  onLoginTrigger: () => void;
  onViewChange: (view: string) => void;
  currentView: string;
  onViewPremium: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function Header({
  user,
  onLogout,
  onLoginTrigger,
  onViewChange,
  currentView,
  onViewPremium,
  unreadNotificationsCount,
  onOpenNotifications,
  isDarkMode,
  onToggleTheme
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100/50 bg-white/80 dark:bg-slate-900/85 dark:border-slate-800 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div 
          className="flex cursor-pointer items-center space-x-2.5" 
          onClick={() => onViewChange("dashboard")}
          id="header-brand-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-200">
            <Heart className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center">
              Vita<span className="text-emerald-500 dark:text-emerald-400 font-extrabold uppercase text-xs bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md ml-1 border border-emerald-100 dark:border-emerald-800">AI</span>
            </h1>
            <p className="text-[10px] font-mono leading-none text-slate-400 dark:text-slate-500">Nutrición Inteligente</p>
          </div>
        </div>

         {/* Global Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "analyze", label: "Analizar Food" },
            { id: "recipes", label: "Recetas" },
            { id: "diet", label: "Plan Nutricional" },
            { id: "performance", label: "Deporte" },
            { id: "vita-ia-max", label: "🌟 Vita IA Max" },
            { id: "chat", label: "Consultar Chat IA" },
            { id: "help", label: "FAQ & Soporte" }
          ].map((item) => {
            const active = currentView === item.id;
            const isMax = item.id === "vita-ia-max";
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`relative px-3 py-2 text-xs font-medium transition-all rounded-lg ${
                  active 
                    ? "text-emerald-600 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-950/30" 
                    : isMax
                      ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 dark:text-rose-400 dark:hover:text-rose-350 dark:hover:bg-rose-950/20 font-bold border border-dashed border-rose-200 dark:border-rose-900 animate-pulse"
                      : "text-slate-600 hover:text-slate-800 dark:text-slate-350 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Suscripción Premium Badge Button */}
          {user && (
            <button
              id="header-premium-btn"
              onClick={onViewPremium}
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                user.subscriptionStatus === "premium" || user.subscriptionStatus === "vita_ia_max"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-100"
                  : "bg-emerald-555 hover:bg-emerald-600 text-white bg-emerald-550 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {user.subscriptionStatus === "vita_ia_max" ? "Vita Max Activo 👑" : user.subscriptionStatus === "premium" ? "Premium Activo" : "Obtener Premium"}
              </span>
              {user.subscriptionStatus !== "premium" && user.subscriptionStatus !== "vita_ia_max" && (
                <span className="inline-block sm:hidden flex">Plan</span>
              )}
            </button>
          )}



          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={isDarkMode ? "Modo claro" : "Modo oscuro"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications Alert */}
          {user && (
            <button
              id="notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Trigger */}
          {user ? (
            <div className="relative">
              <button
                id="header-profile-menu-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-1 p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors bg-slate-50 dark:bg-slate-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-350 font-bold text-sm uppercase">
                  {user.name ? user.name[0] : user.email[0]}
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setProfileOpen(false)} 
                    />
                    <motion.div
                      id="profile-dropdown-menu"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-black/5 z-40 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Cuenta vinculada</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name || "Usuario Vita IA"}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <button
                          id="dropdown-dashboard-item"
                          onClick={() => {
                            setProfileOpen(false);
                            onViewChange("clinical-profile");
                          }}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>Mi Perfil Clínico</span>
                        </button>
                        <button
                          id="dropdown-premium-item"
                          onClick={() => {
                            setProfileOpen(false);
                            onViewPremium();
                          }}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <span>Planes y Suscripción</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          id="header-logout-btn"
                          onClick={() => {
                            setProfileOpen(false);
                            onLogout();
                          }}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors animate-none"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={onLoginTrigger}
              className="rounded-lg bg-emerald-50 dark:bg-emerald-950 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
            >
              Iniciar Sesión
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
