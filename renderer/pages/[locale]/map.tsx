import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import GamepadMapModal from "../../components/GamepadMapModal";
import MapItem from "../../components/MapItem";
import Nav from "../../components/Nav";
import { useSettings } from "../../context/userContext";

import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

const defaultMaping = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  DPadUp: 12,
  DPadDown: 13,
  DPadLeft: 14,
  DPadRight: 15,
  LeftShoulder: 4,
  RightShoulder: 5,
  LeftThumb: 10,
  RightThumb: 11,
  LeftTrigger: 6,
  RightTrigger: 7,
  Menu: 9,
  View: 8,
  Nexus: 16,
};

const buttonLabels = [
  "A",
  "B",
  "X",
  "Y",
  "DPadUp",
  "DPadDown",
  "DPadLeft",
  "DPadRight",
  "LeftShoulder",
  "RightShoulder",
  "LeftTrigger",
  "RightTrigger",
  "LeftThumb",
  "RightThumb",
  "View",
  "Menu",
  "Nexus",
];

function Map() {
  const { t, i18n: {language: locale} } = useTranslation("settings");
  const { settings, setSettings } = useSettings();
  const router = useRouter();

  const [maping, setMaping] = useState(
    JSON.parse(JSON.stringify(defaultMaping))
  );
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(false);
  // const [loadingText, setLoadingText] = useState("");
  const [isLogined, setIsLogined] = useState(false);

  useEffect(() => {
    const _isLogined = window.sessionStorage.getItem("isLogined") || "0";
    if (_isLogined === "1") {
      setIsLogined(true);
    }

    if (settings.gamepad_maping) {
      setMaping(settings.gamepad_maping)
    }

    return () => {};
  }, [settings]);

  const [showModal, setShowModal] = useState(false);

  const handleMapConfirm = (name, idx) => {
    console.log(name, idx);
    setShowModal(false);
    setMaping({
      ...maping,
      [name]: idx,
    });
  };

  const handleMapPress = (name) => {
    setCurrent(name);
    setShowModal(true);
  };

  const handleSave = () => {
    console.log("maping:", maping);
    setLoading(true)
    setSettings({
      ...settings,
      gamepad_maping: maping,
    });
    router.push({
      pathname: `/${locale}/settings`
    });
  };

  const handleReset = () => {
    setMaping(defaultMaping);
  };

  return (
    <div className="map-page">
      <Nav current={t("Settings")} isLogined={isLogined} />

      {showModal && (
        <GamepadMapModal
          show={showModal}
          current={current}
          onConfirm={handleMapConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="maps">
        {buttonLabels.map((name) => {
          return (
            <div className="maps-item" key={name}>
              <MapItem
                name={name}
                value={maping[name]}
                onPress={handleMapPress}
              />
            </div>
          );
        })}

        <div className="operate-btns">
          <Button
            color="primary"
            className="mt-5"
            fullWidth
            isLoading={loading}
            onClick={handleSave}
          >
            {t("Save")}
          </Button>
          <Button
            color="default"
            className="mt-5"
            fullWidth
            onClick={handleReset}
          >
            {t("Reset")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Map;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "settings"]);

// eslint-disable-next-line react-refresh/only-export-components
export {getStaticPaths};
