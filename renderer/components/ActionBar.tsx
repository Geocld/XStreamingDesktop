import { useState } from "react";
import { useTranslation } from "next-i18next";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
} from "@heroui/react";
import Ipc from "../lib/ipc";
import { useSettings } from "../context/userContext";

const CONNECTED = 'connected';

function ActionBar(props) {
  const { t } = useTranslation('cloud');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { settings } = useSettings();
  const isConnected = props.connectState === CONNECTED;

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const runAndClose = (callback?: () => void) => {
    closeDrawer();
    callback && callback();
  };

  const handleDisconnect = () => {
    runAndClose(props.onDisconnect);
  };

  const handleDisconnectAndPoweroff = () => {
    runAndClose(props.onDisconnectPowerOff);
  }

  const handleTogglePerformance = () => {
    runAndClose(props.onTogglePerformance);
  };

  const handleDisplay = () => {
    runAndClose(props.onDisplay);
  };

  const handleAudio = () => {
    runAndClose(props.onAudio);
  };

  const handleMic = () => {
    runAndClose(props.onMic);
  };

  const handleText = () => {
    runAndClose(props.onText);
  };

  const handlePressNexus = () => {
    runAndClose(props.onPressNexus);
  };

  const handleLongPressNexus = () => {
    runAndClose(props.onLongPressNexus);
  };

  const handleToggleFullscreen = () => {
    runAndClose(() => {
      Ipc.send('app', 'toggleFullscreen')
    });
  }

  return (
    <div id="actionBar">
      <Button
        variant="bordered"
        size="sm"
        style={{ color: '#fff' }}
        onPress={() => setDrawerOpen(true)}
      >
        {t("Menu")}
      </Button>

      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen} placement="right" size="xs">
        <DrawerContent className="h-[100dvh] max-h-[100dvh] overflow-hidden text-sm">
          <>
            <DrawerBody className="h-full min-h-0 overflow-hidden p-0">
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3">
                  <div className="flex flex-col gap-3 pb-3">
                    {
                      isConnected && (
                        <Button size="sm" variant="flat" className="justify-center" onPress={handleTogglePerformance}>
                          {t("Toggle Performance")}
                        </Button>
                      )
                    }

                    {
                      isConnected && (
                        <Button size="sm" variant="flat" className="justify-center" onPress={handleDisplay}>
                          {t("Display settings")}
                        </Button>
                      )
                    }

                    {
                      isConnected && settings.enable_audio_control && (
                        <Button size="sm" variant="flat" className="justify-center" onPress={handleAudio}>
                          {t("Audio settings")}
                        </Button>
                      )
                    }

                    {
                      isConnected && (
                        <Button size="sm" variant="flat" className="justify-center" onPress={handleMic}>
                          {props.openMicro ? t("Close Mic") : t("Open Mic")}
                        </Button>
                      )
                    }

                    {
                      (isConnected && props.type !== 'cloud') && (
                        <Button size="sm" variant="flat" className="justify-center" onPress={handleText}>
                          {t("Send text")}
                        </Button>
                      )
                    }

                    {
                      isConnected && (
                        <Button size="sm" variant="flat" className="justify-center" onPress={handlePressNexus}>
                          {t("Press Nexus")}
                        </Button>
                      )
                    }

                    {
                      (isConnected && props.type !== 'cloud') && (
                        <Button size="sm" variant="flat" className="justify-center" onPress={handleLongPressNexus}>
                          {t("Long press Nexus")}
                        </Button>
                      )
                    }

                    <Button size="sm" variant="flat" className="justify-center" onPress={handleToggleFullscreen}>
                      {t("Toggle fullscreen")}
                    </Button>
                  </div>
                </div>

                <div
                  className="shrink-0 border-t border-default-200 bg-content1 p-3"
                  style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
                >
                  <div className="flex flex-col gap-3">
                    {
                      (isConnected && settings.power_on && props.type !== 'cloud') && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          className="justify-center"
                          onPress={handleDisconnectAndPoweroff}
                        >
                          {t("Disconnect and power off")}
                        </Button>
                      )
                    }

                    <Button
                      size="sm"
                      color="danger"
                      className="justify-center"
                      onPress={handleDisconnect}
                    >
                      {t("Disconnect")}
                    </Button>
                  </div>
                </div>
              </div>
            </DrawerBody>
          </>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default ActionBar;
