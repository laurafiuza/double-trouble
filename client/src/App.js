import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import "./App.css";

class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    tokenURI: "https://foo.com/bar",
    isDTable: true,
    isOwner: false,
    isForSale: true,
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      const user = accounts[0];

      // Get the contract instance.
      //const networkId = await web3.eth.net.getId();
      //console.log("window.location.pathname");
      const nft = window.location.pathname.substring(1).split("/");
      const collection = nft[0];
      const tokenId = parseInt(nft[1]);

      //const deployedNetwork = DoubleTroubleContract.networks[networkId];
      const instance = new web3.eth.Contract(
        DoubleTroubleContract.abi,
        collection,
      );
      console.log(await instance.methods.tokenURI(tokenId).call());
      const tokenURI = await instance.methods.tokenURI(tokenId).call() || "not found";
      const owner = await instance.methods.ownerOf(tokenId).call() || "no owner found";
      const forSalePrice = await instance.methods.forSalePrice(tokenId).call() || "no for sale price found";

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3,
        accounts,
        contract: instance,
        tokenURI,
        isOwner: owner === user,
        isForSale: parseInt(forSalePrice) > 0,
      }, this.refreshView);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  refreshView = async () => {
    /*
    const { accounts, contract } = this.state;
    const response = await contract.methods.get().call();
    this.setState({ storageValue: parseInt(response) });
    */
  };

  clickButton = async () => {
    /*
    const { accounts, contract, storageValue } = this.state;
    await contract.methods.set(storageValue + 1).send({ from: accounts[0] });

    this.refreshView();
    */
  };

  makeDTable = async (isDTable) => {
    this.setState({ isDTable });
  };

  putUpForSale = async (isForSale) => {
    this.setState({ isForSale });
  };

  buy = async () => {
  };

  forceBuy = async () => {
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading...</div>;
    }
    return (
      <div className="App">
        <h1>DoubleTrouble</h1>
        <p>Token URI: {this.state.tokenURI}</p>
        <p>Is DTable: {this.state.isDTable.toString()}</p>
        <p>Is owner: {this.state.isOwner.toString()}</p>
        <p>Is for sale: {this.state.isForSale.toString()}</p>
        {
          this.state.isOwner &&
          !this.state.isDTable &&
          <button onClick={() => this.makeDTable(true)}>
            Make DTable
          </button>
        }
        {
          this.state.isOwner &&
          this.state.isDTable &&
          <button onClick={() => this.makeDTable(false)}>
            Unmake DTable
          </button>
        }
        {
          this.state.isOwner &&
          this.state.isDTable &&
          !this.state.isForSale &&
          <button onClick={() => this.putUpForSale(true)}>
            Put up for sale
          </button>
        }
        {
          this.state.isOwner &&
          this.state.isDTable &&
          this.state.isForSale &&
          <button onClick={() => this.putUpForSale(false)}>
            Unput up for sale
          </button>
        }
        {
          !this.state.isOwner &&
          this.state.isDTable &&
          this.state.isForSale &&
          <button onClick={() => this.buy()}>Buy</button>
        }
        {
          !this.state.isOwner &&
          this.state.isDTable &&
          !this.state.isForSale &&
          <button onClick={() => this.forceBuy()}>Force buy</button>
        }
      </div>
    );
  }
}

export default App;
