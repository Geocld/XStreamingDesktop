import { useRouter } from "next/router";
import { ReactNode, useEffect, useRef } from "react";
import { FOCUS_ELEMS } from "../common/constans";

type Direction = "up" | "down" | "left" | "right";
type GamepadAction = Direction | "click";

type Candidate = {
  element: HTMLElement;
  rect: DOMRect;
  centerX: number;
  centerY: number;
};

const EXTRA_FOCUS_ELEMS = [
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[data-focusable="true"]',
].join(", ");

const FOCUSABLE_SELECTOR = `${FOCUS_ELEMS}, ${EXTRA_FOCUS_ELEMS}`;
const OVERLAY_SELECTOR = '[role="dialog"], [role="menu"], [role="listbox"]';
const DISABLED_PAGES = new Set(["stream", "test", "nativeTest", "map"]);

const INITIAL_REPEAT_DELAY_MS = 280;
const REPEAT_INTERVAL_MS = 130;
const AXIS_PRESS_THRESHOLD = 0.55;
const AXIS_RELEASE_THRESHOLD = 0.35;

const isHTMLElement = (value: unknown): value is HTMLElement => {
  return value instanceof HTMLElement;
};

const isVisible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none"
  );
};

const isFocusable = (element: HTMLElement) => {
  if (!isVisible(element)) {
    return false;
  }

  if (element.closest("[aria-hidden='true'], [inert]")) {
    return false;
  }

  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }

  return true;
};

const getCandidates = (root: ParentNode): Candidate[] => {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter(isHTMLElement)
    .filter(isFocusable)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        rect,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    });
};

const getActiveScope = () => {
  const activeElement = document.activeElement;
  if (isHTMLElement(activeElement)) {
    const activeOverlay = activeElement.closest(OVERLAY_SELECTOR);
    if (activeOverlay && isHTMLElement(activeOverlay) && isVisible(activeOverlay)) {
      return activeOverlay;
    }
  }

  const overlays = Array.from(document.querySelectorAll(OVERLAY_SELECTOR))
    .filter(isHTMLElement)
    .filter(isVisible)
    .filter((overlay) => getCandidates(overlay).length > 0);

  return overlays[overlays.length - 1] || document.body;
};

const isSameElement = (a: HTMLElement, b: HTMLElement) => a === b;

const sortByVisualOrder = (items: Candidate[]) => {
  return [...items].sort((a, b) => {
    const verticalDelta = a.rect.top - b.rect.top;
    if (Math.abs(verticalDelta) > 8) {
      return verticalDelta;
    }
    return a.rect.left - b.rect.left;
  });
};

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
  return Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);
};

const isInDirection = (from: Candidate, to: Candidate, direction: Direction) => {
  switch (direction) {
    case "up":
      return to.centerY < from.centerY - 4;
    case "down":
      return to.centerY > from.centerY + 4;
    case "left":
      return to.centerX < from.centerX - 4;
    case "right":
      return to.centerX > from.centerX + 4;
  }
};

const scoreCandidate = (from: Candidate, to: Candidate, direction: Direction) => {
  const isVertical = direction === "up" || direction === "down";
  const primaryDistance = isVertical
    ? Math.abs(to.centerY - from.centerY)
    : Math.abs(to.centerX - from.centerX);
  const perpendicularDistance = isVertical
    ? Math.abs(to.centerX - from.centerX)
    : Math.abs(to.centerY - from.centerY);
  const hasOverlap = isVertical
    ? overlaps(from.rect.left, from.rect.right, to.rect.left, to.rect.right)
    : overlaps(from.rect.top, from.rect.bottom, to.rect.top, to.rect.bottom);

  return primaryDistance * 3 + perpendicularDistance + (hasOverlap ? 0 : 220);
};

const findNextCandidate = (
  candidates: Candidate[],
  activeElement: HTMLElement | null,
  direction: Direction
) => {
  if (candidates.length < 1) {
    return null;
  }

  if (!activeElement) {
    return sortByVisualOrder(candidates)[0];
  }

  const current =
    candidates.find((candidate) => isSameElement(candidate.element, activeElement)) ||
    candidates.find((candidate) => candidate.element.contains(activeElement));

  if (!current) {
    return sortByVisualOrder(candidates)[0];
  }

  return candidates
    .filter((candidate) => !isSameElement(candidate.element, current.element))
    .filter((candidate) => isInDirection(current, candidate, direction))
    .sort((a, b) => scoreCandidate(current, a, direction) - scoreCandidate(current, b, direction))[0] || null;
};

const focusElement = (element: HTMLElement) => {
  document.documentElement.classList.add("gamepad-navigation-active");
  element.focus({ preventScroll: true });
  element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
};

const clickElement = (element: HTMLElement) => {
  document.documentElement.classList.add("gamepad-navigation-active");
  element.click();
};

const getPrimaryGamepad = () => {
  const gamepads = navigator.getGamepads();
  for (let index = 0; index < gamepads.length; index++) {
    if (gamepads[index]?.connected) {
      return gamepads[index];
    }
  }
  return null;
};

const getAxisDirection = (axisValue: number, negative: Direction, positive: Direction) => {
  if (axisValue <= -AXIS_PRESS_THRESHOLD) {
    return negative;
  }
  if (axisValue >= AXIS_PRESS_THRESHOLD) {
    return positive;
  }
  return null;
};

const getAction = (gamepad: Gamepad, lastAxisAction: Direction | null): GamepadAction | null => {
  if (gamepad.buttons[0]?.pressed) {
    return "click";
  }
  if (gamepad.buttons[12]?.pressed) {
    return "up";
  }
  if (gamepad.buttons[13]?.pressed) {
    return "down";
  }
  if (gamepad.buttons[14]?.pressed) {
    return "left";
  }
  if (gamepad.buttons[15]?.pressed) {
    return "right";
  }

  const xAxis = Number(gamepad.axes[0]) || 0;
  const yAxis = Number(gamepad.axes[1]) || 0;
  if (Math.abs(xAxis) < AXIS_RELEASE_THRESHOLD && Math.abs(yAxis) < AXIS_RELEASE_THRESHOLD) {
    return null;
  }

  const dominantDirection = Math.abs(xAxis) > Math.abs(yAxis)
    ? getAxisDirection(xAxis, "left", "right")
    : getAxisDirection(yAxis, "up", "down");

  return dominantDirection || lastAxisAction;
};

const getPageName = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
};

export default function GamepadNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const heldActionRef = useRef<GamepadAction | null>(null);
  const lastAxisActionRef = useRef<Direction | null>(null);
  const nextRepeatAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const clearInputState = () => {
      heldActionRef.current = null;
      lastAxisActionRef.current = null;
      nextRepeatAtRef.current = 0;
    };

    const handlePointerInput = () => {
      document.documentElement.classList.remove("gamepad-navigation-active");
    };

    window.addEventListener("mousedown", handlePointerInput, true);
    window.addEventListener("touchstart", handlePointerInput, true);
    window.addEventListener("keydown", handlePointerInput, true);

    const runAction = (action: GamepadAction) => {
      const scope = getActiveScope();
      const candidates = getCandidates(scope);
      const activeElement = isHTMLElement(document.activeElement)
        ? document.activeElement
        : null;

      if (action === "click") {
        const currentCandidate = activeElement
          ? candidates.find((candidate) => candidate.element === activeElement) ||
            candidates.find((candidate) => candidate.element.contains(activeElement))
          : null;
        const target = currentCandidate?.element || sortByVisualOrder(candidates)[0]?.element;
        if (target) {
          clickElement(target);
        }
        return;
      }

      const nextCandidate = findNextCandidate(candidates, activeElement, action);
      if (nextCandidate) {
        focusElement(nextCandidate.element);
      }
    };

    const update = () => {
      const pageName = getPageName(router.pathname);
      if (DISABLED_PAGES.has(pageName)) {
        clearInputState();
        rafRef.current = window.requestAnimationFrame(update);
        return;
      }

      const gamepad = getPrimaryGamepad();
      const action = gamepad ? getAction(gamepad, lastAxisActionRef.current) : null;
      const now = performance.now();

      if (!action) {
        clearInputState();
      } else if (action !== heldActionRef.current) {
        runAction(action);
        heldActionRef.current = action;
        lastAxisActionRef.current = action === "click" ? null : action;
        nextRepeatAtRef.current = now + INITIAL_REPEAT_DELAY_MS;
      } else if (action !== "click" && now >= nextRepeatAtRef.current) {
        runAction(action);
        nextRepeatAtRef.current = now + REPEAT_INTERVAL_MS;
      }

      rafRef.current = window.requestAnimationFrame(update);
    };

    rafRef.current = window.requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousedown", handlePointerInput, true);
      window.removeEventListener("touchstart", handlePointerInput, true);
      window.removeEventListener("keydown", handlePointerInput, true);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [router.pathname]);

  return <>{children}</>;
}
