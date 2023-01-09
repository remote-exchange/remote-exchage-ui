import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  Tooltip,
  IconButton, InputBase,
} from '@mui/material';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import { formatCurrency, formatInputAmount } from '../../utils';
import classes from "./ssVest.module.css";
import classesLock from "./lock.module.css";
import stores from '../../stores';
import {
  ACTIONS,
} from '../../stores/constants';

import { ArrowBackIosNew } from '@mui/icons-material';
import VestingInfo from "./vestingInfo";
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import Hint from '../hint/hint';

export default function ssLock({govToken, veToken}) {
  const unixWeek = 604800

  const inputEl = useRef(null);
  const router = useRouter();

  const [lockLoading, setLockLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [selectedValue, setSelectedValue] = useState('week');
  const [selectedDate, setSelectedDate] = useState(moment.unix(Math.floor(moment().add(7, 'days').unix() / unixWeek) * unixWeek).format('YYYY-MM-DD'));
  const [selectedDateError, setSelectedDateError] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [feeHintAnchor, setFeeHintAnchor] = React.useState(null);

  const [ref, setRef] = useState('');

  const openFeeHint = Boolean(feeHintAnchor);
  const handleClickFeePopover = (event) => {
    setFeeHintAnchor(event.currentTarget);
  };
  const handleCloseFeePopover = () => {
    setFeeHintAnchor(null);
  };

  const isDateCorrect = (dateStr) => {
    const date = moment(dateStr).format('YYYY-MM-DD')
    const correctDate = moment.unix(Math.floor(moment(dateStr).add(1, 'days').unix() / unixWeek) * unixWeek).format('YYYY-MM-DD')
    return date === correctDate && moment(dateStr).unix() > moment().unix()
  }

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false);
      router.push('/vest');
    };
    const errorReturned = () => {
      setLockLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.CREATE_VEST_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.CREATE_VEST_RETURNED, lockReturned);
    };
  }, []);

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const setAmountPercent = (percent) => {
    setAmount(BigNumber(govToken.balance).times(percent).div(100).toFixed(govToken.decimals));
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedValue(null);
  };

  const handleChange = (value) => {
    setSelectedValue(value);

    let days = 0;
    switch (value) {
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 28;
        break;
      case 'year':
        days = 364;
        break;
      case 'years':
        days = 1456;
        break;
      default:
    }
    let newDate = moment().add(days, 'days');
    // round to weeks
    newDate = moment.unix(Math.floor(newDate.unix() / unixWeek) * unixWeek)

    setSelectedDate(newDate.format('YYYY-MM-DD'));
  };

  const onLock = () => {
    setAmountError(false);

    let error = false;

    if (!amount || amount === '' || isNaN(amount)) {
      setAmountError('Amount is required');
      error = true;
    } else {
      if (!govToken.balance || isNaN(govToken.balance) || BigNumber(govToken.balance).lte(0)) {
        setAmountError('Invalid balance');
        error = true;
      } else if (BigNumber(amount).lte(0)) {
        setAmountError('Invalid amount');
        error = true;
      } else if (govToken && BigNumber(amount).gt(govToken.balance)) {
        setAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      setLockLoading(true);

      const now = moment();
      const expiry = moment(selectedDate).add(1, 'days');
      const secondsToExpire = expiry.diff(now, 'seconds');

      stores.dispatcher.dispatch({type: ACTIONS.CREATE_VEST, content: {amount, unlockTime: secondsToExpire, ref,}});
    }
  };

  const focus = () => {
    inputEl.current.focus();
  };

  const onAmountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(',', '.'))
    setAmountError(false);
    setAmount(value);
  };

  const renderMassiveDateInput = (type, amountValue, amountError, amountChanged, balance, logo) => {
    return (
      <div className={classesLock.lockDateWrapper}>
        <InputBase
          className={classesLock.massiveInputAmountDate}
          inputRef={inputEl}
          id="someDate"
          type="date"
          placeholder="Set Lock Expiry Date"
          error={amountError}
          helperText={amountError}
          value={amountValue}
          onChange={amountChanged}
          disabled={lockLoading}
          inputProps={{
            className: classesLock.dateInput,
            min: moment().add(7, 'days').format('YYYY-MM-DD'),
            max: moment().add(1460, 'days').format('YYYY-MM-DD'),
          }}
          InputProps={{
            disableUnderline: true,
          }}
        />

        <div className={classesLock.lockDateText}>Lock Expiry Date</div>
      </div>
    );
  };

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, token) => {
    return (
      <div className={classesLock.textField}>
        <div className={classesLock.textFieldRow}>
          <div className={classesLock.textFieldColumn}>
            <div className={classesLock.textFieldSelect}>
              {token && token.logoURI &&
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
              }
              {!(token && token.logoURI) &&
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
              }

              <p className={classesLock.textFieldSelectText}>
                {token?.symbol}
              </p>
            </div>
          </div>

          <div className={classesLock.textFieldColumn}>
            <div className={classesLock.textFieldInputWrapper}>
              <div className={classesLock.textFieldBalance}>
                <span>Balance: {(token && token.balance) ? ' ' + formatCurrency(token.balance) : ''}</span>
                <span className={classesLock.textFieldBalanceMax} onClick={() => { setAmountPercent(100); }}>Max</span>
              </div>

              <InputBase
                className={classesLock.textFieldInput}
                placeholder="0.00"
                error={amountError}
                helperText={amountError}
                value={amountValue}
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
  };

  const renderVestInformation = () => {
    const now = moment();
    const expiry = moment(selectedDate);
    const dayToExpire = expiry.diff(now, 'days');

    const tmpNFT = {
      lockAmount: amount,
      lockValue: BigNumber(amount).times(parseInt(dayToExpire) + 1).div(1460).toFixed(18),
      lockEnds: expiry.unix(),
    };

    return (<VestingInfo futureNFT={tmpNFT} govToken={govToken} veToken={veToken} showVestingStructure={false} />);
  };

  const onBack = () => {
    router.push('/vest');
  };

  const {appTheme} = useAppThemeContext();

  return (
    <>
      <div className={classesLock.tnavWrapper}>
        <div className={classesLock.tnav}>
          <span className={classesLock.tnavItem} onClick={onBack}>Vest</span>
          <span className={classesLock.tnavItemActive}>Create Lock</span>
        </div>
      </div>
    
      <div className={classesLock.formWrapper}>
        <div className={classesLock.title}>
          <span>Create Lock</span>
        </div>

        <div className={classesLock.mainBody}>
          {renderMassiveInput('amount', amount, amountError, onAmountChanged, govToken)}

          <div className={classesLock.setDateRow}>
            <div className={[classesLock.periodToggle, 'g-flex', 'g-flex--align-center'].join(' ')}>
              <div
                className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'week' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('week')}>
                1 week
              </div>

              <div
                className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'month' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('month')}>
                1 month
              </div>

              <div
                className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'year' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('year')}>
                1 year
              </div>

              <div
                className={[classesLock.periodToggleItem, classesLock[`periodToggleItem--${selectedValue === 'years' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('years')}>
                4 years
              </div>
            </div>

            {renderMassiveDateInput('date', selectedDate, selectedDateError, handleDateChange, govToken?.balance, govToken?.logoURI)}
          </div>

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
            value={ref}
            onChange={e => {setRef(e.target.value)}}
            // disabled={lockLoading}
            inputProps={{
              className: classesLock.referalInput,
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
        </div>

        {renderVestInformation()}

        {amountError && (
          <div className={classesLock.warningContainer}>
            <img src="/images/ui/info-circle-gray.svg" width="18px" className={classesLock.warningIcon} />
            <p className={classesLock.warningText}>{amountError}</p>
          </div>
        )}

        {(amount === '' || Number(amount) === 0) && (
          <div className={classesLock.warningContainer}>
            <img src="/images/ui/info-circle-gray.svg" width="18px" className={classesLock.warningIcon} />
            <p className={classesLock.warningText}>Enter Lock Amount</p>
          </div>
        )}

        {(selectedDateError || !isDateCorrect(selectedDate)) && (
          <div className={classesLock.warningContainer}>
            <img src="/images/ui/info-circle-gray.svg" width="18px" className={classesLock.warningIcon} />
            <p className={classesLock.warningText}>
              {selectedDateError || "Wrong expiration date"}
            </p>
          </div>
        )}

        <div className={classesLock.controls}>
          <div className={classesLock.controlsButtons}>
            <Button
              className={[classesLock.button,
                (lockLoading ||
                  amount === '' ||
                  Number(amount) === 0 ||
                  !isDateCorrect(selectedDate) ? classesLock.buttonDisabled : "")
              ].join(" ")}
              variant="contained"
              size="large"
              color="primary"
              disabled={
                lockLoading ||
                amount === '' ||
                Number(amount) === 0 ||
                  !isDateCorrect(selectedDate)
              }
              onClick={onLock}
            >
              <span>
                {lockLoading ? "Locking" : "Create Lock"}
              </span>

              {lockLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
            </Button>
          </div>

          <div className={classesLock.controlsInfo}>
            1 {govToken?.symbol} locked for 1 year = 0.25 {veToken?.symbol}, 1{" "}
            {govToken?.symbol} locked for 4 years = 1 {veToken?.symbol}
          </div>
        </div>

        {/* {moment(selectedDate).diff(moment(), 'days') + 1} --- */}
        {/* {(moment(selectedDate).diff(moment(), 'days') + 1) % 7 === 0 ? 'nine' : 'none'}; */}
      </div>
    </>
  );
}
