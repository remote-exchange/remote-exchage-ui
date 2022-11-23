import Head from "next/head";
import classes from "./layout.module.css";
import Header from "../header";
import SnackbarController from "../snackbar";
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import {DAPP_NAME, NETWORK_NAME} from "../../stores/constants"

export default function Layout({
  children,
  configure,
  backClicked,
  changeTheme,
  title
}) {
  const { appTheme } = useAppThemeContext();

  const isHomePage = window.location.pathname === '/home'

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
        {/*<link
          rel="preload"
          href="/fonts/PT-Root-UI/PT-Root-UI_Regular.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/PT-Root-UI/PT-Root-UI_Bold.ttf"
          as="font"
          crossOrigin=""
        />*/}
        <meta name="description" content={`${DAPP_NAME} allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on ${NETWORK_NAME}.`} />
        <meta name="og:title" content={DAPP_NAME} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div
        className={[
          classes.content,
          classes[`content--${appTheme}`],
          isHomePage ? classes[`homePage--${appTheme}`] : '',
          'g-flex-column'
        ].join(' ')}
      >
        {!configure && (
          <Header backClicked={backClicked} changeTheme={changeTheme} title={ title } />
        )}
        <SnackbarController />
        <main
          className={[
            classes.main,
            isHomePage ? classes.mainHome : '',
            'g-flex-column__item',
            'g-flex-column',
            'g-scroll-y'
          ].join(' ')}
        >
          <div className={[classes.containerInner, 'g-flex-column'].join(' ')}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
