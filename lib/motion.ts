/**
 * Motion primitives built on anime.js (v4).
 *
 * Import these from **client components only** — anime.js touches the DOM.
 * Every helper is a no-op when the visitor asked for reduced motion, so content
 * is never left hidden behind an animation: it simply appears, fully visible.
 */
import { animate, createDrawable, stagger, utils } from "animejs";
import { useEffect, useLayoutEffect } from "react";

/** House easings — the console feels mechanical, never bouncy. */
export const EASE = "outQuint";
export const EASE_SOFT = "outCubic";
export const EASE_INOUT = "inOutSine";
export const EASE_LINEAR = "linear";

/** Shared durations (ms). */
export const DUR = { fast: 320, base: 620, slow: 1200, draw: 1500 } as const;

type Animation = ReturnType<typeof animate>;

/** An anime.js animation handle, as returned by every helper here. */
export type Motion = Animation;

/** SSR-safe layout effect: runs before paint in the browser, no server warning. */
export const useMotionLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * True when animations must not run: the visitor asked for reduced motion,
 * or the platform is in light mode (F59/F62/F96 — chosen manually or
 * auto-detected on a slow / data-saver connection). Lite mode hence stops
 * the animation scripts entirely, not just the CSS effects (F58).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.lite === "1") return true;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Position of an element among its siblings — drives list and grid staggers. */
export function siblingIndex(element: Element | null, max = 12): number {
  const parent = element?.parentElement;
  if (!parent || !element) return 0;
  return Math.min(Array.from(parent.children).indexOf(element), max);
}

export type RevealOptions = {
  /** Extra delay in ms. */
  delay?: number;
  /** Delay added per target, in ms (list / grid stagger). */
  step?: number;
  /** Vertical distance the target travels from, in px. */
  y?: number;
  duration?: number;
  ease?: string;
};

/**
 * Fade + rise targets in. The hidden start state is written synchronously, so
 * nothing flashes before the first animated frame.
 */
export function reveal(targets: Element[], options: RevealOptions = {}): Animation | null {
  const { delay = 0, step = 70, y = 12, duration = DUR.base, ease = EASE } = options;
  const list = targets.filter(Boolean);
  if (list.length === 0 || prefersReducedMotion()) return null;

  utils.set(list, { opacity: 0, translateY: y });

  return animate(list, {
    opacity: 1,
    translateY: 0,
    duration,
    ease,
    delay: stagger(step, { start: delay }),
  });
}

/** Reveal one element, staggered by its place among its siblings. */
export function revealSelf(element: Element | null, options: RevealOptions = {}): Animation | null {
  if (!element) return null;
  const { step = 55, delay = 0, ...rest } = options;
  return reveal([element], { ...rest, delay: delay + siblingIndex(element) * step, step: 0 });
}

/** Reveal the direct children of a container (grids, lists, stacks). */
export function revealChildren(
  container: Element | null,
  options: RevealOptions = {},
): Animation | null {
  if (!container) return null;
  return reveal(Array.from(container.children), options);
}

export type CountUpOptions = { duration?: number; delay?: number; ease?: string };

/** Animate a number from 0 to `target`, reporting the value on every frame. */
export function countUp(
  target: number,
  onUpdate: (value: number) => void,
  options: CountUpOptions = {},
): Animation | null {
  const { duration = DUR.slow, delay = 0, ease = EASE_SOFT } = options;

  if (prefersReducedMotion()) {
    onUpdate(target);
    return null;
  }

  const state = { value: 0 };

  return animate(state, {
    value: target,
    duration,
    delay,
    ease,
    onUpdate: () => onUpdate(state.value),
  });
}

/** Draw-on animation for SVG geometry (radar rings, crosshairs, routes). */
export function drawIn(targets: Element[], options: RevealOptions = {}): Animation | null {
  const { delay = 0, step = 120, duration = DUR.draw, ease = EASE_SOFT } = options;
  if (targets.length === 0 || prefersReducedMotion()) return null;

  // `draw` is a two-number string (start / end along the path) — anime.js
  // interpolates both, and the drawable proxy turns that into dash offsets.
  return animate(createDrawable(targets), {
    draw: "0 1",
    duration,
    ease,
    delay: stagger(step, { start: delay }),
  });
}
