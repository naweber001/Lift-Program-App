import React, { useState } from 'react';
import { C } from '../theme.js';
import { getInp } from './UI.jsx';
import { Plus, X, ChevDown, ArrowUp, ArrowDown, StarIco, NutritionIco } from './Icons.jsx';

export function DayNutrition({ dateKey, nutrition, nutritionFavs, macroGoals, dispatch }) {
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [showFavs, setShowFavs] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showNewMeal, setShowNewMeal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [confirmDeleteMeal, setConfirmDeleteMeal] = useState(null);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [fName, setFName] = useState("");
  const [fQty, setFQty] = useState("1");
  const [fPro, setFPro] = useState("");
  const [fCarb, setFCarb] = useState("");
  const [fFat, setFFat] = useState("");

  const meals = nutrition[dateKey]?.meals || [];
  const goals = macroGoals || { calories: 2500, protein: 180, carbs: 250, fat: 80 };
  const favs = nutritionFavs || [];

  // Day totals across all meals
  const totals = meals.reduce((acc, meal) => {
    (meal.items || []).forEach(item => {
      acc.calories += parseFloat(item.calories) || 0;
      acc.protein += parseFloat(item.protein) || 0;
      acc.carbs += parseFloat(item.carbs) || 0;
      acc.fat += parseFloat(item.fat) || 0;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const calcCal = () => {
    const q = parseFloat(fQty) || 1;
    return ((parseFloat(fPro)||0) * 4 + (parseFloat(fCarb)||0) * 4 + (parseFloat(fFat)||0) * 9) * q;
  };
  const clearForm = () => { setFName(""); setFQty("1"); setFPro(""); setFCarb(""); setFFat(""); setEditingItem(null); };

  const submitFood = (mealId) => {
    if (!fName.trim() && !fPro && !fCarb && !fFat) return;
    const q = parseFloat(fQty) || 1;
    const pro = String(Math.round((parseFloat(fPro)||0) * q));
    const carb = String(Math.round((parseFloat(fCarb)||0) * q));
    const fat = String(Math.round((parseFloat(fFat)||0) * q));
    const cal = (parseFloat(pro)||0) * 4 + (parseFloat(carb)||0) * 4 + (parseFloat(fat)||0) * 9;
    const displayName = q !== 1 ? `${fName.trim() || "Food"} (×${q})` : (fName.trim() || "Food");
    if (editingItem && editingItem.mealId === mealId) {
      dispatch({ type: "EDIT_FOOD_ITEM", payload: { dateKey, mealId, itemId: editingItem.itemId, updated: { name: displayName, calories: cal, protein: pro, carbs: carb, fat: fat } } });
    } else {
      dispatch({ type: "ADD_FOOD_ITEM", payload: { dateKey, mealId, item: { name: displayName, calories: cal, protein: pro, carbs: carb, fat: fat } } });
    }
    clearForm();
    setAddingTo(null);
  };

  const startEditItem = (mealId, item) => {
    setFName(item.name || ""); setFQty("1"); setFPro(item.protein || ""); setFCarb(item.carbs || ""); setFFat(item.fat || "");
    setEditingItem({ mealId, itemId: item.id });
    setAddingTo(mealId);
    setShowFavs(null);
  };

  const addFromFav = (mealId, fav) => {
    const cal = (parseFloat(fav.protein)||0) * 4 + (parseFloat(fav.carbs)||0) * 4 + (parseFloat(fav.fat)||0) * 9;
    dispatch({ type: "ADD_FOOD_ITEM", payload: { dateKey, mealId, item: { ...fav, calories: cal } } });
  };

  const saveAsFav = () => {
    if (!fName.trim()) return;
    // Save the per-unit macros (not multiplied) so favs are reusable
    dispatch({ type: "ADD_NUTRITION_FAV", payload: { name: fName.trim(), calories: ((parseFloat(fPro)||0)*4 + (parseFloat(fCarb)||0)*4 + (parseFloat(fFat)||0)*9), protein: fPro, carbs: fCarb, fat: fFat } });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  };

  // Autocomplete suggestions from favorites based on food name input
  const suggestions = fName.trim().length >= 2
    ? favs.filter(f => f.name.toLowerCase().includes(fName.toLowerCase()) && f.name.toLowerCase() !== fName.toLowerCase()).slice(0, 4)
    : [];

  const pickSuggestion = (fav) => {
    setFName(fav.name);
    setFQty("1");
    setFPro(fav.protein || "");
    setFCarb(fav.carbs || "");
    setFFat(fav.fat || "");
  };

  const addNewMeal = () => {
    if (!newMealName.trim()) return;
    dispatch({ type: "ADD_MEAL", payload: { dateKey, mealName: newMealName.trim() } });
    setNewMealName("");
    setShowNewMeal(false);
  };

  // Mini progress bar
  const MiniBar = ({ current, goal, color }) => {
    const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    return (
      <div style={{ flex: 1 }}>
        <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: current > goal ? "#ef4444" : color, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2, textAlign: "center" }}>{Math.round(current)}/{goal}</div>
      </div>
    );
  };

  // Meal totals
  const mealTotals = (meal) => (meal.items || []).reduce((acc, i) => ({
    calories: acc.calories + (parseFloat(i.calories) || 0),
    protein: acc.protein + (parseFloat(i.protein) || 0),
    carbs: acc.carbs + (parseFloat(i.carbs) || 0),
    fat: acc.fat + (parseFloat(i.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div>
      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, marginBottom: 8 }} />

      {/* Collapsible header */}
      <button onClick={() => setNutritionOpen(!nutritionOpen)} style={{
        width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "8px 12px", cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: "#22c55e" }}><NutritionIco /></span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nutrition</span>
        <div style={{ flex: 1, display: "flex", gap: 4, marginLeft: 4 }}>
          {[
            { label: "cal", current: totals.calories, goal: goals.calories, color: C.accent },
            { label: "p", current: totals.protein, goal: goals.protein, color: "#22c55e" },
            { label: "c", current: totals.carbs, goal: goals.carbs, color: "#eab308" },
            { label: "f", current: totals.fat, goal: goals.fat, color: "#f97316" },
          ].map(({ label, current, goal, color }) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: C.textMuted, marginBottom: 2 }}>{label}</div>
              <MiniBar current={current} goal={goal} color={color} />
            </div>
          ))}
        </div>
        <ChevDown open={nutritionOpen} />
      </button>

      {/* Collapsible content */}
      {nutritionOpen && (
      <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        {meals.map((meal, mi) => {
          const mt = mealTotals(meal);
          const isOpen = expandedMeal === meal.id;
          const itemCount = (meal.items || []).length;
          return (
            <div key={meal.id} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {/* Meal header */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {meals.length > 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 4px", flexShrink: 0 }}>
                    <button onClick={() => dispatch({ type: "MOVE_MEAL", payload: { dateKey, mealId: meal.id, direction: -1 } })} disabled={mi === 0} style={{ background: "none", border: "none", cursor: "pointer", padding: "1px 2px", color: C.textMuted, opacity: mi === 0 ? 0.3 : 1 }}><ArrowUp s={8}/></button>
                    <button onClick={() => dispatch({ type: "MOVE_MEAL", payload: { dateKey, mealId: meal.id, direction: 1 } })} disabled={mi === meals.length - 1} style={{ background: "none", border: "none", cursor: "pointer", padding: "1px 2px", color: C.textMuted, opacity: mi === meals.length - 1 ? 0.3 : 1 }}><ArrowDown s={8}/></button>
                  </div>
                )}
                <button onClick={() => setExpandedMeal(isOpen ? null : meal.id)} style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  padding: "8px 8px 8px 6px", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{meal.name}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{itemCount} item{itemCount !== 1 ? "s" : ""} · {Math.round(mt.calories)} cal · {Math.round(mt.protein)}p</div>
                  </div>
                  <ChevDown open={isOpen}/>
                </button>
                {confirmDeleteMeal === meal.id ? (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0, padding: "4px" }}>
                    <button onClick={(e) => { e.stopPropagation(); dispatch({ type: "DELETE_MEAL", payload: { dateKey, mealId: meal.id } }); setConfirmDeleteMeal(null); }} style={{ background: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", padding: "6px 10px", fontSize: 10, fontWeight: 700, fontFamily: "inherit" }}>Delete</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteMeal(null); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", color: C.textMuted, padding: "6px 8px", fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteMeal(meal.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "10px", flexShrink: 0, minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}><X s={14}/></button>
                )}
              </div>

              {/* Expanded: food items */}
              {isOpen && (
                <div style={{ padding: "0 8px 8px", borderTop: `1px solid ${C.border}` }}>
                  {(meal.items || []).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
                      {(meal.items || []).map((item, ii) => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 4, background: editingItem?.itemId === item.id ? C.accentDim : C.card, borderRadius: 6, padding: "5px 6px", border: `1px solid ${editingItem?.itemId === item.id ? C.accent : C.border}` }}>
                          {(meal.items || []).length > 1 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
                              <button onClick={() => dispatch({ type: "MOVE_FOOD_ITEM", payload: { dateKey, mealId: meal.id, itemId: item.id, direction: -1 } })} disabled={ii === 0} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: C.textMuted, opacity: ii === 0 ? 0.3 : 1 }}><ArrowUp s={7}/></button>
                              <button onClick={() => dispatch({ type: "MOVE_FOOD_ITEM", payload: { dateKey, mealId: meal.id, itemId: item.id, direction: 1 } })} disabled={ii === (meal.items||[]).length - 1} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: C.textMuted, opacity: ii === (meal.items||[]).length - 1 ? 0.3 : 1 }}><ArrowDown s={7}/></button>
                            </div>
                          )}
                          <button onClick={() => startEditItem(meal.id, item)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", padding: 0, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                            <div style={{ fontSize: 9, color: C.textMuted }}>{Math.round(item.calories || 0)} cal · {item.protein || 0}p · {item.carbs || 0}c · {item.fat || 0}f</div>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); dispatch({ type: "DELETE_FOOD_ITEM", payload: { dateKey, mealId: meal.id, itemId: item.id } }); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 6, flexShrink: 0, minWidth: 28, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><X s={12}/></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add food / Favs buttons */}
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    <button onClick={() => { if (addingTo === meal.id && !editingItem) { setAddingTo(null); } else { clearForm(); setAddingTo(meal.id); } setShowFavs(null); }} style={{
                      flex: 1, padding: "6px 0", borderRadius: 6, border: `1px dashed ${C.border}`, background: addingTo === meal.id ? C.accentDim : "transparent",
                      color: addingTo === meal.id ? C.accent : C.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                    }}>{editingItem?.mealId === meal.id ? <><X s={8}/> Cancel</> : <><Plus s={8}/> Food</>}</button>
                    {favs.length > 0 && (
                      <button onClick={() => { setShowFavs(showFavs === meal.id ? null : meal.id); setAddingTo(null); clearForm(); }} style={{
                        padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: showFavs === meal.id ? C.accentDim : "transparent",
                        color: showFavs === meal.id ? C.accent : C.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 3,
                      }}><StarIco filled={true} s={8}/> Favs</button>
                    )}
                  </div>

                  {/* Add food form */}
                  {addingTo === meal.id && (
                    <div style={{ background: C.card, borderRadius: 8, padding: "8px", border: `1px solid ${C.border}`, marginTop: 6 }}>
                      <input style={{ ...getInp(), width: "100%", fontSize: 12, padding: "7px 9px", marginBottom: suggestions.length > 0 ? 0 : 5 }} placeholder="Food name" value={fName} onChange={e => setFName(e.target.value)} />
                      {/* Autocomplete suggestions */}
                      {suggestions.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "4px 0 5px" }}>
                          {suggestions.map((fav, si) => (
                            <button key={si} onClick={() => pickSuggestion(fav)} style={{
                              padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface,
                              cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, color: C.accent,
                            }}>{fav.name}</button>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, flexShrink: 0 }}>Qty</span>
                        <input style={{ ...getInp(), width: 44, fontSize: 12, padding: "7px", textAlign: "center" }} inputMode="decimal" value={fQty} onChange={e => setFQty(e.target.value)} />
                        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                          <input style={{ ...getInp(), fontSize: 12, padding: "7px" }} placeholder="Protein" inputMode="numeric" value={fPro} onChange={e => setFPro(e.target.value)} />
                          <input style={{ ...getInp(), fontSize: 12, padding: "7px" }} placeholder="Carbs" inputMode="numeric" value={fCarb} onChange={e => setFCarb(e.target.value)} />
                          <input style={{ ...getInp(), fontSize: 12, padding: "7px" }} placeholder="Fat" inputMode="numeric" value={fFat} onChange={e => setFFat(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 4, textAlign: "center" }}>
                        {parseFloat(fQty) > 1 ? `${parseFloat(fQty)} × (${Math.round(((parseFloat(fPro)||0)*4+(parseFloat(fCarb)||0)*4+(parseFloat(fFat)||0)*9))} cal) = ` : "= "}{Math.round(calcCal())} cal
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => submitFood(meal.id)} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{editingItem ? "Save" : "Add"}</button>
                        {!editingItem && <button onClick={saveAsFav} style={{
                          padding: "7px 8px", borderRadius: 6, border: `1px solid ${saveFeedback ? "#22c55e" : C.border}`,
                          background: saveFeedback ? "#22c55e20" : "transparent",
                          color: saveFeedback ? "#22c55e" : "#eab308",
                          fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 2, transition: "all 0.2s",
                        }}><StarIco filled={saveFeedback} s={8}/> {saveFeedback ? "Saved!" : "Fav"}</button>}
                      </div>
                    </div>
                  )}

                  {/* Favorites for this meal */}
                  {showFavs === meal.id && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
                      {favs.map((fav, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <button onClick={() => addFromFav(meal.id, fav)} style={{ flex: 1, background: C.card, borderRadius: 6, padding: "5px 7px", border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", textAlign: "left" }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: C.text }}>{fav.name}</span>
                            <span style={{ fontSize: 9, color: C.textMuted }}>{fav.calories} cal</span>
                          </button>
                          <button onClick={() => dispatch({ type: "DELETE_NUTRITION_FAV", payload: i })} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 1 }}><X s={8}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new meal group */}
      {showNewMeal ? (
        <div style={{ display: "flex", gap: 4 }}>
          <input style={{ ...getInp(), flex: 1, fontSize: 12, padding: "8px 10px" }} placeholder="Meal name (e.g. Breakfast)" value={newMealName} onChange={e => setNewMealName(e.target.value)} onKeyDown={e => e.key === "Enter" && addNewMeal()} autoFocus />
          <button onClick={addNewMeal} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
          <button onClick={() => { setShowNewMeal(false); setNewMealName(""); }} style={{ padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer" }}><X s={10}/></button>
        </div>
      ) : (
        <button onClick={() => setShowNewMeal(true)} style={{
          width: "100%", padding: "8px 0", borderRadius: 8, border: `1px dashed ${C.border}`, background: "transparent",
          color: C.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}><Plus s={10}/> Add Meal</button>
      )}
      </div>
      )}
    </div>
  );
}
