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

    <!-- 저장 에러 -->
    <p v-if="saveError" class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ saveError }}
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

        <div class="flex items-center gap-2">
          <span v-if="isDirty" class="text-xs font-medium text-amber-600">
            저장되지 않은 변경사항이 있습니다
          </span>

          <button type="button"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!isDirty || isSaving" @click="saveAssignments">
            {{ isSaving ? "저장 중..." : "변경사항 저장" }}
          </button>
        </div>
      </div>

      <div v-if="!boards.length && !unassignedPool.length"
        class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        {{ isMatching || isLoading ? "팀 배정 결과를 불러오는 중..." : "제출된 팀제 신청이 없습니다." }}
      </div>

      <!-- 미배정 인원: 팀이 없어도 제출한 부원은 여기에 표시 -->
      <div v-if="boards.length || unassignedPool.length"
        class="mb-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 transition" :class="{
          'border-blue-400 bg-blue-50': dropTarget === 'pool',
        }" @dragover.prevent="dropTarget = 'pool'" @dragleave="onPoolDragLeave" @drop="onDropToPool">
        <p class="mb-2 text-xs font-semibold text-slate-500">
          미배정 인원 ({{ unassignedPool.length }}명)
        </p>

        <div v-if="!unassignedPool.length" class="text-xs text-slate-400">
          전원 배정 완료
        </div>

        <div v-else class="flex flex-wrap gap-2">
          <span v-for="member in unassignedPool" :key="member.userId" draggable="true"
            class="cursor-grab select-none rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm active:cursor-grabbing"
            :class="{
              'opacity-30': draggingUserId === member.userId,
            }" @dragstart="
              onDragStart(
                $event,
                { origin: 'pool' },
                member
              )
              " @dragend="onDragEnd">
            {{ member.name }}
          </span>
        </div>
      </div>

      <!-- 팀 카드: PC 3개 / 모바일 1개씩 넘김 -->
      <div v-if="boards.length">
        <div class="mb-3 flex items-center gap-2">
          <button type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="boardPageIndex <= 0" aria-label="이전 팀" @click="goToPage(boardPageIndex - 1)">
            ‹
          </button>

          <div class="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1">
            <button v-for="(team, teamIndex) in boards" :key="`page-${team.name}`" type="button"
              class="rounded-full px-3 py-1.5 text-xs font-semibold transition" :class="isTeamOnCurrentPage(teamIndex)
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'" @click="goToTeam(teamIndex)">
              {{ team.name }}
            </button>
          </div>

          <button type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="boardPageIndex >= boardPageCount - 1" aria-label="다음 팀" @click="goToPage(boardPageIndex + 1)">
            ›
          </button>
        </div>

        <div ref="boardScroller"
          class="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          tabindex="0" @scroll.passive="onBoardScroll" @keydown="onBoardKeydown">
          <div v-for="(page, pageIndex) in boardPages" :key="`board-page-${pageIndex}`"
            class="flex shrink-0 snap-start gap-4" :style="{ flex: '0 0 100%' }">
            <article v-for="(team, indexInPage) in page" :key="team.name"
              class="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" :style="boardCardStyle">
              <!-- 팀 헤더 -->
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold text-slate-900">
                  {{ team.name }}
                </h3>

                <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="team.status === '완료'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'">
                  {{ team.status }}
                </span>
              </div>

              <p v-if="team.note" class="mt-1 text-xs text-slate-500">
                {{ team.note }}
              </p>

              <!-- 포지션 슬롯 -->
              <div class="mt-3 space-y-1.5">
                <div v-for="(slot, slotIndex) in team.slots" :key="slot.position"
                  class="flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 transition"
                  :class="{
                    'border-blue-400 bg-blue-50':
                      dropTarget === `${teamBoardIndex(pageIndex, indexInPage)}-${slotIndex}`,
                    'border-slate-100 bg-slate-50':
                      !slot.needed &&
                      !slot.occupant &&
                      dropTarget !== `${teamBoardIndex(pageIndex, indexInPage)}-${slotIndex}`,
                    'border-slate-200':
                      slot.needed ||
                      slot.occupant ||
                      dropTarget === `${teamBoardIndex(pageIndex, indexInPage)}-${slotIndex}`,
                  }" @dragover.prevent="
                    dropTarget = `${teamBoardIndex(pageIndex, indexInPage)}-${slotIndex}`
                    " @dragleave="
                      onSlotDragLeave(teamBoardIndex(pageIndex, indexInPage), slotIndex)
                      " @drop="
                      onDropToSlot(
                        $event,
                        teamBoardIndex(pageIndex, indexInPage),
                        slotIndex
                      )
                      ">
                  <!-- 포지션 -->
                  <span
                    class="w-12 shrink-0 rounded px-2 py-1 text-center text-xs font-semibold"
                    :class="!slot.needed && !slot.occupant
                      ? 'bg-slate-50 text-slate-300'
                      : 'bg-slate-100 text-slate-500'">
                    {{ slot.position }}
                  </span>

                  <!-- 배정된 사람 -->
                  <span v-if="slot.occupant"
                    class="flex min-w-0 flex-1 items-center justify-between rounded-md bg-sky-300 px-2.5 py-1 text-sm font-medium text-black">
                    <span draggable="true" class="min-w-0 flex-1 cursor-grab whitespace-nowrap select-none active:cursor-grabbing" :class="{
                      'opacity-30': draggingUserId === slot.occupant.userId,
                    }" @dragstart="
                      onDragStart(
                        $event,
                        {
                          origin: 'slot',
                          teamIndex: teamBoardIndex(pageIndex, indexInPage),
                          slotIndex,
                        },
                        slot.occupant
                      )
                      " @dragend="onDragEnd">
                      {{ slot.occupant.name }}
                      <span class="ml-1.5 text-xs text-slate-600">
                        {{ slot.occupant.level }}
                      </span>
                    </span>

                    <button type="button"
                      class="ml-2 shrink-0 rounded px-1 text-sm text-slate-600 hover:bg-sky-200 hover:text-slate-900"
                      title="배정 해제" @mousedown.stop
                      @click.stop="unassign(teamBoardIndex(pageIndex, indexInPage), slotIndex)">
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

                  <button type="button"
                    class="w-14 shrink-0 rounded px-1 py-1 text-[11px] font-medium transition"
                    :class="slot.needed
                      ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'"
                    :title="slot.needed ? '이 포지션은 필요 없음' : '이 포지션을 다시 배정'"
                    @mousedown.stop
                    @click.stop="setSlotNeeded(teamBoardIndex(pageIndex, indexInPage), slotIndex, !slot.needed)">
                    {{ slot.needed ? "필요없음" : "필요" }}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
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
                    검색어나 제출 상태 필터를 확인해주세요.
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
                      class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
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
  </div>
</template>

<script setup lang="ts">
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
  "V",
  "D",
  "B",
  "EG1",
  "EG2",
  "AG",
  "K",
] as const;

const OPTIONAL_POSITIONS = new Set<string>(["AG", "K"]);

const TEAM_BOARD_NAMES = [
  "A팀",
  "B팀",
  "C팀",
  "D팀",
  "E팀",
  "F팀",
  "G팀",
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
};

type Board = {
  name: string;
  status: string;
  note: string;
  slots: Slot[];
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
const saveError = ref("");

const rows = ref<SubmissionRow[]>([]);

const searchQuery = ref("");

const statusFilter = ref<
  "all" | "submitted" | "pending"
>("all");

const boards = ref<Board[]>([]);

const boardScroller = ref<HTMLElement | null>(null);
const boardPageIndex = ref(0);
const boardPageSize = ref(3);
const BOARD_PC_QUERY = "(min-width: 768px)";
const BOARD_CARD_GAP_PX = 16;
let boardScrollLock = false;
let boardScrollUnlockTimer: ReturnType<typeof setTimeout> | null = null;

const boardPageCount = computed(() =>
  Math.max(1, Math.ceil(boards.value.length / boardPageSize.value)),
);

const boardPages = computed(() => {
  const size = boardPageSize.value;
  const pages: Board[][] = [];
  for (let index = 0; index < boards.value.length; index += size) {
    pages.push(boards.value.slice(index, index + size));
  }
  return pages;
});

const boardCardStyle = computed(() => {
  const size = boardPageSize.value;
  if (size <= 1) {
    return { width: "100%" };
  }
  return {
    width: `calc((100% - ${(size - 1) * BOARD_CARD_GAP_PX}px) / ${size})`,
  };
});

const unassignedPool =
  ref<UnmatchedMember[]>([]);

const knownPeople = ref<Map<number, Occupant>>(new Map());

const isDirty = ref(false);

const scheduleDialogOpen = ref(false);
const scheduleDialogName = ref("");
const scheduleDialogSlots = ref<
  {
    dayOfWeek: string;
    startTime: string;
  }[]
>([]);

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

    if (!query) {
      return true;
    }

    return row.name
      .toLowerCase()
      .includes(query);
  });
});

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

/* =========================================================
 * 매칭 결과 → 대시보드 변환
 * ========================================================= */

function buildBoardsFromMatchResult(
  result: MatchResult
) {
  boards.value = result.teams.map(
    (team) => {
      const byPosition =
        new Map(
          team.members.map(
            (member) => [
              member.session,
              member,
            ] as const
          )
        );

      return {
        name: team.name,
        status: team.status,
        note: team.note,

        slots:
          POSITION_LIST.map(
            (position) => {
              const member =
                byPosition.get(
                  position
                );

              return {
                position,

                occupant: member
                  ? {
                    userId:
                      member.userId,
                    name:
                      member.name,
                    level:
                      member.level,
                  }
                  : null,

                needed: Boolean(member) || !OPTIONAL_POSITIONS.has(position),
              };
            }
          ),
      };
    }
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
 * 팀 매칭
 * ========================================================= */

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
}

/* 드래그 종료 */
function onDragEnd() {
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

/* 슬롯으로 드롭: 다른 팀/세션으로 복사해 여러 팀·겸임을 허용 */
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

  const targetSlot = boards.value[teamIndex].slots[slotIndex];
  const displaced = targetSlot.occupant;

  if (
    payload.origin.origin === "slot" &&
    payload.origin.teamIndex === teamIndex &&
    payload.origin.slotIndex === slotIndex
  ) {
    dragPayload.value = null;
    return;
  }

  targetSlot.occupant = payload.occupant;
  targetSlot.needed = true;
  rememberPerson(payload.occupant);

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

/* 미배정 풀로 드롭: 해당 슬롯만 해제 */
function onDropToPool(event: DragEvent) {
  dropTarget.value = null;

  const payload = dragPayload.value;
  if (!payload || payload.origin.origin !== "slot") {
    dragPayload.value = null;
    return;
  }

  const { teamIndex, slotIndex } = payload.origin;
  const occupant = boards.value[teamIndex].slots[slotIndex].occupant;
  if (occupant) {
    rememberPerson(occupant);
    for (const slot of boards.value[teamIndex].slots) {
      if (slot.occupant?.userId === occupant.userId) {
        slot.occupant = null;
      }
    }
  }
  syncPool();
  refreshBoardStatus(payload.origin.teamIndex);
  isDirty.value = true;
  dragPayload.value = null;
}

/* 배정 해제 */
function unassign(teamIndex: number, slotIndex: number) {
  const slot = boards.value[teamIndex].slots[slotIndex];
  const occupant = slot.occupant;
  if (!occupant) {
    return;
  }
  rememberPerson(occupant);
  for (const teamSlot of boards.value[teamIndex].slots) {
    if (teamSlot.occupant?.userId === occupant.userId) {
      teamSlot.occupant = null;
    }
  }
  syncPool();
  refreshBoardStatus(teamIndex);
  isDirty.value = true;
}

function setSlotNeeded(teamIndex: number, slotIndex: number, needed: boolean) {
  const slot = boards.value[teamIndex].slots[slotIndex];
  if (!needed && slot.occupant) {
    rememberPerson(slot.occupant);
    slot.occupant = null;
  }
  slot.needed = needed;
  syncPool();
  refreshBoardStatus(teamIndex);
  isDirty.value = true;
}

function refreshBoardStatus(teamIndex: number) {
  const team = boards.value[teamIndex];
  if (!team) {
    return;
  }
  const hasMember = team.slots.some((slot) => slot.occupant);
  const complete = team.slots.every((slot) => !slot.needed || slot.occupant);
  team.status = hasMember && complete ? "완료" : "대기";
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
    .filter((person) => !hasAnyAssignment(person.userId))
    .map((person) => ({
      userId: person.userId,
      name: person.name,
      level: person.level,
      reason: "미배정",
    }));
}

/* =========================================================
 * 배정 저장
 * ========================================================= */

async function saveAssignments() {
  isSaving.value = true;
  saveError.value = "";

  try {
    await $fetch(
      `${teamFormsApiUrl.value}/assignments`,
      {
        method: "POST",

        body: {
          teams:
            boards.value.map(
              (team) => ({
                name: team.name,

                slots:
                  team.slots.map(
                    (slot) => ({
                      position:
                        slot.position,

                      userId:
                        slot.occupant
                          ?.userId ??
                        null,

                      needed:
                        slot.needed,
                    })
                  ),
              })
            ),
        },
      }
    );

    isDirty.value = false;
  } catch {
    saveError.value =
      "변경사항 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";
  } finally {
    isSaving.value = false;
  }
}

/* =========================================================
 * 초기 실행
 * ========================================================= */

function emptyBoard(name: string): Board {
  return {
    name,
    status: "대기",
    note: "",
    slots: POSITION_LIST.map((position) => ({
      position,
      occupant: null,
      needed: !OPTIONAL_POSITIONS.has(position),
    })),
  };
}

function ensureTeamBoards() {
  const byName = new Map(
    boards.value.map((team) => [team.name, team] as const),
  );

  boards.value = TEAM_BOARD_NAMES.map(
    (name) => byName.get(name) ?? emptyBoard(name),
  );
  clampBoardPage();
  nextTick(() => goToPage(boardPageIndex.value, false));
}

function teamBoardIndex(pageIndex: number, indexInPage: number) {
  return pageIndex * boardPageSize.value + indexInPage;
}

function isTeamOnCurrentPage(teamIndex: number) {
  const start = boardPageIndex.value * boardPageSize.value;
  return (
    teamIndex >= start &&
    teamIndex < start + boardPageSize.value
  );
}

function readBoardPageSize() {
  if (!import.meta.client) return 3;
  return window.matchMedia(BOARD_PC_QUERY).matches ? 3 : 1;
}

function clampBoardPage() {
  if (!boards.value.length) {
    boardPageIndex.value = 0;
    return;
  }
  boardPageIndex.value = Math.min(
    boardPageIndex.value,
    Math.max(0, boardPageCount.value - 1),
  );
}

function goToTeam(index: number) {
  const size = Math.max(1, boardPageSize.value);
  goToPage(Math.floor(index / size));
}

function goToPage(index: number, _smooth = true) {
  if (!boards.value.length) return;
  const nextIndex = Math.min(
    Math.max(index, 0),
    Math.max(0, boardPageCount.value - 1),
  );
  boardPageIndex.value = nextIndex;

  const scroller = boardScroller.value;
  if (!scroller) return;

  boardScrollLock = true;
  if (boardScrollUnlockTimer) {
    clearTimeout(boardScrollUnlockTimer);
  }
  scroller.scrollTo({
    left: nextIndex * scroller.clientWidth,
    behavior: "auto",
  });
  boardScrollUnlockTimer = setTimeout(() => {
    boardScrollLock = false;
    boardScrollUnlockTimer = null;
  }, 50);
}

function onBoardScroll() {
  if (boardScrollLock) return;
  const scroller = boardScroller.value;
  if (!scroller || !boards.value.length) return;
  const width = scroller.clientWidth;
  if (width <= 0) return;
  boardPageIndex.value = Math.min(
    Math.max(0, boardPageCount.value - 1),
    Math.max(0, Math.round(scroller.scrollLeft / width)),
  );
}

function onBoardKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToPage(boardPageIndex.value - 1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    goToPage(boardPageIndex.value + 1);
  }
}

function syncBoardPagePosition() {
  const nextSize = readBoardPageSize();
  if (nextSize !== boardPageSize.value) {
    const firstTeam = boardPageIndex.value * boardPageSize.value;
    boardPageSize.value = nextSize;
    goToPage(Math.floor(firstTeam / nextSize), false);
    return;
  }
  goToPage(boardPageIndex.value, false);
}

onMounted(async () => {
  if (import.meta.client) {
    boardPageSize.value = readBoardPageSize();
    window.addEventListener("resize", syncBoardPagePosition);
  }
  await loadSubmissionStatus();
  await handleMatch();
  ensureTeamBoards();
  syncPool();
});

onUnmounted(() => {
  if (boardScrollUnlockTimer) {
    clearTimeout(boardScrollUnlockTimer);
  }
  if (import.meta.client) {
    window.removeEventListener("resize", syncBoardPagePosition);
  }
});
</script>
