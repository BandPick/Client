<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            공연 참가 정보 입력
          </h1>
          <div class="mt-3 grid w-full max-w-[240px] grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold transition" :class="formMode === 'song'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              " @click="formMode = 'song'">
              일반
            </button>
            <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold transition" :class="formMode === 'team'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              " @click="formMode = 'team'">
              팀제
            </button>
          </div>
        </div>
        <div class="hidden text-right text-xs font-medium text-slate-500 sm:block">
          <p>신청 마감 시간 {{ deadlineDisplay }}</p>
          <p class="mt-0.5">신청 마감까지 {{ timeRemainingLabel }}</p>
        </div>
      </div>
      <div class="mt-2 text-xs font-medium text-slate-500 sm:hidden">
        <p>신청 마감 시간 {{ deadlineDisplay }}</p>
        <p class="mt-0.5">신청 마감까지 {{ timeRemainingLabel }}</p>
      </div>

      <p v-if="settingsError"
        class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {{ settingsError }}
      </p>

      <div class="mt-6 grid gap-6 lg:mt-8 lg:gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div class="min-w-0 space-y-5 sm:space-y-6">
          <MemberTeamFormFields v-if="formMode === 'team'" v-model:skills="teamSkills"
            v-model:preferred-teammates="preferredTeammates" v-model:max-teams="maxTeams" />
          <div v-else>
            <p class="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
              희망 곡 및 세션
              <span class="font-normal text-slate-500">
                (최소 6지망 · 추가 가능)
              </span>
            </p>
            <p v-if="setlistError"
              class="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {{ setlistError }}
            </p>
            <div class="space-y-4">
              <div v-for="(pick, index) in form.picks" :key="`pick-${index}`" class="py-1">
                <div class="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                  <span class="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                    {{ pickLabel(index) }}
                  </span>
                  <select v-model="pick.songId" :disabled="setlistLoading"
                    class="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    @change="onPickSongChange(index)">
                    <option value="">
                      {{
                        setlistLoading
                          ? "공연 곡 목록 불러오는 중…"
                          : songs.length
                            ? "곡 선택"
                            : "등록된 공연 곡이 없습니다 (관리자 설정에서 셋리스트를 저장해 주세요)"
                      }}
                    </option>
                    <option v-for="song in getAvailableSongsForPick(index)" :key="song.id" :value="song.id">
                      {{ song.displayTitle }}
                    </option>
                  </select>
                  <button v-if="index >= INITIAL_PICK_ROWS" type="button"
                    class="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    @click="removePick(index)">
                    삭제
                  </button>
                </div>

                <div v-if="pick.songId"
                  class="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-3 pl-12 sm:pl-14">
                  <p class="text-xs font-semibold text-slate-800">
                    희망 세션
                    <span class="font-normal text-slate-500">(복수 선택)</span>
                  </p>

                  <div v-if="getDisplaySessionsForSong(pick.songId).length" class="flex flex-wrap gap-2">
                    <button v-for="session in getDisplaySessionsForSong(pick.songId)" :key="`${pick.songId}-${session}`"
                      type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm"
                      :class="pick.sessions.includes(session)
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                        " :disabled="isSessionBlockedForPick(index, session)" :title="isSessionBlockedForPick(index, session)
                          ? '이미 다른 지망에서 선택한 곡·세션입니다.'
                          : ''
                          " @click="toggleSession(index, session)">
                      {{ getSessionLabel(pick.songId, session) }}
                    </button>
                  </div>
                  <p v-else class="text-xs text-amber-800">
                    이 곡에는 등록된 세션이 없습니다. 관리자 설정의 공연
                    셋리스트에서 세션 구성을 저장했는지 확인해 주세요.
                  </p>
                </div>
              </div>
            </div>

            <button type="button"
              class="mt-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              @click="addPick">
              + 지망 추가하기
            </button>
          </div>
        </div>

        <div class="min-w-0">
          <p class="mb-2 text-base font-semibold text-slate-800 sm:text-lg">
            합주 가능 시간대 선택
          </p>
          <div class="w-full overflow-hidden rounded-2xl border border-slate-300">
            <div class="grid grid-cols-[58px_repeat(5,minmax(0,1fr))] sm:grid-cols-[64px_repeat(5,minmax(0,1fr))]">
              <div
                class="sticky left-0 z-10 border-b border-r border-slate-300 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500">
                시간
              </div>
              <div v-for="(day, dayIndex) in days" :key="`head-${day}`"
                class="border-b border-slate-300 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-600"
                :class="dayIndex === days.length - 1 ? '' : 'border-r'">
                {{ day }}
              </div>

              <template v-for="(time, timeIndex) in timeSlots" :key="`row-${time}`">
                <div
                  class="sticky left-0 z-10 border-r border-slate-300 bg-white px-2 py-2 text-center text-xs font-medium text-slate-500"
                  :class="timeIndex === timeSlots.length - 1 ? '' : 'border-b'">
                  {{ timeIndex % 2 === 0 ? time : "" }}
                </div>
                <button v-for="day in days" :key="`${day}-${time}`" type="button"
                  class="box-border h-9 border-b border-r border-slate-300 transition-colors" :class="[
                    isSelectedSlot(day, time)
                      ? 'bg-blue-100 hover:bg-blue-200'
                      : 'bg-white hover:bg-slate-50',
                  ]" @mousedown.prevent="startDrag(day, time)" @mouseenter="handleDragEnter(day, time)" />
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
        <button type="button"
          class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          :disabled="saving || settingsLoading || isDeadlinePassed" :class="saving || settingsLoading || isDeadlinePassed
            ? 'cursor-not-allowed opacity-60 hover:bg-blue-600'
            : ''
            " @click="handleSave">
          {{
            saving
              ? "저장 중..."
              : isDeadlinePassed
                ? "신청 마감됨"
                : "데이터 저장하기"
          }}
        </button>
      </div>
    </section>

    <CommonAlertDialog
      :open="alertOpen"
      :type="alertType"
      :title="alertTitle"
      :message="alertMessage"
      :action-label="alertActionLabel"
      @close="alertOpen = false"
      @confirm="onAlertConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import {
  type MemberSetlistSong,
  useMemberSetlistLoader,
} from "~/composables/useMemberSetlistLoader";
import { useMemberFormApi } from "~/composables/useMemberFormApi";
import { TEAM_POSITIONS, createEmptyTeamSkills, type TeamSkills } from "~/utils/teamForm";

type FormMode = "song" | "team";
type Pick = {
  songId: string;
  sessions: string[];
};

const REQUIRED_MIN_ROLES = 6;
const INITIAL_PICK_ROWS = 3;
const LOCAL_SUBMISSION_KEY = "bandpick-member-submission-v1";
const LOCAL_TEAM_SUBMISSION_KEY = "bandpick-team-submission-v1";
const LOCAL_FORM_MODE_KEY = "bandpick-member-form-mode-v1";
const PICK_LABELS = ["1st", "2nd", "3rd"];

const days = ["월", "화", "수", "목", "금"];
const songs = ref<MemberSetlistSong[]>([]);
const setlistLoading = ref(true);
const setlistError = ref("");
const alertOpen = ref(false);
const alertType = ref<"success" | "error">("error");
const alertTitle = ref("");
const alertMessage = ref("");
const alertActionLabel = ref("확인");
const goHomeOnConfirm = ref(false);
const { loadSongsForMemberForm } = useMemberSetlistLoader();
const { loadMemberSettings, submitMemberForm, submitTeamForm } = useMemberFormApi();
const { loadAuthUser } = useAuthApi();
const settingsLoading = ref(true);
const settingsError = ref("");
const saving = ref(false);
const formMode = ref<FormMode>("song");
const preferredTeammates = ref("");
const maxTeams = ref(1);
const teamSkills = ref<TeamSkills>(createEmptyTeamSkills());

function createEmptyPick(): Pick {
  return { songId: "", sessions: [] };
}

const form = reactive({
  picks: Array.from({ length: INITIAL_PICK_ROWS }, () => createEmptyPick()),
});

const selectedSlots = ref<Set<string>>(new Set());
const isDragging = ref(false);
const dragDay = ref<string | null>(null);
const dragMode = ref<"select" | "deselect">("select");
const movedWhileDragging = ref(false);
const deadlineAt = ref<Date | null>(null);
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

const filledRoleCount = computed(() =>
  form.picks.reduce((sum, pick) => {
    if (!pick.songId) return sum;
    return sum + pick.sessions.length;
  }, 0),
);

const deadlineDisplay = computed(() => {
  if (!deadlineAt.value) return "미설정";
  const month = String(deadlineAt.value.getMonth() + 1).padStart(2, "0");
  const day = String(deadlineAt.value.getDate()).padStart(2, "0");
  const hour = String(deadlineAt.value.getHours()).padStart(2, "0");
  const minute = String(deadlineAt.value.getMinutes()).padStart(2, "0");
  return `${deadlineAt.value.getFullYear()}-${month}-${day} ${hour}:${minute}`;
});

const timeRemainingLabel = computed(() => {
  if (settingsLoading.value) return "설정 불러오는 중";
  if (!deadlineAt.value) return "미설정";
  const diffMs = deadlineAt.value.getTime() - nowMs.value;
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

const isDeadlinePassed = computed(() => {
  if (!deadlineAt.value) return false;
  return deadlineAt.value.getTime() <= nowMs.value;
});

function pickLabel(index: number) {
  if (index < PICK_LABELS.length) return PICK_LABELS[index];
  return `${index + 1}th`;
}

function getSessionsForSong(songId: string): string[] {
  const song = songs.value.find((item) => item.id === songId);
  return song?.sessions ?? [];
}

function getDisplaySessionsForSong(songId: string): string[] {
  return getSessionsForSong(songId);
}

function getAvailableSongsForPick(pickIndex: number): MemberSetlistSong[] {
  const usedElsewhere = new Set(
    form.picks
      .filter((_, i) => i !== pickIndex)
      .map((pick) => pick.songId)
      .filter(Boolean),
  );
  const currentSongId = form.picks[pickIndex]?.songId ?? "";

  return songs.value.filter(
    (song) => !usedElsewhere.has(song.id) || song.id === currentSongId,
  );
}

function getSessionLabel(_songId: string, session: string) {
  const m = session.match(/^기타\((.*)\)$/);
  if (m) {
    const inner = (m[1] ?? "").trim();
    return inner ? `기타 (${inner})` : "기타";
  }
  return session;
}

/** 앞쪽 지망 우선 — 동일 (곡, 세션) 조합 중복 불가 */
function isSessionBlockedForPick(pickIndex: number, session: string) {
  const pick = form.picks[pickIndex];
  if (!pick?.songId || pick.sessions.includes(session)) return false;

  for (let i = 0; i < pickIndex; i += 1) {
    const other = form.picks[i];
    if (other?.songId === pick.songId && other.sessions.includes(session)) {
      return true;
    }
  }
  return false;
}

function pruneDuplicatePairs() {
  const seen = new Set<string>();
  form.picks.forEach((pick) => {
    if (!pick.songId) {
      pick.sessions = [];
      return;
    }
    pick.sessions = pick.sessions.filter((session) => {
      const key = `${pick.songId}::${session}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
}

function syncPickSessions(index: number) {
  const pick = form.picks[index];
  if (!pick) return;
  const availableSessions = getDisplaySessionsForSong(pick.songId);
  pick.sessions = pick.sessions.filter((session) =>
    availableSessions.includes(session),
  );
}

function onPickSongChange(index: number) {
  syncPickSessions(index);
  pruneDuplicatePairs();
}

function toggleSession(index: number, session: string) {
  const pick = form.picks[index];
  if (!pick?.songId) return;

  if (pick.sessions.includes(session)) {
    pick.sessions = pick.sessions.filter((item) => item !== session);
    return;
  }

  if (isSessionBlockedForPick(index, session)) return;

  pick.sessions = [...pick.sessions, session];
}

function addPick() {
  form.picks.push(createEmptyPick());
}

function removePick(index: number) {
  if (index < INITIAL_PICK_ROWS) return;
  form.picks.splice(index, 1);
  pruneDuplicatePairs();
}

function validateScheduleForSave(): string {
  if (selectedSlots.value.size === 0) {
    return "스케줄표를 작성해 주세요.";
  }
  return "";
}

function validatePicksForSave(): string {
  if (filledRoleCount.value < REQUIRED_MIN_ROLES) {
    return `희망 세션을 최소 ${REQUIRED_MIN_ROLES}개 이상 선택해 주세요. (현재 ${filledRoleCount.value}개)`;
  }
  return validateScheduleForSave();
}

function selectedTeamPositions() {
  return TEAM_POSITIONS.flatMap((position) => {
    const level = teamSkills.value[position];
    if (!level) return [];
    return [{ position, level }];
  });
}

function selectedTeamSchedules() {
  return Array.from(selectedSlots.value)
    .flatMap((key) => {
      const separatorIndex = key.indexOf("-");
      if (separatorIndex <= 0) return [];
      const dayOfWeek = key.slice(0, separatorIndex);
      const startTime = key.slice(separatorIndex + 1);
      if (!dayOfWeek || !startTime) return [];
      return [{ dayOfWeek, startTime }];
    })
    .sort((a, b) => {
      const dayOrder = days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
      if (dayOrder !== 0) return dayOrder;
      return a.startTime.localeCompare(b.startTime);
    });
}

function validateTeamFormForSave(): string {
  if (!selectedTeamPositions().length) {
    return "가능한 포지션을 하나 이상 선택하고 숙련도를 지정해 주세요.";
  }
  if (maxTeams.value < 1 || maxTeams.value > 3) {
    return "참여 가능 팀 수는 1팀부터 3팀까지 선택할 수 있습니다.";
  }
  return validateScheduleForSave();
}

function saveSubmissionDraft(body: unknown) {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(LOCAL_SUBMISSION_KEY, JSON.stringify(body));
  } catch {
    // ignore
  }
}

function saveTeamSubmissionDraft(body: unknown) {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(LOCAL_TEAM_SUBMISSION_KEY, JSON.stringify(body));
  } catch {
    // ignore
  }
}

function showAlert(
  type: "success" | "error",
  message: string,
  title = "",
  options?: { actionLabel?: string; goHomeOnConfirm?: boolean },
) {
  alertType.value = type;
  alertTitle.value = title;
  alertMessage.value = message;
  alertActionLabel.value = options?.actionLabel || "확인";
  goHomeOnConfirm.value = options?.goHomeOnConfirm ?? false;
  alertOpen.value = true;
}

async function onAlertConfirm() {
  const goHome = goHomeOnConfirm.value;
  alertOpen.value = false;
  goHomeOnConfirm.value = false;
  if (goHome) {
    await navigateTo("/");
  }
}

function isSubmissionNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; cause?: { code?: string } };
  const message = String(err.message ?? "");
  return (
    err.cause?.code === "ECONNREFUSED" ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("fetch failed")
  );
}

async function handleSave() {
  if (saving.value) return;
  if (settingsLoading.value) {
    showAlert("error", "마감 설정을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.", "저장 실패");
    return;
  }
  if (!deadlineAt.value) {
    showAlert("error", "마감 시간이 설정되지 않았습니다. 관리자에게 문의해 주세요.", "저장 실패");
    return;
  }
  if (isDeadlinePassed.value) {
    showAlert("error", "신청 마감 시간이 지나 제출할 수 없습니다.", "저장 실패");
    return;
  }
  if (formMode.value === "team") {
    await handleTeamSave();
    return;
  }
  const validationError = validatePicksForSave();
  if (validationError) {
    showAlert("error", validationError, "ERROR");
    return;
  }
  const requestBody = {
    picks: form.picks
      .map((pick, index) => ({ pick, index }))
      .filter(({ pick }) => pick.songId && pick.sessions.length > 0)
      .map(({ pick, index }) => ({
        priority: index + 1,
        songId: Number(pick.songId),
        sessions: [...pick.sessions],
      }))
      .filter((pick) => Number.isFinite(pick.songId)),
    availableSlots: Array.from(selectedSlots.value).sort(),
  };

  saving.value = true;
  try {
    const response = await submitMemberForm(requestBody);
    if (response.success) {
      showAlert(
        "success",
        response.message || "제출 되었습니다.",
        "완료",
        { actionLabel: "메인 화면으로", goHomeOnConfirm: true },
      );
      return;
    }
    showAlert("error", response.message || "제출에 실패했습니다.", "저장 실패");
  } catch (error) {
    if (import.meta.dev && isSubmissionNetworkError(error)) {
      saveSubmissionDraft(requestBody);
      showAlert(
        "success",
        "백엔드 미연결 상태입니다. 입력 내용을 브라우저에 임시 저장했습니다.",
        "임시 저장",
      );
      return;
    }
    showAlert(
      "error",
      "제출 중 오류가 발생했습니다. 네트워크와 서버 상태를 확인해 주세요.",
      "저장 실패",
    );
  } finally {
    saving.value = false;
  }
}

function extractSaveErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

async function handleTeamSave() {
  const validationError = validateTeamFormForSave();
  if (validationError) {
    showAlert("error", validationError, "ERROR");
    return;
  }

  const requestBody = {
    teammates: preferredTeammates.value.trim(),
    maxTeams: maxTeams.value,
    positions: selectedTeamPositions(),
    schedules: selectedTeamSchedules(),
  };

  saving.value = true;
  try {
    const user = loadAuthUser();
    if (!user) {
      saveTeamSubmissionDraft(requestBody);
      if (import.meta.dev) {
        showAlert(
          "success",
          "로그인 정보가 없어 입력 내용을 브라우저에 임시 저장했습니다.",
          "임시 저장",
        );
      } else {
        showAlert("error", "로그인 정보가 없습니다. 다시 로그인해 주세요.", "저장 실패");
      }
      return;
    }

    const response = await submitTeamForm(user.id, requestBody);
    showAlert(
      "success",
      response.message || "제출되었습니다.",
      "완료",
      { actionLabel: "메인 화면으로", goHomeOnConfirm: true },
    );
  } catch (error) {
    if (import.meta.dev && isSubmissionNetworkError(error)) {
      saveTeamSubmissionDraft(requestBody);
      showAlert(
        "success",
        "백엔드 미연결 상태입니다. 입력 내용을 브라우저에 임시 저장했습니다.",
        "임시 저장",
      );
      return;
    }
    showAlert(
      "error",
      extractSaveErrorMessage(
        error,
        "제출 중 오류가 발생했습니다. 네트워크와 서버 상태를 확인해 주세요.",
      ),
      "저장 실패",
    );
  } finally {
    saving.value = false;
  }
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
  isDragging.value = false;
  movedWhileDragging.value = false;
  dragDay.value = null;
}

function resetSlots() {
  selectedSlots.value = new Set();
}

onMounted(async () => {
  if (import.meta.client) {
    try {
      const savedMode = localStorage.getItem(LOCAL_FORM_MODE_KEY);
      if (savedMode === "song" || savedMode === "team") {
        formMode.value = savedMode;
      }
    } catch {
      // ignore
    }
  }

  settingsLoading.value = true;
  settingsError.value = "";
  try {
    const settings = await loadMemberSettings();
    if (!settings) {
      settingsError.value =
        "마감 설정을 불러오지 못했습니다. 관리자 설정(/admin/settings)에서 마감 일시를 저장해 주세요.";
      deadlineAt.value = null;
    } else {
      const parsed = new Date(settings.deadline);
      if (Number.isNaN(parsed.getTime())) {
        settingsError.value =
          "마감 시간 형식을 해석할 수 없습니다. 관리자 설정을 확인해 주세요.";
        deadlineAt.value = null;
      } else {
        deadlineAt.value = parsed;
      }
    }
  } catch {
    settingsError.value =
      "마감 설정을 불러오지 못했습니다. 관리자/서버 상태를 확인해 주세요.";
    deadlineAt.value = null;
  } finally {
    settingsLoading.value = false;
  }

  setlistLoading.value = true;
  setlistError.value = "";
  try {
    songs.value = await loadSongsForMemberForm();
    if (!songs.value.length) {
      setlistError.value =
        "등록된 공연 곡이 없습니다. 관리자 설정(/admin/settings)에서 셋리스트를 추가해 주세요.";
    }
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

watch(formMode, (mode) => {
  alertOpen.value = false;
  goHomeOnConfirm.value = false;
  if (!import.meta.client) return;
  try {
    localStorage.setItem(LOCAL_FORM_MODE_KEY, mode);
  } catch {
    // ignore
  }
});

watch(
  songs,
  () => {
    form.picks.forEach((_, index) => onPickSongChange(index));
  },
  { deep: true },
);

useHead({
  title: computed(() =>
    formMode.value === "team" ? "BandPick 부원 · 팀제" : "BandPick 부원",
  ),
});
</script>