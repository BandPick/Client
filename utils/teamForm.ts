export const TEAM_POSITIONS = ["V", "D", "B", "EG1", "EG2", "AG", "K"] as const;
export const PROFICIENCY_LEVELS = ["상", "중", "하"] as const;
export const TEAM_WEEKDAYS = ["월", "화", "수", "목", "금"] as const;

export type TeamPosition = (typeof TEAM_POSITIONS)[number];
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];
export type TeamSkills = Record<TeamPosition, ProficiencyLevel | "">;
export type TeamPriorities = Record<TeamPosition, number | null>;
export type TeamScheduleSlot = {
  dayOfWeek: string;
  startTime: string;
};
export type TeamScheduleRange = {
  day: string;
  ranges: string[];
};

export function createEmptyTeamSkills(): TeamSkills {
  return {
    V: "",
    D: "",
    B: "",
    EG1: "",
    EG2: "",
    AG: "",
    K: "",
  };
}

export function createEmptyTeamPriorities(): TeamPriorities {
  return {
    V: null,
    D: null,
    B: null,
    EG1: null,
    EG2: null,
    AG: null,
    K: null,
  };
}

export function createTeamTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 9; hour < 22; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
}

function addThirtyMinutes(time: string): string {
  const [hourText = "0", minuteText = "0"] = time.split(":");
  const total = Number(hourText) * 60 + Number(minuteText) + 30;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function groupTeamScheduleRanges(
  schedules: TeamScheduleSlot[],
): TeamScheduleRange[] {
  const slots = createTeamTimeSlots();
  const indexByTime = new Map(slots.map((time, index) => [time, index]));
  const indicesByDay = new Map<string, number[]>();

  for (const item of schedules) {
    const day = String(item.dayOfWeek ?? "").trim();
    const time = String(item.startTime ?? "").trim().slice(0, 5);
    const index = indexByTime.get(time);
    if (!day || index == null) continue;
    const list = indicesByDay.get(day) ?? [];
    list.push(index);
    indicesByDay.set(day, list);
  }

  return TEAM_WEEKDAYS.flatMap((day) => {
    const indices = [...new Set(indicesByDay.get(day) ?? [])].sort(
      (left, right) => left - right,
    );
    if (!indices.length) return [];

    const ranges: string[] = [];
    let start = indices[0]!;
    let previous = indices[0]!;

    for (let i = 1; i < indices.length; i += 1) {
      const current = indices[i]!;
      if (current === previous + 1) {
        previous = current;
        continue;
      }
      ranges.push(formatTimeRange(slots[start]!, slots[previous]!));
      start = current;
      previous = current;
    }
    ranges.push(formatTimeRange(slots[start]!, slots[previous]!));

    return [{ day, ranges }];
  });
}

function formatTimeRange(start: string, lastStart: string): string {
  return `${start}–${addThirtyMinutes(lastStart)}`;
}