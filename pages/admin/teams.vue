<template>
  <div class="min-h-screen bg-slate-50 p-6 md:p-8">
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">팀 그루핑 매니저</h1>
          <p class="mt-1 text-slate-600">
            엑셀 그리드에서 데이터를 입력하고 자동으로 팀을 편성하세요.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button"
            class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            @click="enableEditMode">
            <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            데이터 불러오기 / 편집
          </button>

          <button type="button"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            @click="handleGrouping">
            <svg class="h-4 w-4 shrink-0 text-white" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            팀 그루핑하기
          </button>

          <button type="button" :disabled="teams.length === 0"
            class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            @click="exportData">
            <svg class="h-4 w-4 shrink-0 text-white" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
            내보내기
          </button>
        </div>
      </div>

      <div class="mt-8">
        <!-- Excel-style grid -->
        <div v-if="isEditMode" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <span class="text-sm font-bold uppercase tracking-wider text-slate-700">
              입력 그리드 (Excel Style)
            </span>
            <button type="button" class="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100"
              @click="addRow">
              + 행 추가
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-slate-100">
                  <th class="w-12 border-b border-r border-slate-200 p-2 text-center text-slate-400">
                    #
                  </th>
                  <th class="min-w-[150px] border-b border-r border-slate-200 p-2 text-left text-slate-600">
                    곡 이름
                  </th>
                  <th v-for="role in roles" :key="role"
                    class="min-w-[100px] border-b border-r border-slate-200 p-2 text-center text-slate-600">
                    {{ role }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in editableData" :key="i" class="transition-colors hover:bg-blue-50/30">
                  <td class="border-b border-r border-slate-200 bg-slate-50 p-2 text-center font-mono text-slate-400">
                    {{ i + 1 }}
                  </td>
                  <td class="border-b border-r border-slate-200 p-0">
                    <input v-model="row.song"
                      class="w-full bg-transparent p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="곡 제목 입력..." />
                  </td>
                  <td v-for="role in roles" :key="role" class="border-b border-r border-slate-200 p-0">
                    <input v-model="row.members[role]"
                      class="w-full bg-transparent p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      :placeholder="role" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="border-t border-slate-200 bg-slate-50 p-4 text-right">
            <p class="mb-2 text-xs text-slate-500">
              실시간으로 편집된 데이터가 저장됩니다.
            </p>
          </div>
        </div>

        <!-- 결과 카드 -->
        <div v-else-if="teams.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="team in teams" :key="team.song"
            class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 class="text-lg font-bold text-slate-800">
                {{ team.song }}
              </h2>
              <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                {{ getMemberCount(team.members) }}명
              </span>
            </div>
            <div class="space-y-3">
              <template v-for="[role, name] in getEntries(team.members)" :key="role">
                <div v-if="name && String(name).trim() !== ''" class="flex items-center justify-between text-sm">
                  <span
                    class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                    {{ role }}
                  </span>
                  <span class="font-semibold text-slate-800">{{ name }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else
          class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div class="rounded-full bg-slate-100 p-4 text-slate-400">
            <svg class="h-8 w-8" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <p class="mt-4 text-lg font-medium text-slate-900">데이터가 없습니다.</p>
          <p class="mt-1 text-sm text-slate-500">
            '데이터 불러오기'를 눌러 편집을 시작하세요.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

useHead({
  title: "팀 그루핑 — BandPick",
});

/** 포지션별 멤버 이름 (키 = 역할 코드) */
interface TeamMember {
  [role: string]: string;
}

interface Team {
  song: string;
  members: TeamMember;
}

const roles = [
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

const isEditMode = ref(false);
const editableData = ref<Team[]>([]);
const teams = ref<Team[]>([]);

function emptyMembers(): TeamMember {
  return roles.reduce<TeamMember>((acc, role) => {
    acc[role] = "";
    return acc;
  }, {});
}

function enableEditMode() {
  isEditMode.value = true;
  if (editableData.value.length === 0) {
    for (let i = 0; i < 5; i++) addRow();
  }
}

function addRow() {
  const newRow: Team = {
    song: "",
    members: emptyMembers(),
  };
  editableData.value = [...editableData.value, newRow];
}

function handleGrouping() {
  const filtered = editableData.value.filter((row) => row.song.trim() !== "");
  if (filtered.length === 0) {
    console.log("입력된 곡 정보가 없습니다.");
    return;
  }
  teams.value = structuredClone(filtered);
  isEditMode.value = false;
  console.log("그루핑 완료!");
}

function getEntries(obj: TeamMember): [string, string][] {
  return Object.entries(obj);
}

function getMemberCount(members: TeamMember): number {
  return Object.values(members).filter((m) => m.trim() !== "").length;
}

/** CSV(UTF-8 BOM): 엑셀에서 바로 열 수 있음. PDF는 인쇄 → PDF 저장 등으로 별도 처리 가능 */
function exportData() {
  if (teams.value.length === 0) return;

  const header = ["곡 이름", ...roles];
  const lines = [
    header.join(","),
    ...teams.value.map((t) => {
      const cells = [
        escapeCsvCell(t.song),
        ...roles.map((r) => escapeCsvCell(t.members[r] ?? "")),
      ];
      return cells.join(",");
    }),
  ];
  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `teams_export_${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  console.log(
    "팀 매칭 결과 CSV 내보냄 (엑셀 연동). PDF는 SheetJS/jspdf 등 추가 시 확장 가능.",
  );
}

function escapeCsvCell(value: string): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

</script>

<style scoped>
input::placeholder {
  color: #cbd5e1;
  font-weight: 400;
}
</style>
