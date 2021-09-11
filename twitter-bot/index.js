const axios = require("axios");
// TODO: make this an env
const DTO_ADDR = "0x43dEcC964C9c125d335dcC920E1AF273eaF14fE0";
const WSS_INFURA_ENDPOINT = 'wss://rinkeby.infura.io/ws/v3/f5567dc7dce94cafa9a70591118a25f1';
const Web3 = require('web3');
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(WSS_INFURA_ENDPOINT)
);
const DoubleTroubleOrchestratorContract = require("./contracts/DoubleTroubleOrchestrator.json");
const orchestratorContractInstance = new web3.eth.Contract(
  DoubleTroubleOrchestratorContract.abi,
  DTO_ADDR,
);

let blockNumber = 9269949;
// TODO: add this to local storage for persistence
const store = (number) => {
  blockNumber = number;
}

const tweet = (msg) => {
  // TODO: integrate with twitter API, but in the meantime
  // just console.log()
  console.log(msg);
}

const subscription = orchestratorContractInstance.events.MakeTroublesomeCollection(
  {fromBlock: 0},
  (error, event) => {
    if (!error) {
      if (event.blockNumber > blockNumber) {
        const { msgSender, originalCollection, troublesomeCollection, name, symbol } = event.returnValues;
        tweet(`New collection became Double Trouble: ${name} (${symbol}).`);
        // add to local storage
        store(event.blockNumber);
      }
    } else {
      console.log("error");
      console.log(error);
    }
  }
);
