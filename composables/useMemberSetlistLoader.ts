/** 서버 GET /api/v1/setlists 응답 (Jackson 필드명 positions) */
export type SetlistApiItem = {
  id: number;
  title: string;
  artist: string;
  positions?: string[];
  /** 호환용 별칭 */
  sessions?: string[];
};

export type MemberSetlistSong = {
  id: string;
  displayTitle: string;
  sessions: string[];
};

/** `stores/setlist.ts` 와 동일 — 관리자 셋리스트 로컬 저장소 */
const LOCAL_SETLIST_STORAGE_KEY = "bandpick-setlist-v1";

function joinApiPath(base: string, pathWithoutPrefix: string): string {
  const cleanBase = String(base).replace(/\/$/, "");
  const cleanPath = String(pathWithoutPrefix).replace(/^\/+/, "");
  if (/(^|\/)api\/v1$/.test(cleanBase)) {
    return `${cleanBase}/${cleanPath}`;
  }
  return `${cleanBase}/api/v1/${cleanPath}`;
}

function normalizeSessionStrings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim());
}

type LocalSetlistRow = { title: string; artist: string; sessions: string[] };

function readLocalSetlistRows(): LocalSetlistRow[] {
  if (!import.meta.client) return [];
  try {
    const raw = localStorage.getItem(LOCAL_SETLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is Record<string, unknown> => row != null && typeof row === "object")
      .map((row) => ({
        title: String(row.title ?? "").trim(),
        artist: String(row.artist ?? "").trim(),
        sessions: normalizeSessionStrings(row.sessions),
      }))
      .filter((r) => r.title.length > 0 && r.artist.length > 0);
  } catch {
    return [];
  }
}

export function useMemberSetlistLoader() {
  const config = useRuntimeConfig();

  const setlistsUrl = computed(() => {
    return joinApiPath(config.public.apiBase, "setlists");
  });

  async function loadSongsForMemberForm(): Promise<MemberSetlistSong[]> {
    const rows = await $fetch<SetlistApiItem[]>(setlistsUrl.value);
    if (!Array.isArray(rows)) return [];

    const localRows = readLocalSetlistRows();

    return rows.map((row) => {
      const title = String(row.title ?? "").trim();
      const artist = String(row.artist ?? "").trim();
      let sessions = normalizeSessionStrings(
        row.positions ?? row.sessions ?? [],
      );

      if (!sessions.length && localRows.length) {
        const hit = localRows.find(
          (it) => it.title === title && it.artist === artist,
        );
        if (hit?.sessions.length) {
          sessions = [...hit.sessions];
        }
      }

      return {
        id: String(row.id),
        displayTitle: `${title} - ${artist}`,
        sessions,
      };
    });
  }

  return { setlistsUrl, loadSongsForMemberForm };
}
