<template>
  <section class="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
    <div class="mb-4 flex items-center justify-between">

      <h2 class="text-lg font-semibold text-slate-900">
        공연 셋리스트
      </h2>

      <div v-if="store.items.length" class="flex items-center gap-2">
        <button type="button"
          class="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSavingToDb" @click="saveSetlistToDb">
          {{ isSavingToDb ? "저장 중..." : "저장" }}
        </button>

        <button type="button" class="text-xs text-slate-500 underline hover:text-slate-800" @click="confirmClear">
          전체 삭제
        </button>
      </div>

    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="min-w-0 w-full max-w-xs space-y-1">
        <label class="text-xs font-medium text-slate-700">곡 제목</label>
        <input v-model="title" type="text" placeholder="예: 역성"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          @keydown.enter.prevent="submit" />
      </div>

      <div class="min-w-0 w-full max-w-xs space-y-1">
        <label class="text-xs font-medium text-slate-700">가수</label>
        <input v-model="artist" type="text" placeholder="예: 이승윤"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          @keydown.enter.prevent="submit" />
      </div>

      <div class="min-w-[140px] space-y-2">
        <label class="text-xs font-medium text-slate-700">세션 구성</label>

        <details ref="sessionDetails" class="relative">
          <summary class="cursor-pointer rounded-md border bg-white px-3 py-2 text-sm">
            선택
          </summary>

          <div class="absolute z-10 mt-2 w-56 rounded-md border bg-white p-2 shadow">
            <label v-for="option in sessionOptions" :key="option"
              class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
              <input v-model="selectedSessions" type="checkbox" :value="option" />
              {{ option }}
            </label>
          </div>
        </details>
      </div>

      <button type="button"
        class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:mb-0.5"
        @click="submit">
        추가
      </button>
    </div>
    <div v-if="selectedSessions.includes('기타')" class="mt-4 rounded-lg border border-slate-200 bg-white p-3 space-y-2">
      <label class="text-xs font-medium text-slate-700">기타 상세</label>
      <div v-for="(_, index) in etcDetails" :key="`etc-create-${index}`" class="flex items-center gap-2">
        <input v-model="etcDetails[index]" type="text" placeholder="예: 코러스"
          class="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="button"
          class="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          :disabled="etcDetails.length <= 1" @click="removeEtcDetail(index)">
          삭제
        </button>
      </div>
      <button type="button"
        class="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
        @click="addEtcDetail">
        + 기타 추가
      </button>
    </div>

    <p v-if="hint" class="mt-2 text-xs text-amber-700">{{ hint }}</p>

    <ul class="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white" role="list">
      <li v-if="!store.items.length" class="px-4 py-8 text-center text-sm text-slate-500">
        등록된 곡이 없습니다. 위에서 곡을 추가해 주세요.
      </li>

      <li v-for="item in store.items" :key="item.id" class="px-4 py-3">
        <div v-if="editingId !== item.id" class="flex items-center justify-between gap-3">
          <div class="min-w-0 flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-900">
              {{ formatSetlistLine(item) }}
            </span>

            <div v-if="item.sessions?.length" class="flex flex-wrap gap-1">
              <span v-for="s in item.sessions" :key="s" class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {{ s }}
              </span>
            </div>
          </div>

          <div class="flex shrink-0 gap-1">
            <button type="button"
              class="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
              @click="startEdit(item)">
              수정
            </button>
            <button type="button"
              class="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              @click="store.removeItem(item.id); cancelEditIf(item.id)">
              삭제
            </button>
          </div>
        </div>


        <div v-else class="flex flex-col gap-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
          <div class="min-w-0 flex-1 space-y-3">
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="text-xs font-medium text-slate-700">곡 제목</label>
                <input v-model="editDraft.title" type="text"
                  class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-700">가수</label>
                <input v-model="editDraft.artist" type="text"
                  class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-700">세션 구성</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <label v-for="option in sessionOptions" :key="option"
                  class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                  <input v-model="editDraft.selectedSessions" type="checkbox" :value="option" />
                  {{ option }}
                </label>
              </div>
              <div v-if="editDraft.selectedSessions.includes('기타')" class="mt-2 space-y-2">
                <label class="text-xs font-medium text-slate-700">기타 상세</label>
                <div v-for="(_, index) in editDraft.etcDetails" :key="`etc-edit-${index}`"
                  class="flex items-center gap-2">
                  <input v-model="editDraft.etcDetails[index]" type="text" placeholder="예: EG3"
                    class="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button"
                    class="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    :disabled="editDraft.etcDetails.length <= 1" @click="removeEditEtcDetail(index)">
                    제거
                  </button>
                </div>
                <button type="button"
                  class="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  @click="addEditEtcDetail">
                  + 기타 추가
                </button>
              </div>
            </div>
          </div>

          <div class="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <button type="button"
              class="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              @click="saveEdit(item.id)">
              저장
            </button>
            <button type="button"
              class="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="cancelEdit">
              취소
            </button>
          </div>
        </div>
      </li>
    </ul>

    <p v-if="saveMessage" class="mt-3 text-xs"
      :class="saveMessageType === 'success' ? 'text-emerald-700' : 'text-red-700'">
      {{ saveMessage }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { formatSetlistLine, type SetlistItem, useSetlistStore } from "~/stores/setlist";

const store = useSetlistStore();

const title = ref("");
const artist = ref("");
const hint = ref("");

const sessionOptions = [
  "V",
  "D",
  "B",
  "EG1",
  "EG2",
  "AG",
  "K1",
  "K2",
  "기타",
] as const;

const selectedSessions = ref<string[]>([]);
const etcDetails = ref<string[]>([""]);

const sessionDetails = ref<HTMLDetailsElement | null>(null);

const editingId = ref<string | null>(null);
const isSavingToDb = ref(false);
const saveMessage = ref("");
const saveMessageType = ref<"success" | "error">("success");
const editDraft = reactive({
  title: "",
  artist: "",
  selectedSessions: [] as string[],
  etcDetails: [""] as string[],
});
const config = useRuntimeConfig();

const setlistApiUrl = computed(() => {
  const host = String(config.public.apiBase).replace(/\/$/, "");
  const raw =
    (config.public as { apiSetlistPath?: string }).apiSetlistPath ?? "setlists";
  const path = String(raw).replace(/^\/+|\/+$/g, "");
  return `${host}/${path}`;
});

onMounted(() => {
  store.hydrate();
});

function normalizeEtcDetails(details: string[]): string[] {
  return details.map((d) => d.trim()).filter(Boolean);
}

function buildSessionsFromSelection(raw: string[], details: string[]): string[] {
  let sessions = [...raw];
  if (sessions.includes("기타")) {
    const cleanedDetails = normalizeEtcDetails(details);
    sessions = sessions.filter((s) => s !== "기타");
    if (cleanedDetails.length) {
      sessions.push(...cleanedDetails.map((detail) => `기타(${detail})`));
    } else {
      sessions.push("기타");
    }
  }
  return sessions;
}

function sessionsFromStored(stored: string[]) {
  const selected: string[] = [];
  const etcList: string[] = [];
  for (const s of stored) {
    const m = s.match(/^기타\((.*)\)$/);
    if (m) {
      if (!selected.includes("기타")) selected.push("기타");
      const detail = (m[1] ?? "").trim();
      if (detail) etcList.push(detail);
    } else if ((sessionOptions as readonly string[]).includes(s)) {
      selected.push(s);
    } else {
      if (!selected.includes("기타")) selected.push("기타");
      const unknown = s.trim();
      if (unknown) etcList.push(unknown);
    }
  }
  if (selected.includes("기타") && !etcList.length) {
    etcList.push("");
  }
  return { selected, etcList };
}

function submit() {
  hint.value = "";

  if (!title.value.trim() || !artist.value.trim()) {
    hint.value = "곡 제목과 가수를 모두 입력해 주세요.";
    return;
  }

  const sessions = buildSessionsFromSelection(
    selectedSessions.value,
    etcDetails.value,
  );

  store.addItem(title.value, artist.value, sessions);

  // 토글 닫기
  if (sessionDetails.value) {
    sessionDetails.value.open = false;
  }
  title.value = "";
  artist.value = "";
  selectedSessions.value = [];
  etcDetails.value = [""];
}

function confirmClear() {
  if (
    typeof window !== "undefined" &&
    !window.confirm("전체 삭제할까요?")
  ) {
    return;
  }
  store.clearAll();
  cancelEdit();
}

function startEdit(item: SetlistItem) {
  editingId.value = item.id;
  const { selected, etcList } = sessionsFromStored(item.sessions ?? []);
  editDraft.title = item.title;
  editDraft.artist = item.artist;
  editDraft.selectedSessions = [...selected];
  editDraft.etcDetails = etcList.length ? [...etcList] : [""];
}

function saveEdit(id: string) {
  const t = editDraft.title.trim();
  const a = editDraft.artist.trim();
  if (!t || !a) {
    hint.value = "수정 중인 곡의 제목과 가수를 모두 입력해 주세요.";
    return;
  }
  hint.value = "";
  const sessions = buildSessionsFromSelection(
    editDraft.selectedSessions,
    editDraft.etcDetails,
  );
  store.updateItem(id, { title: t, artist: a, sessions });
  cancelEdit();
}

function cancelEdit() {
  editingId.value = null;
  editDraft.title = "";
  editDraft.artist = "";
  editDraft.selectedSessions = [];
  editDraft.etcDetails = [""];
}

function cancelEditIf(id: string) {
  if (editingId.value === id) cancelEdit();
}

async function saveSetlistToDb() {
  if (!store.items.length) {
    saveMessageType.value = "error";
    saveMessage.value = "저장할 셋리스트가 없습니다.";
    return;
  }

  isSavingToDb.value = true;
  saveMessage.value = "";
  try {
    await $fetch(setlistApiUrl.value, {
      method: "POST",
      body: {
        items: store.items.map((item) => ({
          title: item.title,
          artist: item.artist,
          sessions: item.sessions ?? [],
        })),
      },
    });
    saveMessageType.value = "success";
    saveMessage.value = "공연 셋리스트가 DB에 저장되었습니다.";
  } catch {
    saveMessageType.value = "error";
    saveMessage.value = "DB 저장에 실패했습니다. 서버 상태를 확인해 주세요.";
  } finally {
    isSavingToDb.value = false;
  }
}

function addEtcDetail() {
  etcDetails.value.push("");
}

function removeEtcDetail(index: number) {
  if (etcDetails.value.length <= 1) return;
  etcDetails.value.splice(index, 1);
}

function addEditEtcDetail() {
  editDraft.etcDetails.push("");
}

function removeEditEtcDetail(index: number) {
  if (editDraft.etcDetails.length <= 1) return;
  editDraft.etcDetails.splice(index, 1);
}

watch(selectedSessions, (sessions) => {
  if (!sessions.includes("기타")) {
    etcDetails.value = [""];
  } else if (!etcDetails.value.length) {
    etcDetails.value = [""];
  }
});

watch(
  () => editDraft.selectedSessions,
  (sessions) => {
    if (!sessions.includes("기타")) {
      editDraft.etcDetails = [""];
    } else if (!editDraft.etcDetails.length) {
      editDraft.etcDetails = [""];
    }
  },
  { deep: true },
);
</script>
