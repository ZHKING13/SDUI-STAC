import { createHash, randomBytes } from 'node:crypto';

/** Jeton aléatoire envoyé au client (cookie, lien d'e-mail). Seul son condensat est stocké. */
export const generateToken = (): string => randomBytes(32).toString('base64url');

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);
export const addDays = (date: Date, days: number) => addMinutes(date, days * 24 * 60);
