<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          공연 참가 정보 입력
        </h1>
        <div class="hidden text-right text-xs font-medium text-slate-500 sm:block">
          <p>신청 마감 시간 {{ deadlineDisplay }}</p>
          <p class="mt-0.5">신청 마감까지 {{ timeRemainingLabel }}</p>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:mt-8 lg:gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div class="space-y-5 sm:space-y-6 min-w-0">
          <div>
            <p class="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
              희망 곡 및 세션 (1~6지망)
            </p>
            <p v-if="setlistError"
              class="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {{ setlistError }}
            </p>
            <div class="space-y-4">
              <div v-for="(pick, index) in form.picks" :key="`pick-${index}`" class="py-1">
                <div class="grid grid-cols-[auto_1fr] items-center gap-2">
                  <span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                    {{ labels[index] }}
                  </span>
                  <select v-model="pick.songId" :disabled="setlistLoading" @change="syncPickSessions(index)"
                    class="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
                    <option value="">
                      {{
                        setlistLoading
                          ? "공연 곡 목록 불러오는 중…"
                          : songs.length
                            ? "곡 선택"
                            : "등록된 공연 곡이 없습니다 (관리자 설정에서 셋리스트를 저장해 주세요)"
                      }}
                    </option>
                    <option v-for="song in songs" :key="song.id" :value="song.id">
                      {{ song.displayTitle }}
                    </option>
                  </select>
                </div>

                <div v-if="pick.songId"
                  class="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-3 pl-12 sm:pl-14">
                  <div class="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div>
                      <p class="text-xs font-semibold text-slate-800">
                        희망 세션
                        <span class="font-normal text-slate-500">(복수 선택)</span>
                      </p>
                    </div>
                  </div>

                  <div v-if="getDisplaySessionsForSong(pick.songId).length" class="flex flex-wrap gap-2">
                    <button v-for="session in getDisplaySessionsForSong(pick.songId)" :key="`${pick.songId}-${session}`"
                      type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm"
                      :class="pick.sessions.includes(session)
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                        " @click="toggleSession(index, session)">
                      {{ getSessionLabel(pick.songId, session) }}
                    </button>
                  </div>
                  <p v-else class="text-xs text-amber-800">
                    이 곡에는 등록된 세션이 없습니다. 관리자 설정의 공연 셋리스트에서 세션 구성을 저장했는지 확인해 주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <p class="mb-2 text-base font-semibold text-slate-800 sm:text-lg">
            합주 가능 시간대 선택
          </p>
          <div class="w-full overflow-hidden rounded-2xl border border-slate-200">
            <div class="grid grid-cols-[58px_repeat(5,minmax(0,1fr))] sm:grid-cols-[64px_repeat(5,minmax(0,1fr))]">
              <div
                class="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500">
                시간
              </div>
              <div v-for="(day, dayIndex) in days" :key="`head-${day}`"
                class="border-b border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-600"
                :class="dayIndex === days.length - 1 ? '' : 'border-r'">
                {{ day }}
              </div>

              <template v-for="(time, timeIndex) in timeSlots" :key="`row-${time}`">
                <div
                  class="sticky left-0 z-10 border-r border-slate-200 bg-white px-2 py-2 text-center text-xs font-medium text-slate-500"
                  :class="timeIndex === timeSlots.length - 1 ? '' : 'border-b'">
                  {{ timeIndex % 2 === 0 ? time : "" }}
                </div>
                <button v-for="(day, dayIndex) in days" :key="`${day}-${time}`" type="button"
                  class="h-9 border-slate-200 transition-colors" :class="[
                    dayIndex === days.length - 1 ? '' : 'border-r',
                    timeIndex === timeSlots.length - 1 ? '' : 'border-b',
                    isSelectedSlot(day, time)
                      ? 'bg-blue-100 hover:bg-blue-200'
                      : 'bg-white hover:bg-slate-100',
                  ]" @mousedown.prevent="startDrag(day, time)" @mouseenter="handleDragEnter(day, time)"
                  @click="handleCellClick(day, time)" />
              </template>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between gap-3">
            <button type="button"
              class="ml-auto shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="resetSlots">
              초기화
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink to="/"
          class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          로그인 화면으로
        </NuxtLink>
        <button type="button" :disabled="saving"
          class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          @click="handleSave">
          {{ saving ? "저장 중…" : "데이터 저장하기" }}
        </button>
      </div>
      <p v-if="saveMessage"
        class="mt-3 rounded-lg border px-3 py-2 text-sm"
        :class="saveError
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'">
        {{ saveMessage }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  type MemberSetlistSong,
  useMemberSetlistLoader,
} from "~/composables/useMemberSetlistLoader";
import {
  buildMemberFormAvailabilities,
  buildMemberFormPicks,
  getScheduleWeekStart,
} from "~/composables/useMemberFormPayload";
import { useMemberFormApi } from "~/composables/useMemberFormApi";
import { useAuthApi, type LoginUser } from "~/composables/useAuthApi";

type Pick = {
  songId: string;
  sessions: string[];
};

const labels = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const days = ["월", "화", "수", "목", "금"];
const songs = ref<MemberSetlistSong[]>([]);
const setlistLoading = ref(true);
const setlistError = ref("");
const saving = ref(false);
const saveMessage = ref("");
const saveError = ref(false);
const authUser = ref<LoginUser | null>(null);
const { loadSongsForMemberForm } = useMemberSetlistLoader();
const { saveMemberForm } = useMemberFormApi();
const { loadAuthUser } = useAuthApi();

const form = reactive({
  picks: labels.map((): Pick => ({ songId: "", sessions: [] })),
});

const selectedSlots = ref<Set<string>>(new Set());
const isDragging = ref(false);
const dragDay = ref<string | null>(null);
const dragMode = ref<"select" | "deselect">("select");
const movedWhileDragging = ref(false);
const suppressClickKey = ref<string | null>(null);
const deadlineAt = new Date("2026-04-05T22:00:00");
const nowMs = ref(Date.now());
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const timeSlots = computed(() => {
  const slots: string[] = [];
  for (let hour = 9; hour < 22; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
});

const deadlineDisplay = computed(() => {
  const month = String(deadlineAt.getMonth() + 1).padStart(2, "0");
  const day = String(deadlineAt.getDate()).padStart(2, "0");
  const hour = String(deadlineAt.getHours()).padStart(2, "0");
  const minute = String(deadlineAt.getMinutes()).padStart(2, "0");
  return `${deadlineAt.getFullYear()}-${month}-${day} ${hour}:${minute}`;
});

const timeRemainingLabel = computed(() => {
  const diffMs = deadlineAt.getTime() - nowMs.value;
  if (diffMs <= 0) return "마감됨";
  const totalSeconds = Math.floor(diffMs / 1000);
  const daysLeft = Math.floor(totalSeconds / 86400);
  const hoursLeft = Math.floor((totalSeconds % 86400) / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;
  if (daysLeft > 0) {
    return `${daysLeft}일 ${hoursLeft}시간 ${minutesLeft}분`;
  }
  return `${hoursLeft}시간 ${minutesLeft}분 ${secondsLeft}초`;
});

function getSessionsForSong(songId: string): string[] {
  const song = songs.value.find((item) => item.id === songId);
  return song?.sessions ?? [];
}

function getDisplaySessionsForSong(songId: string): string[] {
  return getSessionsForSong(songId);
}

function getSessionLabel(_songId: string, session: string) {
  const m = session.match(/^기타\((.*)\)$/);
  if (m) {
    const inner = (m[1] ?? "").trim();
    return inner ? `기타 (${inner})` : "기타";
  }
  return session;
}

function syncPickSessions(index: number) {
  const pick = form.picks[index];
  if (!pick) return;
  const availableSessions = getDisplaySessionsForSong(pick.songId);
  pick.sessions = pick.sessions.filter((session) =>
    availableSessions.includes(session),
  );
}

function toggleSession(index: number, session: string) {
  const pick = form.picks[index];
  if (!pick?.songId) return;
  if (pick.sessions.includes(session)) {
    pick.sessions = pick.sessions.filter((item) => item !== session);
    return;
  }
  pick.sessions = [...pick.sessions, session];
}

function slotKey(day: string, time: string) {
  return `${day}-${time}`;
}

function isSelectedSlot(day: string, time: string) {
  return selectedSlots.value.has(slotKey(day, time));
}

function setSlot(day: string, time: string, selected: boolean) {
  const key = slotKey(day, time);
  const next = new Set(selectedSlots.value);
  if (selected) {
    next.add(key);
  } else {
    next.delete(key);
  }
  selectedSlots.value = next;
}

function toggleSlot(day: string, time: string) {
  const key = slotKey(day, time);
  setSlot(day, time, !selectedSlots.value.has(key));
}

function startDrag(day: string, time: string) {
  isDragging.value = true;
  movedWhileDragging.value = false;
  dragDay.value = day;
  dragMode.value = isSelectedSlot(day, time) ? "deselect" : "select";
  setSlot(day, time, dragMode.value === "select");
}

function handleDragEnter(day: string, time: string) {
  if (!isDragging.value || dragDay.value !== day) return;
  movedWhileDragging.value = true;
  setSlot(day, time, dragMode.value === "select");
}

function finishDrag() {
  if (!isDragging.value) return;
  if (movedWhileDragging.value && dragDay.value) {
    suppressClickKey.value = dragDay.value;
  }
  isDragging.value = false;
  movedWhileDragging.value = false;
  dragDay.value = null;
}

function handleCellClick(day: string, time: string) {
  if (suppressClickKey.value === day) {
    suppressClickKey.value = null;
    return;
  }
  toggleSlot(day, time);
}

function resetSlots() {
  selectedSlots.value = new Set();
}

function validateSaveForm(): string {
  if (!authUser.value) {
    return "로그인 정보가 없습니다. 로그인 화면에서 다시 로그인해 주세요.";
  }

  const picks = buildMemberFormPicks(form.picks);
  if (!picks.length) {
    return "희망 곡과 세션을 최소 1개 이상 선택해 주세요.";
  }

  const hasPickWithoutSession = form.picks.some(
    (pick) => pick.songId && !pick.sessions.length,
  );
  if (hasPickWithoutSession) {
    return "곡을 선택한 경우 희망 세션도 함께 선택해 주세요.";
  }

  const availabilities = buildMemberFormAvailabilities(
    selectedSlots.value,
    timeSlots.value,
    getScheduleWeekStart(deadlineAt),
  );
  if (!availabilities.length) {
    return "합주 가능 시간대를 최소 1개 이상 선택해 주세요.";
  }

  return "";
}

async function handleSave() {
  saveMessage.value = "";
  saveError.value = false;

  const validationError = validateSaveForm();
  if (validationError) {
    saveMessage.value = validationError;
    saveError.value = true;
    return;
  }

  const user = authUser.value!;
  const picks = buildMemberFormPicks(form.picks);
  const availabilities = buildMemberFormAvailabilities(
    selectedSlots.value,
    timeSlots.value,
    getScheduleWeekStart(deadlineAt),
  );

  saving.value = true;
  try {
    const response = await saveMemberForm(user.id, {
      userId: user.id,
      picks,
      availabilities,
    });
    saveMessage.value = response.message || "저장이 완료되었습니다.";
    saveError.value = false;
  } catch (error: unknown) {
    saveError.value = true;
    if (error && typeof error === "object" && "data" in error) {
      const data = (error as { data?: unknown }).data;
      if (typeof data === "string" && data.trim()) {
        saveMessage.value = data;
        return;
      }
    }
    saveMessage.value =
      "저장에 실패했습니다. 입력값과 서버 연결 상태를 확인해 주세요.";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  authUser.value = loadAuthUser();
  if (!authUser.value) {
    saveMessage.value = "로그인이 필요합니다. 로그인 화면에서 다시 로그인해 주세요.";
    saveError.value = true;
  }

  setlistLoading.value = true;
  setlistError.value = "";
  try {
    songs.value = await loadSongsForMemberForm();
  } catch {
    setlistError.value =
      "공연 셋리스트를 불러오지 못했습니다. 네트워크와 서버 주소(NUXT_PUBLIC_API_BASE)를 확인해 주세요.";
    songs.value = [];
  } finally {
    setlistLoading.value = false;
  }

  window.addEventListener("mouseup", finishDrag);
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", finishDrag);
  if (countdownTimer) clearInterval(countdownTimer);
});

watch(
  songs,
  () => {
    form.picks.forEach((_, index) => syncPickSessions(index));
  },
  { deep: true },
);

useHead({
  title: "BandPick 부원",
});
</script>
