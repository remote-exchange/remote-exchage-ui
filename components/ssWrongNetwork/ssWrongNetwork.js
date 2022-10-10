import { Dialog, Typography } from "@mui/material";
import classes from "./ssWrongNetwork.module.css";
import {NETWORK_NAME, ETHERSCAN_URL} from "../../stores/constants"

export const WrongNetwork = (props) => {
  const { visible, onClose, onSwitch } = props;

  return (
    <Dialog
      fullScreen
      open={visible}
      onClose={onClose}
      onClick={(e) => {
        if (e.target.classList.contains("MuiDialog-container")) {
          onClose();
        }
      }}
      className={classes.dialogWrapper}
      classes={{
        paper: classes.paperBody,
      }}
    >
      <div className={classes.dialogContainer}>
        <div className={classes.warningContainer}>
          <div
            className={classes.header}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Typography className={classes.title1}>Wrong Network</Typography>
          </div>

          <div className={classes.inner}>
            <Typography className={classes.title2}>
              The chain you are connected is not supported!
            </Typography>

            <Typography className={classes.paragraph}>
              Please check that your wallet is connected to {NETWORK_NAME} Network, only after you can proceed. If you do not have a {NETWORK_NAME} Network in your wallet, you can add it through the footer link on the {ETHERSCAN_URL}.
            </Typography>

            <div className={classes.buttonsContainer}>
              <div className={classes.secondaryButton} onClick={onSwitch}>
                <Typography className={classes.buttonTextSecondary}>
                  Swith to {NETWORK_NAME} Mainnet
                </Typography>
              </div>

              <a className={classes.primaryButton} href={ETHERSCAN_URL} target="_blank" rel="noreferrer">
                <Typography className={classes.buttonTextPrimary}>
                  Redirect to {ETHERSCAN_URL}
                </Typography>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
