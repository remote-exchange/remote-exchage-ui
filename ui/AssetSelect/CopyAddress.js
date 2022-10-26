import React from "react";
import classes from "./AssetSelect.module.css";
import copy from 'copy-to-clipboard';

export const CopyAddress = (props) => {
  const { value, onClose } = props;

  const copyAddress = () => {
    copy(value?.address);
    onClose();
  };

  return (
    <div className={classes.tokenPopover_button} onClick={copyAddress}>
      Copy token address
    </div>
  );
};
