/**
 * Date helpers shared across the app.
 *
 * Every screen used to hardcode "today" as a fixed July 2026 date for demo
 * purposes. These helpers replace that with the device's real clock, so the
 * Today / Tomorrow / Overdue logic, the calendar grid and the dashboard all
 * reflect the actual current date.
 *
 * All ISO strings are local-time `YYYY-MM-DD` (never UTC) so that a task due
 * "today" is still today late in the evening.
 */

const DAY_MS = 86_400_000;

const pad = (n: number) => n.toString().padStart(2, '0');

/** Local-time `YYYY-MM-DD` for a Date. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a `YYYY-MM-DD` string as a local-time Date (midnight). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Today as `YYYY-MM-DD`. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Shift an ISO date by `days` (negative allowed). */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `fromISO` to `toISO` (positive when `toISO` is later). */
export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / DAY_MS);
}

/** "Today" / "Tomorrow" / "Overdue" / "N days left" relative to a reference date. */
export function getCountdownLabel(dueISO: string, referenceISO: string = todayISO()): string {
  const diff = daysBetween(referenceISO, dueISO);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return 'Overdue';
  return `${diff} days left`;
}

/** e.g. "Saturday, July 25" */
export function formatLongDate(iso: string = todayISO()): string {
  return parseISODate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** e.g. "July 2026" */
export function formatMonthYear(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Convert "HH:MM" (24h) to "hh:MM AM/PM". */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(hour12)}:${pad(m || 0)} ${suffix}`;
}

export interface DayCell {
  /** Short weekday label, e.g. "Mon". */
  label: string;
  /** Day of month as string, e.g. "20". */
  date: string;
  /** Full ISO date. */
  full: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The Sunday-to-Saturday week that contains `referenceISO`. */
export function getWeekDays(referenceISO: string = todayISO()): DayCell[] {
  const ref = parseISODate(referenceISO);
  const sunday = new Date(ref);
  sunday.setDate(ref.getDate() - ref.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return { label: WEEKDAY_LABELS[d.getDay()], date: d.getDate().toString(), full: toISODate(d) };
  });
}

/** e.g. "July 19 - 25, 2026" or "Jun 28 - Jul 4, 2026" for a week. */
export function formatWeekRange(week: DayCell[]): string {
  if (week.length === 0) return '';
  const first = parseISODate(week[0].full);
  const last = parseISODate(week[week.length - 1].full);
  const sameMonth = first.getMonth() === last.getMonth();
  const firstLabel = first.toLocaleDateString('en-US', { month: sameMonth ? 'long' : 'short', day: 'numeric' });
  const lastLabel = sameMonth
    ? last.getDate().toString()
    : last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${firstLabel} - ${lastLabel}, ${last.getFullYear()}`;
}

/** The last `count` days ending at `referenceISO` (inclusive), oldest first. */
export function getLastNDays(count: number, referenceISO: string = todayISO()): DayCell[] {
  return Array.from({ length: count }, (_, i) => {
    const iso = addDaysISO(referenceISO, i - (count - 1));
    const d = parseISODate(iso);
    return { label: WEEKDAY_LABELS[d.getDay()], date: d.getDate().toString(), full: iso };
  });
}

export interface MonthGrid {
  /** e.g. "July 2026" */
  label: string;
  /** ISO of the first day of the month. */
  firstDayISO: string;
  /** Cells for a 7-column grid; `null` for leading/trailing blanks. */
  cells: (string | null)[];
}

/** A 7-column calendar grid for the month containing `referenceISO`. */
export function getMonthGrid(referenceISO: string = todayISO()): MonthGrid {
  const ref = parseISODate(referenceISO);
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const offset = first.getDay();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const cells: (string | null)[] = Array.from({ length: totalCells }, (_, idx) => {
    const day = idx - offset + 1;
    return day >= 1 && day <= daysInMonth ? toISODate(new Date(ref.getFullYear(), ref.getMonth(), day)) : null;
  });
  return { label: formatMonthYear(referenceISO), firstDayISO: toISODate(first), cells };
}

/** Same day-of-month in the month `months` away (clamped to that month's length). */
export function shiftMonthISO(iso: string, months: number): string {
  const d = parseISODate(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), daysInTarget));
  return toISODate(target);
}

/** ISO date `days` ago from today — handy for "this week" windows. */
export function daysAgoISO(days: number): string {
  return addDaysISO(todayISO(), -days);
}
