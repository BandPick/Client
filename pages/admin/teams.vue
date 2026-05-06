<template>
  <div>
    <h1 class="text-2xl font-bold">팀 매칭</h1>

    <div class="mt-6 flex flex-wrap gap-2">
      <button type="button"
        class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        @click="activeTab = 'matrix'">
        <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        데이터 불러오기
      </button>
      <button type="button"
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        @click="handleStartMatching">
        <svg class="h-4 w-4 shrink-0 text-white" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {{ isMatching ? "매칭 계산 중..." : "팀 매칭하기" }}
      </button>
    </div>
  </div>

  <section v-if="activeTab === null"
    class="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center">

    <p class="text-lg font-medium text-slate-900">데이터가 없습니다.</p>
    <p class="mt-1 text-sm text-slate-500">
      '데이터 불러오기' 버튼을 눌러 시작하세요.
    </p>
  </section>

  <section v-if="activeTab === 'matrix'" class="mt-8 rounded-xl border border-slate-200 bg-white">
    <div class="border-b border-slate-200 px-4 py-3">
      <h2 class="text-lg font-semibold">데이터 불러오기</h2>
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
          <tr v-for="song in SETLIST" :key="song" class="align-top hover:bg-slate-50 transition-colors">

            <th
              class="sticky left-0 z-[1] border-b border-r border-slate-200 bg-white px-3 py-3 text-center font-medium text-slate-800">
              {{ song }}
            </th>

            <td v-for="session in SESSIONS" :key="`${song}-${session}`"
              class="border-b border-r border-slate-200 px-2 py-2 text-slate-700">

              <div v-if="songMatrix[song][session].length" class="space-y-0.5 text-center">
                <p v-for="entry in songMatrix[song][session]" :key="entry">
                  {{ entry }}
                </p>
              </div>
              <span v-else class="flex items-center justify-center h-full text-slate-300">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section v-if="activeTab === 'matching'" class="mt-8 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="text-lg font-semibold">팀 매칭 결과</h2>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <article v-for="result in matchingResults" :key="result.song" class="rounded-lg border border-slate-200 p-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-slate-900">{{ result.song }}</h3>
          <span class="rounded-full px-2 py-1 text-xs font-medium" :class="result.status === '완료'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'">{{ result.status }}
          </span>
        </div>
        <div class="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">
          <table class="w-full border-collapse text-sm">
            <tbody>
              <tr v-for="(member, index) in result.members" :key="`${result.song}-${member.name}-${index}`">
                <td
                  class="w-12 border-b border-r border-slate-200 px-2 py-2 text-center font-semibold text-slate-500 last:border-b-0">
                  {{ index + 1 }}
                </td>
                <td
                  class="border-b border-slate-200 px-3 py-2 text-center font-semibold text-slate-800 last:border-b-0">
                  {{ member.name }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>
  <div class="mt-6 flex justify-end gap-3">
    <button type="button"
      class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
      @click="exportToExcel">
      <svg class="h-4 w-4 shrink-0 text-white" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" x2="12" y1="2" y2="15" />
      </svg>
      Excel로 내보내기
    </button>
    <button type="button"
      class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
      @click="exportToPdf">
      <svg class="h-4 w-4 shrink-0 text-white" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" x2="12" y1="2" y2="15" />
      </svg>
      Pdf로 내보내기
    </button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

useHead({
  title: "팀 매칭 — BandPick",
});

type MemberPick = {
  name: string;
  picks: string[];
};

const SESSIONS = ["V", "D", "B", "EG1", "EG2", "AG", "K1", "K2", "기타"] as const;
const SETLIST = ["역성"] as const;

const MOCK_MEMBER_DATA: MemberPick[] = [
  { name: "정시연", picks: ["역성 / EG1"] }
];

const activeTab = ref<"matrix" | "matching" | null>(null);
const isMatching = ref(false);

const songMatrix = computed<Record<string, Record<string, string[]>>>(() => {
  const matrix: Record<string, Record<string, string[]>> = {};

  SETLIST.forEach((song) => {
    matrix[song] = {};
    SESSIONS.forEach((session) => {
      matrix[song][session] = [];
    });
  });

  MOCK_MEMBER_DATA.forEach((member) => {
    member.picks.forEach((pick, index) => {
      const [songName, session] = pick.split(' / ');
      if (matrix[songName]?.[session]) {
        matrix[songName][session].push(`${index + 1}. ${member.name}`);
      }
    });
  });
  return matrix;
});

const matchingResults = computed(() => {
  return SETLIST.map((song) => {
    const members: Array<{ session: string; name: string }> = [];
    SESSIONS.forEach((session) => {
      const candidates = songMatrix.value[song][session];
      const topCandidate = candidates.find((candidate) => candidate.includes("1순위"));
      if (topCandidate) {
        members.push({
          session,
          name: topCandidate.split(" (")[0],
        });
      }
    });

    return {
      song,
      members,
      status: members.length >= 3 ? "완료" : "대기",
    };
  }).filter((result) => result.members.length > 0);
});

function handleStartMatching() {
  isMatching.value = true;
  setTimeout(() => {
    isMatching.value = false;
    activeTab.value = "matching";
  }, 1200);
}

function downloadFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportToExcel() {
  const header = ["곡 명", "상태", ...SESSIONS].join(",");
  const rows = matchingResults.value.map((result) => {
    const sessionMap = Object.fromEntries(result.members.map((member) => [member.session, member.name]));
    return [result.song, result.status, ...SESSIONS.map((session) => sessionMap[session] ?? "-")].join(",");
  });
  downloadFile(`\uFEFF${[header, ...rows].join("\n")}`, "text/csv;charset=utf-8;", "team-matching.csv");
}

function exportToPdf() {
  window.print();
}
</script>