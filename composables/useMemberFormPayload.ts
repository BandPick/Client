import type {
  MemberFormAvailabilityRequest,
  MemberFormPickRequest,
} from "~/composables/useMemberFormApi";

type FormPick = {
  songId: string;
  sessions: string[];
};

const DAY_OFFSET: Record<string, number> = {
  월: 0,
  화: 1,
  수: 2,
  목: 3,
  금: 4,
};

function parseSession(session: string): {
  desiredPosition: string;
  desiredExtra: string;
} {
  const match = session.match(/^기타\((.*)\)$/);
  if (match) {
    return { desiredPosition: "기타", desiredExtra: (match[1] ?? "").trim() };
  }
  if (session === "기타") {
    return { desiredPosition: "기타", desiredExtra: "" };
  }
  return { desiredPosition: session, desiredExtra: "" };
}

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

export function getScheduleWeekStart(referenceDate: Date): Date {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildMemberFormPicks(
  picks: FormPick[],
): MemberFormPickRequest[] {
  const result: MemberFormPickRequest[] = [];

  picks.forEach((pick, index) => {
    if (!pick.songId || !pick.sessions.length) return;

    const priority = index + 1;
    const setlistId = Number(pick.songId);
    if (!Number.isFinite(setlistId)) return;

    for (const session of pick.sessions) {
      const { desiredPosition, desiredExtra } = parseSession(session);
      result.push({
        priority,
        setlistId,
        desiredPosition,
        desiredExtra,
      });
    }
  });

  return result;
}

export function buildMemberFormAvailabilities(
  selectedSlots: Set<string>,
  timeSlots: string[],
  weekStartMonday: Date,
): MemberFormAvailabilityRequest[] {
  const grouped = new Map<string, number[]>();

  for (const key of selectedSlots) {
    const separatorIndex = key.indexOf("-");
    if (separatorIndex <= 0) continue;

    const day = key.slice(0, separatorIndex);
    const time = key.slice(separatorIndex + 1);
    const dayOffset = DAY_OFFSET[day];
    const slotIndex = timeSlots.indexOf(time);
    if (dayOffset == null || slotIndex < 0) continue;

    const indices = grouped.get(day) ?? [];
    indices.push(slotIndex);
    grouped.set(day, indices);
  }

  const availabilities: MemberFormAvailabilityRequest[] = [];

  for (const [day, indices] of grouped) {
    const dayOffset = DAY_OFFSET[day];
    if (dayOffset == null) continue;

    indices.sort((a, b) => a - b);

    let rangeStart = indices[0]!;
    let rangeEnd = indices[0]!;

    const pushRange = (startIndex: number, endIndex: number) => {
      const startTime = timeSlots[startIndex]!;
      const endTime = timeSlots[endIndex + 1] ?? timeSlots[endIndex]!;

      const from = new Date(weekStartMonday);
      from.setDate(from.getDate() + dayOffset);
      const [fromHour, fromMinute] = startTime.split(":").map(Number);
      from.setHours(fromHour ?? 0, fromMinute ?? 0, 0, 0);

      const to = new Date(weekStartMonday);
      to.setDate(to.getDate() + dayOffset);
      if (endIndex + 1 < timeSlots.length) {
        const [toHour, toMinute] = endTime.split(":").map(Number);
        to.setHours(toHour ?? 0, toMinute ?? 0, 0, 0);
      } else {
        const [toHour, toMinute] = endTime.split(":").map(Number);
        to.setHours(toHour ?? 0, (toMinute ?? 0) + 30, 0, 0);
      }

      availabilities.push({
        availableFrom: formatLocalDateTime(from),
        availableTo: formatLocalDateTime(to),
      });
    };

    for (let i = 1; i < indices.length; i += 1) {
      const current = indices[i]!;
      if (current === rangeEnd + 1) {
        rangeEnd = current;
        continue;
      }
      pushRange(rangeStart, rangeEnd);
      rangeStart = current;
      rangeEnd = current;
    }

    pushRange(rangeStart, rangeEnd);
  }

  return availabilities;
}

export function parseLocalDateTime(value: string): Date | null {
  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/,
  );
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

export function slotsFromAvailabilities(
  availabilities: { availableFrom: string; availableTo: string }[],
  validTimes: string[],
): string[] {
  const timeSet = new Set(validTimes);
  const result = new Set<string>();

  for (const range of availabilities) {
    const from = parseLocalDateTime(range.availableFrom);
    const to = parseLocalDateTime(range.availableTo);
    if (!from || !to) continue;

    const cursor = new Date(from.getTime());
    while (cursor.getTime() < to.getTime()) {
      const day = ["일", "월", "화", "수", "목", "금", "토"][cursor.getDay()];
      const time = `${padTimePart(cursor.getHours())}:${padTimePart(cursor.getMinutes())}`;
      if (day && DAY_OFFSET[day] != null && timeSet.has(time)) {
        result.add(`${day}-${time}`);
      }
      cursor.setMinutes(cursor.getMinutes() + 30);
    }
  }

  return Array.from(result);
}

export function slotsFromTeamSchedules(
  schedules: { dayOfWeek: string; startTime: string }[],
  validTimes: string[],
): string[] {
  const timeSet = new Set(validTimes);
  const result: string[] = [];
  for (const schedule of schedules) {
    const day = String(schedule.dayOfWeek ?? "").trim();
    const time = String(schedule.startTime ?? "").trim().slice(0, 5);
    if (!day || !timeSet.has(time)) continue;
    result.push(`${day}-${time}`);
  }
  return result;
}

export function groupPicksForForm(
  picks: { priority: number; setlistId: number; session: string }[],
  minRows: number,
): { songId: string; sessions: string[] }[] {
  const byPriority = new Map<number, { songId: string; sessions: string[] }>();
  const sorted = [...picks].sort((a, b) => a.priority - b.priority);

  for (const pick of sorted) {
    if (!pick.setlistId || pick.priority <= 0) continue;
    const songId = String(pick.setlistId);
    const existing = byPriority.get(pick.priority);
    if (existing) {
      if (pick.session && !existing.sessions.includes(pick.session)) {
        existing.sessions.push(pick.session);
      }
      continue;
    }
    byPriority.set(pick.priority, {
      songId,
      sessions: pick.session ? [pick.session] : [],
    });
  }

  const maxPriority = Math.max(minRows, ...byPriority.keys(), 0);
  return Array.from({ length: maxPriority }, (_, index) => {
    return byPriority.get(index + 1) ?? { songId: "", sessions: [] };
  });
}
