import { Paper, Typography } from "@mui/material";
import classes from "./vestingInfo.module.css";
import moment from "moment";
import { formatCurrency } from "../../utils";
import BigNumber from "bignumber.js";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import Borders from "../../ui/Borders";

export default function VestingInfo({
  currentNFT,
  futureNFT,
  veToken,
  govToken,
  showVestingStructure,
}) {
  const { appTheme } = useAppThemeContext();

  return (
    <div className={classes.vestInfoContainer}>
      {currentNFT && (
        <div className={classes.vestInfo}>
          <div className={[classes.vestInfoTextWrap, (currentNFT && futureNFT) ? classes.vestInfoWithTag : ""].join(" ")}>
            <div>Voting Power</div>

            <div>
              >{formatCurrency(currentNFT?.lockValue)}{" "}
              <span>{veToken?.symbol}</span>
            </div>

            {currentNFT && futureNFT && (
              <div className={classes.vestInfoTag}>before</div>
            )}
          </div>

          <div className={[classes.vestInfoTextWrap, (currentNFT && futureNFT) ? classes.vestInfoWithTag : ""].join(" ")}>
            <div>Vest Expires</div>
            <div>
              {moment.unix(currentNFT?.lockEnds).fromNow()} until{" "}
              {moment.unix(currentNFT?.lockEnds).format("YYYY/MM/DD")}
            </div>

            {currentNFT && futureNFT && (
              <div className={classes.vestInfoTag}>before</div>
            )}
          </div>
        </div>
      )}
      {futureNFT && (
        <div className={classes.vestInfo}>
          <div className={[classes.vestInfoTextWrap, (currentNFT && futureNFT) ? classes.vestInfoWithTag : ""].join(" ")}>
            <div>Voting Power</div>

            <div>
              {formatCurrency(futureNFT?.lockValue)}{" "}
              <span>{veToken?.symbol}</span>
            </div>

            {currentNFT && futureNFT && (
              <div className={[classes.vestInfoTag, classes.vestInfoTagFuture].join(" ")}>after</div>
            )}
          </div>

          <div className={[classes.vestInfoTextWrap, (currentNFT && futureNFT) ? classes.vestInfoWithTag : ""].join(" ")}>
            <div>Vest Expires</div>
            <div>
              {moment.unix(futureNFT?.lockEnds).fromNow()} until{" "}
              {moment.unix(futureNFT?.lockEnds).format("YYYY/MM/DD")}
            </div>

            {currentNFT && futureNFT && (
              <div className={[classes.vestInfoTag, classes.vestInfoTagFuture].join(" ")}>after</div>
            )}
          </div>
        </div>
      )}

      {showVestingStructure && (
        <div className={classes.seccondSection}>
          <Typography
            className={[classes.info, classes[`info--${appTheme}`]].join(" ")}
            color="textSecondary"
          >
            <img src="/images/ui/info-circle-blue.svg" />
            <span>
              1 {govToken?.symbol} locked for 1 year = 0.25 {veToken?.symbol}, 1{" "}
              {govToken?.symbol} locked for 4 years = 1 {veToken?.symbol}
            </span>
          </Typography>
        </div>
      )}
    </div>
  );
}
