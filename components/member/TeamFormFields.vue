<template>
  <div class="space-y-5 sm:space-y-6">
    <div>
      <p class="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
        가능한 포지션 및 숙련도
      </p>
      <p class="mb-3 text-xs text-slate-500">
        가능한 포지션만 고르고, 숙련도와 희망 순위를 선택해 주세요.
      </p>
      <div class="overflow-hidden rounded-2xl border border-slate-300">
        <div v-for="(position, index) in TEAM_POSITIONS" :key="position"
          class="flex flex-col gap-2 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4"
          :class="index === TEAM_POSITIONS.length - 1 ? '' : 'border-b border-slate-200'">
          <span class="w-12 shrink-0 text-sm font-semibold text-slate-800 sm:w-14 sm:text-base">
            {{ position }}
          </span>
          <div class="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:items-end">
            <div class="flex flex-wrap justify-start gap-2 sm:justify-end">
              <button v-for="level in PROFICIENCY_LEVELS" :key="`${position}-${level}`" type="button"
                class="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm" :class="skills[position] === level
                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  " @click="toggleSkill(position, level)">
                {{ level }}
              </button>
            </div>
            <div v-if="skills[position]" class="flex flex-wrap justify-start gap-2 sm:justify-end">
              <button v-for="rank in selectedCount" :key="`${position}-rank-${rank}`" type="button"
                class="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm" :class="priorities[position] === rank
                  ? 'border-amber-500 bg-amber-100 text-amber-800'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700'
                  " @click="setPriority(position, rank)">
                {{ rank }}순위
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
        참여 가능 팀 수
      </p>
      <p class="mb-3 text-xs text-slate-500">
        최소 1팀부터 최대 3팀까지 선택할 수 있습니다.
      </p>
      <div class="flex flex-wrap gap-2">
        <button v-for="count in TEAM_COUNT_OPTIONS" :key="count" type="button"
          class="rounded-full border px-4 py-1.5 text-sm font-semibold transition" :class="maxTeams === count
            ? 'border-blue-500 bg-blue-100 text-blue-700'
            : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
            " @click="maxTeams = count">
          {{ count }}팀
        </button>
      </div>
    </div>

    <div>
      <p class="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
        기획자에게
      </p>
      <p class="mb-3 text-xs text-slate-500">
        이번공연 바라는 점이나 기획자에게 하고싶은 말을 적어주세요. 응원의 메세지도 좋습니다.
      </p>
      <textarea v-model="plannerMessage" rows="6" maxlength="500"
        class="min-h-[8.5rem] w-full resize-y rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder="예: 이번 공연 너무 기대돼요! / 매주 목요일에는 8시 15분까지만 가능합니다. / 여보컬 2명인 팀에 들어가고 싶습니다." />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PROFICIENCY_LEVELS,
  TEAM_POSITIONS,
  type ProficiencyLevel,
  type TeamPosition,
  type TeamPriorities,
  type TeamSkills,
} from "~/utils/teamForm";

const TEAM_COUNT_OPTIONS = [1, 2, 3] as const;

const skills = defineModel<TeamSkills>("skills", { required: true });
const priorities = defineModel<TeamPriorities>("priorities", { required: true });
const plannerMessage = defineModel<string>("plannerMessage", {
  required: true,
});
const maxTeams = defineModel<number>("maxTeams", { required: true });

const selectedCount = computed(
  () => TEAM_POSITIONS.filter((position) => Boolean(skills.value[position])).length,
);

function selectedPositions() {
  return TEAM_POSITIONS.filter((position) => Boolean(skills.value[position]));
}

function nextPriority() {
  const used = selectedPositions()
    .map((position) => priorities.value[position])
    .filter((value): value is number => typeof value === "number" && value > 0);
  return used.length ? Math.max(...used) + 1 : 1;
}

function compactPriorities() {
  const ordered = selectedPositions()
    .map((position) => ({
      position,
      priority: priorities.value[position],
    }))
    .sort((a, b) => {
      const aRank = a.priority && a.priority > 0 ? a.priority : 999;
      const bRank = b.priority && b.priority > 0 ? b.priority : 999;
      if (aRank !== bRank) return aRank - bRank;
      return TEAM_POSITIONS.indexOf(a.position) - TEAM_POSITIONS.indexOf(b.position);
    });

  const next = { ...priorities.value };
  for (const position of TEAM_POSITIONS) {
    next[position] = null;
  }
  ordered.forEach((item, index) => {
    next[item.position] = index + 1;
  });
  priorities.value = next;
}

function toggleSkill(position: TeamPosition, level: ProficiencyLevel) {
  const turningOff = skills.value[position] === level;
  skills.value[position] = turningOff ? "" : level;
  if (turningOff) {
    compactPriorities();
    return;
  }
  if (!priorities.value[position]) {
    priorities.value = {
      ...priorities.value,
      [position]: nextPriority(),
    };
  }
}

function setPriority(position: TeamPosition, rank: number) {
  if (!skills.value[position]) return;
  const current = priorities.value[position];
  if (current === rank) return;

  const occupant = selectedPositions().find(
    (item) => item !== position && priorities.value[item] === rank,
  );
  priorities.value = {
    ...priorities.value,
    [position]: rank,
    ...(occupant ? { [occupant]: current } : {}),
  };
}
</script>
