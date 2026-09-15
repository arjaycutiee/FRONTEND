/**
 * localDb — central in-memory data store for GabAi.
 *
 * Every tab (Tasks, Notes, Calendar, Expenses, Dashboard, Profile, Assistant)
 * reads from and writes to this single store, then re-renders through
 * `subscribe()` whenever any collection changes.
 *
 * Domain types that belong to a single feature (CalendarEvent, Transaction)
 * live in that feature's `types/` folder and are re-used here; Task, SubTask
 * and Note are owned by this module because several features share them.
 *
 * The store starts EMPTY. There is no hardcoded default account: the current
 * user is set by the auth flow (login / register) via `setCurrentUser`, and
 * cleared on logout via `clearCurrentUser`.
 */

import type { CalendarEvent } from '@/app/(tabs)/calendar/types';
import type { Transaction } from '@/app/(tabs)/expenses/types';

// ---------------------------------------------------------------------------
// Shared domain types
// ---------------------------------------------------------------------------

export type TaskCategory = 'Academic' | 'Personal' | 'Projects' | 'Exams' | 'Activities';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskDifficulty = 'Hard' | 'Medium' | 'Easy';
export type TaskRepeat = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: TaskCategory;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  /** Estimated hours. */
  duration: number;
  /** YYYY-MM-DD */
  dueDate: string;
  /** HH:MM */
  dueTime: string;
  completed: boolean;
  hasReminder: boolean;
  repeat: TaskRepeat;
  isPinned: boolean;
  isFavorite: boolean;
  attachments: number;
  subTasks: SubTask[];
  /** Epoch ms */
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  /** Epoch ms */
  createdAt: number;
  /** Epoch ms */
  updatedAt: number;
}

/** The signed-in account, as returned by the backend after login/register. */
export interface CurrentUser {
  id?: string;
  name: string;
  email: string;
  course?: string;
}

export type { CalendarEvent, Transaction };

/** Input shape for `addTask` — id and createdAt are generated. */
export type NewTask = Omit<Task, 'id' | 'createdAt'>;
/** Input shape for `addNote` — id and timestamps are generated. */
export type NewNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Note, 'tags'>>;
/** Input shape for `addEvent` — id is generated. */
export type NewEvent = Omit<CalendarEvent, 'id'>;
/** Input shape for `addTransaction` — id is generated. */
export type NewTransaction = Omit<Transaction, 'id'>;

type Listener = () => void;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

class LocalDb {
  private currentUser: CurrentUser | null = null;
  private authToken: string | null = null;
  private tasks: Task[] = [];
  private notes: Note[] = [];
  private events: CalendarEvent[] = [];
  private transactions: Transaction[] = [];
  private listeners = new Set<Listener>();

  // ---- subscriptions -----------------------------------------------------

  /** Register a change listener. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // ---- current user ------------------------------------------------------

  getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  /** Called by the auth flow after a successful login / registration. */
  setCurrentUser(user: CurrentUser): void {
    this.currentUser = user;
    this.notify();
  }

  /** JWT access token from the backend; attached to API requests by `api.ts`. */
  getAuthToken(): string | null {
    return this.authToken;
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /** Called on logout. Also wipes the per-user collections. */
  clearCurrentUser(): void {
    this.currentUser = null;
    this.authToken = null;
    this.tasks = [];
    this.notes = [];
    this.events = [];
    this.transactions = [];
    this.notify();
  }

  // ---- tasks -------------------------------------------------------------

  getTasks(): Task[] {
    return this.tasks;
  }

  setTasks(tasks: Task[]): void {
    this.tasks = tasks;
    this.notify();
  }

  addTask(input: NewTask): Task {
    const task: Task = { ...input, id: this.generateId('task'), createdAt: Date.now() };
    this.tasks = [task, ...this.tasks];
    this.notify();
    return task;
  }

  updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): void {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    this.notify();
  }

  deleteTask(id: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.notify();
  }

  toggleTaskCompleted(id: string): void {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    this.notify();
  }

  // ---- notes -------------------------------------------------------------

  getNotes(): Note[] {
    return this.notes;
  }

  setNotes(notes: Note[]): void {
    this.notes = notes;
    this.notify();
  }

  addNote(input: NewNote): Note {
    const ts = Date.now();
    const note: Note = {
      ...input,
      tags: input.tags ?? [],
      id: this.generateId('note'),
      createdAt: ts,
      updatedAt: ts,
    };
    this.notes = [note, ...this.notes];
    this.notify();
    return note;
  }

  updateNote(id: string, patch: Partial<Omit<Note, 'id' | 'createdAt'>>): void {
    this.notes = this.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
    this.notify();
  }

  deleteNote(id: string): void {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.notify();
  }

  // ---- calendar events ---------------------------------------------------

  getEvents(): CalendarEvent[] {
    return this.events;
  }

  setEvents(events: CalendarEvent[]): void {
    this.events = events;
    this.notify();
  }

  addEvent(input: NewEvent): CalendarEvent {
    const event: CalendarEvent = { ...input, id: this.generateId('event') };
    this.events = [...this.events, event];
    this.notify();
    return event;
  }

  updateEvent(id: string, patch: Partial<Omit<CalendarEvent, 'id'>>): void {
    this.events = this.events.map((e) => (e.id === id ? { ...e, ...patch } : e));
    this.notify();
  }

  deleteEvent(id: string): void {
    this.events = this.events.filter((e) => e.id !== id);
    this.notify();
  }

  // ---- transactions ------------------------------------------------------

  getTransactions(): Transaction[] {
    return this.transactions;
  }

  setTransactions(transactions: Transaction[]): void {
    this.transactions = transactions;
    this.notify();
  }

  addTransaction(input: NewTransaction): Transaction {
    const tx: Transaction = { ...input, id: this.generateId('tx') };
    this.transactions = [tx, ...this.transactions];
    this.notify();
    return tx;
  }

  deleteTransaction(id: string): void {
    this.transactions = this.transactions.filter((t) => t.id !== id);
    this.notify();
  }
}

export const localDb = new LocalDb();
