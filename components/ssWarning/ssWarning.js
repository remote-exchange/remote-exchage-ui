import { Dialog, Typography } from "@mui/material";
import classes from "./ssWarning.module.css";
import {DAPP_NAME, DAPP_DOMAIN} from "../../stores/constants"

export default function ffWarning({close, title, subTitle, icon, description, btnLabel1, btnLabel2, action2, closePopup}) {
  const navigateToMedium = () => {
    window.open("https://docs.cone.exchange/cone-swap/", "_blank");
  };

  return (
    <Dialog
      fullScreen
      open={true}
      onClose={close}
      onClick={(e) => {
        if (e.target.classList.contains('MuiDialog-container')) {
          close()
        }
      }}
      className={classes.dialogWrapper}
      classes={{
        paper: classes.paperBody,
      }}>
      <div className={classes.dialogContainer}>
        <div className={classes.warningContainer}>
          <div className={classes.header}>
            <Typography className={classes.title1}>
              {title ? title : `${DAPP_NAME} Disclaimer`}
            </Typography>
            <div className={classes.closeBtn} onClick={closePopup}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 13.4142L8.70711 16.7071L7.29289 15.2929L10.5858 12L7.29289 8.70711L8.70711 7.29289L12 10.5858L15.2929 7.29289L16.7071 8.70711L13.4142 12L16.7071 15.2929L15.2929 16.7071L12 13.4142Z" fill="#68727A" fill-opacity="0.4"/>
              </svg>
            </div>
          </div>

          <div className={classes.inner}>
            <Typography className={classes.title2}>
              {subTitle ? subTitle : 'Acknowledgement of Terms & Conditions of access'}
            </Typography>

            <Typography
                className={classes.paragraph}
                align="center">
              {description
                  ? description
                  : <>
                    <p className={classes.paragraph1}>
                      Use of the {DAPP_DOMAIN} website, services, dapp, or application is subject to the following Terms & Conditions and hereby confirm that by proceeding and interacting with the protocoL I am aware of these and accept them in full:
                    </p>
                    <p>{DAPP_DOMAIN} is a smart contract protocol in alpha stage of launch, and even though multiple
                      security audits have been completed on the smart contracts, I understand the risks associated with using the
                      {DAPP_NAME} protocol and associated functions.</p>
                    <p>Any interactions that I have with the associated {DAPP_NAME} protocol apps, smart contracts or any related
                      functions MAY place my funds at risk, and hereby release the {DAPP_NAME} protocol and its contributors,
                      team members, and service providers from any and all liability with my use of the above-mentioned functions.</p>
                    <p>I am lawfully permitted to access this site and use the {DAPP_DOMAIN} application functions, and I
                      am not in contravention of any laws governing my jurisdiction of residence or citizenship.</p>
                  </>
              }
            </Typography>

            <div className={classes.buttonsContainer}>
              <div className={classes.secondaryButton} onClick={close}>
                <Typography className={classes.buttonTextSecondary}>
                  {btnLabel1 ? btnLabel1 : 'I understand the risks involved, proceed to the app'}
                </Typography>
              </div>

              <div className={classes.primaryButton} onClick={action2 ? action2 : navigateToMedium}>
                <Typography
                    className={classes.buttonTextPrimary}>
                  {btnLabel2 ? btnLabel2 : 'Learn more'}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
