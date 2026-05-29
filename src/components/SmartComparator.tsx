import React, { useState, useEffect } from "react";
import { UserProfile, ProductComparison } from "../types";
import { 
  Barcode, ShoppingBag, Sparkles, AlertCircle, ShoppingCart, Tag, Search, 
  Loader2, RefreshCw, Star, Percent, ChevronRight, HelpCircle, ArrowLeftRight
} from "lucide-react";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

interface SmartComparatorProps {
  user: UserProfile;
  onViewChange: (view: string) => void;
}

export default function SmartComparator({
  user,
  onViewChange
}: SmartComparatorProps) {
  const isPremium = user.subscriptionStatus === "premium";

  // State
  const [comparisons, setComparisons] = useState<ProductComparison[]>([]);
  const [activeTab, setActiveTab] = useState<"comparator" | "alerts" | "brands">("comparator");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResult, setSearchResult] = useState<any[] | null>(null);

  // Load comparisons simulation
  useEffect(() => {
    // Settle starter simulations
    const local = localStorage.getItem(`product_comparisons_${user.uid}`);
    if (local) {
      setComparisons(JSON.parse(local));
    }
  }, [user.uid]);

  const handleProductSearch = () => {
    if (!searchQuery) return;
    setLoadingSearch(true);
    setSearchResult(null);

    // Simulated price comparison database query
    setTimeout(() => {
      let options: any[] = [];
      const queryLower = searchQuery.toLowerCase();

      if (queryLower.includes("prote") || queryLower.includes("suple") || queryLower.includes("isopure") || queryLower.includes("whey")) {
        options = [
          { name: "Proteína Whey Aislada Oro (900g)", store: "Premium Market", price: 42.99, rating: "4.8", stock: "En Stock", voucher: "-10% con VITA10" },
          { name: "Proteína Whey Aislada Oro (900g)", store: "FarmaSalud", price: 39.50, rating: "4.9", stock: "Últimas unidades", discount: "¡Mejor Precio!", voucher: "Entrega gratis" },
          { name: "Proteína Whey Aislada Oro (900g)", store: "Súper Descuentos", price: 45.00, rating: "4.5", stock: "Agotado temporalmente" }
        ];
      } else if (queryLower.includes("probio") || queryLower.includes("enzim") || queryLower.includes("gastri")) {
        options = [
          { name: "Probióticos Digestivos 50 Billones CFU (60 cápsulas)", store: "FarmaSalud", price: 18.90, rating: "4.9", stock: "En Stock", discount: "¡Mejor Precio!", voucher: "-15% con VITACLASS" },
          { name: "Probióticos Digestivos 50 Billones CFU (60 cápsulas)", store: "Premium Market", price: 22.50, rating: "4.7", stock: "En Stock" },
          { name: "Probióticos Digestivos 50 Billones CFU (60 cápsulas)", store: "Naturista Express", price: 19.99, rating: "4.6", stock: "En Stock" }
        ];
      } else if (queryLower.includes("aceite") || queryLower.includes("coco") || queryLower.includes("oliva")) {
        options = [
          { name: "Aceite de Coco Orgánico Prensado Frío (500ml)", store: "Súper Descuentos", price: 8.50, rating: "4.7", stock: "En Stock", discount: "¡Mejor Precio!" },
          { name: "Aceite de Coco Orgánico Prensado Frío (500ml)", store: "Naturista Express", price: 9.99, rating: "4.8", stock: "En Stock", voucher: "Envío gratis" },
          { name: "Aceite de Coco Orgánico Prensado Frío (500ml)", store: "Premium Market", price: 11.20, rating: "4.9", stock: "En Stock" }
        ];
      } else {
        // Generic fallback comparator matching common recipe ingredients
        options = [
          { name: `${searchQuery} (Ingrediente Clínico Sugerido)`, store: "Súper Descuentos", price: 5.99, rating: "4.6", stock: "En Stock", discount: "¡Mejor Precio!" },
          { name: `${searchQuery} (Ingrediente Clínico Sugerido)`, store: "FarmaSalud", price: 6.50, rating: "4.8", stock: "En Stock" },
          { name: `${searchQuery} (Ingrediente Clínico Sugerido)`, store: "Premium Market", price: 7.20, rating: "4.9", stock: "En Stock", voucher: "Cupón VITACOACH" }
        ];
      }

      setSearchResult(options);
      setLoadingSearch(false);

      // Register comparison transaction log
      const newComparison: ProductComparison = {
        id: Math.random().toString(36).substring(7),
        userId: user.uid,
        productQuery: searchQuery,
        bestPriceStore: options[1]?.store || options[0]?.store,
        competitorPricesJson: JSON.stringify(options),
        createdAt: new Date().toISOString()
      };

      const updated = [newComparison, ...comparisons];
      setComparisons(updated);
      localStorage.setItem(`product_comparisons_${user.uid}`, JSON.stringify(updated));

      // Firebase saving
      try {
        setDoc(doc(collection(db, "product_comparisons")), newComparison);
      } catch (e) {
        console.warn(e);
      }

    }, 800);
  };

  // Automated discounts alerts array simulation
  const discountAlerts = [
    { targetItem: "Quinoa Orgánica Hidratos de Carbono", prevPrice: "$4.50", currentPrice: "$3.20", store: "Súper Descuentos", dealRating: "🔥 28% de Ahorro", keyIngredient: "Pollo con Quinoa" },
    { targetItem: "Enzimas Digestivas de Amplio Espectro (90 Caps)", prevPrice: "$32.00", currentPrice: "$24.99", store: "FarmaSalud", dealRating: "⭐ Súper Oferta", keyIngredient: "Cuidado diario de colon" },
    { targetItem: "Copos de Avena Integral sin Gluten (1kg)", prevPrice: "$6.90", currentPrice: "$5.10", store: "Naturista Express", dealRating: "🔥 26% de Ahorro", keyIngredient: "Desayuno Avena Coach" }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="smartcomparator-viewport">
      
      {/* Banner design */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 bg-teal-600 p-6 text-white flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest bg-emerald-500/40 px-2.5 py-1 rounded-full text-emerald-50 font-extrabold">Comparador Inteligente</span>
          <h2 className="text-xl font-bold flex items-center gap-2 mt-1">
            <ArrowLeftRight className="h-5.5 w-5.5 text-teal-105 animate-pulse" />
            <span>VitaMarket Comparador</span>
          </h2>
          <p className="text-xs text-teal-50 mt-1">Busca vitaminas, suplementos deportivos, proteínas o ingredientes y localiza el mejor precio de tu zona.</p>
        </div>
        <button
          onClick={() => onViewChange("dashboard")}
          className="rounded-xl bg-white/20 hover:bg-white/30 border border-white/10 text-xs font-bold py-1.5 px-3 block transition-all"
        >
          Volver
        </button>
      </div>

      {!isPremium ? (
        <div className="rounded-2xl border border-teal-100 bg-emerald-50/10 p-8 text-center space-y-4 max-w-md mx-auto">
          <ShoppingBag className="mx-auto h-12 w-12 text-teal-600 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-800">Súbete al Comparador de Precios</h3>
          <p className="text-xs text-slate-505 text-slate-500 leading-relaxed">
            Consigue alertas inteligentes automáticas sobre tu lista de la compra, compara proteínas y probióticos de marcas líderes del mercado y obtén cupones exclusivos.
          </p>
          <button
            onClick={() => onViewChange("premium")}
            className="rounded-xl bg-slate-900 text-white font-bold text-xs py-2.5 px-6 hover:bg-slate-800 transition-all shadow"
          >
            Upgrade Premium ⚡
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tabs navigation list */}
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest pl-1">Ecosistema Market</span>
              
              <button
                onClick={() => setActiveTab("comparator")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "comparator" ? "bg-teal-600 border-teal-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Comparar Suplemento / Alimento</span>
                <Search className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "alerts" ? "bg-teal-600 border-teal-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Alertas de Descuentos Activos</span>
                <Percent className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("brands")}
                className={`w-full rounded-lg text-left px-3 py-2 text-xs font-bold flex items-center justify-between border transition-all ${
                  activeTab === "brands" ? "bg-teal-600 border-teal-600 text-white shadow" : "border-transparent text-slate-650 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Marcas Clínicas Aliadas</span>
                <Tag className="h-4 w-4" />
              </button>
            </div>

            {/* Quick explanation tag */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-[11px] text-slate-400 leading-normal">
              🥥 <strong>Eficiencia de Gasto:</strong> El usuario promedio de VitaMarket ahorra un 24% mensual en su carrito de compras de bienestar gastrointestinal al sincronizar precios locales.
            </div>
          </div>

          {/* Core view section columns */}
          <div className="md:col-span-2 space-y-6">
            
            {activeTab === "comparator" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Comparador de Precios de VitaMarket</h3>
                  <p className="text-xs text-slate-500">Compara proteínas Isopure, aislados de suero Whey, viales de probióticos, enzimas o cualquier ingrediente clínico (ej: aguacate, salmón, quinoa) de tu zona.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej. Proteína Isopure o Probióticos..."
                    className="flex-1 rounded-xl border border-slate-200 py-2 px-3 text-xs focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={handleProductSearch}
                    disabled={loadingSearch || !searchQuery}
                    className="bg-teal-650 bg-teal-600 text-white text-xs font-bold rounded-xl py-2 px-4 shadow hover:bg-teal-700 transition-all disabled:opacity-55"
                  >
                    Comparar
                  </button>
                </div>

                {loadingSearch && (
                  <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-650 text-teal-650 text-teal-600" />
                    <p className="text-xs text-slate-450 text-slate-405">Buscando ofertas en FarmaSalud, Premium Market y Súper Descuentos...</p>
                  </div>
                )}

                {searchResult && (
                  <div className="space-y-3 pt-3 border-t border-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Precios Encontrados para "{searchQuery}":</span>
                    
                    {searchResult.map((prod, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-150 p-4 hover:border-teal-300 transition-all shadow-xs flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-850 text-slate-800">{prod.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500">{prod.store}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">★ {prod.rating}</span>
                          </div>
                          {prod.voucher && (
                            <span className="inline-block text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              {prod.voucher}
                            </span>
                          )}
                        </div>

                        <div className="text-right space-y-1">
                          <p className="text-base font-extrabold text-slate-900">${prod.price.toFixed(2)} USD</p>
                          <span className={`text-[9px] block font-bold uppercase tracking-wider ${
                            prod.discount ? "text-emerald-600" : "text-slate-400"
                          }`}>
                            {prod.discount || prod.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Alertas de Descuentos Automáticas</h3>
                  <p className="text-xs text-slate-505 text-slate-500">Monitoreamos de forma activa las ofertas locales de los supermercados adheridos a las recetas de tu lista de la compra semanal.</p>
                </div>

                <div className="space-y-3">
                  {discountAlerts.map((deal, i) => (
                    <div key={i} className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/10 p-4 flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                            {deal.dealRating}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{deal.store}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800">{deal.targetItem}</h4>
                        <p className="text-[10px] text-slate-400">Asociado con receta: <span className="font-semibold">{deal.keyIngredient}</span></p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400 line-through">{deal.prevPrice}</p>
                        <p className="text-base font-extrabold text-emerald-600">{deal.currentPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "brands" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Vouchers de Marcas Clínicas Aliadas</h3>
                  <p className="text-xs text-slate-500">Utiliza los siguientes cupones de marcas asociadas a VitaAI para adquirir suplementos o ingredientes con envío prioritario gratis:</p>
                </div>

                <div className="space-y-3.5">
                  {[
                    { title: "🧪 FarmaSalud Premium", voucher: "VITACLASS", desc: "Obtén un 15% de descuento en el total de tu compra de viales de enzimas digestivas, probióticos orales Saccharomyces o psyllium soluble." },
                    { title: "🍦 Isopure Suplementos", voucher: "VITAISOPURE", desc: "-10% de descuento y Shaker de regalo en cualquier bote de proteína aislada de suero de leche sabor coco o vainilla de las recetas." },
                    { title: "🥥 Naturista Express", voucher: "COCONUT22", desc: "Envío express refrigerado gratuito en botes de aceite de coco orgánico prensado al frío y aguacates seleccionados para tu dieta de desinflamación." }
                  ].map((brand, bId) => (
                    <div key={bId} className="rounded-xl border border-slate-100 p-4 hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-md">
                        <h4 className="text-xs font-black text-slate-800">{brand.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{brand.desc}</p>
                      </div>

                      <div className="text-center shrink-0">
                        <div className="rounded-lg border-2 border-dashed border-teal-500 p-2 bg-teal-500/5 select-all">
                          <p className="text-[9px] uppercase font-bold text-slate-400 block">Copiar Código:</p>
                          <span className="text-xs font-bold text-teal-800 block mt-0.5">{brand.voucher}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
