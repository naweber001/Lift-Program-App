import { DARK, LIGHT } from './constants.js';

// Mutable theme state — updated by App on each render
// All components import { C, U } and read the current values
export let C = { ...DARK };
export let U = "lbs";

export function applyTheme(theme, accentColor, units) {
  C = theme === "light" ? { ...LIGHT } : { ...DARK };
  if (accentColor) {
    C.accent = accentColor;
    C.accentDim = accentColor + "20";
  }
  U = units || "lbs";
}
