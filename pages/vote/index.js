import React from 'react';
import Gauges from '../../components/ssVotes';
import { NotConnect } from "../../components/notConnect/index";

function Vote() {
  return (
    <NotConnect
      title="Vote"
      description="Use your veREMOTE to vote for your selected liquidity pair's rewards distribution or create a bribe to encourage others to do the same."
      buttonText="Launch App"
    >
      <Gauges />
    </NotConnect>
  )
}

export default Vote;
