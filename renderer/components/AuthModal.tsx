import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslation } from 'next-i18next';

const AuthModal = ({ show, onConfirm }) => {
  const { t } = useTranslation('common')

  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  return (
    <Modal isOpen={show} hideCloseButton={true}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">{t('Warning')}</ModalHeader>
          <ModalBody>
            <p>{t('Login has expired or not logged in, please log in again')}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleConfirm}>
              {t('Login')}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
