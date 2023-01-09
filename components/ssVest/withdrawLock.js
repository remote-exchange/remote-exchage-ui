import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  IconButton,
  Tooltip,
  InputBase,
  Button,
} from "@mui/material";
import classes from "./ssVest.module.css";
import moment from "moment";
import BigNumber from "bignumber.js";
import { ArrowBackIosNew } from "@mui/icons-material";
import { formatCurrency, formatInputAmount } from "../../utils";
import VestingInfo from "./vestingInfo";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import classesLock from "./lock.module.css";

export function WithdrawLock({ nft, govToken, veToken }) {
  const [futureNFT, setFutureNFT] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);

  const router = useRouter();

  const onBack = () => {
    router.push("/vest");
  };

  const updateLockAmount = (amount) => {
    if (amount === "") {
      let tmpNFT = {
        lockAmount: nft.lockAmount,
        lockValue: nft.lockValue,
        lockEnds: nft.lockEnds,
      };

      setFutureNFT(tmpNFT);
      return;
    }

    let tmpNFT = {
      lockAmount: nft.lockAmount,
      lockValue: nft.lockValue,
      lockEnds: nft.lockEnds,
    };

    const now = moment();
    const expiry = moment.unix(tmpNFT.lockEnds);
    const dayToExpire = expiry.diff(now, "days");

    tmpNFT.lockAmount = BigNumber(nft.lockAmount).plus(amount).toFixed(18);
    tmpNFT.lockValue = BigNumber(tmpNFT.lockAmount)
      .times(parseInt(dayToExpire) + 1)
      .div(1460)
      .toFixed(18);

    setFutureNFT(tmpNFT);
  };

  const setAmountPercent = (percent) => {
    const val = BigNumber(govToken.balance)
      .times(percent)
      .div(100)
      .toFixed(govToken.decimals);
    setAmount(val);
    updateLockAmount(val);
  };

  const amountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));
    setAmount(value);
    updateLockAmount(value);
  };

  const { appTheme } = useAppThemeContext();

  function LockAmount({ govToken }) {
    return (
      <div className={classesLock.textField}>
        <div className={classesLock.textFieldRow}>
          <div className={classesLock.textFieldColumn}>
            <div className={classesLock.textFieldSelect}>
              {govToken?.logoURI && (
                <img
                  className={classes.displayAssetIcon}
                  alt=""
                  src={govToken?.logoURI}
                  height="52px"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />
              )}
              {!govToken?.logoURI && (
                <img
                  className={classes.displayAssetIcon}
                  alt=""
                  src={`/tokens/unknown-logo--${appTheme}.svg`}
                  height="52px"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />
              )}

              <p className={classesLock.textFieldSelectText}>
                {govToken?.symbol}
              </p>
            </div>
          </div>

          <div className={classesLock.textFieldColumn}>
            <div className={classesLock.textFieldInputWrapper}>
              <div
                className={classesLock.textFieldBalance}
                onClick={() => {
                  setAmountPercent(100);
                }}
              >
                Balance:{" "}
                {govToken?.balance
                  ? " " + formatCurrency(govToken?.balance)
                  : ""}
              </div>

              <InputBase
                className={classesLock.textFieldInput}
                placeholder="0.00"
                autoFocus={true}
                error={amountError}
                helperText={amountError}
                value={amount}
                onChange={amountChanged}
                disabled={lockLoading}
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
  }

  return (
    <>
      <div className={classesLock.tnavWrapper}>
        <div className={classesLock.tnav}>
          <span className={classesLock.tnavItem} onClick={onBack}>
            Vest
          </span>
          <span className={classesLock.tnavItemActive}>Withdraw Lock</span>
        </div>
      </div>

      <div className={classesLock.formWrapper}>
        <div className={classesLock.title}>
          <span>Withdraw Lock</span>
        </div>

        {/* TODO: 1234 */}
        <div className={classesLock.warningContainer}>
          <img
            src="/images/ui/info-circle-gray.svg"
            width="18px"
            className={classesLock.warningIcon}
          />
          <p className={classesLock.warningText}>
            veREMOTE NFT #1234 has expired, to continue receiving boosted rewards
            you must unstake the expired veREMOTE NFT from your LP and stake one
            that is currently locked.
          </p>
        </div>

        <div className={classesLock.mainBody}>
          <LockAmount govToken={govToken} />
        </div>

        <VestingInfo
          currentNFT={nft}
          futureNFT={futureNFT}
          veToken={veToken}
          showVestingStructure={false}
        />

        {/* TODO: 1234 */}
        <div className={classesLock.warningContainer}>
          <img
            src="/images/ui/info-circle-gray.svg"
            width="18px"
            className={classesLock.warningIcon}
          />
          <p className={classesLock.warningText}>
            Please reset votes connected with #1234 NFT before withdrawing!
          </p>
        </div>

        <div className={classesLock.controls}>
          <div className={classesLock.controlsButtons}>
            <Button
              className={classesLock.button}
              variant="contained"
              size="large"
              color="primary"
            >
              <span>Reset Votes for #1234 NFT</span>
            </Button>
            <Button
              className={[classesLock.button, classesLock.buttonDisabled].join(
                " "
              )}
              variant="contained"
              size="large"
              color="primary"
              disabled={true}
            >
              <span>Withdraw NFT</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
