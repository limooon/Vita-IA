import React, { useState, useEffect } from "react";
import { UserProfile, ShoppingList, ShoppingItem } from "../types";
import { 
  ArrowLeft, ShoppingCart, Sparkles, Printer, Download, CheckSquare, 
  Plus, Trash2, Loader2, DollarSign, Calendar, ListChecks, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ShoppingPlannerProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function ShoppingPlanner({
  user,
  onViewChange
}: ShoppingPlannerProps) {
  const isPremium = user.subscriptionStatus === "premium";

  // List states
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Proteínas");
  const [successMsg, setSuccessMsg] = useState("");

  const categories = ["Proteínas", "Verduras", "Frutas", "Cereales", "Bebidas", "Aderezos / Semillas"];

  useEffect(() => {
    if (!isPremium) return;
    pullShoppingLists();
  }, [user, isPremium]);

  const pullShoppingLists = async () => {
    try {
      const q = query(
        collection(db, "shopping_lists"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const parsed: ShoppingList[] = [];
      snap.forEach((doc) => {
        parsed.push({ id: doc.id, ...doc.data() } as ShoppingList);
      });

      setLists(parsed);
      if (parsed.length > 0) {
        setActiveList(parsed[0]);
      } else {
        const cached = localStorage.getItem(`vitaai_shopping_${user.uid}`) || localStorage.getItem(`colonia_shopping_${user.uid}`);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setLists(parsedCache);
          if (parsedCache.length > 0) {
            setActiveList(parsedCache[0]);
          }
        }
      }
    } catch (err: any) {
      console.warn("Error pulling shopping lists:", err);
      const cached = localStorage.getItem(`colonia_shopping_${user.uid}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setLists(parsedCache);
        if (parsedCache.length > 0) {
          setActiveList(parsedCache[0]);
        }
      }
    }
  };

  const handleGenerateList = async () => {
    setGenerating(true);
    setSuccessMsg("");

    try {
      const response = await fetch("/api/generate-shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          objective: user.objective || "colon_irritable"
        })
      });

      const data = await response.json();
      if (data.success && data.list) {
        // Save in firebase
        const docRef = await addDoc(collection(db, "shopping_lists"), data.list);
        const created: ShoppingList = { id: docRef.id, ...data.list };
        
        const updated = [created, ...lists];
        setLists(updated);
        setActiveList(created);
        localStorage.setItem(`colonia_shopping_${user.uid}`, JSON.stringify(updated));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.warn("Shopping list generator api skipped/offline:", err);
      // Fallback stomach-safe foods list custom-tailored
      setTimeout(async () => {
        const fallbackItems: ShoppingItem[] = [
          { category: "Proteínas", name: "Pechuga de Pollo Orgánica (Fácil absorción)", checked: false },
          { category: "Proteínas", name: "Filete de Pescado Blanco (Bajo en grasa)", checked: false },
          { category: "Verduras", name: "Calabaza de Castilla tierna (Bajo FODMAP)", checked: false },
          { category: "Verduras", name: "Zanahorias frescas (Prebiótico sano)", checked: false },
          { category: "Frutas", name: "Papaya Dulce Grande (Contiene Papaína digestiva)", checked: false },
          { category: "Frutas", name: "Plátanos Maduros (Suavizante de mucosa)", checked: false },
          { category: "Cereales", name: "Hojuelas de Avena sin Gluten", checked: false },
          { category: "Cereales", name: "Arroz integral hervido", checked: false },
          { category: "Bebidas", name: "Leche de Almendras o de Coco sin Azúcar", checked: false },
          { category: "Bebidas", name: "Té de Manzanilla / Toronjil natural", checked: false },
          { category: "Aderezos / Semillas", name: "Semillas de Chía (Aporte soluble mucilaginoso)", checked: false },
          { category: "Aderezos / Semillas", name: "Jengibre fresco en raíz", checked: false }
        ];

        const mockList: Omit<ShoppingList, "id"> = {
          userId: user.uid,
          createdAt: new Date().toISOString(),
          items: fallbackItems,
          estimatedCost: user.objective === "gastritis" ? 380 : 420
        };

        try {
          const docRef = await addDoc(collection(db, "shopping_lists"), mockList);
          const created: ShoppingList = { id: docRef.id, ...mockList };
          const updated = [created, ...lists];
          setLists(updated);
          setActiveList(created);
          localStorage.setItem(`colonia_shopping_${user.uid}`, JSON.stringify(updated));
        } catch (e) {
          const created: ShoppingList = { id: Math.random().toString(36).substring(7), ...mockList };
          const updated = [created, ...lists];
          setLists(updated);
          setActiveList(created);
          localStorage.setItem(`colonia_shopping_${user.uid}`, JSON.stringify(updated));
        }
      }, 1500);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleCheck = (index: number) => {
    if (!activeList) return;
    const updatedItems = [...activeList.items];
    updatedItems[index].checked = !updatedItems[index].checked;

    const updatedList = { ...activeList, items: updatedItems };
    setActiveList(updatedList);

    // Update in general state & cache
    const updatedLists = lists.map(l => l.id === activeList.id ? updatedList : l);
    setLists(updatedLists);
    localStorage.setItem(`colonia_shopping_${user.uid}`, JSON.stringify(updatedLists));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeList) return;

    const newItem: ShoppingItem = {
      category: newItemCategory,
      name: newItemName.trim(),
      checked: false
    };

    const updatedItems = [...activeList.items, newItem];
    const updatedList = { 
      ...activeList, 
      items: updatedItems,
      estimatedCost: activeList.estimatedCost + 30 
    };

    setActiveList(updatedList);
    setNewItemName("");

    const updatedLists = lists.map(l => l.id === activeList.id ? updatedList : l);
    setLists(updatedLists);
    localStorage.setItem(`colonia_shopping_${user.uid}`, JSON.stringify(updatedLists));
  };

  const handleDeleteList = async (id: string) => {
    const updated = lists.filter(l => l.id !== id);
    setLists(updated);
    if (activeList?.id === id) {
      setActiveList(updated.length > 0 ? updated[0] : null);
    }
    localStorage.setItem(`colonia_shopping_${user.uid}`, JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, "shopping_lists", id));
    } catch (e) {
      console.warn(e);
    }
  };

  const downloadPrintablePDF = () => {
    if (!activeList) return;
    // Inject custom print stylesheet or trigger window print for premium layouts
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsByAisle = categories.reduce((acc: any, cat) => {
      acc[cat] = activeList.items.filter(i => i.category === cat);
      return acc;
    }, {});

    const contentHtml = `
      <html>
        <head>
          <title>Lista de Compras VitaAI</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; padding: 40px; }
            h1 { color: #059669; font-size: 24px; margin-bottom: 5px; }
            p.meta { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
            .aisle-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #0369a1; background-color: #f0f9ff; padding: 6px 12px; border-radius: 6px; margin-top: 20px; }
            ul { list-style: none; padding-left: 5px; margin-top: 8px; }
            li { font-size: 13px; margin-bottom: 8px; display: flex; items-center: center; }
            .checkbox { width: 14px; height: 14px; border: 1px solid #94a3b8; border-radius: 3px; margin-right: 10px; display: inline-block; }
            .cost { font-size: 14px; font-weight: bold; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>🛒 VitaAI • Lista de Despensa</h1>
          <p class="meta">Creado el ${new Date(activeList.createdAt).toLocaleDateString()} • Objetivos de vida saludable y hábitos inteligentes.</p>
          
          ${categories.map(cat => {
            const catItems = itemsByAisle[cat] || [];
            if (catItems.length === 0) return "";
            return `
              <div class="aisle-title">${cat}</div>
              <ul>
                ${catItems.map((item: any) => `
                  <li>
                    <span class="checkbox"></span>
                    <span>${item.name}</span>
                  </li>
                `).join("")}
              </ul>
            `;
          }).join("")}

          <div class="cost">Costo Aproximado: $${activeList.estimatedCost} MXN / USD (según canasta básica)</div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(contentHtml);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="shopping-planner-main">
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onViewChange("dashboard")}
          className="p-1 px-3 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 transition-colors"
          id="planner-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-xs font-mono font-bold text-slate-500">Planificador de Compras</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
            <span>Planificador de Compras</span>
          </h2>
          <p className="text-sm text-slate-500">
            Genera automáticamente listas de despensa semanales, sanas, con estimación de costos y exportables a hojas imprimibles.
          </p>
        </div>
        {!isPremium && (
          <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Módulo Premium</span>
          </span>
        )}
      </div>

      {!isPremium ? (
        // Playful paywall layout
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-8 text-center space-y-4 max-w-lg mx-auto">
          <ShoppingCart className="mx-auto h-12 w-12 text-emerald-500 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800">Cesta de Alimentos Seguros</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Evita improvisar en el súper. Obtén tu lista clasificada de pechugas, leches deslactosadas, frutas ricas en papaína y chía prebiótica de forma semanal según tu patología elegida, desglosando costos de canasta básica y exportando a PDF.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onViewChange("premium")}
              className="rounded-xl bg-amber-400 hover:bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-teal-950 transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto"
              id="planner-paywall-upgrade-btn"
            >
              <Sparkles className="h-4 w-4" />
              <span>Desbloquear Planificador</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* List catalog selection */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <button
                onClick={handleGenerateList}
                disabled={generating}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-xs font-extrabold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                id="generate-shopping-list-btn"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Calculando porciones...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5" />
                    <span>Generar Lista Semanal</span>
                  </>
                )}
              </button>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Listas generadas</h4>
                {lists.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2 italic text-center">No posees listas en esta campaña.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {lists.map((l) => (
                      <div 
                        key={l.id} 
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          activeList?.id === l.id ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                        }`}
                        onClick={() => setActiveList(l)}
                      >
                        <div className="flex items-center gap-2">
                          <ListChecks className={`h-4.5 w-4.5 ${activeList?.id === l.id ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className="text-xs font-bold text-slate-700">
                            {new Date(l.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (l.id) handleDeleteList(l.id);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Item Adder form */}
            {activeList && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-50 pb-2">Añadir Ingrediente Extra</h3>
                
                <form onSubmit={handleAddItem} className="space-y-3" id="shopping-add-item-form">
                  <div>
                    <input
                      type="text"
                      placeholder="Ej. Zanahoria Baby, Pan Gluten Free"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="block w-full rounded-xl border border-slate-250 bg-slate-50 px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Añadir a la Fila
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* List Active Viewer */}
          <div className="md:col-span-2">
            {activeList ? (
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
                
                {/* Header list block */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Generada el {new Date(activeList.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mt-0.5">Caja de Alimentos Seguros</h3>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={downloadPrintablePDF}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Imprimir / PDF</span>
                    </button>
                  </div>
                </div>

                {/* Estimate Cost indicator */}
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">Costo Estimado de Despensa</h4>
                      <p className="text-[10px] text-emerald-600 leading-none">Valores según canastas básicas de consumo tibio.</p>
                    </div>
                  </div>
                  <span className="text-lg font-extrabold text-emerald-700">
                    ${activeList.estimatedCost} MXN
                  </span>
                </div>

                {/* Categories blocks layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((cat) => {
                    const groupItems = activeList.items.filter((item) => item.category === cat);
                    if (groupItems.length === 0) return null;

                    return (
                      <div key={cat} className="space-y-2.5">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1 flex items-center justify-between">
                          <span>{cat}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5 font-semibold">
                            {groupItems.length}
                          </span>
                        </h4>

                        <div className="space-y-2">
                          {activeList.items.map((item, index) => {
                            if (item.category !== cat) return null;
                            return (
                              <label
                                key={index}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                                  item.checked 
                                    ? "bg-slate-50/50 border-slate-150/50 text-slate-400 line-through" 
                                    : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700 font-medium"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => handleToggleCheck(index)}
                                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0 transition"
                                />
                                <span className="text-xs leading-snug">{item.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeList.items.every(i => i.checked) && (
                  <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 text-center text-teal-800 flex flex-col justify-center items-center gap-1">
                    <CheckSquare className="h-6 w-6 text-teal-600 animate-bounce" />
                    <h4 className="text-xs font-bold">¡Despensa completada con éxito!</h4>
                    <p className="text-[10px] text-teal-600">Has adquirido todas las verduras y proteínas indicadas.</p>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                <ShoppingCart className="h-12 w-12 text-slate-350 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 mt-3">Visualizador de Líneas vacío</h3>
                <p className="text-xs max-w-sm mx-auto mt-1">Haz clic en "Generar Lista Semanal" para extraer los alimentos, cereales sin gluten y carnes tiernas que estructurarán tus platos de la semana.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
