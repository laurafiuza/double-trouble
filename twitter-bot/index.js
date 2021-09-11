const axios = require("axios");
// TODO: make this an env
const API_KEY = "6W18NCGSHI5UHF4DVNVGYNG3HKCS2ISJUS";
const DTO_ADDR = "0x43dEcC964C9c125d335dcC920E1AF273eaF14fE0";
const URL = `https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address=${DTO_ADDR}&apikey=${API_KEY}`;
let lastTimeStamp = 0;
const WSS_INFURA_ENDPOINT = 'wss://rinkeby.infura.io/ws/v3/f5567dc7dce94cafa9a70591118a25f1';
const HTTPS_INFURA_ENDPOINT = 'https://rinkeby.infura.io/v3/f5567dc7dce94cafa9a70591118a25f1';
const Web3 = require('web3');
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(WSS_INFURA_ENDPOINT)
);
const DoubleTroubleOrchestratorContract = require("./contracts/DoubleTroubleOrchestrator.json");
const orchestratorContractInstance = new web3.eth.Contract(
  DoubleTroubleOrchestratorContract.abi,
  DTO_ADDR,
);

const tweet = (msg) => {
  // TODO: integrate with twitter API, but in the meantime
  // just console.log()
  console.log(msg);
}

const subscription = orchestratorContractInstance.events.MakeTroublesomeCollection(
  {fromBlock: 0},
  (error, event) => {
    if (!error) {
      const { msgSender, originalCollection, troublesomeCollection, name, symbol } = event.returnValues;
      tweet(`New collection became Double Trouble: ${name} (${symbol}).`);
    } else {
      console.log("error");
      console.log(error);
    }
  }
);
