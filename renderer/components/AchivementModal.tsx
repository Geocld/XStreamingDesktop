import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Tabs,
  Tab,
  Progress,
  Card,
  CardBody
} from "@heroui/react";
import { useTranslation } from "next-i18next";
import Image from "next/image";

function AchivementModal(props) {
  const { t } = useTranslation('common');

  const achivement = props.achivement || {};
  const [currentTab, setCurrentTab] = useState('all');

  const handleClose = () => {
    props.onClose && props.onClose();
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab)
  }

  let showArchivements = [];
  if (currentTab === 'unlocked') {
    showArchivements = achivement.filter(item => {
      return item.progressState === 'Achieved';
    });
  } else if (currentTab === 'lock') {
    showArchivements = achivement.filter(item => {
      return item.progressState !== 'Achieved';
    });
  } else {
    showArchivements = achivement;
  }

  return (
    <Modal
      isOpen={true}
      size="5xl"
      scrollBehavior="inside"
      onClose={handleClose}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            { achivement.name }
          </ModalHeader>
          <ModalBody className="scroll">
            <Tabs aria-label="Options" onSelectionChange={handleTabChange}>
              <Tab key="all" title={t("All")}></Tab>
              <Tab key="unlocked" title={t("Unlocked")}></Tab>
              <Tab key="lock" title={t("Lock")}></Tab>
            </Tabs>

            <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5">
              {
                showArchivements.map((item, idx) => {
                  let progress = 0;
                  if (item.progressState === 'Achieved') {
                    progress = 1;
                  } else if (
                    item.progressState === 'InProgress' &&
                    item.progression &&
                    item.progression.requirements
                  ) {
                    progress =
                      item.progression.requirements[0].current /
                      item.progression.requirements[0].target;
                  }

                  const sorce = (item.rewards && item.rewards[0] && item.rewards[0].value) || 0;
                  return (
                    <Card className="mb-5" isBlurred key={idx}>
                      <CardBody className="relative">
                        <Image
                          src={item.mediaAssets[0].url}
                          alt={item.name}
                          width={300}
                          height={100}
                          draggable="false"
                        />
                        {
                          item.progressState !== 'Achieved' && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{background: 'rgba(0, 0, 0, 0.3)'}}>
                              <Image
                                src="/images/icons/lock.svg"
                                alt="lock"
                                width={50}
                                height={50}
                                draggable="false"
                              />
                            </div>
                          )
                        }
                        <p className="text-base text-black-500 pb-2">{ item.name }</p>
                        <p className="text-xs text-slate-400 pb-2">{ item.description }</p>
                        <div>
                          <Progress size="sm" label={`${t('Score')}: ${sorce}`} value={Math.floor(progress * 100)} showValueLabel={true} />
                        </div>
                      </CardBody>
                    </Card>
                  )
                })
              }
            </div>
          </ModalBody>
          {/* <ModalFooter>
            <Button color="danger" onPress={handleClose}>
              {t('Close')}
            </Button>
          </ModalFooter> */}
        </>
      </ModalContent>
    </Modal>
  );
}

export default AchivementModal;
