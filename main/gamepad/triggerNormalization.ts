export type NativeTriggerAxisName = "leftTrigger" | "rightTrigger";

type TriggerBindingMode = "unknown" | "button" | "full-axis" | "half-axis";
type TriggerRestMode = "unknown" | "zero" | "negative" | "half";

export type NativeTriggerBinding =
  | { kind: "unknown"; bindingMode: "unknown" }
  | { kind: "button"; bindingMode: "button"; buttonIndex: number }
  | {
      kind: "axis";
      bindingMode: "full-axis" | "half-axis";
      axisIndex: number;
      direction: 1 | -1;
    };

export type TriggerNormalizerState = {
  bindingMode: TriggerBindingMode;
  restMode: TriggerRestMode;
  lowRestSampleCount: number;
  lastSample: number | null;
};

const HALF_REST_MIN = 0.4;
const HALF_REST_MAX = 0.6;
const HALF_REST_EXACT_MIN = 0.48;
const HALF_REST_EXACT_MAX = 0.52;
const ZERO_REST_MIN = -0.1;
const ZERO_REST_MAX = 0.15;
const NEGATIVE_REST_MAX = -0.25;
const FULL_PRESS_SAMPLE_MIN = 0.9;

const clamp01 = (value: number) => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
};

const normalizeRawTriggerSample = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (numeric >= -1 && numeric <= 1) {
    return numeric;
  }

  if (numeric >= 0 && numeric <= 255) {
    return numeric / 255;
  }

  if (numeric >= -32768 && numeric <= 32767) {
    if (numeric < 0) {
      return numeric / 32768;
    }
    return numeric / 32767;
  }

  if (numeric < 0) {
    return -1;
  }
  return 1;
};

const parseTriggerBindingMode = (
  mapping: unknown,
  axisName: NativeTriggerAxisName
): TriggerBindingMode => {
  return parseTriggerBinding(mapping, axisName).bindingMode;
};

export const parseTriggerBinding = (
  mapping: unknown,
  axisName: NativeTriggerAxisName
): NativeTriggerBinding => {
  if (typeof mapping !== "string" || !mapping.trim()) {
    return {
      kind: "unknown",
      bindingMode: "unknown",
    };
  }

  const normalizedAxisName = axisName.toLowerCase();
  const entries = mapping.split(",");
  for (const entry of entries) {
    const separatorIndex = entry.indexOf(":");
    if (separatorIndex < 1) {
      continue;
    }

    const key = entry.slice(0, separatorIndex).trim().toLowerCase();
    if (key !== normalizedAxisName) {
      continue;
    }

    const token = entry
      .slice(separatorIndex + 1)
      .trim()
      .toLowerCase();
    if (!token) {
      return {
        kind: "unknown",
        bindingMode: "unknown",
      };
    }

    const buttonMatch = token.match(/^b(\d+)$/);
    if (buttonMatch) {
      return {
        kind: "button",
        bindingMode: "button",
        buttonIndex: Number(buttonMatch[1]),
      };
    }

    const axisMatch = token.match(/^([+-]?)[aA](\d+)(~?)$/);
    if (axisMatch) {
      const signToken = axisMatch[1];
      const axisIndex = Number(axisMatch[2]);
      const inverted = axisMatch[3] === "~";
      const baseDirection = signToken === "-" ? -1 : 1;
      return {
        kind: "axis",
        bindingMode: signToken ? "half-axis" : "full-axis",
        axisIndex,
        direction: (baseDirection * (inverted ? -1 : 1)) as 1 | -1,
      };
    }

    return {
      kind: "unknown",
      bindingMode: "unknown",
    };
  }

  return {
    kind: "unknown",
    bindingMode: "unknown",
  };
};

const isHalfRestCandidate = (sample: number) => {
  return sample >= HALF_REST_MIN && sample <= HALF_REST_MAX;
};

const shouldPromoteToHalfRest = (sample: number, normalizer: TriggerNormalizerState) => {
  return (
    sample >= HALF_REST_EXACT_MIN &&
    sample <= HALF_REST_EXACT_MAX &&
    normalizer.lowRestSampleCount <= 1 &&
    normalizer.lastSample !== null &&
    normalizer.lastSample >= FULL_PRESS_SAMPLE_MIN
  );
};

const updateRestMode = (
  normalizer: TriggerNormalizerState,
  sample: number,
  options?: { prime?: boolean }
) => {
  if (sample <= ZERO_REST_MAX) {
    normalizer.lowRestSampleCount += 1;
  }

  if (sample <= NEGATIVE_REST_MAX) {
    normalizer.restMode = "negative";
    return;
  }

  if (normalizer.restMode === "negative") {
    return;
  }

  if (sample >= ZERO_REST_MIN && sample <= ZERO_REST_MAX) {
    if (normalizer.restMode !== "half") {
      normalizer.restMode = "zero";
    }
    return;
  }

  if (!isHalfRestCandidate(sample) || normalizer.bindingMode === "button") {
    return;
  }

  if (normalizer.restMode === "unknown") {
    normalizer.restMode = "half";
    return;
  }

  // Some SDL controller backends report trigger rest as 0 on initial snapshot,
  // but subsequent axisMotion events settle at 0.5 after the first full pull.
  // When we observe that exact transition, switch to half-rest correction even
  // if the static mapping looked like a full-axis trigger.
  if (normalizer.restMode === "zero") {
    if (options?.prime || shouldPromoteToHalfRest(sample, normalizer)) {
      normalizer.restMode = "half";
    }
  }
};

export const createTriggerNormalizerState = (
  mapping: unknown,
  axisName: NativeTriggerAxisName
): TriggerNormalizerState => ({
  bindingMode: parseTriggerBindingMode(mapping, axisName),
  restMode: "unknown",
  lowRestSampleCount: 0,
  lastSample: null,
});

export const resetTriggerNormalizerState = (
  normalizer: TriggerNormalizerState,
  mapping: unknown,
  axisName: NativeTriggerAxisName
) => {
  normalizer.bindingMode = parseTriggerBindingMode(mapping, axisName);
  normalizer.restMode = "unknown";
  normalizer.lowRestSampleCount = 0;
  normalizer.lastSample = null;
};

export const normalizeTriggerUnit = (
  value: unknown,
  normalizer: TriggerNormalizerState,
  options?: { prime?: boolean }
) => {
  const sample = normalizeRawTriggerSample(value);
  updateRestMode(normalizer, sample, options);

  let normalized = 0;
  if (normalizer.restMode === "negative") {
    normalized = (sample + 1) / 2;
  } else if (normalizer.restMode === "half") {
    normalized = (sample - 0.5) * 2;
  } else {
    normalized = sample;
  }

  normalizer.lastSample = sample;
  return clamp01(normalized);
};

export const readTriggerUnitFromJoystickBinding = (
  binding: NativeTriggerBinding,
  joystick: any
) => {
  if (!joystick) {
    return null;
  }

  if (binding.kind === "button") {
    const buttons = Array.isArray(joystick?.buttons) ? joystick.buttons : [];
    return buttons[binding.buttonIndex] ? 1 : 0;
  }

  if (binding.kind !== "axis") {
    return null;
  }

  const axes = Array.isArray(joystick?.axes) ? joystick.axes : [];
  const rawValue = Number(axes[binding.axisIndex]);
  if (!Number.isFinite(rawValue)) {
    return 0;
  }

  return clamp01(rawValue * binding.direction);
};
