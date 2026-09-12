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

      <!-- 팀 카드 -->
      <div v-if="boards.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="(team, teamIndex) in boards" :key="team.name"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <!-- 팀 헤더 -->
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold text-slate-900">
              {{ team.name }}
            </h3>

            <span class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {{ team.status }}
            </span>
          </div>

          <p v-if="team.note" class="mt-1 text-xs text-slate-500">
            {{ team.note }}
          </p>

          <!-- 포지션 슬롯 -->
          <div class="mt-3 space-y-1.5">
            <div v-for="(slot, slotIndex) in team.slots" :key="slot.position"
              class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 transition" :class="{
                'border-blue-400 bg-blue-50':
                  dropTarget === `${teamIndex}-${slotIndex}`,
              }" @dragover.prevent="
                dropTarget = `${teamIndex}-${slotIndex}`
                " @dragleave="
                  onSlotDragLeave(teamIndex, slotIndex)
                  " @drop="
                    onDropToSlot(
                      $event,
                      teamIndex,
                      slotIndex
                    )
                    ">
              <!-- 포지션 -->
              <span
                class="w-12 shrink-0 rounded bg-slate-100 px-2 py-1 text-center text-xs font-semibold text-slate-500">
                {{ slot.position }}
              </span>

              <!-- 배정된 사람 -->
              <span v-if="slot.occupant"
                class="flex flex-1 items-center justify-between rounded-md bg-sky-300 px-2.5 py-1 text-sm font-medium text-black">
                <span draggable="true" class="flex-1 cursor-grab select-none active:cursor-grabbing" :class="{
                  'opacity-30': draggingUserId === slot.occupant.userId,
                }" @dragstart="
                  onDragStart(
                    $event,
                    {
                      origin: 'slot',
                      teamIndex,
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
                  title="배정 해제" @mousedown.stop @click.stop="unassign(teamIndex, slotIndex)">
                  ✕
                </button>
              </span>

              <!-- 빈 슬롯 -->
              <span v-else
                class="flex flex-1 rounded-md border border-dashed border-slate-300 px-2.5 py-1 text-center text-xs text-slate-400">
                배정 필요
              </span>
            </div>
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
          <table class="w-full min-w-[760px] border-collapse text-sm">
            <thead class="bg-slate-50">
              <tr>
                <!-- 이름 -->
                <th
                  class="w-30 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  이름
                </th>

                <!-- 제출 현황 -->
                <th
                  class="w-30 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  제출 현황
                </th>

                <!-- 가능 포지션 -->
                <th
                  class="w-72 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  가능 포지션
                </th>

                <!-- 참여 팀 수 -->
                <th
                  class="w-40 border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  참여 가능한 팀 수
                </th>

                <!-- 희망 팀원 -->
                <th
                  class="border-b border-slate-200 px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-slate-500">
                  희망 팀원
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <!-- 로딩 -->
              <tr v-if="isLoading">
                <td colspan="5" class="px-5 py-12 text-center text-sm text-slate-400">
                  제출 현황을 불러오는 중...
                </td>
              </tr>

              <!-- 검색 결과 없음 -->
              <tr v-else-if="!filteredRows.length">
                <td colspan="5" class="px-5 py-12 text-center">
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

                    제출 완료
                  </span>

                  <span v-else
                    class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    <span class="h-1.5 w-1.5 rounded-full bg-slate-400" />

                    미제출
                  </span>
                </td>

                <!-- 가능 포지션 -->
                <td class="px-5 py-4 align-middle">
                  <div v-if="
                    row.submitted &&
                    row.positions.length
                  " class="flex flex-wrap gap-1.5">
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

                <!-- 희망 팀원 -->
                <td class="px-5 py-4 align-middle">
                  <span v-if="
                    row.submitted &&
                    row.teammates
                  " class="text-sm text-slate-600">
                    {{ row.teammates }}
                  </span>

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
};

type TeamFormMember = {
  userId: number;
  name: string;
  code: string;
  teammates: string;
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
  teammates: string;
  maxTeams: number;
  scheduleCount: number;
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

type Occupant = {
  userId: number;
  name: string;
  level: string;
};

type Slot = {
  position: string;
  occupant: Occupant | null;
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

const unassignedPool =
  ref<UnmatchedMember[]>([]);

const knownPeople = ref<Map<number, Occupant>>(new Map());

const isDirty = ref(false);

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
    ensureAssignableBoard();
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
          (form?.positions ?? []).map(
            (item) =>
              `${item.position}(${item.level})`
          ),

        teammates:
          form?.teammates?.trim() ?? "",

        maxTeams: form?.maxTeams ?? 1,

        scheduleCount:
          form?.schedules?.length ?? 0,
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
              };
            }
          ),
      };
    }
  );

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
    ensureAssignableBoard();
  } catch {
    matchError.value =
      "자동 팀 배정에 실패했습니다. 제출된 인원은 미배정으로 표시합니다.";
    ensureAssignableBoard();
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
  rememberPerson(payload.occupant);

  if (payload.origin.origin === "pool") {
    removeFromPool(payload.occupant.userId);
  }

  if (displaced) {
    rememberPerson(displaced);
  }

  syncPool();
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
  isDirty.value = true;
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
    status: "수동 배정",
    note: "제출 인원이 적어 자동으로 팀을 만들지 못했습니다. 미배정 인원을 끌어다 배정하세요.",
    slots: POSITION_LIST.map((position) => ({
      position,
      occupant: null,
    })),
  };
}

function ensureAssignableBoard() {
  if (boards.value.length > 0) return;
  if (!rows.value.some((row) => row.submitted)) return;
  boards.value = [emptyBoard("A팀")];
}

onMounted(async () => {
  await loadSubmissionStatus();
  await handleMatch();
  ensureAssignableBoard();
  syncPool();
});
</script>
