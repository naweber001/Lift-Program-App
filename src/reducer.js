import { DEFAULT_PROGRAMS } from './data/defaultPrograms.js';
import { CARDIO_GROUPS, WEEK_STARTS } from './constants.js';
import { weekKey, localDateStr, weekDates, W, setWeekStart } from './dateUtils.js';

export const init = {
  programs: DEFAULT_PROGRAMS,
  schedules: {},
  workouts: {},
  currentWeek: weekKey(new Date()),
  expandedDay: null,
  modal: null,
  modalDay: null,
  tab: "workout",
  theme: "dark",
  units: "lbs",
  weekStart: "saturday",
  restDefault: 90,
  accentColor: null, // null = use default per theme
  logoChoice: "logo1",
  appTitle: "LIFE \u2013 Fitness",
  favorites: [],
  nutrition: {}, // { [dateKey]: { meals: [{ id, name, calories, protein, carbs, fat }] } }
  nutritionFavs: [], // [{ name, calories, protein, carbs, fat }]
  macroGoals: { calories: 2500, protein: 180, carbs: 250, fat: 80 },
  timerAutoStart: false,
  exerciseFavs: [], // array of exercise names
};

// Converts program exercises (index-based supersetWith) to workout exercises (id-based supersetWith)
// If prevWorkouts provided, auto-fills weights from the most recent session of each exercise
export function buildExercises(exercises, prevWorkouts) {
  // Build a lookup: exerciseName -> last logged sets (most recent first)
  const lastWeights = {};
  if (prevWorkouts) {
    const sortedDates = Object.keys(prevWorkouts).sort().reverse();
    sortedDates.forEach(dk => {
      const day = prevWorkouts[dk];
      if (!day.exercises) return;
      day.exercises.forEach(ex => {
        if (lastWeights[ex.name]) return; // already found a more recent one
        const completedSets = ex.sets?.filter(st => st.done && st.weight);
        if (completedSets && completedSets.length > 0) {
          lastWeights[ex.name] = completedSets;
        }
      });
    });
  }

  const base = Date.now();
  const exs = exercises.map((e, i) => {
    const numSets = parseInt(e.targetSets) || 3;
    const prev = lastWeights[e.name];
    const sets = Array.from({ length: numSets }, (_, si) => {
      // Auto-fill weight from previous session's corresponding set, or last set if fewer
      const prevSet = prev ? (prev[si] || prev[prev.length - 1]) : null;
      return { weight: prevSet ? prevSet.weight : "", reps: "", done: false };
    });
    return {
      id: base + i, name: e.name, muscle: e.muscle,
      targetSets: numSets, targetReps: e.targetReps || "",
      isCardio: CARDIO_GROUPS.has(e.muscle),
      sets,
      supersetWith: null,
    };
  });
  // Map index-based supersetWith to id-based
  exercises.forEach((e, i) => {
    if (e.supersetWithIdx != null && e.supersetWithIdx >= 0 && e.supersetWithIdx < exs.length) {
      exs[i].supersetWith = exs[e.supersetWithIdx].id;
    }
  });
  return exs;
}

export function reducer(s, a) {
  switch (a.type) {
    case "SET_WEEK": return { ...s, currentWeek: a.payload, expandedDay: null };
    case "TOGGLE_DAY": return { ...s, expandedDay: s.expandedDay === a.payload ? null : a.payload };
    case "OPEN_MODAL": return { ...s, modal: a.payload.modal, modalDay: a.payload.day || null };
    case "CLOSE_MODAL": return { ...s, modal: null, modalDay: null };
    case "SET_TAB": return { ...s, tab: a.payload };
    case "SET_THEME": return { ...s, theme: a.payload };
    case "SET_UNITS": {
      const newU = a.payload;
      if (newU === s.units) return s;
      // Convert all stored weights
      const convertedWorkouts = {};
      Object.entries(s.workouts).forEach(([dk, day]) => {
        if (!day.exercises || day.isRest) { convertedWorkouts[dk] = day; return; }
        convertedWorkouts[dk] = {
          ...day,
          exercises: day.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(st => {
              // Store original weight for lossless conversion
              const origWeight = st.originalWeight ?? st.weight;
              const origUnit = st.originalUnit ?? s.units;
              // Convert from original to new unit
              const fromLbs = origUnit === "lbs";
              const toLbs = newU === "lbs";
              let converted;
              if (fromLbs === toLbs) {
                converted = origWeight;
              } else {
                const w = parseFloat(origWeight);
                if (!w && w !== 0) return { ...st, originalWeight: origWeight, originalUnit: origUnit };
                if (!origWeight || origWeight === "") return { ...st, originalWeight: origWeight, originalUnit: origUnit };
                const factor = toLbs ? 2.20462 : 0.453592;
                converted = String(Math.round(w * factor * 10) / 10);
              }
              return { ...st, weight: converted, originalWeight: origWeight, originalUnit: origUnit };
            }),
          })),
        };
      });
      return { ...s, units: newU, workouts: convertedWorkouts };
    }

    case "SET_WEEK_START": {
      setWeekStart(a.payload);
      return { ...s, weekStart: a.payload, currentWeek: weekKey(new Date()) };
    }
    case "SET_REST_DEFAULT": return { ...s, restDefault: a.payload };
    case "SET_ACCENT_COLOR": return { ...s, accentColor: a.payload };
    case "SET_LOGO": return { ...s, logoChoice: a.payload };
    case "SET_APP_TITLE": return { ...s, appTitle: a.payload };
    case "TOGGLE_FAVORITE": {
      const id = a.payload;
      const favs = s.favorites || [];
      return { ...s, favorites: favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id] };
    }
    case "TOGGLE_EXERCISE_FAV": {
      const name = a.payload;
      const favs = s.exerciseFavs || [];
      return { ...s, exerciseFavs: favs.includes(name) ? favs.filter(f => f !== name) : [...favs, name] };
    }

    // Nutrition — meals are groups containing food items
    // meal structure: { id, name, items: [{ id, name, calories, protein, carbs, fat }] }
    case "ADD_MEAL": {
      const { dateKey, mealName } = a.payload;
      const dayMeals = s.nutrition[dateKey]?.meals || [];
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals: [...dayMeals, { id: Date.now(), name: mealName || "Meal", items: [] }] } } };
    }
    case "DELETE_MEAL": {
      const { dateKey, mealId } = a.payload;
      const meals = (s.nutrition[dateKey]?.meals || []).filter(m => m.id !== mealId);
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals } } };
    }
    case "RENAME_MEAL": {
      const { dateKey, mealId, name } = a.payload;
      const meals = (s.nutrition[dateKey]?.meals || []).map(m => m.id === mealId ? { ...m, name } : m);
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals } } };
    }
    case "MOVE_MEAL": {
      const { dateKey, mealId, direction } = a.payload;
      const meals = [...(s.nutrition[dateKey]?.meals || [])];
      const idx = meals.findIndex(m => m.id === mealId);
      const newIdx = idx + direction;
      if (idx < 0 || newIdx < 0 || newIdx >= meals.length) return s;
      [meals[idx], meals[newIdx]] = [meals[newIdx], meals[idx]];
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals } } };
    }
    case "ADD_FOOD_ITEM": {
      const { dateKey, mealId, item } = a.payload;
      const meals = (s.nutrition[dateKey]?.meals || []).map(m =>
        m.id === mealId ? { ...m, items: [...(m.items || []), { ...item, id: Date.now() }] } : m
      );
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals } } };
    }
    case "DELETE_FOOD_ITEM": {
      const { dateKey, mealId, itemId } = a.payload;
      const meals = (s.nutrition[dateKey]?.meals || []).map(m =>
        m.id === mealId ? { ...m, items: (m.items || []).filter(i => i.id !== itemId) } : m
      );
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals } } };
    }
    case "EDIT_FOOD_ITEM": {
      const { dateKey, mealId, itemId, updated } = a.payload;
      const meals = (s.nutrition[dateKey]?.meals || []).map(m =>
        m.id === mealId ? { ...m, items: (m.items || []).map(i => i.id === itemId ? { ...i, ...updated } : i) } : m
      );
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals } } };
    }
    case "MOVE_FOOD_ITEM": {
      const { dateKey, mealId, itemId, direction } = a.payload;
      const meals = (s.nutrition[dateKey]?.meals || []).map(m => {
        if (m.id !== mealId) return m;
        const items = [...(m.items || [])];
        const idx = items.findIndex(i => i.id === itemId);
        const newIdx = idx + direction;
        if (idx < 0 || newIdx < 0 || newIdx >= items.length) return m;
        [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
        return { ...m, items };
      });
      return { ...s, nutrition: { ...s.nutrition, [dateKey]: { meals } } };
    }
    case "ADD_NUTRITION_FAV": {
      return { ...s, nutritionFavs: [...(s.nutritionFavs || []), a.payload] };
    }
    case "DELETE_NUTRITION_FAV": {
      return { ...s, nutritionFavs: (s.nutritionFavs || []).filter((_, i) => i !== a.payload) };
    }
    case "SET_MACRO_GOALS": {
      const updated = { ...s.macroGoals, ...a.payload };
      // Auto-calculate calories: protein 4cal/g, carbs 4cal/g, fat 9cal/g
      updated.calories = (updated.protein * 4) + (updated.carbs * 4) + (updated.fat * 9);
      return { ...s, macroGoals: updated };
    }
    case "SET_TIMER_AUTO_START": return { ...s, timerAutoStart: a.payload };

    case "RESET_ALL_DATA": return { ...init, theme: s.theme, units: s.units, weekStart: s.weekStart, restDefault: s.restDefault, accentColor: s.accentColor, logoChoice: s.logoChoice, appTitle: s.appTitle, favorites: s.favorites, macroGoals: s.macroGoals, currentWeek: weekKey(new Date()) };

    case "ADD_PROGRAM": return { ...s, programs: [...s.programs, a.payload] };
    case "UPDATE_PROGRAM": return { ...s, programs: s.programs.map(p => p.id === a.payload.id ? a.payload : p) };
    case "IMPORT_DATA": {
      const { programs: ip, schedules: isch, schedule: is, workouts: iw } = a.payload;
      // Support importing old single-schedule format too
      let newSchedules = s.schedules;
      if (isch) newSchedules = isch;
      else if (is) newSchedules = { ...s.schedules, legacy: is };
      return { ...s, programs: ip || s.programs, schedules: newSchedules, workouts: iw || s.workouts };
    }
    case "DELETE_PROGRAM": {
      const newProgs = s.programs.filter(p => p.id !== a.payload);
      const newScheds = { ...s.schedules };
      Object.keys(newScheds).forEach(wk => { if (newScheds[wk]?.programId === a.payload) delete newScheds[wk]; });
      return { ...s, programs: newProgs, schedules: newScheds };
    }
    case "SET_SCHEDULE": {
      const { weekKey: wk, programId, assignments } = a.payload;
      return { ...s, schedules: { ...s.schedules, [wk]: { programId, assignments } } };
    }
    case "CLEAR_SCHEDULE": {
      const newScheds = { ...s.schedules };
      delete newScheds[a.payload];
      return { ...s, schedules: newScheds };
    }

    // Replace a day's workout entirely (from program day picker)
    case "REPLACE_DAY": {
      const { dateKey, programDayName, exercises, isRest } = a.payload;
      if (isRest) {
        return { ...s, workouts: { ...s.workouts, [dateKey]: { programDayName, isRest: true, exercises: [] } }, modal: null, modalDay: null };
      }
      const exs = buildExercises(exercises, s.workouts);
      return { ...s, workouts: { ...s.workouts, [dateKey]: { programDayName, isRest: false, exercises: exs } }, modal: null, modalDay: null };
    }

    // Clear a day
    case "SET_DAY_NOTES": {
      const { dateKey, notes } = a.payload;
      const day = s.workouts[dateKey] || { programDayName: "", exercises: [] };
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, notes } } };
    }

    case "CLEAR_DAY": {
      const w = { ...s.workouts }; delete w[a.payload];
      return { ...s, workouts: w, modal: null, modalDay: null };
    }

    // Copy last week's workouts into current week
    case "COPY_LAST_WEEK": {
      const { currentWeek: cw } = a.payload;
      const cwDate = new Date(cw + "T00:00:00");
      const prevDate = new Date(cwDate); prevDate.setDate(prevDate.getDate() - 7);
      const prevWeek = weekKey(prevDate);
      const prevDates = weekDates(prevWeek);
      const curDates = weekDates(cw);
      const newWorkouts = { ...s.workouts };
      // Also copy schedule
      const newScheds = { ...s.schedules };
      if (s.schedules[prevWeek]) newScheds[cw] = { ...s.schedules[prevWeek] };

      for (let i = 0; i < 7; i++) {
        const prevKey = localDateStr(prevDates[i]);
        const curKey = localDateStr(curDates[i]);
        if (newWorkouts[curKey]) continue; // don't overwrite existing
        const prevDay = s.workouts[prevKey];
        if (!prevDay) continue;
        if (prevDay.isRest) {
          newWorkouts[curKey] = { programDayName: prevDay.programDayName, isRest: true, exercises: [] };
        } else {
          // Deep copy exercises with weights pre-filled but sets unchecked
          const exs = prevDay.exercises.map(ex => ({
            ...ex,
            id: Date.now() + Math.random(),
            sets: ex.sets.map(st => ({
              ...st,
              done: false,
            })),
          }));
          newWorkouts[curKey] = { programDayName: prevDay.programDayName, isRest: false, exercises: exs };
        }
      }
      return { ...s, workouts: newWorkouts, schedules: newScheds };
    }
    case "INIT_DAY": {
      const { dateKey, programDayName, exercises, isRest } = a.payload;
      if (s.workouts[dateKey]) return s;
      if (isRest) {
        return { ...s, workouts: { ...s.workouts, [dateKey]: { programDayName, isRest: true, exercises: [] } } };
      }
      const exs = buildExercises(exercises, s.workouts);
      return { ...s, workouts: { ...s.workouts, [dateKey]: { programDayName, isRest: false, exercises: exs } } };
    }

    // Add a standalone exercise
    case "ADD_EXERCISE": {
      const { dateKey, exercise } = a.payload;
      const day = s.workouts[dateKey] || { programDayName: "", exercises: [] };
      const isC = CARDIO_GROUPS.has(exercise.muscle);
      const fromProgram = exercise.fromProgram;
      const numSets = fromProgram ? (parseInt(exercise.targetSets) || 3) : 1;
      const ex = {
        id: Date.now(), name: exercise.name, muscle: exercise.muscle,
        targetSets: parseInt(exercise.targetSets) || (fromProgram ? 3 : 0), targetReps: exercise.targetReps || "",
        isCardio: isC,
        sets: isC
          ? [{ duration: "", done: false }]
          : Array.from({ length: numSets }, () => ({ weight: "", reps: "", done: false })),
      };
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: [...day.exercises, ex] } }, modal: null, modalDay: null };
    }

    case "DELETE_EXERCISE": {
      const { dateKey, exId } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      // Unpair partner if this exercise was in a superset
      let exs = day.exercises.filter(e => e.id !== exId);
      exs = exs.map(e => e.supersetWith === exId ? { ...e, supersetWith: null } : e);
      if (exs.length === 0) { const w = { ...s.workouts }; delete w[dateKey]; return { ...s, workouts: w }; }
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }

    case "MOVE_EXERCISE": {
      const { dateKey, exId, direction } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      const exs = [...day.exercises];
      const idx = exs.findIndex(e => e.id === exId);
      if (idx < 0) return s;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= exs.length) return s;
      // If exercise is in a superset, move the partner too
      const ex = exs[idx];
      if (ex.supersetWith) {
        const partnerIdx = exs.findIndex(e => e.id === ex.supersetWith);
        // Move both: remove both, reinsert at new position
        const pair = [exs[Math.min(idx, partnerIdx)], exs[Math.max(idx, partnerIdx)]];
        const rest = exs.filter(e => e.id !== ex.id && e.id !== ex.supersetWith);
        const insertAt = Math.max(0, Math.min(rest.length, Math.min(idx, partnerIdx) + direction));
        rest.splice(insertAt, 0, ...pair);
        return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: rest } } };
      }
      [exs[idx], exs[newIdx]] = [exs[newIdx], exs[idx]];
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }

    case "PAIR_SUPERSET": {
      const { dateKey, exId1, exId2 } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      // Unpair any existing partners first, then pair these two
      const exs = day.exercises.map(e => {
        if (e.id === exId1) return { ...e, supersetWith: exId2 };
        if (e.id === exId2) return { ...e, supersetWith: exId1 };
        // Unpair anything that was previously paired to either
        if (e.supersetWith === exId1 || e.supersetWith === exId2) return { ...e, supersetWith: null };
        return e;
      });
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }

    case "UNPAIR_SUPERSET": {
      const { dateKey, exId } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      const partnerId = day.exercises.find(e => e.id === exId)?.supersetWith;
      const exs = day.exercises.map(e => {
        if (e.id === exId || e.id === partnerId) return { ...e, supersetWith: null };
        return e;
      });
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }

    // Update a single set
    case "UPDATE_SET": {
      const { dateKey, exId, setIdx, field, value } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      const exs = day.exercises.map(e => {
        if (e.id !== exId) return e;
        const sets = e.sets.map((st, i) => i === setIdx ? { ...st, [field]: value } : st);
        return { ...e, sets };
      });
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }

    case "TOGGLE_SET_DONE": {
      const { dateKey, exId, setIdx } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      const exs = day.exercises.map(e => {
        if (e.id !== exId) return e;
        const sets = e.sets.map((st, i) => {
          if (i !== setIdx) return st;
          if (!st.done) {
            // Checking ON — auto-fill from previous set if empty
            let weight = st.weight;
            let reps = st.reps;
            if (!weight || !reps) {
              // Look backwards for the most recent filled set
              for (let p = setIdx - 1; p >= 0; p--) {
                const prev = e.sets[p];
                if (!weight && prev.weight) weight = prev.weight;
                if (!reps && prev.reps) reps = prev.reps;
                if (weight && reps) break;
              }
            }
            return { ...st, weight: weight || st.weight, reps: reps || st.reps, done: true, skipped: false };
          }
          return { ...st, done: false };
        });
        return { ...e, sets };
      });
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }
    case "SKIP_SET": {
      const { dateKey, exId, setIdx } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      const exs = day.exercises.map(e => {
        if (e.id !== exId) return e;
        const sets = e.sets.map((st, i) => i === setIdx ? { ...st, skipped: !st.skipped, done: false } : st);
        return { ...e, sets };
      });
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }

    case "ADD_SET": {
      const { dateKey, exId } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      const exs = day.exercises.map(e => {
        if (e.id !== exId) return e;
        return { ...e, sets: [...e.sets, e.isCardio ? { duration: "", done: false } : { weight: "", reps: "", done: false }] };
      });
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }
    case "DELETE_SET": {
      const { dateKey, exId, setIdx } = a.payload;
      const day = s.workouts[dateKey];
      if (!day) return s;
      const exs = day.exercises.map(e => {
        if (e.id !== exId) return e;
        if (e.sets.length <= 1) return e; // keep at least 1 set
        return { ...e, sets: e.sets.filter((_, i) => i !== setIdx) };
      });
      return { ...s, workouts: { ...s.workouts, [dateKey]: { ...day, exercises: exs } } };
    }

    default: return s;
  }
}
