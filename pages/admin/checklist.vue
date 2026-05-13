<template>
  <div class="pb-12 font-sans text-slate-800">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">체크리스트</h1>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <section
        v-for="category in checklistCategories"
        :key="category.id"
        class="rounded-xl border border-slate-200 bg-white p-4"
      >
        <h2 class="text-base font-semibold text-slate-900">{{ category.title }}</h2>

        <ul v-if="category.items.length" class="mt-3 space-y-2">
          <li
            v-for="item in category.items"
            :key="item.id"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
          >
            <input
              :id="item.id"
              v-model="item.checked"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
            >
            <label
              :for="item.id"
              class="text-sm"
              :class="item.checked ? 'text-slate-400 line-through' : 'text-slate-700'"
            >
              {{ item.label }}
            </label>
          </li>
        </ul>

        <p v-else class="mt-3 text-sm text-slate-400">등록된 체크리스트가 없습니다.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

type ChecklistCategory = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

const checklistCategories = ref<ChecklistCategory[]>([
  {
    id: "preparation",
    title: "사전준비",
    items: [
      { id: "1", label: "기획안 작성", checked: false },
      { id: "2", label: "외부 공연장 대관", checked: false },
      { id: "3", label: "공연 인원 조사", checked: false },
      { id: "4", label: "예산 및 공연회비 산정", checked: false },
    ],
  },
  {
    id: "before-rehearsal",
    title: "합주 시작전",
    items: [
        { id: "5", label: "공연 톡방 생성 및 공연 안내", checked: false },
        { id: "6", label: "후보곡 추천 안내", checked: false },
        { id: "7", label: "최종 곡 선정", checked: false },
        { id: "8", label: "부원 합주 가능 스케줄 조사", checked: false },
        { id: "9", label: "최종 곡 선정 및 분배", checked: false },
        { id: "10", label: "스케줄 배분", checked: false },
        { id: "21", label: "공연회비 안내", checked: false },
        { id: "22", label: "공연 MC, 음향, 조명, 촬영 담당 정하기", checked: false },
        { id: "28", label: "보컬 테스트 진행", checked: false },
        { id: "29", label: "가사지 안내", checked: false },
    ] },
  {
    id: "before-mid-review",
    title: "중간점검 직전",
    items: [
        { id: "11", label: "중간점검 공지", checked: false },
        { id: "12", label: "중간점검 참관자 조사", checked: false },
        { id: "13", label: "중간점검 뒷풀이 장소 예약", checked: false },
        { id: "14", label: "학교 공연장 대관", checked: false },
    ] },
  {
    id:"after-mid-review",
    title: "중간점검 후",
    items: [
        { id: "15", label: "중간점검 피드백 취합 후 전달", checked: false },
        { id: "16", label: "선배들께 연락 돌리기", checked: false },
        { id: "17", label: "공연 뒷풀이 장소 예약", checked: false },
        { id: "18", label: "정기공연 홍보 버스킹 및 추가 홍보 활동 진행", checked: false },
        { id: "19", label: "포스터&팜플렛 인쇄 및 부착", checked: false },
        { id: "20", label: "외부 공연장까지 짐 옮기는 방법 회의", checked: false },
        { id: "23", label: "큐시트 작성", checked: false },
    ] },
  {
    id: "before-show",
    title: "공연 전주",
    items: [
        { id: "27", label: "드라이리허설", checked: false },
        { id: "24", label: "공연 물품 체크리스트 작성", checked: false },
        { id: "25", label: "밥 예약", checked: false },
        { id: "26", label: "공연 관련 안내사항 전달", checked: false },
        { id: "30", label: "경품 준비", checked: false },
    ] },
  {
    id: "after-show",
    title: "공연 후",
    items: [
        { id: "31", label: "영상 무슨 요일로 올릴건지 조사", checked: false },
        { id: "32", label: "홍보부와 얘기하여 빠른 영상 업로드 진행", checked: false },
    ] },
]);

definePageMeta({
  layout: "admin",
});

useHead({
  title: "체크 리스트 — BandPick",
});
</script>