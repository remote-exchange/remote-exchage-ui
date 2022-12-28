import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {Button, CircularProgress, IconButton, InputBase, Paper, Tooltip, Typography,} from "@mui/material";
import classes from "./ssVest.module.css";
import classesLock from "./lock.module.css";
import moment from "moment";
import BigNumber from "bignumber.js";
import {ArrowBackIosNew} from "@mui/icons-material";
import {formatCurrency, formatInputAmount} from "../../utils";
import VestingInfo from "./vestingInfo";
import {useAppThemeContext} from "../../ui/AppThemeProvider";
import stores from "../../stores";
import {ACTIONS} from "../../stores/constants";
import Hint from '../hint/hint';

export default function existingLock({ nft, govToken, veToken }) {
  const [futureNFT, setFutureNFT] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockAmountLoading, setLockAmountLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    moment().add(8, "days").format("YYYY-MM-DD")
  );
  const [selectedDateError, setSelectedDateError] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [amount, setAmount] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [amountError, setAmountError] = useState(false);

  const [feeHintAnchor, setFeeHintAnchor] = React.useState(null);
  const openFeeHint = Boolean(feeHintAnchor);
  const handleClickFeePopover = (event) => {
    setFeeHintAnchor(event.currentTarget);
  };
  const handleCloseFeePopover = () => {
    setFeeHintAnchor(null);
  };

  const router = useRouter();

  useEffect(() => {
    if (nft && nft.lockEnds) {
      setSelectedDate(moment.unix(nft.lockEnds).format("YYYY-MM-DD"));
      setSelectedValue(null);
    }
  }, [nft]);

  const onBack = () => {
    router.push("/vest");
  };

  const updateLockAmount = (amount) => {
    if (amount === "") {
      let tmpNFT = {
        lockAmount: futureNFT?.lockAmount || nft.lockAmount,
        lockValue: futureNFT?.lockValue || nft.lockValue,
        lockEnds: futureNFT?.lockEnds || nft.lockEnds,
      };

      setFutureNFT(tmpNFT);
      return;
    }

    let tmpNFT = {
      lockAmount: futureNFT?.lockAmount || nft.lockAmount,
      lockValue: futureNFT?.lockValue || nft.lockValue,
      lockEnds: futureNFT?.lockEnds || nft.lockEnds,
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

  const updateLockDuration = (val) => {
    let tmpNFT = {
      lockAmount: futureNFT?.lockAmount || nft.lockAmount,
      lockValue: futureNFT?.lockValue || nft.lockValue,
      lockEnds: futureNFT?.lockEnds || nft.lockEnds,
    };

    const now = moment();
    const expiry = moment(val);
    const dayToExpire = expiry.diff(now, "days");

    tmpNFT.lockEnds = expiry.unix();
    tmpNFT.lockValue = BigNumber(tmpNFT.lockAmount)
      .times(parseInt(dayToExpire))
      .div(1460)
      .toFixed(18);

    setFutureNFT(tmpNFT);
  };

  const onLock = () => {
    setLockLoading(true);

    const now = moment();
    const expiry = moment(selectedDate).add(1, "days");
    const secondsToExpire = expiry.diff(now, "seconds");

    stores.dispatcher.dispatch({
      type: ACTIONS.INCREASE_VEST_DURATION,
      content: { unlockTime: secondsToExpire, tokenID: nft.id },
    });
  };

  const onLockAmount = () => {
    setLockAmountLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.INCREASE_VEST_AMOUNT,
      content: { amount, tokenID: nft.id },
    });
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

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedValue(null);

    updateLockDuration(event.target.value);
  };

  const handleChange = (value) => {
    setSelectedValue(value);

    let days = 0;
    switch (value) {
      case "week":
        days = 8;
        break;
      case "month":
        days = 30;
        break;
      case "year":
        days = 365;
        break;
      case "years":
        days = 1461;
        break;
      default:
    }
    const newDate = moment(+nft.lockEnds * 1000).add(days, "days").format("YYYY-MM-DD");

    setSelectedDate(newDate);
    updateLockDuration(newDate);
  };

  const focus = () => {
    inputEl.current.focus();
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
                  className={classesLock.displayAssetIcon}
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
                  className={classesLock.displayAssetIcon}
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
              <div className={classesLock.textFieldBalance}>
                <span>Balance:{" "}
                {govToken?.balance
                  ? " " + formatCurrency(govToken?.balance)
                  : ""}</span>
                <span className={classesLock.textFieldBalanceMax} onClick={() => { setAmountPercent(100); }}>Max</span>
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

  function LockDuration({ nft, updateLockDuration }) {
    let min = moment().add(7, "days").format("YYYY-MM-DD");
    if (BigNumber(nft?.lockEnds).gt(0)) {
      min = moment.unix(nft?.lockEnds).format("YYYY-MM-DD");
    }

    return (
      <div className={classesLock.setDateRow}>
        <div className={[classesLock.periodToggle, 'g-flex', 'g-flex--align-center'].join(' ')}>
          <div
            className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'week' ? 'checked' : ''}`]].join(' ')}
            onClick={() => handleChange("week")}
          >
            1 week
          </div>

          <div
            className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'month' ? 'checked' : ''}`]].join(' ')}
            onClick={() => handleChange("month")}
          >
            1 month
          </div>

          <div
            className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'year' ? 'checked' : ''}`]].join(' ')}
            onClick={() => handleChange("year")}
          >
            1 year
          </div>

          <div
            className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'years' ? 'checked' : ''}`]].join(' ')}
            onClick={() => handleChange("years")}
          >
            4 years
          </div>
        </div>

        <div className={classesLock.lockDateWrapper}>
          <InputBase
            className={classesLock.massiveInputAmountDate}
            id="someDate"
            type="date"
            placeholder="Set Lock Expiry Date"
            error={amountError}
            helperText={amountError}
            value={selectedDate}
            onChange={handleDateChange}
            disabled={lockLoading}
            inputProps={{
              className: classesLock.dateInput,
              min: moment().add(7, "days").format("YYYY-MM-DD"),
              max: moment().add(1460, "days").format("YYYY-MM-DD"),
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />

          <div className={classesLock.lockDateText}>Lock Expiry Date</div>
        </div>
      </div>
    );
  }

  const isButtonAmountDisabled = lockLoading || (!amount || amount == '0');
  const isButtonDurationDisabled = lockLoading || (!futureNFT || (futureNFT && futureNFT.lockEnds <= nft.lockEnds));

  return (
    <>
      <div className={classesLock.tnavWrapper}>
        <div className={classesLock.tnav}>
          <span className={classesLock.tnavItem} onClick={onBack}>Vest</span>
          <span className={classesLock.tnavItemActive}>Edit Lock</span>
        </div>
      </div>
    
      <div className={classesLock.formWrapper}>
        <div className={classesLock.title}>
          <span>Edit Lock</span>
        </div>

        <div className={classesLock.mainBody}>
          <LockAmount govToken={govToken} updateLockAmount={updateLockAmount} />

          <LockDuration
            nft={nft}
            govToken={govToken}
            veToken={veToken}
            updateLockDuration={updateLockDuration}
          />

          <p className={classesLock.infoText}>Lock period should be multiples of 1 week (e.g. 28, 35, 42 days, etc.)</p>
          <p className={classesLock.infoText}>
            <span>Do you have a referral code?</span>
            <Hint
              hintText={'You wil get +10% APR for your Vest Rewardds by using the referral code.'}
              open={openFeeHint}
              anchor={feeHintAnchor}
              handleClick={handleClickFeePopover}
              handleClose={handleCloseFeePopover}
              fill="#586586"
              iconComponent={<img src="/images/ui/info-circle-gray.svg" width="12px" />}
            />
          </p>
          {/* TODO: referal input */}
          <InputBase
            className={classesLock.referalField}
            placeholder="Referral code"
            // error={amountError}
            // helperText={amountError}
            // value={amountValue}
            // onChange={amountChanged}
            // disabled={lockLoading}
            inputProps={{
              className: classesLock.referalInput,
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
        </div>

        <VestingInfo
          govToken={govToken}
          currentNFT={nft}
          futureNFT={futureNFT}
          veToken={veToken}
          showVestingStructure={false}
        />

        {futureNFT && futureNFT.lockEnds <= nft.lockEnds && (
          <div className={classesLock.warningContainer}>
            <img src="/images/ui/info-circle-gray.svg" width="18px" className={classesLock.warningIcon} />
            <p className={classesLock.warningText}>You can only add the Vest Amount or Vest Duration</p>
          </div>
        )}

        <div className={[classesLock.controls, classesLock.editLockControls].join(" ")}>
          <div className={classesLock.controlsButtons}>
            <Button
              className={[
                classesLock.button,
                isButtonAmountDisabled ? classesLock.buttonDisabled : "",
              ]}
              variant="contained"
              size="large"
              color="primary"
              disabled={isButtonAmountDisabled}
              onClick={onLockAmount}
            >
              <span>
                {lockLoading ? `Increasing Lock Amount` : `Increase Lock Amount`}
              </span>

              {lockLoading && (
                <CircularProgress size={10} className={classes.loadingCircle} />
              )}
            </Button>

            <Button
              className={[
                classesLock.button,
                isButtonDurationDisabled ? classesLock.buttonDisabled : "",
              ]}
              variant="contained"
              size="large"
              color="primary"
              disabled={isButtonDurationDisabled}
              onClick={onLock}
            >
              <span>{lockLoading ? `Increasing Duration` : `Increase Duration`}</span>
              {lockLoading && (
                <CircularProgress size={10} className={classes.loadingCircle} />
              )}
            </Button>
          </div>

          <div className={classesLock.controlsInfo}>
            1 {govToken?.symbol} locked for 1 year = 0.25 {veToken?.symbol}, 1{" "}
            {govToken?.symbol} locked for 4 years = 1 {veToken?.symbol}
          </div>
        </div>
      </div>
    </>
  );
}
