import React, { useState } from "react";
import { UserProfile, Recipe } from "../types";
import { Search, Utensils, Flame, Sparkles, Filter, Plus, ArrowRight, HeartPulse, RefreshCcw, BookOpen, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RecipesProps {
  user: UserProfile;
  initialRecipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => Promise<void>;
  onDeleteRecipe?: (recipeId: string) => Promise<void>;
  onViewChange: (view: string) => void;
}

export default function RecipesList({
  user,
  initialRecipes,
  onSaveRecipe,
  onDeleteRecipe,
  onViewChange
}: RecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);

  // Creative states to ask Gemini for a custom recipe based on ingredients
  const [generating, setGenerating] = useState(false);
  const [filterIngredients, setFilterIngredients] = useState("");
  const [customRecipeResult, setCustomRecipeResult] = useState<Recipe | null>(null);
  const [creationTab, setCreationTab] = useState(false);

  const categories = [
    { id: "all", label: "Todas" },
    { id: "gastritis", label: "Gastritis y Reflujo" },
    { id: "colon_irritable", label: "Colon Irritable SII" },
    { id: "bloating", label: "Desinflamantes" },
    { id: "weight_loss", label: "Pérdida de Peso Amigable" },
    { id: "deportistas", label: "Deportistas Alto Rendimiento 🏋️‍♂️" }
  ];

  const handleGenerateCustomRecipe = async () => {
    setGenerating(true);
    setCustomRecipeResult(null);
    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory === "all" ? "colon_irritable" : selectedCategory,
          filterIngredients: filterIngredients
        })
      });

      const data = await response.json();
      if (data.recipe) {
        setCustomRecipeResult(data.recipe);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCustomRecipeToCatalog = async () => {
    if (!customRecipeResult) return;
    try {
      await onSaveRecipe(customRecipeResult);
      // Append to list State
      setRecipes((prev) => [customRecipeResult, ...prev]);
      setCustomRecipeResult(null);
      setCreationTab(false);
      setFilterIngredients("");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "gastritis": return "Gastritis y Reflujo";
      case "colon_irritable": return "Colon Irritable SII";
      case "bloating": return "Desinflamante";
      case "weight_loss": return "Pérdida de Peso";
      case "deportistas": return "Deportista Alto Rendimiento 🏋️‍♂️";
      default: return "Saludable";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="recipes-list-viewport">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Recetas Gastroprotectores AI</h2>
          <p className="text-slate-500 text-sm mt-1">
            Platillos clínicos balanceados y bajos en irritantes estomacales. Busca por condición o pide una recomendación personalizada a la IA.
          </p>
        </div>

        <button
          id="toggle-creation-tab-btn"
          onClick={() => setCreationTab(!creationTab)}
          className="flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 border border-emerald-600/10 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          <span>{creationTab ? "Explorar Recetario" : "Pedir Receta con IA"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {creationTab ? (
          
          /* Custom AI Prompt block */
          <motion.div
            key="creation-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-6 space-y-6"
            id="ai-recipe-creator-section"
          >
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <span>Generador Clínico de Recetas Personales</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Nuestra Inteligencia Artificial creará una receta saludable y adaptada para tu estómago. Indícale qué ingredientes tienes en el refrigerador o cuáles te caen mal para omitirlos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-bold">Tipo de Condición Digestiva</label>
                <select
                  id="recipe-category-select"
                  value={selectedCategory === "all" ? "colon_irritable" : selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-sm"
                >
                  <option value="gastritis">Gastritis y Acidez Estomacal</option>
                  <option value="colon_irritable">Síndrome de Colon Irritable (SII)</option>
                  <option value="bloating">Hinchazón, Gases y Distensión</option>
                  <option value="weight_loss">Pérdida de Peso Saludable</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-bold">¿Omitir o Añadir Ingredientes? (Separados por coma)</label>
                <input
                  id="ingredients-filter-input"
                  type="text"
                  placeholder="Ej. Omitir tomate, añadir papaya, jengibre, etc."
                  value={filterIngredients}
                  onChange={(e) => setFilterIngredients(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-sm"
                />
              </div>
            </div>

            <button
              id="generate-custom-recipe-btn"
              onClick={handleGenerateCustomRecipe}
              disabled={generating}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 px-6 text-sm font-bold text-white shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  <span>Cocinando Receta Especial con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generar Mi Receta Gastroprotectora</span>
                </>
              )}
            </button>

            {/* Generated Recipe box outcomes */}
            {customRecipeResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6"
                id="generated-recipe-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-rose-50/50">
                  <div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold py-0.5 px-2.5 rounded-full uppercase">Receta Generada</span>
                    <h4 className="text-xl font-bold text-slate-800 mt-2">{customRecipeResult.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Categoría: {getCategoryLabel(customRecipeResult.category)}</p>
                  </div>
                  
                  <div className="rounded-xl bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 flex items-center space-x-1 shrink-0">
                    <Flame className="h-4 w-4" />
                    <span>{customRecipeResult.calories} kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Ingredients list */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-bold text-slate-800">Ingredientes necesarios:</h5>
                    <ul className="space-y-2">
                      {customRecipeResult.ingredients.map((ing, k) => (
                        <li key={k} className="text-xs text-slate-600 flex items-start space-x-2">
                          <span className="text-emerald-500">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preparation steps */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-bold text-slate-800">Pasos de Elaboración:</h5>
                    <ol className="space-y-2.5">
                      {customRecipeResult.preparation.map((step, s) => (
                        <li key={s} className="text-xs text-slate-600 flex items-start space-x-2">
                          <strong className="text-emerald-500 text-xs mt-0.5 shrink-0">{s + 1}.</strong>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                </div>

                {/* Gut safe benefits list */}
                <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-100 space-y-2">
                  <h5 className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                    <HeartPulse className="h-4 w-4" />
                    <span>Propiedades Gastroprotectoras (AI Clinicians)</span>
                  </h5>
                  <ul className="space-y-1">
                    {customRecipeResult.benefits?.map((ben, b) => (
                      <li key={b} className="text-xs text-slate-500 flex items-start space-x-1.5">
                        <span className="text-emerald-650">•</span>
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confirm Save trigger buttons */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    id="save-recipe-to-catalog-btn"
                    onClick={handleSaveCustomRecipeToCatalog}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
                  >
                    Guardar en Mi Catálogo
                  </button>
                  <button
                    id="discard-custom-recipe-btn"
                    onClick={() => {
                      setCustomRecipeResult(null);
                      setFilterIngredients("");
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Omitir Receta
                  </button>
                </div>

              </motion.div>
            )}

          </motion.div>
        ) : (
          
          /* Recipes browser cards */
          <motion.div
            key="browse-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Filter tags bar & Search Box */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    id={`filter-recipe-btn-${cat.id}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      selectedCategory === cat.id 
                        ? "bg-slate-800 text-white shadow-sm" 
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search input bar */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="recipe-search-input"
                  type="text"
                  placeholder="Buscar avena, caldo de verduras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

            </div>

            {/* List layout of food cards */}
            {filteredRecipes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <Utensils className="mx-auto h-10 w-10 text-slate-350" />
                <p className="mt-2 text-sm font-semibold text-slate-600">No se encontraron recetas</p>
                <p className="text-xs text-slate-400 mt-1">Prueba seleccionando otra categoría o ingresa otro término de búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {filteredRecipes.map((recipe, index) => {
                  const isActive = activeRecipeId === recipe.id;
                  return (
                    <div
                      key={recipe.id || index}
                      id={`recipe-card-${index}`}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="rounded-full bg-emerald-50/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                            {getCategoryLabel(recipe.category)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-orange-600 font-semibold flex items-center space-x-1">
                              <Flame className="h-3.5 w-3.5" />
                              <span>{recipe.calories} kcal</span>
                            </span>
                            <button
                              type="button"
                              id={`delete-recipe-btn-${recipe.id || index}`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("¿Estás seguro de que deseas eliminar esta receta?")) {
                                  if (onDeleteRecipe && recipe.id) {
                                    await onDeleteRecipe(recipe.id);
                                  }
                                  setRecipes(prev => prev.filter(r => r.id !== recipe.id));
                                }
                              }}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                              title="Eliminar receta"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-base font-bold text-slate-800">{recipe.title}</h4>
                        
                        {/* Short previews of ingredients list */}
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          Ingredientes: {recipe.ingredients.join(", ")}
                        </p>

                        {/* Collapsible Steps list details */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-4 pt-4 border-t border-slate-50 space-y-4"
                            >
                              <div className="space-y-1.5">
                                <h5 className="text-xs font-bold text-slate-700 uppercase font-mono">Detalle de Ingredientes:</h5>
                                <ul className="space-y-1 pl-3 list-disc text-xs text-slate-600">
                                  {recipe.ingredients.map((ing, iIdx) => (
                                    <li key={iIdx}>{ing}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-1.5">
                                <h5 className="text-xs font-bold text-slate-700 uppercase font-mono">Instrucciones de Preparación:</h5>
                                <ol className="space-y-2 pl-3 list-decimal text-xs text-slate-600">
                                  {recipe.preparation.map((step, sIdx) => (
                                    <li key={sIdx}>{step}</li>
                                  ))}
                                </ol>
                              </div>

                              {recipe.benefits && recipe.benefits.length > 0 && (
                                <div className="rounded-xl bg-emerald-50/40 p-3 text-[11px] text-slate-500 leading-relaxed border border-emerald-100">
                                  <strong>¿Por qué cuida tu estómago?</strong>: {recipe.benefits[0]}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>

                      <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between">
                        <button
                          id={`recipe-details-toggle-${index}`}
                          onClick={() => setActiveRecipeId(isActive ? null : (recipe.id || String(index)))}
                          className="text-xs font-bold text-slate-600 hover:text-emerald-700 underline"
                        >
                          {isActive ? "Ocultar Pasos de Preparación" : "Ver Pasos de Preparación..."}
                        </button>

                        <div className="flex items-center text-[10px] text-slate-400 font-mono space-x-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Ingreso Ficha</span>
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </motion.div>

        )}
      </AnimatePresence>

    </div>
  );
}
