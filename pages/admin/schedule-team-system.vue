<template>
  <div class="pb-12 font-sans text-slate-800">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">합주 스케줄 - 팀제용</h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ subtitle }}
        </p>
      </div>

      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="isTeamListOpen = !isTeamListOpen"
        >
          팀 목록 ({{ visibleTeams.length }})
          <span class="text-xs">{{ isTeamListOpen ? "▲" : "▼" }}</span>
        </button>

        <Transition
          enter-active-class="transition duration-150"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isTeamListOpen"
            class="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            <div class="flex flex-col gap-2">
              <div
                v-for="team in teams"
                :key="team.id"
                class="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 transition hover:bg-slate-50"
                @click="toggleTeam(team.id)"
              >
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: team.color }" />
                  <span class="text-sm text-slate-700">
                    {{ team.name }}
                  </span>
                </div>
                <div
                  class="flex h-4 w-4 items-center justify-center rounded border text-[10px]"
                  :class="
                    visibleTeams.includes(team.id)
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-300 bg-white'
                  "
                >
                  <span v-if="visibleTeams.includes(team.id)">✓</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ errorMessage }}
    </p>

    <div class="mb-3 flex items-center gap-3">
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:bg-slate-50"
        @click="prevWeek"
      >
        ‹
      </button>
      <span class="text-sm font-semibold text-slate-700">{{ weekLabel }}</span>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:bg-slate-50"
        @click="nextWeek"
      >
        ›
      </button>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="max-h-[70vh] overflow-auto">
        <div class="grid min-w-[640px] grid-cols-[52px_repeat(5,minmax(0,1fr))]">
          <div class="border-b border-slate-200 bg-slate-50" />

          <div
            v-for="day in weekDays"
            :key="day.key"
            :class="[
              'flex items-center justify-center gap-1 border-b border-l border-slate-200 py-2 text-xs',
              day.isToday ? 'bg-rose-50' : 'bg-slate-50',
            ]"
          >
            <span
              class="text-sm font-semibold"
              :class="day.isToday ? 'text-rose-500' : 'text-slate-700'"
            >
              {{ day.name }}
            </span>
            <span
              class="text-[14px]"
              :class="day.isToday ? 'text-rose-400' : 'text-slate-400'"
            >
              ({{ day.date }})
            </span>
          </div>

          <template v-for="slot in timeSlots" :key="slot">
            <div
              class="flex h-10 items-start justify-center border-b border-slate-100 px-2 pt-1.5 text-[11px] text-slate-400"
            >
              {{ formatTime(slot) }}
            </div>

            <div
              v-for="day in weekDays"
              :key="day.key"
              class="relative h-10 border-b border-l border-slate-100"
              :class="day.isToday ? 'bg-rose-50/40' : 'bg-white hover:bg-slate-50/50'"
            >
              <template v-for="event in getEventsAt(day.key, slot)" :key="event.id">
                <button
                  v-if="visibleTeams.includes(event.teamId) && event.startHour === slot"
                  type="button"
                  class="absolute inset-x-1 top-0.5 z-10 overflow-hidden rounded-md px-2 py-1 text-left transition hover:brightness-95"
                  :style="getEventStyle(event)"
                  @click="selectEvent(event)"
                >
                  <div class="flex flex-col gap-0.5 overflow-hidden">
                    <span class="truncate text-xs font-semibold">{{ event.title }}</span>
                    <span class="truncate text-[11px] opacity-75">
                      👥 {{ event.members.join(", ") }}
                    </span>
                  </div>
                </button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>

    <p
      v-if="!isLoading && !events.length && !errorMessage"
      class="mt-4 text-center text-sm text-slate-500"
    >
      표시할 팀제 합주 일정이 없습니다. 팀 매칭-팀제용에서 배정을 저장해 주세요.
    </p>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="selectedEvent"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
        @click.self="selectedEvent = null"
      >
        <div
          class="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          :style="{ borderTop: `4px solid ${selectedEvent.color}` }"
        >
          <button
            type="button"
            class="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500 hover:bg-slate-200"
            @click="selectedEvent = null"
          >
            ✕
          </button>

          <h2 class="mb-4 text-xl font-bold text-slate-900">{{ selectedEvent.title }}</h2>

          <div class="space-y-2 text-sm text-slate-700">
            <div class="flex items-start gap-2">
              <span>📅</span>
              <span>
                {{ selectedEvent.dayLabel }}
                {{ formatTime(selectedEvent.startHour) }} –
                {{ formatTime(selectedEvent.endHour) }}
              </span>
            </div>
            <div class="flex items-start gap-2">
              <span>👥</span>
              <span>{{ selectedEvent.members.join(", ") }}</span>
            </div>
          </div>

          <div
            v-if="selectedEvent.note"
            class="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500"
          >
            {{ selectedEvent.note }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });
useHead({ title: "합주 스케줄-팀제용 — BandPick" });

const TEAM_COLORS = [
  "#f87171",
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#38bdf8",
  "#c084fc",
] as const;

type ApiTeam = {
  id: number;
  name: string;
  confirmed: boolean;
  members: string[];
};

type ApiEvent = {
  id: number;
  teamId: number;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  members: string[];
  note: string;
};

type ApiBoard = {
  teams: ApiTeam[];
  events: ApiEvent[];
};

type ScheduleTeam = {
  id: number;
  name: string;
  color: string;
};

type ScheduleEvent = {
  id: number;
  teamId: number;
  title: string;
  day: string;
  startHour: number;
  endHour: number;
  members: string[];
  note: string;
  color: string;
};

type SelectedScheduleEvent = ScheduleEvent & { dayLabel: string };

const config = useRuntimeConfig();
const isTeamListOpen = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");
const teams = ref<ScheduleTeam[]>([]);
const events = ref<ScheduleEvent[]>([]);
const visibleTeams = ref<number[]>([]);
const selectedEvent = ref<SelectedScheduleEvent | null>(null);
const weekOffset = ref(0);

const dayNames = ["mon", "tue", "wed", "thu", "fri"] as const;
const dayLabels: Record<string, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
};
const SLOT_STEP = 0.5;
const SLOT_HEIGHT = 40;
const START_HOUR = 9;
const END_HOUR = 22;
const timeSlots = Array.from(
  { length: (END_HOUR - START_HOUR) / SLOT_STEP },
  (_, i) => START_HOUR + i * SLOT_STEP,
);

const scheduleBoardApiUrl = computed(() => {
  const host = String(config.public.apiBase).replace(/\/$/, "");
  return `${host}/api/v1/team-forms/schedule-board`;
});

const subtitle = computed(() => {
  if (isLoading.value) return "일정을 불러오는 중...";
  if (!teams.value.length) return "저장된 팀제 배정이 없습니다.";
  return `팀 ${teams.value.length}개 · 일정 ${events.value.length}건`;
});

const weekDays = computed(() => {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay() || 7;
  monday.setDate(now.getDate() - day + 1 + weekOffset.value * 7);

  return dayNames.map((key, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday =
      d.toDateString() === now.toDateString() && weekOffset.value === 0;
    return {
      key,
      name: dayLabels[key],
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday,
    };
  });
});

const weekLabel = computed(() => {
  const first = weekDays.value[0];
  const last = weekDays.value[4];
  if (!first || !last) return "";
  return `${first.date} – ${last.date}`;
});

function parseHour(time: string) {
  const [hourText = "0", minuteText = "0"] = String(time).slice(0, 5).split(":");
  return Number(hourText) + Number(minuteText) / 60;
}

function formatTime(hour: number) {
  const h = Math.floor(hour);
  let m = Math.round((hour - h) * 60);
  let normalizedHour = h;
  if (m >= 60) {
    normalizedHour += 1;
    m = 0;
  }
  return `${String(normalizedHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getEventsAt(day: string, hour: number) {
  return events.value.filter(
    (event) => event.day === day && hour >= event.startHour && hour < event.endHour,
  );
}

function getEventStyle(event: ScheduleEvent) {
  const duration = event.endHour - event.startHour;
  const slotCount = duration / SLOT_STEP;
  return {
    height: `${slotCount * SLOT_HEIGHT - 4}px`,
    background: `${event.color}28`,
    borderLeft: `3px solid ${event.color}`,
    color: event.color,
  };
}

function toggleTeam(id: number) {
  if (visibleTeams.value.includes(id)) {
    visibleTeams.value = visibleTeams.value.filter((teamId) => teamId !== id);
  } else {
    visibleTeams.value.push(id);
  }
}

function selectEvent(event: ScheduleEvent) {
  const dayInfo = weekDays.value.find((day) => day.key === event.day);
  selectedEvent.value = {
    ...event,
    dayLabel: dayInfo ? `${dayInfo.name} (${dayInfo.date})` : "",
  };
}

function prevWeek() {
  weekOffset.value -= 1;
}

function nextWeek() {
  weekOffset.value += 1;
}

async function loadScheduleBoard() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const result = await $fetch<ApiBoard>(scheduleBoardApiUrl.value, {
      method: "GET",
    });

    const colorByTeamId = new Map<number, string>();
    teams.value = (result.teams ?? []).map((team, index) => {
      const color = TEAM_COLORS[index % TEAM_COLORS.length]!;
      colorByTeamId.set(team.id, color);
      return {
        id: team.id,
        name: team.name,
        color,
      };
    });

    events.value = (result.events ?? []).map((event) => ({
      id: event.id,
      teamId: event.teamId,
      title: event.title,
      day: event.day,
      startHour: parseHour(event.startTime),
      endHour: parseHour(event.endTime),
      members: event.members ?? [],
      note: event.note ?? "",
      color: colorByTeamId.get(event.teamId) ?? TEAM_COLORS[0]!,
    }));

    visibleTeams.value = teams.value.map((team) => team.id);
  } catch {
    teams.value = [];
    events.value = [];
    visibleTeams.value = [];
    errorMessage.value =
      "팀제 합주 스케줄을 불러오지 못했습니다. 서버와 API 경로를 확인해 주세요.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadScheduleBoard();
});
</script>
