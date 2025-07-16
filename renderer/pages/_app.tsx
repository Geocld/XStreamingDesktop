import {HeroUIProvider} from "@heroui/react";
import {ToastProvider} from "@heroui/toast";
import { appWithTranslation } from 'next-i18next';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React from "react";

import { UserProvider } from "../context/userContext";
import "../styles.css";

const  App = ({ Component, pageProps }) => {
  React.useEffect(() => {
    const errorHandler = function (event) {
      console.error(
        "Unhandled rejection (promise: ",
        event.promise,
        ", reason: ",
        event.reason,
        ")."
      );
      if (event.reason.status) {
        alert(
          "HTTP Status: " +
            event.reason.status +
            "\nPath:" +
            event.reason.url +
            "\n" +
            event.reason.body
        );
      }
    };
    window.addEventListener("unhandledrejection", errorHandler);

    // cleanup this component
    return () => {
      window.removeEventListener("unhandledrejection", errorHandler);

      // if(authInterval)
      //     clearInterval(authInterval)
    };
  }, []);

  return (
    <HeroUIProvider>
      <ToastProvider />
      <NextThemesProvider attribute="class" defaultTheme={'xbox-dark'}>
        <UserProvider>
          <Component {...pageProps} />
        </UserProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export default appWithTranslation(App)