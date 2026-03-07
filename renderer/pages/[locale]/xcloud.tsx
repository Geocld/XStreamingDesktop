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
  const currentTitles = useRef([]);
  const [keyword, setKeyword] = useState("");

  const currentIndex = useRef(0);
  const focusable = useRef<any>([]);

  const LOCAL_TITLES = 'local-titles';
  const LOCAL_NEW_TITLES = 'local-new-titles';
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
            _titles.forEach(item => {
              _titleMap[item.productId] = item;
            });

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
                }, 1000);
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
        let cacheRecentTitles: any = localStorage.getItem(LOCAL_RECENT_TITLES) || '[]';

        try {
          cacheTitles = JSON.parse(cacheTitles);
          cacheNewTitles = JSON.parse(cacheNewTitles);
          cacheRecentTitles = JSON.parse(cacheRecentTitles);

          if (cacheTitles.length || cacheNewTitles.length || cacheRecentTitles.length) {
            setTitles(cacheTitles);
            setNewTitles(cacheNewTitles);
            setRecentNewTitles(cacheRecentTitles);
            setLoading(false);

            setTimeout(() => {
              focusable.current = document.querySelectorAll(FOCUS_ELEMS);
            }, 1000);

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
    }, 800);
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
              }, 500);
            }}
          />
        )}

        {isLimited ? (
          <div className="flex items-center justify-center h-full text-white/50">{t("NoXGP")}</div>
        ) : (
          <div className="flex flex-col w-full max-w-[1800px] mx-auto pb-10 -mt-5">
            {/* Integrated Non-Sticky Filter Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 py-3 w-full border-none bg-transparent">
              <div className="w-full md:w-auto">
                {/* @ts-ignore - HeroUI outdated type definition for children JSX elements */}
                <Tabs
                  aria-label="Game Filters"
                  onSelectionChange={handleTabChange as any}
                  radius="full"
                  size="sm"
                  classNames={{
                    tabList: "bg-content1 border border-divider p-0.5 shadow-inner",
                    cursor: "bg-content3 shadow-sm rounded-full",
                    tab: "max-w-fit px-4 h-6",
                    tabContent: "text-default-500 group-data-[selected=true]:text-foreground font-medium text-[11px] tracking-wide"
                  }}
                >
                  {[
                    { id: "Recently", label: t("Recently") },
                    { id: "Newest", label: t("Newest") },
                    { id: "All", label: t("All") }
                  ].map((item) => (
                    <Tab key={item.id} title={item.label} />
                  ))}
                </Tabs>
              </div>

              <div className="w-full md:w-[240px]">
                <Input
                  isClearable
                  placeholder={t("Search games...")}
                  size="sm"
                  variant="flat"
                  radius="full"
                  classNames={{
                    base: "w-full",
                    input: [
                      "text-foreground",
                      "placeholder:text-default-400",
                      "text-[11px]",
                      "outline-none",
                      "focus:outline-none",
                      "border-none",
                      "ring-0",
                      "focus:ring-0",
                      "shadow-none",
                      "bg-transparent"
                    ],
                    innerWrapper: "bg-transparent border-none shadow-none ring-0",
                    inputWrapper: [
                      "bg-content1",
                      "border",
                      "border-divider",
                      "shadow-inner",
                      "hover:bg-content2",
                      "transition-all",
                      "group-data-[focused=true]:bg-content1/80",
                      "group-data-[focused=true]:border-primary",
                      "h-8",
                      "min-h-[32px]",
                      "px-3"
                    ],
                  }}
                  startContent={
                    <SearchIcon className="text-default-500 flex-shrink-0 w-3.5 h-3.5 mr-1" />
                  }
                  onValueChange={(value) => {
                    setKeyword(value);
                  }}
                />
              </div>
            </div>

            {/* Unified Responsive Grid */}
            {!loading && currentTitles.current && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 md:gap-4 content-start">
                {currentTitles.current.map((title, idx) => {
                  if (keyword) {
                    if (title.ProductTitle.toUpperCase().includes(keyword.toUpperCase())) {
                      return (
                        <TitleItem
                          title={title}
                          key={idx}
                          onClick={handleViewTitleDetail}
                        />
                      );
                    }
                    return null;
                  }
                  return (
                    <TitleItem
                      title={title}
                      key={idx}
                      onClick={handleViewTitleDetail}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Layout>
    </>
  );
}

export default Xcloud;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "cloud"]);

// eslint-disable-next-line react-refresh/only-export-components
export { getStaticPaths };
