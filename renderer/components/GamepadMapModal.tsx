import React, { useEffect, useRef } from 'react'
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from "@heroui/react"
import { useTranslation } from 'next-i18next'
import Image from "next/image";

const maping = {
  A: '/images/gamepad/a.svg',
  B: '/images/gamepad/b.svg',
  X: '/images/gamepad/x.svg',
  Y: '/images/gamepad/y.svg',
  DPadUp: '/images/gamepad/gamepad-up.svg',
  DPadDown: '/images/gamepad/gamepad-down.svg',
  DPadLeft: '/images/gamepad/gamepad-left.svg',
  DPadRight: '/images/gamepad/gamepad-right.svg',
  LeftShoulder: '/images/gamepad/lb.svg',
  RightShoulder: '/images/gamepad/rb.svg',
  LeftTrigger: '/images/gamepad/lt.svg',
  RightTrigger: '/images/gamepad/rt.svg',
  LeftThumb: '/images/gamepad/left-joystick-down.svg',
  RightThumb: '/images/gamepad/right-joystick-down.svg',
  Menu: '/images/gamepad/menu.svg',
  View: '/images/gamepad/view.svg',
  Nexus: '/images/gamepad/xbox.svg'
}

const GamepadMapModal = ({ show, current, onConfirm, onCancel }) => {
  const { t } = useTranslation('settings')
  const isConfirm = useRef(false)

  useEffect(() => {
    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();
      let _gamepad = null
      gamepads.forEach(gp => {
        if (gp) _gamepad = gp
      })
      if (_gamepad) {
        _gamepad.buttons.forEach((b, idx) => {
          if (b.pressed) {
            clearInterval(timer)
            if (!isConfirm.current) {
              onConfirm && onConfirm(current, idx)
            }
            isConfirm.current = true
          }
        })
      }
    }

    const timer = setInterval(pollGamepads, 100);

    return () => clearInterval(timer);
  }, [current, onConfirm]);

  const handleCancel = () => {
    onCancel && onCancel()
  }

  return (
    <Modal isOpen={show} hideCloseButton={true}>
      <ModalContent style={{background: '#fff', color: '#333'}}>
        <>
          <ModalHeader className="flex flex-col gap-1">{t('Key Maping')}</ModalHeader>
          <ModalBody className="map-modal-body">
            <p>{t('Please press the button on the controller, which will be mapped to:')} </p>
            <div className="icon-wrap">
              <Image
                src={maping[current]}
                alt={current}
                width={40}
                height={40}
              />
            </div>
            <p>{t('After successful mapping, this pop-up will automatically close')}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" fullWidth onClick={handleCancel}>
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  )
}

export default GamepadMapModal
