/**
 * Talks to the booking backend (Google Apps Script web app – see backend/SETUP.md).
 * Set VITE_BOOKING_API_URL (in .env.local or on Vercel) to the web app's /exec URL.
 * If it isn't set, the app runs in DEMO mode: nothing is emailed and Meet links are placeholders.
 */
export const BOOKING_API_URL: string = (import.meta.env?.VITE_BOOKING_API_URL || '').trim();
export const isLiveMode = (): boolean => BOOKING_API_URL.length > 0;

export interface BusyInterval {
  start: number; // epoch ms
  end: number;
}

export async function fetchBusy(fromYmd: string, toYmd: string): Promise<BusyInterval[]> {
  if (!isLiveMode()) return [];
  const url = `${BOOKING_API_URL}?action=busy&from=${fromYmd}&to=${toYmd}`;
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || data.error || 'Could not load availability');
  return (data.busy as { start: string; end: string }[]).map((b) => ({
    start: Date.parse(b.start),
    end: Date.parse(b.end),
  }));
}

export interface BookRequest {
  startIso: string;
  clientName: string;
  clientEmail: string;
  company?: string;
  topicTitle: string;
  notes?: string;
  timeZone: string;
  reminders: { reminder24h: boolean; reminder1h: boolean; reminder10m: boolean };
}

export interface BookResponse {
  ok: boolean;
  error?: 'SLOT_TAKEN' | 'INVALID' | 'PAST' | 'BUSY' | 'SERVER_ERROR' | string;
  message?: string;
  meetLink?: string;
  eventLink?: string;
  eventId?: string;
}

export async function bookSlot(req: BookRequest): Promise<BookResponse> {
  // text/plain keeps this a "simple" request, so the browser skips the CORS preflight
  // that Apps Script cannot answer.
  const res = await fetch(BOOKING_API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'book', ...req }),
  });
  return (await res.json()) as BookResponse;
}

/** YYYY-MM-DD for a local Date (calendar dates are picked in the browser). */
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
