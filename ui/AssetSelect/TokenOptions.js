import React, { useState } from "react";
import classes from "./AssetSelect.module.css";
import { AddToken } from "./AddToken";
import { CopyAddress } from "./CopyAddress";
import { Popover } from "@mui/material";

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
      <Popover
        open={visible}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        classes={{
          paper: classes.tokenPopover_root,
        }}
      >
        <div className={classes.tokenPopover}>
          <CopyAddress value={value} onClose={handleClosePopover} />
          <AddToken value={value} onClose={handleClosePopover} />
        </div>
      </Popover>
    </>
  );
};
