import React, { Component } from "react";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import DoubleTroubleOrchestratorContract from "./contracts/DoubleTroubleOrchestrator.json";
import GenericNFTContract from "./contracts/IERC721Metadata.json";

import "./App.css";

// TODO: is dtable?

// 1) Inputs (Props)
// 2) local state (only exists in client)
// 3) Cache of external state

const DTO_CONTRACT_ADDR = "0xbD532B847F1b4634c9D928F71eC20656D1b5c869";
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

class CollectionInspector extends Component {
  constructor() {
    super();
    this.localState = {error: undefined};
    this.externalCache = {};
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props != prevProps) {
      this.deriveAndRender();
    }
  };

  componentDidMount() {
    this.deriveAndRender();
  };

  deriveAndRender = () => {
    this.deriveExternalCache().then((ret) => {
      this.externalCache = ret;
      this.forceUpdate();
    }).catch((err) => {
      console.error(err);
      this.localState.error = err.message;
      this.forceUpdate();
    });
  };

  deriveExternalCache = async () => {
    if (!this.props.web3) {
      return {};
    }

    const nftCollection = new this.props.web3.eth.Contract(
      GenericNFTContract.abi,
      this.props.collection,
    );

    var isTroublesome, collectionName, collectionSymbol, isERC721 = false;
    try {
      collectionName = await nftCollection.methods.name().call();
      collectionSymbol = await nftCollection.methods.symbol().call();
      isERC721 = true;
    } catch(err) {
      throw new Error(`Invalid ERC721 address ${this.props.collection}`);
    }

    try {
      isTroublesome = await nftCollection.methods.supportsInterface("0xdeadbeef").call();
    } catch(err) {
      isTroublesome = false;
    }

    return {isTroublesome, isERC721}
  };

  render() {
    if (this.localState.error) {
      return <div>
          <div className="error-box">Error: {this.localState.error}</div>
        </div>;
    } else if (this.externalCache.isTroublesome) {
      return <TroublesomeCollectionInspector web3={this.props.web3}
        collection={this.props.collection} tokenId={this.props.tokenId} />;
    } else if (this.externalCache.isERC721) {
      return <ERC721Inspector web3={this.props.web3}
        collection={this.props.collection} tokenId={this.props.tokenId} />;
    } else {
      return <div>Loading...</div>;
    }
  };
}

class ERC721Inspector extends Component {
  constructor() {
    super();
    this.localState = {error: undefined};
    this.externalCache = {
      web3: null, accounts: null, defaultAccount: null,
      dto: undefined, troublesomeCollection: undefined,
    };
  };

  componentDidMount() {
    this.deriveAndRender();
  }

  componentDidUpdate(prevProps) {
    if (this.props != prevProps) {
      this.deriveAndRender();
    }
  };

  deriveAndRender = () => {
    this.deriveExternalCache().then((ret) => {
      this.externalCache = ret;
      this.forceUpdate();
    }).catch((err) => {
      console.error(err);
      this.localState.error = err.message;
      this.forceUpdate();
    });
  };

  deriveExternalCache = async () => {
    if (!this.props.web3) {
      return {};
    }

    const dto = new this.props.web3.eth.Contract(
      DoubleTroubleOrchestratorContract.abi,
      DTO_CONTRACT_ADDR,
    );

    const nftCollection = new this.props.web3.eth.Contract(
      GenericNFTContract.abi,
      this.props.collection,
    );

    var troublesomeCollection;
    try {
      troublesomeCollection = await dto.methods.troublesomeCollection(this.props.collection).call();
    } catch(err) {
      throw new Error(`Unable to connect to DoubleTroubleOrchestrator at address ${DTO_CONTRACT_ADDR}`);
    }
    const collectionName = await nftCollection.methods.name().call();
    const collectionSymbol = await nftCollection.methods.symbol().call();


    var nftOwner, tokenURI;
    try {
      nftOwner = await nftCollection.methods.ownerOf(this.props.tokenId).call();
      tokenURI = await nftCollection.methods.tokenURI(this.props.tokenId).call();
    } catch(_err) {
      throw new Error(`NFT ${this.props.tokenId} not found in collection ${this.props.collection}`)
    }
    const isOwner = nftOwner && nftOwner == this.props.web3.defaultAccount;

    return {
      dto, nftCollection, troublesomeCollection, nftOwner, isOwner,
      collectionName, collectionSymbol, tokenURI,
    };
  }

  render() {
    var loadedNft = undefined;
    if (this.externalCache.collectionName) {
      loadedNft = <div>
        {this.externalCache.tokenURI != undefined && <img src={this.externalCache.tokenURI}/>}
        Name: {this.externalCache.collectionName} Symbol: {this.externalCache.collectionSymbol} tokenURI: {this.externalCache.tokenURI}
        </div>;
    }

    if (this.localState.error != undefined) {
      return <div>
          {loadedNft != undefined ? loadedNft : null}
          <div className="error-box">Error: {this.localState.error}</div>
        </div>;
    }

    if (this.props.web3 == undefined) {
      return <div>Loading web3...</div>;
    }

    if (this.externalCache.troublesomeCollection == ZERO_ADDR) {
      return (<div>
        {loadedNft}
        <div>This NFT collection is not in DoubleTrouble yet</div>
        <button onClick={this.makeTroublesomeCollection}>
          Create a troublesome collection for it
        </button>
      </div>);
    }

    if (this.externalCache.troublesomeCollection == undefined) {
      return <div className="error-box">Something went wrong</div>
    }
    return (<div>
      <div>Name: {this.externalCache.collectionName} Symbol: {this.externalCache.collectionSymbol}</div>
      This NFT already has a troublesome Collection.
      <a href={`/collections/${this.externalCache.troublesomeCollection}/${this.props.tokenId}`}>View it</a>
    </div>);
  }

  makeTroublesomeCollection = async () => {
    try {
      const {dto, collectionName, collectionSymbol} = this.externalCache;
      const response = await dto.methods
        .makeTroublesomeCollection(this.props.collection, collectionName, collectionSymbol)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn("Error when making Troublesome collection");
      console.warn(err);
    }
  };
};

class TroublesomeCollectionInspector extends Component {
  constructor() {
    super();
    this.localState = {
      inputSalePrice: "",
      error: undefined,
    };
    this.externalCache = {
      tokenURI: "", isOwner: false, isTroublesome: true,
      originalCollection: {},
    };
  };

  componentDidMount() {
    this.deriveAndRender();
  }

  componentDidUpdate(prevProps) {
    if (this.props != prevProps) {
      this.deriveAndRender();
    }
  };

  deriveAndRender = () => {
    this.deriveExternalCache().then((ret) => {
      this.externalCache = ret;
      this.forceUpdate();
    }).catch((err) => {
      console.error(err);
      this.localState.error = err.message;
      this.forceUpdate();
    });
  };

  deriveExternalCache = async () => {
    if (!this.props.web3) {
      return {};
    }

    const dtCollection = new this.props.web3.eth.Contract(
      DoubleTroubleContract.abi,
      this.props.collection,
    );

    try {
      const ret = await dtCollection.methods.supportsInterface("0xdeadbeef").call();
      if (!ret) {
        throw new Error("Doesnt suport 0xdeadbeef");
      }
    } catch(err) {
      throw new Error(`Address supplied ${this.props.collection} doesn't refer to a Troublesome NFT collection.`);
    }

    var originalAddr, tokenURI, troublesomeOwner, forSalePrice = 0, lastPurchasePrice = 0, isTroublesome = false;
    try {
      originalAddr = await dtCollection.methods.originalCollection().call();
      tokenURI = await dtCollection.methods.tokenURI(this.props.tokenId).call();

      troublesomeOwner = await dtCollection.methods.ownerOf(this.props.tokenId).call();
      forSalePrice = await dtCollection.methods.forSalePrice(this.props.tokenId).call();
      lastPurchasePrice = await dtCollection.methods.lastPurchasePrice(this.props.tokenId).call();
      isTroublesome = true;
    } catch(err) {
      isTroublesome = false;
    }

    const isTroublesomeOwner = troublesomeOwner && troublesomeOwner == this.props.web3.defaultAccount;

    const originalCollection = new this.props.web3.eth.Contract(
      GenericNFTContract.abi,
      originalAddr,
    );

    var originalOwner, approvedAddr;
    try {
      originalOwner = await originalCollection.methods.ownerOf(this.props.tokenId).call();
      approvedAddr = await originalCollection.methods.getApproved(this.props.tokenId).call();
    } catch(err) {
      throw new Error(`Unable to find original NFT ${this.props.tokenId} at address ${originalAddr}`)
    }
    const isOriginalOwner = originalOwner && originalOwner == this.props.web3.defaultAccount;
    const isDoubleTroubleApproved = approvedAddr == this.props.collection;

    return {
      tokenURI, originalCollection, isOriginalOwner, isDoubleTroubleApproved,
      isTroublesomeOwner, isTroublesome, forSalePrice, lastPurchasePrice, originalOwner, troublesomeOwner,
    }
  };

  render() {
    if (this.localState.error != undefined) {
      return <div className="error-box">Error: {this.localState.error}</div>
    }

    if (!this.props.web3) {
      return <div>Loading...</div>;
    }

    const { tokenURI, isOriginalOwner, isTroublesomeOwner, isDoubleTroubleApproved,
      isTroublesome, forSalePrice, lastPurchasePrice, originalCollection,
      originalOwner, troublesomeOwner,
    } = this.externalCache;
    const isForSale = forSalePrice > 0;

    const showUnMakeDTableButton = isTroublesomeOwner && isTroublesome;
    const showPutUpForSaleButton = isTroublesomeOwner && isTroublesome && !isForSale;
    const showUnPutUpForSaleButton = isTroublesomeOwner && isTroublesome && isForSale;
    const showBuyButton = !isTroublesomeOwner && isTroublesome && isForSale;
    const showForceBuyButton = !isTroublesomeOwner && isTroublesome && lastPurchasePrice > 0;

    const unMakeDTableButton =
      <button onClick={() => this.makeDTable(false)}>
        Unmake DTable
      </button>;

    const putUpForSaleButton =
      <>
        <label>
          New price:
          <input onChange={(e) => this.handlePriceInputChange(e)} value={this.localState.inputSalePrice} />
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
          <input onChange={(e) => this.handleBuyInputChange(e)} value={this.localState.inputBuyPrice} />
        </label>
        <button onClick={() => this.buy()}>Buy</button>
      </>;

    const forceBuyButton =
      <>
        <label>
          Force buy for:
          <input onChange={(e) => this.handleForceBuyInputChange(e)} value={this.localState.inputForceBuyPrice} />
        </label>
        <button onClick={() => this.forceBuy()}>Force buy</button>
      </>;

    return (
      <div className="CollectionInspector">
        <h1>DoubleTrouble</h1>
        <p>Token URI: {tokenURI}</p>
        <p>Is Troublesome : {isTroublesome}</p>
        <p>Original collection: {originalCollection._address}</p>
        <p>Original owner: {originalOwner}</p>
        <p>Troublesome owner: {troublesomeOwner}</p>
        <p>For sale price: {forSalePrice}</p>
        <p>Last purchase price: {lastPurchasePrice}</p>
        { showUnMakeDTableButton && unMakeDTableButton }
        { showPutUpForSaleButton && putUpForSaleButton }
        { showUnPutUpForSaleButton && unPutUpForSaleButton }
        { showBuyButton && buyButton }
        { showForceBuyButton && forceBuyButton }
        { isTroublesome &&
            <div>This NFT is troublesome!</div>
        }
        { !isTroublesome && isOriginalOwner &&
            <div>
              You own this NFT.
              {isDoubleTroubleApproved
                ? <div>
                    Click below to make your NFT Troublesome
                    <button onClick={this.makeTroublesome}>Make Troublesome</button>
                  </div>
                : <div>
                    Please approve the Double Trouble contract before making your NFT Troublesome.
                    <button onClick={this.approveDoubleTrouble}>Approve</button>
                  </div>
              }
            </div>
        }
      </div>
    );
  }

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

}

export default CollectionInspector;
