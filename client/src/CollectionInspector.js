import React, { Component } from "react";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import doubleTroubleOrchestrator from './orchestrator';
import { Card, Spinner, ListGroup, Table, Form, FormControl, InputGroup, Button } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const assert = (bool, msg) => {
  if (!bool) {
    throw new Error(msg || "Assertion failed")
  }
};

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
      return <Card bg="danger" text="white" style={{width: '18rem'}}>
        <Card.Body>
          <Card.Title>Error</Card.Title>
          <Card.Text>{this.localState.error}</Card.Text>
        </Card.Body>
        </Card>;
    } else if (this.externalCache.isTroublesome) {
      return <TroublesomeCollectionInspector web3={this.props.web3}
        collection={this.props.collection} tokenId={this.props.tokenId} />;
    } else if (this.externalCache.isERC721) {
      return <ERC721Inspector web3={this.props.web3}
        collection={this.props.collection} tokenId={this.props.tokenId} />;
    } else {
      return <Spinner animation="border" />;
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

    const dto = await doubleTroubleOrchestrator(this.props.web3);

    const nftCollection = new this.props.web3.eth.Contract(
      GenericNFTContract.abi,
      this.props.collection,
    );

    var troublesomeCollection;
    try {
      troublesomeCollection = await dto.methods.troublesomeCollection(this.props.collection).call();
    } catch(err) {
      throw new Error(`Unable to connect to DoubleTroubleOrchestrator`);
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
      loadedNft = <Card>
        {this.externalCache.tokenURI != undefined && <img src={this.externalCache.tokenURI}/>}
        {this.externalCache.tokenURI != undefined && <Card.Img variant="top" src={this.externalCache.tokenURI} />}
        Name: {this.externalCache.collectionName} Symbol: {this.externalCache.collectionSymbol} tokenURI: {this.externalCache.tokenURI}
        </Card>;
    }

    if (this.localState.error != undefined) {
      return <div>
          {loadedNft != undefined ? loadedNft : null}
          <Card bg="danger" text="white" style={{width: '18rem'}}>
            <Card.Body>
              <Card.Title>Error</Card.Title>
              <Card.Text>{this.localState.error}</Card.Text>
            </Card.Body>
          </Card>;
        </div>;
    }

    if (this.props.web3 == undefined) {
      return <Spinner animation="border" />;
    }

    if (this.externalCache.troublesomeCollection == ZERO_ADDR) {
      return (<Card>
        {loadedNft}
        <Card.Text>This NFT collection is not in DoubleTrouble yet</Card.Text>
        <Button variant="outline-success" onClick={this.makeTroublesomeCollection}>
          Create a troublesome collection for it
        </Button>
      </Card>);
    }

    if (this.externalCache.troublesomeCollection == undefined) {
      return <Card bg="danger" text="white" style={{width: '18rem'}}>
        <Card.Body>
          <Card.Title>Error</Card.Title>
          <Card.Text>{this.localState.error}</Card.Text>
        </Card.Body>
      </Card>;
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
      return <Card bg="danger" text="white" style={{width: '18rem'}}>
          <Card.Body>
          <Card.Title>Error</Card.Title>
            <Card.Text>{this.localState.error}</Card.Text>
          </Card.Body>
        </Card>;
    }

    if (!this.props.web3) {
      return <Spinner animation="border" />;
    }

    const { tokenURI, isOriginalOwner, isTroublesomeOwner, isDoubleTroubleApproved,
      isTroublesome, forSalePrice, lastPurchasePrice, originalCollection,
      originalOwner, troublesomeOwner, troublesomeCollection,
    } = this.externalCache;
    const isForSale = forSalePrice > 0;
    const forSalePriceEth = forSalePrice && this.props.web3.utils.fromWei(forSalePrice.toString(), 'ether');
    const lastPurchasePriceEth = lastPurchasePrice && this.props.web3.utils.fromWei(lastPurchasePrice.toString(), 'ether');
    return (
      <Card style={{width: '36rem'}}>
        <Card.Body>
          <Card.Title>DoubleTrouble</Card.Title>
          <Table striped bordered hover>
            <tbody>
              <tr>
                <td>TokenURI</td>
                <td>{tokenURI}</td>
              </tr>
              <tr>
                <td>Is troublesome</td>
                <td>{isTroublesome.toString()}</td>
              </tr>
              <tr>
                <td>Original collection</td>
                <td>{originalCollection._address}</td>
              </tr>
              <tr>
                <td>Original owner</td>
                <td>{originalOwner}</td>
              </tr>
              <tr>
                <td>Troublesome owner</td>
                <td>{troublesomeOwner}</td>
              </tr>
              <tr>
                <td>For sale price</td>
                <td>{forSalePriceEth} ETH</td>
              </tr>
              <tr>
                <td>Last purchase price</td>
                <td>{lastPurchasePrice} ETH</td>
              </tr>
            </tbody>
          </Table>
          { isTroublesome &&
            <>
              <Card.Title>This NFT is troublesome!</Card.Title>
              { isTroublesomeOwner && 
                <>
                  <Card.Subtitle>You are the owner</Card.Subtitle>
                  <Form.Label htmlFor="new-price">New price in ETH</Form.Label>
                  <InputGroup className="mb-3">
                    <InputGroup.Text id="basic-addon3">
                      $
                    </InputGroup.Text>
                    <FormControl id="new-price" aria-describedby="basic-addon3" onChange={this.localStateLink('inputSalePrice').onChange} value={this.localState.inputSalePrice} />
                  </InputGroup>
                  <Button variant="outline-dark" onClick={() => this.setPrice(parseInt(this.localState.inputSalePrice))}>
                    { forSalePrice == 0 ? "Put up for sale" : "Change price"}
                  </Button>
                { forSalePrice > 0 &&
                  <Button variant="outline-danger" onClick={() => this.setPrice(0)}>
                    Remove from sale
                  </Button>
                }
                { lastPurchasePrice == 0 &&
                    <Card.Text>
                      No one bought it yet. You can still remove it from the DoubleTrouble contract if you want.
                      <Button variant="outline-danger" onClick={() => window.alert("TODO")}>Untrouble</Button>
                    </Card.Text>
                }
                </>
              }
            </>
          }
          { !isTroublesomeOwner &&
              <>
                <Button variant="outline-dark" onClick={this.buy}>Buy for {forSalePriceEth} ETH</Button>
                <Button variant="outline-dark" onClick={this.forceBuy}>Force buy for {lastPurchasePriceEth * 2} ETH</Button>
              </>
          }
          { !isTroublesome && isOriginalOwner &&
              <>
                You own this NFT.
                {isDoubleTroubleApproved
                  ? <Card.Text>
                      Click below to put it up for sale within DoubleTrouble
                      <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon3">
                          $
                        </InputGroup.Text>
                        <FormControl onChange={this.localStateLink('inputSalePrice').onChange} value={this.localState.inputSalePrice} />
                      </InputGroup>
                      <Button variant="outline-dark" onClick={() => this.makeTroublesome(this.localState.inputSalePrice)}>Make Troublesome</Button>
                    </Card.Text>
                  : <Card.Text>
                      Please approve the Double Trouble contract before making your NFT Troublesome.
                      <Button variant="outline-dark" onClick={this.approveDoubleTrouble}>Approve</Button>
                    </Card.Text>
                }
              </>
          }
          { !isTroublesome && !isOriginalOwner &&
              <Card.Text>
                This NFT isn't Troublesome, and you don't own it.
                <Card.Link href={`/collections/${originalCollection._address}/${this.props.tokenId}`}>View it here</Card.Link>.
              </Card.Text>
          }
        </Card.Body>
      </Card>
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

  makeTroublesome = async (priceInEth) => {
    try {
      assert(priceInEth > 0, "Price must be > 0");
      const { troublesomeCollection } = this.externalCache;
      const priceInWei = this.props.web3.utils.toWei(priceInEth.toString(), 'ether')
      const response = await troublesomeCollection.methods.makeTroublesome(this.props.tokenId, priceInWei)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn(err);
      this.localState.error = err.message;
      this.forceUpdate();
    }
  };

  setPrice = async (priceInEth) => {
    try {
      const { troublesomeCollection } = this.externalCache;
      // TODO: Validate > 0

      const priceInWei = this.props.web3.utils.toWei(priceInEth.toString(), 'ether')
      const response = await troublesomeCollection.methods.setPrice(this.props.tokenId, priceInWei)
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
