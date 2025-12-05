import { useRouter } from "next/router";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Chip,
} from "@heroui/react";
import { useTranslation } from "next-i18next";

const XCLOUD_PREFIX = "xcloud_";

function TitleModal(props) {
  const router = useRouter();
  const { t, i18n: {language: locale} } = useTranslation('cloud');

  const titleItem = props.title || {};

  const handleClose = () => {
    props.onClose && props.onClose();
  };

  const handleStartGame = () => {
    // console.log("titleItem:", titleItem);
    const titleId = titleItem.titleId || titleItem.XCloudTitleId;
    // console.log("titleId:", titleId)
    router.push({
      pathname: `/${locale}/stream`,
      query: { serverid: XCLOUD_PREFIX + titleId }
    });
  };

  let isByorg = false;
  if (
    titleItem &&
    !titleItem.XCloudTitleId &&
    titleItem.details &&
    titleItem.details.programs
  ) {
    if (titleItem.details.programs.indexOf('BYOG') > -1) {
      isByorg = true;
    }
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
            {titleItem.ProductTitle}
          </ModalHeader>
          <ModalBody className="scroll">
            <div className="flex">
              <div className="w-1/3">
                <Image
                  // className="object-contain rounded-lg"
                  // className="object-cover rounded-lg"
                  isZoomed
                  loading={'lazy'}
                  src={'https:' + titleItem.Image_Poster.URL}
                />
              </div>

              <div className="w-2/3 pl-5">
                <p>{titleItem.PublisherName}</p>
                <p>{titleItem.ProductDescription || ""}</p>
                {
                  isByorg && (
                    <p className="text-red-500">{t('byorg')}</p>
                  )
                }
                <div className="pt-5 flex gap-4">
                  {titleItem.LocalizedCategories.map((item, idx) => {
                    return (
                      <Chip key={idx} color="success" variant="bordered">
                        {item}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleClose}>
              {t('Close')}
            </Button>
            <Button color="primary" onPress={handleStartGame}>
              {t('Start game')}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}

export default TitleModal;
