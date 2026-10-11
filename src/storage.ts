import { SavedStudySession } from './types';

const STORAGE_KEY = 'study_everyday_saved_sessions';

export function formatSessionDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y} / ${m} / ${d}   ${hh} : ${mm} : ${ss}`;
}

export function getSavedSessions(): SavedStudySession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStudySession(session: SavedStudySession): void {
  try {
    const list = getSavedSessions();
    const updated = [session, ...list.filter((s) => s.id !== session.id)].slice(0, 32);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save study session', err);
  }
}

export function deleteStudySession(id: string): void {
  try {
    const list = getSavedSessions();
    const updated = list.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete study session', err);
  }
}
