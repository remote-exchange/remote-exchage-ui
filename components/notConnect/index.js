import React, { useState, useEffect } from 'react';
import { Typography, Paper } from "@mui/material";
import { ACTIONS } from '../../stores/constants';
import stores from '../../stores';
import classes from './notConnect.module.css';
import BtnEnterApp from '../../ui/BtnEnterApp';
import {WalletConnect} from "../WalletConnect";

export const NotConnect = (props) => {
  const { title, description, buttonText } = props;

  const [account, setAccount] = useState(stores.accountStore.getStore('account'));

  useEffect(() => {
    const accountConfigure = () => {
      setAccount(stores.accountStore.getStore('account'));
    };
    const connectWallet = () => {
      onAddressClicked();
    };

    const disconnectWallet = () => {
      setAccount(null)
    }

    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(ACTIONS.CONNECT_WALLET, connectWallet);
    stores.emitter.on(ACTIONS.DISCONNECT_WALLET, disconnectWallet);

    return () => {
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(ACTIONS.CONNECT_WALLET, connectWallet);
      stores.emitter.removeListener(ACTIONS.DISCONNECT_WALLET, disconnectWallet);
    };
  }, []);

  return (
    <>
      {(account && typeof account === 'string') ? (
        props.children
      ) : (
        <div className={classes.notConnectWrapper}>
          <Paper className={classes.notConnectedContent}>
            <div className={classes.contentFloat}>
              <Typography className={classes.contentFloatText}>
                {title}
              </Typography>

              <p className={classes.title}>
                {description}
              </p>
              <WalletConnect>
                {({ connect }) => {
                  return (
                      <div className={classes.buttonConnect} onClick={connect}>
                        <div className={classes.buttonPrefix}></div>
                        <BtnEnterApp
                            labelClassName={classes.buttonEnterLabel}
                            label={buttonText}
                        />
                        <div className={classes.buttonPostfix}></div>
                        <div className={classes.connectSvgCont}>
                          <svg width="839" height="694" viewBox="0 0 839 694" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M133.398 2.47178C56.1879 -3.54021 -16.1904 48.3134 6.09519 134.736C29.4467 225.292 128.502 198.989 186.88 209.886C233.583 218.603 267.5 252.5 282 273" stroke="#EAE8E1" strokeWidth="4"/>
                            <path d="M342.422 353.992C392.332 413.209 470 411.928 521.999 382.5C639.5 316.001 773.802 425.183 767.5 533.5C759.5 671.001 661.5 717.5 585 717.5" stroke="#EAE8E1" strokeWidth="4"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M276.216 291.511C271.126 284.287 272.856 274.306 280.079 269.216C287.303 264.126 297.285 265.855 302.374 273.079L310.225 284.22C310.979 285.291 310.723 286.769 309.653 287.523L305.051 290.766L310.811 298.941C311.447 299.844 311.231 301.091 310.328 301.728C309.425 302.364 308.177 302.148 307.541 301.245L301.781 293.07L295.241 297.678L301.001 305.853C301.638 306.756 301.421 308.003 300.518 308.64C299.615 309.276 298.368 309.06 297.732 308.157L291.972 299.982L287.37 303.225C286.299 303.979 284.821 303.723 284.067 302.652L276.216 291.511Z" fill="#EAE8E1"/>
                            <path d="M348.138 336.677C353.131 343.968 351.268 353.925 343.977 358.918C336.686 363.911 326.728 362.048 321.735 354.757L314.034 343.512C313.295 342.432 313.571 340.957 314.651 340.217L337.142 324.815C338.222 324.075 339.697 324.351 340.437 325.431L348.138 336.677Z" fill="#EAE8E1"/>
                            <ellipse cx="326.744" cy="333.754" rx="16" ry="4.5" transform="rotate(-34.4039 326.744 333.754)" fill="#6575B1"/>
                            <ellipse cx="321.511" cy="336.731" rx="2" ry="1" transform="rotate(-34.4039 321.511 336.731)" fill="#EAE7E1"/>
                            <ellipse cx="331.412" cy="329.951" rx="2" ry="1" transform="rotate(-34.4039 331.412 329.951)" fill="#EAE7E1"/>
                          </svg>
                        </div>
                      </div>
                  )}}
              </ WalletConnect>
            </div>
          </Paper>
        </div>
      )}
    </>
  );
};
