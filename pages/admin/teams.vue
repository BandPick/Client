<template>
  <div>
    <h1 class="text-2xl font-bold">팀 매칭</h1>

    <div class="mt-6 flex flex-wrap gap-2">
      <button type="button"
        class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isLoadingData" @click="handleLoadData">
        <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        {{ isLoadingData ? "불러오는 중..." : "데이터 불러오기" }}
      </button>

      <button type="button"
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isMatching" @click="handleStartMatching">
        <svg class="h-4 w-4 shrink-0 text-white" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {{ isMatching ? "매칭 계산 중..." : "팀 매칭하기" }}
      </button>
    </div>

    <p v-if="loadError" class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ loadError }}
    </p>

    <p v-if="matchError" class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ matchError }}
    </p>

    <section v-if="activeTab === null"
      class="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center">
      <p class="text-lg font-medium text-slate-900">
        데이터가 없습니다.
      </p>

      <p class="mt-1 text-sm text-slate-500">
        '데이터 불러오기' 버튼을 눌러 시작하세요.
      </p>
    </section>

    <section v-if="activeTab === 'matrix'" class="mt-8 rounded-xl border border-slate-200 bg-white">
      <div class="border-b border-slate-200 px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold">데이터 불러오기</h2>
          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1.5">
              <span class="h-3 w-3 rounded-sm bg-slate-200/80 ring-1 ring-slate-300" />
              불필요
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-3 w-3 rounded-sm bg-rose-50 ring-1 ring-rose-200" />
              미지원
            </span>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[920px] w-full table-fixed border-collapse border border-slate-200 text-sm">
          <thead class="bg-slate-100 text-slate-700">
            <tr>
              <th
                class="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-center font-semibold">
                곡 명
              </th>

              <th v-for="session in SESSIONS" :key="session"
                class="border-b border-r border-slate-200 px-3 py-2 text-center font-semibold">
                {{ session }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="song in setlistTitles" :key="song" class="align-top transition-colors hover:bg-slate-50">
              <th
                class="sticky left-0 z-[1] border-b border-r border-slate-200 bg-white px-3 py-3 text-center font-medium text-slate-800">
                {{ song }}
              </th>

              <td v-for="session in SESSIONS" :key="`${song}-${session}`"
                class="border-b border-r border-slate-200 px-2 py-2" :class="matrixCellClass(song, session)">
                <template v-if="isSessionRequired(song, session)">
                  <div v-if="songMatrix[song][session].length" class="space-y-0.5 text-center text-slate-700">
                    <p v-for="entry in songMatrix[song][session]" :key="entry">
                      {{ entry }}
                    </p>
                  </div>
                  <span v-else class="flex h-full items-center justify-center text-xs font-semibold text-rose-600">
                    미지원
                  </span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="activeTab === 'matching'" class="mt-8 rounded-xl border border-slate-200 bg-white p-4">
      <h2 class="text-lg font-semibold">
        팀 매칭 결과
      </h2>

      <p v-if="!matchingResults.length && !matchError" class="mt-3 text-sm text-slate-500">
        매칭된 팀이 없습니다.
      </p>

      <div v-else-if="matchingResults.length" class="mt-4 grid gap-3 md:grid-cols-2">
        <article v-for="result in matchingResults" :key="`${result.song}-${result.artist}`"
          class="rounded-lg border border-slate-200 p-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="font-semibold text-slate-900">
                {{ result.song }}
              </h3>

              <p v-if="result.artist" class="text-xs text-slate-500">
                {{ result.artist }}
              </p>
            </div>

            <span class="shrink-0 rounded-full px-2 py-1 text-xs font-medium" :class="result.status === '완료'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
              ">
              {{ result.status }}
            </span>
          </div>
          <p v-if="result.status !== '완료' && result.reason"
            class="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
            제외 사유: {{ result.reason }}
          </p>
          <div class="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">
            <table class="w-full border-collapse text-sm">
              <tbody>
                <tr v-for="(member, index) in result.members"
                  :key="`${result.song}-${member.session}-${member.name}-${index}`">
                  <td
                    class="w-16 border-b border-r border-slate-200 px-2 py-2 text-center font-semibold text-slate-500">
                    {{ member.session || index + 1 }}
                  </td>

                  <td class="border-b border-slate-200 px-3 py-2 text-center font-semibold text-slate-800">
                    {{ member.name }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

useHead({
  title: "팀 매칭 — BandPick",
});

const SESSIONS = [
  "V",
  "D",
  "B",
  "EG1",
  "EG2",
  "AG",
  "K1",
  "K2",
  "기타",
] as const;

type MemberFormMemberResponse = {
  userId: number;
  name: string;
  picks: MemberPickEntry[];
};

type SetlistItem = {
  id: number;
  title: string;
  artist: string;
  positions: string[];
};

type MemberPickEntry = {
  priority: number;
  songTitle: string;
  session: string;
};

type MemberPick = {
  name: string;
  picks: MemberPickEntry[];
};

type MatchingMember = {
  session: string;
  name: string;
};

type MatchingResult = {
  song: string;
  artist: string;
  status: string;
  reason: string;
  members: MatchingMember[];
};

type TeamMatchApiResponse = {
  song: string;
  artist?: string;
  status?: string;
  reason?: string;
  members?: MatchingMember[];
};

type AssignmentMemberJson = {
  userName_AL?: string;
  userName?: string;
  $USER_name?: string;
};

type AssignmentStateJson = {
  confirmed_AL?: Record<
    string,
    Record<string, AssignmentMemberJson>
  >;
  confirmed?: Record<
    string,
    Record<string, AssignmentMemberJson>
  >;
  candidates_AL?: Record<
    string,
    Record<string, unknown>
  >;
  candidates?: Record<
    string,
    Record<string, unknown>
  >;
  excluded_AL?: string[];
  excluded?: string[];
  songScore_AL?: Record<string, number>;
  songScore?: Record<string, number>;
};

const MIN_COMMON_DAY_LIMIT = 1;

const POSITION_TO_SESSION: Record<string, string> = {
  VOCAL1: "V",
  VOCAL2: "V",
  DRUM: "D",
  BASS: "B",
  E_GUITAR1: "EG1",
  E_GUITAR2: "EG2",
  A_GUITAR1: "AG",
  A_GUITAR2: "AG",
  KEYBOARD1: "K1",
  KEYBOARD2: "K2",
  CHORUS1: "기타",
  CHORUS2: "기타",
  CHORUS3: "기타",
  CHORUS4: "기타",
};

const config = useRuntimeConfig();

const memberData = ref<MemberPick[]>([]);
const requiredSessionsBySong = ref<Record<string, string[]>>({});
const setlistTitles = ref<string[]>([]);

const activeTab = ref<
  "matrix" | "matching" | null
>(null);

const isMatching = ref(false);
const isLoadingData = ref(false);
const loadError = ref("");
const matchError = ref("");
const matchingResults = ref<MatchingResult[]>([]);

const formsApiUrl = computed(() => {
  const host = String(config.public.apiBase).replace(
    /\/$/,
    "",
  );

  return `${host}/api/v1/forms`;
});

const setlistsApiUrl = computed(() => {
  const host = String(config.public.apiBase).replace(
    /\/$/,
    "",
  );

  return `${host}/api/v1/setlists`;
});

const algorithmRunUrl = computed(() => {
  const host = String(config.public.apiBase).replace(
    /\/$/,
    "",
  );

  return `${host}/algorithm/run`;
});

function normalizeSessionLabel(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value === "기타" || value.startsWith("기타(") || value.startsWith("CHORUS")) {
    return "기타";
  }
  return value;
}
function isSessionRequired(song: string, session: string): boolean {
  const required = requiredSessionsBySong.value[song];
  // 셋리스트 정보가 없으면 빈 칸을 '미지원'으로 강조 (회색 막지 않음)
  if (!required || required.length === 0) return true;
  return required.includes(session);
}
function matrixCellClass(song: string, session: string): string {
  if (!isSessionRequired(song, session)) {
    return "bg-slate-200/80";
  }
  const applicants = songMatrix.value[song]?.[session] ?? [];
  if (!applicants.length) {
    return "bg-rose-50";
  }
  return "bg-white";
}

async function handleLoadData() {
  isLoadingData.value = true;
  loadError.value = "";

  try {
    const [forms, setlists] = await Promise.all([
      $fetch<MemberFormMemberResponse[]>(
        formsApiUrl.value,
        {
          method: "GET",
        },
      ),

      $fetch<SetlistItem[]>(
        setlistsApiUrl.value,
        {
          method: "GET",
        },
      ),
    ]);

    memberData.value = forms.map((form) => ({
      name: form.name,
      picks: (form.picks ?? []).map((pick) => ({
        priority: pick.priority,
        songTitle: pick.songTitle,
        session: pick.session,
      })),
    }));

    const requiredMap: Record<string, string[]> = {};
    for (const item of setlists) {
      const positions = (item.positions ?? [])
        .map(normalizeSessionLabel)
        .filter(Boolean);
      requiredMap[item.title] = [...new Set(positions)];
    }
    requiredSessionsBySong.value = requiredMap;

    const titlesFromSetlists = setlists.map((item) => item.title);
    const titlesFromForms = forms.flatMap((form) =>
      (form.picks ?? []).map((pick) => pick.songTitle?.trim() ?? "").filter(Boolean),
    );

    setlistTitles.value = [
      ...new Set([
        ...titlesFromSetlists,
        ...titlesFromForms,
      ]),
    ];

    activeTab.value = "matrix";
  } catch (error) {
    console.error("[load-data]", error);

    loadError.value =
      "데이터를 불러오지 못했습니다. 서버 상태와 API 경로를 확인해주세요.";
  } finally {
    isLoadingData.value = false;
  }
}

const songMatrix = computed<
  Record<string, Record<string, string[]>>
>(() => {
  const matrix: Record<
    string,
    Record<string, string[]>
  > = {};

  setlistTitles.value.forEach((song) => {
    matrix[song] = {};
    SESSIONS.forEach((session) => {
      matrix[song][session] = [];
    });
  });


  memberData.value.forEach((member) => {
    member.picks.forEach((pick) => {
      const songName = pick.songTitle?.trim() ?? "";
      const session = normalizeSessionLabel(pick.session ?? "");
      if (matrix[songName]?.[session]) {
        matrix[songName][session].push(`${pick.priority}. ${member.name}`);
      }
    });
  });
  setlistTitles.value.forEach((song) => {
    SESSIONS.forEach((session) => {
      matrix[song][session].sort((a, b) => {
        const priorityA = Number.parseInt(a.split(".")[0] ?? "999", 10);
        const priorityB = Number.parseInt(b.split(".")[0] ?? "999", 10);
        return priorityA - priorityB;
      });
    });
  });
  return matrix;
});

function sortMembersBySession(
  members: MatchingMember[],
): MatchingMember[] {
  const order = new Map(
    SESSIONS.map((session, index) => [
      session,
      index,
    ]),
  );

  return [...members].sort((a, b) => {
    const ai =
      order.get(
        a.session as (typeof SESSIONS)[number],
      ) ?? Number.MAX_SAFE_INTEGER;

    const bi =
      order.get(
        b.session as (typeof SESSIONS)[number],
      ) ?? Number.MAX_SAFE_INTEGER;

    return ai - bi;
  });
}

function splitSongKey(
  songKey: string,
): {
  song: string;
  artist: string;
} {
  const idx = songKey.lastIndexOf("_");

  if (idx <= 0) {
    return {
      song: songKey,
      artist: "",
    };
  }

  return {
    song: songKey.slice(0, idx),
    artist: songKey.slice(idx + 1),
  };
}

function memberNameFromJson(
  member:
    | AssignmentMemberJson
    | null
    | undefined,
): string {
  if (!member) {
    return "";
  }

  return (
    member.userName_AL ||
    member.userName ||
    member.$USER_name ||
    ""
  );
}

function buildExcludeReason(
  score: number | undefined,
  confirmedPositions: string[],
  candidatePositions: string[],
): string {
  const parts: string[] = [];
  if (typeof score === "number") {
    const requiredDays = MIN_COMMON_DAY_LIMIT + 1;
    parts.push(`공통 가능일 ${score}일 (필요: ${requiredDays}일 이상)`);
  }
  const confirmedSet = new Set(confirmedPositions);
  const missing = candidatePositions
    .filter((position) => !confirmedSet.has(position))
    .map((position) => POSITION_TO_SESSION[position] ?? position);
  if (missing.length) {
    parts.push(`미배정 세션: ${missing.join(", ")}`);
  }
  return parts.length ? parts.join(" · ") : "제외 사유를 확인할 수 없습니다.";
}

function parseAssignmentState(
  state: AssignmentStateJson,
): MatchingResult[] {
  const confirmed =
    state.confirmed_AL ??
    state.confirmed ??
    {};
  const candidates = state.candidates_AL ?? state.candidates ?? {};
  const songScore = state.songScore_AL ?? state.songScore ?? {};
  const excluded = new Set(
    state.excluded_AL ??
    state.excluded ??
    [],
  );

  const results: MatchingResult[] = [];

  for (const [
    songKey,
    positions,
  ] of Object.entries(confirmed)) {
    const members: MatchingMember[] = [];

    for (const [
      position,
      member,
    ] of Object.entries(positions ?? {})) {
      const name =
        memberNameFromJson(member);

      if (!name) {
        continue;
      }

      members.push({
        session:
          POSITION_TO_SESSION[position] ??
          position,
        name,
      });
    }

    if (!members.length) {
      continue;
    }

    const {
      song,
      artist,
    } = splitSongKey(songKey);

    const isExcluded = excluded.has(songKey);
    const reason = isExcluded
      ? buildExcludeReason(
        songScore[songKey],
        Object.keys(positions ?? {}),
        Object.keys(candidates[songKey] ?? {}),
      )
      : "";

    results.push({
      song,
      artist,
      status: isExcluded ? "제외" : "완료",
      reason,
      members:
        sortMembersBySession(members),
    });
  }
  return results;
}

function normalizeMatchResponse(
  response: unknown,
): MatchingResult[] {
  if (Array.isArray(response)) {
    return response.map(
      (item: TeamMatchApiResponse) => ({
        song: item.song,
        artist: item.artist ?? "",
        status:
          item.status || "완료",
        reason: item.reason ?? "",
        members:
          sortMembersBySession(
            item.members ?? [],
          ),
      }),
    );
  }

  if (
    response &&
    typeof response === "object"
  ) {
    const state =
      response as AssignmentStateJson;

    if (
      state.confirmed_AL ||
      state.confirmed
    ) {
      return parseAssignmentState(state);
    }
  }

  return [];
}

async function handleStartMatching() {
  isMatching.value = true;
  matchError.value = "";

  try {
    console.log(
      "[algorithm] POST:",
      algorithmRunUrl.value,
    );

    const response =
      await $fetch<unknown>(
        algorithmRunUrl.value,
        {
          method: "POST",
        },
      );

    console.log(
      "[algorithm] response:",
      response,
    );

    matchingResults.value =
      normalizeMatchResponse(
        response,
      );

    activeTab.value =
      "matching";
  } catch (error) {
    console.error(
      "[algorithm]",
      error,
    );

    matchError.value =
      "팀 매칭에 실패했습니다. BandPick 서버가 실행 중인지 확인해주세요.";

    activeTab.value =
      "matching";
  } finally {
    isMatching.value = false;
  }
}
</script>