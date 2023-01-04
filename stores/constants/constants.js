import BigNumber from 'bignumber.js'
import * as contracts from './contracts'
import * as actions from './actions'
import * as queries from './graph-queries'

export const NETWORK_NAME = "Goerli"
export const DAPP_NAME = "Remote"
export const DAPP_DOMAIN = "remote.exchange"

// URLS
let scan = 'https://goerli.etherscan.io/'
let cont = contracts

export const ETHERSCAN_URL = scan

export const CONTRACTS = cont
export const ACTIONS = actions
export const QUERIES = queries

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0)
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const REMOTE_ADDRESS = CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase();
export const WBNB_ADDRESS = CONTRACTS.WFTM_ADDRESS.toLowerCase();
export const NETWORK_TOKEN_NAME = CONTRACTS.FTM_SYMBOL;

export const RENAME_ASSETS = {
  // "miMATIC": "MAI"
}

export const BLACK_LIST_TOKENS = []

export const TAXABLE_TOKENS = [
  // '0xB58c8c06D18987209a38cB75c04eD80C23D07F10'.toLowerCase(), //  Kamikaze (KZE)
  // '0x7DF1938170869AFE410098540c051A8A50308988'.toLowerCase(), //  USDFI
  // '0x9f8BB16f49393eeA4331A39B69071759e54e16ea'.toLowerCase(), //  MDB+
  // '0x0C347A3e3c5438b603064BC9AB84Adad4E165Faf'.toLowerCase(),
]

export const BASE_ASSETS_WHITELIST = [
  {
    id: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
    address: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
    chainId: "5",
    symbol: "USDC",
    logoURI: "https://tokens.pancakeswap.finance/images/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d.png"
  },
  {
    id: CONTRACTS.WFTM_ADDRESS,
    address: CONTRACTS.WFTM_ADDRESS,
    chainId: "5",
    symbol: CONTRACTS.WFTM_SYMBOL,
    logoURI: "https://tokens.pancakeswap.finance/images/0x2170Ed0880ac9A755fd29B2688956BD959F933F8.png"
  },
  {
    id: "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60",
    address: "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60",
    chainId: "5",
    symbol: "DAI",
    logoURI: "https://tokens.pancakeswap.finance/images/0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3.png"
  },
  {
    id: "0x3f56e0c36d275367b8c502090edf38289b3dea0d",
    address: "0x3f56e0c36d275367b8c502090edf38289b3dea0d",
    chainId: "56",
    symbol: "MAI",
    logoURI: "https://assets.coingecko.com/coins/images/15264/small/mimatic-red.png"
  },
  {
    id: "0x55d398326f99059ff775485246999027b3197955",
    address: "0x55d398326f99059ff775485246999027b3197955",
    chainId: "56",
    symbol: "USDT",
    logoURI: "https://tokens.pancakeswap.finance/images/0x55d398326f99059fF775485246999027B3197955.png"
  },
  {
    id: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    chainId: "56",
    symbol: "WBNB",
    logoURI: "https://tokens.pancakeswap.finance/images/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c.png"
  },
  {
    id: "0x90c97f71e18723b0cf0dfa30ee176ab653e89f40",
    address: "0x90c97f71e18723b0cf0dfa30ee176ab653e89f40",
    chainId: "56",
    symbol: "FRAX",
  },
  {
    id: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    chainId: "56",
    symbol: "BUSD",
    logoURI: "https://tokens.pancakeswap.finance/images/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56.png"
  },
  {
    id: REMOTE_ADDRESS,
    address: REMOTE_ADDRESS,
    chainId: "5",
    symbol: CONTRACTS.GOV_TOKEN_SYMBOL,
    logoURI: "https://icons.llama.fi/remote.png"
  },
];

const ROUTE_ASSETS_SYMBOLS = [
  "USDC",
  CONTRACTS.WFTM_SYMBOL,
  CONTRACTS.GOV_TOKEN_SYMBOL,
];

export const ROUTE_ASSETS = BASE_ASSETS_WHITELIST.filter(x => ROUTE_ASSETS_SYMBOLS.includes(x.symbol));

export const DEFAULT_ASSET_FROM = CONTRACTS.FTM_SYMBOL
export const DEFAULT_ASSET_TO = REMOTE_ADDRESS
