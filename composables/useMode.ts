/**
 * 현재 앱 구역(홈 / 부원 / 기획자) — 라우트 기준
 * (전역 모드 state 대신 URL을 단일 출처로 사용)
 */
export function useMode() {
  const route = useRoute();

  const section = computed(() => {
    const p = route.path;
    if (p.startsWith("/admin")) return "admin" as const;
    if (p.startsWith("/member")) return "member" as const;
    return "home" as const;
  });

  /** 이전 코드 호환용 이름 */
  const mode = section;

  return {
    section,
    mode,
  };
}
