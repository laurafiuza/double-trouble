import React, { Component } from 'react';
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import ErrorCard from './ErrorCard';
import ImageCard from './ImageCard';
import { Card, Button, Spinner, Table, ListGroup, InputGroup, FormControl } from "react-bootstrap";
import countdown from 'countdown';

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

    let originalAddr, tokenURI, troublesomeOwner, secondsToWithdraw, forSalePrice = 0, lastPurchasePrice = 0, isTroublesome = false, collectionName;
    try {
      originalAddr = await troublesomeCollection.methods.originalCollection().call();
      tokenURI = await troublesomeCollection.methods.troublesomeTokenURI(this.props.tokenId).call();
      collectionName = await troublesomeCollection.methods.name().call();

      forSalePrice = parseInt(await troublesomeCollection.methods.forSalePrice(this.props.tokenId).call());
      lastPurchasePrice = parseInt(await troublesomeCollection.methods.lastPurchasePrice(this.props.tokenId).call());
      secondsToWithdraw = parseInt(await troublesomeCollection.methods.secondsToWithdraw(this.props.tokenId).call());

      if (lastPurchasePrice > 0) {
        troublesomeOwner = await troublesomeCollection.methods.ownerOf(this.props.tokenId).call();
        isTroublesome = true;
      }
    } catch(err) {
      // NOOP
    }

    var metadata = undefined;
    try {
      metadata = await fetch(tokenURI).then(resp => resp.json());
    } catch(err) {
      // NOOP
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
      metadata, collectionName, secondsToWithdraw,
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
      isTroublesome, forSalePrice, lastPurchasePrice, originalCollection, troublesomeCollection,
      originalOwner, troublesomeOwner, metadata, collectionName, secondsToWithdraw,
    } = this.externalCache;
    const forSalePriceEth = forSalePrice && this.props.web3.utils.fromWei(forSalePrice.toString(), 'ether');
    const lastPurchasePriceEth = lastPurchasePrice && this.props.web3.utils.fromWei(lastPurchasePrice.toString(), 'ether');
    const isOwner = isTroublesomeOwner || isOriginalOwner;
    const currency = this.props.web3.chain.currency;
    const countdownToWithdraw = countdown(Date.now() + secondsToWithdraw * 1000);
    return (
      <Card style={{width: '36rem'}}>
        <Card.Body>
          {collectionName &&
            <h1>{collectionName} #{this.props.tokenId}</h1>
          }
          <ImageCard tokenURI={tokenURI}/>
          <Table striped bordered hover>
            <tbody>
              <tr>
                <td>Original Collection</td>
                <td>{originalCollection._address}</td>
              </tr>
              { troublesomeCollection &&
                <tr>
                  <td>Troublesome Collection</td>
                  <td>{troublesomeCollection._address}</td>
                </tr>
              }
              <tr>
                <td>Owner</td>
                <td>{troublesomeOwner || originalOwner}</td>
              </tr>
              { metadata && metadata.description &&
                <tr>
                  <td>Description</td>
                  <td>{metadata.description}</td>
                </tr>
              }
              { forSalePrice > 0 &&
                <tr>
                  <td>For sale price</td>
                  <td>{forSalePriceEth} {currency}</td>
                </tr>
              }
              { lastPurchasePrice > 0 &&
                <tr>
                  <td>Last purchase price</td>
                  <td>{lastPurchasePriceEth} {currency}</td>
                </tr>
              }
              { isTroublesome &&
                <tr>
                  <td>Time to withdraw</td>
                  <td>{countdownToWithdraw.toString()}</td>
                </tr>
              }
              <tr>
                <td></td>
                <td><a href={tokenURI}>Metadata</a></td>
              </tr>
            </tbody>
          </Table>
          { isTroublesome &&
            <Card.Title>This NFT is troublesome!</Card.Title>
          }
          { isOwner &&
            <>
              <Card.Subtitle style={{color: "green"}}>You are the owner</Card.Subtitle>
              { (isTroublesome || isDoubleTroubleApproved)
                ?
                  <ListGroup>
                    <ListGroup.Item>
                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon3">
                        New price in {currency}
                      </InputGroup.Text>
                      <FormControl id="new-price" aria-describedby="basic-addon3" onChange={this.localStateLink('inputSalePrice').onChange} value={this.localState.inputSalePrice} />
                    </InputGroup>
                    <Button variant="outline-dark" onClick={() => this.setPrice(parseInt(this.localState.inputSalePrice))}>
                      { forSalePrice === 0 ? "Put up for sale" : "Change price"}
                    </Button>
                  { forSalePrice > 0 &&
                    <Button variant="outline-dark" onClick={() => this.setPrice(0)}>
                      Remove from sale { isTroublesome && "(someone can still force buy it)" }
                    </Button>
                  }
                  </ListGroup.Item>
                  </ListGroup>
                :
                  <>
                    <Card.Text>
                      Please approve the Double Trouble contract before putting your NFT up for sale on our platform.
                    </Card.Text>
                    <Button variant="outline-dark" onClick={this.approveDoubleTrouble}>Approve</Button>
                  </>
              }
            </>
          }
          { forSalePrice > 0 && !isOwner &&
              <Button variant="outline-dark" onClick={this.buy}>Buy for {forSalePriceEth} {currency}</Button>
          }
          { lastPurchasePrice > 0 && !isOwner &&
              <Button variant="outline-dark" onClick={this.forceBuy}>Force buy for {lastPurchasePriceEth * 2} {currency}</Button>
          }
          { !isTroublesome && !isOwner && forSalePrice === 0 &&
              <Card.Text>
                This NFT isn't listed in DoubleTrouble yet, and you don't own it.
              </Card.Text>
          }
          { !isTroublesome &&
            <div style={{marginTop: 10}}>
              <Card.Link href={`https://opensea.io/assets/${originalCollection._address}/${this.props.tokenId}`}>View it on OpenSea</Card.Link>
            </div>
          }
          {secondsToWithdraw <= 0 &&
            <Button variant="success" onClick={this.withdraw}>Withdraw from DoubleTrouble</Button>
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

  withdraw = async () => {
    try {
      const { troublesomeCollection, lastPurchasePrice } = this.externalCache;
      const fee = Math.ceil(lastPurchasePrice / 130) * 2;
      await troublesomeCollection.methods.withdraw(this.props.tokenId)
        .send({from: this.props.web3.defaultAccount, value: fee});
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
