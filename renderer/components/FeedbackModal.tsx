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
import Image from "next/image";

const FeedbackModal = ({ show, onClose }) => {
  const { t } = useTranslation('common');

  const handleClose = () => {
    onClose && onClose();
  };
  return (
    <Modal
      size="full"
      scrollBehavior="inside"
      isOpen={show}
      hideCloseButton={true}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">交流</ModalHeader>
          <ModalBody>
            <p>
              喜欢折腾、主机串流、云游戏及分享使用心得，欢迎加入群聊。
            </p>
            <p>群号：964721224</p>
            <div className="flex">
              <div className="w-1/3">
                <Image
                  src="/images/feedback/wx_sponsor.png"
                  alt="wechat"
                  width={300}
                  height={300}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleClose}>
              {t("Close")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal;
