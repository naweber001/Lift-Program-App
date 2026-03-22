import { ALL_DAYS, WEEK_STARTS } from './constants.js';

// Mutable week-start day — updated when settings change
export let W = 6; // default Saturday

export function setWeekStart(val) {
  W = WEEK_STARTS[val] ?? 6;
}

export function getDays() {
  const idx = ALL_DAYS.findIndex((_, i) => i === W);
  return [...ALL_DAYS.slice(idx), ...ALL_DAYS.slice(0, idx)];
}

export function localDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

export function weekKey(date) {
  const d = new Date(date); const day = d.getDay();
  const diff = (day - W + 7) % 7;
  const start = new Date(d); start.setDate(d.getDate() - diff);
  return localDateStr(start);
}

export function weekDates(wk) {
  const start = new Date(wk + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

export function weekLabel(wk) {
  const ds = weekDates(wk);
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${m[ds[0].getMonth()]} ${ds[0].getDate()} - ${m[ds[6].getMonth()]} ${ds[6].getDate()}`;
}

export function dayIdx(dateKey) { const d = new Date(dateKey+"T00:00:00").getDay(); return (d - W + 7) % 7; }
export function dayName(dateKey) { return getDays()[dayIdx(dateKey)]; }
