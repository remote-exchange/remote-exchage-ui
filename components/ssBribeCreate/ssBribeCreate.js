import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  MenuItem,
  IconButton,
  InputBase, DialogTitle, DialogContent,
} from '@mui/material';
import { DeleteOutline, ArrowBackIosNew, Search } from '@mui/icons-material';
import BigNumber from 'bignumber.js';
import { formatCurrency } from '../../utils';
import classes from './ssBribeCreate.module.css';
import classesSelect from './select.module.css';
import classesDialog from './dialog.module.css';
import { formatSymbol, formatInputAmount } from '../../utils';
import stores from '../../stores';
import {
  ACTIONS,
  DEFAULT_ASSET_TO,
  DEFAULT_ASSET_FROM,
  ETHERSCAN_URL,
} from '../../stores/constants';
import {FTM_ADDRESS, WFTM_ADDRESS, FTM_SYMBOL} from '../../stores/constants/contracts'

import { useAppThemeContext } from '../../ui/AppThemeProvider';
import BackButton from "../../ui/BackButton";

export default function ssBribeCreate() {

  const router = useRouter();
  const [createLoading, setCreateLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [asset, setAsset] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]);
  const [gauge, setGauge] = useState(null);
  const [gaugeOptions, setGaugeOptions] = useState([]);

  const ssUpdated = async () => {
    const storeAssetOptions = stores.stableSwapStore.getStore('baseAssets');
    let filteredStoreAssetOptions = storeAssetOptions.filter((option) => {
      return option.address !== FTM_SYMBOL;
    });
    const storePairs = stores.stableSwapStore.getStore('pairs');
    setAssetOptions(filteredStoreAssetOptions);
    setGaugeOptions(storePairs);

    if (filteredStoreAssetOptions.length > 0 && asset == null) {
      for (let i = 0; i < storeAssetOptions.length; i++) {
        if (filteredStoreAssetOptions[i].address.toLowerCase() === DEFAULT_ASSET_TO.toLowerCase()) {
          setAsset(filteredStoreAssetOptions[i]);
          break;
        }
      }
    }

    if (storePairs.length > 0 && gauge == null) {
      let defaultPair, i;
      const defaultAssetFrom = DEFAULT_ASSET_FROM === FTM_ADDRESS ? WFTM_ADDRESS : DEFAULT_ASSET_FROM
      const defaultAssetTo = DEFAULT_ASSET_TO === FTM_ADDRESS ? WFTM_ADDRESS : DEFAULT_ASSET_TO
      for (i = 0; i < storePairs.length; i++) {
        if (
            storePairs[i].gauge != null
            &&
            (
                (storePairs[i].token0.address.toLowerCase() === defaultAssetFrom.toLowerCase() && storePairs[i].token1.address.toLowerCase() === defaultAssetTo.toLowerCase())
                || (storePairs[i].token1.address.toLowerCase() === defaultAssetFrom.toLowerCase() && storePairs[i].token0.address.toLowerCase() === defaultAssetTo.toLowerCase())
            )
        ) {
          defaultPair = storePairs[i]
          break
        }
      }

      if (!defaultPair) {
        for (i = 0; i < storePairs.length; i++)
          if (storePairs[i].gauge != null) {
            defaultPair = storePairs[i]
            break;
          }
      }

      setGauge(defaultPair);
    }
  };

  useEffect(() => {
    const createReturned = (res) => {
      setCreateLoading(false);
      setAmount('');

      onBack();
    };

    const errorReturned = () => {
      setCreateLoading(false);
    };

    const assetsUpdated = () => {
      const baseAsset = stores.stableSwapStore.getStore('baseAssets');
      let filteredStoreAssetOptions = baseAsset.filter((option) => {
        return option.address !== FTM_SYMBOL;
      });
      setAssetOptions(filteredStoreAssetOptions);
    };

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.BRIBE_CREATED, createReturned);
    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);

    ssUpdated();

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.BRIBE_CREATED, createReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
    };
  }, []);

  const setAmountMax = (input) => {
    setAmountError(false);
    if (input === 'amount') {
      let am = BigNumber(asset.balance).toFixed();
      setAmount(am);
    }
  };

  const onCreate = () => {
    setAmountError(false);

    let error = false;

    if (!amount || amount === '' || isNaN(amount)) {
      setAmountError('From amount is required');
      error = true;
    } else {
      if (!asset.balance || isNaN(asset.balance) || BigNumber(asset.balance).lte(0)) {
        setAmountError('Invalid balance');
        error = true;
      } else if (BigNumber(amount).lt(0)) {
        setAmountError('Invalid amount');
        error = true;
      } else if (asset && BigNumber(amount).gt(asset.balance)) {
        setAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!asset || asset === null) {
      setAmountError('From asset is required');
      error = true;
    }

    if (!error) {
      setCreateLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.CREATE_BRIBE, content: {
          asset: asset,
          amount: amount,
          gauge: gauge,
        },
      });
    }
  };

  const amountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(',', '.'))
    setAmountError(false);
    setAmount(value);
  };

  const onAssetSelect = (type, value) => {
    setAmountError(false);
    setAsset(value);
  };

  const onGagugeSelect = (event, asset) => {
    setGauge(asset);
  };

  const renderMassiveGaugeInput = (type, value, error, options, onChange) => {
    return (
      <div className={classes.textFieldTop}>
        <div className={classes.inputTitleText}>Bribe for :</div>

        <div className={classes.massiveInputContainer}>
          <AssetSelectPair type={type} value={value} assetOptions={options} onSelect={onChange} manageLocal={false} gauge={gauge} />
          {/* <div className={classes.assetSelectIconNameWrapper}>
            <div className={classes.assetSymbolName}>
              {formatSymbol(gauge?.symbol)}
            </div>
          </div> */}
        </div>
      </div>
    );
  };

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, assetValue, assetError, assetOptions, onAssetSelect) => {
    return (
      <>
        <div className={classes.textField}>
          <div className={classes.inputTitleText}>Bribe with :</div>

          <div className={classes.textFieldContainer}>
            <AssetSelectManage
              type={type}
              value={assetValue}
              assetOptions={assetOptions}
              onSelect={onAssetSelect}
              manageLocal={true}
              assetValue={assetValue}
            />
          </div>
        </div>

        <div className={classes.textField}>
          <div className={classes.inputBalanceRow}>
            <div className={classes.inputBalanceText}>
              {(assetValue && assetValue.balance) ?
                'Balance: ' + formatCurrency(assetValue.balance) :
                ''
              }
            </div>
            <div className={classes.inputBalanceMax} onClick={() => { setAmountMax(type) }}>
              MAX
            </div>
          </div>

          <InputBase
            className={classes.massiveInputAmount}
            placeholder="0.00"
            error={amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={createLoading}
            inputProps={{
              className: classes.largeInput,
            }}
            
            InputProps={{
              disableUnderline: true,
            }}
          />
        </div>
      </>
    );
  };

  const onBack = () => {
    router.push('/vote');
  };

  const renderCreateInfo = () => {
    return (
      <div className={[classes.warningContainer, classes.warningContainerSuccess].join(" ")}>
        <img src="/images/ui/info-circle-green.svg" width="18px" className={classes.warningIcon} />
        <p className={classes.warningText}>
          You are creating a bribe of {formatCurrency(amount)} {formatSymbol(asset?.symbol)} to incentivize
          Vesters to vote for the {formatSymbol(gauge?.token0?.symbol)}/{formatSymbol(gauge?.token1?.symbol)} Pool
        </p>
      </div>
    )
  };

  const {appTheme} = useAppThemeContext();

  let actionButtonText = createLoading ? `Creating` : `Create Bribe`
  if (gauge == null && asset === null) {
    actionButtonText = 'Choose LP & token'
  } else if (asset === null) {
    actionButtonText = 'Choose token'
  } else if (!amount || parseFloat(amount) == 0) {
    actionButtonText = 'Enter amount'
  }

  return (
    <>
      <div className={classes.tnavWrapper}>
        <div className={classes.tnav}>
          <span className={classes.tnavItem} onClick={onBack}>Vote</span>
          <span className={classes.tnavItemActive}>Create Bribe</span>
        </div>
      </div>

      <div className={classes.formWrapper}>
        <div className={classes.title}>
          <span>Create Bribe</span>
        </div>

        <div className={classes.mainBody}>
          {renderMassiveGaugeInput('gauge', gauge, null, gaugeOptions, onGagugeSelect)}

          {renderMassiveInput('amount', amount, amountError, amountChanged, asset, null, assetOptions, onAssetSelect)}
        </div>

        <div className={classes.warningContainer}>
          <img src="/images/ui/info-circle-gray.svg" width="18px" className={classes.warningIcon} />
          <p className={classes.warningText}>Select a liquidity pool to bribe for and a bribe token with the amount.</p>
        </div>

        {amountError && (
          <div className={[classes.warningContainer, classes.warningContainerError].join(" ")}>
            <img src="/images/ui/info-circle-red.svg" width="18px" className={classes.warningIcon} />
            <p className={classes.warningText}>{amountError}</p>
          </div>
        )}

        {renderCreateInfo()}

        <div className={classes.controls}>
          <Button
            className={[
              classes.button,
              (createLoading || amount === '' || parseFloat(amount) === 0) ? classes.buttonDisabled : ""
            ].join(" ")}
            variant="contained"
            size="large"
            color="primary"
            disabled={createLoading || amount === '' || parseFloat(amount) === 0}
            onClick={onCreate}
          >
            <span>{actionButtonText}</span>
            {createLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
          </Button>
        </div>
      </div>
    </>
  );
}

function AssetSelectManage({type, value, assetOptions, onSelect, manageLocalAssets, assetValue}) {
  const {appTheme} = useAppThemeContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const openSearch = () => {
    setOpen(true);
    setSearch('');
  };

  useEffect(function () {

    let ao = assetOptions.filter((asset) => {
      if (search && search !== '') {
        return asset.address.toLowerCase().includes(search.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
          asset.name.toLowerCase().includes(search.toLowerCase());
      } else {
        return true;
      }
    });

    setFilteredAssetOptions(ao);

    return () => {
    };
  }, [assetOptions, search]);


  const onSearchChanged = async (event) => {
    setSearch(event.target.value);
  };

  const onLocalSelect = (type, asset) => {
    setSearch('');
    setManageLocal(false);
    setOpen(false);
    onSelect(type, asset);
  };

  const onClose = () => {
    setManageLocal(false);
    setSearch('');
    setOpen(false);
  };

  const toggleLocal = () => {
    setManageLocal(!manageLocal);
  };

  const deleteOption = (token) => {
    stores.stableSwapStore.removeBaseAsset(token);
  };

  const viewOption = (token) => {
    window.open(`${ETHERSCAN_URL}token/${token.address}`, '_blank');
  };

  const renderManageOption = (type, asset, idx) => {
    return (
      <MenuItem
        val={asset.address} key={asset.address + '_' + idx}
        className={[classes.assetSelectMenu, classes[`assetSelectMenu--${appTheme}`]].join(' ')}>
        <div className={classes.assetSelectMenuItem}>
          <div className={classes.displayDualIconContainerSmall}>
            <img
              className={[classes.assetOptionIcon, classes[`assetOptionIcon--${appTheme}`]].join(' ')}
              alt=""
              src={asset ? `${asset.logoURI}` : ''}
              // height="60px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />

          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography className={classes.assetSymbolName} variant="h5">{asset ? formatSymbol(asset.symbol) : ''}</Typography>
          <Typography variant="subtitle1" color="textSecondary">{asset ? formatSymbol(asset.name) : ''}</Typography>
        </div>
        <div className={classes.assetSelectActions}>
          <IconButton onClick={() => {
            deleteOption(asset);
          }}>
            <DeleteOutline/>
          </IconButton>
          <IconButton onClick={() => {
            viewOption(asset);
          }}>
            ↗
          </IconButton>
        </div>
      </MenuItem>
    );
  };

  const renderAssetOption = (type, asset, idx) => {
    return (
      <MenuItem
        val={asset.address}
        key={asset.address + '_' + idx}
        className={classesDialog.assetSelectMenu}
        onClick={() => {
          onLocalSelect(type, asset);
        }}
      >
        <div className={classesDialog.assetSelectMenuCol}>
          <div className={classesDialog.displaySelectContainer}>
            <img
              className={classesDialog.assetOptionIcon}
              alt=""
              src={asset ? `${asset.logoURI}` : ''}
              height="52px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
          </div>
          <div className={classesDialog.assetSelectIconName}>
            <div className={classesDialog.assetSymbolName}>
              {asset ? formatSymbol(asset.symbol) : ''}
            </div>

            <div className={classesDialog.assetSymbolName2}>
              {asset ? asset.name : ''}
            </div>
          </div>
        </div>

        <div className={classesDialog.assetSelectMenuCol}>
          <div className={classesDialog.assetSelectBalance}>
            <div className={classesDialog.assetSelectBalanceTypo}>
              {(asset && asset.balance) ? formatCurrency(asset.balance) : '0.00'}
            </div>

            <div className={classesDialog.assetSelectBalanceSubtitle1}>
              Balance
            </div>
          </div>
        </div>
      </MenuItem>
    );
  };

  const renderManageLocal = () => {
    return (
      <>
        <div className={classesDialog.searchInline}>
          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              classes: {
                root: classesDialog.searchInput,
                inputAdornedEnd: classesDialog.searchInputText,
                input: classesDialog.searchInputInput,
              },
              endAdornment: <InputAdornment position="end">
                <div className={classesDialog.searchInputIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" fill="#9A9FAF"/>
                    <path d="M20 20L18 18" stroke="#9A9FAF" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </InputAdornment>,
            }}
          />
        </div>

        <div className={classesDialog.dialogOptions}>
          {filteredAssetOptions ? filteredAssetOptions.filter((option) => {
            return option.local === true;
          }).map((asset, idx) => {
            return renderManageOption(type, asset, idx);
          }) : []}
        </div>
      </>
    );
  };

  const renderOptions = () => {
    return (
      <>
        <div className={classesDialog.searchInline}>
          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              classes: {
                root: classesDialog.searchInput,
                inputAdornedEnd: classesDialog.searchInputText,
                input: classesDialog.searchInputInput,
              },
              endAdornment: <InputAdornment position="end">
                <div className={classesDialog.searchInputIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" fill="#9A9FAF"/>
                    <path d="M20 20L18 18" stroke="#9A9FAF" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </InputAdornment>,
            }}
          />
        </div>

        <div className={classesDialog.dialogOptions}>
          {filteredAssetOptions ? filteredAssetOptions.sort((a, b) => {
            if (BigNumber(a.balance).lt(b.balance)) return 1;
            if (BigNumber(a.balance).gt(b.balance)) return -1;
            if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) return -1;
            if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) return 1;
            return 0;
            }).map((asset, idx) => {
              return renderAssetOption(type, asset, idx);
            }) : []
          }
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className={[classesSelect.displayDualIconContainer, classesSelect.displayDualIconContainerManage].join(' ')}
        onClick={() => { openSearch() }}
        style={{ cursor: 'pointer' }}
      >
        <img
          className={classesSelect.displayAssetIcon}
          alt=""
          src={value ? `${value.logoURI}` : ''}
          height="52px"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
          }}
        />
      </div>

      <div className={[classes.smallerText, classes.smallerTextArrow].join(" ")} style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => { openSearch() }}>
        {formatSymbol(assetValue?.symbol)}
      </div>

      <Dialog
        PaperProps={{ style: { width: "100%", maxWidth: 800, background: 'transpaarent', borderRadius: 20, overflowY: "visible" } }}
        aria-labelledby="simple-dialog-title"
        open={open}
        onClick={(e) => {
          if (e.target.classList.contains('MuiDialog-container')) {
            onClose();
          }
        }}
        classes={{
          paperScrollPaper: classesDialog.paperScrollPaper,
          paper: classesDialog.paper,
          scrollPaper: classesDialog.scrollPaper,
        }}
      >
        <div className={classesDialog.tvAntenna} />
        <div className={classesDialog.dialogContainer}>
          <div className={classesDialog.dialogContainerInner}>
            <div className={classesDialog.dialogTitleWrapper}>
              <div className={classesDialog.tabs}>
                <div
                  className={[classesDialog.tab, manageLocal ? "" : classesDialog.tabActive].join(" ")}
                  onClick={toggleLocal}
                >
                  Token List
                </div>
                <div
                  className={[classesDialog.tab, manageLocal ? classesDialog.tabActive : ""].join(" ")}
                  onClick={toggleLocal}
                >
                  Local Assets
                </div>
              </div>

              <div className={classesDialog.dialogClose} onClick={onClose} />
            </div>

            <div className={classesDialog.dialogContent}>
              {!manageLocal && renderOptions(manageLocalAssets)}
              {manageLocalAssets && manageLocal && renderManageLocal()}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function AssetSelectPair({type, value, assetOptions, onSelect, manageLocalAssets, gauge}) {
  const {appTheme} = useAppThemeContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const openSearch = () => {
    setOpen(true);
    setSearch('');
  };

  useEffect(function () {

    let ao = assetOptions.filter((asset) => {
      if (search && search !== '') {
        return asset.address.toLowerCase().includes(search.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
          asset.name.toLowerCase().includes(search.toLowerCase());
      } else {
        return true;
      }
    });

    setFilteredAssetOptions(ao);

    return () => {
    };
  }, [assetOptions, search]);


  const onSearchChanged = async (event) => {
    setSearch(event.target.value);
  };

  const onLocalSelect = (type, asset) => {
    setSearch('');
    setManageLocal(false);
    setOpen(false);
    onSelect(type, asset);
  };

  const onClose = () => {
    setManageLocal(false);
    setSearch('');
    setOpen(false);
  };

  const toggleLocal = () => {
    setManageLocal(!manageLocal);
  };

  const deleteOption = (token) => {
    stores.stableSwapStore.removeBaseAsset(token);
  };

  const viewOption = (token) => {
    window.open(`${ETHERSCAN_URL}token/${token.address}`, '_blank');
  };

  const renderManageOption = (type, asset, idx) => {
    return (
      <MenuItem
        val={asset.address} key={asset.address + '_' + idx}
        className={[classes.assetSelectMenu, classes[`assetSelectMenu--${appTheme}`]].join(' ')}>
        <div className={classes.assetSelectMenuItem}>
          <div className={classes.displayDualIconContainerSmall}>
            <img
              className={[classes.assetOptionIcon, classes[`assetOptionIcon--${appTheme}`]].join(' ')}
              alt=""
              src={asset ? `${asset.logoURI}` : ''}
              height="52px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography variant="h5">{asset ? asset.symbol : ''}</Typography>
          <Typography variant="subtitle1" color="textSecondary">{asset ? asset.name : ''}</Typography>
        </div>
        <div className={classes.assetSelectActions}>
          <IconButton onClick={() => {
            deleteOption(asset);
          }}>
            <DeleteOutline/>
          </IconButton>
          <IconButton onClick={() => {
            viewOption(asset);
          }}>
            ↗
          </IconButton>
        </div>
      </MenuItem>
    );
  };

  const renderAssetOption = (type, asset, idx) => {
    return (
      <MenuItem
        val={asset.address}
        key={asset.address + '_' + idx}
        className={classesDialog.assetSelectMenu}
        onClick={() => {
          onLocalSelect(type, asset);
        }}
      >
        <div className={classesDialog.assetSelectMenuCol}>
          <div className={classesDialog.displaySelectContainer}>
            <div className={classesDialog.displayDualIconContainer}>
              <img
                className={classesDialog.assetOptionIcon}
                alt=""
                src={asset ? `${asset?.token0?.logoURI}` : ''}
                height="52px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                }}
              />

              <img
                className={[classesDialog.assetOptionIcon, classesDialog.displayAssetIconSec].join(' ')}
                alt=""
                src={asset ? `${asset?.token1?.logoURI}` : ''}
                height="52px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                }}
              />
            </div>
          </div>
          <div className={classesDialog.assetSelectIconName}>
            <div className={classesDialog.assetSymbolName}>
              {asset ? formatSymbol(asset.symbol) : ''}
            </div>

            <div className={classesDialog.assetSymbolName2}>
              {asset.isStable ? "Stable Pool" : "Volatile Pool"}
            </div>
          </div>
        </div>

        <div className={classesDialog.assetSelectMenuCol}>
          <div className={classesDialog.assetSelectBalance}>
            <div className={classesDialog.assetSelectBalanceTypo}>
              {(asset && asset.balance) ? formatCurrency(asset.balance) : '0.00'}
            </div>

            <div className={classesDialog.assetSelectBalanceSubtitle1}>
              Balance
            </div>
          </div>
        </div>
      </MenuItem>
    );
  };

  const renderManageLocal = () => {
    return (
      <>
        <div className={classes.searchInline}>
          {/* <Borders/> */}

          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                background: '#171D2D',
                border: '1px solid',
                borderColor: '#779BF4',
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
                input: classes.searchInputInput
              },
              endAdornment: <InputAdornment position="end">
                  {/*Search icon*/}
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 20C15.7467 20 20 15.7467 20 10.5C20 5.25329 15.7467 1 10.5 1C5.25329 1 1 5.25329 1 10.5C1 15.7467 5.25329 20 10.5 20Z" stroke="#779BF4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{position: 'relative'}}>
                      <svg style={{position: 'absolute', top: 8, right: 0,}} width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 3L1 1" stroke="#779BF4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  </div>
              </InputAdornment>,
            }}
            inputProps={{
              style: {
                padding: '24px',
                borderRadius: 0,
                border: 'none',
                fontSize: '16px',
                lineHeight: '120%',
                color: '#E4E9F4',
              },
            }}
          />
        </div>

        <div className={classes.assetSearchResults}>
          {
            filteredAssetOptions ? filteredAssetOptions.filter((option) => {
              return option.local === true;
            }).map((asset, idx) => {
              return renderManageOption(type, asset, idx);
            }) : []
          }
        </div>

        <div className={classes.manageLocalContainer}>
          <Button
            onClick={toggleLocal}>
            Back to Assets
          </Button>
        </div>
      </>
    );
  };

  const renderOptions = (manageLocalAssets) => {
    return (
      <>
        <div className={classesDialog.searchInline}>
          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              classes: {
                root: classesDialog.searchInput,
                inputAdornedEnd: classesDialog.searchInputText,
                input: classesDialog.searchInputInput,
              },
              endAdornment: <InputAdornment position="end">
                <div className={classesDialog.searchInputIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" fill="#9A9FAF"/>
                    <path d="M20 20L18 18" stroke="#9A9FAF" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </InputAdornment>,
            }}
          />
        </div>

        <div className={classesDialog.dialogOptions}>
          {filteredAssetOptions ? filteredAssetOptions.sort((a, b) => {
            if (BigNumber(a.balance).lt(b.balance)) return 1;
            if (BigNumber(a.balance).gt(b.balance)) return -1;
            if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) return -1;
            if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) return 1;
              return 0;
          }).map((asset, idx) => {
            if (asset.gauge != null)
              return renderAssetOption(type, asset, idx);
            }) : []
          }
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className={[classesSelect.displayDualIconContainer, classesSelect.displayDualIconContainerSelect].join(' ')}
        onClick={() => { openSearch() }}
        style={{ cursor: 'pointer' }}
      >
        <img
          className={classesSelect.displayAssetIcon}
          alt=""
          src={value ? `${value?.token0?.logoURI}` : ''}
          height="52px"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
          }}
        />
        <img
          className={[
            classesSelect.displayAssetIcon,
            classesSelect.displayAssetIconSec,
          ].join(" ")}
          alt=""
          src={value ? `${value?.token1?.logoURI}` : ''}
          height="52px"
          onError={(e) => {
          e.target.onerror = null;
            e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
          }}
        />
      </div>

      <div className={classes.assetSelectIconNameWrapper} onClick={() => { openSearch() }} style={{ cursor: 'pointer' }}>
        <div className={classes.assetSymbolName}>{formatSymbol(gauge?.symbol)}</div>
      </div>

      <Dialog
        PaperProps={{ style: { width: "100%", maxWidth: 800, background: 'transpaarent', borderRadius: 20, overflowY: "visible" } }}
        aria-labelledby="simple-dialog-title"
        open={open}
        onClick={(e) => {
          if (e.target.classList.contains('MuiDialog-container')) {
            onClose();
          }
        }}
        classes={{
          paperScrollPaper: classesDialog.paperScrollPaper,
          paper: classesDialog.paper,
          scrollPaper: classesDialog.scrollPaper,
        }}
      >
        <div className={classesDialog.tvAntenna} />
        <div className={classesDialog.dialogContainer}>
          <div className={classesDialog.dialogContainerInner}>
            <div className={classesDialog.dialogTitleWrapper}>
              <div className={classesDialog.dialogTitle}>
                {manageLocal && <ArrowBackIosNew onClick={toggleLocal} style={{
                  marginRight: 10,
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                }}/>}
                {manageLocalAssets && manageLocal ? 'Manage local assets' : 'Select LP'}
              </div>
              <div className={classesDialog.dialogClose} onClick={onClose} />
            </div>

            {manageLocalAssets &&
              <div className={classes.manageLocalContainer}>
                <Button onClick={toggleLocal}>Manage local assets</Button>
              </div>
            }

            <div className={classesDialog.dialogContent}>
              {!manageLocal && renderOptions(manageLocalAssets)}
              {manageLocalAssets && manageLocal && renderManageLocal()}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
