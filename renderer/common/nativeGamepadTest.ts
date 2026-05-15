export const NATIVE_GAMEPAD_TEST_AXIS_NAMES = [
  "leftStickX",
  "leftStickY",
  "rightStickX",
  "rightStickY",
  "leftTrigger",
  "rightTrigger",
] as const;

export type NativeGamepadTestAxisName =
  (typeof NATIVE_GAMEPAD_TEST_AXIS_NAMES)[number];

export const NATIVE_GAMEPAD_TEST_AXIS_LABELS: Record<
  NativeGamepadTestAxisName,
  string
> = {
  leftStickX: "Left Stick X",
  leftStickY: "Left Stick Y",
  rightStickX: "Right Stick X",
  rightStickY: "Right Stick Y",
  leftTrigger: "Left Trigger",
  rightTrigger: "Right Trigger",
};

export const NATIVE_GAMEPAD_TEST_BUTTON_NAMES = [
  "dpadLeft",
  "dpadRight",
  "dpadUp",
  "dpadDown",
  "a",
  "b",
  "x",
  "y",
  "guide",
  "back",
  "start",
  "leftStick",
  "rightStick",
  "leftShoulder",
  "rightShoulder",
  "paddle1",
  "paddle2",
  "paddle3",
  "paddle4",
] as const;

export type NativeGamepadTestButtonName =
  (typeof NATIVE_GAMEPAD_TEST_BUTTON_NAMES)[number];

export const NATIVE_GAMEPAD_TEST_BUTTON_LABELS: Record<
  NativeGamepadTestButtonName,
  string
> = {
  dpadLeft: "D-Pad Left",
  dpadRight: "D-Pad Right",
  dpadUp: "D-Pad Up",
  dpadDown: "D-Pad Down",
  a: "A / Cross",
  b: "B / Circle",
  x: "X / Square",
  y: "Y / Triangle",
  guide: "Guide / PS",
  back: "Back / Share",
  start: "Start / Options",
  leftStick: "L3",
  rightStick: "R3",
  leftShoulder: "L1",
  rightShoulder: "R1",
  paddle1: "Paddle 1",
  paddle2: "Paddle 2",
  paddle3: "Paddle 3",
  paddle4: "Paddle 4",
};

export type NativeGamepadTestAxes = Record<NativeGamepadTestAxisName, number>;
export type NativeGamepadTestButtons = Record<
  NativeGamepadTestButtonName,
  boolean
>;

export const createEmptyNativeGamepadAxes = (): NativeGamepadTestAxes => ({
  leftStickX: 0,
  leftStickY: 0,
  rightStickX: 0,
  rightStickY: 0,
  leftTrigger: 0,
  rightTrigger: 0,
});

export const createEmptyNativeGamepadButtons = (): NativeGamepadTestButtons => ({
  dpadLeft: false,
  dpadRight: false,
  dpadUp: false,
  dpadDown: false,
  a: false,
  b: false,
  x: false,
  y: false,
  guide: false,
  back: false,
  start: false,
  leftStick: false,
  rightStick: false,
  leftShoulder: false,
  rightShoulder: false,
  paddle1: false,
  paddle2: false,
  paddle3: false,
  paddle4: false,
});

export type NativeGamepadTestControllerDevice = {
  id: string;
  numericId: number | null;
  name: string | null;
  path: string | null;
  type: string | null;
  guid: string | null;
  vendor: number | null;
  product: number | null;
  version: number | null;
  player: number | null;
  mapping: string | null;
};

export type NativeGamepadTestControllerCapabilities = {
  hasLed: boolean;
  hasRumble: boolean;
  hasRumbleTriggers: boolean;
};

export type NativeGamepadTestControllerSnapshot = {
  id: string;
  active: boolean;
  connected: boolean;
  closed: boolean;
  power: string | null;
  serialNumber: string | null;
  firmwareVersion: number | null;
  steamHandle: string | null;
  capabilities: NativeGamepadTestControllerCapabilities;
  device: NativeGamepadTestControllerDevice;
  axes: NativeGamepadTestAxes;
  buttons: NativeGamepadTestButtons;
};

export type NativeGamepadTestSnapshot = {
  started: boolean;
  available: boolean;
  error: string | null;
  logs: string[];
  updatedAt: number;
  activeDeviceId: string | null;
  controllers: NativeGamepadTestControllerSnapshot[];
};

