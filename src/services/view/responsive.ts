const MOBILE = 768;
const TABLET = 1023;
const DESKTOP = 1215;
const WIDE_SCREEN = 1407;

export function isMobile(): boolean {
  return window.screen.width <= MOBILE;
}

export function isTablet(): boolean {
  return window.screen.width > MOBILE && window.screen.width <= TABLET;
}

export function isDesktop(): boolean {
  return window.screen.width > TABLET && window.screen.width <= DESKTOP;
}

export function isWideScreen(): boolean {
  return window.screen.width > DESKTOP && window.screen.width <= WIDE_SCREEN;
}

export function isFullHd(): boolean {
  return window.screen.width > WIDE_SCREEN;
}
