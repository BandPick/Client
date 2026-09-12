<template>
  <div class="space-y-5 sm:space-y-6">
    <div>
      <p class="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
        가능한 포지션 및 숙련도
      </p>
      <p class="mb-3 text-xs text-slate-500">
        가능한 포지션만 고르고, 해당 포지션의 숙련도를 선택해 주세요.
      </p>
      <div class="overflow-hidden rounded-2xl border border-slate-300">
        <div
          v-for="(position, index) in TEAM_POSITIONS"
          :key="position"
          class="flex items-center justify-between gap-3 bg-white px-3 py-3 sm:px-4"
          :class="index === TEAM_POSITIONS.length - 1 ? '' : 'border-b border-slate-200'"
        >
          <span class="w-12 shrink-0 text-sm font-semibold text-slate-800 sm:w-14 sm:text-base">
            {{ position }}
          </span>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              v-for="level in PROFICIENCY_LEVELS"
              :key="`${position}-${level}`"
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm"
              :class="
                skills[position] === level
                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
              "
              @click="toggleSkill(position, level)"
            >
              {{ level }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
        같은 팀을 하고 싶은 사람
      </p>
      <textarea
        v-model="preferredTeammates"
        rows="6"
        maxlength="500"
        class="min-h-[8.5rem] w-full resize-y rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder="함께하고 싶은 부원 이름을 적어 주세요. (예: 홍길동, 김철수)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PROFICIENCY_LEVELS,
  TEAM_POSITIONS,
  type ProficiencyLevel,
  type TeamPosition,
  type TeamSkills,
} from "~/utils/teamForm";

const skills = defineModel<TeamSkills>("skills", { required: true });
const preferredTeammates = defineModel<string>("preferredTeammates", {
  required: true,
});

function toggleSkill(position: TeamPosition, level: ProficiencyLevel) {
  skills.value[position] =
    skills.value[position] === level ? "" : level;
}
</script>
