<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 px-4 py-6 backdrop-blur-[2px]"
        role="dialog" aria-modal="true" :aria-labelledby="titleId" @click.self="close">
        <div
          class="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <button type="button"
            class="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500 hover:bg-slate-200"
            aria-label="닫기" @click="close">
            ✕
          </button>

          <div class="border-b border-slate-200 px-6 py-5 pr-12">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              가능 시간
            </p>
            <h2 :id="titleId" class="mt-1 text-lg font-bold text-slate-900">
              {{ memberName }}님의 스케줄
            </h2>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div v-if="!schedules.length"
              class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              선택한 가능 시간이 없습니다.
            </div>

            <template v-else>
              <ul class="mb-4 space-y-1.5 text-sm text-slate-700">
                <li v-for="group in rangeGroups" :key="group.day" class="flex gap-2">
                  <span class="w-6 shrink-0 font-semibold text-slate-900">
                    {{ group.day }}
                  </span>
                  <span>{{ group.ranges.join(", ") }}</span>
                </li>
              </ul>

              <div class="overflow-hidden rounded-2xl border border-slate-400 bg-white shadow-sm">
                <div class="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] sm:grid-cols-[58px_repeat(5,minmax(0,1fr))]">
                  <!-- 시간 헤더 -->
                  <div
                    class="border-b border-r border-slate-400 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-600">
                    시간
                  </div>

                  <!-- 요일 헤더 -->
                  <div v-for="(day, dayIndex) in weekdays" :key="`head-${day}`"
                    class="border-b border-slate-400 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700"
                    :class="dayIndex === weekdays.length - 1 ? '' : 'border-r'">
                    {{ day }}
                  </div>

                  <!-- 시간표 -->
                  <template v-for="(time, timeIndex) in timeSlots" :key="`row-${time}`">
                    <!-- 시간 -->
                    <div
                      class="border-r border-slate-300 bg-slate-50 px-1 py-1 text-center text-[11px] font-medium text-slate-500"
                      :class="timeIndex === timeSlots.length - 1 ? '' : 'border-b'">
                      {{ timeIndex % 2 === 0 ? time : "" }}
                    </div>

                    <!-- 시간 선택 셀 -->
                    <div v-for="day in weekdays" :key="`${day}-${time}`"
                      class="box-border h-6 border-b border-r border-slate-300 transition-colors duration-100" :class="isSelected(day, time)
                        ? 'bg-blue-200'
                        : 'bg-white hover:bg-slate-50'
                        " />
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  TEAM_WEEKDAYS,
  createTeamTimeSlots,
  groupTeamScheduleRanges,
  type TeamScheduleSlot,
} from "~/utils/teamForm";

const props = defineProps<{
  open: boolean;
  memberName: string;
  schedules: TeamScheduleSlot[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const titleId = useId();
const weekdays = TEAM_WEEKDAYS;
const timeSlots = createTeamTimeSlots();

const selectedKeys = computed(() => {
  const keys = new Set<string>();
  for (const item of props.schedules) {
    const day = String(item.dayOfWeek ?? "").trim();
    const time = String(item.startTime ?? "").trim().slice(0, 5);
    if (day && time) keys.add(`${day}-${time}`);
  }
  return keys;
});

const rangeGroups = computed(() => groupTeamScheduleRanges(props.schedules));

function isSelected(day: string, time: string) {
  return selectedKeys.value.has(`${day}-${time}`);
}

function close() {
  emit("close");
}

function onEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) {
    close();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!import.meta.client) return;
    if (isOpen) {
      window.addEventListener("keydown", onEscape);
      document.body.style.overflow = "hidden";
      return;
    }
    window.removeEventListener("keydown", onEscape);
    document.body.style.overflow = "";
  },
);

onUnmounted(() => {
  if (!import.meta.client) return;
  window.removeEventListener("keydown", onEscape);
  document.body.style.overflow = "";
});
</script>
