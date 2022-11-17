import React, { useEffect, useMemo, useState } from 'react';
import classes from './ssBoostCalculator.module.css';
import {useRouter} from 'next/router';
import ThreePointSlider from '../threePointSlider/threePointSlider';
import ThreePointSliderForTooltip from '../threePointSlider/threePointSliderForTooltip';
import BigNumber from "bignumber.js";
import {calculateBoost, calculatePowerForMaxBoost} from "../../stores/helpers/pair-helper";
import { formatCurrency } from '../../utils';
import {VE_TOKEN_NAME, VE_TOKEN_SYMBOL} from '../../stores/constants/contracts'
import {Typography} from "@mui/material";
// import {InputBase} from '@mui/material';

export default function ssBoostCalculator({pair, nft, ve, isMobileView = false, amount = 0, popuped = false}) {
  const router = useRouter();
  const boostedType = 'boosted';

  const [ isExampleAmount, setIsExampleAmount] = useState(false)
  const [ isShowNote, setIsShowNote ] = useState(false);
  const [ isShowCreateAction, setIsShowCreateAction ] = useState(false);
  const [ nftVolume, setNftVolume ] = useState('');
  const [ boostedNFTAmount, setBoostedNFTAmount ] = useState(0);
  const [ currentAPRPercentage, setCurrentAPRPercentage ] = useState(0);
  const [ boostedAPRPercentage, setBoostedAPRPercentage ] = useState(0);
  const [ currentAPRAmount, setCurrentAPRAmount ] = useState(0);
  const [ boostedAPRAmount, setBoostedAPRAmount ] = useState(0);
  const [ usedAPRPercentage, setUsedAPRPercentage ] = useState(0);
  const [ aprLimits, setAprLimits ] = useState({ min: 0, max: 100 }); // Percentage only
  const [ veConeLimits, setVeConeLimits ] = useState({ min: 0, max: 1000 });

  const [lpAmount, setLpAmount] = useState(BigNumber(0))

  const sliderConfig = useMemo(() => {
    if (pair && ve) {
      // min/max APR is static values, need to calculate proportion between APR to Power for UI
      const maxApr = BigNumber(pair.gauge.derivedAPR);
      const minApr = BigNumber(pair.gauge.derivedAPR).times(0.4);

      // gauge balance - exist or future balance, need to set from input field
      // const userGaugeBalance = +pair.gauge.balance + parseFloat((amount ? amount * pair.gauge.balance / 100 : 0).toString());
      const userGaugeBalance = lpAmount;

      // lock value it is veCONE power, if no NFT equals zero
      const lockValue = BigNumber(nft?.lockValue ?? 0);
      const veRatio = lockValue.div(ve.totalPower);

      // aprWithout boost will be the same as minAPR
      // personal APR is dynamic
      const {personalAPR, aprWithoutBoost} = calculateBoost(pair, veRatio.toString(), userGaugeBalance);

      let personalAPRwithBonus = personalAPR;
      let minAprWithBonus = minApr;
      let maxAprWithBonus = maxApr;
      if (pair?.gauge?.additionalApr0 && BigNumber(pair?.gauge?.additionalApr0).gt(0)) {
        personalAPRwithBonus = personalAPRwithBonus.plus(pair?.gauge?.additionalApr0)
        minAprWithBonus = minAprWithBonus.plus(pair?.gauge?.additionalApr0)
        maxAprWithBonus = maxAprWithBonus.plus(pair?.gauge?.additionalApr0)
      }
      if (pair?.gauge?.additionalApr1 && BigNumber(pair?.gauge?.additionalApr1).gt(0)) {
        personalAPRwithBonus = personalAPRwithBonus.plus(pair?.gauge?.additionalApr1)
        minAprWithBonus = minAprWithBonus.plus(pair?.gauge?.additionalApr1)
        maxAprWithBonus = maxAprWithBonus.plus(pair?.gauge?.additionalApr1)
      }

      // console.log(personalAPR.toString())
      // console.log(personalAPRwithBonus.toString())

      // console.log('personalARP', personalAPR)
      // console.log('pair totalSupply USD', BigNumber(pair.reserveETH).times(pair.ethPrice).toString())
      // console.log('pair total supply', pair.totalSupply.toString())
      // calc $ per day doesn't depend on anything and simple math on APR and user balance
      const userGaugeBalanceEth = BigNumber(userGaugeBalance).times(BigNumber(pair.reserveETH).div(pair.totalSupply));
      const userGaugeBalanceUsd = userGaugeBalanceEth.times(pair.ethPrice);
      const earnPerDay = userGaugeBalanceUsd.times(personalAPR).div(365*100);

      // max value for the UI, user can have enough power - then show max possible APR
      const maxPower = calculatePowerForMaxBoost(pair, userGaugeBalance, ve.totalPower);
      // console.log('need ve for max boost', maxPower)

      // console.log('-----------------', );
      // console.log('maxApr', maxApr.toString());
      // console.log('minApr', minApr.toString());
      // console.log('userGaugeBalance', userGaugeBalance.toString());
      // console.log('lockValue', lockValue.toString());
      // console.log('ve lock value', lockValue.toString());
      // console.log('veRatio', veRatio.toString());
      // console.log('personalAPR', personalAPR.toString());
      // console.log('aprWithoutBoost', aprWithoutBoost.toString());
      // console.log('userGaugeBalanceUsd', userGaugeBalanceUsd.toString());
      // console.log('earnPerDay', earnPerDay);
      // console.log('maxPower', maxPower);
      // console.log('userGaugeBalance', userGaugeBalance, ' = ', pair.gauge.balance, ' + ', parseFloat((amount ? amount : 0).toString()));
      // console.log('ve.totalPower', ve.totalPower);
      // console.log('pair', pair);
      // console.log('nft', nft);
      // console.log('ve', ve);
      // console.log('-----------------', );
      return {
        maxApr: parseFloat(maxAprWithBonus),
        minApr: parseFloat(minAprWithBonus),
        earnPerDay: parseFloat(earnPerDay),
        personalAPR: parseFloat(personalAPRwithBonus),
        maxPower: parseFloat(maxPower),
        lockValue: lockValue
      }
    }
  }, [pair, ve, nft, lpAmount]);

  useEffect(() => {
    if (pair && ve) {
      // set lpAmount
      if (popuped) {
        if (BigNumber(pair?.balance).gt(0) || BigNumber(pair?.gauge?.balance).gt(0)) {
          setLpAmount(BigNumber(pair?.balance).plus(BigNumber(pair?.gauge?.balance)))
          // console.log('setLpAmount', BigNumber(pair?.balance).plus(BigNumber(pair?.gauge?.balance)).toString())
        } else {
          if (BigNumber(pair?.ethPrice).gt(0)) {
            // if user dont have liquidity, then calculate $1000 to lpAmount
            const ethPer1k = BigNumber(1000).div(pair.ethPrice)
            setLpAmount(BigNumber(pair.totalSupply).times(ethPer1k.div(BigNumber(pair.reserveETH))))
            setIsExampleAmount(true)
          } else {
            setLpAmount(BigNumber("1"))
          }
        }
      } else {
        if (BigNumber(pair?.balance).gt(0)) {
          if (amount > 0) {
            setLpAmount(BigNumber(pair?.balance).times(amount).div(100))
          } else {
            setLpAmount(BigNumber(pair?.balance))
          }
        } else {
          if (BigNumber(pair?.gauge?.balance).gt(0)) {
            setLpAmount(BigNumber(pair?.gauge?.balance))
          }
        }
      }
    }
  }, [ pair, amount, nft ]);

  useEffect(() => {
    if (pair && ve) {
      setCurrentAPRPercentage(sliderConfig.personalAPR); // Set default value of APR% (show in Calculator and Default place of thumb of slider)
      setCurrentAPRAmount(sliderConfig.earnPerDay); // APR amount per day (show in Calculator)
      setBoostedAPRPercentage(sliderConfig.personalAPR); // Default value for boosted APR%.
      setUsedAPRPercentage(sliderConfig.personalAPR); // Value of user's used veCone % (Slider will start from this position)
      // console.log('setUsedAPRPercentage', sliderConfig.personalAPR)

      setAprLimits({min: sliderConfig.minApr, max: sliderConfig.maxApr}); // Limits for slider, min & max APR%
      setVeConeLimits({min: 0, max: sliderConfig.maxPower}); // Limits for slider, veCone min & max. It should be linear dependency with APR%
      // console.log('setVeConeLimits', {min: 0, max: sliderConfig.maxPower})
    }
  }, [ pair, lpAmount, nft ]);

  useEffect(() => {
    setIsShowNote(boostedAPRPercentage === usedAPRPercentage || boostedAPRPercentage === aprLimits.min);
    setIsShowCreateAction(boostedAPRPercentage > usedAPRPercentage && boostedAPRPercentage > 0);

    if (pair && ve) {
      setBoostedAPRAmount(parseFloat((boostedAPRPercentage * sliderConfig.earnPerDay / sliderConfig.minApr).toString()));
      setNftVolume(sliderConfig.lockValue > boostedNFTAmount ? 0 : (boostedNFTAmount - parseFloat(sliderConfig.lockValue)).toString());
    }

  }, [ boostedAPRPercentage, pair, lpAmount, nft ]);

  const createAction = () => {
    router.push('/vest/create').then();
  }

  const fixed = (value) => {
    const val = parseFloat(value);
    return +(val.toFixed(val > 0.009 ? 2 : 5));
  }

  const profitRender = (type = 'current') => {
    const hasProfit = boostedAPRPercentage > currentAPRPercentage;
    return (
        <>
          {type === 'current' ? (
              <>
                <div
                    className={[ classes.profitLabel, classes[ `profitLabel--${hasProfit && type === boostedType ? 'profit' : 'shortage'}` ] ].join(' ')}
                >
                  <div className={classes.profitLabelValue}><span>{fixed(currentAPRPercentage)}%</span></div>
                  <div className={classes.profitLabelTitle}>Current APR</div>
                </div>
                <div className={classes.profitValue}>
                  <div className={classes.profitLabelValue}>{fixed(currentAPRAmount)}</div>
                  <div className={classes.profitLabelTitle}>$ / day</div>
                </div>
              </>
            ) : (
              <>
                <div
                    className={[ classes.profitLabel, classes[ `profitLabel--${hasProfit && type === boostedType ? 'profit' : 'shortage'}` ] ].join(' ')}
                >
                  <div className={classes.profitLabelValueBoosted}><span>{fixed(boostedAPRPercentage)}%</span></div>
                  <div className={classes.profitLabelTitleBoosted}>Boosted APR</div>
                </div>
                <div className={classes.profitValue}>
                  <div className={classes.profitLabelValueBoosted}>{fixed(boostedAPRAmount)}</div>
                  <div className={classes.profitLabelTitleBoosted}>$ / day</div>
                </div>
              </>
            )}
        </>
    );
  }

  const noteRender = <div className={classes.sliderNote}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8ZM12.75 17V11H11.25V17H12.75Z" fill="#68727A"/>
    </svg>
    <div>Use slider to calculate how much {VE_TOKEN_NAME} Power you need for the max APR Boost!.</div>
  </div>;

  const onChange = ({ currentPct,  currentAmount}) => {
    // console.log(currentPct, currentAmount)
    setBoostedAPRPercentage(currentPct);
    setBoostedNFTAmount(currentAmount);
  }

  const className = isMobileView ? [classes.boostCalculator, classes['boostCalculator--mobile']].join(' ') : classes.boostCalculator;

  return (
      <div className={className}>
        {popuped &&
            <div className={classes.calcToValue}>
              <div className={classes.calculatorTitle}>Boost Calculator</div>
              <div className={classes.lp}>{isExampleAmount ? 'Example for' : 'For'} ${lpAmount.div(BigNumber(pair.totalSupply)).times(BigNumber(pair.reserveETH)).times(pair.ethPrice).toFixed(2)} ({lpAmount.toString().slice(0, 12)})</div>
              {/*<InputBase
                    className={classes.massiveInputAmount}
                    placeholder="0.00"
                    value={lpAmount}
                    disabled={true}
                    onChange={e => {
                      setLpAmount(e.target.value)
                    }}
                    InputProps={{
                      disableUnderline: true,
                    }}
                />*/}
              {/*<span className={css.flyPercent}>%</span>*/}
            </div>
        }
        {popuped && !isExampleAmount && !nft &&
            <div className={classes.noNftWarn}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12ZM13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16ZM12.75 7V13H11.25V7H12.75Z" fill="#EB9617"/>
              </svg>
              <span>No NFT connected. Restake this LP with {VE_TOKEN_NAME} to receive Boosted APR. Use slider to see how much {VE_TOKEN_NAME} you need for max Boost!</span>
            </div>
        }
        {popuped && nft &&
            <div className={classes.nftRow} style={{width: '100%',}}>
              <div className={classes.nftTitle}>
                Connected {VE_TOKEN_NAME} for Boosted APR:
              </div>
              <div className={classes.nftItems}>
                <div className={classes.tokenSelector}>
                  <div className={classes.selectorLeft}>#{nft.id}</div>
                  <div className={classes.selectorRight}>
                    <Typography
                        className={classes.menuOptionSecText}
                    >
                      {formatCurrency(nft.lockValue)} {VE_TOKEN_SYMBOL}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
        }
        {isShowNote && !isMobileView && noteRender}
        <div className={popuped ? classes.sliderWrapperPopuped : classes.sliderWrapper}>

          <div className={classes.sliderLabels}>
            <div className={classes.sliderLabelsItem}>
              Min APR
            </div>
            <div className={classes.sliderLabelSplitter} />
            <div className={classes.sliderLabelsItem}>
              Min {VE_TOKEN_NAME}
            </div>
          </div>
          <div className={classes.slider}>
            {popuped ? <ThreePointSliderForTooltip
                valueLabelDisplay="on"
                pointCurrent={currentAPRPercentage}
                pointUsed={usedAPRPercentage}
                pointMinPct={aprLimits.min}
                pointMaxPct={aprLimits.max}
                pointMinValue={veConeLimits.min}
                pointMaxValue={veConeLimits.max}
                step={1}
                disabled={false}
                onChange={onChange}
                fixedCallback={fixed}
            /> : <ThreePointSlider
                valueLabelDisplay="on"
                pointCurrent={currentAPRPercentage}
                pointUsed={usedAPRPercentage}
                pointMinPct={aprLimits.min}
                pointMaxPct={aprLimits.max}
                pointMinValue={veConeLimits.min}
                pointMaxValue={veConeLimits.max}
                step={1}
                disabled={false}
                onChange={onChange}
                fixedCallback={fixed}
            />}
          </div>
          <div className={classes.sliderLabels} style={{alignItems: 'flex-end'}}>
            <div className={classes.sliderLabelsItem}>
              Max APR
            </div>
            <div className={classes.sliderLabelSplitter} />
            <div className={classes.sliderLabelsItem}>
              Max {VE_TOKEN_NAME}
            </div>
          </div>
        </div>

        {(pair.gauge?.additionalApr0 && BigNumber(pair?.gauge?.additionalApr0).gt(0)) || (pair.gauge?.additionalApr1 && BigNumber(pair?.gauge?.additionalApr1).gt(0)) &&
            <div className={classes.profitWrapper} style={{marginBottom: 12,}}>
              {(pair.gauge?.additionalApr0 && BigNumber(pair?.gauge?.additionalApr0).gt(0)) &&
                  <div className={classes.profitItem}>
                    <div className={[ classes.profitLabel, classes[ `profitLabel--shortage` ] ].join(' ')}>
                      Bonus {pair.token0.symbol} APR
                      <span style={{marginLeft: 4,}}>
                        {formatCurrency(
                            BigNumber(pair?.gauge?.additionalApr0),
                            2
                        )}
                        %
                      </span>
                    </div>
                  </div>
              }
              {(pair.gauge?.additionalApr0 && BigNumber(pair?.gauge?.additionalApr0).gt(0)) && (pair.gauge?.additionalApr1 && BigNumber(pair?.gauge?.additionalApr1).gt(0)) &&
                  <div className={classes.profitItemDivider}></div>
              }
              {(pair.gauge?.additionalApr1 && BigNumber(pair?.gauge?.additionalApr1).gt(0)) &&
                  <div className={classes.profitItem}>
                    <div className={[ classes.profitLabel, classes[ `profitLabel--shortage` ] ].join(' ')}>
                      Bonus {pair.token1.symbol} APR
                      <span style={{marginLeft: 4,}}>
                        {formatCurrency(
                            BigNumber(pair?.gauge?.additionalApr1),
                            2
                        )}
                        %
                      </span>{" "}
                    </div>
                  </div>
              }
            </div>
        }
        <div className={classes.profitWrapper}>
          <div className={classes.profitItem}>{profitRender()}</div>
          {!isShowNote && <>
            <div className={classes.profitItemDivider}></div>
            <div className={`${classes.profitItem} ${classes.profitItemBoosted}`}>{profitRender(boostedType)}</div>
          </>}
        </div>
        {!isShowNote && <div className={classes.createAction}>
          <div className={classes.createActionNote}>
            You need to have NFT with {fixed(boostedNFTAmount)} {VE_TOKEN_NAME} Power. Create or select/merge
            NFTs.
          </div>
          <div className={classes.createActionButton} onClick={createAction}>Create {VE_TOKEN_NAME}</div>
        </div>}
      </div>
  );
}
