import { Card, CardBody, CardHeader, Divider, Progress } from "@heroui/react";
import moment from 'moment';
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
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
    });
  }, [t]);

  const formatTime = isoString => {
    const date = moment(isoString).local();
    return date.format(t('dateFormat', {defaultValue: 'YYYY-MM-DD HH:mm:ss'}));
  };

  const handleViewDetail = achivement => {
    console.log('achivement:', achivement)
    setLoading(true);
    Ipc.send("xCloud", "getAchivementDetail", `${achivement.titleId}`).then(data => {
      setCurrentDetail(data);
      setLoading(false);
      setShowDetail(true);
    });
  }

  return (
    <>
      <Nav current={t("Achivements")} isLogined={true} />

      {loading && <Loading loadingText={loadingText} />}

      { (showDetail && currentDetail) && <AchivementModal achivement={currentDetail} onClose={() => {
        setShowDetail(false);
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
