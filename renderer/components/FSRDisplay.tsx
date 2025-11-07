import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Slider,
} from "@heroui/react";
import { useTranslation } from "next-i18next";
import { FSR_DISPLAY_KEY } from "../common/constans";

const DEFAULT_OPTIONS = {
  sharpness: 2,
};

function FSRDisplay(props) {
  const { t } = useTranslation('cloud');

  const [options, setOptions] = useState<any>(DEFAULT_OPTIONS);

  useEffect(() => {
    const _localOPtions = window.localStorage.getItem(FSR_DISPLAY_KEY);

    let localOPtions: any = DEFAULT_OPTIONS;
    if (_localOPtions) {
      try {
        localOPtions = JSON.parse(_localOPtions);
      } catch {
        localOPtions = DEFAULT_OPTIONS;
      }
    }
    setOptions((prevOptions) => ({
      ...prevOptions,
      ...localOPtions,
    }));
  }, []);

  const handleClose = () => {
    props.onClose && props.onClose();
  };

  const handleReset = () => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      ...DEFAULT_OPTIONS,
    }));
    handleValueChange();
  };

  const handleConfirm = () => {
    window.localStorage.setItem(FSR_DISPLAY_KEY, JSON.stringify(options));
    props.onClose && props.onClose();
  };

  const handleValueChange = () => {
    props.onValueChange && props.onValueChange(options);
  };

  return (
    <Modal isOpen={true} className="z-100" onClose={handleClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">{t('Display')}</ModalHeader>
          <ModalBody>
            <Slider
              label={t("Sharpness")}
              step={1}
              maxValue={10}
              minValue={0}
              value={options.sharpness}
              className="max-w-md"
              onChange={(value) => {
                setOptions((prevOptions) => ({
                  ...prevOptions,
                  sharpness: value,
                }));
                handleValueChange();
              }}
            />

          </ModalBody>
          <ModalFooter>
            <Button color="default" onPress={handleReset}>
              {t("Reset")}
            </Button>
            <Button color="primary" onPress={handleConfirm}>
              {t("Confirm")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}

export default FSRDisplay;
