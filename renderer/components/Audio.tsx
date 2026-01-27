import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Slider,
} from "@heroui/react";
import { useTranslation } from "next-i18next";

function Audio(props) {
  const { t } = useTranslation('cloud');

  const handleClose = () => {
    props.onClose && props.onClose();
  };

  const handleValueChange = value => {
    props.onValueChange && props.onValueChange(value);
  };

  return (
    <Modal isOpen={true} className="z-100" onClose={handleClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">{t('Audio')}</ModalHeader>
          <ModalBody>
            <Slider
              label={t("Volume")}
              step={1}
              maxValue={10}
              minValue={0}
              value={props.volume}
              className="max-w-md"
              onChange={value => {
                handleValueChange(value);
              }}
            />
          </ModalBody>
        </>
      </ModalContent>
    </Modal>
  );
}

export default Audio;
