import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslation } from "next-i18next";

function ConfirmModal(props) {
  const { t } = useTranslation('common');

  const handleConfirm = () => {
    props.onConfirm && props.onConfirm();
  };

  const handleCancel = () => {
    props.onCancel && props.onCancel();
  };

  return (
    <Modal isOpen={props.show} scrollBehavior="inside" onClose={handleConfirm}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            {props.title || t('Warning')}
          </ModalHeader>
          <ModalBody className="scroll">{props.content}</ModalBody>
          <ModalFooter>
            <Button color="default" onPress={handleCancel}>
              {props.cancelText || t('Cancel')}
            </Button>
            <Button color="primary" onPress={handleConfirm}>
              {props.confirmText || t('Confirm')}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}

export default ConfirmModal;
