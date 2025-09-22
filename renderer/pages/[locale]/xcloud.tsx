import { useEffect, useState, useRef } from "react";
import { Tabs, Tab, Input } from "@heroui/react";
import { useTranslation } from "next-i18next";
import Layout from "../../components/Layout";
import TitleItem from "../../components/TitleItem";
import TitleModal from "../../components/TitleModal";
import Ipc from "../../lib/ipc";
import Nav from "../../components/Nav";
import Loading from "../../components/Loading";
import SearchIcon from "../../components/SearchIcon";
import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";
import { FOCUS_ELEMS } from '../../common/constans';

function Xcloud() {
  const { t } = useTranslation("cloud");

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [isLimited, setIsLimited] = useState(false);
  const [currentTab, setCurrentTab] = useState("Recently");
  const [currentTitle, setCurrentTitle] = useState({});
  const [showTitleDetail, setShowTitleDetail] = useState(false);
  const [titles, setTitles] = useState([]);
  const [newTitles, setNewTitles] = useState([]);
  const [recentTitles, setRecentNewTitles] = useState([]);
  const [orgTitles, setOrgTitles] = useState([]);
  const currentTitles = useRef([]);
  const [keyword, setKeyword] = useState("");

  const currentIndex = useRef(0);
  const focusable = useRef<any>([]);

  const LOCAL_TITLES = 'local-titles';
  const LOCAL_NEW_TITLES = 'local-new-titles';
  const LOCAL_ORG_TITLES = 'local-org-titles';
  const LOCAL_RECENT_TITLES = 'local-recent-titles';

  useEffect(() => {

    setLoading(true);
    setLoadingText(t("Loading..."));
    focusable.current = document.querySelectorAll(FOCUS_ELEMS);

    const localFontSize = localStorage.getItem('fontSize');
    if (localFontSize && localFontSize !== '16') {
      document.documentElement.style.fontSize = localFontSize + 'px';
    }

    const clearAllFocus = () => {
      if (focusable.current) {
        Array.from(focusable.current).forEach(elem => {
          (elem as HTMLElement).style.outline = 'none';
        });
      }
    };

    function nextItem(index) {
      index++;
      currentIndex.current = index % focusable.current.length;
      const elem = focusable.current[currentIndex.current];

      clearAllFocus();

      if (elem) {
        elem.style.outline = '2px solid #FFB900';
        elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function prevItem(index) {
      clearAllFocus();

      if (index === 0) {
        currentIndex.current = focusable.current.length - 1
      } else {
        index -= 1;
        currentIndex.current = index % focusable.current.length;
      }

      const elem = focusable.current[currentIndex.current];

      if (elem) {
        elem.style.outline = '2px solid #FFB900';
        elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function clickItem() {
      setTimeout(() => {
        const elem = focusable.current[currentIndex.current];
        if (elem) {
          elem.style.outline = 'none';
          elem.click();
        }
      }, 300);
    }

    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();
      let _gamepad = null
      gamepads.forEach(gp => {
        if (gp) _gamepad = gp
      })
      if (_gamepad) {
        _gamepad.buttons.forEach((b, idx) => {
          if (b.pressed) {
            if (idx === 0) {
              clickItem();
            } else if (idx === 12) {
              prevItem(currentIndex.current);
            } else if (idx === 13) {
              nextItem(currentIndex.current);
            } else if (idx === 14) {
              prevItem(currentIndex.current);
            } else if (idx === 15) {
              nextItem(currentIndex.current);
            }
          }
        })
      }
    }

    const timer = setInterval(pollGamepads, 100);

    const fetchGames = (silent = false) => {
      console.log('Fetch Games');
      if (silent) {
        console.log('Fetch games silent');
      }
      Ipc.send("xCloud", "getTitles").then((res) => {
        console.log("originTitles:", res.results);
        Ipc.send("xCloud", "getGamePassProducts", res.results).then(
          (_titles) => {
            setTitles(_titles);
            localStorage.setItem(LOCAL_TITLES, JSON.stringify(_titles));

            const _titleMap = {};
            const _orgTitles = [];
            _titles.forEach((item) => {
              _titleMap[item.productId] = item;

              // Get org games
              if (
                !item.XCloudTitleId &&
                item.details &&
                item.details.programs &&
                item.details.programs.indexOf('BYOG') > -1
              ) {
                _orgTitles.push(item);
              }
            });

            setOrgTitles(_orgTitles);
            localStorage.setItem(LOCAL_ORG_TITLES, JSON.stringify(_orgTitles));

            // console.log("_titleMap:", _titleMap);

            // Get new games
            Ipc.send("xCloud", "getNewTitles").then((newTitleRes) => {
              console.log("newTitleRes:", newTitleRes);
              const _newTitles = [];
              newTitleRes.forEach((item) => {
                if (
                  item.id &&
                  _titleMap[item.id] &&
                  (_titleMap[item.id].titleId ||
                    _titleMap[item.id].XCloudTitleId)
                ) {
                  _newTitles.push(_titleMap[item.id]);
                }
              });
              setNewTitles(_newTitles);
              localStorage.setItem(LOCAL_NEW_TITLES, JSON.stringify(_newTitles));

              // Get recent games
              Ipc.send("xCloud", "getRecentTitles").then((recentTitleRes) => {
                console.log("recentTitleRes:", recentTitleRes.results);
                const results = recentTitleRes.results || [];
                const _recentTitles = [];
                results.forEach((item) => {
                  if (item.details && item.details.productId) {
                    const productId = item.details.productId;
                    const productIdUp = productId.toUpperCase();
                    if (_titleMap[productId] || _titleMap[productIdUp]) {
                      _recentTitles.push(
                        _titleMap[productId] || _titleMap[productIdUp]
                      );
                    }
                  }
                });
                console.log("_recentTitles:", _recentTitles);
                setRecentNewTitles(_recentTitles);
                localStorage.setItem(LOCAL_RECENT_TITLES, JSON.stringify(_recentTitles));
                setLoading(false);

                setTimeout(() => {
                  focusable.current = document.querySelectorAll(FOCUS_ELEMS);
                },  1000);
              }).catch(e => {
                console.log(e);
              });
            }).catch(e => {
              console.log(e);
            });
          }).then(e => {
            console.log(e);
          });
      }).catch(e => {
        console.log(e)
      });
    };

    Ipc.send("app", "getAppLevel").then((appLevel) => {
      console.log("appLevel:", appLevel);
      if (appLevel !== 2) {
        setIsLimited(true);
        setLoading(false);
      } else {
        console.log('get from cache')
        // Get xcloud data from cache
        let cacheTitles: any = localStorage.getItem(LOCAL_TITLES) || '[]';
        let cacheNewTitles: any = localStorage.getItem(LOCAL_NEW_TITLES) || '[]';
        let cacheOrgTitles: any = localStorage.getItem(LOCAL_ORG_TITLES) || '[]';
        let cacheRecentTitles: any = localStorage.getItem(LOCAL_RECENT_TITLES) || '[]';

        try {
          cacheTitles = JSON.parse(cacheTitles);
          cacheNewTitles = JSON.parse(cacheNewTitles);
          cacheOrgTitles = JSON.parse(cacheOrgTitles);
          cacheRecentTitles = JSON.parse(cacheRecentTitles);
          
          if (cacheTitles.length || cacheNewTitles.length || cacheOrgTitles.length || cacheRecentTitles.length) {
            setTitles(cacheTitles);
            setOrgTitles(cacheOrgTitles);
            setNewTitles(cacheNewTitles);
            setRecentNewTitles(cacheRecentTitles);
            setLoading(false);

            setTimeout(() => {
              focusable.current = document.querySelectorAll(FOCUS_ELEMS);
            },  1000);

            fetchGames(true);
          } else {
            fetchGames();
          }
        } catch (e) {

          console.log('error:', e)
          fetchGames();
        }
      }
    });

    return () => {
      timer && clearInterval(timer);
    }
  }, [t]);

  const handleViewTitleDetail = (titleItem: any) => {
    console.log("titleItem:", titleItem);
    setCurrentTitle(titleItem);
    setShowTitleDetail(true);
    setTimeout(() => {
      const dialog = document.querySelector('[role="dialog"]');
      focusable.current = dialog.querySelectorAll(FOCUS_ELEMS);
    },  800);
  };

  const handleTabChange = (tab: string) => {
    if (tab === currentTab) {
      return
    }
    setCurrentTab(tab);
    currentTitles.current = [];
    setLoading(true);
    setLoadingText(t("Loading..."));
    setTimeout(() => {
      setLoading(false);
      setTimeout(() => {
        focusable.current = document.querySelectorAll(FOCUS_ELEMS);
      }, 1000);
    }, 500);
  };

  switch (currentTab) {
    case "Recently":
      currentTitles.current = recentTitles;
      break;
    case "Newest":
      currentTitles.current = newTitles;
      break;
    case "Own":
      currentTitles.current = orgTitles;
      break;
    case "All":
      currentTitles.current = titles;
      break;
    default:
      currentTitles.current = [];
      break;
  }

  return (
    <>
      <Nav current={t("Xcloud")} isLogined={true} />

      {loading && <Loading loadingText={loadingText} />}

      <Layout>
        {showTitleDetail && (
          <TitleModal
            id="titleModal"
            title={currentTitle}
            onClose={() => {
              setShowTitleDetail(false);
              setTimeout(() => {
                focusable.current = document.querySelectorAll(FOCUS_ELEMS);
              },  500);
            }}
          />
        )}

        {isLimited ? (
          <div>{t("NoXGP")}</div>
        ) : (
          <>
            <div className="flex justify-between">
              <div className="flex-1">
                <Tabs aria-label="Options" onSelectionChange={handleTabChange}>
                  <Tab key="Recently" title={t("Recently")}></Tab>
                  <Tab key="Newest" title={t("Newest")}></Tab>
                  <Tab key="Own" title={t("Own")}></Tab>
                  <Tab key="All" title={t("All")}></Tab>
                </Tabs>
              </div>
              <div className="w-50">
                <Input
                  label={t("Search")}
                  size="sm"
                  isClearable
                  classNames={{
                    label: "text-black/50 dark:text-white/90",
                    input: [
                      "bg-transparent",
                      "text-black/90 dark:text-white/90",
                      "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                    ],
                    innerWrapper: ["bg-transparent"],
                    inputWrapper: [
                      "shadow-xl",
                      "bg-default-200/50",
                      "dark:bg-default/60",
                      "backdrop-blur-xl",
                      "backdrop-saturate-200",
                      "hover:bg-default-200/70",
                      "dark:hover:bg-default/70",
                      "group-data-[focus=true]:bg-default-200/50",
                      "dark:group-data-[focus=true]:bg-default/60",
                      "!cursor-text",
                    ],
                  }}
                  startContent={
                    <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
                  }
                  onValueChange={(value) => {
                    setKeyword(value);
                  }}
                />
              </div>
            </div>

            {!loading && currentTitles.current && (
              <div className="gap-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 pt-10">
                {currentTitles.current.map((title, idx) => {
                  if (keyword) {
                    if (title.ProductTitle.toUpperCase().indexOf(keyword.toUpperCase()) > -1) {
                      return (
                        <TitleItem
                          title={title}
                          key={idx}
                          onClick={handleViewTitleDetail}
                        />
                      );
                    } else {
                      return null;
                    }
                  } else {
                    return (
                      <TitleItem
                        title={title}
                        key={idx}
                        onClick={handleViewTitleDetail}
                      />
                    );
                  }
                })}
              </div>
            )}
          </>
        )}
      </Layout>
    </>
  );
}

export default Xcloud;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "cloud"]);

// eslint-disable-next-line react-refresh/only-export-components
export {getStaticPaths};
