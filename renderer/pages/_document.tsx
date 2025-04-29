import { Html, Head, Main, NextScript } from 'next/document';
import i18next from "../../next-i18next.config.js";

export default function Document() {
  return (
    <Html lang={i18next.i18n.defaultLocale} style={{fontSize: '16px'}}>
      <Head>
        <style id="video-css"></style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}