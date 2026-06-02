/** API/서버 LocalDateTime ISO 문자열 -> `<input type="datetime-local">` 값 (분 단위) */
export function deadlineToDatetimeLocal(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (m) return `${m[1]}T${m[2]}:${m[3]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** `datetime-local` 값 -> 백엔드가 기대하는 ISO 형태 (초까지, 로컬 입력 그대로) */
export function datetimeLocalToIsoDeadline(local: string): string {
  if (!local) return "";
  let s = local.trim();
  if (s.length === 16) s = `${s}:00`;
  if (s.length > 19) s = s.slice(0, 19);
  return s;
}
