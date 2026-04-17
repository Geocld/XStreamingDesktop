import moment from "moment";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import xStreamingPlayer from "xstreaming-player";
import {
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import ActionBar from "../../components/ActionBar";
import Display from "../../components/Display";
import FSRDisplay from "../../components/FSRDisplay";
import Audio from "../../components/Audio";
import FailedModal from "../../components/FailedModal";
import Loading from "../../components/Loading";
import Perform from "../../components/Perform";
import WarningModal from "../../components/WarningModal";
import TextModal from "../../components/TextModal";
import { useSettings } from "../../context/userContext";
import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";
import Ipc from "../../lib/ipc";
import { DISPLAY_KEY, FSR_DISPLAY_KEY } from "../../common/constans";

const XCLOUD_PREFIX = "xcloud_";
const SYSTEM_UI_TARGET_SHOW_MESSAGE_DIALOG =
  "/streaming/systemUi/messages/ShowMessageDialog";
const SYSTEM_UI_TARGET_SHOW_VIRTUAL_KEYBOARD =
  "/streaming/systemUi/messages/ShowVirtualKeyboard";
const STREAMING_TOUCHCONTROLS_SCOPE = "/streaming/touchcontrols";

const DEFAULT_OPTIONS = {
  sharpness: 5,
  saturation: 100,
  contrast: 100,
  brightness: 100,
};

const FSR_DEFAULT_OPTIONS = {
  sharpness: 2,
};

function format(source: string, ...args: string[]): string {
  let n = 0
  return source.replace(/%(s)/, function() {
    return args[n++]
  })
}

function Stream() {
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation("cloud");

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [xPlayer, setxPlayer] = useState<xStreamingPlayer>(undefined);
  const [connectState, setConnectState] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showPerformance, setShowPerformance] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);
  const [showFSRDisplay, setShowFSRDisplay] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showSystemMessageModal, setShowSystemMessageModal] = useState(false);
  const [systemMessageTitle, setSystemMessageTitle] = useState("");
  const [systemMessageContent, setSystemMessageContent] = useState("");
  const [systemMessageButtons, setSystemMessageButtons] = useState<
    Array<{ label: string; index: number }>
  >([]);
  const [showSystemKeyboardModal, setShowSystemKeyboardModal] = useState(false);
  const [systemKeyboardTitle, setSystemKeyboardTitle] = useState("");
  const [systemKeyboardDescription, setSystemKeyboardDescription] = useState("");
  const [systemKeyboardText, setSystemKeyboardText] = useState("");
  const [systemKeyboardMaxLength, setSystemKeyboardMaxLength] = useState<
    number | undefined
  >(undefined);
  const [systemKeyboardInputScope, setSystemKeyboardInputScope] = useState(0);
  const [showActionbar, setShowActionbar] = useState(false);
  const [volume, setVolume] = useState(1);
  const [openMicro, setOpenMicro] = useState(false);
  const [streamingType, setStreamingType] = useState('');
  const [consoleId, setConsoleId] = useState('');
  const connectStateRef = useRef("");
  const keepaliveInterval = useRef(null);
  const streamStateInterval = useRef(null);
  const systemMessageTransactionRef = useRef<any>(null);
  const systemMessageActionRef = useRef<{
    defaultIndex?: number;
    cancelIndex?: number;
  }>({});
  const systemKeyboardTransactionRef = useRef<any>(null);

  const closeSystemMessageModal = () => {
    setShowSystemMessageModal(false);
    setSystemMessageTitle("");
    setSystemMessageContent("");
    setSystemMessageButtons([]);
    systemMessageTransactionRef.current = null;
    systemMessageActionRef.current = {};
  };

  const completeSystemMessage = (result?: number) => {
    const transaction = systemMessageTransactionRef.current;
    if (
      transaction &&
      transaction.isTransaction &&
      transaction.completion &&
      typeof transaction.completion.complete === "function"
    ) {
      transaction.completion.complete(
        JSON.stringify({
          Result: result,
        })
      );
    }
    closeSystemMessageModal();
  };

  const cancelSystemMessage = () => {
    const transaction = systemMessageTransactionRef.current;
    const { cancelIndex, defaultIndex } = systemMessageActionRef.current || {};
    const fallbackIndex =
      typeof cancelIndex === "number"
        ? cancelIndex
        : typeof defaultIndex === "number"
        ? defaultIndex
        : undefined;

    if (typeof fallbackIndex === "number") {
      completeSystemMessage(fallbackIndex);
      return;
    }

    if (
      transaction &&
      transaction.isTransaction &&
      transaction.completion &&
      typeof transaction.completion.cancel === "function"
    ) {
      transaction.completion.cancel();
    }
    closeSystemMessageModal();
  };

  const closeSystemKeyboardModal = useCallback(() => {
    if (xPlayer) {
      xPlayer.setKeyboardInput(true);
    }
    setShowSystemKeyboardModal(false);
    setSystemKeyboardTitle("");
    setSystemKeyboardDescription("");
    setSystemKeyboardText("");
    setSystemKeyboardMaxLength(undefined);
    setSystemKeyboardInputScope(0);
    systemKeyboardTransactionRef.current = null;
  }, [xPlayer]);

  const completeSystemKeyboard = () => {
    const transaction = systemKeyboardTransactionRef.current;
    if (
      transaction &&
      transaction.isTransaction &&
      transaction.completion &&
      typeof transaction.completion.complete === "function"
    ) {
      transaction.completion.complete(
        JSON.stringify({
          Text: systemKeyboardText,
        })
      );
    }
    closeSystemKeyboardModal();
  };

  const cancelSystemKeyboard = () => {
    const transaction = systemKeyboardTransactionRef.current;
    if (
      transaction &&
      transaction.isTransaction &&
      transaction.completion &&
      typeof transaction.completion.cancel === "function"
    ) {
      transaction.completion.cancel();
    }
    closeSystemKeyboardModal();
  };

  const resolveSystemKeyboardProps = () => {
    let type:
      | "text"
      | "url"
      | "email"
      | "password"
      | "tel"
      | "search" = "text";
    let inputMode:
      | "text"
      | "url"
      | "email"
      | "numeric"
      | "tel"
      | "search" = "text";

    switch (systemKeyboardInputScope) {
      case 1:
        type = "url";
        inputMode = "url";
        break;
      case 5:
        type = "email";
        inputMode = "email";
        break;
      case 29:
        type = "text";
        inputMode = "numeric";
        break;
      case 31:
        type = "password";
        inputMode = "text";
        break;
      case 32:
        type = "tel";
        inputMode = "tel";
        break;
      case 50:
        type = "search";
        inputMode = "search";
        break;
      default:
        type = "text";
        inputMode = "text";
        break;
    }

    return {
      type,
      inputMode,
    };
  };

  const handleSystemUiEvent = useCallback((event) => {
    if (!event || !event.target) {
      return false;
    }

    if (event.target === SYSTEM_UI_TARGET_SHOW_MESSAGE_DIALOG) {
      const payload = event.payload || {};
      const toValidIndex = (value: any) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === "string" && value.trim() !== "") {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
        return undefined;
      };

      const parsedButtons: Array<{ label: string; index: number }> = [];
      const pushButton = (label: any, index: number) => {
        if (typeof label !== "string") {
          return;
        }
        const nextLabel = label.trim();
        if (!nextLabel) {
          return;
        }
        parsedButtons.push({
          label: nextLabel,
          index,
        });
      };

      // Align with Android mapping first.
      pushButton(payload.CommandLabel1, 0);
      pushButton(payload.CommandLabel2, 1);
      pushButton(payload.CommandLabel3, 2);
      pushButton(payload.CommandLabel4, 3);

      // Compatibility fallback for other payload shapes.
      if (!parsedButtons.length && Array.isArray(payload.Commands)) {
        payload.Commands.forEach((command: any, idx: number) => {
          if (typeof command === "string") {
            pushButton(command, idx);
            return;
          }
          const label =
            command?.Label ?? command?.label ?? command?.Text ?? command?.text;
          const commandIndex =
            toValidIndex(command?.Result) ??
            toValidIndex(command?.result) ??
            toValidIndex(command?.Index) ??
            toValidIndex(command?.index) ??
            idx;
          pushButton(label, commandIndex);
        });
      }

      setSystemMessageTitle(payload.TitleText || "");
      setSystemMessageContent(payload.ContentText || "");
      setSystemMessageButtons(parsedButtons);
      systemMessageActionRef.current = {
        defaultIndex: toValidIndex(payload.DefaultIndex),
        cancelIndex: toValidIndex(payload.CancelIndex),
      };
      systemMessageTransactionRef.current = {
        id: event.id,
        isTransaction: event.isTransaction,
        completion: event.completion,
      };
      setShowSystemMessageModal(true);
      return true;
    }

    if (event.target === SYSTEM_UI_TARGET_SHOW_VIRTUAL_KEYBOARD) {
      const payload = event.payload || {};
      if (xPlayer) {
        xPlayer.setKeyboardInput(false);
      }
      setSystemKeyboardTitle(payload.TitleText || "");
      setSystemKeyboardDescription(payload.DescriptionText || "");
      setSystemKeyboardText(payload.DefaultText || "");
      setSystemKeyboardInputScope(payload.InputScope ?? 0);
      setSystemKeyboardMaxLength(
        typeof payload.MaxLength === "number" && payload.MaxLength > 0
          ? payload.MaxLength
          : undefined
      );
      systemKeyboardTransactionRef.current = {
        id: event.id,
        isTransaction: event.isTransaction,
        completion: event.completion,
      };
      if (
        event.isTransaction &&
        event.completion &&
        typeof event.completion.setOnRemoteCancellation === "function"
      ) {
        const transactionId = event.id;
        event.completion.setOnRemoteCancellation(() => {
          if (systemKeyboardTransactionRef.current?.id === transactionId) {
            closeSystemKeyboardModal();
          }
        });
      }
      setShowSystemKeyboardModal(true);
      return true;
    }

    return false;
  }, [closeSystemKeyboardModal, xPlayer]);

  const handleStreamingMessage = useCallback((event) => {
    if (!event || typeof event.target !== "string") {
      return false;
    }

    if (!event.target.startsWith(STREAMING_TOUCHCONTROLS_SCOPE)) {
      return false;
    }

    if (
      event.isTransaction &&
      event.completion &&
      typeof event.completion.cancel === "function"
    ) {
      event.completion.cancel();
    }

    return true;
  }, []);

  useEffect(() => {
    let streamType = "home";
    let serverId = router.query.serverid as string;

    const localFontSize = localStorage.getItem('fontSize');
    if (localFontSize && localFontSize !== '16') {
      document.documentElement.style.fontSize = localFontSize + 'px';
    }

    if (serverId.startsWith(XCLOUD_PREFIX)) {
      streamType = "cloud";
      serverId = serverId.split("_")[1];
    }

    setConsoleId(serverId)

    setStreamingType(streamType)

    let lastMovement = 0;
    const mouseEvent = () => {
      lastMovement = Date.now();
    };
    window.addEventListener("mousemove", mouseEvent);
    window.addEventListener("mousedown", mouseEvent);

    window.addEventListener("touchstart", mouseEvent);
    window.addEventListener("touchmove", mouseEvent);

    const escEvent = (event) => {
      if (event.key === 'Escape') {
        Ipc.send('app', 'exitFullscreen')
      }
    }
    window.addEventListener('keydown', escEvent)

    const mouseInterval = setInterval(() => {
      if (Date.now() - lastMovement >= 2000) {
        setShowActionbar(false)
      } else {
        setShowActionbar(true)
      }
    }, 100);

    if (xPlayer !== undefined) {
      const server_url: any = router.query.server_url;
      const server_username: any = router.query.server_username;
      const server_credential: any = router.query.server_credential;
      if (server_url && server_username && server_credential) {
        // Init with TURN server
        xPlayer.bind({
          turnServer: {
            url: server_url,
            username: server_username,
            credential: server_credential
          }
        });
      } else {
        xPlayer.bind();
      }

      console.log("streamType:", streamType);
      console.log("serverId:", serverId);
      console.log("settings:", settings);
      console.log("sessionId:", sessionId);

      xPlayer.setVideoFormat(settings.video_format || "");

      // Set video codec profiles
      // xPlayer.setCodecPreferences('video/H264', { profiles: ['4d'] }) // 4d = high, 42e = mid, 420 = low
      if (settings.codec) {
        if (settings.codec.indexOf("H264") > -1) {
          const codecArr = settings.codec.split("-");
          xPlayer.setCodecPreferences(codecArr[0], {
            profiles: codecArr[1] ? [codecArr[1]] : [],
          });
        } else {
          xPlayer.setCodecPreferences(settings.codec, { profiles: [] });
        }
      }

      // Set gamepad kernal
      xPlayer.setGamepadKernal("Web");

      // Set gamepad mix
      xPlayer.setGamepadMix(settings.gamepad_mix)

      // Set gamepad index
      xPlayer.setGamepadIndex(settings.gamepad_index);

      // Set vibration
      xPlayer.setVibration(settings.vibration);
      xPlayer.setVibrationMode("Webview");

      // Set deadzone
      xPlayer.setGamepadDeadZone(settings.dead_zone);

      // Set fsr sharpness
      const _fsrDisplayOptions = window.localStorage.getItem(FSR_DISPLAY_KEY);
      let fsrDisplayOptions = FSR_DEFAULT_OPTIONS

      if (_fsrDisplayOptions) {
        try {
          fsrDisplayOptions = JSON.parse(_fsrDisplayOptions);
        } catch {
          fsrDisplayOptions = DEFAULT_OPTIONS;
        }
      }
      xPlayer.setFsrSharpness(fsrDisplayOptions.sharpness);

      // Set gamepad maping
      if (settings.gamepad_maping) {
        xPlayer.setGamepadMaping(settings.gamepad_maping)
      }

      if (settings.force_trigger_rumble) {
        xPlayer.setForceTriggerRumble(settings.force_trigger_rumble)
      }

      // Set bitrate
      if (streamType === "cloud") {
        if (
          settings.xcloud_bitrate_mode === "Custom" &&
          settings.xcloud_bitrate !== 0
        ) {
          console.log(
            "setVideoBitrate xcloud:",
            settings.xcloud_bitrate + "Mb/s"
          );
          xPlayer.setVideoBitrate(settings.xcloud_bitrate);
        }
      } else {
        if (
          settings.xhome_bitrate_mode === "Custom" &&
          settings.xhome_bitrate !== 0
        ) {
          console.log(
            "setVideoBitrate xhome:",
            settings.xhome_bitrate + "Mb/s"
          );
          xPlayer.setVideoBitrate(settings.xhome_bitrate);
        }
      }

      // Set audio bitrate
      if (
        settings.audio_bitrate_mode === "Custom" &&
        settings.audio_bitrate !== 0
      ) {
        console.log(
          "setAudioBitrate:",
          settings.audio_bitrate + "Mb/s"
        );
        xPlayer.setAudioBitrate(settings.audio_bitrate);
      }

      // Set audio control
      if (settings.enable_audio_control) {
        xPlayer.setAudioControl(true)
      }

      // Set audio rumble
      if (settings.enable_audio_rumble) {
        xPlayer.setAudioRumble(settings.enable_audio_rumble, settings.audio_rumble_threshold)
      }

      // Set polling rate
      if (settings.polling_rate) {
        xPlayer.setPollRate(settings.polling_rate)
      }

      // Set co-op mode
      if (settings.coop) {
        xPlayer.setCoOpMode(true)
      }

      xPlayer.setConnectFailHandler(() => {
        // Not connected
        setShowWarning(false);
        setShowFailed(true);
        setLoading(false);
      });

      xPlayer.setSdpHandler((client, offer) => {
        Ipc.send("streaming", "sendChatSdp", {
          sessionId: sessionId,
          sdp: offer.sdp,
        })
          .then((sdpResponse) => {
            xPlayer.setRemoteOffer(sdpResponse.sdp);
          })
          .catch((error) => {
            console.log("ChatSDP Exchange error:", error);
            alert("ChatSDP Exchange error:" + JSON.stringify(error));
          });
      });
      xPlayer.setSystemUiHandler(handleSystemUiEvent);
      xPlayer.setMessageHandler(handleStreamingMessage);

      xPlayer.createOffer().then((offer: any) => {
        console.log("offer:", offer);
        setLoadingText(t("Configuration obtained successfully, initiating offer..."));
        Ipc.send("streaming", "sendSdp", {
          sessionId: sessionId,
          sdp: offer.sdp,
        })
          .then((sdpResult: any) => {
            setLoadingText(t("Remote offer retrieved successfully..."));
            console.log("sdpResult:", sdpResult);
            xPlayer.setRemoteOffer(sdpResult.sdp);

            // Gather candidates
            const iceCandidates = xPlayer.getIceCandidates();
            const candidates = [];
            for (const candidate in iceCandidates) {
              candidates.push({
                candidate: iceCandidates[candidate].candidate,
                sdpMLineIndex: iceCandidates[candidate].sdpMLineIndex,
                sdpMid: iceCandidates[candidate].sdpMid,
              });
            }

            setLoadingText(t("Ready to send ICE..."));
            Ipc.send("streaming", "sendIce", {
              sessionId: sessionId,
              ice: candidates,
            })
              .then((iceResult: any) => {
                setLoadingText(t("Exchange ICE successfully..."));
                console.log("iceResult:", iceResult);

                xPlayer.setIceCandidates(iceResult);

                // All done. Waiting for the event 'connectionstate' to be triggered
              })
              .catch((error) => {
                console.log("ICE Exchange error:", error);
                // alert("ICE Exchange error:" + JSON.stringify(error));
              });
          })
          .catch((error) => {
            console.log("SDP Exchange error:", error);
            alert("SDP Exchange error:" + JSON.stringify(error));
          });
      });

      xPlayer.getEventBus().on("connectionstate", (event) => {
        console.log("connectionstate changed:", event);

        // Toggle microphone
        if (connectStateRef.current === "connected" && (event.state === "new" || event.state === "connecting")) {
          return;
        }

        setConnectState(event.state);
        connectStateRef.current = event.state;

        if (event.state === "connected") {
          setLoadingText(t("Connected"));

          if (settings.fsr) {
            setTimeout(() => {
              xPlayer && xPlayer.startFSR(() => {
                addToast({
                    title: t('FSR started'),
                    color: 'success'
                  });
              });

              const videoHolder = document.getElementById('videoHolder');
              const canvasContainer = document.getElementById('canvas-container');
              videoHolder.style.visibility = 'hidden';
              canvasContainer.style.visibility = 'visible';
            }, 3000)
          }

          setTimeout(() => {
            setLoading(false);

            if (settings.video_format && settings.video_format.indexOf(':') > -1) {
              resizePlayer(settings.video_format)
            }

            // Start keepalive loop
            if (!keepaliveInterval.current) {
              keepaliveInterval.current = setInterval(() => {
                console.log("sendKeepalive sessionId:", sessionId);
                Ipc.send("streaming", "sendKeepalive", {
                  sessionId,
                })
                  .then((result) => {
                    console.log("StartStream keepalive:", result);
                  })
                  .catch((error) => {
                    console.error(
                      "Failed to send keepalive. Error details:\n" +
                        JSON.stringify(error)
                    );
                  });
              }, 30 * 1000);
            }

            // Refresh video player
            if (!settings.fsr) {
              setTimeout(() => {
                const _displayOptions = window.localStorage.getItem(DISPLAY_KEY);

                let displayOptions: any = DEFAULT_OPTIONS;
                if (_displayOptions) {
                  try {
                    displayOptions = JSON.parse(_displayOptions);
                  } catch {
                    displayOptions = DEFAULT_OPTIONS;
                  }
                }

                const videoStyle = document.getElementById("video-css");
                console.log('Refresh video player:', displayOptions)
                const filters = getVideoPlayerFilterStyle(displayOptions);
                let videoCss = "";
                if (filters) {
                  videoCss += `filter: ${filters} !important;`;
                }
                let css = "";
                if (videoCss) {
                  css = `#videoHolder video { ${videoCss} }`;
                }

                videoStyle!.textContent = css;
              }, 1000);
            }

            // const xboxTitleId = window._xboxTitleId || ''
            // // inputConfigs
            // Ipc.send("streaming", "inputConfigs", {
            //   xboxTitleId,
            // })
          }, 500);
        } else if (event.state === "closed") {
          console.log(":: We are disconnected!");
        }
      });
    } else if (sessionId === "") {
      setLoadingText(t("Connecting..."));

      const gameNameParam = router.query.gameName
        ? decodeURIComponent(router.query.gameName as string)
        : '';
      const gameImageUrlParam = router.query.gameImageUrl
        ? decodeURIComponent(router.query.gameImageUrl as string)
        : '';

      Ipc.send("streaming", "startStream", {
        type: streamType,
        target: serverId,
        gameName: gameNameParam,
        gameImageUrl: gameImageUrlParam,
      })
        .then((result: string) => {
          console.log("StartStream sessionId:", result);
          setSessionId(result);
        })
        .catch((error) => {
          alert(
            "Failed to start new stream. Error details:\n" +
              JSON.stringify(error)
          );
        });
    } else {
      if (!streamStateInterval.current) {
        streamStateInterval.current = setInterval(() => {
          Ipc.send("streaming", "getPlayerState", {
            sessionId: sessionId,
          })
            .then((session: {
              errorDetails?: any
              id: string,
              target: string,
              path: string,
              type: string,
              playerState: "pending"|"started"|"failed"|"queued",
              state: string,
              waitingTimes: {
                  estimatedProvisioningTimeInSeconds: number,
                  estimatedAllocationTimeInSeconds: number,
                  estimatedTotalWaitTimeInSeconds: number
              }
          }) => {
              console.log("Player state:", session);
              const formatQueueData = () => {
                const currentDate = new Date()
                currentDate.setSeconds(session.waitingTimes.estimatedTotalWaitTimeInSeconds)
                return format(t("YouConnect", {defaultValue: "You connect in %s"}), moment(currentDate.toISOString()).local().format(t('dateFormat', {defaultValue: 'YYYY/MM/DD HH:mm'})))
              }

              switch (session.playerState) {
                case "pending":
                  // Waiting for console to start
                  break;

                case "started":
                  // Console is ready
                  clearInterval(streamStateInterval.current);

                  // Start xPlayer interface
                  setxPlayer(
                    new xStreamingPlayer("videoHolder", {
                      input_touch: false, // 支持原生触摸, PC端禁用
                      ui_touchenabled: false,
                      input_mousekeyboard: settings.enable_native_mouse_keyboard, // 支持原生键鼠操作
                      input_legacykeyboard: true, // Keep keyboard input
                      // @ts-ignore
                      input_mousekeyboard_config: settings.input_mousekeyboard_maping
                    })
                  );
                  break;

                case "failed":
                  // Error
                  clearInterval(streamStateInterval.current);

                  if (
                    session.errorDetails.message.includes('WaitingForServerToRegister')
                  ) {
                    // Detected the "WaitingForServerToRegister" error. This means the console is not connected to the xbox servers
                    alert(
                      t('WaitingForServerToRegister') +
                        "Stream error result: " +
                        session.state +
                        "\nDetails: [" +
                        session.errorDetails.code +
                        "] " +
                        session.errorDetails.message
                    );
                  } else if (session.errorDetails.message.includes('xboxstreaminghelper.cpp')) {
                    alert(
                      t('XboxstreaminghelperErr') +
                        "Stream error result: " +
                        session.state +
                        "\nDetails: [" +
                        session.errorDetails.code +
                        "] " +
                        session.errorDetails.message
                    );
                  } else {
                    alert(
                      "Stream error result: " +
                        session.state +
                        "\nDetails: [" +
                        session.errorDetails.code +
                        "] " +
                        session.errorDetails.message
                    );
                  }
                  console.log("Full stream error:", session.errorDetails);
                  break;

                case "queued":
                  setLoadingText(formatQueueData())
                  break;
              }
            })
            .catch((error) => {
              alert(
                "Failed to get player state. Error details:\n" +
                  JSON.stringify(error)
              );
            });
        }, 1000);
      }
    }

    return () => {
      if (xPlayer !== undefined) {
        xPlayer.close();
        setxPlayer(null);
      }

      if (keepaliveInterval.current) {
        clearInterval(keepaliveInterval.current);
      }

      if (streamStateInterval.current) {
        clearInterval(streamStateInterval.current);
      }

      if (mouseInterval) clearInterval(mouseInterval);

      window.removeEventListener("mousemove", mouseEvent);
      window.removeEventListener("mousedown", mouseEvent);
      window.removeEventListener('keydown', escEvent)
    };
  }, [xPlayer, sessionId, t, router.query, settings, handleSystemUiEvent, handleStreamingMessage]);

  const getVideoPlayerFilterStyle = (options) => {
    const filters = [];
    const usmMatrix = document.getElementById("filter-usm-matrix");

    const sharpness = options.sharpness || 0; // sharpness
    if (sharpness !== 0) {
      const level = (7 - (sharpness / 2 - 1) * 0.5).toFixed(1); // 5, 5.5, 6, 6.5, 7
      const matrix = `0 -1 0 -1 ${level} -1 0 -1 0`;
      usmMatrix.setAttributeNS(null, "kernelMatrix", matrix);
      filters.push(`url(#filter-usm)`);
    }

    const saturation = options.saturation || 100; // saturation
    if (saturation != 100) {
      filters.push(`saturate(${saturation}%)`);
    }

    const contrast = options.contrast || 100; // contrast
    if (contrast !== 100) {
      filters.push(`contrast(${contrast}%)`);
    }

    const brightness = options.brightness || 100; // brightness
    if (brightness !== 100) {
      filters.push(`brightness(${brightness}%)`);
    }

    return filters.join(" ");
  };

  const refreshPlayer = (options) => {
    const videoStyle = document.getElementById("video-css");
    const filters = getVideoPlayerFilterStyle(options);
    let videoCss = "";
    if (filters) {
      videoCss += `filter: ${filters} !important;`;
    }
    let css = "";
    if (videoCss) {
      css = `#videoHolder video { ${videoCss} }`;
    }

    videoStyle!.textContent = css;
  };

  const resizePlayer = (prefRatio) => {
    let targetWidth = '';
    let targetHeight = '';
    let targetObjectFit = '';
    const tmp = prefRatio.split(':');
    const videoRatio = parseFloat(tmp[0]) / parseFloat(tmp[1]);

    let width = 0;
    let height = 0;

    const $video = document.getElementsByTagName('video')[0];

    // Get window's ratio
    const winWidth = document.documentElement.clientWidth;
    const winHeight = document.documentElement.clientHeight;
    const parentRatio = winWidth / winHeight;

    // Get target width & height
    if (parentRatio > videoRatio) {
      height = winHeight;
      width = height * videoRatio;
    } else {
      width = winWidth;
      height = width / videoRatio;
    }

    // Prevent floating points
    width = Math.ceil(Math.min(winWidth, width));
    height = Math.ceil(Math.min(winHeight, height));

    $video.dataset.width = width.toString();
    $video.dataset.height = height.toString();

    targetWidth = `${width}px`;
    targetHeight = `${height}px`;
    targetObjectFit = prefRatio === '16:9' ? 'contain' : 'fill';

    $video.style.width = targetWidth;
    $video.style.height = targetHeight;
    $video.style.objectFit = targetObjectFit;
  }

  const onDisconnectPowerOff = () => {
    xPlayer && xPlayer.close();
    setLoading(true);
    setLoadingText(t("Disconnecting..."));
    Ipc.send("consoles", "powerOff", consoleId).then(res => {
      console.log('poweroff result:', res)
      onDisconnect();
    }).catch(() => {
      onDisconnect();
    });
  }

  const handleSendText = (text: string) => {
    Ipc.send("consoles", "sendText", {
      consoleId,
      text
    });
  }

  const onDisconnect = () => {
    setLoading(true);
    setShowPerformance(false);
    setLoadingText(t("Disconnecting..."));
    xPlayer && xPlayer.close();

    const videoHolder = document.getElementById("videoHolder");
    const canvasContainer = document.getElementById("canvas-container");
    videoHolder.style.visibility = 'visible';
    canvasContainer.style.visibility = 'hidden';

    if (streamStateInterval.current) {
      clearInterval(streamStateInterval.current);
    }

    if (keepaliveInterval.current) {
      clearInterval(keepaliveInterval.current);
    }

    setTimeout(() => {
      console.log("stopStream:", sessionId);
      const timer = setTimeout(() => {
        setLoading(false);
          router.back();
      }, 20 * 1000);

      Ipc.send("streaming", "stopStream", {
        sessionId: sessionId,
      })
        .then((result) => {
          console.log("Stream stopped:", result);
          clearTimeout(timer)
          setLoading(false);
          router.back();
        })
        .catch((e) => {
          console.log(e);
          clearTimeout(timer)
          setLoading(false);
          router.back();
        });
    }, 1000);
  };

  const handlePressNexus = () => {
    if (xPlayer && xPlayer.getChannelProcessor("input")) {
      xPlayer.getChannelProcessor("input").pressButtonStart("Nexus");
      setTimeout(() => {
        xPlayer.getChannelProcessor("input").pressButtonEnd("Nexus");
      }, 150);
    }
  };

  const handleLongPressNexus = () => {
    if (xPlayer && xPlayer.getChannelProcessor("input")) {
      xPlayer.getChannelProcessor("input").pressButtonStart("Nexus");
      setTimeout(() => {
        xPlayer.getChannelProcessor("input").pressButtonEnd("Nexus");
      }, 1000);
    }
  };

  const handleToggleMic = () => {
    if (!xPlayer) return
    if(xPlayer.getChannelProcessor('chat').isPaused === true){
      xPlayer.getChannelProcessor('chat').startMic();
      setOpenMicro(true);
    } else {
      xPlayer.getChannelProcessor('chat').stopMic();
      setOpenMicro(false);
    }
  };

  let videoHolderStyle = {}

  if (settings.video_format) {
    if (settings.video_format.indexOf(':') > -1) {
      videoHolderStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }
  }

  return (
    <>
      {
        showActionbar && (
          <ActionBar
            connectState={connectState}
            type={streamingType}
            openMicro={openMicro}
            onDisconnect={onDisconnect}
            onDisconnectPowerOff={onDisconnectPowerOff}
            onTogglePerformance={() => {
              setShowPerformance(!showPerformance);
            }}
            onDisplay={() => {
              if (settings.fsr) {
                setShowFSRDisplay(true)
              } else {
                setShowDisplay(true)
              }
            }}
            onAudio={() => setShowAudio(true)}
            onMic={handleToggleMic}
            onText={() => {
              xPlayer.setKeyboardInput(false)
              setShowTextModal(true)
            }}
            onPressNexus={handlePressNexus}
            onLongPressNexus={handleLongPressNexus}
          />
        )
      }

      <FailedModal
        show={showFailed}
        onCancel={() => {
          setShowFailed(false);
          onDisconnect();
        }}
      />

      <WarningModal
        show={showWarning}
        onConfirm={() => {
          setShowWarning(false);
          // handleExit('exit')
        }}
        onCancel={() => {
          setShowWarning(false);
        }}
      />
      {showPerformance && (
        <Perform xPlayer={xPlayer} connectState={connectState} />
      )}

      {showDisplay && (
        <Display
          onClose={() => setShowDisplay(false)}
          onValueChange={(options) => {
            refreshPlayer(options);
          }}
        />
      )}

      {
        showFSRDisplay && (
          <FSRDisplay
            onClose={() => setShowFSRDisplay(false)}
            onValueChange={(options) => {
              const { sharpness } = options
              xPlayer && xPlayer.setFsrSharpnessDynamic(sharpness)
            }}
          />
        )
      }

      {
        showTextModal && (
          <TextModal 
            onClose={() => {
              setShowTextModal(false);
              xPlayer.setKeyboardInput(true);
            }}
            onConfirm={value => {
              let text = value.trim();
              if (!text) return
              if (text.length > 150) {
                text = text.substring(0, 150);
              }
              handleSendText(text);
            }}
          />
        )
      }

      {showSystemMessageModal && (
        <Modal isOpen={showSystemMessageModal} onClose={cancelSystemMessage}>
          <ModalContent>
            <>
              {systemMessageTitle !== "" && (
                <ModalHeader className="flex flex-col gap-1">
                  {systemMessageTitle}
                </ModalHeader>
              )}
              <ModalBody>
                {systemMessageContent !== "" && <p>{systemMessageContent}</p>}
              </ModalBody>
              <ModalFooter className="flex flex-wrap justify-end gap-2">
                {systemMessageButtons.length > 0 ? (
                  systemMessageButtons.map(button => (
                    <Button
                      key={`system-message-btn-${button.index}`}
                      color="primary"
                      onPress={() => {
                        completeSystemMessage(button.index);
                      }}
                    >
                      {button.label}
                    </Button>
                  ))
                ) : (
                  <Button
                    color="primary"
                    onPress={() => {
                      const { defaultIndex } = systemMessageActionRef.current;
                      completeSystemMessage(
                        typeof defaultIndex === "number" ? defaultIndex : 0
                      );
                    }}
                  >
                    {t("Confirm")}
                  </Button>
                )}
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      )}

      {showSystemKeyboardModal && (
        <Modal isOpen={showSystemKeyboardModal} onClose={cancelSystemKeyboard}>
          <ModalContent>
            <>
              {systemKeyboardTitle !== "" && (
                <ModalHeader className="flex flex-col gap-1">
                  {systemKeyboardTitle}
                </ModalHeader>
              )}
              <ModalBody>
                {systemKeyboardDescription !== "" && (
                  <p>{systemKeyboardDescription}</p>
                )}
                <Input
                  label={t("Text")}
                  value={systemKeyboardText}
                  onValueChange={value => setSystemKeyboardText(value)}
                  maxLength={systemKeyboardMaxLength}
                  type={resolveSystemKeyboardProps().type}
                  inputMode={resolveSystemKeyboardProps().inputMode}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="default" onPress={cancelSystemKeyboard}>
                  {t("Cancel")}
                </Button>
                <Button color="primary" onPress={completeSystemKeyboard}>
                  {t("Confirm")}
                </Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      )}

      {showAudio && (
        <Audio
          volume={volume}
          onClose={() => setShowAudio(false)}
          onValueChange={value => {
            setVolume(value)
            if (xPlayer) {
              xPlayer.setAudioVolumeDirect(value)
            }
          }}
        />
      )}

      {loading && <Loading loadingText={loadingText} />}

      <div id="videoHolder" style={videoHolderStyle}>
        {/* <video src="https://www.w3schools.com/html/mov_bbb.mp4" autoPlay muted loop playsInline></video> */}
      </div>
      
      <div id="canvas-container">
        <canvas id="canvas"></canvas>
      </div>
      

      <svg id="video-filters" style={{ display: "none" }}>
        <defs>
          <filter id="filter-usm">
            <feConvolveMatrix
              id="filter-usm-matrix"
              order="3"
            ></feConvolveMatrix>
          </filter>
        </defs>
      </svg>
    </>
  );
}

export default Stream;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "cloud"]);

// eslint-disable-next-line react-refresh/only-export-components
export { getStaticPaths };
