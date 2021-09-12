// This doesn't work without the secret access keys and tokens for AWS and Twitter
const axios = require("axios");
const DTO_ADDR = "0x43dEcC964C9c125d335dcC920E1AF273eaF14fE0";
const WSS_INFURA_ENDPOINT = 'wss://rinkeby.infura.io/ws/v3/f5567dc7dce94cafa9a70591118a25f1';
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const LAST_BLOCK_NUM_FILE = "lastBlockNumber.txt";
const aws = require("aws-sdk");
const BUCKET = "double-trouble";
const SECRET_ACCESS_KEY = "";
const ACCESS_KEY_ID = "";
const REGION = "us-west-1";
aws.config.update({
  region: REGION, secretAccessKey: SECRET_ACCESS_KEY, accessKeyId: ACCESS_KEY_ID,
});
const s3 = new aws.S3();
const Web3 = require('web3');
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(WSS_INFURA_ENDPOINT)
);
const DoubleTroubleOrchestratorContract = require("./contracts/DoubleTroubleOrchestrator.json");
const orchestratorContractInstance = new web3.eth.Contract(
  DoubleTroubleOrchestratorContract.abi,
  DTO_ADDR,
);

const { TwitterClient } = require('twitter-api-client')
const twitterClient = new TwitterClient({
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    accessTokenSecret: ""
})

const tweet = (msg) => {
  twitterClient.tweets.statusesUpdate({
    status: msg
  }).then (response => {
    console.log("Tweeted!", response)
  }).catch(err => {
    console.error(err)
  });
}

const run = async () => {
  const subscription = orchestratorContractInstance.events.MakeTroublesomeCollection(
    {fromBlock: 0},
    async (eventError, event) => {
      if (eventError) {
        console.log("Event error:", eventError);
        return;
      }
      const getParams = {
        Bucket: BUCKET,
        Key: LAST_BLOCK_NUM_FILE,
      }
      s3.getObject(getParams, async (err, data) => {
        if (err) {
          console.log("error getting object")
          console.log(err);
          return;
        }
        const lastBlockNumber = parseInt(data.Body.toString('ascii'));
        if (event.blockNumber > lastBlockNumber) {
          const putParams = {
            Bucket: BUCKET,
            Key: LAST_BLOCK_NUM_FILE,
            Body: event.blockNumber.toString(),
          };
          s3.putObject(putParams, async(err) => {
            if (err) {
              console.log("error putting object");
              console.log(err);
              return;
            } 
            const { msgSender, originalCollection, troublesomeCollection, name, symbol } = event.returnValues;
            tweet(`New Double Trouble collection was inaugurated: ${name} (${symbol}).`); 
          });
        }
      });
    }
  );
};

run();
