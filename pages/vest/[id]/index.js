import React, { useState, useEffect, useCallback } from 'react';
import Vesting from '../../../components/ssVest';
import stores from '../../../stores';
import {ACTIONS, DAPP_NAME} from '../../../stores/constants';
import { NotConnect } from "../../../components/notConnect/index";

function Vest() {
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [ govToken, setGovToken] = useState(null)
  const [ veToken, setVeToken] = useState(null)

  useEffect(() => {
    const forexUpdated = () => {
      setGovToken(stores.stableSwapStore.getStore('govToken'))
      setVeToken(stores.stableSwapStore.getStore('veToken'))
      forceUpdate()
    }

    setGovToken(stores.stableSwapStore.getStore('govToken'))
    setVeToken(stores.stableSwapStore.getStore('veToken'))

    stores.emitter.on(ACTIONS.UPDATED, forexUpdated);

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, forexUpdated);
    };
  }, []);

  return (
    <NotConnect
      title="Vest"
      description={`Swap between ${DAPP_NAME} supported stable and volatile assets.`}
      buttonText="LAUNCH APP"
    >
      <Vesting />
    </NotConnect>
  );
}

export default Vest;
