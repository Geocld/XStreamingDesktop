import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Divider,
} from "@heroui/react";
import { useTranslation } from "next-i18next";
import { useTheme } from "next-themes";
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from "react";
import AuthModal from "../../components/AuthModal";
import MsalModal from "../../components/MsalModal";
import Layout from "../../components/Layout";
import Loading from "../../components/Loading";
import Nav from "../../components/Nav";
import { useSettings } from "../../context/userContext";
import Ipc from "../../lib/ipc";

import Image from "next/image";

import getServer from '../../lib/get-server';
import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

const LOCAL_CONSOLES = 'local-consoles';
const CONSOLE_ICON_SIZE = 130;

const xboxOneSIcon = `
<svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="xboxOneSBody" x1="64" y1="161" x2="448" y2="161" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F5F7F7"/>
      <stop offset="0.55" stop-color="#F0F2F2"/>
      <stop offset="1" stop-color="#DDE1E1"/>
    </linearGradient>
    <linearGradient id="xboxOneSBase" x1="72" y1="290" x2="436" y2="290" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#232828"/>
      <stop offset="1" stop-color="#161A1B"/>
    </linearGradient>
  </defs>

  <g transform="matrix(1.12 0 0 0.62 -20 125)">
  <rect x="64" y="132" width="384" height="150" rx="2" fill="url(#xboxOneSBody)"/>
  <rect x="72" y="282" width="364" height="46" fill="url(#xboxOneSBase)"/>
  <path d="M64 202H255V214H64V202Z" fill="#111516"/>
  <rect x="100" y="205" width="150" height="8" fill="#0A0D0E"/>
  <rect x="109" y="206.5" width="58" height="5" fill="#1F2425"/>
  <rect x="170" y="206.5" width="76" height="5" fill="#080A0B"/>

  <g opacity="0.55">
    <circle cx="262" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="274" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="286" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="298" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="310" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="322" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="334" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="346" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="358" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="370" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="382" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="394" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="406" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="418" cy="135" r="1.2" fill="#A4AAAA"/>
    <circle cx="430" cy="135" r="1.2" fill="#A4AAAA"/>

    <circle cx="262" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="274" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="286" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="298" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="310" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="322" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="334" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="346" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="358" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="370" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="382" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="394" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="406" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="418" cy="147" r="1.2" fill="#A4AAAA"/>
    <circle cx="430" cy="147" r="1.2" fill="#A4AAAA"/>

    <circle cx="262" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="274" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="286" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="298" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="310" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="322" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="334" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="346" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="358" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="370" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="382" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="394" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="406" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="418" cy="159" r="1.2" fill="#A4AAAA"/>
    <circle cx="430" cy="159" r="1.2" fill="#A4AAAA"/>

    <circle cx="262" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="274" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="286" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="298" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="310" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="322" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="334" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="346" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="358" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="370" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="382" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="394" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="406" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="418" cy="171" r="1.2" fill="#A4AAAA"/>
    <circle cx="430" cy="171" r="1.2" fill="#A4AAAA"/>

    <circle cx="262" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="274" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="286" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="298" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="310" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="322" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="334" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="346" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="358" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="370" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="382" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="394" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="406" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="418" cy="183" r="1.2" fill="#A4AAAA"/>
    <circle cx="430" cy="183" r="1.2" fill="#A4AAAA"/>
  </g>

  <g transform="translate(371 174) scale(0.8929 1.6129) translate(-371 -174)">
    <circle cx="371" cy="174" r="13" fill="#373D40"/>
    <path d="M362 164C367 166 370 170 371 175C372 170 375 166 380 164" stroke="#F6F6F6" stroke-width="3" stroke-linecap="round"/>
    <path d="M362 184C367 182 370 178 371 173C372 178 375 182 380 184" stroke="#F6F6F6" stroke-width="3" stroke-linecap="round"/>
  </g>

  <rect x="98" y="295" width="24" height="16" rx="1" fill="#050606" stroke="#575D5F" stroke-width="1.5"/>
  <rect x="102" y="299" width="16" height="8" fill="none" stroke="#2D3335" stroke-width="1"/>
  <circle cx="351" cy="300" r="6" stroke="#0A0C0D" stroke-width="2"/>
  <rect x="371" y="291" width="30" height="20" rx="9" fill="#0E1112"/>
  <path d="M72 282H436" stroke="#303536" stroke-width="2"/>
  </g>
</svg>`;

const xboxOneXIcon = `
<svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="xboxOneXTop" x1="84" y1="168" x2="428" y2="168" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#303030"/>
      <stop offset="0.55" stop-color="#252525"/>
      <stop offset="1" stop-color="#171717"/>
    </linearGradient>
    <linearGradient id="xboxOneXBase" x1="92" y1="276" x2="416" y2="276" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#151515"/>
      <stop offset="1" stop-color="#0B0B0B"/>
    </linearGradient>
  </defs>

  <g transform="matrix(1.25 0 0 0.65 -62 120)">
  <rect x="84" y="136" width="344" height="118" rx="2" fill="url(#xboxOneXTop)"/>
  <rect x="92" y="254" width="324" height="58" fill="url(#xboxOneXBase)"/>
  <path d="M84 253H428" stroke="#070707" stroke-width="5"/>
  <path d="M96 235H240" stroke="#060606" stroke-width="6" stroke-linecap="round"/>
  <path d="M84 136H428" stroke="#DADADA" stroke-width="2" opacity="0.8"/>
  <path d="M84 254H428" stroke="#2A2A2A" stroke-width="2"/>

  <g transform="translate(386 177) scale(0.8 1.5385) translate(-386 -177)">
    <circle cx="386" cy="177" r="12" fill="#F1F1F1"/>
    <path d="M378 168C382 170 385 174 386 178C387 174 390 170 394 168" stroke="#303030" stroke-width="3" stroke-linecap="round"/>
    <path d="M378 186C382 184 385 180 386 176C387 180 390 184 394 186" stroke="#303030" stroke-width="3" stroke-linecap="round"/>
  </g>

  <circle cx="122" cy="279" r="5" stroke="#2E2E2E" stroke-width="2"/>
  <rect x="136" y="271" width="24" height="16" rx="7" fill="#242424"/>
  <circle cx="346" cy="277" r="3" fill="#1E1E1E"/>
  <path d="M354 277H366" stroke="#171717" stroke-width="3" stroke-linecap="round"/>
  <rect x="381" y="269" width="26" height="14" fill="#050505" stroke="#242424" stroke-width="1.5"/>
  <rect x="385" y="272" width="18" height="8" fill="#111111" stroke="#383838" stroke-width="1"/>
  </g>
</svg>`;

const xboxOneIcons: Partial<Record<"XboxSeriesX" | "XboxSeriesS" | "XboxOne" | "XboxOneS" | "XboxOneX", string>> = {
  XboxOneS: xboxOneSIcon,
  XboxOneX: xboxOneXIcon,
};

function Home() {
  const { t, i18n: { language: locale } } = useTranslation('home');

  const router = useRouter();
  const { settings, setSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [isLogined, setIsLogined] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMsalModal, setShowMsalModal] = useState(false);
  const [msalData, setMsalData] = useState<any>(null);
  const [server, setServer]= useState<any>(null);
  const [consoles, setConsoles] = useState<{
    serverId: string,
    name: string,
    locale: string,
    region: string,
    consoleType: "XboxSeriesX" | "XboxSeriesS" | "XboxOne" | "XboxOneS" | "XboxOneX",
    powerState: "ConnectedStandby" | "On" | "Off",
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
  const autoConnectTriggered = useRef(false);

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

    getServer().then((res: any) => {
      if (res && res.url) {
        console.log('getServer res:', res)
        setServer(res)
      }
    })

    const _isLogined = window.sessionStorage.getItem("isLogined") || "0";
    if (_isLogined === "1") {
      setIsLogined(true);
    }

    if (_isLogined === "1") {
      // Get Consoles
      let _consoles: any = localStorage.getItem(LOCAL_CONSOLES) || '[]'

      try {
        _consoles = JSON.parse(_consoles)
      } catch {
        _consoles = []
      }

      if (_consoles.length) {
        setConsoles(_consoles);
        setLoading(false);

        Ipc.send("consoles", "get").then(res => {
          setConsoles(res);
          localStorage.setItem(LOCAL_CONSOLES, JSON.stringify(res));
        });
      } else {
        setLoadingText(t("Fetching consoles..."));
        Ipc.send("consoles", "get").then(res => {
          setConsoles(res);
          setLoading(false);
        });
      }
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
                let _consoles: any = localStorage.getItem(LOCAL_CONSOLES) || '[]'

                try {
                  _consoles = JSON.parse(_consoles)
                } catch {
                  _consoles = []
                }

                if (_consoles.length) {
                  setConsoles(_consoles);
                  setLoading(false);

                  // Silent update
                  Ipc.send("consoles", "get").then(res => {
                    setConsoles(res);

                    localStorage.setItem(LOCAL_CONSOLES, JSON.stringify(res));

                  });
                } else {
                  setLoadingText(t("Fetching consoles..."));
                  Ipc.send("consoles", "get").then(res => {
                    setConsoles(res);
                    setLoading(false);

                    localStorage.setItem(LOCAL_CONSOLES, JSON.stringify(res));
                  });
                }

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
    };
  }, [t, setTheme]);

  useEffect(() => {
    if (!isLogined || consoles.length === 0 || autoConnectTriggered.current) {
      return;
    }

    autoConnectTriggered.current = true;

    Ipc.send("app", "getStartupFlags").then((flags: any) => {
      if ((flags && flags.autoConnect)) {
        console.log("Auto-connect flag detected:", flags.autoConnect);
        const console_ = consoles.find(c => c.name === flags.autoConnect || c.serverId === flags.autoConnect);

        if (console_) {
          console.log("Found matching console, starting auto connect:", flags.autoConnect);
          setTimeout(() => {
            if (console_.powerState === "On") {
              startSession(console_.serverId);
            } else {
              powerOnAndStartSession(console_.serverId);
            }
            Ipc.send("app", "resetAutoConnect");
          }, 500);
        } else {
          console.log("No matching console found for auto connect:", flags.autoConnect);
          Ipc.send("app", "resetAutoConnect");
        }
      }
    });
  }, [isLogined, consoles]);

  const handleLogin = () => {
    setLoading(true);
    setLoadingText(t("Loading..."));
    setShowLoginModal(false);
    if (settings.use_msal) {
      Ipc.send("app", "msalLogin").then(data => {
        setMsalData(data);
        setLoading(false);
        setShowMsalModal(true);
      });
    } else {
      Ipc.send("app", "login").then(() => {
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
              let _consoles: any = localStorage.getItem(LOCAL_CONSOLES) || '[]'

              try {
                _consoles = JSON.parse(_consoles)
              } catch {
                _consoles = []
              }

              if (_consoles.length) {
                setConsoles(_consoles);
                
                // Silent update
                Ipc.send("consoles", "get").then(res => {
                  console.log("consoles:", res);
                  setConsoles(res);

                  localStorage.setItem(LOCAL_CONSOLES, JSON.stringify(res));

                });
              } else {
                setLoading(true);
                setLoadingText(t("Fetching consoles..."));
                Ipc.send("consoles", "get").then(res => {
                  console.log("consoles:", res);
                  setConsoles(res);
                  setLoading(false);

                  localStorage.setItem(LOCAL_CONSOLES, JSON.stringify(res));
                });
              }
              
            }
          });
        }, 500);
      });
    }
  };

  const handleMsalComplete = () => {
    setShowMsalModal(false);
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
          let _consoles: any = localStorage.getItem(LOCAL_CONSOLES) || '[]'

          try {
            _consoles = JSON.parse(_consoles)
          } catch {
            _consoles = []
          }

          if (_consoles.length) {
            setConsoles(_consoles);
            
            // Silent update
            Ipc.send("consoles", "get").then(res => {
              console.log("consoles:", res);
              setConsoles(res);

              localStorage.setItem(LOCAL_CONSOLES, JSON.stringify(res));

            });
          } else {
            setLoading(true);
            setLoadingText(t("Fetching consoles..."));
            Ipc.send("consoles", "get").then(res => {
              console.log("consoles:", res);
              setConsoles(res);
              setLoading(false);

              localStorage.setItem(LOCAL_CONSOLES, JSON.stringify(res));
            });
          }
          
        }
      });
    }, 500);
  };

  const toggleAutoConnect = (serverId: string) => {
    if (settings.xhome_auto_connect_server_id === serverId) {
      setSettings({
        ...settings,
        xhome_auto_connect_server_id: ''
      });
    } else {
      setSettings({
        ...settings,
        xhome_auto_connect_server_id: serverId
      });
    }
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
    const query: any = { serverid: sessionId };

    const { server_url, server_username, server_credential } = settings;

    // Custom server
    if (server_url && server_username && server_credential) {
      query.server_url = server_url;
      query.server_username = server_username;
      query.server_credential = server_credential;
    } else if (server) { // Default server
      const { url, username, credential } = server;
      query.server_url = url;
      query.server_username = username;
      query.server_credential = credential;
    }

    router.push({
      pathname: `/${locale}/stream`,
      query
    });
  };

  const handleRefreshMsalData = () => {
    Ipc.send("app", "restart");
  }

  const handleSettings = () => {
    router.push(`/${locale}/settings`);
  }

  return (
    <>
      <Nav current={t("Consoles")} isLogined={isLogined} />

      {loading && <Loading loadingText={loadingText} />}

      <AuthModal show={showLoginModal} onSettings={handleSettings} onConfirm={handleLogin} />
      {msalData && (
        <MsalModal
          verificationUri={msalData.verification_uri}
          userCode={msalData.user_code}
          expiresIn={msalData.expires_in}
          show={showMsalModal}
          onConfirm={handleMsalComplete}
          onRefresh={handleRefreshMsalData}
        />
      )}

      <Layout>
        <div className="gap-4 grid grid-cols-3">
          {consoles.map((console) => {
            let consoleName: string;
            switch (console.consoleType) {
              case "XboxOne":
                consoleName = "Xbox One";
                break;
              case "XboxOneS":
                consoleName = "Xbox One S";
                break;
              case "XboxOneX":
                consoleName = "Xbox One X";
                break;
              case "XboxSeriesS":
                consoleName = "Xbox Series S";
                break;
              case "XboxSeriesX":
                consoleName = "Xbox Series X";
                break;
              default:
                consoleName = console.consoleType;
                break;
            }
            let consoleImg = "/images/xss.svg";
            if (theme === "xbox-light") {
              consoleImg = "/images/xss-light.svg";
            }

            const consoleSvg = xboxOneIcons[console.consoleType];
            if (console.consoleType === "XboxSeriesX") {
              consoleImg = "/images/series-x.png";
            } else if (console.consoleType === "XboxSeriesS") {
              consoleImg = "/images/series-s.png";
            }
            
            const isAutoConnectEnabled = settings.xhome_auto_connect_server_id === console.serverId;
            
            return (
              <Card key={console.serverId}>
                <CardBody>
                  <p className="text-center">{console.name}</p>
                  <p className="text-center text-sm text-gray-400">
                    {consoleName}
                  </p>
                  <p className="text-center text-xs text-gray-500">
                    ({console.serverId})
                  </p>
                  <div className="flex justify-center items-center">
                    {consoleSvg ? (
                      <div
                        className="flex items-center justify-center"
                        style={{ width: CONSOLE_ICON_SIZE, height: CONSOLE_ICON_SIZE }}
                        dangerouslySetInnerHTML={{ __html: consoleSvg }}
                      />
                    ) : (
                      <Image
                        src={consoleImg}
                        alt="xss"
                        draggable="false"
                        width={CONSOLE_ICON_SIZE}
                        height={CONSOLE_ICON_SIZE}
                      />
                    )}
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
                      <Chip size="sm" radius="none">
                        {console.powerState}
                      </Chip>
                    )}
                  </div>
                </CardBody>
                <Divider />
                <CardFooter>
                  <div className="flex flex-col gap-2 w-full">
                    {
                      settings.power_on && console.powerState === 'ConnectedStandby' ? (
                        <Button
                          color="primary"
                          size="sm"
                          fullWidth
                          onPress={() => powerOnAndStartSession(console.serverId)}
                        >
                          {t('Power on and start stream')}
                        </Button>
                      ) : (
                        <Button
                          color="primary"
                          size="sm"
                          fullWidth
                          onPress={() => startSession(console.serverId)}
                        >
                          {t('Start stream')}
                        </Button>
                      )
                    }
                    
                    <Button
                      color={isAutoConnectEnabled ? "secondary" : "default"}
                      size="sm"
                      fullWidth
                      onPress={() => toggleAutoConnect(console.serverId)}
                    >
                      {isAutoConnectEnabled ? t('auto_connect_enabled') : t('enable_auto_connect')}
                    </Button>
                  </div>
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
