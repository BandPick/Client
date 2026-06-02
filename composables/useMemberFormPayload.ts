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
