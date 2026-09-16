<template>
  <div>
    <!-- 페이지 헤더 -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">
          팀 매칭 - 팀제용
        </h1>
      </div>
    </div>

    <!-- API 에러 -->
    <p v-if="errorMessage" class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <!-- 매칭 에러 -->
    <p v-if="matchError" class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ matchError }}
    </p>

    <!-- ========================================================= -->
    <!-- 팀 배정 대시보드 -->
    <!-- ========================================================= -->
    <section class="mt-10">
      <!-- 대시보드 헤더 -->
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">
            팀 배정 대시보드
          </h2>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- 합주 가능 요일 조회 -->
          <div
            class="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
            title="선택한 요일 모두에 합주 가능한 인원을 조회합니다"
          >
            <span class="mr-1 text-xs font-medium text-slate-500">가능 요일</span>
            <label
              v-for="day in TEAM_WEEKDAYS"
              :key="`dash-day-${day}`"
              class="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <input
                type="checkbox"
                class="h-3.5 w-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                :checked="dashboardDayFilter.includes(day)"
                @change="toggleDashboardDayFilter(day)"
              />
              <span>{{ day }}</span>
            </label>
            <button
              type="button"
              class="ml-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!dashboardDayFilter.length"
              @click="openDayAvailabilityPopup"
            >
              조회
            </button>
          </div>

          <span v-if="isDirty" class="text-xs font-medium text-amber-600">
            저장되지 않은 변경사항이 있습니다
          </span>

          <button type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isMatching || isSaving || isLoading || isExporting || !boards.length"
            @click="exportMatchPdf">
            {{ isExporting ? "내보내는 중..." : "PDF 내보내기" }}
          </button>

          <button type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isMatching || isSaving || isLoading" @click="handleRematch">
            {{ isMatching ? "재배정 중..." : "재배정" }}
          </button>

          <button type="button"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!isDirty || isSaving || isMatching" @click="saveAssignments">
            {{ isSaving ? "저장 중..." : "변경사항 저장" }}
          </button>
        </div>
      </div>

      <div v-if="!boards.length && !unassignedPool.length"
        class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        {{ isMatching || isLoading ? "팀 배정 결과를 불러오는 중..." : "제출된 팀제 신청이 없습니다." }}
      </div>

      <!-- 배정 가능 인원: 남은 참여 팀 수가 있는 부원. 한 팀에 들어가도 여유가 있으면 여기에 남음 -->
      <div v-if="boards.length || unassignedPool.length"
        class="sticky top-16 z-20 mb-4 rounded-xl border-2 border-dashed bg-slate-50/95 p-3 shadow-sm backdrop-blur-sm transition" :class="{
          'border-blue-400 bg-blue-50/95': dropTarget === 'pool',
          'border-slate-300': dropTarget !== 'pool',
        }" @dragover.prevent="dropTarget = 'pool'" @dragleave="onPoolDragLeave" @drop="onDropToPool">
        <p class="mb-2 text-xs font-semibold text-slate-500">
          배정 가능 인원 ({{ unassignedPool.length }}명)
        </p>

        <div v-if="!unassignedPool.length" class="text-xs text-slate-400">
          추가 배정 가능한 인원이 없습니다
        </div>

        <div v-else class="flex flex-wrap gap-2">
          <span v-for="member in unassignedPool" :key="member.userId" draggable="true"
            class="cursor-grab select-none rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm active:cursor-grabbing"
            :class="{
              'opacity-30': draggingUserId === member.userId,
              'border-sky-300 bg-sky-50 text-slate-700': hasAnyAssignment(member.userId),
              'border-slate-300 bg-white text-slate-700': !hasAnyAssignment(member.userId),
            }" @dragstart="
              onDragStart(
                $event,
                { origin: 'pool' },
                member
              )
              " @dragend="onDragEnd">
            {{ memberLabel(member.name, member.userId) }}
          </span>
        </div>
      </div>

      <!-- 팀 카드: PC 한 줄 3팀, 한 화면에서 전체 표시 -->
      <div v-if="boards.length" class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article v-for="(team, teamIndex) in boards" :key="team.name"
              class="min-w-0 rounded-xl border bg-white p-4 shadow-sm" :class="team.confirmed
                ? 'border-emerald-300 ring-1 ring-emerald-100'
                : 'border-slate-200'">
              <!-- 팀 헤더 -->
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold text-slate-900">
                  {{ team.name }}
                </h3>

                <div class="flex shrink-0 items-center gap-1.5">
                  <span v-if="team.confirmed"
                    class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    확정
                  </span>
                  <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="team.status === '완료'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'">
                    {{ team.status }}
                  </span>
                </div>
              </div>

              <p v-if="team.note" class="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                {{ team.note }}
              </p>

              <!-- 포지션 슬롯 -->
              <div class="mt-3 space-y-1.5">
                <div v-for="(slot, slotIndex) in team.slots" :key="slot.position"
                  class="flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 transition" :class="{
                    'border-blue-400 bg-blue-50':
                      !team.confirmed &&
                      dropTarget === `${teamIndex}-${slotIndex}`,
                    'border-slate-100 bg-slate-50':
                      !slot.needed &&
                      !slot.occupant &&
                      dropTarget !== `${teamIndex}-${slotIndex}`,
                    'border-slate-200':
                      slot.needed ||
                      slot.occupant ||
                      dropTarget === `${teamIndex}-${slotIndex}`,
                    'opacity-90': team.confirmed,
                  }" @dragover.prevent="
                    !team.confirmed && (dropTarget = `${teamIndex}-${slotIndex}`)
                    " @dragleave="
                      onSlotDragLeave(teamIndex, slotIndex)
                      " @drop="
                        onDropToSlot(
                          $event,
                          teamIndex,
                          slotIndex
                        )
                        ">
                  <!-- 포지션: 클릭 시 이 자리만 고정 (재배정 시 유지) -->
                  <button
                    type="button"
                    class="w-12 shrink-0 rounded px-1 py-1 text-center text-xs font-semibold transition"
                    :class="slotButtonClass(team, slot)"
                    :disabled="team.confirmed || !slot.occupant"
                    :title="slotPinTitle(team, slot)"
                    @mousedown.stop
                    @click.stop="toggleSlotPinned(teamIndex, slotIndex)"
                  >
                    {{ slot.position }}
                  </button>

                  <!-- 배정된 사람 -->
                  <span v-if="slot.occupant"
                    class="flex min-w-0 flex-1 items-center justify-between rounded-md bg-sky-300 px-2.5 py-1 text-sm font-medium text-black">
                    <span
                      :draggable="!team.confirmed && !slot.pinned"
                      class="min-w-0 flex-1 whitespace-nowrap select-none"
                      :class="{
                      'cursor-grab active:cursor-grabbing': !team.confirmed && !slot.pinned,
                      'cursor-default': team.confirmed || slot.pinned,
                      'opacity-30': draggingUserId === slot.occupant.userId,
                    }" @dragstart="
                      !team.confirmed && !slot.pinned && onDragStart(
                        $event,
                        {
                          origin: 'slot',
                          teamIndex: teamIndex,
                          slotIndex,
                        },
                        slot.occupant
                      )
                      " @dragend="onDragEnd">
                      {{ memberLabel(slot.occupant.name, slot.occupant.userId) }}
                      <span class="ml-1.5 text-xs text-slate-600">
                        {{ levelForPosition(slot.occupant.userId, slot.position) }}
                      </span>
                      <span
                        v-if="slot.pinned && !team.confirmed"
                        class="ml-1 text-[10px] font-semibold text-amber-800"
                      >고정</span>
                    </span>

                    <button v-if="!team.confirmed && !slot.pinned" type="button"
                      class="ml-2 shrink-0 rounded px-1 text-sm text-slate-600 hover:bg-sky-200 hover:text-slate-900"
                      title="배정 해제" @mousedown.stop
                      @click.stop="unassign(teamIndex, slotIndex)">
                      ✕
                    </button>
                  </span>

                  <!-- 필요없음 -->
                  <span v-else-if="!slot.needed"
                    class="flex min-w-0 flex-1 items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-400">
                    필요없음
                  </span>

                  <!-- 빈 슬롯 -->
                  <span v-else
                    class="flex min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-400">
                    배정 필요
                  </span>

                  <button v-if="!team.confirmed" type="button"
                    class="w-14 shrink-0 rounded px-1 py-1 text-[11px] font-medium transition" :class="slot.needed
                      ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'"
                    :title="slot.needed ? '이 포지션은 필요 없음' : '이 포지션을 다시 배정'" @mousedown.stop
                    @click.stop="setSlotNeeded(teamIndex, slotIndex, !slot.needed)">
                    {{ slot.needed ? "필요없음" : "필요" }}
                  </button>
                  <span v-else class="w-14 shrink-0" />
                </div>
              </div>

              <div class="mt-4 border-t border-slate-100 pt-3">
                <button type="button"
                  class="w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                  :class="team.confirmed
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'" :disabled="isMatching || isSaving"
                  @click="toggleTeamConfirmed(teamIndex)">
                  {{ team.confirmed ? "확정 해제" : "확정" }}
                </button>
              </div>
            </article>
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- 제출 현황 -->
    <!-- ========================================================= -->
    <section class="mt-10">
      <!-- 섹션 헤더 -->
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">
            제출 현황
            <span class="ml-1.5 text-sm font-medium text-slate-500">
              ({{ filteredRows.length }}명
              <template v-if="filteredRows.length !== rows.length">
                / 전체 {{ rows.length }}명
              </template>)
            </span>
          </h2>

          <p class="mt-1 text-xs text-slate-500">
            부원별 팀제 신청 및 희망 정보를 확인할 수 있습니다.
          </p>
        </div>

        <!-- 검색 / 필터 -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- 이름 검색 -->
          <div class="relative">
            <input v-model.trim="searchQuery" type="search" placeholder="이름 검색"
              class="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />

            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
          </div>

          <!-- 제출 상태 -->
          <select v-model="statusFilter"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value="all">
              전체
            </option>

            <option value="submitted">
              제출 완료
            </option>

            <option value="pending">
              미제출
            </option>
          </select>

          <select v-model="sessionFilter"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value="all">
              세션 전체
            </option>
            <option v-for="position in FORM_POSITION_LIST" :key="`session-filter-${position}`" :value="position">
              {{ position }}
            </option>
          </select>
        </div>
      </div>

      <!-- 테이블 -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px] border-collapse text-sm">
            <thead class="bg-slate-50">
              <tr>
                <!-- 이름 -->
                <th
                  class="w-36 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  이름
                </th>

                <!-- 제출 현황 -->
                <th
                  class="w-32 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  제출 현황
                </th>

                <!-- 가능 포지션 -->
                <th
                  class="w-72 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  가능 포지션
                </th>

                <!-- 참여 팀 수 -->
                <th
                  class="w-24 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  참여 팀
                </th>

                <!-- 스케줄 -->
                <th
                  class="w-20 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  스케줄
                </th>

                <!-- 기획자에게 하고 싶은 말 -->
                <th
                  class="min-w-[300px] border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  기획자에게
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <!-- 로딩 -->
              <tr v-if="isLoading">
                <td colspan="6" class="px-5 py-12 text-center text-sm text-slate-400">
                  제출 현황을 불러오는 중...
                </td>
              </tr>

              <!-- 검색 결과 없음 -->
              <tr v-else-if="!filteredRows.length">
                <td colspan="6" class="px-5 py-12 text-center">
                  <p class="text-sm font-medium text-slate-500">
                    표시할 부원이 없습니다.
                  </p>

                  <p class="mt-1 text-xs text-slate-400">
                    검색어, 제출 상태, 세션 필터를 확인해주세요.
                  </p>
                </td>
              </tr>

              <!-- 데이터 -->
              <tr v-for="row in filteredRows" :key="row.userId" class="transition hover:bg-slate-50/80">
                <!-- 이름 -->
                <td class="px-5 py-4 align-middle">
                  <span class="font-semibold text-slate-900">
                    {{ row.name }}
                  </span>
                </td>

                <!-- 제출 현황 -->
                <td class="px-5 py-4 align-middle">
                  <span v-if="row.submitted"
                    class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    완료
                  </span>

                  <span v-else
                    class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    <span class="h-1.5 w-1.5 rounded-full bg-slate-400" />

                    미제출
                  </span>
                </td>

                <!-- 가능 포지션 -->
                <td class="px-5 py-4 align-middle">
                  <div v-if="row.submitted && row.positions.length" class="flex flex-wrap gap-1.5">
                    <span v-for="position in row.positions" :key="position"
                      class="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium" :class="isFilteredSessionBadge(position)
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700'">
                      {{ position }}
                    </span>
                  </div>

                  <span v-else class="text-xs text-slate-400">
                    -
                  </span>
                </td>

                <!-- 참여 팀 수 -->
                <td class="px-5 py-4 align-middle">
                  <span v-if="row.submitted" class="text-sm text-slate-700">
                    {{ row.maxTeams }}팀
                  </span>

                  <span v-else class="text-xs text-slate-400">
                    -
                  </span>
                </td>

                <!-- 스케줄 -->
                <td class="px-5 py-4 align-middle">
                  <button v-if="row.submitted && row.schedules.length" type="button"
                    class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    @click="openSchedule(row)">
                    보기
                  </button>

                  <span v-else-if="row.submitted" class="text-xs text-slate-400">
                    미선택
                  </span>

                  <span v-else class="text-xs text-slate-400">
                    -
                  </span>
                </td>

                <!-- 기획자에게 하고 싶은 말 -->
                <td class="px-5 py-4 align-middle">
                  <p v-if="row.submitted && row.message" class="max-w-xs whitespace-pre-wrap text-sm text-slate-700">
                    {{ row.message }}
                  </p>

                  <span v-else class="text-xs text-slate-400">
                    -
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <AdminMemberScheduleDialog :open="scheduleDialogOpen" :member-name="scheduleDialogName"
      :schedules="scheduleDialogSlots" @close="scheduleDialogOpen = false" />

    <!-- 요일별 합주 가능 인원 조회 팝업 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="dayAvailabilityOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
          @click.self="dayAvailabilityOpen = false"
        >
          <div class="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 class="text-lg font-bold text-slate-900">합주 가능 인원</h2>
                <p class="mt-1 text-sm text-slate-500">
                  {{ dashboardDayFilter.join("·") }} · {{ dayAvailabilityRows.length }}명
                </p>
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500 hover:bg-slate-200"
                @click="dayAvailabilityOpen = false"
              >
                ✕
              </button>
            </div>

            <div class="overflow-y-auto px-6 py-4">
              <p v-if="!dayAvailabilityRows.length" class="py-8 text-center text-sm text-slate-400">
                선택한 요일에 합주 가능한 제출 인원이 없습니다.
              </p>
              <ul v-else class="divide-y divide-slate-100">
                <li
                  v-for="row in dayAvailabilityRows"
                  :key="row.userId"
                  class="flex items-start justify-between gap-3 py-3"
                >
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900">
                      {{ row.name }}
                      <span class="ml-1 text-xs font-medium text-slate-400">
                        잔여 {{ remainingTeamsFor(row.userId) }}팀
                      </span>
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ row.positions.join(", ") || "포지션 없음" }}
                    </p>
                  </div>
                  <button
                    v-if="row.schedules.length"
                    type="button"
                    class="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    @click="openSchedule(row)"
                  >
                    스케줄
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <CommonAlertDialog :open="alertOpen" :type="alertType" :title="alertTitle" :message="alertMessage"
      @close="alertOpen = false" @confirm="alertOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { groupTeamScheduleRanges, TEAM_WEEKDAYS } from "~/utils/teamForm";

type TeamWeekday = (typeof TEAM_WEEKDAYS)[number];

definePageMeta({
  layout: "admin",
});

useHead({
  title: "팀제 — BandPick",
});

/* =========================================================
 * 타입
 * ========================================================= */

type UserInfo = {
  id: number;
  code: string;
  name: string;
};

type TeamFormPosition = {
  position: string;
  level: string;
  priority?: number;
};

type TeamFormMember = {
  userId: number;
  name: string;
  code: string;
  message?: string;
  teammates?: string;
  maxTeams: number;
  positions: TeamFormPosition[];
  schedules: {
    dayOfWeek: string;
    startTime: string;
  }[];
};

type SubmissionRow = {
  userId: number;
  code: string;
  name: string;
  submitted: boolean;
  positions: string[];
  positionLevels: Record<string, string>;
  message: string;
  maxTeams: number;
  schedules: {
    dayOfWeek: string;
    startTime: string;
  }[];
};

/* =========================================================
 * 매칭 결과 타입
 * ========================================================= */

type MatchMember = {
  userId: number;
  session: string;
  name: string;
  level: string;
};

type MatchTeam = {
  name: string;
  status: string;
  note: string;
  members: MatchMember[];
  confirmed?: boolean;
  neededByPosition?: Record<string, boolean>;
};

type UnmatchedMember = {
  userId: number;
  name: string;
  level?: string;
};

type MatchResult = {
  teams: MatchTeam[];
  unmatched: UnmatchedMember[];
};

/* =========================================================
 * 대시보드 타입
 * ========================================================= */

const POSITION_LIST = [
  "V1",
  "V2",
  "D",
  "B",
  "EG1",
  "EG2",
  "K",
] as const;

/** 부원 신청서 기준 세션 (보드 좌석 V1/V2와 구분) */
const FORM_POSITION_LIST = [
  "V",
  "D",
  "B",
  "EG1",
  "EG2",
  "K",
] as const;

const OPTIONAL_POSITIONS = new Set<string>(["K", "V2"]);

const TEAM_BOARD_NAMES = [
  "A팀",
  "B팀",
  "C팀",
  "D팀",
  "E팀",
  "F팀",
  "G팀",
  "H팀",
] as const;

type Occupant = {
  userId: number;
  name: string;
  level: string;
};

type Slot = {
  position: string;
  occupant: Occupant | null;
  needed: boolean;
  /** 재배정 시 이 세션 자리만 유지 */
  pinned: boolean;
};

type Board = {
  name: string;
  status: string;
  note: string;
  slots: Slot[];
  confirmed: boolean;
};

/* =========================================================
 * 상태
 * ========================================================= */

const config = useRuntimeConfig();

const isLoading = ref(false);
const isMatching = ref(false);
const isSaving = ref(false);

const errorMessage = ref("");
const matchError = ref("");

const rows = ref<SubmissionRow[]>([]);

const searchQuery = ref("");

const statusFilter = ref<
  "all" | "submitted" | "pending"
>("all");

const sessionFilter = ref<(typeof FORM_POSITION_LIST)[number] | "all">("all");

/** 대시보드: 합주 가능 요일 조회 */
const dashboardDayFilter = ref<TeamWeekday[]>([]);
const dayAvailabilityOpen = ref(false);

const boards = ref<Board[]>([]);

const unassignedPool =
  ref<UnmatchedMember[]>([]);

const knownPeople = ref<Map<number, Occupant>>(new Map());

const isDirty = ref(false);
const isExporting = ref(false);

const scheduleDialogOpen = ref(false);
const scheduleDialogName = ref("");
const scheduleDialogSlots = ref<
  {
    dayOfWeek: string;
    startTime: string;
  }[]
>([]);

const alertOpen = ref(false);
const alertType = ref<"success" | "error">("error");
const alertTitle = ref("");
const alertMessage = ref("");

function showAlert(
  type: "success" | "error",
  title: string,
  message: string,
) {
  alertType.value = type;
  alertTitle.value = title;
  alertMessage.value = message;
  alertOpen.value = true;
}

/* =========================================================
 * API URL
 * ========================================================= */

const usersApiUrl = computed(() => {
  const host = String(
    config.public.apiBase
  ).replace(/\/$/, "");

  return `${host}/api/v1/users`;
});

const teamFormsApiUrl = computed(() => {
  const host = String(
    config.public.apiBase
  ).replace(/\/$/, "");

  return `${host}/api/v1/team-forms`;
});

/* 제출 현황 검색 / 필터 */

const filteredRows = computed(() => {
  const query =
    searchQuery.value.trim().toLowerCase();

  return rows.value.filter((row) => {
    if (
      statusFilter.value === "submitted" &&
      !row.submitted
    ) {
      return false;
    }

    if (
      statusFilter.value === "pending" &&
      row.submitted
    ) {
      return false;
    }

    if (
      sessionFilter.value !== "all" &&
      !rowHasSession(row, sessionFilter.value)
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    return row.name
      .toLowerCase()
      .includes(query);
  });
});

const dayAvailabilityRows = computed(() => {
  const selectedDays = dashboardDayFilter.value;
  if (!selectedDays.length) {
    return [];
  }
  return rows.value
    .filter((row) => row.submitted && rowAvailableOnDays(row, selectedDays))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
});

function rowHasSession(row: SubmissionRow, session: string) {
  return Object.prototype.hasOwnProperty.call(row.positionLevels, session);
}

function toggleDashboardDayFilter(day: TeamWeekday) {
  if (dashboardDayFilter.value.includes(day)) {
    dashboardDayFilter.value = dashboardDayFilter.value.filter((item) => item !== day);
  } else {
    dashboardDayFilter.value = [...dashboardDayFilter.value, day];
  }
}

function openDayAvailabilityPopup() {
  if (!dashboardDayFilter.value.length) {
    return;
  }
  dayAvailabilityOpen.value = true;
}

/** 선택한 요일 각각에 합주 가능 슬롯이 하나 이상 있는지 (AND) */
function rowAvailableOnDays(row: SubmissionRow, days: TeamWeekday[]) {
  if (!days.length) return true;
  const availableDays = new Set(
    row.schedules.map((slot) => String(slot.dayOfWeek ?? "").trim()),
  );
  return days.every((day) => availableDays.has(day));
}

function isFilteredSessionBadge(label: string) {
  if (sessionFilter.value === "all") {
    return false;
  }
  return label.includes(sessionFilter.value);
}

/* =========================================================
 * 제출 현황 조회
 * ========================================================= */

async function loadSubmissionStatus() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [users, forms] =
      await Promise.all([
        $fetch<UserInfo[]>(
          usersApiUrl.value,
          {
            method: "GET",
          }
        ),

        $fetch<TeamFormMember[]>(
          teamFormsApiUrl.value,
          {
            method: "GET",
          }
        ),
      ]);

    rows.value = buildRows(
      users,
      forms
    );
  } catch {
    rows.value = [];
    errorMessage.value =
      "제출 현황을 불러오지 못했습니다. 서버와 API 경로를 확인해주세요.";
  } finally {
    isLoading.value = false;
    syncPool();
    ensureTeamBoards();
  }
}

/* =========================================================
 * 제출 현황 Row 생성
 * ========================================================= */

function buildRows(
  users: UserInfo[],
  forms: TeamFormMember[]
): SubmissionRow[] {
  const formByUserId = new Map(
    forms.map((form) => [
      form.userId,
      form,
    ] as const)
  );

  return [...users]
    .map((user) => {
      const form =
        formByUserId.get(user.id);

      return {
        userId: user.id,
        code: user.code,
        name: user.name,

        /*
         * 포지션을 하나 이상 신청했으면
         * 제출 완료로 판단
         */
        submitted: Boolean(
          form &&
          form.positions?.length
        ),

        positions:
          [...(form?.positions ?? [])]
            .sort((a, b) => {
              const aRank = a.priority && a.priority > 0 ? a.priority : 999;
              const bRank = b.priority && b.priority > 0 ? b.priority : 999;
              return aRank - bRank;
            })
            .map((item) =>
              item.priority && item.priority > 0
                ? `${item.priority}순위 ${item.position}(${item.level})`
                : `${item.position}(${item.level})`,
            ),

        positionLevels: Object.fromEntries(
          (form?.positions ?? []).map((item) => [
            item.position,
            (item.level ?? "").trim() || "-",
          ]),
        ),

        message:
          (form?.message ?? form?.teammates ?? "").trim(),

        maxTeams: form?.maxTeams ?? 1,

        schedules: form?.schedules ?? [],
      };
    })

    /*
     * 미제출 먼저
     * 그 다음 이름순
     */
    .sort((a, b) => {
      if (
        a.submitted !==
        b.submitted
      ) {
        return a.submitted ? 1 : -1;
      }

      return a.name.localeCompare(
        b.name,
        "ko"
      );
    });
}

function openSchedule(row: SubmissionRow) {
  scheduleDialogName.value = row.name;
  scheduleDialogSlots.value = row.schedules;
  scheduleDialogOpen.value = true;
}

function resolveSlotNeeded(
  position: string,
  hasMember: boolean,
  neededByPosition?: Record<string, boolean> | null,
) {
  if (
    neededByPosition &&
    Object.prototype.hasOwnProperty.call(neededByPosition, position)
  ) {
    return Boolean(neededByPosition[position]);
  }
  return hasMember || !OPTIONAL_POSITIONS.has(position);
}

/* =========================================================
 * 매칭 결과 → 대시보드 변환
 * ========================================================= */

function buildBoardsFromMatchResult(
  result: MatchResult
) {
  boards.value = result.teams.map((team) =>
    boardFromMatchTeam(team, team.name, Boolean(team.confirmed)),
  );

  ensureTeamBoards();

  unassignedPool.value =
    result.unmatched;

  for (const team of result.teams) {
    for (const member of team.members) {
      rememberPerson(member);
    }
  }
  for (const member of result.unmatched) {
    rememberPerson(member);
  }

  syncPool();
  for (let index = 0; index < boards.value.length; index += 1) {
    refreshBoardStatus(index);
  }
  isDirty.value = false;
}

/* =========================================================
 * 팀 매칭 / 재배정
 * ========================================================= */

function boardFromMatchTeam(team: MatchTeam, name: string, confirmed = false): Board {
  const byPosition = new Map<string, MatchMember>();
  for (const member of team.members) {
    let session = member.session === "V" ? "V1" : member.session;
    if (session === "V1" && byPosition.has("V1") && !byPosition.has("V2")) {
      session = "V2";
    }
    byPosition.set(session, member);
  }
  const neededByPosition = { ...(team.neededByPosition ?? {}) };
  // 보컬 1명(또는 V2 비어 있음)이면 V2는 자동 필요없음
  if (!byPosition.has("V2")) {
    neededByPosition.V2 = false;
  } else {
    neededByPosition.V2 = true;
  }

  const board: Board = {
    name,
    status: team.status,
    note: team.note,
    confirmed: Boolean(team.confirmed ?? confirmed),
    slots: POSITION_LIST.map((position) => {
      const member = byPosition.get(position);
      return {
        position,
        occupant: member ? occupantForSlot(member, position) : null,
        needed: resolveSlotNeeded(position, Boolean(member), neededByPosition),
        pinned: false,
      };
    }),
  };
  applyVocalNeededRules(board);
  return board;
}

/** 팀당 보컬 1명이 기본. V2에 사람이 없으면 필요없음 처리. 드럼은 항상 필요. */
function applyVocalNeededRules(board: Board) {
  const drum = board.slots.find((slot) => slot.position === "D");
  if (drum) {
    drum.needed = true;
  }

  const v2 = board.slots.find((slot) => slot.position === "V2");
  if (!v2) {
    return;
  }
  if (v2.occupant) {
    v2.needed = true;
  } else {
    v2.needed = false;
    v2.occupant = null;
  }
}

function lockedTeamsPayload() {
  const locked: {
    name: string;
    fullyLocked: boolean;
    members: { userId: number; session: string }[];
  }[] = [];

  for (const team of boards.value) {
    if (team.confirmed) {
      locked.push({
        name: team.name,
        fullyLocked: true,
        members: team.slots
          .filter((slot) => slot.occupant)
          .map((slot) => ({
            userId: slot.occupant!.userId,
            session: slot.position,
          })),
      });
      continue;
    }

    const pinnedSlots = team.slots.filter((slot) => slot.pinned && slot.occupant);
    if (!pinnedSlots.length) {
      continue;
    }
    locked.push({
      name: team.name,
      fullyLocked: false,
      members: pinnedSlots.map((slot) => ({
        userId: slot.occupant!.userId,
        session: slot.position,
      })),
    });
  }

  return locked;
}

function snapshotPinnedSeats() {
  return boards.value.map((team) => ({
    name: team.name,
    pins: team.slots
      .filter((slot) => slot.pinned && slot.occupant)
      .map((slot) => ({
        position: slot.position,
        userId: slot.occupant!.userId,
      })),
  }));
}

function restorePinnedSeats(
  snapshot: { name: string; pins: { position: string; userId: number }[] }[],
) {
  for (const entry of snapshot) {
    const board = boards.value.find((team) => team.name === entry.name);
    if (!board || board.confirmed) {
      continue;
    }
    for (const pin of entry.pins) {
      const slot = board.slots.find((item) => item.position === pin.position);
      if (slot?.occupant?.userId === pin.userId) {
        slot.pinned = true;
        continue;
      }
      // Fallback: same person still on this team under the pinned session.
      const byUser = board.slots.find(
        (item) =>
          item.position === pin.position &&
          item.occupant?.userId === pin.userId,
      );
      if (byUser) {
        byUser.pinned = true;
      }
    }
  }
}

function slotButtonClass(team: Board, slot: Slot) {
  if (team.confirmed) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (slot.pinned) {
    return "bg-amber-200 text-amber-900 ring-1 ring-amber-400";
  }
  if (!slot.needed && !slot.occupant) {
    return "bg-slate-50 text-slate-300";
  }
  if (slot.occupant) {
    return "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-900";
  }
  return "bg-slate-100 text-slate-500";
}

function slotPinTitle(team: Board, slot: Slot) {
  if (team.confirmed) {
    return "팀 확정됨 (전체 고정)";
  }
  if (!slot.occupant) {
    return "사람이 배정된 자리만 고정할 수 있습니다";
  }
  return slot.pinned
    ? "자리 고정 해제 — 재배정 시 이 세션도 다시 배정될 수 있습니다"
    : "이 세션 자리 고정 — 재배정해도 유지됩니다";
}

function toggleSlotPinned(teamIndex: number, slotIndex: number) {
  const team = boards.value[teamIndex];
  if (!team || team.confirmed) {
    return;
  }
  const slot = team.slots[slotIndex];
  if (!slot?.occupant) {
    return;
  }
  slot.pinned = !slot.pinned;
  isDirty.value = true;
}

function applyRematchResult(result: MatchResult) {
  const pinSnapshot = snapshotPinnedSeats();
  const confirmedByName = new Map(
    boards.value
      .filter((team) => team.confirmed)
      .map((team) => [team.name, team] as const),
  );

  // Match by team name from server (not array order) so multi-team pins survive.
  const rematchedByName = new Map<string, Board>();
  for (const team of result.teams ?? []) {
    const name = String(team.name ?? "").trim();
    if (!name || confirmedByName.has(name)) {
      continue;
    }
    rematchedByName.set(name, boardFromMatchTeam(team, name, false));
  }

  boards.value = TEAM_BOARD_NAMES.map((name) => {
    const confirmed = confirmedByName.get(name);
    if (confirmed) {
      return confirmed;
    }
    return rematchedByName.get(name) ?? emptyBoard(name);
  });

  restorePinnedSeats(pinSnapshot);

  for (const team of result.teams) {
    for (const member of team.members) {
      rememberPerson(member);
    }
  }
  for (const member of result.unmatched) {
    rememberPerson(member);
  }
  for (const team of confirmedByName.values()) {
    for (const slot of team.slots) {
      if (slot.occupant) {
        rememberPerson(slot.occupant);
      }
    }
  }

  syncPool();
  for (let index = 0; index < boards.value.length; index += 1) {
    if (!boards.value[index]?.confirmed) {
      refreshBoardStatus(index);
    }
  }
  isDirty.value = true;
}

async function handleMatch() {
  isMatching.value = true;
  matchError.value = "";

  try {
    const result =
      await $fetch<MatchResult>(
        `${teamFormsApiUrl.value}/match`,
        {
          method: "POST",
        }
      );

    buildBoardsFromMatchResult(
      result
    );
    ensureTeamBoards();
  } catch {
    matchError.value =
      "자동 팀 배정에 실패했습니다. 제출된 인원은 미배정으로 표시합니다.";
    ensureTeamBoards();
    syncPool();
  } finally {
    isMatching.value = false;
  }
}

async function handleRematch() {
  const lockedTeams = lockedTeamsPayload();

  isMatching.value = true;
  matchError.value = "";

  try {
    const result = await $fetch<MatchResult>(
      `${teamFormsApiUrl.value}/match`,
      {
        method: "POST",
        body: { lockedTeams },
      },
    );

    if (lockedTeams.length) {
      applyRematchResult(result);
    } else {
      buildBoardsFromMatchResult(result);
      isDirty.value = true;
    }
    ensureTeamBoards();
    showAlert(
      "success",
      "재배정 완료",
      lockedTeams.length
        ? `확정 팀·고정 자리 ${lockedTeams.length}건을 유지하고 나머지를 다시 배정했습니다.`
        : "전체 팀을 다시 배정했습니다.",
    );
  } catch (error) {
    showAlert(
      "error",
      "재배정 실패",
      extractApiErrorMessage(
        error,
        "재배정에 실패했습니다. 잠시 후 다시 시도해주세요.",
      ),
    );
  } finally {
    isMatching.value = false;
  }
}

function toggleTeamConfirmed(teamIndex: number) {
  const team = boards.value[teamIndex];
  if (!team) {
    return;
  }

  if (!team.confirmed) {
    const hasMember = team.slots.some((slot) => slot.occupant);
    if (!hasMember) {
      showAlert(
        "error",
        "확정 불가",
        "배정된 인원이 없는 팀은 확정할 수 없습니다.",
      );
      return;
    }
  }

  team.confirmed = !team.confirmed;
  isDirty.value = true;
}

const DRAG_SCROLL_EDGE_PX = 96;
const DRAG_SCROLL_MAX_PX = 28;
let dragScrollY: number | null = null;
let dragScrollFrame = 0;

function startDragAutoScroll() {
  if (!import.meta.client) {
    return;
  }
  stopDragAutoScroll();
  document.addEventListener("dragover", onDragOverForScroll);
  document.addEventListener("dragend", stopDragAutoScroll);
  dragScrollFrame = requestAnimationFrame(tickDragScroll);
}

function onDragOverForScroll(event: DragEvent) {
  dragScrollY = event.clientY;
}

function tickDragScroll() {
  dragScrollFrame = requestAnimationFrame(tickDragScroll);
  if (dragScrollY == null) {
    return;
  }

  const viewportHeight = window.innerHeight;
  const y = dragScrollY;
  if (y < DRAG_SCROLL_EDGE_PX) {
    const intensity = (DRAG_SCROLL_EDGE_PX - y) / DRAG_SCROLL_EDGE_PX;
    window.scrollBy(0, -Math.ceil(intensity * intensity * DRAG_SCROLL_MAX_PX));
    return;
  }
  if (y > viewportHeight - DRAG_SCROLL_EDGE_PX) {
    const intensity = (y - (viewportHeight - DRAG_SCROLL_EDGE_PX)) / DRAG_SCROLL_EDGE_PX;
    window.scrollBy(0, Math.ceil(intensity * intensity * DRAG_SCROLL_MAX_PX));
  }
}

function stopDragAutoScroll() {
  if (!import.meta.client) {
    return;
  }
  document.removeEventListener("dragover", onDragOverForScroll);
  document.removeEventListener("dragend", stopDragAutoScroll);
  if (dragScrollFrame) {
    cancelAnimationFrame(dragScrollFrame);
    dragScrollFrame = 0;
  }
  dragScrollY = null;
}

/* =========================================================
 * 드래그앤드롭
 * ========================================================= */

type DragOrigin =
  | {
    origin: "pool";
  }
  | {
    origin: "slot";
    teamIndex: number;
    slotIndex: number;
  };

const draggingUserId =
  ref<number | null>(null);

const dragPayload =
  ref<{
    origin: DragOrigin;
    occupant: Occupant;
  } | null>(null);

const dropTarget =
  ref<string | null>(null);

/* 드래그 시작 */
function onDragStart(
  event: DragEvent,
  origin: DragOrigin,
  occupant:
    | Occupant
    | UnmatchedMember
) {
  draggingUserId.value =
    occupant.userId;

  dragPayload.value = {
    origin,

    occupant: {
      userId:
        occupant.userId,

      name:
        occupant.name,

      level:
        ("level" in occupant &&
          occupant.level) ||
        "-",
    },
  };

  event.dataTransfer?.setData(
    "text/plain",
    String(occupant.userId)
  );

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed =
      "move";
  }
  startDragAutoScroll();
}

/* 드래그 종료 */
function onDragEnd() {
  stopDragAutoScroll();
  draggingUserId.value = null;
  dragPayload.value = null;
  dropTarget.value = null;
}

/* 슬롯에서 마우스가 빠져나감 */
function onSlotDragLeave(
  teamIndex: number,
  slotIndex: number
) {
  if (
    dropTarget.value ===
    `${teamIndex}-${slotIndex}`
  ) {
    dropTarget.value = null;
  }
}

/* 미배정 풀에서 마우스가 빠져나감 */
function onPoolDragLeave() {
  if (
    dropTarget.value ===
    "pool"
  ) {
    dropTarget.value = null;
  }
}

/* 미배정 풀에서 사람 제거 */
function removeFromPool(
  userId: number
) {
  const index =
    unassignedPool.value.findIndex(
      (member) =>
        member.userId === userId
    );

  if (index !== -1) {
    unassignedPool.value.splice(
      index,
      1
    );
  }
}

/* 슬롯으로 드롭: 다른 팀/세션으로 복사해 여러 팀·보컬 겸임을 허용 */
function onDropToSlot(
  event: DragEvent,
  teamIndex: number,
  slotIndex: number
) {
  dropTarget.value = null;

  const payload = dragPayload.value;
  if (!payload) {
    return;
  }

  const team = boards.value[teamIndex];
  if (!team || team.confirmed) {
    dragPayload.value = null;
    return;
  }

  const targetSlot = team.slots[slotIndex];
  if (targetSlot.pinned) {
    showAlert(
      "error",
      "고정된 자리",
      "고정된 세션 자리에는 다른 사람을 넣을 수 없습니다. 자리 고정을 먼저 해제해 주세요.",
    );
    dragPayload.value = null;
    return;
  }
  const displaced = targetSlot.occupant;

  if (
    payload.origin.origin === "slot" &&
    payload.origin.teamIndex === teamIndex &&
    payload.origin.slotIndex === slotIndex
  ) {
    dragPayload.value = null;
    return;
  }

  if (
    !isAssignedToTeam(payload.occupant.userId, teamIndex) &&
    assignedTeamCount(payload.occupant.userId) >= maxTeamsFor(payload.occupant.userId)
  ) {
    showMaxTeamAlert(payload.occupant.name, maxTeamsFor(payload.occupant.userId));
    dragPayload.value = null;
    return;
  }

  const currentPositions = assignedPositionsInTeam(
    payload.occupant.userId,
    teamIndex,
  ).filter((position) => position !== targetSlot.position);

  if (
    !canConcurrentAssign(currentPositions, targetSlot.position)
  ) {
    showAlert(
      "error",
      "세션 겸임 불가",
      `${payload.occupant.name} 님은 보컬(V1/V2)과 악기 한 자리만 겸임할 수 있습니다.`,
    );
    dragPayload.value = null;
    return;
  }

  targetSlot.occupant = occupantForSlot(payload.occupant, targetSlot.position);
  targetSlot.needed = true;
  rememberPerson(targetSlot.occupant);

  if (payload.origin.origin === "pool") {
    removeFromPool(payload.occupant.userId);
  }

  if (displaced) {
    rememberPerson(displaced);
  }

  syncPool();
  refreshBoardStatus(teamIndex);
  isDirty.value = true;
  dragPayload.value = null;
}

/* 미배정 풀로 드롭: 해당 슬롯만 해제 (겸임 세션은 유지) */
function onDropToPool(event: DragEvent) {
  dropTarget.value = null;

  const payload = dragPayload.value;
  if (!payload || payload.origin.origin !== "slot") {
    dragPayload.value = null;
    return;
  }

  const { teamIndex, slotIndex } = payload.origin;
  const team = boards.value[teamIndex];
  if (!team || team.confirmed) {
    dragPayload.value = null;
    return;
  }
  const slot = team.slots[slotIndex];
  if (slot?.pinned) {
    showAlert(
      "error",
      "고정된 자리",
      "고정된 세션은 풀로 옮길 수 없습니다. 자리 고정을 먼저 해제해 주세요.",
    );
    dragPayload.value = null;
    return;
  }
  const occupant = slot?.occupant;
  if (occupant) {
    rememberPerson(occupant);
    slot.occupant = null;
  }
  syncPool();
  refreshBoardStatus(payload.origin.teamIndex);
  isDirty.value = true;
  dragPayload.value = null;
}

/* 배정 해제: 해당 슬롯만 해제 (겸임 세션은 유지) */
function unassign(teamIndex: number, slotIndex: number) {
  const team = boards.value[teamIndex];
  if (!team || team.confirmed) {
    return;
  }
  const slot = team.slots[slotIndex];
  if (slot.pinned) {
    showAlert(
      "error",
      "고정된 자리",
      "고정된 세션은 해제할 수 없습니다. 자리 고정을 먼저 해제해 주세요.",
    );
    return;
  }
  const occupant = slot.occupant;
  if (!occupant) {
    return;
  }
  rememberPerson(occupant);
  slot.occupant = null;
  syncPool();
  refreshBoardStatus(teamIndex);
  isDirty.value = true;
}

function setSlotNeeded(teamIndex: number, slotIndex: number, needed: boolean) {
  const team = boards.value[teamIndex];
  if (!team || team.confirmed) {
    return;
  }
  const slot = team.slots[slotIndex];
  if (slot.position === "D" && !needed) {
    showAlert(
      "error",
      "드럼 필수",
      "드럼(D)은 필요없음으로 둘 수 없습니다.",
    );
    return;
  }
  if (slot.pinned && !needed) {
    showAlert(
      "error",
      "고정된 자리",
      "고정된 세션은 필요없음으로 둘 수 없습니다. 자리 고정을 먼저 해제해 주세요.",
    );
    return;
  }
  if (!needed && slot.occupant) {
    rememberPerson(slot.occupant);
    slot.occupant = null;
  }
  slot.needed = needed;
  syncPool();
  refreshBoardStatus(teamIndex);
  isDirty.value = true;
}

function skillPosition(position: string) {
  if (position === "V1" || position === "V2") {
    return "V";
  }
  return position;
}

function levelForPosition(userId: number, position: string) {
  const row = rows.value.find((item) => item.userId === userId);
  const level = row?.positionLevels?.[skillPosition(position)];
  return level && level.trim() ? level : "-";
}

function occupantForSlot(
  person: { userId: number; name: string },
  position: string,
): Occupant {
  return {
    userId: person.userId,
    name: person.name,
    level: levelForPosition(person.userId, position),
  };
}

function refreshBoardStatus(teamIndex: number) {
  const team = boards.value[teamIndex];
  if (!team) {
    return;
  }
  applyVocalNeededRules(team);
  const hasMember = team.slots.some((slot) => slot.occupant);
  const complete = team.slots.every((slot) => !slot.needed || slot.occupant);
  team.status = hasMember && complete ? "완료" : "대기";
  team.note = team.status === "완료" ? formatRehearsalTimes(team) : "";
}

function formatRehearsalTimes(team: Board) {
  const groups = groupTeamScheduleRanges(commonTeamSchedules(team));
  if (!groups.length) {
    return "공통 가능 시간 없음";
  }
  return groups
    .map((group) => `${group.day} ${group.ranges.join(", ")}`)
    .join("\n");
}

function commonTeamSchedules(team: Board) {
  const userIds = [
    ...new Set(
      team.slots
        .map((slot) => slot.occupant?.userId)
        .filter((userId): userId is number => userId != null),
    ),
  ];
  if (!userIds.length) {
    return [];
  }

  let common: Set<string> | null = null;
  for (const userId of userIds) {
    const row = rows.value.find((item) => item.userId === userId);
    const keys = new Set(
      (row?.schedules ?? [])
        .map((item) => {
          const day = String(item.dayOfWeek ?? "").trim();
          const time = String(item.startTime ?? "").trim().slice(0, 5);
          return day && time ? `${day}-${time}` : "";
        })
        .filter(Boolean),
    );
    if (common == null) {
      common = keys;
    } else {
      common = new Set([...common].filter((key) => keys.has(key)));
    }
  }

  return [...(common ?? [])]
    .filter((key) => key.includes("-"))
    .map((key) => {
      const split = key.indexOf("-");
      return {
        dayOfWeek: key.slice(0, split),
        startTime: key.slice(split + 1),
      };
    });
}

function rememberPerson(person: {
  userId: number;
  name: string;
  level?: string;
}) {
  if (person.userId == null) return;
  const next = new Map(knownPeople.value);
  next.set(person.userId, {
    userId: person.userId,
    name: person.name,
    level: person.level || "-",
  });
  knownPeople.value = next;
}

function hasAnyAssignment(userId: number) {
  return boards.value.some((team) =>
    team.slots.some((slot) => slot.occupant?.userId === userId),
  );
}

function isAssignedToTeam(userId: number, teamIndex: number) {
  return boards.value[teamIndex]?.slots.some(
    (slot) => slot.occupant?.userId === userId,
  ) ?? false;
}

function assignedTeamCount(userId: number) {
  return boards.value.filter((team) =>
    team.slots.some((slot) => slot.occupant?.userId === userId),
  ).length;
}

function maxTeamsFor(userId: number) {
  const row = rows.value.find((item) => item.userId === userId);
  const max = row?.maxTeams ?? 1;
  return Math.max(1, Math.min(4, max));
}

function remainingTeamsFor(userId: number) {
  return Math.max(0, maxTeamsFor(userId) - assignedTeamCount(userId));
}

function memberLabel(name: string, userId: number) {
  return `${name}(${remainingTeamsFor(userId)})`;
}

function assignedPositionsInTeam(userId: number, teamIndex: number) {
  return (boards.value[teamIndex]?.slots ?? [])
    .filter((slot) => slot.occupant?.userId === userId)
    .map((slot) => slot.position);
}

/** 보컬(V1/V2) + 악기 한 자리만 한 팀에서 세션 겸임 허용 */
function isVocalPosition(position: string) {
  return position === "V" || position === "V1" || position === "V2";
}

function canConcurrentAssign(
  currentPositions: string[],
  nextPosition: string,
) {
  const positions = [...new Set([...currentPositions, nextPosition])];
  if (positions.length <= 1) {
    return true;
  }
  if (positions.length > 2) {
    return false;
  }
  const vocalCount = positions.filter((position) => isVocalPosition(position)).length;
  return vocalCount === 1 && positions.some((position) => !isVocalPosition(position));
}

function showMaxTeamAlert(name: string, maxTeams: number) {
  showAlert(
    "error",
    "최대 참여 팀",
    `${name} 님은 이미 최대 참여 팀 수(${maxTeams}팀)에 들어가 있어 다른 팀에 배정할 수 없습니다.`,
  );
}

function syncPool() {
  for (const team of boards.value) {
    for (const slot of team.slots) {
      if (!slot.occupant) continue;
      rememberPerson(slot.occupant);
    }
  }

  for (const row of rows.value) {
    if (!row.submitted) continue;
    rememberPerson({
      userId: row.userId,
      name: row.name,
      level: "-",
    });
  }

  unassignedPool.value = [...knownPeople.value.values()]
    .filter((person) => remainingTeamsFor(person.userId) > 0)
    .sort((a, b) => {
      const aAssigned = hasAnyAssignment(a.userId) ? 1 : 0;
      const bAssigned = hasAnyAssignment(b.userId) ? 1 : 0;
      if (aAssigned !== bAssigned) {
        return aAssigned - bAssigned;
      }
      return a.name.localeCompare(b.name, "ko");
    })
    .map((person) => ({
      userId: person.userId,
      name: person.name,
      level: person.level,
      reason: hasAnyAssignment(person.userId) ? "추가배정" : "미배정",
    }));
}

/* =========================================================
 * 배정 저장 / 복원
 * ========================================================= */

type AssignmentSaveResponse = {
  teamCount: number;
  memberCount: number;
  message: string;
};

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

async function loadSavedAssignments(): Promise<boolean> {
  try {
    const result = await $fetch<MatchResult>(
      `${teamFormsApiUrl.value}/assignments`,
      { method: "GET" },
    );

    const hasMembers = (result.teams ?? []).some(
      (team) => (team.members?.length ?? 0) > 0,
    );
    if (!hasMembers) {
      return false;
    }

    buildBoardsFromMatchResult(result);
    ensureTeamBoards();
    return true;
  } catch {
    return false;
  }
}

async function saveAssignments() {
  isSaving.value = true;

  try {
    const response = await $fetch<AssignmentSaveResponse>(
      `${teamFormsApiUrl.value}/assignments`,
      {
        method: "POST",
        body: {
          teams: boards.value.map((team) => ({
            name: team.name,
            confirmed: team.confirmed,
            slots: team.slots.map((slot) => ({
              position: slot.position,
              userId: slot.occupant?.userId ?? null,
              needed: slot.needed,
            })),
          })),
        },
      },
    );

    isDirty.value = false;
    showAlert(
      "success",
      "저장 완료",
      response.message ||
      `팀 ${response.teamCount}개, 배정 ${response.memberCount}명을 저장했습니다.`,
    );
  } catch (error) {
    showAlert(
      "error",
      "저장 실패",
      extractApiErrorMessage(
        error,
        "변경사항 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      ),
    );
  } finally {
    isSaving.value = false;
  }
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildMatchExportDocumentHtml() {
  const confirmedCount = boards.value.filter((team) => team.confirmed).length;
  const completeCount = boards.value.filter((team) => team.status === "완료").length;

  const teamSections = boards.value
    .map((team) => {
      const slotsHtml = team.slots
        .map((slot) => {
          let body = "";
          if (slot.occupant) {
            body = `<span class="member">${escapeHtml(slot.occupant.name)}</span>`;
          } else if (!slot.needed) {
            body = `<span class="muted">필요없음</span>`;
          } else {
            body = `<span class="warn">배정 필요</span>`;
          }
          return `
            <div class="slot">
              <span class="pos">${escapeHtml(slot.position)}</span>
              ${body}
            </div>`;
        })
        .join("");

      const noteHtml = team.note
        ? `<p class="note">${escapeHtml(team.note).replaceAll("\n", "<br />")}</p>`
        : "";

      return `
        <section class="team">
          <div class="team-head">
            <h2>${escapeHtml(team.name)}</h2>
            <div class="badges">
              ${team.confirmed ? `<span class="badge ok">확정</span>` : ""}
              <span class="badge ${team.status === "완료" ? "ok" : ""}">${escapeHtml(team.status)}</span>
            </div>
          </div>
          ${noteHtml}
          <div class="slots">${slotsHtml}</div>
        </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>팀 매칭 - 팀제용</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #0f172a;
      font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
      font-size: 12px;
      line-height: 1.5;
      background: #fff;
    }
    header { margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2px solid #0f172a; }
    h1 { margin: 0 0 4px; font-size: 22px; letter-spacing: -0.02em; }
    .sub { margin: 0; color: #64748b; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .team {
      break-inside: avoid;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      background: #f8fafc;
    }
    .team-head { display: flex; justify-content: space-between; gap: 6px; align-items: center; margin-bottom: 8px; }
    .team-head h2 { margin: 0; font-size: 14px; }
    .badges { display: flex; gap: 4px; flex-wrap: wrap; }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2px 8px;
      background: #e2e8f0;
      color: #475569;
      font-size: 10px;
      font-weight: 600;
    }
    .badge.ok { background: #d1fae5; color: #047857; }
    .note { margin: 0 0 8px; color: #64748b; white-space: pre-wrap; font-size: 11px; }
    .slots { display: grid; gap: 4px; }
    .slot {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #fff;
      padding: 6px 8px;
    }
    .pos {
      width: 36px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      border-radius: 4px;
      padding: 2px 0;
    }
    .member { font-weight: 600; color: #0f172a; }
    .muted { color: #94a3b8; }
    .warn { color: #dc2626; font-weight: 600; }
    footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <header>
    <h1>팀 매칭 · 팀제용</h1>
    <p class="sub">팀 ${boards.value.length}개 · 완료 ${completeCount} · 확정 ${confirmedCount}</p>
  </header>
  <main class="grid">${teamSections}</main>
  <footer>BandPick</footer>
</body>
</html>`;
}

async function exportMatchPdf() {
  if (isExporting.value || !boards.value.length) {
    return;
  }
  isExporting.value = true;

  let iframe: HTMLIFrameElement | null = null;

  try {
    const html = buildMatchExportDocumentHtml();
    iframe = document.createElement("iframe");
    iframe.setAttribute("title", "team-match-pdf-export");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = iframe.contentDocument ?? frameWindow?.document;
    if (!frameWindow || !frameDocument) {
      throw new Error("print-frame-unavailable");
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    await new Promise<void>((resolve) => {
      const done = () => resolve();
      if (frameDocument.readyState === "complete") {
        window.setTimeout(done, 50);
        return;
      }
      iframe?.addEventListener("load", () => window.setTimeout(done, 50), {
        once: true,
      });
      window.setTimeout(done, 400);
    });

    frameWindow.focus();
    frameWindow.print();
  } catch {
    showAlert(
      "error",
      "내보내기 실패",
      "PDF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    );
  } finally {
    if (iframe?.parentNode) {
      window.setTimeout(() => {
        iframe?.remove();
      }, 60_000);
    }
    isExporting.value = false;
  }
}

/* =========================================================
 * 초기 실행
 * ========================================================= */

function emptyBoard(name: string): Board {
  const board: Board = {
    name,
    status: "대기",
    note: "",
    confirmed: false,
    slots: POSITION_LIST.map((position) => ({
      position,
      occupant: null,
      needed: !OPTIONAL_POSITIONS.has(position),
      pinned: false,
    })),
  };
  applyVocalNeededRules(board);
  return board;
}

function ensureTeamBoards() {
  const byName = new Map(
    boards.value.map((team) => [team.name, team] as const),
  );

  boards.value = TEAM_BOARD_NAMES.map(
    (name) => byName.get(name) ?? emptyBoard(name),
  );
}

onMounted(async () => {
  await loadSubmissionStatus();
  const restored = await loadSavedAssignments();
  if (!restored) {
    await handleMatch();
  }
  ensureTeamBoards();
  syncPool();
});

onUnmounted(() => {
  stopDragAutoScroll();
});
</script>
