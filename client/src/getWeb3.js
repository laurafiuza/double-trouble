import Web3 from "web3";

const chains = {
  // Ethereum Mainnet
  "1": {
    name: "Ethereum",
    currency: "ETH",
    orchestratorAddr: undefined,
  },

  // Polygon mainnet
  "137": {
    name: "Polygon",
    currency: "MATIC",
    orchestratorAddr: undefined,
  },

  // Local Ganache dev
  "1337": {
    name: "Ganache",
    currency: "GNACH",
    orchestratorAddr: process.env.REACT_APP_DTO_ADDR,
  }
}

const _getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
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
  });

const getWeb3 = async () => {
  const web3 = await _getWeb3();
  web3.chainId = await web3.eth.getChainId();
  web3.chain = chains[web3.chainId];
  web3.accounts = await web3.eth.getAccounts();
  web3.defaultAccount = web3.accounts[0];
  return web3;
}

export default getWeb3;
