import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
} from "@mui/material";
import { ArrowBackIosNew, Close, Search } from "@mui/icons-material";
import classes from "./vest.module.css";
import classesMerge from "./merge.module.css";
import classesLock from "../../../components/ssVest/lock.module.css";
import { useRouter } from "next/router";
import Form from "../../../ui/MigratorForm";
import stores from "../../../stores";
import { ACTIONS } from "../../../stores/constants";
import moment from "moment";

const renderAssetOption = (item, callbackClick) => {
  return (
    <div className={classes.selectItem} key={item.id} onClick={() => callbackClick(item)}>
      <div className={classes.selectItemCol}>
        <div className={classes.selectItemTitle}>NFT #{item.id}</div>
        <div className={classes.selectItemValue}>{Number(item.lockAmount).toFixed(2)} CONE</div>
      </div>
      <div className={classes.selectItemCol}>
        <div className={classes.selectItemTitle}>{moment.unix(item.lockEnds).format("YYYY-MM-DD")}</div>
        <div className={classes.selectItemValue}>Expiry date</div>
      </div>
    </div>
  );
};

const renderOptions = (data, callbackClick) => {
  return (
    <>
      <div className={classes.searchInline}>
        <TextField
          autoFocus
          variant="outlined"
          fullWidth
          placeholder="Type or paste the address"
          InputProps={{
            classes: {
              root: classes.searchInput,
              inputAdornedStart: classes.searchInputText,
            },
            endAdornment: <InputAdornment position="end">
              <Search style={{ color: '#CCD2E3' }} />
            </InputAdornment>,
          }}
        />
      </div>

      <div className={[classes.dialogOptions, "g-flex-column__item"].join(" ")}>
        <div className={classes.items}>
          {data.map(asset => {
            return renderAssetOption(asset, callbackClick);
          })}
        </div>
      </div>
    </>
  );
};

const merge = () => {
  const router = useRouter();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [vestNFTs, setVestNFTs] = useState();

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const onCreate = () => {
    router.push('/vest/create');
  };

  useEffect(() => {
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
    });

    const vestNFTsReturned = (nfts) => {
      setVestNFTs(nfts);
      forceUpdate();
    };

    window.setTimeout(() => {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_NFTS, content: {} });
    }, 1);

    stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned);
    return () => {
      stores.emitter.removeListener(
        ACTIONS.VEST_NFTS_RETURNED,
        vestNFTsReturned
      );
    };
  }, []);

  const onBack = () => {
    router.push("/vest");
  };

  // const [openSelectToken1, setOpenSelectToken1] = useState(false);
  // const [openSelectToken2, setOpenSelectToken2] = useState(false);
  const [firstSelectedNft, setFirstSelectedNft] = useState();
  const [secondSelectedNft, setSecondSelectedNft] = useState();
  const [lockloader, setLockLoading] = useState(false);

  // console.log('firstSelectedNft', firstSelectedNft)
  // console.log('secondSelectedNft', secondSelectedNft)

  // const openSelect1 = () => {
  //   setOpenSelectToken1(!openSelectToken1);
  // };
  // const openSelect2 = () => {
  //   setOpenSelectToken2(!openSelectToken2);
  // };

  // const closeSelect1 = () => {
  //   setOpenSelectToken1(false);
  // };
  // const closeSelect2 = () => {
  //   setOpenSelectToken2(false);
  // };

  const handleChange1 = (value) => {
    setFirstSelectedNft(value);
  };

  const handleChange2 = (value) => {
    setSecondSelectedNft(value);
  };

  const merge = async (firstSelectedNft, secondSelectedNft) => {
    setLockLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.MERGE_NFT,
      content: { tokenIDOne: firstSelectedNft, tokenIDTwo: secondSelectedNft },
    });
    setLockLoading(false);
  };

  const renderNftSelect1 = () => {
    const [open, setOpen] = useState(false);

    const closeModal = () => setOpen(false);

    const openModal = () => setOpen(true);

    return (
      <div className={classesMerge.selectWrapper}>
        <div className={classesMerge.selectHeader}>
          <span className={classesMerge.selectTitle}>1st NFT</span>

          {firstSelectedNft != undefined && (
            <div className={classesMerge.tokenSelectInfoAmount}>
              {Number(firstSelectedNft.lockAmount)} veREMOTE
            </div>
          )}
        </div>

        <div onClick={openModal} className={classesMerge.tokenSelect}>
          {firstSelectedNft == undefined ? (
            <div className={classesMerge.tokenSelectLabel}>Select NFT</div>
          ) : (
            <div className={classesMerge.tokenSelectInfo}>
              <div className={classesMerge.tokenSelectInfoCol}>
                <div className={classesMerge.tokenSelectInfoTitle}>{firstSelectedNft.id}</div>
              </div>
              <div className={classesMerge.tokenSelectInfoCol}>
                <div className={classesMerge.tokenSelectInfoTextTitle}>
                  {moment.unix(firstSelectedNft.lockEnds).format("YYYY-MM-DD")}
                </div>
                <div className={classesMerge.tokenSelectInfoValue}>Expiry date</div>
              </div>
            </div>
          )}
        </div>

        <Dialog
          open={open}
          width={782}
          classes={{
            paperScrollPaper: classes.paperScrollPaper,
            paper: classes.paper
          }}
          onClick={(e) => {
            if (e.target.classList.contains('MuiDialog-container')) {
              closeModal();
            }
          }}
        >
          <div className={[classes.dialogContainer, 'g-flex-column'].join(' ')}>
            <DialogTitle className={[classes.dialogTitle, 'g-flex-column__item-fixed'].join(' ')}>
              <div className={classes.dialogTitleRow}>
                <div className={classes.dialogTitleLeft}>Select veREMOTE</div>
                <div className={classes.dialogTitleRight}>
                  <Close
                    style={{
                      fontSize: 12,
                      color: '#CCD2E3',
                      cursor: 'pointer',
                    }}
                    onClick={closeModal}
                  />
                </div>
              </div>
            </DialogTitle>
            <DialogContent
              style={{overflow: 'hidden'}}
              className={[classes.dialogContent, 'g-flex-column__item', 'g-flex-column'].join(' ')}
            >
              <div className={[classes.dialogContentInner, 'g-flex-column__item', 'g-flex-column'].join(' ')}>
                {vestNFTs && renderOptions(vestNFTs, value => {
                  handleChange1(value)
                  closeModal();
                })}

                <div className={classes.descText}>Choose one of the existing NFTs or create a new one.</div>
                <div className={classes.descButton} onClick={onCreate}>Create new NFT</div>
              </div>
            </DialogContent>
          </div>
        </Dialog>
      </div>
    );
  };

  const renderNftSelect2 = () => {
    const [open, setOpen] = useState(false);

    const closeModal = () => setOpen(false);

    const openModal = () => setOpen(true);

    return (
      <div className={classesMerge.selectWrapper}>
        <div className={classesMerge.selectHeader}>
          <span className={classesMerge.selectTitle}>2nd NFT</span>

          {secondSelectedNft != undefined && (
            <div className={classesMerge.tokenSelectInfoAmount}>
              {Number(secondSelectedNft.lockAmount)} veREMOTE
            </div>
          )}
        </div>

        <div onClick={openModal} className={classesMerge.tokenSelect}>
          {secondSelectedNft == undefined ? (
            <div className={classesMerge.tokenSelectLabel}>Select NFT</div>
          ) : (
            <div className={classesMerge.tokenSelectInfo}>
              <div className={classesMerge.tokenSelectInfoCol}>
                <div className={classesMerge.tokenSelectInfoTitle}>{secondSelectedNft.id}</div>
              </div>
              <div className={classesMerge.tokenSelectInfoCol}>
                <div className={classesMerge.tokenSelectInfoTextTitle}>
                  {moment.unix(secondSelectedNft.lockEnds).format("YYYY-MM-DD")}
                </div>
                <div className={classesMerge.tokenSelectInfoValue}>Expiry date</div>
              </div>
            </div>
          )}
        </div>

        <Dialog
          open={open}
          width={782}
          classes={{
            paperScrollPaper: classes.paperScrollPaper,
            paper: classes.paper
          }}
          onClick={(e) => {
            if (e.target.classList.contains('MuiDialog-container')) {
              closeModal();
            }
          }}
        >
          <div className={[classes.dialogContainer, 'g-flex-column'].join(' ')}>
            <DialogTitle className={[classes.dialogTitle, 'g-flex-column__item-fixed'].join(' ')}>
              <div className={classes.dialogTitleRow}>
                <div className={classes.dialogTitleLeft}>Select veREMOTE</div>
                <div className={classes.dialogTitleRight}>
                  <Close
                    style={{
                      fontSize: 12,
                      color: '#CCD2E3',
                      cursor: 'pointer',
                    }}
                    onClick={closeModal}
                  />
                </div>
              </div>
            </DialogTitle>
            <DialogContent
              style={{overflow: 'hidden'}}
              className={[classes.dialogContent, 'g-flex-column__item', 'g-flex-column'].join(' ')}
            >
              <div className={[classes.dialogContentInner, 'g-flex-column__item', 'g-flex-column'].join(' ')}>
                {vestNFTs && renderOptions(vestNFTs, value => {
                  handleChange2(value);
                  closeModal();
                })}

                <div className={classes.descText}>Choose one of the existing NFTs or create a new one.</div>
                <div className={classes.descButton} onClick={onCreate}>Create new NFT</div>
              </div>
            </DialogContent>
          </div>
        </Dialog>
      </div>
    );
  };

  return (
    <>
      <div className={classesLock.tnavWrapper}>
        <div className={classesLock.tnav}>
          <span className={classesLock.tnavItem} onClick={onBack}>Vest</span>
          <span className={classesLock.tnavItemActive}>Merge NFTs</span>
        </div>
      </div>

      <div className={classesLock.formWrapper}>
        <div className={classesLock.title}>
          <span>Merge NFTs</span>
        </div>

        <div className={classesLock.mainBody}>
          <div className={classesMerge.row}>
            <div className={classesMerge.column}>{renderNftSelect1()}</div>

            <div className={classesMerge.column}>{renderNftSelect2()}</div>
          </div>

          {firstSelectedNft !== undefined && secondSelectedNft !== undefined && (
            <div className={classesMerge.result}>
              {firstSelectedNft.lockEnds > secondSelectedNft.lockEnds ? (
                <div className={classesMerge.selectWrapper}>
                  <div className={classesMerge.selectHeader}>
                    <span className={classesMerge.selectTitle}>Result NFT</span> 
                    <div className={classesMerge.tokenSelectInfoAmount}>
                      {(Number(firstSelectedNft.lockAmount) + Number(secondSelectedNft.lockAmount)).toFixed(2)} veREMOTE
                    </div> 
                  </div>

                  <div className={classesMerge.tokenSelect}>
                    <div className={classesMerge.tokenSelectInfo}>
                      <div className={classesMerge.tokenSelectInfoCol}>
                        <div className={classesMerge.tokenSelectInfoTitle}>{secondSelectedNft.id}</div>
                      </div>
                      <div className={classesMerge.tokenSelectInfoCol}>
                        <div className={classesMerge.tokenSelectInfoTextTitle}>
                          {moment.unix(firstSelectedNft.lockEnds).format("YYYY-MM-DD")}
                        </div>
                        <div className={classesMerge.tokenSelectInfoValue}>Expiry date</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={classesMerge.selectWrapper}>
                  <div className={classesMerge.selectHeader}>
                    <span className={classesMerge.selectTitle}>Result NFT</span> 
                    <div className={classesMerge.tokenSelectInfoAmount}>
                      {(Number(firstSelectedNft.lockAmount) + Number(secondSelectedNft.lockAmount)).toFixed(2)} veREMOTE
                    </div> 
                  </div>

                  <div className={classesMerge.tokenSelect}>
                    <div className={classesMerge.tokenSelectInfo}>
                      <div className={classesMerge.tokenSelectInfoCol}>
                        <div className={classesMerge.tokenSelectInfoTitle}>{secondSelectedNft.id}</div>
                      </div>
                      <div className={classesMerge.tokenSelectInfoCol}>
                        <div className={classesMerge.tokenSelectInfoTextTitle}>
                          {moment.unix(secondSelectedNft.lockEnds).format("YYYY-MM-DD")}
                        </div>
                        <div className={classesMerge.tokenSelectInfoValue}>Expiry date</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {firstSelectedNft == undefined || secondSelectedNft == undefined && (
          <div className={classesLock.warningContainer}>
            <img src="/images/ui/info-circle-gray.svg" width="18px" className={classesLock.warningIcon} />
            <p className={classesLock.warningText}>Select 2 NFTs to merge into a single one.</p>
          </div>  
        )}

        {(firstSelectedNft === undefined ||
          secondSelectedNft === undefined ||
          secondSelectedNft.id == firstSelectedNft.id
        ) && (
          <div className={classesLock.warningContainer}>
            <img src="/images/ui/info-circle-gray.svg" width="18px" className={classesLock.warningIcon} />
            <p className={classesLock.warningText}>New NFT will have the the longest expiry date out of 2 NFTs exposed to the merge.</p>
          </div>
        )}

        <div className={classesLock.controls}>
          <div className={classesLock.controlsButtons}>
            {firstSelectedNft === undefined ||
            secondSelectedNft === undefined ||
            secondSelectedNft.id == firstSelectedNft.id ? (
              <Button
                variant="contained"
                size="large"
                color="primary"
                className={[classesLock.button, classesLock.buttonDisabled].join(" ")}
                disabled
              >
                <span>Merge NFT</span>
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                color="primary"
                className={classesLock.button}
                onClick={() => merge(firstSelectedNft, secondSelectedNft)}
              >
                <span>Merge NFT</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default merge;
