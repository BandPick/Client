<template>
  <div class="pb-12 font-sans text-slate-800">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">합주 스케줄 - 팀제용</h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
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

        <template v-if="!isEditing">
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isLoading || !events.length"
            @click="enterEditMode"
          >
            스케줄 수정
          </button>
        </template>
        <template v-else>
          <span v-if="isDirty" class="text-xs font-medium text-amber-600">
            저장되지 않은 변경사항이 있습니다
          </span>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSaving"
            @click="cancelEditMode"
          >
            취소
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!isDirty || isSaving"
            @click="saveScheduleBoard"
          >
            {{ isSaving ? "저장 중..." : "저장" }}
          </button>
        </template>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ errorMessage }}
    </p>

    <p
      v-if="isEditing"
      class="mb-3 text-xs text-slate-500"
    >
      수정 모드: 카드 위·아래로 시간을 조절하고, 본문을 드래그해 요일/시간을 옮길 수 있습니다.
    </p>

    <div class="mb-3 flex items-center gap-3">
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:bg-slate-50 disabled:opacity-40"
        :disabled="isEditing"
        @click="prevWeek"
      >
        ‹
      </button>
      <span class="text-sm font-semibold text-slate-700">{{ weekLabel }}</span>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:bg-slate-50 disabled:opacity-40"
        :disabled="isEditing"
        @click="nextWeek"
      >
        ›
      </button>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white">
      <div ref="boardScrollEl" class="max-h-[70vh] overflow-auto">
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
              :data-day="day.key"
              :data-slot="slot"
            >
              <template v-for="event in getEventsAt(day.key, slot)" :key="event.id">
                <div
                  v-if="visibleTeams.includes(event.teamId) && event.startHour === slot"
                  role="button"
                  tabindex="0"
                  class="absolute inset-x-1 top-0.5 z-10 overflow-hidden rounded-md px-2 py-1 text-left transition hover:brightness-95"
                  :class="[
                    isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                    resizing?.eventId === event.id || moving?.eventId === event.id
                      ? 'z-20 ring-2 ring-slate-400/50 brightness-95'
                      : '',
                  ]"
                  :style="getEventStyle(event)"
                  @click="onEventClick(event)"
                  @keydown.enter.prevent="selectEvent(event)"
                  @pointerdown="onCardPointerDown(event, $event)"
                >
                  <div
                    v-if="isEditing"
                    class="absolute inset-x-0 top-0 z-20 flex h-2.5 cursor-ns-resize items-start justify-center"
                    title="시작 시간 조절"
                    @pointerdown.stop.prevent="startResize(event, 'start', $event)"
                  >
                    <span
                      class="mt-0.5 h-0.5 w-6 rounded-full opacity-50"
                      :style="{ background: event.color }"
                    />
                  </div>

                  <div class="flex h-full flex-col gap-0.5 overflow-hidden" :class="isEditing ? 'pt-1' : ''">
                    <span class="truncate text-xs font-semibold">{{ event.title }}</span>
                    <span class="truncate text-[11px] opacity-75">
                      {{ formatTime(event.startHour) }} – {{ formatTime(event.endHour) }}
                    </span>
                    <span class="truncate text-[11px] opacity-75">
                      👥 {{ event.members.join(", ") }}
                    </span>
                  </div>

                  <div
                    v-if="isEditing"
                    class="absolute inset-x-0 bottom-0 z-20 flex h-2.5 cursor-ns-resize items-end justify-center"
                    title="종료 시간 조절"
                    @pointerdown.stop.prevent="startResize(event, 'end', $event)"
                  >
                    <span
                      class="mb-0.5 h-0.5 w-6 rounded-full opacity-50"
                      :style="{ background: event.color }"
                    />
                  </div>
                </div>
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

    <CommonAlertDialog
      :open="alertOpen"
      :type="alertType"
      :title="alertTitle"
      :message="alertMessage"
      @close="alertOpen = false"
      @confirm="alertOpen = false"
    />
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
  scheduleId?: number | null;
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

type ApiSaveResponse = {
  teamCount: number;
  eventCount: number;
  message: string;
  board: ApiBoard;
};

type ScheduleTeam = {
  id: number;
  name: string;
  color: string;
};

type ScheduleEvent = {
  id: number;
  scheduleId: number | null;
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
const isEditing = ref(false);
const isSaving = ref(false);
const isDirty = ref(false);
const errorMessage = ref("");
const teams = ref<ScheduleTeam[]>([]);
const events = ref<ScheduleEvent[]>([]);
const snapshotEvents = ref<ScheduleEvent[]>([]);
const dirtyTeamIds = ref<Set<number>>(new Set());
const visibleTeams = ref<number[]>([]);
const selectedEvent = ref<SelectedScheduleEvent | null>(null);
const weekOffset = ref(0);
const boardScrollEl = ref<HTMLElement | null>(null);

type ResizeEdge = "start" | "end";
type ResizeState = {
  eventId: number;
  edge: ResizeEdge;
  originY: number;
  originStart: number;
  originEnd: number;
  pointerId: number;
};
type MoveState = {
  eventId: number;
  originDay: string;
  originStart: number;
  originEnd: number;
  duration: number;
  pointerId: number;
};
const resizing = ref<ResizeState | null>(null);
const moving = ref<MoveState | null>(null);
const suppressClick = ref(false);

const alertOpen = ref(false);
const alertType = ref<"success" | "error">("error");
const alertTitle = ref("");
const alertMessage = ref("");

function showAlert(type: "success" | "error", title: string, message: string) {
  alertType.value = type;
  alertTitle.value = title;
  alertMessage.value = message;
  alertOpen.value = true;
}

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
  if (isEditing.value) return "수정 모드 · 변경 후 저장을 눌러 주세요.";
  return `팀 ${teams.value.length}개 · 일정 ${events.value.length}건`;
});

const weekStartDate = computed(() => {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay() || 7;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day + 1 + weekOffset.value * 7);
  return monday;
});

const weekDays = computed(() => {
  const now = new Date();
  return dayNames.map((key, i) => {
    const d = new Date(weekStartDate.value);
    d.setDate(weekStartDate.value.getDate() + i);
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

function formatWeekStartIso() {
  const d = weekStartDate.value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function cloneEvents(list: ScheduleEvent[]) {
  return list.map((event) => ({ ...event, members: [...event.members] }));
}

function applyBoard(result: ApiBoard, resetVisibility = false) {
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
    scheduleId: event.scheduleId ?? null,
    teamId: event.teamId,
    title: event.title,
    day: event.day,
    startHour: parseHour(event.startTime),
    endHour: parseHour(event.endTime),
    members: event.members ?? [],
    note: event.note ?? "",
    color: colorByTeamId.get(event.teamId) ?? TEAM_COLORS[0]!,
  }));

  if (resetVisibility || !visibleTeams.value.length) {
    visibleTeams.value = teams.value.map((team) => team.id);
  }
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

function onEventClick(event: ScheduleEvent) {
  if (suppressClick.value || resizing.value || moving.value) return;
  if (isEditing.value) return;
  selectEvent(event);
}

function snapHour(hour: number) {
  return Math.round(hour / SLOT_STEP) * SLOT_STEP;
}

function clampHour(hour: number, min: number, max: number) {
  return Math.min(max, Math.max(min, hour));
}

function markDirty(teamId?: number) {
  isDirty.value = true;
  if (teamId != null) {
    dirtyTeamIds.value.add(teamId);
  }
}

function updateEventPlacement(
  eventId: number,
  day: string,
  startHour: number,
  endHour: number,
) {
  const index = events.value.findIndex((event) => event.id === eventId);
  if (index < 0) return;
  const current = events.value[index]!;
  if (
    current.day === day &&
    current.startHour === startHour &&
    current.endHour === endHour
  ) {
    return;
  }
  events.value[index] = {
    ...current,
    day,
    startHour,
    endHour,
  };
  markDirty(current.teamId);

  if (selectedEvent.value?.id === eventId) {
    const dayInfo = weekDays.value.find((item) => item.key === day);
    selectedEvent.value = {
      ...selectedEvent.value,
      day,
      startHour,
      endHour,
      dayLabel: dayInfo ? `${dayInfo.name} (${dayInfo.date})` : "",
    };
  }
}

function startResize(event: ScheduleEvent, edge: ResizeEdge, pointerEvent: PointerEvent) {
  if (!isEditing.value) return;
  resizing.value = {
    eventId: event.id,
    edge,
    originY: pointerEvent.clientY,
    originStart: event.startHour,
    originEnd: event.endHour,
    pointerId: pointerEvent.pointerId,
  };
  suppressClick.value = false;
  window.addEventListener("pointermove", onResizeMove);
  window.addEventListener("pointerup", onResizeEnd);
  window.addEventListener("pointercancel", onResizeEnd);
}

function onResizeMove(pointerEvent: PointerEvent) {
  const state = resizing.value;
  if (!state || pointerEvent.pointerId !== state.pointerId) return;

  const deltaSlots = Math.round(
    (pointerEvent.clientY - state.originY) / SLOT_HEIGHT,
  );
  const deltaHours = deltaSlots * SLOT_STEP;

  let nextStart = state.originStart;
  let nextEnd = state.originEnd;

  if (state.edge === "start") {
    nextStart = clampHour(
      snapHour(state.originStart + deltaHours),
      START_HOUR,
      state.originEnd - SLOT_STEP,
    );
  } else {
    nextEnd = clampHour(
      snapHour(state.originEnd + deltaHours),
      state.originStart + SLOT_STEP,
      END_HOUR,
    );
  }

  if (deltaSlots !== 0) {
    suppressClick.value = true;
  }

  const current = events.value.find((event) => event.id === state.eventId);
  if (!current) return;
  updateEventPlacement(state.eventId, current.day, nextStart, nextEnd);
}

function onResizeEnd(pointerEvent: PointerEvent) {
  const state = resizing.value;
  if (!state || pointerEvent.pointerId !== state.pointerId) return;

  resizing.value = null;
  window.removeEventListener("pointermove", onResizeMove);
  window.removeEventListener("pointerup", onResizeEnd);
  window.removeEventListener("pointercancel", onResizeEnd);

  if (suppressClick.value) {
    window.setTimeout(() => {
      suppressClick.value = false;
    }, 0);
  }
}

function onCardPointerDown(event: ScheduleEvent, pointerEvent: PointerEvent) {
  if (!isEditing.value) return;
  if (pointerEvent.button !== 0) return;
  const target = pointerEvent.target as HTMLElement | null;
  if (target?.closest("[title='시작 시간 조절'], [title='종료 시간 조절']")) {
    return;
  }

  moving.value = {
    eventId: event.id,
    originDay: event.day,
    originStart: event.startHour,
    originEnd: event.endHour,
    duration: event.endHour - event.startHour,
    pointerId: pointerEvent.pointerId,
  };
  suppressClick.value = false;
  window.addEventListener("pointermove", onMoveMove);
  window.addEventListener("pointerup", onMoveEnd);
  window.addEventListener("pointercancel", onMoveEnd);
}

function findCellAtPoint(clientX: number, clientY: number) {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  const cell = el?.closest("[data-day][data-slot]") as HTMLElement | null;
  if (!cell) return null;
  const day = cell.dataset.day;
  const slotRaw = cell.dataset.slot;
  if (!day || slotRaw == null) return null;
  const slot = Number(slotRaw);
  if (!Number.isFinite(slot)) return null;
  return { day, slot };
}

function onMoveMove(pointerEvent: PointerEvent) {
  const state = moving.value;
  if (!state || pointerEvent.pointerId !== state.pointerId) return;

  const cell = findCellAtPoint(pointerEvent.clientX, pointerEvent.clientY);
  if (!cell) return;

  const duration = state.duration;
  let nextStart = clampHour(
    snapHour(cell.slot),
    START_HOUR,
    END_HOUR - duration,
  );
  const nextEnd = nextStart + duration;
  if (nextEnd > END_HOUR) {
    nextStart = END_HOUR - duration;
  }

  if (cell.day !== state.originDay || nextStart !== state.originStart) {
    suppressClick.value = true;
  }

  updateEventPlacement(state.eventId, cell.day, nextStart, nextEnd);
}

function onMoveEnd(pointerEvent: PointerEvent) {
  const state = moving.value;
  if (!state || pointerEvent.pointerId !== state.pointerId) return;

  moving.value = null;
  window.removeEventListener("pointermove", onMoveMove);
  window.removeEventListener("pointerup", onMoveEnd);
  window.removeEventListener("pointercancel", onMoveEnd);

  if (suppressClick.value) {
    window.setTimeout(() => {
      suppressClick.value = false;
    }, 0);
  }
}

function enterEditMode() {
  snapshotEvents.value = cloneEvents(events.value);
  dirtyTeamIds.value = new Set();
  isEditing.value = true;
  isDirty.value = false;
  selectedEvent.value = null;
  errorMessage.value = "";
}

async function cancelEditMode() {
  events.value = cloneEvents(snapshotEvents.value);
  dirtyTeamIds.value = new Set();
  isEditing.value = false;
  isDirty.value = false;
  resizing.value = null;
  moving.value = null;
}

function prevWeek() {
  if (isEditing.value) return;
  weekOffset.value -= 1;
}

function nextWeek() {
  if (isEditing.value) return;
  weekOffset.value += 1;
}

function extractApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) return data;
  }
  return fallback;
}

async function loadScheduleBoard() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const result = await $fetch<ApiBoard>(scheduleBoardApiUrl.value, {
      method: "GET",
    });
    applyBoard(result, true);
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

async function saveScheduleBoard() {
  if (!isDirty.value || isSaving.value) return;
  isSaving.value = true;
  errorMessage.value = "";

  try {
    const dirtyIds = dirtyTeamIds.value;
    const response = await $fetch<ApiSaveResponse>(scheduleBoardApiUrl.value, {
      method: "PUT",
      body: {
        weekStartDate: formatWeekStartIso(),
        events: events.value
          .filter((event) => dirtyIds.has(event.teamId))
          .map((event) => ({
            teamId: event.teamId,
            day: event.day,
            startTime: formatTime(event.startHour),
            endTime: formatTime(event.endHour),
          })),
      },
    });

    applyBoard(response.board ?? { teams: [], events: [] });
    snapshotEvents.value = cloneEvents(events.value);
    dirtyTeamIds.value = new Set();
    isDirty.value = false;
    isEditing.value = false;
    showAlert(
      "success",
      "저장 완료",
      response.message ||
        `팀 ${response.teamCount}개, 일정 ${response.eventCount}건을 저장했습니다.`,
    );
  } catch (error) {
    showAlert(
      "error",
      "저장 실패",
      extractApiErrorMessage(
        error,
        "스케줄 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    );
  } finally {
    isSaving.value = false;
  }
}

function clearInteractionListeners() {
  window.removeEventListener("pointermove", onResizeMove);
  window.removeEventListener("pointerup", onResizeEnd);
  window.removeEventListener("pointercancel", onResizeEnd);
  window.removeEventListener("pointermove", onMoveMove);
  window.removeEventListener("pointerup", onMoveEnd);
  window.removeEventListener("pointercancel", onMoveEnd);
}

onMounted(() => {
  loadScheduleBoard();
});

onBeforeUnmount(() => {
  clearInteractionListeners();
});
</script>
