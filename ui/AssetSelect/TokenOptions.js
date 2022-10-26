import React, { useState } from "react";
import classes from "./AssetSelect.module.css";
import { AddToken } from "./AddToken";
import { CopyAddress } from "./CopyAddress";
import {Dialog, DialogContent, DialogTitle, Popover, Slide, TextField, Tooltip, Typography} from "@mui/material";

const Transition = React.forwardRef((props, ref) => (
    <Slide direction="up" {...props} ref={ref} />
));

export const TokenOptions = (props) => {
  const { value, anchorEl, handleClosePopover, handleOpenPopover } = props;

  const visible = Boolean(anchorEl);

  return (
    <>
      <div
        className={classes.dotsSelectMenu}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleOpenPopover(e);
        }}
      >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10.5" y="10.5" width="3" height="3" rx="1.5" fill="#353A42"/>
              <rect x="4.5" y="10.5" width="3" height="3" rx="1.5" fill="#353A42"/>
              <rect x="16.5" y="10.5" width="3" height="3" rx="1.5" fill="#353A42"/>
          </svg>
      </div>
        <Dialog
            className={classes.dialogScale}
            classes={{
                root: classes.rootPaper,
                scrollPaper: classes.topScrollPaper,
                paper: classes.paperBody,
            }}
            open={visible}
            onClose={handleClosePopover}
            onClick={(e) => {
                if (e.target.classList.contains('MuiDialog-container')) {
                    handleClosePopover()
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
                            Token Actions
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
                            onClick={handleClosePopover}
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
                    <div className={classes.dialogInner}>
                        <div className={classes.dialogTokenRow}>
                            <img
                                className={[classes.displayAssetIcon,].join(' ')}
                                alt=""
                                src={value ? `${value.logoURI}` : ''}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `/tokens/unknown-logo--dark.svg`;
                                }}
                            />
                            <div>{value?.symbol}</div>
                        </div>
                        <CopyAddress value={value} onClose={handleClosePopover} />
                        <AddToken value={value} onClose={handleClosePopover} />
                    </div>
                </DialogContent>
            </div>
        </Dialog>
    </>
  );
};
