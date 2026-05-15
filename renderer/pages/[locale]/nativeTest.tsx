import { Button, Card, CardBody, Chip, addToast } from "@heroui/react";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Ipc from "../../lib/ipc";
import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";
import { useSettings } from "../../context/userContext";
import {
  NATIVE_GAMEPAD_TEST_AXIS_LABELS,
  NATIVE_GAMEPAD_TEST_AXIS_NAMES,
  NATIVE_GAMEPAD_TEST_BUTTON_LABELS,
  NATIVE_GAMEPAD_TEST_BUTTON_NAMES,
  type NativeGamepadTestControllerSnapshot,
  type NativeGamepadTestSnapshot,
} from "../../common/nativeGamepadTest";

const EMPTY_SNAPSHOT: NativeGamepadTestSnapshot = {
  started: false,
  available: false,
  error: null,
  logs: [],
  updatedAt: 0,
  activeDeviceId: null,
  controllers: [],
};

const resolveGamepadKernel = (settings: any): "web" | "native" => {
  const normalized = String(settings?.gamepad_kernel || settings?.gamepad_kernal || "")
    .trim()
    .toLowerCase();
  return normalized === "native" ? "native" : "web";
};

const normalizeSnapshot = (value: unknown): NativeGamepadTestSnapshot => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_SNAPSHOT;
  }

  const snapshot = value as NativeGamepadTestSnapshot;
  return {
    started: !!snapshot.started,
    available: !!snapshot.available,
    error: snapshot.error ? String(snapshot.error) : null,
    logs: Array.isArray(snapshot.logs)
      ? snapshot.logs.map((item) => String(item))
      : [],
    updatedAt: Number(snapshot.updatedAt) || 0,
    activeDeviceId: snapshot.activeDeviceId ? String(snapshot.activeDeviceId) : null,
    controllers: Array.isArray(snapshot.controllers) ? snapshot.controllers : [],
  };
};

const formatAxisValue = (value: number, triggerAxis = false) => {
  const numeric = Number(value) || 0;
  return triggerAxis ? numeric.toFixed(3) : numeric.toFixed(3);
};

const formatPercent = (value: number) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;

const AxisMeter = ({
  label,
  value,
  triggerAxis,
}: {
  label: string;
  value: number;
  triggerAxis: boolean;
}) => {
  const numeric = Number(value) || 0;
  const ratio = triggerAxis
    ? Math.max(0, Math.min(1, numeric))
    : (Math.max(-1, Math.min(1, numeric)) + 1) / 2;

  return (
    <div className="rounded-xl border border-divider bg-content2 p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-default-500">{formatAxisValue(numeric, triggerAxis)}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-default-200">
        {!triggerAxis ? (
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-default-500/40" />
        ) : null}
        <div
          className="absolute inset-y-0 rounded-full bg-primary"
          style={{
            left: 0,
            width: `${Math.max(0, Math.min(100, ratio * 100))}%`,
          }}
        />
      </div>
    </div>
  );
};

const InfoLine = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) => {
  return (
    <div className="rounded-xl border border-divider bg-content2 p-3">
      <div className="text-xs uppercase tracking-wide text-default-500">{label}</div>
      <div className="mt-1 break-all font-mono text-sm text-foreground">
        {value === null || value === "" ? "--" : String(value)}
      </div>
    </div>
  );
};

const ControllerCard = ({
  controller,
  onRumble,
  onTriggerRumble,
}: {
  controller: NativeGamepadTestControllerSnapshot;
  onRumble: (deviceId: string) => void;
  onTriggerRumble: (deviceId: string) => void;
}) => {
  const pressedButtons = NATIVE_GAMEPAD_TEST_BUTTON_NAMES.filter(
    (buttonName) => controller.buttons[buttonName]
  );

  return (
    <Card className="border border-divider bg-content1">
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-lg font-semibold text-foreground">
                {controller.device.name || "Unknown controller"}
              </div>
              {controller.active ? <Chip color="primary" size="sm">Active</Chip> : null}
              <Chip size="sm" variant="flat" color={controller.connected ? "success" : "default"}>
                {controller.connected ? "Connected" : "Disconnected"}
              </Chip>
              {controller.device.type ? (
                <Chip size="sm" variant="flat">
                  {controller.device.type}
                </Chip>
              ) : null}
            </div>
            <div className="mt-2 text-sm text-default-500">
              Device #{controller.id}
              {controller.device.player !== null ? ` | Player ${controller.device.player}` : ""}
              {controller.power ? ` | Power ${controller.power}` : ""}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              color="primary"
              onPress={() => onRumble(controller.id)}
              isDisabled={!controller.capabilities.hasRumble}
            >
              Rumble
            </Button>
            <Button
              size="sm"
              color="secondary"
              onPress={() => onTriggerRumble(controller.id)}
              isDisabled={!controller.capabilities.hasRumbleTriggers}
            >
              Trigger rumble
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoLine label="Path" value={controller.device.path} />
          <InfoLine label="GUID" value={controller.device.guid} />
          <InfoLine label="Vendor / Product" value={
            controller.device.vendor !== null || controller.device.product !== null
              ? `${controller.device.vendor ?? "--"} / ${controller.device.product ?? "--"}`
              : null
          } />
          <InfoLine label="Serial / Firmware" value={
            controller.serialNumber || controller.firmwareVersion !== null
              ? `${controller.serialNumber || "--"} / ${controller.firmwareVersion ?? "--"}`
              : null
          } />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip size="sm" variant="flat" color={controller.capabilities.hasLed ? "success" : "default"}>
            LED {controller.capabilities.hasLed ? "Yes" : "No"}
          </Chip>
          <Chip size="sm" variant="flat" color={controller.capabilities.hasRumble ? "success" : "default"}>
            Rumble {controller.capabilities.hasRumble ? "Yes" : "No"}
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color={controller.capabilities.hasRumbleTriggers ? "success" : "default"}
          >
            Trigger Rumble {controller.capabilities.hasRumbleTriggers ? "Yes" : "No"}
          </Chip>
          {controller.steamHandle ? (
            <Chip size="sm" variant="flat">
              Steam Handle
            </Chip>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Axes</div>
            {NATIVE_GAMEPAD_TEST_AXIS_NAMES.map((axisName) => (
              <AxisMeter
                key={axisName}
                label={NATIVE_GAMEPAD_TEST_AXIS_LABELS[axisName]}
                value={controller.axes[axisName]}
                triggerAxis={axisName.includes("Trigger")}
              />
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">Buttons</div>
              <div className="text-xs text-default-500">
                Pressed {pressedButtons.length} / {NATIVE_GAMEPAD_TEST_BUTTON_NAMES.length}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {NATIVE_GAMEPAD_TEST_BUTTON_NAMES.map((buttonName) => {
                const pressed = controller.buttons[buttonName];
                return (
                  <div
                    key={buttonName}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      pressed
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-divider bg-content2 text-default-500"
                    }`}
                  >
                    <div className="font-medium">{NATIVE_GAMEPAD_TEST_BUTTON_LABELS[buttonName]}</div>
                    <div className="mt-1 text-xs">{pressed ? "Pressed" : "Idle"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <details className="rounded-xl border border-divider bg-content2 p-3 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            Device mapping and raw info
          </summary>
          <div className="mt-3 space-y-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-default-500">Mapping</div>
              <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs text-foreground">
                {controller.device.mapping || "--"}
              </pre>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-default-500">Trigger travel</div>
              <div className="mt-1 font-mono text-xs text-foreground">
                L2 {formatPercent(controller.axes.leftTrigger)} | R2{" "}
                {formatPercent(controller.axes.rightTrigger)}
              </div>
            </div>
            {controller.steamHandle ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-default-500">Steam Handle</div>
                <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs text-foreground">
                  {controller.steamHandle}
                </pre>
              </div>
            ) : null}
          </div>
        </details>
      </CardBody>
    </Card>
  );
};

function NativeGamepadTesterPage() {
  const { settings } = useSettings();
  const [isLogined, setIsLogined] = useState(false);
  const [snapshot, setSnapshot] = useState<NativeGamepadTestSnapshot>(EMPTY_SNAPSHOT);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    const logined = window.sessionStorage.getItem("isLogined") || "0";
    setIsLogined(logined === "1");
  }, []);

  useEffect(() => {
    let active = true;
    let pollTimer = 0;

    const updateSnapshot = async (action: "start" | "refresh" = "refresh") => {
      try {
        const result =
          action === "start"
            ? await Ipc.send("app", "startNativeGamepadTestSession")
            : await Ipc.send("app", "getNativeGamepadTestSnapshot");
        if (!active) {
          return;
        }
        setSnapshot(normalizeSnapshot(result));
      } catch (error: any) {
        if (!active) {
          return;
        }
        const message = String(error?.message || error || "Failed to read native gamepad snapshot.");
        setSnapshot((current) => ({
          ...current,
          error: message,
        }));
      } finally {
        if (active) {
          setIsStarting(false);
        }
      }
    };

    void updateSnapshot("start");
    pollTimer = window.setInterval(() => {
      void updateSnapshot("refresh");
    }, 80);

    return () => {
      active = false;
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      void Ipc.send("app", "stopNativeGamepadTestSession").catch(() => undefined);
    };
  }, []);

  const currentKernel = resolveGamepadKernel(settings);

  const handleRumble = async (deviceId: string) => {
    try {
      await Ipc.send("app", "triggerNativeGamepadTestRumble", {
        deviceId,
        low: 1,
        high: 1,
        durationMs: 1000,
      });
    } catch (error: any) {
      addToast({
        title: "Native rumble failed",
        description: String(error?.message || error || ""),
        color: "danger",
      });
    }
  };

  const handleTriggerRumble = async (deviceId: string) => {
    try {
      await Ipc.send("app", "triggerNativeGamepadTestTriggerRumble", {
        deviceId,
        left: 1,
        right: 1,
        durationMs: 1000,
      });
    } catch (error: any) {
      addToast({
        title: "Native trigger rumble failed",
        description: String(error?.message || error || ""),
        color: "danger",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav current="settings" isLogined={isLogined} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-6">
        <Card className="border border-divider bg-content1">
          <CardBody className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-semibold text-foreground">Native Gamepad Tester</div>
              <div className="mt-2 text-sm text-default-500">
                Test native SDL controller input separately from the browser Gamepad API page.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip size="sm" variant="flat" color={currentKernel === "native" ? "success" : "warning"}>
                  Current kernel: {currentKernel}
                </Chip>
                <Chip size="sm" variant="flat">
                  Controllers: {snapshot.controllers.length}
                </Chip>
                {snapshot.activeDeviceId ? (
                  <Chip size="sm" variant="flat" color="primary">
                    Active: {snapshot.activeDeviceId}
                  </Chip>
                ) : null}
              </div>
            </div>

            <Button
              color="primary"
              variant="flat"
              onPress={() => {
                setIsStarting(true);
                void Ipc.send("app", "startNativeGamepadTestSession")
                  .then((result) => {
                    setSnapshot(normalizeSnapshot(result));
                  })
                  .catch((error: any) => {
                    setSnapshot((current) => ({
                      ...current,
                      error: String(error?.message || error || "Failed to restart native tester."),
                    }));
                  })
                  .finally(() => {
                    setIsStarting(false);
                  });
              }}
              isLoading={isStarting}
            >
              Refresh
            </Button>
          </CardBody>
        </Card>

        {currentKernel !== "native" ? (
          <Card className="border border-warning/40 bg-warning/10">
            <CardBody className="text-sm text-warning-700 dark:text-warning-300">
              Native test page is independent from the web kernel page. Your current setting is
              still <span className="font-semibold">{currentKernel}</span>; switch
              <span className="font-semibold"> gamepad kernel </span>
              to <span className="font-semibold">native</span> if you want stream input to use the
              same backend as this tester.
            </CardBody>
          </Card>
        ) : null}

        {snapshot.error ? (
          <Card className="border border-danger/40 bg-danger/10">
            <CardBody className="text-sm text-danger-600 dark:text-danger-300">
              {snapshot.error}
            </CardBody>
          </Card>
        ) : null}

        {snapshot.controllers.length < 1 ? (
          <Card className="border border-divider bg-content1">
            <CardBody className="text-sm text-default-500">
              {isStarting
                ? "Starting native SDL controller tester..."
                : "No native SDL controllers detected. Connect a controller and keep this page open."}
            </CardBody>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          {snapshot.controllers.map((controller) => (
            <ControllerCard
              key={controller.id}
              controller={controller}
              onRumble={handleRumble}
              onTriggerRumble={handleTriggerRumble}
            />
          ))}
        </div>

        <Card className="border border-divider bg-content1">
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">Native tester log</div>
              <div className="text-xs text-default-500">
                Updated at {snapshot.updatedAt > 0 ? new Date(snapshot.updatedAt).toLocaleTimeString() : "--"}
              </div>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-content2 p-3 font-mono text-xs text-default-600">
              {snapshot.logs.length > 0 ? snapshot.logs.join("\n") : "No native tester logs yet."}
            </pre>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default NativeGamepadTesterPage;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "settings"]);

// eslint-disable-next-line react-refresh/only-export-components
export { getStaticPaths };
