import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  InputBase,
} from "@mui/material";
import classes from "./ssVest.module.css";
import { formatCurrency } from "../../utils";

import { ArrowBackIosNew } from "@mui/icons-material";
import VestingInfo from "./vestingInfo";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import Form from "../../ui/MigratorForm";
import SwapIconBg from "../../ui/SwapIconBg";
import classesLock from "./lock.module.css";
import moment from "moment";

export default function Unlock({ nft, govToken, veToken }) {
  const router = useRouter();

  const [lockLoading, setLockLoading] = useState(false);

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false);
      router.push("/vest");
    };
    const errorReturned = () => {
      setLockLoading(false);
    };

    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
    });

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.WITHDRAW_VEST_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(
        ACTIONS.WITHDRAW_VEST_RETURNED,
        lockReturned
      );
    };
  }, []);

  const onWithdraw = () => {
    setLockLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.WITHDRAW_VEST,
      content: { tokenID: nft.id },
    });
  };

  const onBack = () => {
    router.push("/vest");
  };

  const { appTheme } = useAppThemeContext();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const renderMassiveInput = (token) => {
    return (
      <div className={classesLock.textField}>
        <div className={classesLock.textFieldRow}>
          <div className={classesLock.textFieldColumn}>

            <div className={classesLock.nftContainer}>
              <div className={classesLock.nftContainerRow}>
                <div>NFT:</div>
                <div>
                  <span>{parseInt(nft.lockValue).toFixed(2)}</span> <span>veREMOTE</span></div>
              </div>
              <div className={classesLock.nftContainerRow}>
                <div className={classesLock.nftContainerCol}>
                  <div className={classesLock.nftContainerTitleLarge}>{nft.id}</div>
                </div>
                <div className={classesLock.nftContainerCol}>
                  <div className={classesLock.nftContainerTitle} style={{ fontSize: 16 }}>{moment.unix(nft?.lockEnds).format("YYYY-MM-DD")}</div>
                  <div className={classesLock.nftContainerValue}>Expiry date</div>
                </div>
              </div>
            </div>

            <div className={classesLock.nftContainerMobile}>
              <div className={classesLock.nftContainerRowMobile}>
                <div>
                  <div className={classesLock.nftContainerTitleLargeMobile}>{nft.id}</div>
                  <div className={classesLock.nftContainerValueMobile}>Expires: {moment.unix(nft?.lockEnds).format("YYYY-MM-DD")}</div>
                </div>
                <div className={classesLock.nftContainerColMobile}>
                  <div className={classesLock.nftContainerTitleMobile}>{parseInt(nft.lockValue).toFixed(2)}</div>
                  <div className={classesLock.nftContainerValueMobile}>veREMOTE</div>
                </div>
              </div>
            </div>
            {/* <div className={classesLock.textFieldSelect}>
              {token && token.logoURI && (
                <img
                  className={classesLock.displayAssetIcon}
                  alt=""
                  src={token.logoURI}
                  width="52px"
                  height="52px"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />
              )}
              {!(token && token.logoURI) && (
                <img
                  className={classesLock.displayAssetIcon}
                  alt=""
                  src={`/tokens/unknown-logo--${appTheme}.svg`}
                  width="52px"
                  height="52px"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />
              )}

              <p className={classesLock.textFieldSelectText}>
                {token?.symbol}
              </p>
            </div> */}
          </div>

          <div className={classesLock.textFieldColumn}>
            <div className={classesLock.textFieldInputWrapper}>
              <div className={classesLock.textFieldBalance}>
                REMOTE will be unlocked :
                {/* {token && token.balance ? " " + formatCurrency(token.balance) : ""} */}
              </div>

              <InputBase
                className={classesLock.textFieldInput}
                placeholder="0.00"
                value={parseInt(nft.lockAmount).toFixed(2)}
                disabled={true}
                inputProps={{
                  className: classesLock.largeInput,
                }}
                InputProps={{
                  disableUnderline: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={classesLock.tnavWrapper}>
        <div className={classesLock.tnav}>
          <span className={classesLock.tnavItem} onClick={onBack}>Vest</span>
          <span className={classesLock.tnavItemActive}>Withdraw Lock</span>
        </div>
      </div>

      <div className={classesLock.formWrapper}>
        <div className={classesLock.title}>
          <span>Withdraw Lock</span>
        </div>

        <div className={[classesLock.warningContainer, classesLock.warningContainerWarning].join(" ")}>
          <img src="/images/ui/info-circle-yellow.svg" width="18px" className={classesLock.warningIcon} />
          <div className={classesLock.warningText}>
            <div>NFT {nft.id} has expired!</div>
            <div>To continue receiving Boosted APR, please, make sure you did next steps before withdrawing:</div>
            <div>1. Restake the connected LP (s) with another active NFT.</div>
            <div>2. Reset votes connected with this NFT.</div>
          </div>
        </div>

        <div className={classesLock.mainBody}>
          {renderMassiveInput(govToken)}          
        </div>

        <VestingInfo currentNFT={nft} veToken={veToken} />

        <div className={classes.actionsContainer}>
          <Button
            variant="contained"
            size="large"
            color="primary"
            disabled={lockLoading}
            onClick={onWithdraw}
            className={classesLock.button}
          >
            <span>
              {lockLoading ? `Withrawing` : `Withdraw NFT`}
            </span>

            {lockLoading && (
              <CircularProgress size={10} className={classes.loadingCircle} />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
