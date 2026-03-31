<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Admin Dummy</p>
      <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        기획자 페이지
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        다른 팀원이 구현할 예정인 기획자 화면 자리입니다. 현재는 경로 분기 확인용 더미 화면으로 유지됩니다.
      </p>

      <NuxtLink
        to="/"
        class="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        로그인 화면으로 돌아가기
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "BandPick 기획자",
});
</script>
