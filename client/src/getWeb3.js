import Web3 from "web3";

const chains = {
  "1": {
    name: "Ethereum",
    currency: "ETH",
    orchestratorAddr: "0x3Ad40c13b138E8bb11700e4562B71a9860a0FE78",
  },
  "4": {
    name: "Rinkeby Testnet",
    currency: "RIN",
    orchestratorAddr: "0xf3C55eB3774749484D36e975D8085Ebe99Aa1819",
  },
  "5": {
    name: "Goerli Testnet",
    currency: "GOR",
    orchestratorAddr: undefined,
  },
  "137": {
    name: "Polygon",
    currency: "MATIC",
    orchestratorAddr: "0xe54b08AbD99BB294d81836e99D7Ce1497F04b219",
  },
  "8001": {
    name: "Polygon Mumbai",
    currency: "tMATIC",
    orchestratorAddr: undefined,
  },
  "1337": {
    name: "Ganache",
    currency: "GNACH",
    orchestratorAddr: process.env.REACT_APP_DTO_ADDR,
  }
}

const _getWeb3 = () =>
  new Promise(async (resolve, reject) => {
    // Modern dapp browsers...
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.enable();
        // Accounts now exposed
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      // Use Mist/MetaMask's provider.
      const web3 = window.web3;
      console.log("Injected web3 detected.");
      resolve(web3);
    }
    // Fallback to localhost; use dev console port by default...
    else {
      const provider = new Web3.providers.HttpProvider(
        "http://127.0.0.1:8545"
      );
      const web3 = new Web3(provider);
      console.log("No web3 instance injected, using Local web3.");
      resolve(web3);
    }
  });

let loadedWeb3 = undefined;
const getWeb3 = async () => {
  if (loadedWeb3 === undefined) {
    loadedWeb3 = await _getWeb3();
  }
  loadedWeb3.chainId = await loadedWeb3.eth.getChainId();
  loadedWeb3.chain = chains[loadedWeb3.chainId];
  loadedWeb3.accounts = await loadedWeb3.eth.getAccounts();
  loadedWeb3.defaultAccount = loadedWeb3.accounts[0];
  return loadedWeb3;
}

export default getWeb3;
