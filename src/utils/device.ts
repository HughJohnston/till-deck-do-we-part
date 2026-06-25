/** True on phones/tablets — used for touch-first UX and mobile audio tuning. */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
