import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  MenuItem,
  InputBase,
  Select,
  Dialog, DialogTitle, DialogContent, Slide,
} from "@mui/material";
import BigNumber from "bignumber.js";
import { formatCurrency } from "../../utils";
import classes from "./ssLiquidityManage.module.css";
import stores from "../../stores";
import {ACTIONS, CONTRACTS, DEFAULT_ASSET_FROM, DEFAULT_ASSET_TO} from "../../stores/constants";
import {FTM_SYMBOL, VE_TOKEN_NAME, WFTM_SYMBOL} from '../../stores/constants/contracts'
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import { formatInputAmount } from "../../utils";
import AssetSelect from "../../ui/AssetSelect";
// import Loader from "../../ui/Loader";
import Hint from "../hint/hint";
import BoostCalculator from './ssBoostCalculator';

const Transition = React.forwardRef((props, ref) => (
    <Slide direction="up" {...props} ref={ref} />
));

export default function ssLiquidityManage({initActiveTab = 'deposit',}) {
  const router = useRouter();
  const amount0Ref = useRef(null);
  const amount1Ref = useRef(null);
  const [hintAnchor, setHintAnchor] = React.useState(null);
  const [stablePoolHntAnchor, setStablePoolHntAnchor] = React.useState(null);
  const [volatilePoolHntAnchor, setVolatilePoolHntAnchor] = React.useState(null);

  const openHint = Boolean(hintAnchor);
  const openStablePoolHint = Boolean(stablePoolHntAnchor);
  const openVolatilePoolHint = Boolean(volatilePoolHntAnchor);

  const [pair, setPair] = useState(null);
  const [veToken, setVeToken] = useState(null);
  const [pairLoading, setPairLoading] = useState(true);

  const [depositLoading, setDepositLoading] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);
  const [depositStakeLoading, setDepositStakeLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [amount0, setAmount0] = useState("");
  const [amount0Error, setAmount0Error] = useState(false);
  const [amount1, setAmount1] = useState("");
  const [amount1Error, setAmount1Error] = useState(false);

  const [stable, setStable] = useState(false);

  const [asset0, setAsset0] = useState(null);
  const [asset1, setAsset1] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]);
  const [needAddToWhiteList, setNeedAddToWhiteList] = useState("");

  const [withdrawAsset, setWithdrawAsset] = useState(null);
  const [withdrawAassetOptions, setWithdrawAssetOptions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAmountError, setWithdrawAmountError] = useState(false);

  const [withdrawAmount0, setWithdrawAmount0] = useState("");
  const [withdrawAmount1, setWithdrawAmount1] = useState("");

  const [activeTab, setActiveTab] = useState(initActiveTab);
  const [quote, setQuote] = useState(null);
  const [withdrawQuote, setWithdrawQuote] = useState(null);

  const [priorityAsset, setPriorityAsset] = useState(0);
  const [advanced, setAdvanced] = useState(true);

  const [token, setToken] = useState(null);
  const [vestNFTs, setVestNFTs] = useState([]);

  const [slippage, setSlippage] = useState("2");
  const [slippageError, setSlippageError] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // const [anchorEl, setAnchorEl] = React.useState(null);

  const [withdrawAction, setWithdrawAction] = useState("unstake");

  const [createLP, setCreateLP] = useState(true);

  const { appTheme } = useAppThemeContext();

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  const handleClickPopover = (event) => {
    setHintAnchor(event.currentTarget)
  };

  const handleClosePopover = () => {
    setHintAnchor(null)
  };

  const handleStablePoolClickPopover = (event) => {
    setStablePoolHntAnchor(event.currentTarget)
  };

  const handleStablePoolClosePopover = () => {
    setStablePoolHntAnchor(null)
  };

  const handleVolatilePoolClickPopover = (event) => {
    setVolatilePoolHntAnchor(event.currentTarget)
  };

  const handleVolatilePoolClosePopover = () => {
    setVolatilePoolHntAnchor(null)
  };

  const checkIsWhiteListedPair = async (pair) => {
    if (pair === null) {
      return;
    }
    setNeedAddToWhiteList("");

    const web3 = await stores.accountStore.getWeb3Provider();

    const voterContract = new web3.eth.Contract(
      CONTRACTS.VOTER_ABI,
      CONTRACTS.VOTER_ADDRESS
    );

    const [token0, token1] = await Promise.all([
      voterContract.methods.isWhitelisted(pair.token0.address).call(),
      voterContract.methods.isWhitelisted(pair.token1.address).call(),
    ]);

    const symbols = [];

    if (token0 === false) {
      symbols.push(pair.token0.symbol);
    }

    if (token1 === false) {
      symbols.push(pair.token1.symbol);
    }

    if (symbols.length > 0) {
      setNeedAddToWhiteList(symbols.join(", "));
    }
  };

  const ssUpdated = async () => {
    // console.log('LIQUI update')
    const storeAssetOptions = stores.stableSwapStore.getStore("baseAssets");
    const nfts = stores.stableSwapStore.getStore("vestNFTs") ?? [];
    const veTok = stores.stableSwapStore.getStore("veToken");
    const pairs = stores.stableSwapStore.getStore("pairs");

    const onlyWithBalance = pairs.filter((ppp) => {
      return (
        BigNumber(ppp.balance).gt(0) ||
        (ppp.gauge && BigNumber(ppp.gauge.balance).gt(0))
      );
    });

    setWithdrawAssetOptions(onlyWithBalance);
    setWithdrawAsset(onlyWithBalance[0]);
    setAssetOptions(storeAssetOptions);
    setVeToken(veTok);
    setVestNFTs(nfts);

    if (nfts.length > 0) {
      if (token == null && nfts[0].attachments == '0') {
        setToken(nfts[0]);
      }
    }

    if (router.query.address && router.query.address !== "create") {

      const pp = await stores.stableSwapStore.getPairByAddress(
        router.query.address
      );
      setPair(pp);

      if (pp) {
        setWithdrawAsset(pp);
        setAsset0(pp.token0);
        setAsset1(pp.token1);
        setStable(pp.isStable);
      }

      if (pp && BigNumber(pp.balance).gt(0)) {
        setAdvanced(true);
      }
    } else {
      let aa0 = asset0;
      let aa1 = asset1;
      if (storeAssetOptions.length > 0 && asset0 == null) {
        const asset = storeAssetOptions.filter(a => a.id.toLowerCase() === DEFAULT_ASSET_FROM.toLowerCase())[0];
        setAsset0(asset);
        aa0 = asset;
      }
      if (storeAssetOptions.length > 1 && asset1 == null) {
        const asset = storeAssetOptions.filter(a => a.id.toLowerCase() === DEFAULT_ASSET_TO.toLowerCase())[0];
        setAsset1(asset);
        aa1 = asset;
      }
      if (withdrawAassetOptions.length > 0 && withdrawAsset == null) {
        setWithdrawAsset(withdrawAassetOptions[0]);
      }

      if (aa0 && aa1) {
        const p = await stores.stableSwapStore.getPair(
          aa0.address,
          aa1.address,
          stable
        );
        setPair(p);
      }
    }
  };

  useEffect(() => {
    const depositReturned = () => {
      setDepositLoading(false);
      setStakeLoading(false);
      setDepositStakeLoading(false);
      setCreateLoading(false);

      setAmount0("");
      setAmount1("");
      setQuote(null);
      setWithdrawAmount("");
      setWithdrawAmount0("");
      setWithdrawAmount1("");
      setWithdrawQuote(null);

      onBack();
    };

    const createGaugeReturned = () => {
      setCreateLoading(false);
      ssUpdated();
    };

    const errorReturned = () => {
      setDepositLoading(false);
      setStakeLoading(false);
      setDepositStakeLoading(false);
      setCreateLoading(false);
    };

    const quoteAddReturned = (res) => {
      setQuote(res.output);
    };

    const quoteRemoveReturned = (res) => {
      if (!res) {
        return;
      }
      setWithdrawQuote(res.output);
      setWithdrawAmount0(res.output.amount0);
      setWithdrawAmount1(res.output.amount1);
    };

    const assetsUpdated = () => {
      setAssetOptions(stores.stableSwapStore.getStore("baseAssets"));
    };

    // ssUpdated();

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.LIQUIDITY_ADDED, depositReturned);
    stores.emitter.on(ACTIONS.ADD_LIQUIDITY_AND_STAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_REMOVED, depositReturned);
    stores.emitter.on(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_STAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_UNSTAKED, depositReturned);
    stores.emitter.on(ACTIONS.PAIR_CREATED, depositReturned);
    stores.emitter.on(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, quoteAddReturned);
    stores.emitter.on(
      ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED,
      quoteRemoveReturned
    );
    stores.emitter.on(ACTIONS.CREATE_GAUGE_RETURNED, createGaugeReturned);
    stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
    stores.emitter.on(ACTIONS.ERROR, errorReturned);

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_ADDED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.ADD_LIQUIDITY_AND_STAKED,
        depositReturned
      );
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_REMOVED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED,
        depositReturned
      );
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_STAKED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.LIQUIDITY_UNSTAKED,
        depositReturned
      );
      stores.emitter.removeListener(ACTIONS.PAIR_CREATED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED,
        quoteAddReturned
      );
      stores.emitter.removeListener(
        ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED,
        quoteRemoveReturned
      );
      stores.emitter.removeListener(
        ACTIONS.CREATE_GAUGE_RETURNED,
        createGaugeReturned
      );
      stores.emitter.removeListener(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
    };
  }, []);

  useEffect(async () => {
    ssUpdated();
  }, [router.query.address]);

  const onBack = () => {
    router.push("/liquidity");
  };

  const callQuoteAddLiquidity = (
    amountA,
    amountB,
    pa,
    sta,
    pp,
    assetA,
    assetB
  ) => {
    if (parseFloat(pp?.reserve0) !== 0 && parseFloat(pp?.reserve1) !== 0) {
      if (!pp) {
        return null;
      }

      let invert = false;

      let addy0 = assetA.address;
      let addy1 = assetB.address;

      if (assetA.address === CONTRACTS.FTM_SYMBOL) {
        addy0 = CONTRACTS.WFTM_ADDRESS;
      }
      if (assetB.address === CONTRACTS.FTM_SYMBOL) {
        addy1 = CONTRACTS.WFTM_ADDRESS;
      }

      if (
        addy1.toLowerCase() === pp.token0.address.toLowerCase() &&
        addy0.toLowerCase() === pp.token1.address.toLowerCase()
      ) {
        invert = true;
      }

      if (pa === 0) {
        if (amountA === "") {
          setAmount1("");
        } else {
          if (invert) {
            amountB = BigNumber(amountA)
              .times(parseFloat(pp.reserve0))
              .div(parseFloat(pp.reserve1))
              .toFixed(
                parseFloat(pp.token0.decimals) > 6
                  ? 6
                  : parseFloat(pp.token0.decimals)
              );
          } else {
            amountB = BigNumber(amountA)
              .times(parseFloat(pp.reserve1))
              .div(parseFloat(pp.reserve0))
              .toFixed(
                parseFloat(pp.token1.decimals) > 6
                  ? 6
                  : parseFloat(pp.token1.decimals)
              );
          }
          setAmount1(amountB);
        }
      }
      if (pa === 1) {
        if (amountB === "") {
          setAmount0("");
        } else {
          if (invert) {
            amountA = BigNumber(amountB)
              .times(parseFloat(pp.reserve1))
              .div(parseFloat(pp.reserve0))
              .toFixed(
                parseFloat(pp.token1.decimals) > 6
                  ? 6
                  : parseFloat(pp.token1.decimals)
              );
          } else {
            amountA = BigNumber(amountB)
              .times(parseFloat(pp.reserve0))
              .div(parseFloat(pp.reserve1))
              .toFixed(
                parseFloat(pp.token0.decimals) > 6
                  ? 6
                  : parseFloat(pp.token0.decimals)
              );
          }
          setAmount0(amountA);
        }
      }

      if (
        BigNumber(amountA).lte(0) ||
        BigNumber(amountB).lte(0) ||
        isNaN(amountA) ||
        isNaN(amountB)
      ) {
        return null;
      }

      stores.dispatcher.dispatch({
        type: ACTIONS.QUOTE_ADD_LIQUIDITY,
        content: {
          pair: pp,
          token0: pp.token0,
          token1: pp.token1,
          amount0: amountA,
          amount1: amountB,
          stable: sta,
        },
      });
    }
  };

  const callQuoteRemoveLiquidity = (p, amount) => {
    if (!p) {
      return null;
    }

    stores.dispatcher.dispatch({
      type: ACTIONS.QUOTE_REMOVE_LIQUIDITY,
      content: {
        pair: p,
        token0: p.token0,
        token1: p.token1,
        withdrawAmount: amount,
      },
    });
  };

  const handleSelectToken = (t) => {
    setToken(t);
    setOpenSelectToken(false);
  };

  const onSlippageChanged = (slippageAmount) => {
    localStorage.setItem('slippage', slippageAmount)
    setSlippage(slippageAmount);
  };

  const setAmountPercent = (asset, input) => {
    setAmount0Error(false);
    setAmount1Error(false);

    if (input === "amount0") {
      let am = BigNumber(asset0.balance).toFixed(parseFloat(asset0.decimals));
      if (!isNaN(am)) setAmount0(am);
      callQuoteAddLiquidity(am, amount1, 0, stable, pair, asset0, asset1);
    } else if (input === "amount1") {
      let am = BigNumber(asset1.balance).toFixed(parseFloat(asset1.decimals));
      if (!isNaN(am)) setAmount1(am);
      callQuoteAddLiquidity(amount0, am, 1, stable, pair, asset0, asset1);
    } else if (input === "stake") {
      let am = BigNumber(asset.balance).toFixed(parseFloat(asset.decimals));
      if (!isNaN((am / asset?.balance) * 100))
        setAmount0((am / asset?.balance) * 100);
    } else if (input === "withdraw") {
      let am = "";
      am = BigNumber(asset.balance).toFixed(parseFloat(asset.decimals));
      if (!isNaN((am / asset.balance) * 100))
        setWithdrawAmount((am / asset.balance) * 100);

      if (am === "") {
        setWithdrawAmount0("");
        setWithdrawAmount1("");
      } else if (am !== "" && !isNaN(am)) {
        calcRemove(asset, am);
      }
    }
  };
  const setAmountPercentGauge = (asset, input) => {
    if (input === "withdraw") {
      let am = "";
      if (asset && asset.gauge) {
        am = BigNumber(asset.gauge.balance);
        if (!isNaN((am / asset.gauge.balance) * 100))
          setWithdrawAmount((am / asset.gauge.balance) * 100);
      }
      if (am === "") {
        setWithdrawAmount0("");
        setWithdrawAmount1("");
      } else if (am !== "" && !isNaN(am)) {
        calcRemove(asset, am);
      }
    }
  };

  const onDeposit = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === "" || isNaN(amount0)) {
      setAmount0Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset0.balance ||
        isNaN(asset0.balance) ||
        BigNumber(asset0.balance).lte(0)
      ) {
        setAmount0Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error("Invalid amount");
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Insufficient funds ${asset0?.symbol}`);
        error = true;
      }
    }

    if (!amount1 || amount1 === "" || isNaN(amount1)) {
      setAmount1Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset1.balance ||
        isNaN(asset1.balance) ||
        BigNumber(asset1.balance).lte(0)
      ) {
        setAmount1Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error("Invalid amount");
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Insufficient funds ${asset1?.symbol}`);
        error = true;
      }
    }

    if (!error) {
      setDepositLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.ADD_LIQUIDITY,
        content: {
          pair: pair,
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          minLiquidity: quote ? quote : "0",
          slippage: (slippage && slippage) !== "" ? slippage : "2",
        },
      });
    }
  };

  const onStake = (pair, percent, balance) => {
    setAmount0Error(false);

    let error = false;

    if (!error) {
      setStakeLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.STAKE_LIQUIDITY,
        content: {
          pair: pair,
          amount: (percent * balance) / 100,
          token: token,
          percent: percent,
          slippage: (slippage && slippage) !== "" ? slippage : "2",
        },
      });
    }
  };

  const onCreateAndDeposit = () => {
    setAmount0Error(false);
    setAmount1Error(false);
    let error = false;

    if (!amount0 || amount0 === "" || isNaN(amount0)) {
      setAmount0Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset0.balance ||
        isNaN(asset0.balance) ||
        BigNumber(asset0.balance).lte(0)
      ) {
        setAmount0Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error("Invalid amount");
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Insufficient funds ${asset0?.symbol}`);
        error = true;
      }
    }

    if (!amount1 || amount1 === "" || isNaN(amount1)) {
      setAmount1Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset1.balance ||
        isNaN(asset1.balance) ||
        BigNumber(asset1.balance).lte(0)
      ) {
        setAmount1Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error("Invalid amount");
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Insufficient funds ${asset1?.symbol}`);
        error = true;
      }
    }

    if (!asset0) {
      setAmount0Error("Asset is required");
      error = true;
    }

    if (!asset1) {
      setAmount1Error("Asset is required");
      error = true;
    }

    if (!error) {
      setDepositLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.CREATE_PAIR_AND_DEPOSIT,
        content: {
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          isStable: stable,
          token: token,
          slippage: (slippage && slippage) !== "" ? slippage : "2",
        },
      });
    }
  };

  const onWithdraw = (withdrawAsset) => {
    setWithdrawAmountError(false);

    let error = false;

    if (!withdrawAsset) {
      setWithdrawAmountError("Asset is required");
      error = true;
    }
    if (!withdrawAmount || withdrawAmount === "" || isNaN(withdrawAmount)) {
      setWithdrawAmountError("Amount is required");
      error = true;
    } else {
      if (BigNumber(withdrawAmount).lte(0)) {
        setWithdrawAmountError("Invalid amount");
        error = true;
      }
    }
    if (!error) {
      setDepositLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.REMOVE_LIQUIDITY,
        content: {
          pair: withdrawAsset,
          token0: withdrawAsset.token0,
          token1: withdrawAsset.token1,
          percent: withdrawAmount,
          slippage: (slippage && slippage) !== "" ? slippage : "2",
        },
      });
    }
  };

  const onUnstake = () => {
    setStakeLoading(true);

    stores.dispatcher.dispatch({
      type: ACTIONS.UNSTAKE_LIQUIDITY,
      content: {
        pair: pair,
        token0: pair.token0,
        token1: pair.token1,
        amount: (withdrawAmount * pair.gauge.balance) / 100,
        amount0: withdrawAmount0,
        amount1: withdrawAmount1,
        quote: withdrawQuote,
        percent: withdrawAmount,
        slippage: (slippage && slippage) !== "" ? slippage : "2",
        all: (withdrawAmount === '100')
      },
    });
  };

  const handleWithdraw = (withdrawAsset) => {
    if (withdrawAction === "unstake") {
      onUnstake();
    }

    if (withdrawAction === "remove") {
      onWithdraw(withdrawAsset);
    }
  };

  const onCreateGauge = () => {
    setCreateLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.CREATE_GAUGE,
      content: {
        pair: pair,
      },
    });
  };

  const toggleDeposit = () => {
    setActiveTab("deposit");
  };

  const toggleWithdraw = () => {
    setActiveTab("withdraw");
  };

  const amount0Changed = (balance) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));

    setAmount0Error(false);
    if (!createLP) {
      if (value <= 100) {
        if (!isNaN(value)) setAmount0(value);
      }
    } else {
      if (!isNaN(value)) setAmount0(value);
      if (createLP) {
        callQuoteAddLiquidity(
          value,
          amount1,
          priorityAsset,
          stable,
          pair,
          asset0,
          asset1
        );
      }
    }
  };

  const amount1Changed = () => {
    const value = formatInputAmount(event.target.value.replace(",", "."));
    setAmount1Error(false);
    if (!isNaN(value)) setAmount1(value);
    callQuoteAddLiquidity(
      amount0,
      value,
      priorityAsset,
      stable,
      pair,
      asset0,
      asset1
    );
  };

  const amount0Focused = (event) => {
    setPriorityAsset(0);
    if (createLP)
      callQuoteAddLiquidity(amount0, amount1, 0, stable, pair, asset0, asset1);
  };

  const amount1Focused = (event) => {
    setPriorityAsset(1);
    callQuoteAddLiquidity(amount0, amount1, 1, stable, pair, asset0, asset1);
  };

  const onAssetSelect = async (type, value) => {
    if (type === "amount0" && createLP) {
      setAsset0(value);
      const p = createLP
        ? await stores.stableSwapStore.getPair(
            value.address,
            asset1?.address,
            stable
          )
        : await stores.stableSwapStore.getPair(
            value.token0.address,
            value.token1.address,
            value.isStable
          );
      await checkIsWhiteListedPair(p);
      setPair(p);
      if (createLP) {
        callQuoteAddLiquidity(
          amount0,
          amount1,
          priorityAsset,
          stable,
          p,
          value,
          asset1
        );
      }
    } else if (type === "amount0" && !createLP) {
      setWithdrawAsset(value);
      setAsset0(value);
      const p = await stores.stableSwapStore.getPair(
        value.token0.address,
        value.token1.address,
        value.isStable
      );
      setPair(p);
    } else if (type === "amount1") {
      setAsset1(value);
      const p = await stores.stableSwapStore.getPair(
        asset0.address,
        value.address,
        stable
      );
      await checkIsWhiteListedPair(p);
      setPair(p);
      if (createLP) {
        callQuoteAddLiquidity(
          amount0,
          amount1,
          priorityAsset,
          stable,
          p,
          asset0,
          value
        );
      }
    } else if (type === "withdraw") {
      setWithdrawAsset(value);
      const p = await stores.stableSwapStore.getPair(
        value.token0.address,
        value.token1.address,
        value.isStable
      );
      setPair(p);
      calcRemove(p, withdrawAsset?.balance);
    }
  };

  const setStab = async (val) => {
    setStable(val);
    const p = await stores.stableSwapStore.getPair(
      asset0.address,
      asset1.address,
      val
    );
    setPair(p);

    callQuoteAddLiquidity(
      amount0,
      amount1,
      priorityAsset,
      val,
      p,
      asset0,
      asset1
    );
  };
  const swapAssets = async () => {
    const fa = asset0;
    const ta = asset1;
    const fam = amount0
    const tam = amount1
    setPriorityAsset(!priorityAsset)
    setAmount0(tam)
    setAmount1(fam)
    setAsset0(ta);
    setAsset1(fa);
    let pair = await stores.stableSwapStore.getPair(
      asset1.address,
      asset0.address,
      stable
    );
    callQuoteAddLiquidity(
      amount1,
      amount0,
      priorityAsset,
      stable,
      pair,
      asset1,
      asset0
    );
  };
  const withdrawAmountChanged = (withdrawAsset) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));

    setWithdrawAmountError(false);
    if (value <= 100) {
      if (!isNaN(value)) setWithdrawAmount(value);
    }
    if (value === "") {
      setWithdrawAmount0("");
      setWithdrawAmount1("");
    } else if (value !== "" && !isNaN(value) && value <= 100) {
      calcRemove(withdrawAsset, (value * withdrawAsset?.balance) / 100);
    }
  };

  const calcRemove = (pear, amount) => {
    if (!(amount && amount !== "" && amount > 0)) {
      return;
    }
    callQuoteRemoveLiquidity(pear, amount);
  };

  const renderMediumInput = (type, value, logo, symbol) => {
    return (
      <div className={classes.textFieldReceiveAsset}>
        <div className={classes.mediumdisplayDualIconContainerTitle}>{type === 'withdrawAmount0' ? '1st' : '2nd'} token</div>
        <div
          className={[
            classes.mediumInputContainer,
            classes[`mediumInputContainer--${appTheme}`],
            classes[`mediumInputContainer--${type}`],
          ].join(" ")}
        >
          <div className={classes.mediumdisplayDualIconContainer}>
            {logo && (
              <img
                className={classes.mediumdisplayAssetIcon}
                alt=""
                src={logo}
                height="50px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                }}
              />
            )}
            {!logo && (
              <img
                className={classes.mediumdisplayAssetIcon}
                alt=""
                src={`/tokens/unknown-logo--${appTheme}.svg`}
                height="50px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                }}
              />
            )}
          </div>

          <div className={classes.mediumInputAmountContainer}>
            <InputBase
              className={classes.mediumInputAmount}
              placeholder="0.00"
              value={value}
              disabled={true}
              inputProps={{
                className: [
                  classes.mediumInput,
                  classes[`mediumInput--${appTheme}`],
                ].join(" "),
              }}
              InputProps={{
                disableUnderline: true,
              }}
            />
            <Typography color="textSecondary" className={classes.smallestText}>
              {symbol}
            </Typography>
          </div>
        </div>
      </div>
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
    onFocus,
    inputRef
  ) => {
    return (
      <div
        className={[
          classes.textField,
          classes[`textField--${type}-${appTheme}`],
        ].join(" ")}
      >
        <Typography className={classes.inputTitleText} noWrap>
          {type === "amount0"
            ? createLP
              ? `1st ${windowWidth > 530 ? "token :" : ""}`
              : ""
            : type !== "withdraw"
            ? `2nd ${windowWidth > 530 ? "token :" : ""}`
            : ""}
        </Typography>

        {createLP && type !== "withdraw" &&
            <div className={classes.tokenPrice}>1 {assetValue?.symbol} = $ {type === "amount0" ? formatCurrency(pair?.token1.derivedETH * pair?.ethPrice) : formatCurrency(pair?.token0.derivedETH * pair?.ethPrice)}</div>
        }

        {type !== "withdraw" && (
          <div
            className={[
              createLP ? classes.inputBalanceTextContainer : classes.inputBalanceTextContainerForPair,
              "g-flex",
              "g-flex--align-center",
            ].join(" ")}
          >
            <span className={classes.walletText}>Balance:</span>


            {createLP ? (
              <Typography
                className={[classes.walletText, "g-flex__item"].join(" ")}
                noWrap
                onClick={() =>
                  assetValue?.balance && Number(assetValue?.balance) > 0
                    ? setAmountPercent(assetValue, type)
                    : null
                }
              >
                <span>
                  {assetValue && assetValue.balance
                    ? " " + formatCurrency(assetValue.balance)
                    : ""}
                </span>
              </Typography>
            ) : (
              <Typography
                className={[classes.inputBalanceText, "g-flex__item"].join(" ")}
                noWrap
                onClick={() =>
                  assetValue?.balance && Number(assetValue?.balance) > 0
                    ? setAmountPercent(assetValue, "stake")
                    : null
                }
              >
                <span>
                  {assetValue && assetValue.balance
                    ? " " + formatCurrency(assetValue.balance)
                    : ""}
                </span>
              </Typography>
            )}
            {assetValue?.balance &&
              Number(assetValue?.balance) > 0 &&
                (type === "amount0" || type === "amount1") &&
                createLP && (
                    <div
                        style={{
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 14,
                          lineHeight: "20px",
                          color: '#B1F1E3',
                        }}
                        onClick={() => setAmountPercent(assetValue, type)}
                    >
                      MAX
                    </div>
              )}
            {assetValue?.balance &&
              Number(assetValue?.balance) > 0 &&
                type === "amount0" &&
                !createLP && (
                    <div
                        style={{
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 14,
                          lineHeight: "20px",
                          color: '#B1F1E3',
                        }}
                        onClick={() => setAmountPercent(assetValue, "stake")}
                    >
                      MAX
                    </div>
                )}
          </div>
        )}

        <div
          className={`${(type !== "withdraw" && !createLP) ? classes.massiveInputContainerLong : classes.massiveInputContainer} ${
            (amountError || assetError) && classes.error
          }`}
        >
          <div className={type !== "withdraw" && createLP ? classes.massiveInputAssetSelectSingle : classes.massiveInputAssetSelect}>
            <AssetSelect
              type={type}
              value={assetValue}
              assetOptions={assetOptions}
              onSelect={onAssetSelect}
              size={type === "withdraw" ? "medium" : "default"}
              typeIcon={
                type === "withdraw" || (type !== "withdraw" && !createLP)
                  ? "double"
                  : "single"
              }
              isManageLocal={type !== "withdraw" && createLP}
            />
          </div>

          {type !== "withdraw" && (
            <div className={createLP ? classes.massiveInputAmountWrapper : classes.massiveInputAmountWrapperLong}>
              <InputBase
                className={classes.massiveInputAmount}
                placeholder="0.00"
                error={amountError}
                // helperText={amountError}
                value={/*createLP ? */amountValue/* : `${amountValue}%`*/}
                onChange={() => amountChanged(assetValue?.balance)}
                disabled={
                  depositLoading ||
                  stakeLoading ||
                  depositStakeLoading ||
                  createLoading ||
                    !BigNumber(assetValue?.balance).gt(0)
                }
                onFocus={onFocus ? onFocus : null}
                inputProps={{
                  className: [
                    classes.largeInput,
                  ].join(" "),
                }}
                /*InputProps={{
                  disableUnderline: true,
                }}*/
              />
              {!createLP && <span className={classes.flyPercent}>%</span>}
            </div>
          )}
        </div>

        {type === "withdraw" && withdrawAsset !== null && withdrawAction !== "" && (
            <div
                className={["g-flex", classes.liqWrapper].join(" ")}
            >
              <div className={["g-flex-column", "g-flex__item"].join(" ")}>
                {withdrawAction === "remove" && (
                    <div
                        className={[
                          classes.liqHeader,
                          classes.liqHeaderWithdraw,
                          classes[`liqHeader--${appTheme}`],
                          "g-flex",
                          "g-flex--align-center",
                          "g-flex--space-between",
                        ].join(" ")}
                    >

                      <div className={["g-flex", "g-flex--align-center"].join(" ")}>
                        <span>Balance:</span>

                        <Typography
                            className={[
                              classes.inputBalanceText,
                              "g-flex__item",
                            ].join(" ")}
                            noWrap
                        >
                          {parseFloat(withdrawAsset?.balance) > 0
                              ? parseFloat(withdrawAsset?.balance).toFixed(10)
                              : "0.00"}
                        </Typography>
                      </div>

                      <div
                          style={{
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 14,
                            lineHeight: "20px",
                            color: '#B1F1E3',
                          }}
                          onClick={() => setAmountPercent(withdrawAsset, "withdraw")}
                      >
                        MAX
                      </div>
                    </div>
                )}
                {withdrawAction !== "remove" && (
                    <div
                        className={[
                          classes.liqHeader,
                          classes.liqHeaderWithdraw,
                          "g-flex",
                          "g-flex--align-center",
                          "g-flex--space-between",
                        ].join(" ")}
                    >
                      <div className={["g-flex", "g-flex--align-center"].join(" ")}>
                        {/*<span>Balance:</span>*/}

                        <Typography
                            className={[
                              classes.inputBalanceText,
                              "g-flex__item",
                            ].join(" ")}
                            noWrap
                        >
                          Balance: {parseFloat(withdrawAsset?.gauge?.balance) > 0
                              ? parseFloat(withdrawAsset?.gauge?.balance).toFixed(10)
                              : "0.00"}
                        </Typography>
                      </div>

                      <div
                          style={{
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 14,
                            lineHeight: "20px",
                            color: '#B1F1E3',
                          }}
                          onClick={() =>
                              setAmountPercentGauge(withdrawAsset, "withdraw")
                          }
                      >
                        MAX
                      </div>
                    </div>
                )}

                <div
                    className={[
                      classes.liqBody,
                      classes.liqBodyIn,
                      classes[`liqBody--${appTheme}`],
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                >
                  <span className={classes.flyPercentWithdraw}>%</span>
                  <InputBase
                      className={classes.massiveInputAmountUnstake}
                      placeholder="0.00"
                      error={amount1Error}
                      helperText={amount1Error}
                      value={withdrawAmount}
                      onChange={() => withdrawAmountChanged(withdrawAsset)}
                      disabled={
                          depositLoading ||
                          stakeLoading ||
                          depositStakeLoading ||
                          createLoading ||
                          (withdrawAction !== "remove" && !withdrawAsset?.gauge?.balance) ||
                          ((withdrawAction === "remove" || withdrawAction === "unstake-remove") && (!withdrawAsset?.balance || !BigNumber(withdrawAsset?.balance).gt(0)))
                      }
                      onFocus={amount1Focused ? amount1Focused : null}
                      inputProps={{
                        className: [
                          classes.largeInput,
                          classes[`largeInput--${appTheme}`],
                        ].join(" "),
                      }}
                      InputProps={{
                        // startAdornment: "%",
                        disableUnderline: true,
                      }}
                  />
                </div>
              </div>
            </div>
        )}

        {type === "withdraw" && withdrawAsset !== null && pair?.gauge?.veId && vestNFTs.filter(t => t.id == pair?.gauge?.veId).length &&
            <div className={classes.connectedNft}>
              <div className={classes.connectedNftText}>Connected NFT to this LP Deposit:</div>
              <div className={classes.connectedNftBlock}>
                <div className={classes.connectedNftId}>#{pair?.gauge?.veId}</div>
                <div className={classes.connectedNftAmount}>{formatCurrency(vestNFTs.filter(t => t.id == pair?.gauge?.veId)[0].lockValue)} {veToken?.symbol}</div>
              </div>
            </div>
        }
      </div>
    );
  };

  const renderToggleIcon = (action) => {
    return (
      <>
        {withdrawAction !== action && (
          <svg
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
              fill="#171D2D"
              stroke="#779BF4"
            />
          </svg>
        )}

        {withdrawAction === action && (
          <svg
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
              fill="#171D2D"
              stroke="#779BF4"
            />
            <path
              d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
              fill="#779BF4"
              style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}
            />
          </svg>
        )}
      </>
    );
  };

  const renderWithdrawInformation = () => {
    return (
      <div className={classes.withdrawInfoContainer}>
        <div className={classes.myLiqCont}>
          <div className={classes.myLiq}>
            <div className={classes.myLiqBal}>
              <div>My Pool</div>
              <div>
                {withdrawAsset?.balance ?? '0.0'}
              </div>
            </div>
            <div className={classes.myLiqBal}>
              <div>
                <span className={classes.myLiqSpacer}></span>
                My Stake
              </div>
              <div>{withdrawAsset?.gauge?.balance ?? '0.00'}</div>
            </div>
          </div>
        </div>

        {!withdrawAction && (
            <div className={classes.infoGreenContainer}>
              <span className={classes.infoContainerWarnGreen}>!</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="#4FC83A"/>
              </svg>
              <span className={classes.infoContainerWarnGreenText}>Please claim any rewards before withdrawing.</span>
            </div>
        )}



        {withdrawAsset !== null &&
          withdrawAction !== null &&
          (withdrawAction === "remove" ||
            withdrawAction === "unstake-remove") && (
            <div
              style={{
                position: "relative",
                width: '100%',
              }}
            >
              <div
                className={[
                  classes.swapIconContainerWithdraw,
                  classes[`swapIconContainerWithdraw--${appTheme}`],
                ].join(" ")}
              >
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="60" height="60" rx="30" fill="#171D2D"/>
                  <path d="M43.8398 46.4194L43.8398 32.5794C43.8398 30.9194 42.4998 29.5794 40.8398 29.5794L37.5198 29.5794" stroke="#8191B9" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M47 43.2599L43.84 46.4199L40.68 43.2599" stroke="#8191B9" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M28.16 46.4196L28.16 32.5796C28.16 30.9196 29.5 29.5796 31.16 29.5796L39 29.5796" stroke="#8191B9" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M24.9998 43.2598L28.1598 46.4198L31.3198 43.2598" stroke="#8191B9" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M35.25 29.5C35.25 29.9142 35.5858 30.25 36 30.25C36.4142 30.25 36.75 29.9142 36.75 29.5H35.25ZM36.75 25C36.75 24.5858 36.4142 24.25 36 24.25C35.5858 24.25 35.25 24.5858 35.25 25H36.75ZM36.75 29.5V25H35.25V29.5H36.75Z" fill="#8191B9"/>
                  <rect x="6" y="6" width="60" height="60" rx="30" stroke="#060B17" strokeWidth="12"/>
                </svg>

              </div>

              <div className={classes.receiveAssets}>
                {renderMediumInput(
                  "withdrawAmount0",
                  withdrawAmount0,
                  withdrawAsset?.token0?.logoURI,
                  withdrawAsset?.token0?.symbol
                )}
                {renderMediumInput(
                  "withdrawAmount1",
                  withdrawAmount1,
                  withdrawAsset?.token1?.logoURI,
                  withdrawAsset?.token1?.symbol
                )}
              </div>
            </div>
          )}
      </div>
    );
  };

  const renderMediumInputToggle = (type, value) => {
    return (
      <div className={[classes.toggles, "g-flex"].join(" ")}>
        <div
          className={[
            classes.toggleOption,
            `${!stable && classes.active}`,
          ].join(" ")}
          onClick={() => {
            setStab(false);
          }}
        >
          <Typography
            className={[
              classes.toggleOptionText,
            ].join(" ")}
          >
            Volatile Pool
          </Typography>

          <Hint
              fill="#586586"
              hintText={
                "Volatile pools are the most appropriate for uncorrelated assets, their structure provides greater flexibility for price fluctuation."
              }
              open={openVolatilePoolHint}
              anchor={volatilePoolHntAnchor}
              handleClick={handleVolatilePoolClickPopover}
              handleClose={handleVolatilePoolClosePopover}
              vertical={46}
              iconComponent={!stable ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8ZM8.66667 5.33333C8.66667 5.70152 8.36819 6 8 6C7.63181 6 7.33333 5.70152 7.33333 5.33333C7.33333 4.96514 7.63181 4.66667 8 4.66667C8.36819 4.66667 8.66667 4.96514 8.66667 5.33333ZM8.75 11.3333V7.33333H7.25V11.3333H8.75Z" fill="#353A42"/>
              </svg> : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8ZM8.66667 5.33333C8.66667 5.70152 8.36819 6 8 6C7.63181 6 7.33333 5.70152 7.33333 5.33333C7.33333 4.96514 7.63181 4.66667 8 4.66667C8.36819 4.66667 8.66667 4.96514 8.66667 5.33333ZM8.75 11.3333V7.33333H7.25V11.3333H8.75Z" fill="#9A9FAF"/>
              </svg>}
          />
        </div>
        <div
            style={{
              // marginRight: 20,
            }}
            className={[
              classes.toggleOption,
              `${stable && classes.active}`,
            ].join(" ")}
            onClick={() => {
              setStab(true);
            }}
        >
          <Typography
              className={[
                classes.toggleOptionText,
              ].join(" ")}
          >
            Stable Pool
          </Typography>

          <Hint
              fill="#586586"
              hintText={
                "Stable pool provides correlated asset swaps with low slippage."
              }
              open={openStablePoolHint}
              anchor={stablePoolHntAnchor}
              handleClick={handleStablePoolClickPopover}
              handleClose={handleStablePoolClosePopover}
              vertical={46}
              iconComponent={stable ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8ZM8.66667 5.33333C8.66667 5.70152 8.36819 6 8 6C7.63181 6 7.33333 5.70152 7.33333 5.33333C7.33333 4.96514 7.63181 4.66667 8 4.66667C8.36819 4.66667 8.66667 4.96514 8.66667 5.33333ZM8.75 11.3333V7.33333H7.25V11.3333H8.75Z" fill="#353A42"/>
              </svg> : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8ZM8.66667 5.33333C8.66667 5.70152 8.36819 6 8 6C7.63181 6 7.33333 5.70152 7.33333 5.33333C7.33333 4.96514 7.63181 4.66667 8 4.66667C8.36819 4.66667 8.66667 4.96514 8.66667 5.33333ZM8.75 11.3333V7.33333H7.25V11.3333H8.75Z" fill="#9A9FAF"/>
              </svg>}
          />
        </div>
      </div>
    );
  };

  const [openSelectToken, setOpenSelectToken] = useState(false);

  const openSelect = () => {
    setOpenSelectToken(true);
  };

  const closeSelect = () => {
    setOpenSelectToken(false);
  };

  const selectArrow = () => {
    return (
      // <ClickAwayListener onClickAway={closeSelect}>
        <div
          // onClick={openSelect}
          className={[
            classes.slippageIconContainer,
            openSelectToken ? classes["selectTokenIconContainer--active"] : "",
            classes[`slippageIconContainer--${appTheme}`],
          ].join(" ")}
        >
          <svg width="18" height="9" viewBox="0 0 18 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.9201 0.950012L10.4001 7.47001C9.63008 8.24001 8.37008 8.24001 7.60008 7.47001L1.08008 0.950012" stroke="#D3F85A" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      // </ClickAwayListener>
    );
  };

  const renderTokenSelect = () => {
    return (
        <>
        <div className={classes.tokenSelector} onClick={openSelect}>
          <div className={classes.selectorLeft}>{token ? `#${token.id}` : `Select ${veToken?.symbol}` }</div>
          <div className={classes.selectorRight}>{token ? (
              <Typography
                  className={classes.menuOptionSecText}
              >
                {formatCurrency(token.lockValue)} {veToken?.symbol}
              </Typography>
          ): null}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.2929 15.7929L5.38995 9.88995C4.508 9.008 5.13263 7.5 6.3799 7.5L17.6201 7.5C18.8674 7.5 19.492 9.008 18.6101 9.88995L12.7071 15.7929C12.3166 16.1834 11.6834 16.1834 11.2929 15.7929Z" fill="#B1F1E3"/>
            </svg>
          </div>
        </div>
          <Dialog
              className={classes.dialogScale}
              classes={{
                root: classes.rootPaper,
                scrollPaper: classes.topScrollPaper,
                paper: classes.paperBody,
              }}
              open={openSelectToken}
              onClose={closeSelect}
              onClick={(e) => {
                if (e.target.classList.contains('MuiDialog-container')) {
                  closeSelect()
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
                  className={classes.dialogTitle}
                  style={{
                    padding: 20,
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: '32px',
                    color: '#131313',
                  }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    Select {veToken?.symbol}
                  </div>

                  <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 20,
                        height: 20,
                        cursor: 'pointer',
                      }}
                      onClick={closeSelect}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 13.4142L8.70711 16.7071L7.29289 15.2929L10.5858 12L7.29289 8.70711L8.70711 7.29289L12 10.5858L15.2929 7.29289L16.7071 8.70711L13.4142 12L16.7071 15.2929L15.2929 16.7071L12 13.4142Z" fill="#131313"/>
                    </svg>
                  </div>
                </div>
              </DialogTitle>

              <DialogContent
                  // className={classes.dialogContent}
                  style={{ padding: '4px 20px 20px' }}>
                <div className={classes.inner}>
                  {vestNFTs && (
                      <div className={classes.nfts}>
                        {vestNFTs.map((option) => {
                          return (
                              <div
                                  key={option.id}
                                  className={[
                                    parseInt(option.attachments) === 1 ? classes.menuOptionDisabled : classes.menuOption,
                                  ].join(" ")}
                                  onClick={() => {
                                    if (parseInt(option.attachments) === 0) {
                                      handleSelectToken(option)
                                    }
                                  }}
                              >
                                <div className={classes.nftLeft}>
                                  <span className={classes.nftword}>{option.id}</span>
                                  <span className={classes.nftExpires}>Expires: </span>
                                </div>
                                <div className={classes.nftRight}>
                                  <span className={classes.nftValue}>{formatCurrency(option.lockValue)} </span>
                                  <span className={classes.nftSymbol}>{veToken?.symbol}</span>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                  )}
                  <div className={classes.nftChoose}>Choose one of the existing NFTs or create a new one.</div>
                  <div onClick={() => { router.push('/vest')}} className={classes.settingsSaveButton}>Create new NFT</div>
                </div>
              </DialogContent>
            </div>
          </Dialog>
        </>
    );
  };

  const switchToggleCreateLP = () => {
    const nextValue = !createLP;
    setAsset0(null);
    setWithdrawAsset(null);
    setAmount0("");
    setAmount0Error(false);
    setAsset1(null);
    setAmount1("");
    setAmount1Error(false);
    setCreateLP(nextValue);

    if (nextValue) {
      ssUpdated();
    }
  };

  const [lockedNft, setLockedNft] = useState()

  useEffect(() => {
    if (withdrawAsset?.gauge?.tokenId && vestNFTs.length > 0) {
      setLockedNft(vestNFTs.filter(a => a.id === withdrawAsset?.gauge?.tokenId)[0])
    } else {
      setLockedNft(undefined)
    }
  }, [withdrawAsset?.gauge?.tokenId, vestNFTs.length]);

  const isShowBoostCalculator = !!pair && pair.gauge !== null && asset0;

  useEffect(() => {
    if (!!asset0 && !!asset1) {
      setPairLoading(false);
    } else {
      setPairLoading(true);
    }
  }, [asset0, asset1]);

  const [settingsOpened, setSettingsOpened] = useState(false);

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
                className={classes.dialogTitle}
                style={{
                  padding: 20,
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: '32px',
                  color: '#131313',
                }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  Transaction Settings
                </div>

                <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                    }}
                    onClick={handleClose}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 13.4142L8.70711 16.7071L7.29289 15.2929L10.5858 12L7.29289 8.70711L8.70711 7.29289L12 10.5858L15.2929 7.29289L16.7071 8.70711L13.4142 12L16.7071 15.2929L15.2929 16.7071L12 13.4142Z" fill="#131313"/>
                  </svg>
                </div>
              </div>
            </DialogTitle>

            <DialogContent
                // className={classes.dialogContent}
                style={{ padding: '4px 20px 20px' }}>
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
                        disabled={false}
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

  // const editLPDesign = !!router.query.address

  return (
      <div className="g-flex g-flex-column">
        <div className={classes.subnav}>
          <span className={classes.backLink} onClick={() => {  router.push('/liquidity'); }}>Liquidity</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 8L10.7071 8.70711L11.4142 8L10.7071 7.29289L10 8ZM6.70711 12.7071L10.7071 8.70711L9.29289 7.29289L5.29289 11.2929L6.70711 12.7071ZM10.7071 7.29289L6.70711 3.29289L5.29289 4.70711L9.29289 8.70711L10.7071 7.29289Z" fill="#9A9FAF"/>
          </svg>
          <span className={classes.curPage}>Manage Liquidity</span>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.leftBlock}>
            <div className={classes.manageBlock}>
              <div className={classes.blockTitle}>MANAGE LIQUIDITY</div>
              <div className={classes.blockInner}>
                <div className={classes.manageRow}>
                  <div className={activeTab === "deposit" ? classes.manageBtnActive : classes.manageBtn} onClick={toggleDeposit}>Add liquidity</div>
                  <div className={activeTab !== "deposit" ? classes.manageBtnActive : classes.manageBtn} onClick={toggleWithdraw}>Withdraw</div>
                </div>
                {activeTab === "deposit" &&
                    <div className={classes.manageRow}>
                      <div className={createLP ? classes.manageBtnActive : classes.manageBtn} onClick={!createLP ? switchToggleCreateLP : () => {}}>Create LP</div>
                      <div className={!createLP ? classes.manageBtnActive : classes.manageBtn} onClick={createLP ? switchToggleCreateLP : () => {}}>Stake LP</div>
                    </div>
                }
                {activeTab !== "deposit" && withdrawAction &&
                    <div className={classes.manageRow}>
                      <div className={withdrawAction === 'unstake' ? classes.manageBtnActive : classes.manageBtn} onClick={() => { setWithdrawAction("unstake") }}>Unstake LP</div>
                      <div className={withdrawAction === 'remove' ? classes.manageBtnActive : classes.manageBtn} onClick={() => { setWithdrawAction("remove") }}>Remove LP</div>
                    </div>
                }
              </div>

            </div>
            {activeTab === "withdraw" &&
                <div className={classes.withdrawWarn}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12ZM13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16ZM12.75 7V13H11.25V7H12.75Z" fill="#459B0E"/>
                  </svg>
                  <span>Please claim any rewards before withdrawing.</span>
                </div>
            }
          </div>
          <Paper elevation={0} className={[classes.container, "g-flex-column"].join(' ')}>

            <div className={[classes.titleTitle, "g-flex g-flex--align-center g-flex--wrap"].join(" ")}>

              {createLP && activeTab === "deposit" && (
                  <div
                      className={classes.blockTitle}
                  >
                    Create LP
                  </div>
              )}

              {activeTab === "withdraw" && (
                  <div
                      className={classes.blockTitle}
                  >
                    {withdrawAction === 'unstake' && 'Unstake LP'}
                    {withdrawAction === 'remove' && 'Remove LP'}
                    {!withdrawAction && 'Withdraw LP'}
                  </div>
              )}

              {!createLP && activeTab === "deposit" && (
                  <div
                      className={classes.blockTitle}
                  >
                    Stake LP
                  </div>
              )}

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

            <div
                className={[
                  classes.reAddPadding,
                  classes[`reAddPadding--${appTheme}`],
                ].join(" ")}
            >
              <div className={classes.inputsContainer}>
                {activeTab === "deposit" && (
                    <>
                      <div className={classes.blockInner}>
                        <div className={classes.amountsContainer}>

                          {createLP ?
                              renderMassiveInput(
                                  "amount0",
                                  amount0,
                                  amount0Error,
                                  amount0Changed,
                                  asset0,
                                  null,
                                  assetOptions,
                                  onAssetSelect,
                                  amount0Focused,
                                  amount0Ref
                              ) : renderMassiveInput(
                                  "amount0",
                                  amount0,
                                  amount0Error,
                                  amount0Changed,
                                  withdrawAsset,
                                  null,
                                  withdrawAassetOptions,
                                  onAssetSelect,
                                  amount0Focused,
                                  amount0Ref
                              )}

                          {createLP && (
                              <>
                                <div className={classes.swapAssetsBlock}>
                                  <div
                                      className={[
                                        classes.swapIconContainer,
                                      ].join(" ")}
                                      onClick={swapAssets}
                                  >
                                    <div
                                        className={[
                                          classes.swapIconContainerInside,
                                          "g-flex",
                                          "g-flex--align-center",
                                          "g-flex--justify-center",
                                        ].join(" ")}
                                    >
                                      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M30 18.6667L30.5303 18.1363L31.0607 18.6667L30.5303 19.197L30 18.6667ZM20 18.6667L20 17.9167L20 18.6667ZM17.9167 17.3333C17.9167 16.9191 18.2525 16.5833 18.6667 16.5833C19.0809 16.5833 19.4167 16.9191 19.4167 17.3333L17.9167 17.3333ZM27.8637 15.4697L30.5303 18.1363L29.4697 19.197L26.803 16.5303L27.8637 15.4697ZM30.5303 19.197L27.8637 21.8637L26.803 20.803L29.4697 18.1363L30.5303 19.197ZM30 19.4167L20 19.4167L20 17.9167L30 17.9167L30 19.4167ZM20 19.4167C18.8494 19.4167 17.9167 18.4839 17.9167 17.3333L19.4167 17.3333C19.4167 17.6555 19.6778 17.9167 20 17.9167L20 19.4167Z" fill="#B1F1E3"/>
                                        <path d="M19.3334 13.3332L18.803 12.8028L18.2727 13.3332L18.803 13.8635L19.3334 13.3332ZM29.25 14.6665C29.25 15.0807 29.5858 15.4165 30 15.4165C30.4143 15.4165 30.75 15.0807 30.75 14.6665H29.25ZM21.4697 10.1362L18.803 12.8028L19.8637 13.8635L22.5304 11.1968L21.4697 10.1362ZM18.803 13.8635L21.4697 16.5302L22.5304 15.4695L19.8637 12.8028L18.803 13.8635ZM19.3334 14.0832H28.6667V12.5832H19.3334V14.0832ZM28.6667 14.0832C28.9889 14.0832 29.25 14.3443 29.25 14.6665H30.75C30.75 13.5159 29.8173 12.5832 28.6667 12.5832V14.0832Z" fill="#B1F1E3"/>
                                        <rect x="0.5" y="0.5" width="47" height="31" rx="15.5" stroke="#9A9FAF"/>
                                      </svg>

                                    </div>
                                  </div>
                                  <div className={classes.swapAssetText}>
                                    {(asset1?.symbol === pair?.token0?.symbol || (asset1?.symbol === FTM_SYMBOL && pair?.token0?.symbol === WFTM_SYMBOL)) && <span>{formatCurrency(pair?.token1Price)} {asset0?.symbol} per 1 {asset1?.symbol}</span>}
                                    {(asset1?.symbol === pair?.token1?.symbol || (asset1?.symbol === FTM_SYMBOL && pair?.token1?.symbol === WFTM_SYMBOL)) && <span>{formatCurrency(pair?.token0Price)} {asset0?.symbol} per 1 {asset1?.symbol}</span>}
                                  </div>
                                </div>


                                {renderMassiveInput(
                                    "amount1",
                                    amount1,
                                    amount1Error,
                                    amount1Changed,
                                    asset1,
                                    null,
                                    assetOptions,
                                    onAssetSelect,
                                    amount1Focused,
                                    amount1Ref
                                )}
                              </>
                          )}
                        </div>

                        {!createLP &&
                            <>
                              <div className={classes.nftRow} style={{width: '100%',}}>
                                <div className={classes.nftTitle}>
                                  Connect {VE_TOKEN_NAME} for Boosted APR:
                                </div>
                                <div className={classes.nftItems}>{renderTokenSelect()}</div>
                              </div>
                              {isShowBoostCalculator && <div className={classes.boostCalculator}>
                                <BoostCalculator pair={pair} nft={token} ve={veToken} isMobileView={windowWidth < 860} amount={amount0}/>
                              </div>}
                            </>
                        }

                        <div className="g-flex g-flex--wrap" style={{width: '100%'}}>
                          {createLP && renderMediumInputToggle("stable", stable)}
                        </div>
                      </div>

                      <div className={classes.myLiqCont}>
                        <div className={classes.myLiq}>
                          <div className={classes.myLiqBal}>
                            <div>My Pool</div>
                            <div>
                              {pair?.balance ?? '0.0'}
                            </div>
                          </div>
                          <div className={classes.myLiqBal}>
                            <div>
                              My Stake
                            </div>
                            <div>{pair?.gauge?.balance ?? '0.00'}</div>
                          </div>
                        </div>
                      </div>



                      {/*{renderDepositInformation()}*/}

                      <div className={classes.controls}>
                        {needAddToWhiteList !== "" && (
                            <div
                                className={[
                                  classes.disclaimerContainer,
                                  classes.disclaimerContainerError,
                                  classes[`disclaimerContainerError--${appTheme}`],
                                ].join(" ")}
                            >
                              token {needAddToWhiteList} not whitelisted
                            </div>
                        )}

                        {createLP &&
                            pair?.name &&
                            (pair?.balance > 0 || amount0Error || amount1Error) && (
                                <div
                                    className={[
                                      classes.disclaimerContainer,
                                      amount0Error || amount1Error
                                          ? classes.disclaimerContainerError
                                          : classes.disclaimerContainerWarning,
                                      amount0Error || amount1Error
                                          ? classes[`disclaimerContainerError--${appTheme}`]
                                          : classes[`disclaimerContainerWarning--${appTheme}`],
                                    ].join(" ")}
                                >
                                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C13.9706 0 18 4.02944 18 9ZM10 5C10 5.55228 9.55229 6 9 6C8.44771 6 8 5.55228 8 5C8 4.44772 8.44771 4 9 4C9.55229 4 10 4.44772 10 5ZM9.75 14V8H8.25V14H9.75Z" fill="#68727A"/>
                                  </svg>

                                  <div style={{marginLeft: 16,}}>
                                    {amount0Error && <>{amount0Error}</>}

                                    {!amount0Error && amount1Error && <>{amount1Error}</>}

                                    {pair?.balance > 0 && !amount0Error && !amount1Error && (
                                        <>
                                          There are {pair?.token0.symbol}-{pair?.token1.symbol} LP tokens in your wallet. Click on "I have LP token" to stake it.
                                        </>
                                    )}
                                  </div>
                                </div>
                            )}
                      </div>

                      {/*TODO: uncomment deadline then logic will be ready*/}
                      {/*
                  <div className={[classes.slippageDivider, classes[`slippageDivider--${appTheme}`]].join(" ")}>
                  </div>

                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      marginBottom: 10,
                      color: appTheme === "dark" ? '#7C838A' : '#5688A5',
                    }}>
                    Transaction Deadline
                  </div>

                  <TextField
                    placeholder="0"
                    fullWidth
                    // error={slippageError}
                    // helperText={slippageError}
                    // value={slippage}
                    // onChange={onSlippageChanged}
                    disabled={depositLoading || stakeLoading || depositStakeLoading || createLoading}
                    classes={{
                      root: [classes.slippageRoot, appTheme === "dark" ? classes['slippageRoot--dark'] : classes['slippageRoot--light']].join(' '),
                    }}
                    InputProps={{
                      style: {
                        border: 'none',
                        borderRadius: 0,
                      },
                      classes: {
                        root: classes.searchInput,
                      },
                      endAdornment: <InputAdornment position="end">
                        <span
                          style={{
                            color: appTheme === "dark" ? '#ffffff' : '#5688A5',
                          }}>
                          minutes
                        </span>
                      </InputAdornment>,
                    }}
                    inputProps={{
                      className: [classes.smallInput, classes[`inputBalanceSlippageText--${appTheme}`]].join(" "),
                      style: {
                        padding: 0,
                        borderRadius: 0,
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: '120%',
                        color: appTheme === "dark" ? '#C6CDD2' : '#325569',
                      },
                    }}
                  />*/}
                      {/*</Popover>*/}
                      {/*</div>*/}

                      {!createLP && (amount0 === "" || !pair) &&
                          <div
                              className={[
                                classes.disclaimerContainer,
                                classes.disclaimerContainerDefault,

                              ].join(" ")}
                          >
                            <svg style={{marginRight: 12,}} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8ZM12.75 17V11H11.25V17H12.75Z" fill="#68727A"/>
                            </svg>
                            <div>
                              Select a liquidity pair you want to stake and enter the amount in percentages.
                            </div>
                          </div>
                      }
                    </>
                )}
                {activeTab === "withdraw" && (
                    <>
                      {renderMassiveInput(
                          "withdraw",
                          withdrawAmount,
                          withdrawAmountError,
                          withdrawAmountChanged,
                          withdrawAsset,
                          null,
                          withdrawAassetOptions,
                          onAssetSelect,
                          null,
                          null
                      )}

                      {renderWithdrawInformation()}
                    </>
                )}
              </div>
            </div>

            {activeTab === "deposit" && (
                <>
                  {createLP && pair == null && amount0 !== "" && amount1 !== "" && (
                      <Button
                          variant="contained"
                          size="large"
                          color="primary"
                          onClick={needAddToWhiteList !== "" ? null : onCreateAndDeposit}
                          disabled={needAddToWhiteList !== ""}
                          className={[
                            classes.buttonOverride,
                            classes[`buttonOverride--${appTheme}`],
                          ].join(" ")}
                      >
              <span className={classes.actionButtonText}>
                Create LP
              </span>
                        {/*{depositLoading && (
                          <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                      )}*/}
                      </Button>
                  )}
                  {amount0 !== "" && amount1 !== "" && createLP && pair !== null && (pair.gauge || needAddToWhiteList) && (
                      <Button
                          variant="contained"
                          size="large"
                          color="primary"
                          onClick={onDeposit}
                          disabled={
                              (amount0 === "" && amount1 === "") ||
                              depositLoading ||
                              stakeLoading ||
                              depositStakeLoading
                              || (asset0 && BigNumber(amount0).gt(asset0.balance))
                              || (asset1 && BigNumber(amount1).gt(asset1.balance))
                          }
                          className={[
                            classes.buttonOverride,
                          ].join(" ")}
                      >
                        <span className={classes.actionButtonText}>Add Liquidity</span>
                        {/*{depositLoading && (
                          <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                      )}*/}
                      </Button>
                  )}
                  {!pair?.gauge && pair && !needAddToWhiteList && (
                      <Button
                          variant="contained"
                          size="large"
                          className={[
                            createLoading ||
                            depositLoading ||
                            stakeLoading ||
                            depositStakeLoading
                                ? classes.multiApprovalButton
                                : classes.buttonOverride,
                            createLoading ||
                            depositLoading ||
                            stakeLoading ||
                            depositStakeLoading
                                ? classes[`multiApprovalButton--${appTheme}`]
                                : classes[`buttonOverride--${appTheme}`],
                          ].join(" ")}
                          color="primary"
                          disabled={
                              createLoading ||
                              depositLoading ||
                              stakeLoading ||
                              depositStakeLoading
                          }
                          onClick={onCreateGauge}
                      >
                      <span className={classes.actionButtonText}>
                        {createLoading ? `Creating` : `Create Gauge`}
                      </span>
                        {createLoading && (
                            <CircularProgress size={10} className={classes.loadingCircle} />
                        )}
                      </Button>
                  )}
                  <div style={{padding: '0 6px'}}>
                    {createLP && amount0 === "" && amount1 === "" && (
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            onClick={() => {}}
                            disabled={
                                amount0 === "" || amount1 === "" || needAddToWhiteList !== ""
                            }
                            className={[
                              classes.buttonOverride,
                              classes[`buttonOverride--${appTheme}`],
                            ].join(" ")}
                        >
              <span className={classes.actionButtonText}>
                {asset0 && asset1 && (amount0 === "" || amount1 === "") && "Enter Amount"}
                {!asset0 && !asset1 && (amount0 === "" || amount1 === "") && "Enter Amount"} {/*"Select tokens & Enter Amount"*/}
              </span>
                          {/*{depositLoading && (
                            <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                        )}*/}
                        </Button>
                    )}

                    {!createLP && (
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            onClick={() => {
                              if (amount0 !== "") {
                                onStake(pair, amount0, pair.balance);
                              }
                            }}
                            disabled={amount0 === "" || !withdrawAsset}
                            className={[
                              classes.buttonOverride,
                              classes[`buttonOverride--${appTheme}`],
                            ].join(" ")}
                        >
              <span className={classes.actionButtonText}>
                Stake Liquidity
              </span>
                          {/*{depositLoading && (
                            <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                        )}*/}
                        </Button>
                    )}
                  </div>
                </>
            )}

            {activeTab === "withdraw" && (
                <>
                  <div className="g-flex g-flex--wrap" style={{width: '100%'}}>
                    {withdrawAction === "remove" &&
                        <div
                            className={["g-flex g-flex--align-center g-flex--space-between", classes.slippageCont].join(' ')}
                        >
                          <div
                              style={{
                                display: 'flex',
                                fontWeight: 400,
                                fontSize: 14,
                                // marginBottom: 10,
                                color: '#E4E9F4',
                              }}
                          >
                            <span style={{marginRight: 10,}}>Slippage</span>
                            <Hint
                                fill="#586586"
                                hintText={
                                  "Slippage is the price difference between the submission of a transaction and the confirmation of the transaction on the blockchain."
                                }
                                open={openHint}
                                anchor={hintAnchor}
                                handleClick={handleClickPopover}
                                handleClose={handleClosePopover}
                                vertical={46}
                            />
                          </div>

                          <div
                              style={{
                                position: "relative",
                                // marginBottom: 20,
                              }}
                          >
                            <TextField
                                placeholder="0.00"
                                fullWidth
                                error={slippageError}
                                // helperText={slippageError}
                                value={slippage}
                                onChange={onSlippageChanged}
                                disabled={
                                    depositLoading ||
                                    stakeLoading ||
                                    depositStakeLoading ||
                                    createLoading
                                }
                                classes={{
                                  root: [
                                    classes.slippageRoot,
                                    appTheme === "dark"
                                        ? classes["slippageRoot--dark"]
                                        : classes["slippageRoot--light"],
                                  ].join(" "),
                                }}
                                InputProps={{
                                  style: {
                                    border: "none",
                                    borderRadius: 0,
                                  },
                                  classes: {
                                    root: classes.searchInput,
                                  },
                                  endAdornment: (
                                      <InputAdornment position="end">
                            <span
                                style={{
                                  color:
                                      appTheme === "dark" ? "#ffffff" : "#325569",
                                }}
                            >
                              %
                            </span>
                                      </InputAdornment>
                                  ),
                                }}
                                inputProps={{
                                  className: [
                                    classes.smallInput,
                                    classes[`inputBalanceSlippageText--${appTheme}`],
                                  ].join(" "),
                                  style: {
                                    padding: 0,
                                    borderRadius: 0,
                                    border: "none",
                                    fontSize: 14,
                                    fontWeight: 400,
                                    lineHeight: "120%",
                                    color: appTheme === "dark" ? "#C6CDD2" : "#325569",
                                  },
                                }}
                            />
                          </div>
                          {slippageError && (
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
                                  {slippageError}
                                </Typography>
                              </div>
                          )}
                        </div>
                    }
                    {withdrawAction === "remove" &&
                        <div className={classes.refreshWarnBlock}>
                          <span className={classes.refreshWarnSymbol}>!</span>
                          <span>
                          If you do not see your pool amount, refresh the page
                        </span>
                        </div>
                    }

                    {withdrawAction === "unstake" && lockedNft &&
                        <div className={classes.lockedNFT}>
                          <div className={classes.lockedNFTTitle}>
                            Connected Locked NFT to this LP Staking
                          </div>
                          <div className={classes.lockedNFTToken}>
                            <div className={classes.lockedNFTID}>
                              #{lockedNft.id}
                            </div>
                            <div className={classes.lockedNFTVe}>
                              {formatCurrency(lockedNft.lockValue)} {veToken?.symbol}
                            </div>
                          </div>
                        </div>
                    }

                    {withdrawAction === "unstake" && (withdrawAmount === "" || !withdrawAsset) &&
                        <div
                            className={[
                              classes.disclaimerContainer,
                              classes.disclaimerContainerDefault,

                            ].join(" ")}
                        >
                          <svg style={{marginRight: 12,}} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8ZM12.75 17V11H11.25V17H12.75Z" fill="#68727A"/>
                          </svg>
                          <div>
                            Select a liquidity pair you want to unstake and enter the amount in percentages.
                          </div>
                        </div>
                    }

                  </div>
                  <Button
                      variant="contained"
                      size="large"
                      color="primary"
                      onClick={() => handleWithdraw(withdrawAsset)}
                      disabled={
                          withdrawAmount === "" ||
                          parseFloat(withdrawAmount) === 0 ||
                          withdrawAction === ""
                      }
                      className={[
                        classes.buttonOverride,
                        classes[`buttonOverride--${appTheme}`],
                      ].join(" ")}
                  >
                    <span className={classes.actionButtonText}>
                        <>
                          {withdrawAction === "" && "Select the action"}
                          {withdrawAction === "unstake" && "Unstake Liquidity"}
                          {withdrawAction === "remove" && "Remove Liquidity"}
                        </>
                    </span>
                  </Button>
                </>
            )}
          </Paper>
          <div className={classes.emptyBlock} />
        </div>
      </div>
  );
}
