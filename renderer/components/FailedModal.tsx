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

const FailedModal = ({ show, onCancel }) => {
  const { t } = useTranslation('cloud');

  const handleExit = () => {
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
                "NAT failed. If you are trying to stream remotely, please ensure that you have a public IPV4/6 address and that your router has port forwarding enabled for ports 9002/3074."
              )}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" variant="light" onPress={handleExit}>
              {t("Exit")}
            </Button>
            {/* <Button color="primary" onPress={handleRefresh}>
              {t("Refresh")}
            </Button> */}
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default FailedModal;
