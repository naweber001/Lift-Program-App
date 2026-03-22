import { useReducer, useEffect } from 'react';
import { reducer, init } from '../reducer.js';
import { WEEK_STARTS } from '../constants.js';
import { setWeekStart } from '../dateUtils.js';

const STORAGE_KEY = "se_v13";
const SCHEMA_VERSION = 2;

function migrateData(data) {
  const version = data._schemaVersion || 1;
  let migrated = { ...data };

  // Migration from v1 to v2: add originalWeight/originalUnit to existing sets
  if (version < 2) {
    const unit = migrated.units || "lbs";
    if (migrated.workouts) {
      const newWorkouts = {};
      Object.entries(migrated.workouts).forEach(([dk, day]) => {
        if (!day.exercises) { newWorkouts[dk] = day; return; }
        newWorkouts[dk] = {
          ...day,
          exercises: day.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(st => ({
              ...st,
              originalWeight: st.originalWeight ?? st.weight,
              originalUnit: st.originalUnit ?? unit,
            })),
          })),
        };
      });
      migrated.workouts = newWorkouts;
    }
  }

  migrated._schemaVersion = SCHEMA_VERSION;
  return migrated;
}

export function usePersisted() {
  const [s, d] = useReducer(reducer, init, (i) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        let p = JSON.parse(raw);
        // Apply migrations
        p = migrateData(p);
        const progs = p.programs && p.programs.length > 0 ? p.programs : i.programs;
        let scheds = p.schedules || {};
        if (!p.schedules && p.schedule) scheds = {};
        const ws = p.weekStart || "saturday";
        setWeekStart(ws);
        // Migrate old flat meals to grouped meal structure
        let nutri = p.nutrition || {};
        Object.keys(nutri).forEach(dk => {
          const day = nutri[dk];
          if (day?.meals?.length > 0 && !day.meals[0].items) {
            nutri = { ...nutri, [dk]: { meals: [{ id: 1, name: "Meal", items: day.meals }] } };
          }
        });
        return { ...i, programs: progs, schedules: scheds, workouts: p.workouts || {}, theme: p.theme || "dark", units: p.units || "lbs", weekStart: ws, restDefault: p.restDefault || 90, accentColor: p.accentColor || null, logoChoice: p.logoChoice || "logo1", appTitle: p.appTitle || "LIFE \u2013 Fitness", favorites: p.favorites || [], nutrition: nutri, nutritionFavs: p.nutritionFavs || [], macroGoals: p.macroGoals || { calories: 2500, protein: 180, carbs: 250, fat: 80 }, timerAutoStart: p.timerAutoStart === true, exerciseFavs: p.exerciseFavs || [] };
      }
    } catch {} return i;
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        _schemaVersion: SCHEMA_VERSION,
        programs: s.programs, schedules: s.schedules, workouts: s.workouts, theme: s.theme, units: s.units, weekStart: s.weekStart, restDefault: s.restDefault, accentColor: s.accentColor, logoChoice: s.logoChoice, appTitle: s.appTitle, favorites: s.favorites, nutrition: s.nutrition, nutritionFavs: s.nutritionFavs, macroGoals: s.macroGoals, timerAutoStart: s.timerAutoStart, exerciseFavs: s.exerciseFavs
      }));
    } catch {}
  }, [s.programs, s.schedules, s.workouts, s.theme, s.units, s.weekStart, s.restDefault, s.accentColor, s.logoChoice, s.appTitle, s.favorites, s.nutrition, s.nutritionFavs, s.macroGoals, s.timerAutoStart, s.exerciseFavs]);
  return [s, d];
}
