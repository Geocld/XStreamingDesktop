import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Link,
} from "@heroui/react";
import { useTranslation } from 'next-i18next';
import { QRCodeSVG } from 'qrcode.react';

const formatSeconds = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
};

const MsalModal = ({ verificationUri, userCode, expiresIn, show, onRefresh, onConfirm }) => {
  const { t } = useTranslation('common')

  const [copied, setCopied] = React.useState(false);
  const [countdown, setCountdown] = React.useState(expiresIn);

  React.useEffect(() => {
    if (!show) return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, userCode, show]);

  const copyToClipboard = async () => {
    if (countdown <= 0) return;

    try {
      await navigator.clipboard.writeText(userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("copy failed", err);
    }
  };

  const handleRefresh = () => {
    onRefresh && onRefresh();
  };

  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  return (
    <Modal size="xl" isOpen={show} hideCloseButton>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1 pb-3">
            <h3 className="text-xl font-semibold">
              { t('MsalModalTitle') }
            </h3>
          </ModalHeader>
          
          <ModalBody className="py-6">
            <div className="flex gap-6 items-start">
              <div className="flex flex-col items-center gap-3 min-w-fit">
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                  <QRCodeSVG 
                    size={100} 
                    value={verificationUri}
                    level="M"
                  />
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">
                    { t('AuthCode') }
                  </span>

                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded border border-gray-300 select-all">
                    <code className="text-sm font-mono font-semibold text-gray-800">
                      {userCode}
                    </code>
                    <Button 
                      size="sm" 
                      onPress={copyToClipboard} 
                      aria-label={'Copy device code'}
                      disabled={countdown <= 0}
                    >
                      {copied ? t('Copied') : t('Copy')}
                    </Button>
                  </div>

                  <div className="mt-1 text-xs text-gray-500 min-h-[1em]">
                    {countdown > 0 
                      ? `${formatSeconds(countdown)}`
                      : (
                        <span className="text-red-600">
                          { t('AuthCodeExpired') }
                          <Button 
                            size="sm"
                            color="primary"
                            variant="light"
                            onPress={handleRefresh}
                            className="ml-2 p-0"
                          >
                            { t('Refresh') }
                          </Button>
                        </span>
                      )
                    }
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div className="space-y-1">
                  <p className="text-base leading-relaxed">
                    { t('MsalModalDesc') }
                  </p>
                  
                  <div className="pt-1">
                    <Link 
                      href={verificationUri}
                      isExternal
                      showAnchorIcon
                      className="text-sm break-all"
                      color="primary"
                    >
                      {verificationUri}
                    </Link>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
                    <li>{ t('MsalAuthTips1') }</li>
                    <li>{ t('MsalAuthTips2') }</li>
                    <li>{ t('MsalAuthTips3') }</li>
                  </ol>
                </div>
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter className="py-1">
            <Button 
              color="primary" 
              size="sm" 
              onPress={handleConfirm}
              className="px-6"
            >
              { t('Complete') }
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default MsalModal;
