<template>
  <div>
    <h1 class="text-2xl font-bold">부원 데이터</h1>
    <p class="mt-1 text-slate-600">
      전체 부원의 희망 곡·포지션·시간대를 조회합니다.
    </p>

    <div class="w-full mt-8">
      <AdminTable
        :columns="columns"
        :rows="rows"
        empty-text="API 연동 후 데이터가 표시됩니다."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

useHead({
  title: "부원 데이터 — BandPick",
});

// 컬럼 정의
const columns = [
  "이름",
  "1순위/포지션",
  "2순위/포지션",
  "3순위/포지션",
  "4순위/포지션",
  "5순위/포지션",
  "합주 가능 시간대",
];

// 목업 데이터
const mockData = [
  {
    name: "정시연",
    picks: [
      "역성 / EG1",
      "피차일반 / V, EG1",
      "일상 / D",
      "불시 / K2",
      "박하사탕 / EG2",
    ],
    time: "월 17:30~22:00",
  },
  {
    name: "인세훈",
    picks: [
      "high tide / D",
      "John / D",
      "야경 / D",
      "불시 / D",
      "개화 / D",
    ],
    time: "수 17:30~22:00",
  },
];

// 테이블용 변환
const rows = mockData.map((user) => [
  user.name,
  ...user.picks,
  user.time,
]);
</script>