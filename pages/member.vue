<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <section
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      <div class="flex items-start justify-between gap-4">
        <h1
          class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          공연 참가 정보 입력
        </h1>
        <div
          class="hidden text-right text-xs font-medium text-slate-500 sm:block"
        >
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
            <div class="space-y-4">
              <div
                v-for="(pick, index) in form.picks"
                :key="`pick-${index}`"
                class="py-1"
              >
                <div class="grid grid-cols-[auto_1fr] items-center gap-2">
                  <span
                    class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600"
                  >
                    {{ labels[index] }}
                  </span>
                  <select
                    v-model="pick.songId"
                    @change="syncPickSessions(index)"
                    class="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">곡 선택</option>
                    <option
                      v-for="song in songs"
                      :key="song.id"
                      :value="song.id"
                    >
                      {{ song.title }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="pick.songId"
                  class="mt-1.5 flex flex-wrap gap-2 pl-12 sm:pl-14"
                >
                  <button
                    v-for="session in getDisplaySessionsForSong(pick.songId)"
                    :key="`${pick.songId}-${session}`"
                    type="button"
                    class="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm"
                    :class="
                      pick.sessions.includes(session)
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    "
                    @click="toggleSession(index, session)"
                  >
                    {{ getSessionLabel(pick.songId, session) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <p class="mb-2 text-base font-semibold text-slate-800 sm:text-lg">
            합주 가능 시간대 선택
          </p>
          <div
            class="w-full overflow-hidden rounded-2xl border border-slate-200"
          >
            <div
              class="grid grid-cols-[58px_repeat(5,minmax(0,1fr))] sm:grid-cols-[64px_repeat(5,minmax(0,1fr))]"
            >
              <div
                class="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500"
              >
                시간
              </div>
              <div
                v-for="(day, dayIndex) in days"
                :key="`head-${day}`"
                class="border-b border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-600"
                :class="dayIndex === days.length - 1 ? '' : 'border-r'"
              >
                {{ day }}
              </div>

              <template
                v-for="(time, timeIndex) in timeSlots"
                :key="`row-${time}`"
              >
                <div
                  class="sticky left-0 z-10 border-r border-slate-200 bg-white px-2 py-2 text-center text-xs font-medium text-slate-500"
                  :class="timeIndex === timeSlots.length - 1 ? '' : 'border-b'"
                >
                  {{ timeIndex % 2 === 0 ? time : "" }}
                </div>
                <button
                  v-for="(day, dayIndex) in days"
                  :key="`${day}-${time}`"
                  type="button"
                  class="h-9 border-slate-200 transition-colors"
                  :class="[
                    dayIndex === days.length - 1 ? '' : 'border-r',
                    timeIndex === timeSlots.length - 1 ? '' : 'border-b',
                    isSelectedSlot(day, time)
                      ? 'bg-blue-100 hover:bg-blue-200'
                      : 'bg-white hover:bg-slate-100',
                  ]"
                  @mousedown.prevent="startDrag(day, time)"
                  @mouseenter="handleDragEnter(day, time)"
                  @click="handleCellClick(day, time)"
                />
              </template>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              class="ml-auto shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="resetSlots"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      <div
        class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          로그인 화면으로
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          데이터 저장하기
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { songCatalog, type SessionCode } from "~/composables/useSessionCatalog";

type Pick = {
  songId: string;
  sessions: SessionCode[];
};

const labels = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const days = ["월", "화", "수", "목", "금"];
const songs = songCatalog;
const defaultPercussionLabels: Record<string, string> = {
  ditto: "코러스-1",
  "every-moment": "쉐이커",
};
const percussionLabels = useState<Record<string, string>>(
  "adminPercussionLabels",
  () => ({ ...defaultPercussionLabels }),
);
for (const [songId, label] of Object.entries(defaultPercussionLabels)) {
  if (!percussionLabels.value[songId]?.trim()) {
    percussionLabels.value[songId] = label;
  }
}

const form = reactive({
  picks: labels.map((_, idx): Pick => {
    if (idx === 0) return { songId: "hype-boy", sessions: ["K1"] };
    if (idx === 1) return { songId: "ditto", sessions: ["V"] };
    return { songId: "", sessions: [] };
  }),
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

function getSessionsForSong(songId: string): SessionCode[] {
  const song = songs.find((item) => item.id === songId);
  return song?.requiredSessions ?? [];
}

function isEtcEnabled(songId: string) {
  const custom = percussionLabels.value[songId]?.trim();
  return Boolean(custom);
}

function getDisplaySessionsForSong(songId: string): SessionCode[] {
  return getSessionsForSong(songId).filter((session) => {
    if (session !== "기타") return true;
    return isEtcEnabled(songId);
  });
}

function getSessionLabel(songId: string, session: SessionCode) {
  if (session !== "기타") return session;
  const custom = percussionLabels.value[songId]?.trim();
  return custom ? `기타 (${custom})` : "";
}

function syncPickSessions(index: number) {
  const pick = form.picks[index];
  if (!pick) return;
  const availableSessions = getDisplaySessionsForSong(pick.songId);
  pick.sessions = pick.sessions.filter((session) =>
    availableSessions.includes(session),
  );
}

function toggleSession(index: number, session: SessionCode) {
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

watch(
  () => percussionLabels.value,
  () => {
    form.picks.forEach((_, index) => syncPickSessions(index));
  },
  { deep: true },
);

onMounted(() => {
  window.addEventListener("mouseup", finishDrag);
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", finishDrag);
  if (countdownTimer) clearInterval(countdownTimer);
});

useHead({
  title: "BandPick 부원",
});
</script>
