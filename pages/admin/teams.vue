<template>
  <div>

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">팀 그루핑</h1>
        <p class="mt-1 text-slate-600">
          곡별·포지션별 자동 그룹 결과를 확인합니다.
        </p>
      </div>

      <button
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        @click="handleMatch">
        팀 매칭하기
      </button>
    </div>

    <!-- 결과 영역 -->
    <div class="mt-8">
      <!-- 결과 없음 -->
      <div v-if="!teams.length"
        class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
        매칭 결과가 없습니다.
      </div>

      <!-- 결과 있음 -->
      <div v-else class="grid gap-6 md:grid-cols-3">
        <div v-for="(team, i) in teams" :key="i" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800">
            {{ team.song }}
          </h2>

          <div class="mt-4 space-y-2 text-sm">
            <div v-for="(name, role) in team.members" :key="role"
              class="flex justify-between border-b border-slate-100 pb-1">
              <span class="text-slate-500">{{ role }}</span>
              <span class="font-medium text-slate-800">{{ name }}</span>
            </div>
          </div>
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

// 상태
const teams = ref<any[]>([]);

// 목업 데이터
const mockTeams = [
  {
    song: "John",
    members: {
      V: "김유성",
      D: "인세훈",
      B: "김경환",
      EG1: "정시연",
      EG2: "문성훈",
      기타: "정윤섭, 김경환",
    },
  },
  {
    song: "청색동경",
    members: {
      V: "옥윤택",
      D: "인세훈",
      B: "문성훈",
      EG1: "정시연",
      EG2: "옥윤택",
      K1: "이수린",
    },
  },
  {
    song: "꿈나라 별나라",
    members: {
      V: "김경환",
      D: "박민서",
      B: "권용민",
      EG1: "문성훈",
      EG2: "정시연",
      K1: "안수빈",
      K2: "양준서",
    },
  },
  {
    song: "S.A.D",
    members: {
      V: "권시현, 남유빈",
      D: "정시연",
      B: "유동하",
      EG1: "문성훈",
      EG2: "최상현",
    },
  },
  {
    song: "못 죽는 기사와 비단요람",
    members: {
      V: "윤정훈",
      D: "박민서",
      B: "류서연",
      EG1: "김동현",
      AG: "양준서",
      K1: "심선우",
      기타: "김민재",
    },
  },
  {
    song: "가죽자켓",
    members: {
      V: "김강유, 최상현",
      D: "이상은",
      B: "황주현",
      EG1: "류희종",
      EG2: "문성훈",
    },
  },
];

// 버튼 클릭
const handleMatch = () => {
  // 실제로는 API 호출 자리
  teams.value = mockTeams;
};
</script>