import React, { Component, useState, useEffect } from "react";
import { Typography, Button, CircularProgress, Tooltip } from "@mui/material";
import classes from "./transactionQueue.module.css";

import { ACTIONS, ETHERSCAN_URL } from "../../stores/constants";
import { formatAddress } from "../../utils";
import {
  HourglassEmpty,
  HourglassFull,
  CheckCircle,
  Error,
  Pause,
} from "@mui/icons-material";
import { useAppThemeContext } from "../../ui/AppThemeProvider";

export default function Transaction({ transaction }) {
  const [expanded, setExpanded] = useState(false);
  const { appTheme } = useAppThemeContext();

  const successIcon = () => {
    return (
      <svg
        width="30"
        height="31"
        viewBox="0 0 30 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15 28C8.09625 28 2.5 22.4037 2.5 15.5C2.5 8.59625 8.09625 3 15 3C21.9037 3 27.5 8.59625 27.5 15.5C27.5 22.4037 21.9037 28 15 28ZM13.7537 20.5L22.5912 11.6613L20.8237 9.89375L13.7537 16.965L10.2175 13.4288L8.45 15.1962L13.7537 20.5Z"
          fill="#15B525"
        />
      </svg>
    );
  };

  const mapStatusToIcon = (status) => {
    switch (status) {
      case "WAITING":
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM12.078 2.73557C12 2.80952 12 2.92857 12 3.16667V11.7113C12 11.8522 12 11.9227 11.9665 11.9807C11.933 12.0387 11.872 12.0739 11.75 12.1443L4.35011 16.4167C4.14391 16.5357 4.04081 16.5952 4.01578 16.6998C3.99075 16.8043 4.05336 16.9005 4.17858 17.0928C4.97889 18.3219 6.05907 19.3472 7.33333 20.0829C8.75218 20.9021 10.3617 21.3333 12 21.3333C13.6383 21.3333 15.2478 20.9021 16.6667 20.0829C18.0855 19.2637 19.2637 18.0855 20.0829 16.6667C20.9021 15.2478 21.3333 13.6383 21.3333 12C21.3333 10.3617 20.9021 8.75218 20.0829 7.33333C19.2637 5.91449 18.0855 4.73627 16.6667 3.9171C15.3924 3.1814 13.9644 2.75859 12.4998 2.68006C12.2706 2.66777 12.156 2.66162 12.078 2.73557Z" fill="#EB9617"/>
            </svg>
        );
      case "PENDING":
        return (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 8C15 8.55228 15.4477 9 16 9C16.5523 9 17 8.55228 17 8L15 8ZM17 4C17 3.44772 16.5523 3 16 3C15.4477 3 15 3.44772 15 4L17 4ZM17 8L17 4L15 4L15 8L17 8Z" fill="#B1F1E3"/>
                <path d="M15 28C15 28.5523 15.4477 29 16 29C16.5523 29 17 28.5523 17 28L15 28ZM17 25.3333C17 24.781 16.5523 24.3333 16 24.3333C15.4477 24.3333 15 24.781 15 25.3333L17 25.3333ZM17 28L17 25.3333L15 25.3333L15 28L17 28Z" fill="#B1F1E3"/>
                <path d="M25.333 15C24.7807 15 24.333 15.4477 24.333 16C24.333 16.5523 24.7807 17 25.333 17L25.333 15ZM27.9997 17C28.552 17 28.9997 16.5523 28.9997 16C28.9997 15.4477 28.552 15 27.9997 15L27.9997 17ZM25.333 17L27.9997 17L27.9997 15L25.333 15L25.333 17Z" fill="#B1F1E3"/>
                <path d="M4 15C3.44772 15 3 15.4477 3 16C3 16.5523 3.44772 17 4 17L4 15ZM8 17C8.55228 17 9 16.5523 9 16C9 15.4477 8.55228 15 8 15L8 17ZM4 17L8 17L8 15L4 15L4 17Z" fill="#B1F1E3"/>
                <path d="M22.8359 7.75041C22.4453 8.14094 22.4453 8.7741 22.8359 9.16463C23.2264 9.55515 23.8596 9.55515 24.2501 9.16463L22.8359 7.75041ZM25.1929 8.22182C25.5834 7.83129 25.5834 7.19813 25.1929 6.8076C24.8024 6.41708 24.1692 6.41708 23.7787 6.8076L25.1929 8.22182ZM24.2501 9.16463L25.1929 8.22182L23.7787 6.8076L22.8359 7.75041L24.2501 9.16463Z" fill="#B1F1E3"/>
                <path d="M6.80754 23.7782C6.41702 24.1688 6.41702 24.8019 6.80754 25.1925C7.19807 25.583 7.83123 25.583 8.22176 25.1925L6.80754 23.7782ZM10.1074 23.3068C10.4979 22.9163 10.4979 22.2832 10.1074 21.8926C9.71685 21.5021 9.08368 21.5021 8.69316 21.8926L10.1074 23.3068ZM8.22176 25.1925L10.1074 23.3068L8.69316 21.8926L6.80754 23.7782L8.22176 25.1925Z" fill="#B1F1E3"/>
                <path d="M23.3067 21.8927C22.9162 21.5022 22.283 21.5022 21.8925 21.8927C21.502 22.2833 21.502 22.9164 21.8925 23.307L23.3067 21.8927ZM23.7781 25.1926C24.1686 25.5831 24.8018 25.5831 25.1923 25.1926C25.5829 24.8021 25.5829 24.1689 25.1923 23.7784L23.7781 25.1926ZM21.8925 23.307L23.7781 25.1926L25.1923 23.7784L23.3067 21.8927L21.8925 23.307Z" fill="#B1F1E3"/>
                <path d="M8.22176 6.80779C7.83123 6.41726 7.19807 6.41726 6.80754 6.80779C6.41702 7.19831 6.41702 7.83147 6.80754 8.222L8.22176 6.80779ZM9.63597 11.0504C10.0265 11.441 10.6597 11.441 11.0502 11.0504C11.4407 10.6599 11.4407 10.0267 11.0502 9.63621L9.63597 11.0504ZM6.80754 8.222L9.63597 11.0504L11.0502 9.63621L8.22176 6.80779L6.80754 8.222Z" fill="#B1F1E3"/>
            </svg>
        );
      case "SUBMITTED":
        return (
          <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M31.882 28.7283L24.4754 22H19.507L12.1004 28.7283C10.0287 30.5983 9.35037 33.4767 10.3587 36.08C11.367 38.665 13.8237 40.3333 16.592 40.3333H27.3904C30.177 40.3333 32.6154 38.665 33.6237 36.08C34.632 33.4767 33.9537 30.5983 31.882 28.7283ZM25.337 33.2567H18.6637C17.967 33.2567 17.417 32.6883 17.417 32.01C17.417 31.3317 17.9854 30.7633 18.6637 30.7633H25.337C26.0337 30.7633 26.5837 31.3317 26.5837 32.01C26.5837 32.6883 26.0154 33.2567 25.337 33.2567Z" fill="#FDBF21"/>
            <path d="M33.6416 7.92008C32.6332 5.33508 30.1766 3.66675 27.4082 3.66675H16.5916C13.8232 3.66675 11.3666 5.33508 10.3582 7.92008C9.36822 10.5234 10.0466 13.4017 12.1182 15.2717L19.5249 22.0001H24.4932L31.8999 15.2717C33.9532 13.4017 34.6316 10.5234 33.6416 7.92008ZM25.3366 13.2551H18.6632C17.9666 13.2551 17.4166 12.6867 17.4166 12.0084C17.4166 11.3301 17.9849 10.7617 18.6632 10.7617H25.3366C26.0332 10.7617 26.5832 11.3301 26.5832 12.0084C26.5832 12.6867 26.0149 13.2551 25.3366 13.2551Z" fill="#FDBF21"/>
          </svg>
        );
      case "CONFIRMED":
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM11.4349 16.6402L18.1016 8.64018L16.5651 7.35982L10.5995 14.5186L7.37377 11.2929L5.95956 12.7071L9.95956 16.7071L10.7339 17.4814L11.4349 16.6402Z" fill="#459B0E"/>
            </svg>
        );
      case "REJECTED":
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM17.6064 16.1922C18.4816 15.0236 19 13.5723 19 12C19 8.13401 15.866 5 12 5C10.4277 5 8.97641 5.5184 7.80783 6.39362L17.6064 16.1922ZM6.39362 7.80783L16.1922 17.6064C15.0236 18.4816 13.5723 19 12 19C8.13401 19 5 15.866 5 12C5 10.4277 5.5184 8.97641 6.39362 7.80783ZM12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" fill="#9B0E0E"/>
            </svg>
        );
      case "DONE":
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM11.4349 16.6402L18.1016 8.64018L16.5651 7.35982L10.5995 14.5186L7.37377 11.2929L5.95956 12.7071L9.95956 16.7071L10.7339 17.4814L11.4349 16.6402Z" fill="#459B0E"/>
            </svg>
        );
      default:
    }
  };

  const mapStatusToTootip = (status) => {
    switch (status) {
      case "WAITING":
        return "Transaction will be submitted once ready";
      case "PENDING":
        return "Transaction is pending your approval in your wallet";
      case "SUBMITTED":
        return "Transaction has been submitted to the blockchain and we are waiting on confirmation.";
      case "CONFIRMED":
        return "Transaction has been confirmed by the blockchain.";
      case "REJECTED":
        return "Transaction has been rejected.";
      default:
        return "";
    }
  };

  const onExpendTransaction = () => {
    setExpanded(!expanded);
  };

  const onViewTX = () => {
    window.open(`${ETHERSCAN_URL}tx/${transaction.txHash}`, "_blank");
  };

  return (
    <div className={classes.transaction} key={transaction.uuid}>
      <div
        className={[
          classes.transactionInfo,
          classes[`transactionInfo--${transaction.status}`],
        ].join(" ")}
        style={{
          display: "flex",
          padding: 12,
        }}
      >
        <div
          style={{
            marginRight: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
            }}
          >
            {mapStatusToIcon(transaction.status)}
          </div>
        </div>

        <div
          style={{
            width: "100%",
          }}
        >
          <Typography
            className={[
              classes.transactionDescriptionTitle,
              classes[`transactionDescriptionTitle--${transaction.status}`],
            ].join(" ")}
          >
            {transaction.description}
          </Typography>

          {['WAITING', 'PENDING', 'SUBMITTED'].includes(transaction.status) && (
            <div
              className={[
                classes.transactionStatusText,
                classes[`transactionStatusText--${transaction.status}`],
              ].join(" ")}
            >
              {transaction.status}...
            </div>
          )}
          

          {transaction.txHash && (
            <div className={classes.transactionHashWrapper}>
              <div className={classes.transactionHash}>
                <Typography className={classes.transactionDescription}>
                  {formatAddress(transaction.txHash, "long")}
                </Typography>
              </div>

              <div
                style={{
                    position: 'absolute',
                    right: 6,
                    bottom: 6,
                }}
                onClick={onViewTX}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 3V2H21V3H20ZM10.7071 13.7071C10.3166 14.0976 9.68342 14.0976 9.29289 13.7071C8.90237 13.3166 8.90237 12.6834 9.29289 12.2929L10.7071 13.7071ZM19 11V3H21V11H19ZM20 4H12V2H20V4ZM20.7071 3.70711L10.7071 13.7071L9.29289 12.2929L19.2929 2.29289L20.7071 3.70711Z" fill="#9A9FAF"/>
                      <path d="M19 15V15C19 16.8692 19 17.8038 18.5981 18.5C18.3348 18.9561 17.9561 19.3348 17.5 19.5981C16.8038 20 15.8692 20 14 20H9C6.17157 20 4.75736 20 3.87868 19.1213C3 18.2426 3 16.8284 3 14V9C3 7.13077 3 6.19615 3.40192 5.5C3.66523 5.04394 4.04394 4.66523 4.5 4.40192C5.19615 4 6.13077 4 8 4V4" stroke="#9A9FAF" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  {/* View in Explorer */}
              </div>
            </div>
          )}

          {transaction.error && (
            <Typography className={classes.transactionDescription}>
              {transaction.error}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}
