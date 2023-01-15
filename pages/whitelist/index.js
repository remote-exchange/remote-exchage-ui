import React from "react";
import WhitelistTokens from "../../components/ssWhitelist";
import { NotConnect } from "../../components/notConnect/index";

function Vesting() {
  return (
    <NotConnect
      title="Whitelist"
      description="Whitelist tokens to be used in Remote Gauges."
      buttonText="Launch App"
    >
      <WhitelistTokens />
    </NotConnect>
  );
}

export default Vesting;
