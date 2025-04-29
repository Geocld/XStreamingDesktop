import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Divider,
} from "@nextui-org/react";
import { useTranslation } from "next-i18next";
import { useTheme } from "next-themes";
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from "react";
import AuthModal from "../../components/AuthModal";
import Layout from "../../components/Layout";
import Loading from "../../components/Loading";
import Nav from "../../components/Nav";
import { useSettings } from "../../context/userContext";
import Ipc from "../../lib/ipc";

import Image from "next/image";
import { FOCUS_ELEMS } from '../../common/constans';

import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

function Home() {
  const { t, i18n: {language: locale} } = useTranslation('home');

  const router = useRouter();
  const { settings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [isLogined, setIsLogined] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [consoles, setConsoles] = useState<{
    id: string,
    name: string,
    locale: string,
    region: string,
    consoleType: "XboxSeriesX"|"XboxSeriesS"|"XboxOne"|"XboxOneS"|"XboxOneX",
    powerState: "ConnectedStandby"|"On"|"Off",
    digitalAssistantRemoteControlEnabled: boolean,
    remoteManagementEnabled: boolean,
    consoleStreamingEnabled: boolean,
    wirelessWarning: boolean,
    outOfHomeWarning: boolean,
    storageDevices: {
      storageDeviceId: string,
      storageDeviceName: string,
      isDefault: boolean,
      freeSpaceBytes: number,
      totalSpaceBytes: number,
      isGen9Compatible: any
    }[]
  }[]>([]);

  const authInterval = useRef(null);

  const currentIndex = useRef(0);
  const focusable = useRef<any>([]);

  useEffect(() => {
    const localTheme = localStorage.getItem('theme');
    if (localTheme === 'xbox-light') {
      setTheme(localTheme)
    }

    const localFontSize = localStorage.getItem('fontSize');
    if (localFontSize && localFontSize !== '16') {
      document.documentElement.style.fontSize = localFontSize + 'px';
    }
    
    setLoading(true);
    setLoadingText(t("Loading..."));

    focusable.current = document.querySelectorAll(FOCUS_ELEMS);

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

    const _isLogined = window.sessionStorage.getItem("isLogined") || "0";
    if (_isLogined === "1") {
      setIsLogined(true);
    }

    if (_isLogined === "1") {
      // Get Consoles
      setLoadingText(t("Fetching consoles..."));
      Ipc.send("consoles", "get").then((res) => {
        console.log("consoles:", res);
        setConsoles(res);
        setLoading(false);

        setTimeout(() => {
          focusable.current = document.querySelectorAll(FOCUS_ELEMS);
        },  1000);
      });
    } else {
      Ipc.send("app", "checkAuthentication").then((isLogin) => {
        if (isLogin) {
          // Silence login, refresh token
          console.log("Silence login, refresh token");
          authInterval.current = setInterval(() => {
            console.log("Requesting AuthState...");

            Ipc.send("app", "getAuthState").then((args) => {
              console.log("Received AuthState:", args);

              if (args.isAuthenticating === true) {
                setLoading(true);
              } else if (
                args.isAuthenticated === true &&
                args.user.signedIn === true
              ) {
                clearInterval(authInterval.current);
                window.sessionStorage.setItem("isLogined", "1");
                setIsLogined(true);

                // Get Consoles
                setLoadingText(t("Fetching consoles..."));
                Ipc.send("consoles", "get").then((res) => {
                  console.log("consoles:", res);
                  setConsoles(res);
                  setLoading(false);

                  setTimeout(() => {
                    focusable.current = document.querySelectorAll(FOCUS_ELEMS);
                  },  1000);

                });
              }
            });
          }, 500);
        } else {
          console.log("Full auth flow");
          setLoading(false);
          setShowLoginModal(true);
        }
      });
    }


    return () => {
      if (authInterval.current) clearInterval(authInterval.current);
      timer && clearInterval(timer);
    };
  }, [t, setTheme]);

  const handleLogin = () => {
    setLoading(true);
    setLoadingText(t("Loading..."));
    Ipc.send("app", "login").then(() => {
      setShowLoginModal(false);
      // Check login state
      authInterval.current = setInterval(() => {
        console.log("Requesting AuthState...");
        Ipc.send("app", "getAuthState").then((args) => {
          console.log("Received AuthState:", args);

          if (args.isAuthenticating === true) {
            setLoading(true);
          } else if (
            args.isAuthenticated === true &&
            args.user.signedIn === true
          ) {
            clearInterval(authInterval.current);
            setIsLogined(true);
            window.sessionStorage.setItem("isLogined", "1");
            setLoading(false);

            // Get Consoles
            setLoadingText(t("Fetching consoles..."));
            Ipc.send("consoles", "get").then((res) => {
              setConsoles(res);

              setTimeout(() => {
                focusable.current = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
              },  1000);
            });
          }
        });
      }, 500);
    });
  };

  const powerOnAndStartSession = (sessionId: string) => {
    setLoading(true);
    setLoadingText(t("Loading..."));
    Ipc.send("consoles", "powerOn", sessionId).then(res => {
      console.log('poweron result:', res);
      startSession(sessionId);
      setLoading(false);
    }).catch(() => {
      startSession(sessionId);
      setLoading(false);
    });
  };

  const startSession = (sessionId: string) => {
    console.log("sessionId:", sessionId);
    router.push({
      pathname: `/${locale}/stream`,
      query: { serverid: sessionId }
    });
  };

  return (
    <>
      <Nav current={t("Consoles")} isLogined={isLogined} />

      {loading && <Loading loadingText={loadingText} />}

      <AuthModal show={showLoginModal} onConfirm={handleLogin} />

      <Layout>
        <div className="gap-4 grid grid-cols-3">
          {consoles.map((console) => {
            let consoleName: string
            switch (console.consoleType) {
            case "XboxOne":
              consoleName = "Xbox One"
              break;
            case "XboxOneS":
              consoleName = "Xbox One S"
              break;
            case "XboxOneX":
              consoleName = "Xbox One X"
              break;
            case "XboxSeriesS":
              consoleName = "Xbox Series S"
              break;
            case "XboxSeriesX":
              consoleName = "Xbox Series X"
              break;
            default:
              consoleName = console.consoleType
              break;
            }
            let consoleImg = '/images/xss.svg'
            if (theme === 'xbox-light') {
              consoleImg = '/images/xss-light.svg'
            }

            if (console.consoleType === 'XboxSeriesX') {
              consoleImg = '/images/series-x.png'
            }
            return (
              <Card key={console.id}>
                <CardBody>
                  <p className="text-center">{console.name}</p>
                  <p className="text-center text-sm text-gray-400">{consoleName}</p>
                  <div className="flex justify-center items-center">
                    <Image
                      src={consoleImg}
                      alt="xss"
                      width={100}
                      height={100}
                    />
                  </div>
                  <div className="flex justify-center py-1">
                    {console.powerState === "On" ? (
                      <Chip size="sm" radius="none" color="success">
                        {t("Powered on")}
                      </Chip>
                    ) : console.powerState === "ConnectedStandby" ? (
                      <Chip size="sm" radius="none" color="warning">
                        {t("Standby")}
                      </Chip>
                    ) : (
                      <Chip size="sm" radius="none">{console.powerState}</Chip>
                    )}
                  </div>
                </CardBody>
                <Divider />
                <CardFooter>
                  {
                    settings.power_on && console.powerState === 'ConnectedStandby' ? (
                      <Button
                        color="primary"
                        fullWidth
                        onClick={() => powerOnAndStartSession(console.id)}
                      >
                        {t('Power on and start stream')}
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        fullWidth
                        onClick={() => startSession(console.id)}
                      >
                        {t('Start stream')}
                      </Button>
                    )
                  }

                </CardFooter>
              </Card>
            );
          })}
        </div>
      </Layout>
    </>
  );
}

export default Home;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "home"]);

// eslint-disable-next-line react-refresh/only-export-components
export { getStaticPaths };
