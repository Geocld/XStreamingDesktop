import { useTranslation } from "next-i18next";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import Ipc from "../lib/ipc";
import { useSettings } from "../context/userContext";

const CONNECTED = 'connected';

function ActionBar(props) {
  const { t } = useTranslation('cloud');

  const { settings } = useSettings();

  const handleDisconnect = () => {
    props.onDisconnect && props.onDisconnect();
  };

  const handleDisconnectAndPoweroff = () => {
    props.onDisconnectPowerOff && props.onDisconnectPowerOff();
  }

  const handleTogglePerformance = () => {
    props.onTogglePerformance && props.onTogglePerformance();
  };

  const handleDisplay = () => {
    props.onDisplay && props.onDisplay();
  };

  const handleAudio = () => {
    props.onAudio && props.onAudio();
  };

  const handleMic = () => {
    props.onMic && props.onMic();
  };

  const handleText = () => {
    props.onText && props.onText();
  };

  const handlePressNexus = () => {
    props.onPressNexus && props.onPressNexus();
  };

  const handleLongPressNexus = () => {
    props.onLongPressNexus && props.onLongPressNexus();
  };

  const handleToggleFullscreen = () => {
    Ipc.send('app', 'toggleFullscreen')
  }

  return (
    <div id="actionBar">
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" size="sm">
            {t("Menu")}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          {
            props.connectState === CONNECTED && (
              <DropdownItem key="performance" onClick={handleTogglePerformance}>
                {t("Toggle Performance")}
              </DropdownItem>
            )
          }
          
          {
            props.connectState === CONNECTED && (
              <DropdownItem key="display" onClick={handleDisplay}>
                {t("Display settings")}
              </DropdownItem>
            )
          }

          {
            props.connectState === CONNECTED && settings.enable_audio_control && (
              <DropdownItem key="audio" onClick={handleAudio}>
                {t("Audio settings")}
              </DropdownItem>
            )
          }

          {
            props.connectState === CONNECTED && (
              <DropdownItem key="mic" onClick={handleMic}>
                {props.openMicro ? t("Close Mic") : t("Open Mic")}
              </DropdownItem>
            )
          }

          {
            (props.connectState === CONNECTED && props.type !== 'cloud') && (
              <DropdownItem key="text" onClick={handleText}>
                {t("Send text")}
              </DropdownItem>
            )
          }

          {
            props.connectState === CONNECTED && (
              <DropdownItem key="pressNexus" onClick={handlePressNexus}>
                {t("Press Nexus")}
              </DropdownItem>
            )
          }

          {
            (props.connectState === CONNECTED && props.type !== 'cloud') && (
              <DropdownItem key="longPressNexus" onClick={handleLongPressNexus}>
                {t("Long press Nexus")}
              </DropdownItem>
            )
          }
          
          {/* <DropdownItem key="fullscreen" onClick={handleToggleFullscreen}>
            {t("Toggle fullscreen")}
          </DropdownItem> */}

          {
            (props.connectState === CONNECTED && settings.power_on && props.type !== 'cloud') && (
              <DropdownItem
                key="disconnectPoweroff"
                className="text-danger"
                color="danger"
                onClick={handleDisconnectAndPoweroff}
              >
                {t("Disconnect and power off")}
              </DropdownItem>
            )
          }
          <DropdownItem
            key="disconnect"
            className="text-danger"
            color="danger"
            onClick={handleDisconnect}
          >
            {t("Disconnect")}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

export default ActionBar;
