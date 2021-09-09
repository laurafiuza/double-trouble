import React, { Component } from 'react';
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import ErrorCard from './ErrorCard';
import ImageCard from './ImageCard';
import { Card, Button, Spinner, Table, ListGroup, InputGroup, FormControl } from "react-bootstrap";

const assert = (bool, msg) => {
  if (!bool) {
    throw new Error(msg || "Assertion failed");
  }
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

  refreshPage = () => {
    window.location.reload();
  };

  componentDidMount() {
    this.deriveAndRender();
  };

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
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
      forSalePrice = parseInt(await troublesomeCollection.methods.forSalePrice(this.props.tokenId).call());
      lastPurchasePrice = parseInt(await troublesomeCollection.methods.lastPurchasePrice(this.props.tokenId).call());
      isTroublesome = true;
    } catch(err) {
      isTroublesome = false;
    }

    const isTroublesomeOwner = troublesomeOwner && troublesomeOwner === this.props.web3.defaultAccount;

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
    const isOriginalOwner = originalOwner && originalOwner === this.props.web3.defaultAccount;
    const isDoubleTroubleApproved = approvedAddr === this.props.collection;

    return {
      tokenURI, originalCollection, isOriginalOwner, isDoubleTroubleApproved, troublesomeCollection,
      isTroublesomeOwner, isTroublesome, forSalePrice, lastPurchasePrice, originalOwner, troublesomeOwner,
    }
  };

  render() {
    if (this.localState.error !== undefined) {
      return <ErrorCard error={this.localState.error}/>
    }

    if (!this.props.web3) {
      return <Spinner animation="border" />;
    }

    const { tokenURI, isOriginalOwner, isTroublesomeOwner, isDoubleTroubleApproved,
      isTroublesome, forSalePrice, lastPurchasePrice, originalCollection,
      originalOwner, troublesomeOwner,
    } = this.externalCache;
    const isForSale = forSalePrice > 0;
    const canForceBuy = lastPurchasePrice > 0;
    const forSalePriceEth = forSalePrice && this.props.web3.utils.fromWei(forSalePrice.toString(), 'ether');
    const lastPurchasePriceEth = lastPurchasePrice && this.props.web3.utils.fromWei(lastPurchasePrice.toString(), 'ether');
    return (
      <Card style={{width: '36rem'}}>
        <Card.Body>
          <ImageCard tokenURI={tokenURI}/>
          <Table striped bordered hover>
            <tbody>
              <tr>
                <td>Collection Address</td>
                <td>{originalCollection._address}</td>
              </tr>
              <tr>
                <td>Token ID</td>
                <td>{this.props.tokenId}</td>
              </tr>
              <tr>
                <td>Owner</td>
                <td>{troublesomeOwner || originalOwner}</td>
              </tr>
              { forSalePrice > 0 &&
                <tr>
                  <td>For sale price</td>
                  <td>{forSalePriceEth} ETH</td>
                </tr>
              }
              { lastPurchasePrice > 0 &&
                <tr>
                  <td>Last purchase price</td>
                  <td>{lastPurchasePriceEth} ETH</td>
                </tr>
              }
            </tbody>
          </Table>
          { isTroublesome &&
            <>
              <Card.Title>This NFT is troublesome!</Card.Title>
              { isTroublesomeOwner &&
                <>
                  <Card.Subtitle style={{color: "green"}}>You are the owner</Card.Subtitle>
                  <ListGroup>
                    <ListGroup.Item>
                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon3">
                        New price in ETH
                      </InputGroup.Text>
                      <FormControl id="new-price" aria-describedby="basic-addon3" onChange={this.localStateLink('inputSalePrice').onChange} value={this.localState.inputSalePrice} />
                    </InputGroup>
                    <Button variant="outline-dark" onClick={() => this.setPrice(parseInt(this.localState.inputSalePrice))}>
                      { forSalePrice === 0 ? "Put up for sale" : "Change price"}
                    </Button>
                  { forSalePrice > 0 &&
                    <Button variant="outline-dark" onClick={() => this.setPrice(0)}>
                      Remove from sale
                    </Button>
                  }
                  { lastPurchasePrice === 0 &&
                      <Card.Text>
                        <div>No one bought it yet. You can still remove it from the DoubleTrouble contract if you want.</div>
                        <Button variant="outline-dark" onClick={this.unmakeTroublesome}>Untrouble</Button>
                      </Card.Text>
                  }
                  </ListGroup.Item>
                  </ListGroup>
                </>
              }
            </>
          }
          { !isTroublesomeOwner && isForSale &&
              <Button variant="outline-dark" onClick={this.buy}>Buy for {forSalePriceEth} ETH</Button>
          }
          { !isTroublesomeOwner && canForceBuy &&
              <Button variant="outline-dark" onClick={this.forceBuy}>Force buy for {lastPurchasePriceEth * 2} ETH</Button>
          }
          { !isTroublesome && isOriginalOwner &&
              <>
                <Card.Subtitle style={{color: "green"}}>You are the owner</Card.Subtitle>
                {isDoubleTroubleApproved
                  ? <Card.Text>
                      <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon3">
                          New price in ETH
                        </InputGroup.Text>
                        <FormControl onChange={this.localStateLink('inputSalePrice').onChange} value={this.localState.inputSalePrice} />
                      </InputGroup>
                      <Button variant="outline-dark" onClick={() => this.makeTroublesome(this.localState.inputSalePrice)}>Put up for sale</Button>
                    </Card.Text>
                  : 
                    <>
                      <Card.Text>
                        Please approve the Double Trouble contract before making your NFT Troublesome.
                      </Card.Text>
                      <Button variant="outline-dark" onClick={this.approveDoubleTrouble}>Approve</Button>
                    </>
                }
              </>
          }
          { !isTroublesome && !isOriginalOwner &&
              <Card.Text>
                <div>This NFT isn't Troublesome yet, and you don't own it.</div>
                <Card.Link href={`https://opensea.io/assets/${originalCollection._address}/${this.props.tokenId}`}>View it on OpenSea</Card.Link>.
              </Card.Text>
          }
        </Card.Body>
      </Card>
    );
  }
  approveDoubleTrouble = async () => {
    try {
      const { originalCollection } = this.externalCache;
      await originalCollection.methods.approve(this.props.collection, this.props.tokenId)
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
      await troublesomeCollection.methods.makeTroublesome(this.props.tokenId, priceInWei)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn(err);
      this.localState.error = err.message;
      this.forceUpdate();
    }
  };

  unmakeTroublesome = async () => {
    try {
      const { troublesomeCollection } = this.externalCache;
      await troublesomeCollection.methods.unmakeTroublesome(this.props.tokenId)
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
      await troublesomeCollection.methods.setPrice(this.props.tokenId, priceInWei)
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
      await troublesomeCollection.methods.buy(this.props.tokenId)
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
      await troublesomeCollection.methods.forceBuy(this.props.tokenId)
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
};

export default TroublesomeCollectionInspector;
