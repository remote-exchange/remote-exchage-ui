import {ACTIONS, CONTRACTS} from './constants';
import Multicall from '@dopex-io/web3-multicall';
import detectProvider from '@metamask/detect-provider'
import stores from '../stores'

import Web3 from 'web3';

class Store {

  subscribed = false;

  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      account: null,
      chainInvalid: false,
      web3provider: null,
      web3modal: null,
      web3context: null,
      tokens: [],
      gasPrices: {
        standard: 90,
        fast: 100,
        instant: 130,
      },
      gasSpeed: 'fast',
      currentBlock: 12906197,
      chainId: null,
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case ACTIONS.CONFIGURE:
            this.configure(payload);
            break;
          default: {
          }
        }
      }.bind(this),
    );
  }

  getStore(index) {
    return this.store[index];
  }

  setStore(obj) {
    this.store = {...this.store, ...obj};
    return this.emitter.emit(ACTIONS.STORE_UPDATED);
  }

  configure = async () => {
    await this.getGasPrices();

    this.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
    window.removeEventListener('ethereum#initialized', this.subscribeProvider);
    window.addEventListener('ethereum#initialized', this.subscribeProvider, {
      once: true,
    });
  }

  subscribeProvider = () => {
    const that = this;
    if(that.subscribed) {
      return
    } else {
      that.subscribed = true;
    }

    // remove all previous listeners, in dev mode can be subscribed multiple time
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');

    window.ethereum.on('accountsChanged', async function (accounts) {
      let existAccount = that.getStore('account');
      const account = accounts[0]

      if (existAccount?.toLowerCase() !== account?.toLowerCase()) {
        that.setStore({account: account,});
        that.dispatcher.dispatch({type: ACTIONS.CONFIGURE_SS,})
        that.emitter.emit(ACTIONS.ACCOUNT_CHANGED);
        that.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
        // setTimeout(() => that.dispatcher.dispatch({type: ACTIONS.CONFIGURE_SS,}), 1000)
      }
    });

    window.ethereum.on('chainChanged', async function (chainId) {
      const supportedChainIds = [process.env.NEXT_PUBLIC_CHAINID];
      const parsedChainId = (parseInt(chainId + '', 16) + '');
      const isChainSupported = supportedChainIds.includes(parsedChainId);
      that.setStore({chainInvalid: !isChainSupported, chainId: parsedChainId});
      that.dispatcher.dispatch({type: ACTIONS.CONFIGURE_SS,});
      that.emitter.emit(ACTIONS.ACCOUNT_CHANGED);
      that.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
      await that.configure()
    });
  };

  getGasPrices = async () => {
    const gasPrices = await this._getGasPrices();
    let gasSpeed = localStorage.getItem('remote.finance-gas-speed');

    if (!gasSpeed) {
      gasSpeed = 'fast';
      localStorage.getItem('remote.finance-gas-speed', 'fast');
    }

    this.setStore({gasPrices: gasPrices, gasSpeed: gasSpeed});
  };

  _getGasPrices = async () => {
    try {
      const web3 = await this.getWeb3Provider();
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceInGwei = web3.utils.fromWei(gasPrice, "gwei");
      return {
        standard: gasPriceInGwei,
        fast: gasPriceInGwei,
        instant: gasPriceInGwei,
      };
    } catch (e) {
      console.log(e);
      return {}
    }
  };

  getGasPrice = async () => {
    try {
      const web3 = await this.getWeb3Provider();
      const gasPrice = await web3.eth.getGasPrice();
      return web3.utils.fromWei(gasPrice, "gwei");
    } catch (e) {
      console.log(e);
      return {};
    }
  };

  isWeb3ProviderExist = async () => {
    const hasEthereum = !!window?.ethereum;
    const hasProvider = await detectProvider();
    return hasEthereum || hasProvider;
  }

  getWeb3Provider = async () => {
    let web3provider = this.getStore('web3provider');

    if (web3provider === null) {
      return new Web3(window.ethereum || await detectProvider())
    }

    return web3provider;
  };

  getMulticall = async () => {
    const web3 = await this.getWeb3Provider()
    return new Multicall({
      multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
      provider: web3,
    })
  };
}

export default Store;
