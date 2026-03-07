import { useEffect, useState } from 'react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Tabs,
  Tab
} from "@heroui/react";

import { useTranslation } from "next-i18next";

import { useRouter } from "next/router";
import Ipc from "../lib/ipc";
import updater from "../lib/updater";
import pkg from '../../package.json';

const Nav = ({ current, isLogined }) => {
  console.log("isLogined:", isLogined);

  const { t, i18n: { language: locale } } = useTranslation("common");
  const [userState, setUserState] = useState(null);
  const [newVersions, setNewVersions] = useState(null);

  const router = useRouter();

  const isMainPage = current === t("Consoles") || current === t("Xcloud") || current === "Consoles" || current === "Xcloud";

  useEffect(() => {
    Ipc.send('app', 'getAuthState').then(res => {
      if (isLogined) {
        setUserState(res.user)
      }
    });

    updater().then((infos: any) => {
      if (infos) {
        setNewVersions(infos)
      }
    })
  }, [isLogined])

  const handleLouout = () => {
    Ipc.send("app", "clearData");
  }

  const handleToggleScreen = () => {
    Ipc.send("app", "toggleFullscreen")
  }

  const handleExit = () => {
    Ipc.send("app", "quit")
  }

  return (
    <Navbar maxWidth="full" className="bg-background border-b border-divider" style={{ justifyContent: "flex-start", zIndex: 100 }}>
      <NavbarContent className="flex gap-4" justify="start">
        {isMainPage ? (
          <NavbarItem>
            {isLogined && (
              <Tabs
                selectedKey={current === t("Xcloud") || current === "Xcloud" ? "xcloud" : "consoles"}
                onSelectionChange={(key) => window.location.assign(`/${locale}/${key === "consoles" ? "home" : "xcloud"}`)}
                radius="full"
                size="md"
                color="primary"
                classNames={{
                  tabList: "bg-content1 border border-divider p-1",
                  cursor: "bg-primary shadow-sm",
                  tab: "px-6 h-8",
                  tabContent: "group-data-[selected=true]:text-white text-default-500 font-bold"
                }}
              >
                <Tab key="consoles" title={t("Consoles")} />
                <Tab key="xcloud" title={t("Xcloud")} />
              </Tabs>
            )}
          </NavbarItem>
        ) : (
          <NavbarItem className="flex items-center">
            <Button
              variant="flat"
              color="default"
              startContent={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              }
              onPress={() => router.back()}
              className="text-default-700 bg-content2 hover:bg-content3 border border-divider"
              radius="full"
            >
              {t('Back')}
            </Button>
            <span className="ml-4 font-bold text-lg text-foreground">
              {current}
            </span>
          </NavbarItem>
        )}
      </NavbarContent>

      {
        userState && (
          <NavbarContent as="div" justify="end">
            <Dropdown
              placement="bottom-end"
              shouldBlockScroll={false}
              classNames={{
                content: "bg-content1 border border-divider text-foreground"
              }}
            >
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="success"
                  name={userState.gamertag}
                  size="sm"
                  src={userState.gamerpic}
                />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Profile Actions"
                variant="flat"
                itemClasses={{
                  base: [
                    "data-[hover=true]:bg-content2",
                    "data-[hover=true]:text-foreground",
                    "text-default-600"
                  ]
                }}
              >
                <DropdownItem key="profile" className="h-14 gap-2 text-center" textValue={userState.gamertag}>
                  <p className="text-lg font-bold text-foreground">{userState.gamertag}</p>
                  <p className="font-semibold text-primary">{t('Score')}: {userState.gamerscore}</p>
                </DropdownItem>
                <DropdownItem key="achievements" onPress={() => window.location.assign(`/${locale}/achivements`)}>
                  {t('Achivements')}
                </DropdownItem>
                <DropdownItem key="settings" onPress={() => window.location.assign(`/${locale}/settings`)} showDivider>
                  {t('Settings')}
                </DropdownItem>

                <DropdownItem key="fullscreen" onPress={handleToggleScreen}>{t('Toggle fullscreen')}</DropdownItem>
                <DropdownItem key="logout" color="danger" onPress={handleLouout}>
                  {t('Logout')}
                </DropdownItem>
                <DropdownItem key="exit" className="text-danger" color="danger" onPress={handleExit}>
                  {t('Exit')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        )
      }

    </Navbar >
  );
};

export default Nav;
