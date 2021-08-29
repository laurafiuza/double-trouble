import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import "./App.css";

// TODO: is dtable?

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    tokenURI: "",
    isDTable: true,
    isOwner: false,
    collection: "",
    tokenId: -1,
    inputSalePrice: "",
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      const defaultUser = accounts[0];

      // Get the contract instance.
      const nft = window.location.pathname.substring(1).split("/");
      const collection = nft[0];
      const tokenId = parseInt(nft[1]);

      const instance = new web3.eth.Contract(
        DoubleTroubleContract.abi,
        collection,
      );
      const tokenURI = await instance.methods.tokenURI(tokenId).call() || "not found";
      const ownerOfNft = await instance.methods.ownerOf(tokenId).call() || "no owner found";
      const forSalePrice = await instance.methods.forSalePrice(tokenId).call() || "no for sale price found";
      const lastPurchasePrice = await instance.methods.lastPurchasePrice(tokenId).call() || "no last purchase price found";

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3,
        accounts,
        contract: instance,
        tokenURI,
        isOwner: ownerOfNft === defaultUser,
        forSalePrice: parseInt(forSalePrice),
        collection,
        tokenId,
        defaultUser,
        lastPurchasePrice,
      });
    } catch (error) {
      // TODO: make this try catch block smaller so error messages are smarter
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  makeDTable = async (isDTable) => {
    if (!isDTable) {
      this.setState({ isDTable });
      return;
    }
    try {
      const { contract, tokenId, defaultUser } = this.state;
      const response = await contract.methods.makeDTable(tokenId).send({from: defaultUser});
      this.setState({ isDTable });
    } catch(err) {
      console.log("Unable to make DTable");
    }
  };

  putUpForSale = async (isForSale) => {
    if (!isForSale) {
      this.setState({ isForSale });
      return;
    }
    try {
      const { contract, inputSalePrice, tokenId, defaultUser } = this.state;
      const intInputSalePrice = parseInt(inputSalePrice);
      if (intInputSalePrice <= 0) {
        alert("Please input a price greater than or equal to zero.");
        return;
      }
      const response = await contract.methods.putUpForSale(tokenId, intInputSalePrice).send({from: defaultUser});
      this.setState({ isForSale });
    } catch(err) {
      console.log("Unable to put up for sale");
    }
  };

  buy = async () => {
    try {
      const { contract, tokenId, defaultUser, inputBuyPrice } = this.state;
      const intInputBuyPrice = parseInt(inputBuyPrice);
      if (intInputBuyPrice <= 0) {
        alert("Please input a price greater than or equal to zero.");
        return;
      }
      const response = await contract.methods.buy(tokenId).send({from: defaultUser, value: intInputBuyPrice});
    } catch (err) {
      console.log("Unable to buy NFT");
    }
  };

  forceBuy = async () => {
    try {
      const { contract, tokenId, defaultUser, inputForceBuyPrice } = this.state;
      const intInputForceBuyPrice = parseInt(inputForceBuyPrice);
      if (intInputForceBuyPrice <= 0) {
        alert("Please input a price greater than or equal to zero.");
        return;
      }
      const response = await contract.methods.forceBuy(tokenId).send({from: defaultUser, intInputForceBuyPrice});
    } catch(err) {
      console.log("Unable to force buy");
    }
  };

  handlePriceInputChange = (e) => {
    e.persist();
    this.setState({inputSalePrice: e.target.value});
  };

  handleBuyInputChange = (e) => {
    e.persist();
    this.setState({inputBuyPrice: e.target.value});
  };

  handleForceBuyInputChange = (e) => {
    e.persist();
    this.setState({inputForceBuyPrice: e.target.value});
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading...</div>;
    }
    const { isOwner, isDTable, forSalePrice, lastPurchasePrice } = this.state;
    const isForSale = forSalePrice > 0;

    const showMakeDTableButton = isOwner && !isDTable;
    // TODO: consider creating unmakeDTable function in contract?
    const showUnMakeDTableButton = isOwner && isDTable;
    const showPutUpForSaleButton = isOwner && isDTable && !isForSale;
    const showUnPutUpForSaleButton = isOwner && isDTable && isForSale;
    const showBuyButton = !isOwner && isDTable && isForSale;
    const showForceBuyButton = !isOwner && isDTable && lastPurchasePrice > 0;

    const makeDTableButton = 
      <button onClick={() => this.makeDTable(true)}>
        Make DTable
      </button>;

    const unMakeDTableButton = 
      <button onClick={() => this.makeDTable(false)}>
        Unmake DTable
      </button>;

    const putUpForSaleButton =
      <>
        <label>
          New price:
          <input onChange={(e) => this.handlePriceInputChange(e)} value={this.state.inputSalePrice} />
        </label>
        <button onClick={() => this.putUpForSale(true)}>
          Put up for sale
        </button>
      </>;

    const unPutUpForSaleButton =
      <button onClick={() => this.putUpForSale(false)}>
        Unput up for sale
      </button>;

    const buyButton =
      <>
        <label>
          Buy for:
          <input onChange={(e) => this.handleBuyInputChange(e)} value={this.state.inputBuyPrice} />
        </label>
        <button onClick={() => this.buy()}>Buy</button>
      </>;

    const forceBuyButton =
      <>
        <label>
          Force buy for:
          <input onChange={(e) => this.handleForceBuyInputChange(e)} value={this.state.inputForceBuyPrice} />
        </label>
        <button onClick={() => this.forceBuy()}>Force buy</button>
      </>;
       
    return (
      <div className="App">
        <h1>DoubleTrouble</h1>
        <p>Token URI: {this.state.tokenURI}</p>
        <p>Is DTable: {this.state.isDTable.toString()}</p>
        <p>Is owner: {this.state.isOwner.toString()}</p>
        <p>For sale price: {this.state.forSalePrice}</p>
        <p>Last purchase price: {this.state.lastPurchasePrice}</p>
        { showMakeDTableButton && makeDTableButton }
        { showUnMakeDTableButton && unMakeDTableButton }
        { showPutUpForSaleButton && putUpForSaleButton }
        { showUnPutUpForSaleButton && unPutUpForSaleButton }
        { showBuyButton && buyButton }
        { showForceBuyButton && forceBuyButton }
      </div>
    );
  }
}

export default App;
