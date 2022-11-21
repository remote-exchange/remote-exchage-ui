import React, { useState, useEffect } from "react";
import {  DialogContent, Dialog, Slide,  DialogTitle } from "@mui/material";

import Transaction from './transaction';

const Transition = React.forwardRef((props, ref) => (
    <Slide direction="up" {...props} ref={ref} />
));

import classes from './transactionQueue.module.css';
import stores from '../../stores';
import { ACTIONS, ETHERSCAN_URL } from '../../stores/constants';

export default function TransactionQueue({setQueueLength}) {

  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const handleClose = () => {
    setOpen(false);
  };

  const fullScreen = window.innerWidth < 576;

  useEffect(() => {
    const clearTransactions = () => {
      setTransactions([]);
      setQueueLength(0);
    };

    const openQueue = () => {
      setOpen(true);
    };

    const transactionAdded = (params) => {
      setOpen(true);
      const txs = [...params.transactions];
      setTransactions(txs);

      setQueueLength(params.transactions.length);
    };

    const transactionPending = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'PENDING';
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionSubmitted = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'SUBMITTED';
          tx.txHash = params.txHash;
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionConfirmed = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'CONFIRMED';
          tx.txHash = params.txHash;
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionRejected = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'REJECTED';
          tx.description = params.description ? params.description : tx.description;
          tx.error = params.error;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionStatus = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = params.status ? params.status : tx.status;
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    stores.emitter.on(ACTIONS.CLEAR_TRANSACTION_QUEUE, clearTransactions);
    stores.emitter.on(ACTIONS.TX_ADDED, transactionAdded);
    stores.emitter.on(ACTIONS.TX_PENDING, transactionPending);
    stores.emitter.on(ACTIONS.TX_SUBMITTED, transactionSubmitted);
    stores.emitter.on(ACTIONS.TX_CONFIRMED, transactionConfirmed);
    stores.emitter.on(ACTIONS.TX_REJECTED, transactionRejected);
    stores.emitter.on(ACTIONS.TX_STATUS, transactionStatus);
    stores.emitter.on(ACTIONS.TX_OPEN, openQueue);

    return () => {
      stores.emitter.removeListener(ACTIONS.CLEAR_TRANSACTION_QUEUE, clearTransactions);
      stores.emitter.removeListener(ACTIONS.TX_ADDED, transactionAdded);
      stores.emitter.removeListener(ACTIONS.TX_PENDING, transactionPending);
      stores.emitter.removeListener(ACTIONS.TX_SUBMITTED, transactionSubmitted);
      stores.emitter.removeListener(ACTIONS.TX_CONFIRMED, transactionConfirmed);
      stores.emitter.removeListener(ACTIONS.TX_REJECTED, transactionRejected);
      stores.emitter.removeListener(ACTIONS.TX_STATUS, transactionStatus);
      stores.emitter.removeListener(ACTIONS.TX_OPEN, openQueue);
    };
  }, [transactions]);

  const renderDone = (txs) => {
    if (!(transactions && transactions.filter((tx) => {
      return ['DONE', 'CONFIRMED'].includes(tx.status);
    })
      .map(it => ({...it, description: it.status === 'DONE' ? 'Transaction has been confirmed by the blockchain' : it.default}))
      .length === transactions.length)) {
      return null;
    }

    return (
      <div className={classes.transactionsContainer}>
        {
          transactions && transactions.map((tx) => {
            return <Transaction transaction={tx}/>;
          })
        }
      </div>
    );
  };

  const renderTransactions = (transactions) => {
    if ((transactions && transactions.filter((tx) => {
      return ['DONE', 'CONFIRMED'].includes(tx.status);
    }).length === transactions.length)) {
      return null;
    }

    return (
      <>
        <div className={classes.transactionsContainer}>
          {
            transactions && transactions.map((tx, idx) => {
              return <Transaction transaction={tx}/>;
            })
          }
        </div>
      </>
    );
  };

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
          handleClose();
        }
      }}
      fullWidth={true}
      maxWidth={"sm"}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
      BackdropProps={{style: {backgroundColor: 'transparent'}}}
    >
      <div className={classes.tvAntenna}>
        <svg width="40" height="28" viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_116_23979)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M53.7324 1.53632C51.8193 0.431753 49.3729 1.08725 48.2683 3.00042C47.4709 4.38158 47.5908 6.04061 48.4389 7.27208L33.2833 22.4277C31.9114 21.3226 30.1671 20.6611 28.2683 20.6611C26.2328 20.6611 24.3748 21.4213 22.9629 22.6733L7.56181 7.27224C8.40988 6.04078 8.52973 4.38181 7.73235 3.00071C6.62778 1.08754 4.18142 0.432036 2.26825 1.53661C0.355076 2.64117 -0.300425 5.08754 0.804144 7.00071C1.86628 8.84038 4.16909 9.51716 6.04549 8.58435L21.6406 24.1794C20.7743 25.4579 20.2683 27.0004 20.2683 28.6611H36.2683C36.2683 26.8626 35.6748 25.2026 34.6729 23.8665L49.9553 8.58413C51.8317 9.51684 54.1344 8.84005 55.1965 7.00042C56.3011 5.08725 55.6456 2.64089 53.7324 1.53632Z" fill="#EAE8E1"/>
          </g>
          <defs>
            <clipPath id="clip0_116_23979">
              <rect width="40" height="28" fill="white"/>
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
              Transaction History
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
            {renderTransactions(transactions)}
            {renderDone(transactions)}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
