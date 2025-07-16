import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslation } from "next-i18next";

function Alert(props) {
  const { t } = useTranslation('common');
  
  const handleConfirm = () => {
    props.onClose && props.onClose();
  };

  return (
    <Modal isOpen={true} scrollBehavior="inside" onClose={handleConfirm}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            {props.title || t("Warning")}
          </ModalHeader>
          <ModalBody className="scroll">{props.content}</ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleConfirm}>
              {t('Confirm')}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}

export default Alert;
