import { defineStore } from "pinia";

const STORAGE_KEY = "bandpick-setlist-v1";

export type SetlistItem = {
  id: string;
  title: string;
  artist: string;
  sessions: string[];
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
          title: String(row.title).trim(),
          artist: String(row.artist).trim(),
          sessions: Array.isArray((row as any).sessions)
            ? (row as any).sessions
            : [], // 없으면 빈 배열
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

    if (newData.title !== undefined) {
      item.title = newData.title.trim();
    }

    if (newData.artist !== undefined) {
      item.artist = newData.artist.trim();
    }

    if (newData.sessions !== undefined) {
      item.sessions = newData.sessions;
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

  return {
    items,
    hydrate,
    addItem,
    updateItem,
    removeItem,
    clearAll,
  };
});
