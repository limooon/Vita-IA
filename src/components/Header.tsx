import React, { useState } from "react";
import { UserProfile } from "../types";
import { LogOut, User, Sparkles, Bell, Heart } from "lucide-react";
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
}

export default function Header({
  user,
  onLogout,
  onLoginTrigger,
  onViewChange,
  currentView,
  onViewPremium,
  unreadNotificationsCount,
  onOpenNotifications
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100/50 bg-white/80 backdrop-blur-md">
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
            <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center">
              Vita<span className="text-emerald-500 font-extrabold uppercase text-xs bg-emerald-50 px-1.5 py-0.5 rounded-md ml-1">AI</span>
            </h1>
            <p className="text-[10px] font-mono leading-none text-slate-400">Nutrición Inteligente</p>
          </div>
        </div>

         {/* Global Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "analyze", label: "Analizar Food" },
            { id: "recipes", label: "Recetas" },
            { id: "diet", label: "Plan Nutricional" },
            { id: "performance", label: "Rentimiento & Deporte" },
            { id: "chat", label: "Consultar Chat IA" },
            { id: "help", label: "FAQ & Soporte" }
          ].map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  active ? "text-emerald-600 bg-emerald-50/50" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
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
                user.subscriptionStatus === "premium"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-100"
                  : "bg-emerald-550 hover:bg-emerald-600 text-white bg-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {user.subscriptionStatus === "premium" ? "Premium Activo" : "Obtener Premium"}
              </span>
              {user.subscriptionStatus !== "premium" && (
                <span className="inline-block sm:hidden">Plan</span>
              )}
            </button>
          )}

          {/* Notifications Alert */}
          {user && (
            <button
              id="notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
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
                className="flex items-center space-x-1 p-1 rounded-full border border-slate-200 hover:border-emerald-300 transition-colors bg-slate-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm uppercase">
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
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-40 border border-slate-100"
                    >
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Cuenta vinculada</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name || "Usuario VitaAI"}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <button
                          id="dropdown-dashboard-item"
                          onClick={() => {
                            setProfileOpen(false);
                            onViewChange("dashboard");
                          }}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>Mi Perfil</span>
                        </button>
                        <button
                          id="dropdown-premium-item"
                          onClick={() => {
                            setProfileOpen(false);
                            onViewPremium();
                          }}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <span>Planes y Suscripción</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          id="header-logout-btn"
                          onClick={() => {
                            setProfileOpen(false);
                            onLogout();
                          }}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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
              className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
            >
              Iniciar Sesión
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
