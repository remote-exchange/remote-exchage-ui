import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import BigNumber from 'bignumber.js';

import {Badge, Button, IconButton, Typography, Tooltip} from "@mui/material";
import {withStyles, withTheme} from "@mui/styles";

import Navigation from "../navigation";
import Unlock from "../unlock";
import TransactionQueue from "../transactionQueue";

import {ACTIONS} from "../../stores/constants";

import stores from "../../stores";
import {formatAddress} from "../../utils";

import classes from "./header.module.css";
import TopHeader from "../../ui/TopHeader";
import Logo from "../../ui/Logo";
import {useAppThemeContext} from '../../ui/AppThemeProvider';
import {WrongNetwork} from '../ssWrongNetwork/ssWrongNetwork';
import {WalletConnect} from "../WalletConnect/WalletConnect";
import {useEthers} from "@usedapp/core";

const {
  CONNECT_WALLET,
  ACCOUNT_CONFIGURED,
  ACCOUNT_CHANGED,
} = ACTIONS;

const StyledBadge = withStyles((theme) => ({
  badge: {
    position: 'absolute',
    top: 0,
    right: 2,
    background: "#4FC83A",
    // color: "#ffffff",
    width: 8,
    height: 8,
    minWidth: 8,
    padding: 0,
    transform: 'none',
    // fontSize: 8,
  },
}))(Badge);

const StatButton = () => {
  const {appTheme} = useAppThemeContext();

  return (
      <Tooltip
          title={<div className={classes.tooltipContent} />}
          placement="bottom"
          componentsProps={{}}
          classes={{ tooltip: classes.tooltip }}
      >
        <div
          className={[classes.statButton, 'g-flex', 'g-flex--align-center'].join(' ')}
          onClick={() => window.open("https://info.remote.exchange/home", "_blank")}
        >
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M0.87868 0.87868C0 1.75736 0 3.17157 0 6V12C0 14.8284 0 16.2426 0.87868 17.1213C1.75736 18 3.17157 18 6 18H14C16.8284 18 18.2426 18 19.1213 17.1213C20 16.2426 20 14.8284 20 12V6C20 3.17157 20 1.75736 19.1213 0.87868C18.2426 0 16.8284 0 14 0H6C3.17157 0 1.75736 0 0.87868 0.87868ZM14 5C14.5523 5 15 5.44772 15 6V14C15 14.5523 14.5523 15 14 15C13.4477 15 13 14.5523 13 14V6C13 5.44772 13.4477 5 14 5ZM7 8C7 7.44772 6.55228 7 6 7C5.44772 7 5 7.44772 5 8V14C5 14.5523 5.44772 15 6 15C6.55229 15 7 14.5523 7 14V8ZM11 10C11 9.44772 10.5523 9 10 9C9.44772 9 9 9.44772 9 10V14C9 14.5523 9.44772 15 10 15C10.5523 15 11 14.5523 11 14V10Z" fill="#9A9FAF"/>
          </svg>

          <span style={{display: 'flex', alignItems: 'center', marginLeft: 10}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.43 18.8201C14.24 18.8201 14.05 18.7501 13.9 18.6001C13.61 18.3101 13.61 17.8301 13.9 17.5401L19.44 12.0001L13.9 6.46012C13.61 6.17012 13.61 5.69012 13.9 5.40012C14.19 5.11012 14.67 5.11012 14.96 5.40012L21.03 11.4701C21.32 11.7601 21.32 12.2401 21.03 12.5301L14.96 18.6001C14.81 18.7501 14.62 18.8201 14.43 18.8201Z" fill="#9A9FAF"/>
              <path d="M20.33 12.75H3.5C3.09 12.75 2.75 12.41 2.75 12C2.75 11.59 3.09 11.25 3.5 11.25H20.33C20.74 11.25 21.08 11.59 21.08 12C21.08 12.41 20.74 12.75 20.33 12.75Z" fill="#9A9FAF"/>
            </svg>
          </span>
        </div>
      </Tooltip>
  )
}

function Header(props) {
  const accountStore = stores.accountStore.getStore("account");
  const web3ModalStore = stores.accountStore.getStore("web3modal");
  const router = useRouter();

  const [account, setAccount] = useState(accountStore);
  const [maticBalance, setMaticBalance] = useState();
  // const [darkMode, setDarkMode] = useState(props.theme.palette.mode === "dark",);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [chainInvalid, setChainInvalid] = useState(false);
  // const [loading, setLoading] = useState(false);
  const [transactionQueueLength, setTransactionQueueLength] = useState(0);
  const [warningOpen, setWarningOpen] = useState(false);
  const {deactivate} = useEthers();

  const web = async (add) => {
    const maticbalance = await stores.accountStore.getWeb3Provider();
    let bal = await maticbalance.eth.getBalance(add);
    setMaticBalance(BigNumber(bal).div(10 ** 18).toFixed(2));

  };
  useEffect(() => {

    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore("account");
      if (accountStore) {
        web(accountStore);
      }
      setAccount(accountStore);
      closeUnlock();
    };
    const connectWallet = () => {
      disconnectWallet();
    };

    const accountChanged = () => {
      const invalid = stores.accountStore.getStore("chainInvalid");
      setChainInvalid(invalid);
      setWarningOpen(invalid);
    };

    const invalid = stores.accountStore.getStore("chainInvalid");
    setChainInvalid(invalid);
    setWarningOpen(invalid);

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(CONNECT_WALLET, connectWallet);
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);

    accountConfigure();
    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(CONNECT_WALLET, connectWallet);
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
    };
  }, [maticBalance, accountStore?.chainId]);

  // const openWarning = () => {
  //   setWarningOpen(true);
  // };
  //
  // const closeWarning = () => {
  //   setWarningOpen(false);
  // };

  const disconnectWallet = () => {
    stores.accountStore.getStore("web3modal").clearCachedProvider();
    deactivate();
    setAccount(null);
    stores.accountStore.setStore({
      account: {address: null},
      web3provider: null,
      web3context: {
        library: {
          provider: null,
        },
      },
    });
    // stores.dispatcher.dispatch({
    //   type: ACTIONS.CONFIGURE_SS,
    //   content: {connected: false},
    // });
    window.localStorage.removeItem("walletconnect");
    window.localStorage.removeItem("WEB3_CONNECT_CACHED_PROVIDER");
    stores.accountStore.emitter.emit(ACTIONS.DISCONNECT_WALLET);
  };

  // const handleClickAway = () => {
  //   setAnchorEl(false);
  // };

  const closeUnlock = () => {
    setUnlockOpen(false);

    if (chainInvalid) {
      setWarningOpen(true);
    }
  };

  // useEffect(function () {
  //   const localStorageDarkMode = window.localStorage.getItem(
  //     "remote.finance-dark-mode",
  //   );
  //   // setDarkMode(localStorageDarkMode ? localStorageDarkMode === "dark" : true);
  // }, []);
  //
  // const navigate = (url) => {
  //   router.push(url);
  // };
  //
  // const callClaim = () => {
  //   setLoading(true);
  //   stores.dispatcher.dispatch({
  //     type: FIXED_FOREX_CLAIM_VECLAIM,
  //     content: {},
  //   });
  // };

  const switchChain = async () => {
    let hexChain = "0x" + Number(process.env.NEXT_PUBLIC_CHAINID).toString(16);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{chainId: hexChain}],
      });
    } catch (switchError) {
      console.log("switch error", switchError);
    }
  };

  const setQueueLength = (length) => {
    setTransactionQueueLength(length);
  };

  const [anchorEl, setAnchorEl] = React.useState(false);

  const handleClick = () => {
    setAnchorEl(!anchorEl);
  };

  const [_visible, _setVisible] = useState(true);
  const _onModalClose = () => {
    _setVisible(false);
  }

  const {appTheme} = useAppThemeContext();

  return (
    <TopHeader>
      <div className={[classes.headerContainer, classes[`headerContainer--${appTheme}`]].join(' ')}>
        <div className={classes.logoContainer}>
          <a className={classes.logoLink} onClick={() => router.push("/home")}>
            <Logo />
          </a>
          {/*<Typography className={ classes.version}>version 0.0.30</Typography>*/}
        </div>

        <Navigation>
          <div className={classes.statButtonMobileWrapper}>
            {StatButton()}
          </div>
        </Navigation>

        <div className={classes.userBlock}>
          {/* {process.env.NEXT_PUBLIC_CHAINID == "80001" && (
            <div className={classes.testnetDisclaimer}>
              <Typography
                className={[classes.testnetDisclaimerText, classes[`testnetDisclaimerText--${appTheme}`]].join(' ')}>
                Mumbai Testnet
              </Typography>
            </div>
          )}
          {process.env.NEXT_PUBLIC_CHAINID == "137" && (
            <div className={classes.testnetDisclaimer}>
              <Typography
                className={[classes.testnetDisclaimerText, classes[`testnetDisclaimerText--${appTheme}`]].join(' ')}>
                Matic Mainnet
              </Typography>
            </div>
          )} */}

          {transactionQueueLength > 0 ? (
            <IconButton
              className={classes.notificationsButton}
              variant="contained"
              color="primary"
              onClick={() => {
                stores.emitter.emit(ACTIONS.TX_OPEN);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M13.7942 3.29494C13.2297 3.10345 12.6259 3 12 3C9.15354 3 6.76223 5.14032 6.44789 7.96942L6.19608 10.2356L6.18963 10.2933C6.06068 11.417 5.69492 12.5005 5.11649 13.4725L5.0867 13.5222L4.50866 14.4856C3.98411 15.3599 3.72183 15.797 3.77845 16.1559C3.81613 16.3946 3.93902 16.6117 4.12438 16.7668C4.40295 17 4.91273 17 5.93227 17H18.0678C19.0874 17 19.5971 17 19.8757 16.7668C20.0611 16.6117 20.184 16.3946 20.2216 16.1559C20.2783 15.797 20.016 15.3599 19.4914 14.4856L18.9134 13.5222L18.8836 13.4725C18.4274 12.7059 18.1034 11.8698 17.9237 10.9994C15.1975 10.9586 13 8.73592 13 6C13 5.00331 13.2917 4.07473 13.7942 3.29494ZM16.2741 4.98883C16.0999 5.28551 16 5.63109 16 6C16 6.94979 16.6621 7.74494 17.5499 7.94914C17.4205 6.82135 16.9609 5.80382 16.2741 4.98883Z" fill="#7DB857"/>
                <path d="M9 17C9 17.394 9.0776 17.7841 9.22836 18.1481C9.37913 18.512 9.6001 18.8427 9.87868 19.1213C10.1573 19.3999 10.488 19.6209 10.8519 19.7716C11.2159 19.9224 11.606 20 12 20C12.394 20 12.7841 19.9224 13.1481 19.7716C13.512 19.6209 13.8427 19.3999 14.1213 19.1213C14.3999 18.8427 14.6209 18.512 14.7716 18.1481C14.9224 17.7841 15 17.394 15 17L12 17H9Z" fill="#7DB857"/>
                <circle cx="18" cy="6" r="2.5" fill="#7DB857" stroke="#7DB857"/>
              </svg>
            </IconButton>
          ) : (
            <IconButton
              className={[classes.notificationsButton, classes.notificationsButtonDisabled].join(' ')}
              variant="contained"
              color="primary"
            >
              <StyledBadge overlap="circular">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.50248 6.97519C6.78492 4.15083 9.16156 2 12 2C14.8384 2 17.2151 4.15083 17.4975 6.97519L17.7841 9.84133C17.8016 10.0156 17.8103 10.1028 17.8207 10.1885C17.9649 11.3717 18.3717 12.5077 19.0113 13.5135C19.0576 13.5865 19.1062 13.6593 19.2034 13.8051L20.0645 15.0968C20.8508 16.2763 21.244 16.866 21.0715 17.3412C21.0388 17.4311 20.9935 17.5158 20.9368 17.5928C20.6371 18 19.9283 18 18.5108 18H5.48923C4.07168 18 3.36291 18 3.06318 17.5928C3.00651 17.5158 2.96117 17.4311 2.92854 17.3412C2.75601 16.866 3.14916 16.2763 3.93548 15.0968L4.79661 13.8051C4.89378 13.6593 4.94236 13.5865 4.98873 13.5135C5.62832 12.5077 6.03508 11.3717 6.17927 10.1885C6.18972 10.1028 6.19844 10.0156 6.21587 9.84133L6.50248 6.97519Z" fill="#9A9FAF"/>
                  <path d="M10.0681 20.6294C10.1821 20.7357 10.4332 20.8297 10.7825 20.8967C11.1318 20.9637 11.5597 21 12 21C12.4403 21 12.8682 20.9637 13.2175 20.8967C13.5668 20.8297 13.8179 20.7357 13.9319 20.6294" stroke="#9A9FAF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </StyledBadge>
            </IconButton>
          )}

          <div className={classes.network}>
            <img src="/images/ui/network.png" />
          </div>

          {account? (
            <div className={classes.accountButtonContainer}>
              <Button
                disableElevation
                className={[
                  classes.accountButton, classes[`accountButton--${appTheme}`],
                  anchorEl ? classes.accountButtonActive : '',
                ].join(' ')}
                variant="contained"
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleClick}
              >
                <div
                  className={[classes.accountButtonAddress, 'g-flex', 'g-flex--align-center'].join(' ')}>
                  {account&& (
                    <>
                      <div
                        className={`${classes.accountIcon} ${web3ModalStore?.cachedProvider === 'walletconnect' ? 
                          classes.walletConnect : 
                          (web3ModalStore?.cachedProvider === 'walletlink' ? classes.coinbase : classes.metamask)}`}
                        style={{marginRight: 8}}>
                      </div>

                      {/* <div
                        style={{
                          marginLeft: 5,
                          marginRight: 5,
                          color: appTheme === "dark" ? '#ffffff' : '#0B5E8E',
                        }}
                      >
                        •
                      </div> */}
                    </>
                  )}
                  <Typography className={classes.headBtnTxt}>
                    <span className={classes.headBtnTxtDesktop}>
                      {account
                        ? formatAddress(account)
                        : "Connect Wallet"}
                    </span>
                    <span className={classes.headBtnTxtMobile}>
                      {account
                        ? formatAddress(account, "shortest")
                        : "Connect Wallet"}
                    </span>
                  </Typography>
                </div>

                <Typography
                  className={[classes.headBalanceTxt, classes[`headBalanceTxt--${appTheme}`], 'g-flex', 'g-flex--align-center'].join(' ')}>
                  {maticBalance ? maticBalance : 0} BNB
                </Typography>
              </Button>

              {anchorEl &&

                <div
                  className={[classes.headSwitchBtn, classes[`headSwitchBtn--${appTheme}`], 'g-flex', 'g-flex--align-center'].join(' ')}
                  onClick={disconnectWallet}>
                  <img
                    src="/images/ui/wallet.svg"
                    width={24}
                    className={classes.walletIcon}
                    style={{marginBottom: 2}}
                  />

                  <div style={{
                    marginLeft: 5,
                    marginRight: 5,
                    color: '#ffffff',
                  }}>
                    •
                  </div>

                  <div className={classes.headSwitchBtnText}>
                    Disconnect Wallet
                  </div>
                </div>
              }
            </div>
          ) : (
            <WalletConnect>
              {({connect}) => {
                return (
                  <Button
                    onClick={connect}
                    className={classes.connectButton}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 5C20.5523 5 21 4.55228 21 4C21 3.44772 20.5523 3 20 3V5ZM5.50001 5L20 5V3L5.50001 3L5.50001 5ZM5.50001 10H13.5V8L5.50001 8V10ZM4.00001 6.5C4.00001 5.67157 4.67158 5 5.50001 5L5.50001 3C3.56701 3 2.00001 4.567 2.00001 6.5L4.00001 6.5ZM2.00001 6.5C2.00001 8.433 3.56701 10 5.50001 10V8C4.67158 8 4.00001 7.32843 4.00001 6.5L2.00001 6.5Z" fill="#7DB857"/>
                      <path d="M3 12L3 6.5" stroke="#7DB857" strokeWidth="2"/>
                      <path d="M3 8.5H2.5V9L2.5 19V19.0329C2.49998 19.4762 2.49995 19.8581 2.54107 20.1639C2.58514 20.4917 2.68451 20.8058 2.93934 21.0607L2.93934 21.0607C3.19417 21.3155 3.50835 21.4149 3.83611 21.4589C4.14193 21.5 4.52384 21.5 4.96708 21.5L5 21.5L19 21.5C19.011 21.5 19.022 21.5 19.0329 21.5C19.4762 21.5 19.8581 21.5 20.1639 21.4589C20.4917 21.4149 20.8058 21.3155 21.0607 21.0607C21.3155 20.8058 21.4149 20.4917 21.4589 20.1639C21.5 19.8581 21.5 19.4762 21.5 19.0329C21.5 19.022 21.5 19.011 21.5 19V18V17.5H21H18C16.6193 17.5 15.5 16.3807 15.5 15C15.5 13.6193 16.6193 12.5 18 12.5H21H21.5V12V11L21.5 10.9671C21.5 10.5238 21.5 10.1419 21.4589 9.8361C21.4149 9.50835 21.3155 9.19417 21.0607 8.93934C20.8058 8.68451 20.4917 8.58514 20.1639 8.54107C19.8581 8.49995 19.4762 8.49997 19.0329 8.5L19 8.5L3 8.5Z" fill="#7DB857" stroke="#7DB857"/>
                    </svg>

                    <span style={{marginLeft: 15, whiteSpace: 'nowrap',}}>Connect Wallet</span>
                  </Button>
                )
              }}
            </WalletConnect>

            // <Button
            //   style={{
            //     marginLeft: !account?.address ? 14 : 0,
            //   }}
            //   disableElevation
            //   className={[classes.accountButton, classes[`accountButton--${appTheme}`], !account?.address ? classes[`accountButtonConnect--${appTheme}`] : ''].join(' ')}
            //   variant="contained"
            //   onClick={onAddressClicked}
            // >
            //   {account && account.address && (
            //     <div
            //       className={`${classes.accountIcon} ${classes.metamask}`}
            //     ></div>
            //   )}

            //   {!account?.address && (
            //     <img src="/images/ui/icon-wallet.svg" className={classes.walletIcon}/>
            //   )}

            //   <div className={classes.walletPointContainer}>
            //     <div className={[classes.walletPoint, classes[`walletPoint--${appTheme}`]].join(' ')}>
            //     </div>
            //   </div>

            //   <Typography
            //     className={classes.headBtnTxt}>
            //     {account && account.address
            //       ? formatAddress(account.address)
            //       : "Connect Wallet"}
            //   </Typography>
            // </Button>
          )}

          <div className={classes.statButtonDesktopWrapper}>
            {StatButton()}
          </div>

          {/* <ThemeSwitcher/> */}

        </div>
        {unlockOpen && (
          <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />
        )}
        <TransactionQueue setQueueLength={setQueueLength} />
      </div>

      {warningOpen &&
        <WrongNetwork visible={_visible} onClose={_onModalClose} onSwitch={switchChain} />

        // <SSWarning
        //   close={switchChain}
        //   title={'Wrong Network:'}
        //   subTitle={'The chain you are connected is not supported!'}
        //   icon={'icon-network'}
        //   description={'Please check that your wallet is connected to Polygon Mainnet, only after you can proceed.'}
        //   btnLabel1={'Switch to Polygon Mainnet'}
        //   btnLabel2={'Switch Wallet Provider'}
        //   action2={onAddressClicked}/>
      }
    </TopHeader>
  );
}

export default withTheme(Header);
