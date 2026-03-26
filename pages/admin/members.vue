<template>
  <div>
    <h1 class="text-2xl font-bold">부원 데이터</h1>
    <p class="mt-1 text-slate-600">
      전체 부원의 희망 곡·포지션·시간대를 조회합니다.
    </p>

    <div class="flex mt-8">
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
    name: "김민수",
    picks: [
      "Hype Boy / 보컬",
      "Ditto / 기타",
      "Attention / 베이스",
      "OMG / 드럼",
      "ETA / 키보드",
    ],
    time: "월/수 저녁",
  },
  {
    name: "이서연",
    picks: [
      "Super Shy / 드럼",
      "ETA / 보컬",
      "Hurt / 기타",
      "Cookie / 베이스",
      "OMG / 키보드",
    ],
    time: "주말 오후",
  },
];

// 테이블용 변환
const rows = mockData.map((user) => [
  user.name,
  ...user.picks,
  user.time,
]);
</script>