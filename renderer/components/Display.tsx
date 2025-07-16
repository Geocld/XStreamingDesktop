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
import { DISPLAY_KEY } from "../common/constans";

const DEFAULT_OPTIONS = {
  sharpness: 5,
  saturation: 100,
  contrast: 100,
  brightness: 100,
};

function Display(props) {
  const { t } = useTranslation('cloud');

  const [options, setOptions] = useState<any>(DEFAULT_OPTIONS);

  useEffect(() => {
    const _localOPtions = window.localStorage.getItem(DISPLAY_KEY);

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
    window.localStorage.setItem(DISPLAY_KEY, JSON.stringify(options));
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

            <Slider
              label={t("Saturation")}
              step={10}
              maxValue={150}
              minValue={50}
              value={options.saturation}
              className="max-w-md"
              onChange={(value) => {
                setOptions((prevOptions) => ({
                  ...prevOptions,
                  saturation: value,
                }));
                handleValueChange();
              }}
            />

            <Slider
              label={t("Contrast")}
              step={10}
              maxValue={150}
              minValue={50}
              value={options.contrast}
              className="max-w-md"
              onChange={(value) => {
                setOptions((prevOptions) => ({
                  ...prevOptions,
                  contrast: value,
                }));
                handleValueChange();
              }}
            />

            <Slider
              label={t("Brightness")}
              step={10}
              maxValue={150}
              minValue={50}
              value={options.brightness}
              className="max-w-md"
              onChange={(value) => {
                setOptions((prevOptions) => ({
                  ...prevOptions,
                  brightness: value,
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

export default Display;
