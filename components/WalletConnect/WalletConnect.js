import React, {useEffect} from 'react'
import Web3Modal from 'web3modal'
import CoinbaseWalletSDK from '@coinbase/wallet-sdk'
import WalletConnectProvider from '@walletconnect/web3-provider'
import stores from '../../stores'
import Web3 from 'web3'
import {ACTIONS, DAPP_NAME} from '../../stores/constants'
import {ethers} from 'ethers'

const {CONNECTION_CONNECTED,} = ACTIONS;

export const WalletConnect = (props) => {
  useEffect(() => {
    if (window.localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER')) {
      connect()
    }
  }, [])

  return props.children({connect})
}

async function connect() {
  const web3modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      walletlink: {
        package: CoinbaseWalletSDK,
        options: {
          appName: `${DAPP_NAME} app`,
          infuraId: `${process.env.NEXT_PUBLIC_INFURA_KEY}`,
          rpc: {
            5: `https://rpc.ankr.com/eth_goerli`,
          },
          supportedChainIds: [5],
        },
      },
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: `${process.env.NEXT_PUBLIC_INFURA_KEY}`,
          rpc: {
            5: `https://rpc.ankr.com/eth_goerli`,
          },
          supportedChainIds: [5],
        },
      },
    },
  })


  const instance = await web3modal.connect()
    .catch((err) => {
      console.log('ERR:', err)
    })

  if (instance === undefined) {
    return
  }

  const provider = new ethers.providers.Web3Provider(instance)

  const signer = provider.getSigner()
  const address = await signer.getAddress()

  if (!provider) {
    return
  }

  const web3 = new Web3(instance);
  stores.accountStore.subscribeProvider();

  const chainId = await web3.eth.getChainId()

  const supportedChainIds = [process.env.NEXT_PUBLIC_CHAINID];
  const isChainSupported = supportedChainIds.includes(String(chainId));
  stores.accountStore.setStore({chainInvalid: !isChainSupported});
  stores.accountStore.setStore({
    account: address,
    web3provider: web3,
    web3modal,
    web3context: {
      library: {
        provider: web3,
        instance,
      }
    },
  });

  updateGeneralStore();
  stores.emitter.emit(CONNECTION_CONNECTED);
  stores.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);

  return {web3provider: web3, address}
}

function updateGeneralStore() {
  stores.dispatcher.dispatch({
    type: ACTIONS.CONFIGURE_SS,
    content: {connected: true},
  });
}
