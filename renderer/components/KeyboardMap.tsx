import { useState } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { useTranslation } from "next-i18next";
import { useSettings } from "../context/userContext";
import { defaultSettings } from "../context/userContext.defaults";
import { useTheme } from "next-themes";

function invert(obj) {
  const new_obj = {};
  for (const prop in obj) {
    new_obj[obj[prop]] = prop;
  }
  return new_obj;
}

function KeyboardMap() {
  const mappableButtons = [
    "DPadUp",
    "DPadDown",
    "DPadLeft",
    "DPadRight",
    "A",
    "B",
    "X",
    "Y",
    "View",
    "Menu",
    "Nexus",
    "LeftShoulder",
    "RightShoulder",
    "LeftTrigger",
    "RightTrigger",
    "LeftThumb",
    "RightThumb",
    "LeftThumbXAxisPlus",
    "LeftThumbXAxisMinus",
    "LeftThumbYAxisPlus",
    "LeftThumbYAxisMinus",
    "RightThumbXAxisPlus",
    "RightThumbXAxisMinus",
    "RightThumbYAxisPlus",
    "RightThumbYAxisMinus"
  ];
  const { theme } = useTheme();
  const { settings, setSettings } = useSettings();
  const { t } = useTranslation("settings");

  const [controllerKeys, setControllerKeys] = useState(
    settings.input_mousekeyboard_maping
  );

  const setKeyConfig = (button: string, event) => {
    console.log('setKeyConfig:', button, event.key)
    let ckeys = controllerKeys;
    if (ckeys === undefined) {
      ckeys = {} as any;
    }

    for (const ckeysKey of Object.keys(ckeys)) {
      if (ckeys[ckeysKey] === button) delete ckeys[ckeysKey];
    }

    if (event.key !== "Backspace") ckeys[event.key] = button;

    setControllerKeys({
      ...controllerKeys,
      ...ckeys
    });

    event.target.blur();

    setSettings({
        ...settings,
        input_mousekeyboard_maping: ckeys,
    });
  };


  let keyConfigs: any = controllerKeys;
  keyConfigs = invert(keyConfigs);

  const handleReset = () => {
    setControllerKeys({
      ...defaultSettings.input_mousekeyboard_maping,
    });
    setSettings({
      ...settings,
      input_mousekeyboard_maping: defaultSettings.input_mousekeyboard_maping,
  });
  }

  return (
    <Card className="setting-item">
      <CardBody>
        <div className="setting-title">{t("Keyboard mapping")}</div>
        <div className="setting-description">
          {t("Config keyboard key mapping")}
        </div>
        {mappableButtons.map((btn: string) => {
          let fullBtnText = "";
          switch (btn) {
            case "DPadUp":
              fullBtnText = "DPad Up";
              break;
            case "DPadDown":
              fullBtnText = "DPad Down";
              break;
            case "DPadLeft":
              fullBtnText = "DPad Left";
              break;
            case "DPadRight":
              fullBtnText = "DPad Right";
              break;
            case "LeftShoulder":
              fullBtnText = "Left Shoulder";
              break;
            case "RightShoulder":
              fullBtnText = "Right Shoulder";
              break;
            case "LeftTrigger":
              fullBtnText = "Left Trigger";
              break;
            case "RightTrigger":
              fullBtnText = "Right Trigger";
              break;
            case "LeftThumb":
              fullBtnText = "Left Thumbstick";
              break;
            case "RightThumb":
              fullBtnText = "Right Thumbstick";
              break;
            case "LeftThumbXAxisPlus":
              fullBtnText = "Left Stick +x";
              break;
            case "LeftThumbXAxisMinus":
              fullBtnText = "Left Stick -x";
              break;
            case "LeftThumbYAxisPlus":
              fullBtnText = "Left Stick +y";
              break;
            case "LeftThumbYAxisMinus":
              fullBtnText = "Left Stick -y";
              break;
            case "RightThumbXAxisPlus":
              fullBtnText = "Right Stick +x";
              break;
            case "RightThumbXAxisMinus":
              fullBtnText = "Right Stick -x";
              break;
            case "RightThumbYAxisPlus":
              fullBtnText = "Right Stick +y";
              break;
            case "RightThumbYAxisMinus":
              fullBtnText = "Right Stick -y";
              break;
            default:
              fullBtnText = btn;
              break;
          }
          return (
            <div key={btn} className="pb-2">
              <label className="pr-5">{fullBtnText}</label>
              <label style={{ minWidth: 0 }}>
                <input
                  type="text"
                  className={`text px-2 w-32 ${theme === 'xbox-light' ? 'bg-slate-100' : ''}`}
                  onKeyUp={(e) => setKeyConfig(btn, e)}
                  value={keyConfigs[btn] ?? "None"}
                />
              </label>
            </div>
          );
        })}
        <Button
          color="primary"
          onClick={handleReset}
        >
          {t('Reset')}
        </Button>
      </CardBody>
    </Card>
  );
}

export default KeyboardMap;
