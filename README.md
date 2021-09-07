# Double Trouble

## How to start
Install [Ganache](https://www.trufflesuite.com/ganache), [Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation), and add the [Metamask](https://metamask.io/) Chrome Extension.

TODO: npm install for packages? inside client? 

## How to run
1. Click the settings button at the top right of the Ganache GUI.
2. Click "Add Project"
3. Find the directory where you git-cloned Double Trouble and select the file `truffle-config.js`.
4. `cd blockchain-backend` and enter `truffle migrate --reset`
5. Go to Ganache, click "Contracts", and find the address for the DoubleTroubleOrchestrator contract.
6. `cd ../client` and enter `REACT_APP_DTO_ADDR=[address] yarn start`
7. Go to Ganache, click "Accounts", and find the address of `accounts[0]` (the first one that shows up), and import that account into your Metamask Chrome Extension.
8. You should have your dev up and running!
