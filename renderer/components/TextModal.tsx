import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { useTranslation } from "next-i18next";

function TextModal(props) {
  const { t } = useTranslation('cloud');
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    props.onClose && props.onClose();
  };

  const handleConfirm = () => {
    props.onConfirm && props.onConfirm(text);
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    },  1000)
  };

  return (
    <Modal isOpen={true} className="z-100" onClose={handleClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">{t('Send text')}</ModalHeader>
          <ModalBody>
            <Input label="Text" placeholder="Enter text" onValueChange={value => setText(value)}/>
          </ModalBody>
          <ModalFooter>
            <Button color="default" onPress={handleClose}>
              {t("Cancel")}
            </Button>
            <Button color="primary" isLoading={loading} onPress={handleConfirm}>
              {t("Confirm")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}

export default TextModal;
