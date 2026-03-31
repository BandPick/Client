<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        공연 참가 정보 입력
      </h1>

      <div class="mt-6 grid gap-6 lg:mt-8 lg:gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div class="space-y-5 sm:space-y-6 min-w-0">
          <div>
            <p class="mb-3 text-sm font-semibold text-slate-800">희망 곡 및 세션 (1~6지망)</p>
            <div class="space-y-4">
              <div
                v-for="(pick, index) in form.picks"
                :key="`pick-${index}`"
                class="py-1"
              >
                <div class="grid grid-cols-[auto_1fr] items-center gap-2">
                  <span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
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

                <div v-if="pick.songId" class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="session in getSessionsForSong(pick.songId)"
                      :key="`${pick.songId}-${session}`"
                      type="button"
                      class="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm"
                      :class="pick.sessions.includes(session)
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'"
                      @click="toggleSession(index, session)"
                    >
                      {{ session }}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <p class="mb-2 text-sm font-semibold text-slate-800">합주 가능 시간대 선택</p>
          <div class="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200">
            <div class="grid min-w-[620px] grid-cols-[64px_repeat(7,minmax(76px,1fr))] sm:min-w-[680px] sm:grid-cols-[70px_repeat(7,minmax(84px,1fr))]">
              <div class="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500">
                시간
              </div>
              <div
                v-for="day in days"
                :key="`head-${day}`"
                class="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-600 last:border-r-0"
              >
                {{ day }}
              </div>

              <template v-for="time in timeSlots" :key="`row-${time}`">
                <div class="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-2 py-2 text-center text-xs font-medium text-slate-500">
                  {{ time }}
                </div>
                <button
                  v-for="day in days"
                  :key="`${day}-${time}`"
                  type="button"
                  class="h-9 border-b border-r border-slate-200 transition-colors last:border-r-0"
                  :class="isSelectedSlot(day, time) ? 'bg-blue-100 hover:bg-blue-200' : 'bg-white hover:bg-slate-100'"
                  @click="toggleSlot(day, time)"
                />
              </template>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              class="ml-auto shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="resetSlots"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
type Song = {
  id: string;
  title: string;
  requiredSessions: string[];
};

type Pick = {
  songId: string;
  sessions: string[];
};

const labels = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const days = ["월", "화", "수", "목", "금", "토", "일"];
const songs: Song[] = [
  {
    id: "hype-boy",
    title: "Hype Boy - NewJeans",
    requiredSessions: ["보컬", "K1", "K2", "베이스", "드럼", "코러스"],
  },
  {
    id: "ditto",
    title: "Ditto - NewJeans",
    requiredSessions: ["보컬", "EG1", "EG2", "베이스", "드럼", "기타 타악기"],
  },
  {
    id: "supernova",
    title: "Supernova - aespa",
    requiredSessions: ["보컬", "K1", "K2", "베이스", "드럼", "코러스"],
  },
  {
    id: "every-moment",
    title: "너의 모든 순간 - 성시경",
    requiredSessions: ["보컬", "어쿠스틱 기타", "K1", "베이스", "드럼"],
  },
  {
    id: "time-walk",
    title: "시간을 걷는 소년 - 넬",
    requiredSessions: ["보컬", "EG1", "EG2", "베이스", "드럼", "코러스"],
  },
];

const form = reactive({
  picks: labels.map((_, idx): Pick => {
    if (idx === 0) return { songId: "hype-boy", sessions: ["K1"] };
    if (idx === 1) return { songId: "ditto", sessions: ["보컬"] };
    return { songId: "", sessions: [] };
  }),
});

const selectedSlots = ref<Set<string>>(new Set());

const timeSlots = computed(() => {
  const slots: string[] = [];
  for (let hour = 9; hour < 22; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
});

function getSessionsForSong(songId: string) {
  const song = songs.find((item) => item.id === songId);
  return song?.requiredSessions ?? [];
}

function syncPickSessions(index: number) {
  const pick = form.picks[index];
  if (!pick) return;
  const availableSessions = getSessionsForSong(pick.songId);
  pick.sessions = pick.sessions.filter((session) => availableSessions.includes(session));
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

function toggleSlot(day: string, time: string) {
  const key = slotKey(day, time);
  const next = new Set(selectedSlots.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  selectedSlots.value = next;
}

function resetSlots() {
  selectedSlots.value = new Set();
}

useHead({
  title: "BandPick 부원",
});
</script>
