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
  const { t, i18n: { language: locale } } = useTranslation('cloud');

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
    titleItem.details &&
    !titleItem.details.hasEntitlement
  ) {
    isByorg = true;
  }

  return (
    <Modal
      isOpen={true}
      size="5xl"
      scrollBehavior="inside"
      onClose={handleClose}
      classNames={{
        base: "bg-background border border-divider",
        header: "border-b border-divider text-foreground",
        footer: "border-t border-divider",
        closeButton: "hover:bg-content2 active:bg-content1 text-default-500"
      }}
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
                  draggable="false"
                  src={'https:' + titleItem.Image_Poster.URL}
                />
              </div>

              <div className="w-2/3 pl-6 flex flex-col">
                <div className="mb-4">
                  <p className="text-sm font-semibold tracking-wider text-primary uppercase mb-1">{titleItem.PublisherName}</p>
                </div>

                <div className="text-sm text-default-600 leading-relaxed max-h-[250px] overflow-y-auto pr-2 mb-4">
                  {titleItem.ProductDescription || titleItem.Description || (titleItem.details && (titleItem.details as any).description) || "No description available for this title."}
                </div>

                {
                  isByorg && (
                    <p className="text-red-500 font-medium mb-4 bg-red-500/10 p-2 rounded border border-red-500/20">{t('byorg')}</p>
                  )
                }

                <div className="flex flex-wrap gap-2 mt-auto">
                  {titleItem.LocalizedCategories?.map((item, idx) => {
                    return (
                      <Chip key={idx} color="default" variant="flat" className="bg-content3 border-none text-foreground">
                        {item}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className="bg-content1 text-default-600 border border-divider hover:bg-content2 hover:border-primary hover:text-foreground" onPress={handleClose}>
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
