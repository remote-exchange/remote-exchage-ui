import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Tooltip,
} from '@mui/material';
import BigNumber from 'bignumber.js';
import TokenSelect from '../select-token/select-token';
import classes from './ssWhitelist.module.css';
import stores from '../../stores';
import { ACTIONS, ETHERSCAN_URL } from '../../stores/constants';
import { formatAddress, formatCurrency } from '../../utils';
import { formatSymbol } from '../../utils';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import Hint from '../hint/hint';

export default function ssWhitelist() {

  const [web3, setWeb3] = useState(null);
  const [loading, setLoading] = useState(false);
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [token, setToken] = useState(null);
  const [nfts, setNFTS] = useState([]);
  const [nft, setNFT] = useState(null);
  const [veToken, setVeToken] = useState(null);
  const {appTheme} = useAppThemeContext();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [feeHintAnchor, setFeeHintAnchor] = React.useState(null);
  const [actionHintAnchor, setActionHintAnchor] = React.useState(null);

  const handleClickFeePopover = (event) => {
    setFeeHintAnchor(event.currentTarget);
  };

  const handleCloseFeePopover = () => {
    setFeeHintAnchor(null);
  };

  const handleClickActionPopover = (event) => {
    setActionHintAnchor(event.currentTarget);
  };

  const handleCloseActionPopover = () => {
    setActionHintAnchor(null);
  };

  const openFeeHint = Boolean(feeHintAnchor);
  const openActionHint = Boolean(actionHintAnchor);

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
    if (web3?.utils.isAddress(event.target.value)) {
      setLoading(true);
      stores.dispatcher.dispatch({type: ACTIONS.SEARCH_WHITELIST, content: {search: event.target.value}});
    } else {
      setToken(null);
    }
  };

  useEffect(() => {
    const searchReturned = async (res) => {
      setToken(res);
      setLoading(false);
    };

    const whitelistReturned = async (res) => {
      setWhitelistLoading(false);
    };

    const ssUpdated = () => {
      setVeToken(stores.stableSwapStore.getStore('veToken'));

      const nfts = stores.stableSwapStore.getStore('vestNFTs') ?? [];
      setNFTS(nfts);

      if (nfts?.length > 0) {
        setNFT(nfts[0]);
      }
    };

    const accountChanged = async () => {
      const w3 = await stores.accountStore.getWeb3Provider();
      setWeb3(w3);
    };

    const errorReturned = () => {
      setWhitelistLoading(false);
    };

    // need to call for case when we came from already loaded pages
    ssUpdated();

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountChanged);
    stores.emitter.on(ACTIONS.SEARCH_WHITELIST_RETURNED, searchReturned);
    stores.emitter.on(ACTIONS.WHITELIST_TOKEN_RETURNED, whitelistReturned);

    accountChanged();

    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountChanged);
      stores.emitter.removeListener(ACTIONS.SEARCH_WHITELIST_RETURNED, searchReturned);
      stores.emitter.removeListener(ACTIONS.WHITELIST_TOKEN_RETURNED, whitelistReturned);
    };
  }, []);

  const onAddressClick = (address) => {
    window.open(`${ETHERSCAN_URL}token/${address}`, '_blank');
  };

  const onWhitelist = () => {
    setWhitelistLoading(true);
    stores.dispatcher.dispatch({type: ACTIONS.WHITELIST_TOKEN, content: {token, nft}});
  };

  const handleChange = (event) => {
    setNFT(event.target.value);
  };

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });


  const renderToken = () => {
    return (
      <>
        {windowWidth > 900 &&
          <div className={classes.results}>
            <div className={[classes.tokenHeader, 'g-flex', 'g-flex--align-center'].join(' ')}>
              <div className={[classes.tokenHeaderLabel, classes.tokenCellName, 'g-flex__item'].join(' ')}>
                Asset
              </div>

              <div className={[classes.tokenHeaderLabel, classes.cellStatus].join(' ')}>
                Whitelist Status
              </div>

              <div className={[classes.tokenHeaderLabel, classes.cellFee, 'g-flex', 'g-flex--align-center', 'g-flex--justify-end'].join(' ')}>
                <div style={{ marginRight: 9 }}>Listing fee</div>

                <Hint
                  hintText={'Listing fee either needs to be locked in your veREMOTE NFT or be paid and burnt on listing.'}
                  open={openFeeHint}
                  anchor={feeHintAnchor}
                  handleClick={handleClickFeePopover}
                  handleClose={handleCloseFeePopover}
                  fill="#586586"
                >
                </Hint>
              </div>

              <div className={[classes.tokenHeaderLabel, classes.cellAction].join(' ')}>
                Actions
              </div>
            </div>

            <div className={classes.tokenBody}>
              <div className={[classes.tokenBodyRow, 'g-flex', 'g-flex--align-center'].join(' ')}>
                <div className={[classes.tokenBodyCell, classes.tokenCellName, 'g-flex', 'g-flex--align-center', 'g-flex__item'].join(' ')}>
                  <img
                    src={token.logoURI || ''}
                    alt=""
                    className={classes.tokenLogo}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}/>

                  <div>
                    <Typography className={classes.tokenName}>
                      {token.name}
                    </Typography>

                    <Tooltip title="View in explorer">
                      <Typography
                        className={classes.tokenAddress}
                        onClick={() => {
                          onAddressClick(token.address);
                        }}
                      >
                        {formatAddress(token.address)}
                      </Typography>
                    </Tooltip>
                  </div>
                </div>

                <div className={[classes.tokenBodyCell, classes.cellStatus, 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}>
                  {token.isWhitelisted &&
                    <Typography className={classes.isWhitelist}>
                      Already Whitelisted
                    </Typography>
                  }

                  {!token.isWhitelisted &&
                    <Typography className={classes.notWhitelist}>
                      Not Whitelisted
                    </Typography>
                  }
                </div>

                <div className={[classes.tokenBodyCell, classes.cellFee, 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}>
                  <div className={classes.cellFeeContent}>
                    <Typography className={classes.listingFee}>
                      {formatCurrency(token.listingFee)}
                    </Typography>

                    <Typography className={classes.listingFeeSymbol}>
                      {formatSymbol(veToken?.symbol)}
                    </Typography>
                  </div>
                </div>

                <div className={[classes.tokenBodyCell, classes.cellAction, 'g-flex', 'g-flex--align-center', 'g-flex--justify-end'].join(' ')}>
                  {!token.isWhitelisted && nft && BigNumber(nft.lockValue).gt(token.listingFee) &&
                    <div
                      onClick={onWhitelist}
                      className={[classes.buttonOverride, 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}>
                      <Typography
                        className={classes.actionButtonText}>
                        {whitelistLoading ? `Whitelisting` : `Whitelist`}
                      </Typography>
                    </div>
                  }

                  {(!nft || (!token.isWhitelisted && nft && BigNumber(nft.lockValue).lt(token.listingFee)) || (token.isWhitelisted && nft && BigNumber(nft.lockValue).gt(token.listingFee))) &&
                    <>
                      {/* {!token.isWhitelisted &&
                        <Hint
                          hintText={'Cannot proceed with whitelisting due to insufficient veREMOTE.'}
                          open={openActionHint}
                          anchor={actionHintAnchor}
                          handleClick={handleClickActionPopover}
                          handleClose={handleCloseActionPopover}
                          fill="#586586"
                        >
                        </Hint>
                      } */}

                      <div color="primary" className={classes.buttonOverrideDisabled}>
                        {token.isWhitelisted ? 'Nothing to do' : 'Vest Value < Fee'}
                      </div>
                    </>
                  }
                </div>
              </div>

              {(!nft || (!token.isWhitelisted && nft && BigNumber(nft.lockValue).lt(token.listingFee)) || (token.isWhitelisted && nft && BigNumber(nft.lockValue).gt(token.listingFee))) && (
                <>
                  {!token.isWhitelisted && (
                    <div className={classes.notification}>
                      <img src="/images/ui/info-circle-gray.svg" width="18px" style={{ marginRight: 15 }} />
                      <span>You cannot proceed with the whitelisting as there is not enough funds locked in the chosen veREMOTE.</span>
                    </div>
                  )}
                </>
              )}
              
            </div>
          </div>
        }

        {windowWidth <= 900 &&
          <div className={classes.adaptiveContainer}>
            <div className={classes.adaptiveHeader}>
              <div className={['g-flex', 'g-flex--align-center'].join(' ')}>
                <img
                  src={token.logoURI || ''}
                  alt=""
                  className={classes.tokenLogo}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />

                <div>
                  <Typography className={classes.tokenName}>
                    {token.name}
                  </Typography>

                  <Tooltip title="View in explorer">
                    <Typography
                      className={classes.tokenAddress}
                      onClick={() => {
                        onAddressClick(token.address);
                      }}>
                      {formatAddress(token.address)}
                    </Typography>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className={classes.adaptiveWrapper}>
              <div className={classes.adaptiveTable}>
                <div className={classes.adaptive}>
                  <div className={classes.adaptiveActionLabel}>
                    Whitelist status
                  </div>

                  <div className={classes.adaptiveActionItem}>
                    {token.isWhitelisted &&
                      <Typography className={classes.isWhitelist}>
                        Already Whitelisted
                      </Typography>
                    }

                    {!token.isWhitelisted &&
                      <Typography className={classes.notWhitelist}>
                        Not Whitelisted
                      </Typography>
                    }
                  </div>
                </div>

                <div className={classes.adaptive}>
                  <div className={classes.adaptiveActionLabel}>
                    <div style={{ marginRight: 10 }}>
                      Listing Fee
                    </div>

                    <Hint
                      hintText={'Listing fee either needs to be locked in your veREMOTE NFT or be paid and burnt on listing.'}
                      open={openFeeHint}
                      anchor={feeHintAnchor}
                      handleClick={handleClickFeePopover}
                      handleClose={handleCloseFeePopover}
                      fill="#586586"
                      iconComponent={<img src="/images/ui/info-circle-gray.svg" width="12px" />}
                    >
                    </Hint>
                  </div>

                  <div className={classes.adaptiveActionItem}>
                    <div className={classes.cellFeeContent}>
                      <Typography className={classes.listingFee}>
                        {formatCurrency(token.listingFee)}
                      </Typography>

                      <Typography className={classes.listingFeeSymbol}>
                        {formatSymbol(veToken?.symbol)}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              {!token.isWhitelisted && nft && BigNumber(nft.lockValue).gt(token.listingFee) &&
                <div
                  onClick={onWhitelist}
                  className={[classes.buttonOverride, 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}>
                  <Typography className={classes.actionButtonText}>
                    {whitelistLoading ? `Whitelisting` : `Whitelist`}
                  </Typography>
                </div>
              }

              {(!nft || (!token.isWhitelisted && nft && BigNumber(nft.lockValue).lt(token.listingFee)) || (token.isWhitelisted && nft && BigNumber(nft.lockValue).gt(token.listingFee))) &&
                <>
                  {/* {!token.isWhitelisted &&
                    <Hint
                      hintText={'Cannot proceed with whitelisting due to insufficient veREMOTE.'}
                      open={openActionHint}
                      anchor={actionHintAnchor}
                      handleClick={handleClickActionPopover}
                      handleClose={handleCloseActionPopover}
                      fill="#586586"
                    >
                    </Hint>
                  } */}

                  <div color="primary" className={classes.buttonOverrideDisabled}>
                    {token.isWhitelisted ? 'Nothing to do' : 'Vest value < Fee'}
                  </div>
                </>
              }

              {(!nft || (!token.isWhitelisted && nft && BigNumber(nft.lockValue).lt(token.listingFee)) || (token.isWhitelisted && nft && BigNumber(nft.lockValue).gt(token.listingFee))) && (
                <>
                  {!token.isWhitelisted && (
                    <div className={classes.notification}>
                      <img src="/images/ui/info-circle-gray.svg" width="15px" style={{ marginRight: 10 }} />
                      <span>You cannot proceed with the whitelisting as there is not enough funds locked in the chosen veREMOTE.</span>
                    </div>
                  )}
                </>
              )}
              
            </div>
          </div>
        }
      </>
    );
  };

  return (
    <>
      <div className={classes.wrapper}>
        <div className={classes.title}>Whitelist</div>

        <div className={[classes.controls, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
          <div className={classes.field}>
            <TextField
              autoFocus
              fullWidth
              placeholder={windowWidth > 540 ? "Type or paste the address" : 'Token to whitelist: 0x'}
              value={search}
              onChange={onSearchChanged}
              autoComplete={'off'}
              InputProps={{
                classes: {
                  root: classes.searchInput,
                  input: classes.searchInputInput,
                },
                endAdornment: <InputAdornment position="end">
                  <div className={classes.searchInputIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" fill="#9A9FAF"/>
                      <path d="M20 20L18 18" stroke="#9A9FAF" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                </InputAdornment>,
              }}
              inputProps={{
                className: classes.searchInputText,
              }}
            />
          </div>

          <div className={classes.select}>
            {TokenSelect({
              value: nft,
              options: nfts,
              symbol: veToken?.symbol,
              handleChange,
              placeholder: 'Select veREMOTE',
            })}
          </div>
        </div>
      </div>

      {(loading || token?.address) &&
        <div className={['g-flex-column', classes.tokenLoader].join(' ')}>
          {loading && <CircularProgress style={{
            position: 'absolute',
            top: 200,
            left: '50%',
            color: '#ffffff',
          }}
        />}
        {token?.address && renderToken()}
        </div>
      }
    </>
  );
}
