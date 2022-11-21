import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router'
import {
    TextField,
    Typography,
    CircularProgress,
    InputBase, DialogTitle, DialogContent, Dialog, Slide, Tooltip,
} from "@mui/material";
import { withTheme } from "@mui/styles";
import {
  formatCurrency,
  formatInputAmount,
} from "../../utils";
import classes from "./ssSwap.module.css";
import stores from "../../stores";
import {
    ACTIONS,
    CONTRACTS,
    DEFAULT_ASSET_FROM,
    DEFAULT_ASSET_TO,
} from "../../stores/constants";
import BigNumber from "bignumber.js";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import BtnSwap from "../../ui/BtnSwap";
import AssetSelect from "../../ui/AssetSelect";

const Transition = React.forwardRef((props, ref) => (
    <Slide direction="up" {...props} ref={ref} />
));

function Setup() {
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [fromAmountValue, setFromAmountValue] = useState("");
  const [fromAmountError, setFromAmountError] = useState(false);
  const [fromAssetValue, setFromAssetValue] = useState(null);
  const [fromAssetError, setFromAssetError] = useState(false);
  const [fromAssetOptions, setFromAssetOptions] = useState([]);

  const [toAmountValue, setToAmountValue] = useState("");
  const [toAmountError, setToAmountError] = useState(false);
  const [toAssetValue, setToAssetValue] = useState(null);
  const [toAssetError, setToAssetError] = useState(false);
  const [toAssetOptions, setToAssetOptions] = useState([]);

  const [slippage, setSlippage] = useState(localStorage && localStorage.getItem('slippage') ? localStorage && localStorage.getItem('slippage') : "2");
  const [slippageError, setSlippageError] = useState(false);

  const [quoteError, setQuoteError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [hidequote, sethidequote] = useState(false);
  const [hintAnchor, setHintAnchor] = React.useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [settingsOpened, setSettingsOpened] = useState(false);
  const [routingOpened, setRoutingOpened] = useState(false);

  const { appTheme } = useAppThemeContext();

  const router = useRouter()

  const handleClickPopover = (event) => {
    setHintAnchor(event.currentTarget);
  };

  const handleClosePopover = () => {
    setHintAnchor(null);
  };

  const openHint = Boolean(hintAnchor);

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  useEffect(
      function () {
        const errorReturned = () => {
          setLoading(false);
          setApprovalLoading(false);
          setQuoteLoading(false);
        };

        const quoteReturned = (val) => {
          if (!val) {
            setQuoteLoading(false);
            setQuote(null);
            setToAmountValue("");
            setQuoteError(
                "Insufficient liquidity or no route available to complete swap"
            );
          }
          if (
              val &&
              val.inputs &&
              val.inputs.fromAmount === fromAmountValue &&
              val.inputs.fromAsset.address === fromAssetValue.address &&
              val.inputs.toAsset.address === toAssetValue.address
          ) {
            setQuoteLoading(false);
            if (BigNumber(val.output.finalValue).eq(0)) {
              setQuote(null);
              setToAmountValue("");
              setQuoteError(
                  "Insufficient liquidity or no route available to complete swap"
              );
              return;
            }

            setToAmountValue(BigNumber(val.output.finalValue).toFixed(8));
            setQuote(val);
          }
        };

        const ssUpdated = () => {
          const baseAsset = stores.stableSwapStore.getStore("baseAssets");

          setToAssetOptions(baseAsset);
          setFromAssetOptions(baseAsset);

          if (baseAsset.length > 0 && (toAssetValue == null || toAssetValue.chainId === "not_inited")) {
              let toIndex
              if (router.query.to) {
                  const index = baseAsset.findIndex((token) => {
                      return token.address?.toLowerCase() === router.query.to.toLowerCase();
                  });
                  if (index !== -1) {
                      toIndex = index
                  }
              }
              if (!toIndex) {
                  toIndex = baseAsset.findIndex((token) => {
                      return token.address?.toLowerCase() === DEFAULT_ASSET_TO.toLowerCase();
                  });
              }

              setToAssetValue(baseAsset[toIndex]);
          }

          if (baseAsset.length > 0 && (fromAssetValue == null || fromAssetValue.chainId === "not_inited")) {
              let fromIndex;

              if (router.query.from) {
                  const index = baseAsset.findIndex((token) => {
                      return token.address?.toLowerCase() === router.query.from.toLowerCase();
                  });
                  if (index !== -1) {
                      fromIndex = index
                  }
              }

              if (!fromIndex) {
                  fromIndex = baseAsset.findIndex((token) => {
                      return token.address.toLowerCase() === DEFAULT_ASSET_FROM.toLowerCase();
                  });
              }

              setFromAssetValue(baseAsset[fromIndex]);
          }
          forceUpdate();
        };

        const assetsUpdated = () => {
          const baseAsset = stores.stableSwapStore.getStore("baseAssets");

          setToAssetOptions(baseAsset);
          setFromAssetOptions(baseAsset);
        };

        const swapReturned = (event) => {
          setLoading(false);
          setFromAmountValue("");
          setToAmountValue("");
          if (
              !(
                  (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                      fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
                  (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL ||
                      toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
              )
          ) {
              sethidequote(false);
              calculateReceiveAmount(0, fromAssetValue, toAssetValue);
          }
          else {
            sethidequote(true);
            setToAmountValue(0);
          }
          setQuote(null);
          setQuoteLoading(false);
        };
        const wrapReturned = () => {
          setLoading(false);
        };

        stores.emitter.on(ACTIONS.ERROR, errorReturned);
        stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
        stores.emitter.on(ACTIONS.WRAP_RETURNED, wrapReturned);
        stores.emitter.on(ACTIONS.UNWRAP_RETURNED, wrapReturned);
        stores.emitter.on(ACTIONS.SWAP_RETURNED, swapReturned);
        stores.emitter.on(ACTIONS.QUOTE_SWAP_RETURNED, quoteReturned);
        stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);

        ssUpdated();

        return () => {
          stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
          stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
          stores.emitter.removeListener(ACTIONS.SWAP_RETURNED, swapReturned);
          stores.emitter.removeListener(
              ACTIONS.QUOTE_SWAP_RETURNED,
              quoteReturned
          );
          stores.emitter.removeListener(
              ACTIONS.BASE_ASSETS_UPDATED,
              assetsUpdated
          );
        };
      },
      [fromAmountValue, fromAssetValue, toAssetValue]
  );

  const onAssetSelect = (type, value) => {
      let from, to;
    if (type === "From") {
      if (value.address === toAssetValue.address) {
          to = fromAssetValue.address
          from = toAssetValue.address
        setToAssetValue(fromAssetValue);
        setFromAssetValue(toAssetValue);
          if (
              !(
                  (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                      fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
                  (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL ||
                      toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
              )
          ) {
              sethidequote(false);
              calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
          }
          else {
              sethidequote(true);
              setToAmountValue(fromAmountValue);
          }
      } else {
          from = value.address
          to = toAssetValue.address
        setFromAssetValue(value);
          if (
              !(
                  (value?.symbol == CONTRACTS.FTM_SYMBOL || value?.symbol == CONTRACTS.WFTM_SYMBOL) &&
                  (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL ||
                      toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
              )
          ) {
              sethidequote(false);
              calculateReceiveAmount(fromAmountValue, value, toAssetValue);
          }
          else {
              sethidequote(true);
              setToAmountValue(fromAmountValue);
          }
      }
    } else {
      if (value.address === fromAssetValue.address) {
          to = fromAssetValue.address
          from = toAssetValue.address
        setFromAssetValue(toAssetValue);
        setToAssetValue(fromAssetValue);
          if (
              !(
                  (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                      fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
                  (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL ||
                      toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
              )
          ) {
              sethidequote(false);
              calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
          }
          else {
              sethidequote(true);
              setToAmountValue(fromAmountValue);
          }
      } else {
          from = fromAssetValue.address
          to = value.address
        setToAssetValue(value);
          if (
              !(
                  (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                      fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
                  (value?.symbol == CONTRACTS.WFTM_SYMBOL || value?.symbol == CONTRACTS.FTM_SYMBOL)
              )
          ) {
              sethidequote(false);
              calculateReceiveAmount(fromAmountValue, fromAssetValue, value);
          }
          else {
              sethidequote(true);
              setToAmountValue(fromAmountValue);
          }
      }
    }

    router.push(`/swap?from=${from}&to=${to}`, undefined, { shallow: true })

    forceUpdate();
  };

  const fromAmountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));

    setFromAmountError(false);
    setFromAmountValue(value);
    if (value == "" || Number(value) === 0) {
      setToAmountValue("");
      setQuote(null);
    } else {
        if (
            !(
                (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                    fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
                (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL || toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
            )
        ) {
            sethidequote(false);
            calculateReceiveAmount(value, fromAssetValue, toAssetValue);
        }
        else {
            sethidequote(true);
            setToAmountValue(value);
        }
    }
  };

  const toAmountChanged = (event) => {};

  const onSlippageChanged = (slippageAmount) => {
      // console.log('setSlippage')
      localStorage.setItem('slippage', slippageAmount)
      setSlippage(slippageAmount);
  };

  const calculateReceiveAmount = (amount, from, to) => {
    if (amount !== "" && !isNaN(amount) && to != null) {
      setQuoteLoading(true);
      setQuoteError(false);

      stores.dispatcher.dispatch({
        type: ACTIONS.QUOTE_SWAP,
        content: {
          fromAsset: from,
          toAsset: to,
          fromAmount: amount,
        },
      });
    }
  };

  const onSwap = () => {
    if (
        !fromAmountValue ||
        fromAmountValue > Number(fromAssetValue.balance) ||
        Number(fromAmountValue) <= 0
    ) {
      return;
    }

    setFromAmountError(false);
    setFromAssetError(false);
    setToAssetError(false);

    let error = false;

    if (!fromAmountValue || fromAmountValue === "" || isNaN(fromAmountValue)) {
      setFromAmountError("From amount is required");
      error = true;
    } else {
      if (
          !fromAssetValue.balance ||
          isNaN(fromAssetValue.balance) ||
          BigNumber(fromAssetValue.balance).lte(0)
      ) {
        setFromAmountError("Invalid balance");
        error = true;
      } else if (BigNumber(fromAmountValue).lt(0)) {
        setFromAmountError("Invalid amount");
        error = true;
      } else if (
          fromAssetValue &&
          BigNumber(fromAmountValue).gt(fromAssetValue.balance)
      ) {
        setFromAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!fromAssetValue || fromAssetValue === null) {
      setFromAssetError("From asset is required");
      error = true;
    }

    if (!toAssetValue || toAssetValue === null) {
      setFromAssetError("To asset is required");
      error = true;
    }

    if (!error) {
      setLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.SWAP,
        content: {
          fromAsset: fromAssetValue,
          toAsset: toAssetValue,
          fromAmount: fromAmountValue,
          toAmount: toAmountValue,
          quote: quote,
          slippage: slippage,
        },
      });
    }
  };

    const onWrap = () => {
        if (
            !fromAmountValue ||
            fromAmountValue > Number(fromAssetValue.balance) ||
            Number(fromAmountValue) <= 0
        ) {
            return;
        }

        setFromAmountError(false);
        setFromAssetError(false);
        setToAssetError(false);

        let error = false;

        if (!fromAmountValue || fromAmountValue === "" || isNaN(fromAmountValue)) {
            setFromAmountError("From amount is required");
            error = true;
        } else {
            if (
                !fromAssetValue.balance ||
                isNaN(fromAssetValue.balance) ||
                BigNumber(fromAssetValue.balance).lte(0)
            ) {
                setFromAmountError("Invalid balance");
                error = true;
            } else if (BigNumber(fromAmountValue).lt(0)) {
                setFromAmountError("Invalid amount");
                error = true;
            } else if (
                fromAssetValue &&
                BigNumber(fromAmountValue).gt(fromAssetValue.balance)
            ) {
                setFromAmountError(`Greater than your available balance`);
                error = true;
            }
        }

        if (!fromAssetValue || fromAssetValue === null) {
            setFromAssetError("From asset is required");
            error = true;
        }

        if (!toAssetValue || toAssetValue === null) {
            setFromAssetError("To asset is required");
            error = true;
        }

        if (!error) {
            setLoading(true);

            stores.dispatcher.dispatch({
                type: ACTIONS.WRAP,
                content: {
                    fromAsset: fromAssetValue,
                    toAsset: toAssetValue,
                    fromAmount: fromAmountValue,
                    toAmount: toAmountValue,
                    quote: quote,
                    slippage: slippage,
                },
            });
        }
    };
    const onUnwrap = () => {
        if (
            !fromAmountValue ||
            fromAmountValue > Number(fromAssetValue.balance) ||
            Number(fromAmountValue) <= 0
        ) {
            return;
        }

        setFromAmountError(false);
        setFromAssetError(false);
        setToAssetError(false);

        let error = false;

        if (!fromAmountValue || fromAmountValue === "" || isNaN(fromAmountValue)) {
            setFromAmountError("From amount is required");
            error = true;
        } else {
            if (
                !fromAssetValue.balance ||
                isNaN(fromAssetValue.balance) ||
                BigNumber(fromAssetValue.balance).lte(0)
            ) {
                setFromAmountError("Invalid balance");
                error = true;
            } else if (BigNumber(fromAmountValue).lt(0)) {
                setFromAmountError("Invalid amount");
                error = true;
            } else if (
                fromAssetValue &&
                BigNumber(fromAmountValue).gt(fromAssetValue.balance)
            ) {
                setFromAmountError(`Greater than your available balance`);
                error = true;
            }
        }

        if (!fromAssetValue || fromAssetValue === null) {
            setFromAssetError("From asset is required");
            error = true;
        }

        if (!toAssetValue || toAssetValue === null) {
            setFromAssetError("To asset is required");
            error = true;
        }

        if (!error) {
            setLoading(true);

            stores.dispatcher.dispatch({
                type: ACTIONS.UNWRAP,
                content: {
                    fromAsset: fromAssetValue,
                    toAsset: toAssetValue,
                    fromAmount: fromAmountValue,
                    toAmount: toAmountValue,
                    quote: quote,
                    slippage: slippage,
                },
            });
        }
    };

  const setBalance100 = () => {
    setFromAmountValue(fromAssetValue.balance);
      if (
          !(
              (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                  fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
              (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL || toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
          )
      ) {
          sethidequote(false);
          calculateReceiveAmount(
              fromAssetValue.balance,
              fromAssetValue,
              toAssetValue
          );
      }
      else {
          sethidequote(true);
          setToAmountValue(fromAssetValue.balance);
      }
  };

  const swapAssets = () => {
    const fa = fromAssetValue;
    const ta = toAssetValue;
    setFromAssetValue(ta);
    setToAssetValue(fa);

    router.push(`/swap?from=${ta.address}&to=${fa.address}`, undefined, { shallow: true })

    const toAmount = toAmountValue

      if (
          !(
              (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                  fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
              (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL || toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
          )
      ) {
          sethidequote(false);
          setFromAmountValue(toAmount)
          setToAmountValue("");
          setQuote(null);
          calculateReceiveAmount(toAmountValue, ta, fa);
      }
      else {
          sethidequote(true);
          setToAmountValue(fromAmountValue);
      }
  };

  const renderSwapInformation = () => {
    if (!quoteError && !quoteLoading && quote) {
      return (
          <div className={[classes.controlsInfo, BigNumber(quote.priceImpact).gt(5) || BigNumber(quote.priceImpact).lt(0)
              ? classes.controlsInfoBad
              : classes.controlsInfoGood,].join(" ")}>
               <span className={classes.priceImpactTitle}>
                   Price impact
               </span>
              <span
                  className={[classes.priceImpactValue,

                  ].join(" ")}>
                        {quote.priceImpact > 0 ? formatCurrency(quote.priceImpact) : "Unknown"}%
                      </span>
          </div>
      );
    }

    return null
  };

  const renderBalanceIsBellowError = () => {
    if (!quoteError && !quoteLoading && quote && fromAmountValue > Number(fromAssetValue.balance)) {
      return (
          <div
              style={{ marginBottom: 20 }}
              className={[
                classes.warningContainer,
                classes[`warningContainer--${appTheme}`],
                classes.warningContainerError
              ].join(" ")}
          >
            <img src="/images/ui/info-circle-red.svg" width="24px" style={{ marginRight: 8 }} />
            <Typography
                className={classes.warningError}
                align="center"
            >
                Your {fromAssetValue?.symbol} balance is too low.
            </Typography>
          </div>
      )
    }

    return null;
  }

  const renderRoute = (visible, handleClose) => {
    if (!quoteError && !quoteLoading && quote) {
      return (
          <Dialog
              className={classes.dialogScale}
              classes={{
                  root: classes.rootPaper,
                  scrollPaper: classes.topScrollPaper,
                  paper: classes.paperBody,
              }}
              open={visible}
              onClose={handleClose}
              onClick={(e) => {
                  if (e.target.classList.contains('MuiDialog-container')) {
                      handleClose()
                  }
              }}
              fullWidth={true}
              maxWidth={"sm"}
              TransitionComponent={Transition}
              fullScreen={false}
          >
              <div className={classes.tvAntenna}>
                  <svg width="56" height="28" viewBox="0 0 56 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_116_22640)">
                          <path fillRule="evenodd" clipRule="evenodd" d="M53.7324 1.53632C51.8193 0.431753 49.3729 1.08725 48.2683 3.00042C47.4709 4.38158 47.5908 6.04061 48.4389 7.27208L33.2833 22.4277C31.9114 21.3226 30.1671 20.6611 28.2683 20.6611C26.2328 20.6611 24.3748 21.4213 22.9629 22.6733L7.56181 7.27224C8.40988 6.04078 8.52973 4.38181 7.73235 3.00071C6.62778 1.08754 4.18142 0.432036 2.26825 1.53661C0.355075 2.64117 -0.300425 5.08754 0.804144 7.00071C1.86628 8.84038 4.16909 9.51716 6.04549 8.58435L21.6406 24.1794C20.7743 25.4579 20.2683 27.0004 20.2683 28.6611H36.2683C36.2683 26.8626 35.6748 25.2026 34.6729 23.8665L49.9553 8.58413C51.8317 9.51684 54.1344 8.84005 55.1965 7.00042C56.3011 5.08725 55.6456 2.64089 53.7324 1.53632Z" fill="#EAE8E1"/>
                      </g>
                      <defs>
                          <clipPath id="clip0_116_22640">
                              <rect width="56" height="28" fill="white"/>
                          </clipPath>
                      </defs>
                  </svg>
              </div>
              <div className={classes.realDialog}>
                  <DialogTitle
                      classes={{root: classes.dialogTitle,}}
                      /*style={{
                          padding: 20,
                          fontWeight: 700,
                          fontSize: 24,
                          lineHeight: '32px',
                          color: '#131313',
                      }}*/
                  >
                      <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                      }}>
                          <div>
                              Routing
                          </div>
                          <div
                              className={classes.dialogClose}
                              /*style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  width: 20,
                                  height: 20,
                                  cursor: 'pointer',
                              }}*/
                              onClick={handleClose}
                          >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 13.4142L8.70711 16.7071L7.29289 15.2929L10.5858 12L7.29289 8.70711L8.70711 7.29289L12 10.5858L15.2929 7.29289L16.7071 8.70711L13.4142 12L16.7071 15.2929L15.2929 16.7071L12 13.4142Z" fill="#131313"/>
                              </svg>
                          </div>
                      </div>
                  </DialogTitle>

                  <DialogContent
                      classes={{
                          root: classes.dialogContent,
                      }}
                  >
                      <div className={classes.inner}>
                          <div>
                              <div
                                  className={[classes.route, classes[`route--${appTheme}`]].join(" ")}
                              >
                                  <div className={classes.routeIconWrap}>
                                      <img
                                          className={[
                                              classes.routeIcon,
                                              classes[`routeIcon--${appTheme}`],
                                          ].join(" ")}
                                          alt=""
                                          src={fromAssetValue ? `${fromAssetValue.logoURI}` : ""}
                                          width="30px"
                                          height="30px"
                                          onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                          }}
                                      />
                                  </div>

                                  <div className={classes.line}>
                                      {!quote?.output?.routeAsset && (
                                          <div
                                              className={[
                                                  classes.routeLinesLeft,
                                                  classes[`routeLinesLeft--${appTheme}`],
                                              ].join(" ")}
                                          >
                                              <div className={classes.routeLinesLeftArrow} />
                                          </div>
                                      )}

                                      {quote?.output?.routeAsset && (
                                          <>
                                              <div
                                                  className={[
                                                      classes.routeLinesLeftPart1,
                                                      classes[`routeLinesLeft--${appTheme}`],
                                                  ].join(" ")}
                                              >
                                                  <div className={classes.routeLinesLeftPart1Arrow} />
                                              </div>
                                              <div
                                                  className={[
                                                      classes.routeLinesLeftText,
                                                      classes[`routeLinesLeftText--${appTheme}`],
                                                  ].join(" ")}
                                              >
                                                  {quote.output.routes[0].stable ? "Stable" : "Volatile"}
                                              </div>
                                              <div
                                                  className={[
                                                      classes.routeLinesLeftPart2,
                                                      classes[`routeLinesLeft--${appTheme}`],
                                                  ].join(" ")}
                                              >
                                                  <div className={classes.routeLinesLeftPart2Arrow} />
                                              </div>

                                              <div className={classes.routeIconWrap}>
                                                  <img
                                                      className={[
                                                          classes.routeIcon,
                                                          classes[`routeIcon--${appTheme}`],
                                                      ].join(" ")}
                                                      alt=""
                                                      src={
                                                          quote.output.routeAsset
                                                              ? `${quote.output.routeAsset.logoURI}`
                                                              : ""
                                                      }
                                                      height="40px"
                                                      onError={(e) => {
                                                          e.target.onerror = null;
                                                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                                      }}
                                                  />
                                              </div>

                                              <div
                                                  className={[
                                                      classes.routeLinesRightPart1,
                                                      classes[`routeLinesLeft--${appTheme}`],
                                                  ].join(" ")}
                                              >
                                                  <div className={classes.routeLinesRightPart1Arrow} />
                                              </div>
                                              <div
                                                  className={[
                                                      classes.routeLinesRightText,
                                                      classes[`routeLinesRightText--${appTheme}`],
                                                  ].join(" ")}
                                              >
                                                  {quote.output.routes[1].stable ? "Stable" : "Volatile"}
                                              </div>
                                              <div
                                                  className={[
                                                      classes.routeLinesRightPart2,
                                                      classes[`routeLinesLeft--${appTheme}`],
                                                  ].join(" ")}
                                              >
                                                  <div className={classes.routeLinesRightPart2Arrow} />
                                              </div>
                                          </>
                                      )}

                                      {!quote?.output?.routeAsset && (
                                          <div
                                              className={[
                                                  classes.routeArrow,
                                                  classes[`routeArrow--${appTheme}`],
                                              ].join(" ")}
                                          >
                                              {quote.output.routes[0].stable ? "Stable" : "Volatile"}
                                          </div>
                                      )}

                                      {!quote?.output?.routeAsset && (
                                          <div
                                              className={[
                                                  classes.routeLinesRight,
                                                  classes[`routeLinesRight--${appTheme}`],
                                              ].join(" ")}
                                          >
                                              <div className={classes.routeLinesRightArrow} />
                                          </div>
                                      )}
                                  </div>

                                  <div className={classes.routeIconWrap}>
                                      <img
                                          className={[
                                              classes.routeIcon,
                                              classes[`routeIcon--${appTheme}`],
                                          ].join(" ")}
                                          alt=""
                                          src={toAssetValue ? `${toAssetValue.logoURI}` : ""}
                                          width="30px"
                                          height="30px"
                                          onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                          }}
                                      />
                                  </div>
                              </div>
                          </div>
                          <div className={classes.dialogButtonSecondary} onClick={handleClose}>
                              Back to Transaction
                          </div>
                      </div>
                  </DialogContent>
              </div>
          </Dialog>
      )
    }

    return null;
  }

  const renderSettings = (open, amountValue, amountError, slippageAmountChanged, handleClose) => {
      const isSuggestedSlippage = parseFloat(amountValue) === 0.5 || parseFloat(amountValue) === 1.0 || parseFloat(amountValue) === 2.0 || parseFloat(amountValue) === 3.0
      const [selectedAmount, setSelectedAmount] = useState(isSuggestedSlippage ? amountValue : '')
      const [typedAmount, setTypedAmount] = useState(isSuggestedSlippage ? '' : amountValue)
      const selectAmount = (amount) => {
          setSelectedAmount(amount)
          setTypedAmount('')
      }
      const onTypedChanged = (event) => {
          if (event.target.value == "" || !isNaN(event.target.value)) {
              setTypedAmount(event.target.value);
              setSelectedAmount('')
          }
      };

      const onApply = () => {
          const newSlippage = selectedAmount ? selectedAmount : typedAmount
          slippageAmountChanged(newSlippage)
          handleClose()
      }

      return (
        <Dialog
            className={classes.dialogScale}
            classes={{
                root: classes.rootPaper,
                scrollPaper: classes.topScrollPaper,
                paper: classes.paperBody,
            }}
            open={open}
            onClose={handleClose}
            onClick={(e) => {
                if (e.target.classList.contains('MuiDialog-container')) {
                    handleClose()
                }
            }}
            fullWidth={true}
            maxWidth={"sm"}
            TransitionComponent={Transition}
            fullScreen={false}
        >
            <div className={classes.tvAntenna}>
                <svg width="56" height="28" viewBox="0 0 56 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_116_22640)">
                        <path fillRule="evenodd" clipRule="evenodd" d="M53.7324 1.53632C51.8193 0.431753 49.3729 1.08725 48.2683 3.00042C47.4709 4.38158 47.5908 6.04061 48.4389 7.27208L33.2833 22.4277C31.9114 21.3226 30.1671 20.6611 28.2683 20.6611C26.2328 20.6611 24.3748 21.4213 22.9629 22.6733L7.56181 7.27224C8.40988 6.04078 8.52973 4.38181 7.73235 3.00071C6.62778 1.08754 4.18142 0.432036 2.26825 1.53661C0.355075 2.64117 -0.300425 5.08754 0.804144 7.00071C1.86628 8.84038 4.16909 9.51716 6.04549 8.58435L21.6406 24.1794C20.7743 25.4579 20.2683 27.0004 20.2683 28.6611H36.2683C36.2683 26.8626 35.6748 25.2026 34.6729 23.8665L49.9553 8.58413C51.8317 9.51684 54.1344 8.84005 55.1965 7.00042C56.3011 5.08725 55.6456 2.64089 53.7324 1.53632Z" fill="#EAE8E1"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_116_22640">
                            <rect width="56" height="28" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
            </div>
            <div className={classes.realDialog}>
                <DialogTitle
                    classes={{root: classes.dialogTitle,}}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            Transaction Settings
                        </div>

                        <div
                            className={classes.dialogClose}
                            onClick={handleClose}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 13.4142L8.70711 16.7071L7.29289 15.2929L10.5858 12L7.29289 8.70711L8.70711 7.29289L12 10.5858L15.2929 7.29289L16.7071 8.70711L13.4142 12L16.7071 15.2929L15.2929 16.7071L12 13.4142Z" fill="#131313"/>
                            </svg>
                        </div>
                    </div>
                </DialogTitle>

                <DialogContent
                    classes={{
                        root: classes.dialogContent,
                    }}
                >
                    <div className={classes.inner}>
                        <div className={classes.slippage}>
                            <div
                                className={[
                                    "g-flex",
                                    "g-flex--align-center",
                                    classes.slippageLabel,
                                ].join(" ")}
                            >
                                <Typography
                                    className={[
                                        classes.inputBalanceSlippage,
                                        classes[`inputBalanceSlippage--${appTheme}`],
                                    ].join(" ")}
                                    noWrap
                                >
                                    Slippage
                                </Typography>

                                <div className={classes.inputBalanceSlippageHelp}>
                                    <Tooltip
                                        title="Slippage is the price difference between the submission of a transaction and the confirmation of the transaction on the blockchain."
                                        componentsProps={{
                                            tooltip: {
                                                style: {
                                                    padding: '12px 24px',
                                                    fontFamily: 'PT Root UI',
                                                    fontSize: 16,
                                                    fontWeight: 400,
                                                    lineHeight: '24px',
                                                    border: '1px solid #779BF4',
                                                    borderRadius: 12,
                                                    background: '#1F2B49',
                                                    color: '#E4E9F4',
                                                }
                                            },
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8ZM8.66667 5.33333C8.66667 5.70152 8.36819 6 8 6C7.63181 6 7.33333 5.70152 7.33333 5.33333C7.33333 4.96514 7.63181 4.66667 8 4.66667C8.36819 4.66667 8.66667 4.96514 8.66667 5.33333ZM8.75 11.3333V7.33333H7.25V11.3333H8.75Z" fill="#9A9FAF"/>
                                        </svg>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className={classes.slippageInputs}>
                                <div onClick={() => {selectAmount(0.5)}} className={parseFloat(selectedAmount) === 0.5 ? classes.slippageValueButtonActive : classes.slippageValueButton}>0.5%</div>
                                <div onClick={() => {selectAmount(1)}} className={parseFloat(selectedAmount) === 1 ? classes.slippageValueButtonActive : classes.slippageValueButton}>1%</div>
                                <div onClick={() => {selectAmount(2)}} className={parseFloat(selectedAmount) === 2 ? classes.slippageValueButtonActive : classes.slippageValueButton}>2%</div>
                                <div onClick={() => {selectAmount(3)}} className={parseFloat(selectedAmount) === 3 ? classes.slippageValueButtonActive : classes.slippageValueButton}>3%</div>

                                <TextField
                                    placeholder="custom"
                                    error={amountError}
                                    value={typedAmount}
                                    onChange={onTypedChanged}
                                    disabled={loading}
                                    autoComplete="off"
                                    fullWidth
                                    InputProps={{
                                        classes: {
                                            root: [
                                                classes.inputBalanceSlippageText,
                                                classes[`inputBalanceSlippageText--${appTheme}`],
                                            ].join(" "),
                                        },
                                    }}
                                    inputProps={{
                                        // size: typedAmount?.length || 4,
                                        style: {
                                            padding: 0,
                                            borderRadius: 0,
                                            border: "none",
                                            color: "#E4E9F4",
                                        },
                                    }}
                                />
                            </div>
                        </div>
                        <div onClick={onApply} className={classes.settingsSaveButton}>Apply Settings</div>
                    </div>
                </DialogContent>
            </div>
        </Dialog>
    );
  };

  const renderMassiveInput = (
      type,
      amountValue,
      amountError,
      amountChanged,
      assetValue,
      assetError,
      assetOptions,
      onAssetSelect,
      priceCompareText
  ) => {
    return (
        <div
            className={[
              classes.textField,
              classes[`textField--${type}-${appTheme}`],
            ].join(" ")}
        >
          <div className={classes.inputRow}>
            <div className={classes.inputColumn}>
              <div className={classes.massiveInputTitle}>
                <Typography className={classes.inputTitleText} noWrap>
                  <span className={classes.inputTitleTextText}>{type === "From" ? "From :" : "To :"}</span>

                  <span className={classes.inputTitleTextData}>{priceCompareText}</span>
                </Typography>
              </div>

              <div className={classes.massiveInputAssetSelect}>
                <AssetSelect
                    type={type}
                    value={assetValue}
                    assetOptions={assetOptions}
                    onSelect={onAssetSelect}
                />
              </div>
            </div>

            <div className={classes.inputColumn}>
              <div className={classes.massiveInputTitle}>
                <div
                    className={[
                      classes.inputBalanceTextContainer,
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                >
                  <Typography
                      className={[classes.inputBalanceText, "g-flex__item"].join(
                          " "
                      )}
                      noWrap
                      onClick={() => setBalance100()}
                  >
                  <span>
                      Balance:
                    {assetValue && assetValue.balance
                        ? " " + formatCurrency(assetValue.balance)
                        : ""}
                  </span>
                  </Typography>

                  {assetValue?.balance &&
                  Number(assetValue?.balance) > 0 &&
                      (type === "From") && (
                      <div
                          className={classes.max}
                          onClick={() => setBalance100()}
                      >
                        MAX
                      </div>
                  )}
                </div>
              </div>

              <InputBase
                  className={[
                    classes.massiveInputAmount,
                    type === "From" && fromAmountValue > Number(fromAssetValue?.balance) ? classes.massiveInputAmountError : ''
                  ].join(" ")}
                  placeholder="0.00"
                  error={amountError}
                  value={amountValue}
                  onChange={amountChanged}
                  disabled={loading || type === "To"}
                  inputMode={"decimal"}
                  inputProps={{
                    className: [
                      classes.largeInput,
                      classes[`largeInput--${appTheme}`],
                    ].join(" "),
                  }}
              />
            </div>
          </div>
          {/* <div
          className={`${classes.massiveInputContainer} ${
            (amountError || assetError) && classes.error
          }`}
        >
        </div> */}
        </div>
    );
  };

  const [swapIconBgColor, setSwapIconBgColor] = useState(null);
  const [swapIconBorderColor, setSwapIconBorderColor] = useState(null);
  const [swapIconArrowColor, setSwapIconArrowColor] = useState(null);

  const swapIconHover = () => {
    setSwapIconBgColor(appTheme === "dark" ? "#2D3741" : "#9BC9E4");
    setSwapIconBorderColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
    setSwapIconArrowColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
  };

  const swapIconClick = () => {
    setSwapIconBgColor(appTheme === "dark" ? "#5F7285" : "#86B9D6");
    setSwapIconBorderColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
    setSwapIconArrowColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
  };

  const swapIconDefault = () => {
    setSwapIconBgColor(null);
    setSwapIconBorderColor(null);
    setSwapIconArrowColor(null);
  };

  return (
      <div className={classes.swapInputs}>
        <div className={classes.swapInputsHeader}>
          <Typography className={classes.swapInputsHeader}>Swap</Typography>
            <div className={classes.settings} onClick={() => { setSettingsOpened(!settingsOpened) }}>
                <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.99997 0.484375C9.34253 0.484375 8.77058 0.905954 7.62667 1.74911L5.90576 3.01757C5.72555 3.1504 5.63545 3.21681 5.53871 3.27266C5.44198 3.32851 5.33941 3.37334 5.13427 3.46299L3.1753 4.31911C1.87315 4.88819 1.22208 5.17272 0.893356 5.74208C0.564637 6.31144 0.643758 7.01756 0.802 8.42979L1.04006 10.5544C1.06499 10.7768 1.07745 10.8881 1.07745 10.9998C1.07745 11.1115 1.06499 11.2227 1.04006 11.4452L0.802 13.5698C0.643758 14.982 0.564637 15.6881 0.893357 16.2575C1.22208 16.8269 1.87315 17.1114 3.1753 17.6805L5.13427 18.5366C5.33941 18.6262 5.44198 18.6711 5.53871 18.7269C5.63545 18.7828 5.72555 18.8492 5.90576 18.982L7.62667 20.2505C8.77058 21.0936 9.34253 21.5152 9.99997 21.5152C10.6574 21.5152 11.2294 21.0936 12.3733 20.2505L12.3733 20.2505L14.0942 18.982C14.2744 18.8492 14.3645 18.7828 14.4612 18.7269C14.558 18.6711 14.6605 18.6262 14.8657 18.5366L16.8246 17.6805C18.1268 17.1114 18.7779 16.8269 19.1066 16.2575C19.4353 15.6881 19.3562 14.982 19.1979 13.5698L18.9599 11.4452L18.9599 11.4452C18.935 11.2227 18.9225 11.1115 18.9225 10.9998C18.9225 10.8881 18.9349 10.7769 18.9599 10.5544L18.9599 10.5544L19.1979 8.42979C19.3562 7.01756 19.4353 6.31144 19.1066 5.74208C18.7779 5.17272 18.1268 4.88819 16.8246 4.31911L14.8657 3.46299L14.8657 3.46298C14.6605 3.37334 14.558 3.32851 14.4612 3.27266C14.3645 3.21681 14.2744 3.1504 14.0942 3.01757L12.3733 1.74911C11.2294 0.905954 10.6574 0.484375 9.99997 0.484375ZM9.99997 14.9998C12.2091 14.9998 14 13.2089 14 10.9998C14 8.79065 12.2091 6.99979 9.99997 6.99979C7.79083 6.99979 5.99997 8.79065 5.99997 10.9998C5.99997 13.2089 7.79083 14.9998 9.99997 14.9998Z" fill="#131313"/>
                </svg>
            </div>
            {renderSettings(
                settingsOpened,
                slippage,
                slippageError,
                onSlippageChanged,
                () => { setSettingsOpened(false) }
            )}
        </div>

          <div className={classes.inputsBlock}>
              {renderMassiveInput(
                  "From",
                  fromAmountValue,
                  fromAmountError,
                  fromAmountChanged,
                  fromAssetValue,
                  fromAssetError,
                  fromAssetOptions,
                  onAssetSelect,
                  quote &&
                  `1 ${fromAssetValue?.symbol} =
        ${!hidequote ? formatCurrency(
                      BigNumber(quote.output.finalValue)
                          .div(quote.inputs.fromAmount)
                          .toFixed(18)
                  ) : 1}
        ${toAssetValue?.symbol}`
              )}

              {fromAssetError && (
                  <div
                      style={{ marginTop: 20 }}
                      className={[
                          classes.warningContainer,
                          classes[`warningContainer--${appTheme}`],
                          classes.warningContainerError,
                      ].join(" ")}
                  >
                      <div
                          className={[
                              classes.warningDivider,
                              classes.warningDividerError,
                          ].join(" ")}
                      ></div>
                      <Typography
                          className={[
                              classes.warningError,
                              classes[`warningText--${appTheme}`],
                          ].join(" ")}
                          align="center"
                      >
                          {fromAssetError}
                      </Typography>
                  </div>
              )}

              <div className={classes.swapIconContainerOuter}>
                  <div className={classes.inputRow}>
                      <div className={classes.swapAssetsRow}>
                          <div
                              className={[
                                  classes.swapIconContainer,
                                  classes[`swapIconContainer--${appTheme}`],
                              ].join(" ")}
                              onMouseOver={swapIconHover}
                              onMouseOut={swapIconDefault}
                              onMouseDown={swapIconClick}
                              onMouseUp={swapIconDefault}
                              onTouchStart={swapIconClick}
                              onTouchEnd={swapIconDefault}
                              onClick={swapAssets}
                          >
                              <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M30 18.6667L30.5303 18.1363L31.0607 18.6667L30.5303 19.197L30 18.6667ZM20 18.6667L20 17.9167L20 18.6667ZM17.9167 17.3333C17.9167 16.9191 18.2525 16.5833 18.6667 16.5833C19.0809 16.5833 19.4167 16.9191 19.4167 17.3333L17.9167 17.3333ZM27.8637 15.4697L30.5303 18.1363L29.4697 19.197L26.803 16.5303L27.8637 15.4697ZM30.5303 19.197L27.8637 21.8637L26.803 20.803L29.4697 18.1363L30.5303 19.197ZM30 19.4167L20 19.4167L20 17.9167L30 17.9167L30 19.4167ZM20 19.4167C18.8494 19.4167 17.9167 18.4839 17.9167 17.3333L19.4167 17.3333C19.4167 17.6555 19.6778 17.9167 20 17.9167L20 19.4167Z" fill="#B1F1E3"/>
                                  <path d="M19.333 13.3332L18.8027 12.8028L18.2723 13.3332L18.8027 13.8635L19.333 13.3332ZM29.2497 14.6665C29.2497 15.0807 29.5855 15.4165 29.9997 15.4165C30.4139 15.4165 30.7497 15.0807 30.7497 14.6665H29.2497ZM21.4693 10.1362L18.8027 12.8028L19.8633 13.8635L22.53 11.1968L21.4693 10.1362ZM18.8027 13.8635L21.4693 16.5302L22.53 15.4695L19.8633 12.8028L18.8027 13.8635ZM19.333 14.0832H28.6663V12.5832H19.333V14.0832ZM28.6663 14.0832C28.9885 14.0832 29.2497 14.3443 29.2497 14.6665H30.7497C30.7497 13.5159 29.8169 12.5832 28.6663 12.5832V14.0832Z" fill="#B1F1E3"/>
                                  <rect x="0.5" y="0.5" width="47" height="31" rx="15.5" stroke="#9A9FAF"/>
                              </svg>
                          </div>
                          <div className={classes.swapAssetsPriceText}>
                              {!hidequote && quote && `${formatCurrency(
                                  BigNumber(quote.inputs.fromAmount)
                                      .div(quote.output.finalValue)
                                      .toFixed(18))} ${fromAssetValue?.symbol} per 1 ${toAssetValue?.symbol}`}
                          </div>
                      </div>
                  </div>
              </div>

              {renderMassiveInput(
                  "To",
                  toAmountValue,
                  toAmountError,
                  toAmountChanged,
                  toAssetValue,
                  toAssetError,
                  toAssetOptions,
                  onAssetSelect,
                  quote &&
                  `1 ${toAssetValue?.symbol} = 
        ${!hidequote ? formatCurrency(
                      BigNumber(quote.inputs.fromAmount)
                          .div(quote.output.finalValue)
                          .toFixed(18)
                  ) : 1}
        ${fromAssetValue?.symbol}`
              )}
          </div>
        <div className={classes.spacer} />


          {(!fromAmountValue || Number(fromAmountValue) <= 0) &&
              <div
                  className={[
                      classes.warningContainer,
                      // classes.warningContainerError,
                  ].join(" ")}
              >
                  <svg className={classes.warningSvg} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C13.9706 0 18 4.02944 18 9ZM10 5C10 5.55228 9.55229 6 9 6C8.44771 6 8 5.55228 8 5C8 4.44772 8.44771 4 9 4C9.55229 4 10 4.44772 10 5ZM9.75 14V8H8.25V14H9.75Z" fill="#68727A"/>
                  </svg>
                  Select coins/tokens you want to swap and enter amounts.
              </div>
          }

        {toAssetError && (
            <div
                style={{ marginTop: 20, marginBottom: 20 }}
                className={[
                  classes.warningContainer,
                  classes[`warningContainer--${appTheme}`],
                  classes.warningContainerError,
                ].join(" ")}
            >
              <div
                  className={[
                    classes.warningDivider,
                    classes.warningDividerError,
                  ].join(" ")}
              ></div>
              <Typography
                  className={[
                    classes.warningError,
                    classes[`warningText--${appTheme}`],
                  ].join(" ")}
                  align="center"
              >
                {toAssetError}
              </Typography>
            </div>
        )}

        {slippageError && (
            <div
                style={{ marginTop: 20, marginBottom: 20 }}
                className={[
                  classes.warningContainer,
                  classes[`warningContainer--${appTheme}`],
                  classes.warningContainerError,
                ].join(" ")}
            >
              <div
                  className={[
                    classes.warningDivider,
                    classes.warningDividerError,
                  ].join(" ")}
              ></div>
              <Typography
                  className={[
                    classes.warningError,
                    classes[`warningText--${appTheme}`],
                  ].join(" ")}
                  align="center"
              >
                {slippageError}
              </Typography>
            </div>
        )}

        {quoteError && (
            <div
                className={[classes.quoteLoader, classes.quoteLoaderError].join(" ")}
            >
              <div
                  className={[classes.quoteLoaderIcon, classes.quoteLoaderIconError].join(
                      " "
                  )}
              >
                <img src="/images/ui/info-circle-red.svg" width="24px" />
              </div>
              <Typography className={classes.quoteError}>{quoteError}</Typography>
            </div>
        )}

        {renderBalanceIsBellowError()}

          {quote && BigNumber(quote.priceImpact).gt(5) && fromAmountValue <= Number(fromAssetValue.balance) &&
              <div
                  style={{ marginBottom: 20 }}
                  className={[
                      classes.warningContainer,
                      classes[`warningContainer--${appTheme}`],
                      classes.warningContainerError
                  ].join(" ")}
              >
                  <img src="/images/ui/info-circle-red.svg" width="24px" style={{ marginRight: 8 }} />
                  <Typography
                      className={classes.warningError}
                      align="center"
                  >
                      Price impact is too high! ARE YOU SURE?!
                  </Typography>
              </div>
          }

        {quoteLoading&&false && (
            <div
                className={[classes.quoteLoader, classes.quoteLoaderLoading].join(
                    " "
                )}
            >
              <CircularProgress size={20} className={classes.loadingCircle} />
            </div>
        )}

          <div className={classes.controls}>
              <div className={classes.controlsRow}>
                  <div className={classes.controlsBtn}>
                      <div className={classes.buttonPrefix}></div>
                      <BtnSwap
                          onClick={(fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL && toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL)
                              ? onWrap
                              : (fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL && toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
                                  ? onUnwrap
                                  : onSwap}
                          className={classes.btnSwap}
                          labelClassName={[
                              !fromAmountValue ||
                              fromAmountValue > Number(fromAssetValue?.balance) ||
                              Number(fromAmountValue) <= 0
                                  ? classes["actionButtonText--disabled"]
                                  : classes.actionButtonText,
                              quote
                                  ? BigNumber(quote.priceImpact).gt(5)
                                      ? classes.actionButtonTextError
                                      : classes.actionButtonTextErrorWarning
                                  : "",
                          ].join(" ")}
                          isDisabled={
                              !fromAmountValue ||
                              fromAmountValue > Number(fromAssetValue.balance) ||
                              Number(fromAmountValue) <= 0
                          }
                          loading={loading}
                          label={
                              loading && fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL && toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL
                                  ? "Wrap" //"Wrapping"
                                  : loading && fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL && toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL
                                      ? "Unwrap" // "Unwrapping"
                                      : loading &&
                                      !(
                                          (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL ||
                                              fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL) &&
                                          (toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL ||
                                              toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
                                      )
                                          ? "Swap" // "Swapping"
                                          : (fromAssetValue?.symbol == CONTRACTS.FTM_SYMBOL && toAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL)
                                              ? "Wrap"
                                              : (fromAssetValue?.symbol == CONTRACTS.WFTM_SYMBOL && toAssetValue?.symbol == CONTRACTS.FTM_SYMBOL)
                                                  ? "Unwrap"
                                                  : "Swap"
                          }
                      ></BtnSwap>
                      <div className={classes.buttonPostfix}></div>
                  </div>
                  {!hidequote ? renderSwapInformation() : null}
              </div>

            {!hidequote && !quoteError && !quoteLoading && quote &&
                <div className={classes.routeBlock} onClick={() => { setRoutingOpened(true)}}>
                    <div>Route</div>
                    <div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M2.97924 10.2709C4.36454 8.19808 7.26851 5 12 5C16.7314 5 19.6354 8.19808 21.0207 10.2709C21.4855 10.9665 21.718 11.3143 21.6968 11.9569C21.6757 12.5995 21.4088 12.9469 20.8752 13.6417C19.2861 15.7107 16.1129 19 12 19C7.88699 19 4.71384 15.7107 3.12471 13.6417C2.59106 12.9469 2.32424 12.5995 2.30308 11.9569C2.28193 11.3143 2.51436 10.9665 2.97924 10.2709ZM11.9999 16C14.2091 16 15.9999 14.2091 15.9999 12C15.9999 9.79086 14.2091 8 11.9999 8C9.79081 8 7.99995 9.79086 7.99995 12C7.99995 14.2091 9.79081 16 11.9999 16Z" fill="#7DB857"/>
                        </svg>
                    </div>
                </div>
            }
            {renderRoute(routingOpened, () => { setRoutingOpened(false) })}
        </div>
      </div>
  );
}

export default withTheme(Setup);
