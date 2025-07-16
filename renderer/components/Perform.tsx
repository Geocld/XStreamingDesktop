import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { useSettings } from "../context/userContext";

function Perform({ xPlayer, connectState }) {
  const { t } = useTranslation('cloud');
  const { settings } = useSettings();
  const [performance, setPerformance] = useState<any>({});

  useEffect(() => {
    let perfInterval;
    if (!perfInterval) {
      perfInterval = setInterval(() => {
        if (xPlayer && connectState === "connected")
          xPlayer.getStreamState &&
            xPlayer.getStreamState().then((perf) => {
              setPerformance(perf);
            });
      }, 2000);
    }

    return () => {
      if (perfInterval) {
        clearInterval(perfInterval);
      }
    };
  }, [xPlayer, connectState]);

  let resolutionText = '';
  if (performance.resolution) {
    resolutionText = performance.resolution;
    if (settings.resolution === 1081) {
      resolutionText = resolutionText + '(HQ)';
    }
  }

  return (
    <>
      {
        settings.performance_style ? (
          <div id="performances-x" className="flex flex-row justify-center w-full">
            <span className="performance-x-wrap">
              <span className="text-xs">
                {resolutionText || "--"} | &nbsp;
              </span>
              <span className="text-xs">
                {t("RTT")}: {performance.rtt || "--"} | &nbsp;
              </span>
              <span className="text-xs">
                {t("FPS")}: {performance.fps || "--"} | &nbsp;
              </span>
              <span className="text-xs">
                {t("FD")}: {performance.fl || "--"} | &nbsp;
              </span>
              <span className="text-xs">
                {t("PL")}: {performance.pl || "--"} | &nbsp;
              </span>
              <span className="text-xs">
                {t("Bitrate")}: {performance.br || "--"} | &nbsp;
              </span>
              <span className="text-xs">
                {t("DT")}: {performance.decode || "--"}
              </span>
            </span>
          </div>
        ) : (
          <div id="performances">
            <div className="px-1 text-sm">
              {t("Resolution")}: {resolutionText || "--"}
            </div>
            <div className="px-1 text-sm">
              {t("RTT")}: {performance.rtt || "--"}
            </div>
            <div className="px-1 text-sm">
              {t("FPS")}: {performance.fps || "--"}
            </div>
            <div className="px-1 text-sm">
              {t("FD")}: {performance.fl || "--"}
            </div>
            <div className="px-1 text-sm">
              {t("PL")}: {performance.pl || "--"}
            </div>
            <div className="px-1 text-sm">
              {t("Bitrate")}: {performance.br || "--"}
            </div>
            <div className="px-1 text-sm">
              {t("DT")}: {performance.decode || "--"}
            </div>
          </div>
        )
      }
    </>
  );
}

export default Perform;
