import { Card, CardBody, CardHeader, Divider, Progress } from "@heroui/react";
import moment from 'moment';
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { FOCUS_ELEMS } from '../../common/constans';
import AchivementModal from "../../components/AchivementModal";
import Layout from "../../components/Layout";
import Loading from "../../components/Loading";
import Nav from "../../components/Nav";
import Ipc from "../../lib/ipc";

// import { achivements } from "../../mock/achivements";
// import achivementDetail from '../../mock/achivementsDetail';

import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

function Achivements() {
  const { t } = useTranslation("cloud");
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [achivements, setAchivements] = useState([]);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const currentIndex = useRef(0);
  const focusable = useRef<any>([]);

  useEffect(() => {
    setLoading(true);
    setLoadingText(t("Loading..."));

    const localFontSize = localStorage.getItem('fontSize');
    if (localFontSize && localFontSize !== '16') {
      document.documentElement.style.fontSize = localFontSize + 'px';
    }

    Ipc.send("xCloud", "getHistoryAchivements").then(data => {
      setAchivements(data);
      setLoading(false);

      setTimeout(() => {
        focusable.current = document.querySelectorAll(FOCUS_ELEMS);
      },  1000);
    });

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
  }, [t]);

  const formatTime = isoString => {
    const date = moment(isoString).local();
    return date.format(t('dateFormat', {defaultValue: 'YYYY-MM-DD HH:mm:ss'}));
  };

  const resetNavigationElems = () => {
    setTimeout(() => {
      focusable.current = document.querySelectorAll(FOCUS_ELEMS);
    },  800);
  };

  const handleViewDetail = achivement => {
    console.log('achivement:', achivement)
    setLoading(true);
    Ipc.send("xCloud", "getAchivementDetail", `${achivement.titleId}`).then(data => {
      setCurrentDetail(data);
      setLoading(false);
      setShowDetail(true);
      setTimeout(() => {
        const dialog = document.querySelector('[role="dialog"]');
        focusable.current = dialog.querySelectorAll(FOCUS_ELEMS);
      },  800);
    });
  }

  return (
    <>
      <Nav current={t("Achivements")} isLogined={true} />

      {loading && <Loading loadingText={loadingText} />}

      { (showDetail && currentDetail) && <AchivementModal achivement={currentDetail} onClose={() => {
        setShowDetail(false);
        resetNavigationElems();
      }} /> }

      <Layout>
        <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5">
          {
            achivements.map((achivement, idx) => {
              const progress = achivement.currentGamerscore / achivement.maxGamerscore;

              return (
                <Card key={idx} className="cursor-pointer mb-5" isPressable onPress={() => handleViewDetail(achivement)}>
                  <CardHeader className="flex gap-3">
                    <h5 className="font-bold text-base">{ achivement.name }</h5>
                  </CardHeader>
                  <Divider/>
                  <CardBody>
                    <p className="text-sm text-slate-400 pb-2">{ formatTime(achivement.lastUnlock) }</p>
                    <div>
                      <Progress size="sm" label={`${achivement.currentGamerscore}/${achivement.maxGamerscore}`} value={Math.floor(progress * 100)} showValueLabel={true} />
                    </div>
                  </CardBody>
                </Card>
              )
            })
          }
        </div>
      </Layout>
    </>
  )
}

export default Achivements;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "cloud"]);

// eslint-disable-next-line react-refresh/only-export-components
export { getStaticPaths };
