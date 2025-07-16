import React, { useEffect, useState, useRef } from "react";
import { Button, Tabs, Tab, Card, CardBody, Input, addToast } from "@heroui/react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useSettings } from "../../context/userContext";

import Ipc from "../../lib/ipc";
import Layout from "../../components/Layout";
import SettingItem from "../../components/SettingItem";
import Alert from "../../components/Alert";
import getSettingsMetas from "../../common/settings";
import Nav from "../../components/Nav";
import FeedbackModal from "../../components/FeedbackModal";
import ConfirmModal from "../../components/ConfirmModal";
import KeyboardMap from "../../components/KeyboardMap";
import updater from "../../lib/updater";
import { FOCUS_ELEMS } from '../../common/constans';
import pkg from "../../../package.json";

import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

function Settings() {
  const { t, i18n: {language: locale} } = useTranslation("settings");
  const { settings: localSettings, setSettings: setLocalSettings, resetSettings } = useSettings();
  const router = useRouter();
  const { theme } = useTheme();

  const [showAlert, setShowAlert] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [updateUrl, setUpdateUrl] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLogined, setIsLogined] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [settings, setSettings] = useState<any>({});

  const [serverUrl, setServerUrl] = useState('');
  const [serverUsername, setServerUsername] = useState('');
  const [serverPwd, setServerPwd] = useState('');

  const currentIndex = useRef(0);
  const focusable = useRef<any>([]);

  useEffect(() => {
    const _isLogined = window.sessionStorage.getItem("isLogined") || "0";
    if (_isLogined === "1") {
      setIsLogined(true);
    }

    const localFontSize = localStorage.getItem('fontSize');
    if (localFontSize && localFontSize !== '16') {
      document.documentElement.style.fontSize = localFontSize + 'px';
    }

    const _settings = getSettingsMetas(t);
    setSettings(_settings);

    setTimeout(() => {
      focusable.current = document.querySelectorAll(FOCUS_ELEMS);

      setServerUrl(localSettings.server_url);
      setServerUsername(localSettings.server_username);
      setServerPwd(localSettings.server_credential);
    },  1000);

    function nextItem(index) {
      index++;
      currentIndex.current = index % focusable.current.length;
      const elem = focusable.current[currentIndex.current];
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        charCode: 9,
        view: window,
        bubbles: true
      });

      document.dispatchEvent(keyboardEvent);
      elem.focus();
    }

    function prevItem(index) {
      if (index === 0) {
        currentIndex.current = focusable.current.length - 1
      } else {
        index -= 1;
        currentIndex.current = index % focusable.current.length;
      }
      
      const elem = focusable.current[currentIndex.current];
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        charCode: 9,
        view: window,
        bubbles: true,
        shiftKey: true
      });
      document.dispatchEvent(keyboardEvent);
      elem && elem.focus();
    }

    function clickItem() {
      setTimeout(() => {
        const elem = focusable.current[currentIndex.current];
        elem && elem.blur();
        elem && elem.click();
      }, 300);
    }

    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();
      let _gamepad = null
      gamepads.forEach(gp => {
        if (gp) _gamepad = gp
      })
      if (_gamepad) {
        _gamepad.buttons.forEach((b, idx) => {
          if (b.pressed) {
            if (idx === 0) {
              clickItem();
            } else if (idx === 12) {
              prevItem(currentIndex.current);
            } else if (idx === 13) {
              nextItem(currentIndex.current);
            } else if (idx === 14) {
              prevItem(currentIndex.current);
            } else if (idx === 15) {
              nextItem(currentIndex.current);
            }
          }
        })
      }
    }

    const timer = setInterval(pollGamepads, 100);

    return () => {
      timer && clearInterval(timer)
    }
  }, [t, localSettings]);

  const resetNavigationElems = () => {
    setTimeout(() => {
      focusable.current = document.querySelectorAll(FOCUS_ELEMS);
    },  800);
  };

  const handleResetSettings = () => {
    window.localStorage.clear();
    resetSettings();
    setTimeout(() => {
      setAlertMessage(t("Reset Successfully"));
      setShowAlert(true);
    }, 100);
  };

  const handleCheckUpdate = () => {
    setIsChecking(true);
    updater().then((infos: any) => {
      setIsChecking(false);
      if (infos) {
        const { latestVer, version, url } = infos;
        setUpdateText(
          `Check new version ${latestVer}, current version is ${version}`
        );
        setUpdateUrl(url);
        setShowUpdateModal(true);
      } else {
        setAlertMessage(t("Current version is latest"));
        setShowAlert(true);
      }
    });
  };

  const handleLogout = () => {
    Ipc.send("app", "clearData");
  };

  const handleExit = () => {
    Ipc.send("app", "quit");
  };

  const handleServerChange = (name: string, text: string) => {
    if (name === 'url') {
      setServerUrl(text);
    }
    if (name === 'username') {
      setServerUsername(text);
    }
    if (name === 'password') {
      setServerPwd(text);
    }
  };

  const handleSaveServer = () => {
    if (serverUrl && !serverUrl.startsWith('turn:')) {
      alert(t('UrlIncorrect'));
      return;
    }
    setLocalSettings({
      ...localSettings,
      server_url: serverUrl,
      server_username: serverUsername,
      server_credential: serverPwd
    });
    addToast({
      title: t('Saved'),
      color: 'success'
    });
  };

  return (
    <>
      <Nav current={t("Settings")} isLogined={isLogined} />

      {showAlert && (
        <Alert content={alertMessage} onClose={() => setShowAlert(false)} />
      )}

      <FeedbackModal
        show={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      <ConfirmModal
        show={showRestartModal}
        content={t(
          "The option has been saved. A restart is required for it to take effect. Would you like to restart now?"
        )}
        confirmText={t("Restart")}
        onConfirm={() => {
          Ipc.send("app", "restart");
        }}
        onCancel={() => setShowRestartModal(false)}
      />

      <ConfirmModal
        show={showUpdateModal}
        content={updateText}
        onCancel={() => setShowUpdateModal(false)}
        onConfirm={() => {
          window.location.href = updateUrl;
          setShowUpdateModal(false);
        }}
      />

      <Layout>
        <Tabs aria-label="Options" onSelectionChange={() => {
          resetNavigationElems()
        }}>
          <Tab key="Language" title={t("Language")}>
            {settings.language &&
              settings.language.map((item) => {
                return (
                  <SettingItem
                    key={item.name}
                    item={item}
                    onRestartWarn={() => setShowRestartModal(true)}
                  />
                );
              })}
          </Tab>

          <Tab key="Streaming" title={t("Streaming")}>
            {settings.streaming &&
              settings.streaming.map((item) => {
                return (
                  <SettingItem
                    key={item.name}
                    item={item}
                    onRestartWarn={() => setShowRestartModal(true)}
                  />
                );
              })}

              <div className="setting-item">
                <Card>
                  <CardBody>
                    <div className={`setting-title ${theme === 'xbox-light' ? 'text-black' : 'text-white'}`}>{t('TURN server')}</div>
                    <div className={`setting-description ${theme === 'xbox-light' ? 'text-black' : 'text-gray'}`}>{t('Custom TURN server')}</div>
                    <Input className="mb-4" value={serverUrl} label="URL" type="text" labelPlacement="outside-top" size="sm" isClearable onValueChange={(text: string) => handleServerChange('url', text)}/>
                    <Input className="mb-4" value={serverUsername} label={t('Username')} type="text" labelPlacement="outside-top" isClearable size="sm" onValueChange={(text: string) => handleServerChange('username', text)}/>
                    <Input className="mb-4" value={serverPwd} label={t('Password')} type="text" labelPlacement="outside-top" size="sm" isClearable onValueChange={(text: string) => handleServerChange('password', text)}/>

                    <Button color="primary" onPress={handleSaveServer}>
                      {t('Save server')}
                    </Button>
                  </CardBody>
                </Card>
              </div>
          </Tab>

          <Tab key="Gamepad" title={t("Gamepad")}>
            {settings.gamepad &&
              settings.gamepad.map((item) => {
                return (
                  <SettingItem
                    key={item.name}
                    item={item}
                    onRestartWarn={() => setShowRestartModal(true)}
                  />
                );
              })}

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Gamepad mapping")}</div>
                <div className="setting-description">
                  {t("Mapping key of gamepad")}
                </div>

                <Button
                  color="primary"
                  onPress={() => {
                    router.push({
                      pathname: `/${locale}/map`
                    });
                  }}
                >
                  {t('Settings')}
                </Button>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="XHome" title={t("Xhome")}>
            {settings.xhome &&
              settings.xhome.map((item) => {
                return (
                  <SettingItem
                    key={item.name}
                    item={item}
                    onRestartWarn={() => setShowRestartModal(true)}
                  />
                );
              })}
          </Tab>

          <Tab key="Xcloud" title={t("Xcloud")}>
            {settings.xcloud &&
              settings.xcloud.map((item) => {
                return (
                  <SettingItem
                    key={item.name}
                    item={item}
                    onRestartWarn={() => setShowRestartModal(true)}
                  />
                );
              })}
          </Tab>

          <Tab key="Others" title={t("Others")}>
            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Gamepad tester")}</div>
                <div className="setting-description">
                  {t("Test connected gamepad")}
                </div>

                <Button
                  color="primary"
                  onPress={() => {
                    router.push({
                      pathname: `/${locale}/test`
                    });
                  }}
                >
                  test
                </Button>
              </CardBody>
            </Card>

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Reset Settings")}</div>
                <div className="setting-description">
                  {t("Reset XStreaming settings to default")}
                </div>

                <Button color="primary" onPress={handleResetSettings}>
                  {t("Reset Settings")}
                </Button>
              </CardBody>
            </Card>

            <KeyboardMap/>

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Check update")}</div>
                <div className="setting-description">
                  {t("Check XStreaming update, current version is:")}{" "}
                  {pkg.version}
                </div>

                <Button
                  color="primary"
                  isLoading={isChecking}
                  onPress={handleCheckUpdate}
                >
                  {t("Check")}
                </Button>
              </CardBody>
            </Card>

            {(locale === "zh" || locale === "zht") && (
              <Card className="setting-item">
                <CardBody>
                  <div className="setting-title">支持及交流</div>
                  <div className="setting-description">
                    支持开发或交流更多串流技术
                  </div>

                  <Button color="primary" onPress={() => setShowFeedback(true)}>
                    加群
                  </Button>
                </CardBody>
              </Card>
            )}

            {
              isLogined && (
                <Card className="setting-item">
                  <CardBody>
                    <Button color="danger" onPress={handleLogout}>
                      {t("Logout")}
                    </Button>
                  </CardBody>
                </Card>
              )
            }

            <Card className="setting-item">
              <CardBody>
                <Button color="danger" onPress={handleLogout}>
                  {t("Clear cache")}
                </Button>
              </CardBody>
            </Card>

            <Card className="setting-item">
              <CardBody>
                <Button color="danger" onPress={handleExit}>
                  {t("Exit")}
                </Button>
              </CardBody>
            </Card>
            
          </Tab>
        </Tabs>
      </Layout>
    </>
  );
}

export default Settings;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "settings"]);

// eslint-disable-next-line react-refresh/only-export-components
export {getStaticPaths};
