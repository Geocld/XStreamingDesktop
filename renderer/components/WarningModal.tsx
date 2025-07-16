import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslation } from "next-i18next";

const WarningModal = ({ show, onConfirm, onCancel }) => {
  const { t } = useTranslation('cloud');

  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  const handleCancel = () => {
    onCancel && onCancel();
  };
  return (
    <Modal isOpen={show} hideCloseButton={true}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            {t("Warning")}
          </ModalHeader>
          <ModalBody>
            <p>
              {t(
                "The terminal seems to have been without a screen for a long time. Please try reconnecting."
              )}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleCancel}>
              {t("Keep waiting")}
            </Button>
            <Button color="primary" onPress={handleConfirm}>
              {t("Exit")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default WarningModal;
