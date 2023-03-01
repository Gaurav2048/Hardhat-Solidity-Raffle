require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter");
require("hardhat-contract-sizer")
require("dotenv").config()

const GORELI_RPC_URL = process.env.GORELI_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COIN_MARKET_CAP_API_KEY= process.env.COIN_MARKET_CAP_API_KEY;
const ETHERSCAN_API = process.env.ETHERSCAN_API;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1
    },
    goerli: {
      chainId: 5,
      blockConfirmations: 6,
      url: GORELI_RPC_URL,
      accounts: [PRIVATE_KEY]
    }
  },
  solidity: {
    compilers: [
      { version: "0.8.7" },
      { version: "0.8.4" }
    ]
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    }
  }
};
