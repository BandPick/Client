import { defineStore } from "pinia";

const STORAGE_KEY = "bandpick-setlist-v1";

export type SetlistItem = {
  /** UI용 로컬 id */
  id: string;
  /** DB setlist.id — 저장·갱신 시 서버에 전달 */
  serverId?: number;
  title: string;
  artist: string;
  sessions: string[];
};

export type SetlistApiRow = {
  id: number;
  title: string;
  artist: string;
  positions?: string[];
  sessions?: string[];
};

export function formatSetlistLine(item: SetlistItem): string {
  const base = `${item.title.trim()} - ${item.artist.trim()}`;
  if (!item.sessions?.length) return base;
  return `${base} (${item.sessions.join(", ")})`;
}

// Piana Store 생성
export const useSetlistStore = defineStore("setlist", () => {
  // 셋리스트 배열
  const items = ref<SetlistItem[]>([]);

  function persist() {
    if (!import.meta.client) return;
    try {
      // 현재 상태를 브라우저에 저장
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
    } catch {
    }
  }

  // hydrate : 설정 페이지 등에서 onMounted로 호출
  // localStrotge -> JSON 파싱 -> 검증 -> items에 반영
  function hydrate() {
    if (!import.meta.client) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      items.value = parsed
        .filter(
          (row): row is SetlistItem =>
            row != null &&
            typeof row === "object" &&
            "id" in row &&
            "title" in row &&
            "artist" in row &&
            typeof (row as SetlistItem).id === "string" &&
            typeof (row as SetlistItem).title === "string" &&
            typeof (row as SetlistItem).artist === "string",
        )
        .map((row) => ({
          id: row.id,
          serverId:
            typeof (row as SetlistItem).serverId === "number"
              ? (row as SetlistItem).serverId
              : undefined,
          title: String(row.title).trim(),
          artist: String(row.artist).trim(),
          sessions: Array.isArray((row as SetlistItem).sessions)
            ? (row as SetlistItem).sessions
            : [],
        }))
        // 타입 가드 + 데이터 검증
        .filter((row) => row.title && row.artist);
    } catch {
      items.value = [];
    }
  }

  // 아이템 추가
  function addItem(title: string, artist: string, sessions: string[]) {
    const t = title.trim();
    const a = artist.trim();
    if (!t || !a) return;

    items.value.push({
      id: crypto.randomUUID(),
      title: t,
      artist: a,
      sessions: sessions ?? [], // 🔥 추가
    });

    persist();
  }

  function updateItem(id: string, newData: Partial<SetlistItem>) {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;

    const titleChanged =
      newData.title !== undefined && newData.title.trim() !== item.title;
    const artistChanged =
      newData.artist !== undefined && newData.artist.trim() !== item.artist;

    if (newData.title !== undefined) {
      item.title = newData.title.trim();
    }

    if (newData.artist !== undefined) {
      item.artist = newData.artist.trim();
    }

    if (newData.sessions !== undefined) {
      item.sessions = newData.sessions;
    }

    if (titleChanged || artistChanged) {
      item.serverId = undefined;
    }

    persist();
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id);
    persist();
  }

  // 전체 삭제
  function clearAll() {
    items.value = [];
    persist();
  }

  function normalizeApiSessions(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim());
  }

  /** GET /api/v1/setlists 응답으로 store를 덮어씀 (serverId 포함) */
  function replaceFromApi(rows: SetlistApiRow[]) {
    items.value = rows
      .filter((row) => row.title?.trim() && row.artist?.trim())
      .map((row) => ({
        id: crypto.randomUUID(),
        serverId: row.id,
        title: row.title.trim(),
        artist: row.artist.trim(),
        sessions: normalizeApiSessions(row.positions ?? row.sessions),
      }));
    persist();
  }

  /** POST 저장 응답으로 serverId 동기화 */
  function syncServerIdsFromApi(rows: SetlistApiRow[]) {
    for (const row of rows) {
      const title = row.title?.trim() ?? "";
      const artist = row.artist?.trim() ?? "";
      if (!title || !artist) continue;

      const match = items.value.find(
        (item) => item.title === title && item.artist === artist,
      );
      if (match) {
        match.serverId = row.id;
      }
    }
    persist();
  }

  return {
    items,
    hydrate,
    replaceFromApi,
    syncServerIdsFromApi,
    addItem,
    updateItem,
    removeItem,
    clearAll,
  };
});
