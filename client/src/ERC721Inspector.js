import React, { Component } from "react";
import doubleTroubleOrchestrator from './orchestrator';
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import ErrorCard from './ErrorCard';
import ImageCard from './ImageCard';
import { Card, Button, Spinner } from "react-bootstrap";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

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
    if (this.props !== prevProps) {
      this.deriveAndRender();
    }
  };

  refreshPage = () => {
    window.location.reload();
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
    const isOwner = nftOwner && nftOwner === this.props.web3.defaultAccount;

    return {
      dto, nftCollection, troublesomeCollection, nftOwner, isOwner,
      collectionName, collectionSymbol, tokenURI,
    };
  }

  render() {
    var loadedNft = undefined;
    if (this.externalCache.collectionName) {
      loadedNft = <Card style={{width: '36rem'}}>
        <ImageCard tokenURI={this.externalCache.tokenURI} />
        <Card.Subtitle>{this.externalCache.collectionName} ({this.externalCache.collectionSymbol})</Card.Subtitle>
        </Card>;
    }

    if (this.localState.error !== undefined) {
      return <>
          {loadedNft !== undefined ? loadedNft : null}
          <ErrorCard error={this.localState.error}/>
        </>;
    }

    if (this.props.web3 === undefined) {
      return <Spinner animation="border" />;
    }

    if (this.externalCache.troublesomeCollection === ZERO_ADDR) {
      return (<Card style={{width: '36rem'}}>
        {loadedNft}
        <Card.Text>You are the first one to bring an NFT from this collection to DoubleTrouble.</Card.Text>
        <Button variant="outline-dark" onClick={this.makeTroublesomeCollection}>
          Deploy a troublesome collection for it and claim your TRBL token
        </Button>
      </Card>);
    }

    if (this.externalCache.troublesomeCollection === undefined) {
      return <ErrorCard error={this.localState.error} />;
    }
    return (<Card style={{width: "36rem"}}>
      <ImageCard tokenURI={this.externalCache.tokenURI} />
        <Card.Body>
      <Card.Subtitle>{this.externalCache.collectionName} ({this.externalCache.collectionSymbol})</Card.Subtitle>
      <Card.Text>This NFT already has a troublesome Collection.</Card.Text>
      <Card.Link href={`/collections/${this.externalCache.troublesomeCollection}/${this.props.tokenId}`}>View it</Card.Link>
    </Card.Body>
    </Card>);
  }

  makeTroublesomeCollection = async () => {
    try {
      const {dto, collectionName, collectionSymbol} = this.externalCache;
      await dto.methods
        .makeTroublesomeCollection(this.props.collection, collectionName, collectionSymbol)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn("Error when making Troublesome collection");
      console.warn(err);
    }
  };
};

export default ERC721Inspector;
