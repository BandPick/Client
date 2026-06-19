import { datetimeLocalToIsoDeadline } from "~/utils/settingsDeadline";

const SETTINGS_STORAGE_KEY = "settings";

export type LocalMemberSettings = {
  minVocalSongs: number;
  minSessionSongs: number;
  deadline: string;
};

export function readLocalMemberSettings(): LocalMemberSettings | null {
  if (!import.meta.client) return null;

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      minVocal?: number;
      minSession?: number;
      deadline?: string;
    };

    const minVocal = Number(parsed.minVocal);
    const minSession = Number(parsed.minSession);
    const deadlineLocal = String(parsed.deadline ?? "").trim();

    if (!deadlineLocal) return null;

    return {
      minVocalSongs: Number.isFinite(minVocal) && minVocal >= 1 ? minVocal : 6,
      minSessionSongs:
        Number.isFinite(minSession) && minSession >= 1 ? minSession : 6,
      deadline: datetimeLocalToIsoDeadline(deadlineLocal),
    };
  } catch {
    return null;
  }
}
