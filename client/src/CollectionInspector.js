import React, { Component } from "react";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import DoubleTroubleOrchestratorContract from "./contracts/DoubleTroubleOrchestrator.json";
import GenericNFTContract from "./contracts/IERC721Metadata.json";

import "./App.css";

// TODO: is dtable?

// 1) Inputs (Props)
// 2) local state (only exists in client)
// 3) Cache of external state

const DTO_CONTRACT_ADDR = "0xB0B54AFf64156212472374128DCb4238A9A67B13";
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

    const troublesomeCollection = new this.props.web3.eth.Contract(
      DoubleTroubleContract.abi,
      this.props.collection,
    );

    try {
      const ret = await troublesomeCollection.methods.supportsInterface("0xdeadbeef").call();
      if (!ret) {
        throw new Error("Doesnt suport 0xdeadbeef");
      }
    } catch(err) {
      throw new Error(`Address supplied ${this.props.collection} doesn't refer to a Troublesome NFT collection.`);
    }

    var originalAddr, tokenURI, troublesomeOwner, forSalePrice = 0, lastPurchasePrice = 0, isTroublesome = false;
    try {
      originalAddr = await troublesomeCollection.methods.originalCollection().call();
      tokenURI = await troublesomeCollection.methods.tokenURI(this.props.tokenId).call();

      troublesomeOwner = await troublesomeCollection.methods.ownerOf(this.props.tokenId).call();
      forSalePrice = await troublesomeCollection.methods.forSalePrice(this.props.tokenId).call();
      lastPurchasePrice = await troublesomeCollection.methods.lastPurchasePrice(this.props.tokenId).call();
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
      tokenURI, originalCollection, isOriginalOwner, isDoubleTroubleApproved, troublesomeCollection,
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
      originalOwner, troublesomeOwner, troublesomeCollection,
    } = this.externalCache;
    const isForSale = forSalePrice > 0;
    const forSalePriceEth = forSalePrice && this.props.web3.utils.fromWei(forSalePrice.toString(), 'ether');
    const lastPurchasePriceEth = lastPurchasePrice && this.props.web3.utils.fromWei(lastPurchasePrice.toString(), 'ether');
    return (
      <div className="CollectionInspector">
        <h1>DoubleTrouble</h1>
        <p>Token URI: {tokenURI}</p>
        <p>Is Troublesome : {isTroublesome}</p>
        <p>Original collection: {originalCollection._address}</p>
        <p>Original owner: {originalOwner}</p>
        <p>Troublesome owner: {troublesomeOwner}</p>
        <p>For sale price: {forSalePriceEth} ETH</p>
        <p>Last purchase price: {lastPurchasePriceEth} ETH</p>
        { isTroublesome &&
            <div>
              <h2>This NFT is troublesome!</h2>
            { isTroublesomeOwner &&
                <>
                  <div>You are the owner.</div>
                  <label>
                    New price in Ethers:
                    <input onChange={this.localStateLink('inputSalePrice').onChange} value={this.localState.inputSalePrice} />
                  </label>
                  <button onClick={() => this.putUpForSale(parseInt(this.localState.inputSalePrice))}>
                    { forSalePrice == 0 ? "Put up for sale" : "Change price"}
                  </button>
                { forSalePrice > 0 &&
                  <button onClick={() => this.putUpForSale(0)}>
                    Remove from sale
                  </button>
                }
                { lastPurchasePrice == 0 &&
                    <div>
                      No one bought it yet. You can still remove it from the DoubleTrouble contract if you want.
                      <button onClick={() => window.alert("TODO")}>Untrouble</button>
                    </div>
                }
                </>
            }
            { !isTroublesomeOwner &&
                <div>
                  <button onClick={this.buy}>Buy for {forSalePriceEth} ETH</button>
                  <button onClick={this.forceBuy}>Force buy for {lastPurchasePriceEth * 2} ETH</button>
                </div>
            }
            </div>
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
        { !isTroublesome && !isOriginalOwner &&
            <div>
              This NFT isn't Troublesome, and you don't own it.
              View it <a href={`/collections/${originalCollection._address}/${this.props.tokenId}`}>here</a>.
            </div>
        }
      </div>
    );
  }
  approveDoubleTrouble = async () => {
    try {
      const { originalCollection } = this.externalCache;
      const response = await originalCollection.methods.approve(this.props.collection, this.props.tokenId)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn(err);
      this.localState.error = err.message;
      this.forceUpdate();
    }
  };

  makeTroublesome = async (isDTable) => {
    try {
      const { troublesomeCollection } = this.externalCache;
      const response = await troublesomeCollection.methods.makeTroublesome(this.props.tokenId)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn(err);
      this.localState.error = err.message;
      this.forceUpdate();
    }
  };

  putUpForSale = async (priceInEth) => {
    try {
      const { troublesomeCollection } = this.externalCache;
      // TODO: Validate > 0

      const priceInWei = this.props.web3.utils.toWei(priceInEth.toString(), 'ether')
      const response = await troublesomeCollection.methods.putUpForSale(this.props.tokenId, priceInWei)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn(err);
      this.localState.error = err.message;
      this.forceUpdate();
    }
  };


  buy = async () => {
    try {
      const { troublesomeCollection, forSalePrice } = this.externalCache;
      const response = await troublesomeCollection.methods.buy(this.props.tokenId)
        .send({from: this.props.web3.defaultAccount, value: forSalePrice});
      this.deriveAndRender();
    } catch (err) {
      console.warn(err);
      this.localState.error = err.message;
      this.forceUpdate();
    }
  };

  forceBuy = async () => {
    try {
      const { troublesomeCollection, lastPurchasePrice } = this.externalCache;
      const response = await troublesomeCollection.methods.forceBuy(this.props.tokenId)
        .send({from: this.props.web3.defaultAccount, value: lastPurchasePrice * 2});
      this.deriveAndRender();
    } catch(err) {
      console.warn(err);
      this.localState.error = err.message;
      this.forceUpdate();
    }
  };

  handleBuyInputChange = (e) => {
    e.persist();
    this.setState({inputBuyPrice: e.target.value});
  };

  handleForceBuyInputChange = (e) => {
    e.persist();
    this.setState({inputForceBuyPrice: e.target.value});
  };


  localStateLink = (attr) => {
    return {
      value: this.localState[attr],
      onChange: ((e) => {
        // e.persist();
        this.localState[attr] = e.target.value;
        this.forceUpdate();
      }),
    };
  }
}


export default CollectionInspector;
