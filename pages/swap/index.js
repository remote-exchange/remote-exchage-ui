import React from "react";
import SwapComponent from "../../components/ssSwap";
import { NotConnect } from "../../components/notConnect/index";
import {DAPP_NAME} from "../../stores/constants";

function Swap() {
  return (
    <NotConnect
      title="Swap"
      description={`Swap between ${DAPP_NAME} supported stable and volatile assets.`}
      buttonText="LAUNCH APP"
    >
      <SwapComponent />
    </NotConnect>
  )
}

export default Swap;
