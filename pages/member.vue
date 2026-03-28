<template>
  <div class="mx-auto max-w-6xl px-4 py-12">
    <section class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
      <p class="text-sm font-semibold text-blue-600">부원</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
        BandPick 부원
      </h1>
      <p class="mt-4 max-w-2xl text-slate-600">
        희망 곡·포지션·합주 가능 시간을 입력해 팀 매칭에 참여할 수 있습니다. 곧 이 화면에서 입력 폼과 내 일정을 확인할 수 있어요.
      </p>

      <div class="mt-10 flex flex-wrap gap-4">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          홈으로
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "부원 — BandPick",
});
</script>
