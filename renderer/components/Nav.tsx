import { useEffect, useState } from 'react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleLouout = () => {
    Ipc.send("app", "clearData");
  }

  const handleToggleScreen = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      Ipc.send("app", "toggleFullscreen")
    }
  }

  const handleExit = () => {
    Ipc.send("app", "quit")
  }

  const renderBrandInfo = () => (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <p className="font-bold text-inherit">XStreaming</p>
      {
        newVersions ? (
          <Popover color="default" placement="bottom">
            <PopoverTrigger>
              <Button color="success" size="sm" variant="light">
                {t('newVersion')}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="px-1 py-2">
                <div className="text-small">{t('curVerson')}: <span className="text-yellow-500 pl-1">v{newVersions.version}</span></div>
                <div className="text-small">{t('latestVerson')}: <span className="text-green-500 pl-1">v{newVersions.latestVer}</span></div>
                <div className="text-center">
                  <Button color="success" size="sm" variant="light" onPress={() => {
                    window.open(newVersions.url, '_blank')
                  }}>
                    {t('Download')}
                  </Button>
                </div>

              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-small text-gray-500">v{pkg.version}</span>
        )
      }
    </div>
  )

  return (
    <Navbar maxWidth="full" className="bg-background border-b border-divider" style={{ zIndex: 100 }}>
      <NavbarContent className="min-w-0 flex-1 basis-0 gap-2" justify="start">
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
          <NavbarItem className="flex items-center min-w-0">
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
            <span className="ml-3 font-bold text-lg text-foreground truncate">
              {current}
            </span>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarBrand className="grow-0 shrink-0 px-2">
        {renderBrandInfo()}
      </NavbarBrand>

      {
        userState && (
          <NavbarContent as="div" justify="end" className="flex-1 basis-0 gap-2">

            <Dropdown
              placement="bottom-end"
              shouldBlockScroll={false}
              classNames={{
                content: "bg-content1 border border-divider text-foreground min-w-[200px]"
              }}
            >
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="bg-content1/50 border border-divider hover:bg-content2 h-10 px-2 pl-1 shadow-sm transition-all rounded-full"
                >
                  <Avatar
                    isBordered
                    color="success"
                    name={userState.gamertag}
                    size="sm"
                    src={userState.gamerpic}
                    className="w-7 h-7"
                  />
                  <div className="flex flex-col items-start justify-center ml-1 pr-2">
                    <span className="text-xs font-bold text-foreground leading-none">{userState.gamertag}</span>
                    <span className="text-[10px] font-semibold text-primary/80 leading-none mt-0.5">
                      ⭐ {userState.gamerscore}
                    </span>
                  </div>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Profile Actions"
                variant="flat"
                itemClasses={{
                  base: [
                    "data-[hover=true]:bg-content2",
                    "data-[hover=true]:text-foreground",
                    "text-default-700 font-medium py-2"
                  ]
                }}
              >
                <DropdownItem key="achievements" onPress={() => window.location.assign(`/${locale}/achivements`)}>
                  {t('Achivements')}
                </DropdownItem>
                <DropdownItem key="settings" onPress={() => window.location.assign(`/${locale}/settings`)} showDivider>
                  {t('Settings')}
                </DropdownItem>

                <DropdownItem key="logout" color="danger" onPress={handleLouout} className="text-danger mt-1">
                  {t('Logout')}
                </DropdownItem>
                <DropdownItem key="exit" className="text-danger" color="danger" onPress={handleExit}>
                  {t('Exit')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Button
              isIconOnly
              variant="flat"
              onPress={() => {
                handleToggleScreen();
              }}
              className="bg-content1 border border-divider text-default-500 hover:text-foreground hover:bg-content2 shadow-sm"
              aria-label={t('Toggle fullscreen')}
            >
              {document.fullscreenElement ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3h-3m18 0h-3v-3m0 18v-3h3M3 16h3v3"></path>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              )}
            </Button>
          </NavbarContent>
        )
      }
      {
        !userState && (
          <NavbarContent justify="end" className="flex-1 basis-0" />
        )
      }

    </Navbar >
  );
};

export default Nav;
