import React, { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { useTranslation } from "next-i18next";
import Nav from "../../components/Nav";

import Ipc from "../../lib/ipc";

import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

function GamepadTester() {
  const [isLogined, setIsLogined] = useState(false);
  const { t } = useTranslation("settings");

  const timer = useRef(null);

  useEffect(() => {
    const _isLogined = window.sessionStorage.getItem("isLogined") || "0";
    if (_isLogined === "1") {
      setIsLogined(true);
    }

    setInterval(() => {
      Ipc.send("app", "hidController").then(res => {
        console.log('controller states:', res.states)
      })
    }, 2000);

    const fudgeFactor = 2; // because of bug in Chrome related to svg text alignment font sizes can not be < 1
    const runningElem = document.querySelector("#running");
    const gamepadsElem = document.querySelector("#gamepads");
    const gamepadsByIndex = {};

    const controllerTemplate = `
<div>
  <div class="head"><div class="index"></div><div class="id"></div></div>
  <div class="info"><div class="label">connected:</div><span class="connected"></span></div>
  <div class="info"><div class="label">mapping:</div><span class="mapping"></span></div>
  <div class="inputs">
    <div class="axes"></div>
    <div class="buttons"></div>
  </div>
</div>
`;
    const axisTemplate = `
<svg viewBox="-2.2 -2.2 4.4 4.4" width="128" height="128">
    <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.04" />
    <path d="M0,-2L0,2M-2,0L2,0" stroke="#888" stroke-width="0.04" />
    <circle cx="0" cy="0" r="0.22" fill="red" class="axis" />
    <text text-anchor="middle" fill="#CCC" x="0" y="2">0</text>
</svg>
`;

    const buttonTemplate = `
<svg viewBox="-2.2 -2.2 4.4 4.4" width="64" height="64">
  <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.1" />
  <circle cx="0" cy="0" r="0" fill="none" fill="red" class="button" />
  <text class="value" dominant-baseline="middle" text-anchor="middle" fill="#CCC" x="0" y="0">0.00</text>
  <text class="index" alignment-baseline="hanging" dominant-baseline="hanging" text-anchor="start" fill="#CCC" x="-2" y="-2">0</text>
</svg>
`;

    function addGamepad(gamepad) {
      console.log("add:", gamepad.index);
      const elem = document.createElement("div");
      elem.innerHTML = controllerTemplate;

      const axesElem = elem.querySelector(".axes");
      const buttonsElem = elem.querySelector(".buttons");

      const axes = [];
      for (let ndx = 0; ndx < gamepad.axes.length; ndx += 2) {
        const div = document.createElement("div");
        div.innerHTML = axisTemplate;
        axesElem.appendChild(div);
        axes.push({
          axis: div.querySelector(".axis"),
          value: div.querySelector("text"),
        });
      }

      const buttons = [];
      for (let ndx = 0; ndx < gamepad.buttons.length; ++ndx) {
        const div = document.createElement("div");
        div.innerHTML = buttonTemplate;
        buttonsElem.appendChild(div);
        // @ts-ignore
        div.querySelector(".index").textContent = ndx;
        buttons.push({
          circle: div.querySelector(".button"),
          value: div.querySelector(".value"),
        });
      }

      gamepadsByIndex[gamepad.index] = {
        gamepad,
        elem,
        axes,
        buttons,
        index: elem.querySelector(".index"),
        id: elem.querySelector(".id"),
        mapping: elem.querySelector(".mapping"),
        connected: elem.querySelector(".connected"),
      };
      gamepadsElem.appendChild(elem);
    }

    function removeGamepad(gamepad) {
      const info = gamepadsByIndex[gamepad.index];
      if (info) {
        delete gamepadsByIndex[gamepad.index];
        info.elem.parentElement.removeChild(info.elem);
      }
    }

    function addGamepadIfNew(gamepad) {
      const info = gamepadsByIndex[gamepad.index];
      if (!info) {
        addGamepad(gamepad);
      } else {
        // This broke sometime in the past. It used to be
        // the same gamepad object was returned forever.
        // Then Chrome only changed to a new gamepad object
        // is returned every frame.
        info.gamepad = gamepad;
      }
    }

    function handleConnect(e) {
      console.log("connect");
      addGamepadIfNew(e.gamepad);
    }

    function handleDisconnect(e) {
      console.log("disconnect");
      removeGamepad(e.gamepad);
    }

    const keys = ["index", "id", "connected", "mapping"];
    function processController(info) {
      const { gamepad, axes, buttons } = info;
      for (const key of keys) {
        info[key].textContent = gamepad[key];
      }
      axes.forEach(({ axis, value }, ndx) => {
        const off = ndx * 2;
        axis.setAttributeNS(null, "cx", gamepad.axes[off] * fudgeFactor);
        axis.setAttributeNS(null, "cy", gamepad.axes[off + 1] * fudgeFactor);
        value.textContent = `${gamepad.axes[off]
          .toFixed(2)
          .padStart(5)},${gamepad.axes[off + 1].toFixed(2).padStart(5)}`;
      });
      buttons.forEach(({ circle, value }, ndx) => {
        const button = gamepad.buttons[ndx];
        circle.setAttributeNS(null, "r", button.value * fudgeFactor);
        circle.setAttributeNS(null, "fill", button.pressed ? "red" : "gray");
        value.textContent = `${button.value.toFixed(2)}`;
      });
    }

    function addNewPads() {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad) {
          addGamepadIfNew(gamepad);
        }
      }
    }

    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);

    function process() {
      runningElem.textContent = (((performance.now() * 0.001 * 60) | 0) % 100)
        .toString()
        .padStart(2, "0");
      addNewPads(); // some browsers add by polling, others by event

      Object.values(gamepadsByIndex).forEach(processController);
      timer.current = requestAnimationFrame(process);
    }
    timer.current = requestAnimationFrame(process);

    return () => {
      if (timer.current) {
        cancelAnimationFrame(timer.current);
      }

      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
    };
  }, []);

  return (
    <div id="gamepadTest">
      <Nav
        current={t("Settings")}
        isLogined={isLogined}
      />
      <div>
        Running: <span id="running"></span>
      </div>
      <div>
        <Button
          style={{marginRight: 10}}
          color="secondary"
          onClick={() => {
            const gamepads = navigator.getGamepads();
            console.log("gamepads:", gamepads);
            for (let i = 0; i < gamepads.length; i++) {
              const gp = gamepads[i];
              if (gp && gp.vibrationActuator) {
                gp.vibrationActuator.playEffect("dual-rumble", {
                  startDelay: 0,
                  duration: 1000,
                  weakMagnitude: 1.0,
                  strongMagnitude: 1.0,
                });
              }
            }
          }}
        >
          Vibration
        </Button>

        <Button
          color="secondary"
          onClick={() => {
            const gamepads = navigator.getGamepads();
            for (let i = 0; i < gamepads.length; i++) {
              const gp = gamepads[i];
              if (gp && gp.vibrationActuator) {
                // @ts-ignore
                if (gp.vibrationActuator.effects && gp.vibrationActuator.effects.includes('trigger-rumble')) {
                  gp.vibrationActuator.playEffect('trigger-rumble', {
                      duration: 255,
                      leftTrigger: 1,
                      rightTrigger: 1,
                      strongMagnitude: 0,
                      weakMagnitude: 1,
                  });
                  
                } else {
                  window.alert('trigger rumble is not supported!')
                }
              }
            }
          }}
        >
          Trigger rumble
        </Button>
      </div>
      <div id="gamepads"></div>
    </div>
  );
}

export default GamepadTester;


// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "settings"]);

// eslint-disable-next-line react-refresh/only-export-components
export {getStaticPaths};