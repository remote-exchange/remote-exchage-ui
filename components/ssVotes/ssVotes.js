import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  IconButton,
} from "@mui/material";
import BigNumber from "bignumber.js";
import { Add, Search } from "@mui/icons-material";
import { useRouter } from "next/router";
import classes from "./ssVotes.module.css";
import { formatCurrency } from "../../utils";
import GaugesTable from "./ssVotesTable.js";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import TokenSelect from "../select-token/select-token";

export default function ssVotes() {
  const router = useRouter();

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [gauges, setGauges] = useState([]);
  const [filteredGauges, setFilteredGauges] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [votes, setVotes] = useState([]);
  const [veToken, setVeToken] = useState(null);
  const [token, setToken] = useState(null);
  const [vestNFTs, setVestNFTs] = useState([]);
  const [search, setSearch] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(false);

  const { appTheme } = useAppThemeContext();

  const setMyVotesGauges = () => {
    let result = gauges.filter(item => {
      let value = votes.find((el) => el.address === item?.address)?.value;

      if (value < 0 || value > 0) {
        return item;
      }
    });

    setFilteredGauges(result);
  }

  const ssUpdated = async () => {
    setVeToken(stores.stableSwapStore.getStore("veToken"));
    const as = stores.stableSwapStore.getStore("pairs");

    const filteredAssets = as.filter((asset) => {
      return asset.gauge && asset.gauge.address;
    });
    setGauges(filteredAssets);

    const nfts = stores.stableSwapStore.getStore("vestNFTs") ?? [];
    setVestNFTs(nfts);

    if (nfts?.length > 0) {
      nfts.sort((a, b) => +a.id - +b.id);

      setToken(nfts[0]);
    }

    if (
      nfts &&
      nfts.length > 0 &&
      filteredAssets &&
      filteredAssets.length > 0
    ) {
      stores.dispatcher.dispatch({
        type: ACTIONS.GET_VEST_VOTES,
        content: { tokenID: nfts[0].id },
      });
      // stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_BALANCES, content: { tokenID: nfts[0].id } })
    }

    forceUpdate();
  };

  useEffect(() => {
    const vestVotesReturned = (vals) => {
      setVotes(
        vals.map((asset) => {
          return {
            address: asset?.address,
            value: BigNumber(
              asset && asset.votePercent ? asset.votePercent : 0
            ).toNumber(0),
          };
        })
      );
      forceUpdate();
    };

    const vestBalancesReturned = (vals) => {
      setGauges(vals);
      forceUpdate();
    };

    const stableSwapUpdated = () => {
      ssUpdated();
    };

    const voteReturned = () => {
      setVoteLoading(false);
    };

    ssUpdated();

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    stores.emitter.on(ACTIONS.VOTE_RETURNED, voteReturned);
    stores.emitter.on(ACTIONS.ERROR, voteReturned);
    stores.emitter.on(ACTIONS.VEST_VOTES_RETURNED, vestVotesReturned);
    // stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned)
    stores.emitter.on(ACTIONS.VEST_BALANCES_RETURNED, vestBalancesReturned);

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
      stores.emitter.removeListener(ACTIONS.VOTE_RETURNED, voteReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, voteReturned);
      stores.emitter.removeListener(
        ACTIONS.VEST_VOTES_RETURNED,
        vestVotesReturned
      );
      // stores.emitter.removeListener(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned)
      stores.emitter.removeListener(
        ACTIONS.VEST_BALANCES_RETURNED,
        vestBalancesReturned
      );
    };
  }, []);

  const onVote = () => {
    setVoteLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.VOTE,
      content: { votes, tokenID: token.id },
    });
  };
  const onResetVotes = () => {
    if (token?.id) {
      setVoteLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.RESET_VOTE,
        content: { tokenID: token.id },
      });
    }
  };

  let totalVotes = votes.reduce((acc, curr) => {
    return BigNumber(acc)
      .plus(BigNumber(curr.value).lt(0) ? curr.value * -1 : curr.value)
      .toNumber();
  }, 0);

  const handleChange = (event) => {
    setToken(event.target.value);
    stores.dispatcher.dispatch({
      type: ACTIONS.GET_VEST_VOTES,
      content: { tokenID: event.target.value.id },
    });
  };

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onBribe = () => {
    router.push("/bribe/create");
  };

  const handleSearch = () => {
    setShowSearch(!showSearch);
  };

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  const noTokenSelected = token === null;

  const disableCastVotes = totalVotes > 100;

  return (
    <>
      <div className={classes.toolbarContainer}>
        <div className={classes.toolbarContainerRow}>
          <div className={classes.pageTitle}>Vote</div>

          <div className={classes.yourVotesWrapper}>
            <div className={classes.yourVotes}>
              <div className={classes.yourVotesTitle}>Your Votes:</div>
              <div className={[
                classes.yourVotesValue,
                `${BigNumber(totalVotes).gt(100)
                  ? classes.errorText
                  : classes.helpText}`,
                noTokenSelected ? classes.infoSectionPercentDisabled : "",
                ].join(" ")}
              >
                {formatCurrency(totalVotes)}%
              </div>

              <div className={classes.yourVotesControls}>
                <Button
                  className={[
                    classes.yourVotesControl,
                    classes.yourVotesControlActive,
                    noTokenSelected || disableCastVotes
                      ? classes.yourVotesControlDisabled
                      : null,
                  ].join(" ")}
                  variant="contained"
                  size="large"
                  color="primary"
                  disabled={
                    disableCastVotes ||
                    voteLoading ||
                    BigNumber(totalVotes).eq(0) ||
                    BigNumber(totalVotes).gt(100)
                  }
                  onClick={onVote}
                >
                  {voteLoading ? `Casting Votes` : `Cast Votes`}
                  {voteLoading && (
                    <CircularProgress size={10} className={classes.loadingCircle} />
                  )}
                </Button>
                <Button
                  className={[
                    classes.yourVotesControl,
                    noTokenSelected || disableCastVotes
                      ? classes.yourVotesControlDisabled
                      : null,
                  ].join(" ")}
                  variant="contained"
                  size="large"
                  color="primary"
                  disabled={voteLoading}
                  onClick={onResetVotes}
                >
                  {voteLoading ? (windowWidth >= 806 ? `Reseting Votes` : 'Reseting') : "Reset"}
                  {voteLoading && (
                    <CircularProgress size={10} className={classes.loadingCircle} />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className={classes.addButton} onClick={onBribe}>
            <div className={classes.actionButtonText}>
              Create Bribe
            </div>
          </div>

          <div className={classes.addButtonMobile} onClick={onBribe}>
            <span>Bribe +</span>
          </div>
        </div>

        <div className={[classes.controls, "g-flex", "g-flex--align-baseline"].join(" ")}>
          <div className={classes.filterWrapper}>
            <button
              onClick={() => setFilteredGauges(null)}
              className={[
                classes.filterButton,
                filteredGauges ? classes.filterButtonDisabled : ""
              ].join(" ")}
            >
              All Pools
            </button>
            <button
              onClick={setMyVotesGauges}
              className={[
                classes.filterButton,
                !filteredGauges ? classes.filterButtonDisabled : ""
              ].join(" ")}
            >
              My Votes
            </button>
          </div>

          <div className={classes.fields}>
          <div className={classes.select}>
            {TokenSelect({
              value: token,
              options: vestNFTs,
              symbol: veToken?.symbol,
              handleChange,
              placeholder: "Select veREMOTE",
            })}
          </div>

          <div className={classes.field}>
            <TextField
              className={classes.searchInputRoot}
              variant="outlined"
              fullWidth
              placeholder="Type or paste the address"
              value={search}
              onChange={onSearchChanged}
              InputProps={{
                classes: {
                  root: classes.searchInput,
                  input: classes.searchInputInput,
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <div className={classes.searchInputIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" fill="#9A9FAF"/>
                        <path d="M20 20L18 18" stroke="#9A9FAF" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                  </InputAdornment>
                ),
              }}
              inputProps={{
                className: classes.searchInputText,
              }}
            />
          </div>
          </div>
        </div>
      </div>

      <GaugesTable
        gauges={gauges.filter((pair) => {
          if (!search || search === "") {
            return true;
          }

          const searchLower = search.toLowerCase();

          if (
            pair.symbol.toLowerCase().includes(searchLower) ||
            pair.address.toLowerCase().includes(searchLower) ||
            pair.token0.symbol.toLowerCase().includes(searchLower) ||
            pair.token0.address.toLowerCase().includes(searchLower) ||
            pair.token0.name.toLowerCase().includes(searchLower) ||
            pair.token1.symbol.toLowerCase().includes(searchLower) ||
            pair.token1.address.toLowerCase().includes(searchLower) ||
            pair.token1.name.toLowerCase().includes(searchLower)
          ) {
            return true;
          }

          return false;
        })}
        filteredGauges={filteredGauges}
        setParentSliderValues={setVotes}
        defaultVotes={votes}
        veToken={veToken}
        token={token}
        noTokenSelected={noTokenSelected}
        showSearch={showSearch}
        handleChangeNFT={handleChange}
        vestNFTs={vestNFTs}
      />
    </>
  );
}
