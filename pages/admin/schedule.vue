<template>
 <div class="pb-12 font-sans text-slate-800">
  <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
   <div>
    <h1 class="text-2xl font-bold text-slate-900">합주 스케줄</h1>
    <p class="mt-1 text-sm text-slate-500">이번 주 합주 일정입니다.</p>
   </div>

   <div class="relative">
    <button @click="isTeamListOpen = !isTeamListOpen"
     class="flex items-center gap-2 rounded-md border-slate-300 bg-white px-3 py-1.6 text-sm font-medium text-slate-700 hover:bg-slate-50">
     곡 목록 ({{ visibleTeams.length }})
     <span class="text-xs">{{ isTeamListOpen ? '▲' : '▼' }}</span>
    </button>

    <Transition enter-active-class="transition duration-150" enter-from-class="opacaity-0 scale-95"
     enter-to-class="opcaity-100 scale-100" leave-active-class="transition duration-100"
     leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
     <div v-if="isTeamListOpen"
      class="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div class="flex flex-col gap-2">
       <!-- 팀 리스트 -->
       <div v-for="team in teams" :key="team.id" @click="toggleTeam(team.id)"
        class="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 cursor-pointer transition hover:bg-slate-50">
        <div class="flex items-center gap-2">
         <span class="w-2.5 h-2.5 rounded-full" :style="{ background: team.color }" />
         <span class="text-sm text-slate-700">
          {{ team.name }}
         </span>
        </div>
        <div class="w-4 h-4 rounded border flex items-center justify-center text-[10px]" :class="visibleTeams.includes(team.id)
         ? 'bg-slate-800 text-white border-slate-800'
         : 'border-slate-300 bg-white'">
         <span v-if="visibleTeams.includes(team.id)">✓</span>
        </div>
       </div>

       <div class="border-t border-slate-100 my-1"></div>

      </div>
     </div>
    </Transition>

   </div>
  </div>

  <div class="mb-3 flex items-center gap-3">
   <button type="button"
    class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:bg-slate-50"
    @click="prevWeek">
    ‹
   </button>
   <span class="text-sm font-semibold text-slate-700">{{ weekLabel }}</span>
   <button type="button"
    class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:bg-slate-50"
    @click="nextWeek">
    ›
   </button>
  </div>

  <div class="rounded-xl border border-slate-200 bg-white">
   <div class="max-h-[70vh] overflow-auto">
    <div class="grid min-w-[640px] grid-cols-[52px_repeat(5,minmax(0,1fr))]">
     <div class="border-b border-slate-200 bg-slate-50" />

     <div v-for="day in weekDays" :key="day.key" :class="[
      'flex items-center justify-center gap-1 py-2 border-b border-l border-slate-200 text-xs',
      day.isToday ? 'bg-rose-50' : 'bg-slate-50'
     ]">
      <span class="text-sm font-semibold" :class="day.isToday ? 'text-rose-500' : 'text-slate-700'">
       {{ day.name }}
      </span>

      <span class="text-[14px]" :class="day.isToday ? 'text-rose-400' : 'text-slate-400'">
       ({{ day.date }})
      </span>
     </div>

     <template v-for="slot in timeSlots" :key="slot">
      <div
       class="flex h-10 items-start justify-center border-b border-slate-100 px-2 pt-1.5 text-[11px] text-slate-400">
       {{ formatTime(slot) }}
      </div>

      <div v-for="day in weekDays" :key="day.key" class="relative h-10 border-b border-l border-slate-100"
       :class="day.isToday ? 'bg-rose-50/40' : 'bg-white hover:bg-slate-50/50'">
       <template v-for="event in getEventsAt(day.key, slot)" :key="event.id">
        <button v-if="visibleTeams.includes(event.teamId) && event.startHour === slot" type="button"
         class="absolute inset-x-1 top-0.5 z-10 overflow-hidden rounded-md px-2 py-1 text-left transition hover:brightness-95"
         :style="getEventStyle(event)" @click="selectEvent(event)">
         <div class="flex flex-col gap-0.5 overflow-hidden">
          <span class="truncate text-xs font-semibold">{{ event.title }}</span>
          <span class="truncate text-[11px] opacity-75">👥 {{ event.members.join(', ') }}</span>
         </div>
        </button>
       </template>
      </div>
     </template>
    </div>
   </div>
  </div>

  <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
   enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
   leave-to-class="opacity-0">
   <div v-if="selectedEvent"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
    @click.self="selectedEvent = null">
    <div class="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
     :style="{ borderTop: `4px solid ${selectedEvent.color}` }">
     <button type="button"
      class="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500 hover:bg-slate-200"
      @click="selectedEvent = null">
      ✕
     </button>

     <h2 class="mb-4 text-xl font-bold text-slate-900">{{ selectedEvent.title }}</h2>

     <div class="space-y-2 text-sm text-slate-700">
      <div class="flex items-start gap-2">
       <span>📅</span>
       <span>{{ selectedEvent.dayLabel }} {{ formatTime(selectedEvent.startHour) }} – {{
        formatTime(selectedEvent.endHour)
       }}</span>
      </div>
      <div class="flex items-start gap-2">
       <span>👥</span>
       <span>{{ selectedEvent.members.join(', ') }}</span>
      </div>
     </div>

     <div v-if="selectedEvent.note" class="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
      {{ selectedEvent.note }}
     </div>
    </div>
   </div>
  </Transition>
 </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ layout: 'admin' })
useHead({ title: '합주 스케줄 — BandPick' })

const isTeamListOpen = ref(false)

// 목업 데이터
const teams = ref([
 { id: 1, name: '나이프', color: '#f87171' },
 { id: 2, name: '지구가 태양을 네 번', color: '#60a5fa' },
 { id: 3, name: '눈', color: '#a78bfa' },
 { id: 4, name: 'Rules', color: '#34d399' },
])

const mockEvents = [
 {
  id: 1, teamId: 1,
  title: '나이프',
  day: 'wed', startHour: 12, endHour: 12.5,
  members: ['신보람', '박민서', '주민규', '장용준', '심선우'],
  note: '전체합주',
  color: '#f87171',
 },
 {
  id: 2, teamId: 2,
  title: '지구가 태양을 네 번',
  day: 'thu', startHour: 12, endHour: 12.75,
  members: ['이상은', '오수빈', '김채은', '안수빈'],
  note: '세션 전체 합주 (김서현 X)',
  color: '#60a5fa',
 },
 {
  id: 3, teamId: 3,
  title: '눈',
  day: 'mon', startHour: 18, endHour: 19,
  members: ['김유성', '인세훈', '황주현', '최상현', '문성훈'],
  note: '전체 합주',
  color: '#a78bfa',
 },
 {
  id: 4, teamId: 4,
  title: 'Rules',
  day: 'tue', startHour: 18, endHour: 19,
  members: ['이선재', '윤채빈', '주민규', '정시연', '함민수', '심선우'],
  note: '전체합주',
  color: '#34d399',
 },
 {
  id: 5, teamId: 1,
  title: '나이프',
  day: 'fri', startHour: 17, endHour: 18,
  members: ['신보람', '박민서', '장용준', '심선우'],
  note: '베이스 X',
  color: '#f87171',
 },
 {
  id: 6, teamId: 2,
  title: '지구가 태양을 네 번',
  location: '음악실 A',
  day: 'wed', startHour: 18, endHour: 19,
  members: ['이상은', '오수빈', '김채은', '안수빈'],
  note: '전체 합주',
  color: '#60a5fa',
 },
]

type ScheduleEvent = (typeof mockEvents)[number]
type SelectedScheduleEvent = ScheduleEvent & { dayLabel: string }

// ─── 상태 ───────────────────────────────────────────────────────
const visibleTeams = ref(teams.value.map((t) => t.id))
const selectedEvent = ref<SelectedScheduleEvent | null>(null)
const weekOffset = ref(0)

// ─── 계산 ───────────────────────────────────────────────────────
const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri']
const dayLabels: Record<string, string> = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금' }
const SLOT_STEP = 0.5 // 30분 단위
const SLOT_HEIGHT = 40 // h-10 = 40px
const START_HOUR = 9
const END_HOUR = 22 // 20:00 미만까지 표시
const timeSlots = Array.from(
 { length: (END_HOUR - START_HOUR) / SLOT_STEP },
 (_, i) => START_HOUR + i * SLOT_STEP,
)

const weekDays = computed(() => {
 const now = new Date()
 const monday = new Date(now)
 const day = now.getDay() || 7
 monday.setDate(now.getDate() - day + 1 + weekOffset.value * 7)

 return dayNames.map((key, i) => {
  const d = new Date(monday)
  d.setDate(monday.getDate() + i)
  const isToday =
   d.toDateString() === now.toDateString() && weekOffset.value === 0
  return {
   key,
   name: dayLabels[key],
   date: `${d.getMonth() + 1}/${d.getDate()}`,
   isToday,
  }
 })
})

const weekLabel = computed(() => {
 const first = weekDays.value[0]
 const last = weekDays.value[4]
 if (!first || !last) return ''
 return `${first.date} – ${last.date}`
})

function formatTime(hour: number) {
 const h = Math.floor(hour)
 const minuteFloat = (hour - h) * 60
 let m = Math.round(minuteFloat)

 // 반올림 등으로 60분이 되는 경계값 보정
 let normalizedHour = h
 if (m >= 60) {
  normalizedHour += 1
  m = 0
 }

 return `${String(normalizedHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getEventsAt(day: string, hour: number) {
 return mockEvents.filter(
  (e) => e.day === day && hour >= e.startHour && hour < e.endHour,
 )
}

function getEventStyle(event: ScheduleEvent) {
 const duration = event.endHour - event.startHour
 const slotCount = duration / SLOT_STEP
 return {
  height: `${slotCount * SLOT_HEIGHT - 4}px`,
  background: event.color + '28',
  borderLeft: `3px solid ${event.color}`,
  color: event.color,
 }
}

function toggleTeam(id: number) {
 if (visibleTeams.value.includes(id)) {
  visibleTeams.value = visibleTeams.value.filter((t) => t !== id)
 } else {
  visibleTeams.value.push(id)
 }
}

function selectEvent(event: ScheduleEvent) {
 const dayInfo = weekDays.value.find((d) => d.key === event.day)
 selectedEvent.value = {
  ...event,
  dayLabel: dayInfo ? `${dayInfo.name} (${dayInfo.date})` : '',
 }
}

function prevWeek() { weekOffset.value-- }
function nextWeek() { weekOffset.value++ }
</script>
