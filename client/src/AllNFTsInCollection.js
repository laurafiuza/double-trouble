import React, { Component } from 'react';
import ErrorCard from "./ErrorCard";
import ImageCard from "./ImageCard";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import { Spinner, CardGroup, Card } from "react-bootstrap";

class AllNFTsInCollection extends Component {
  constructor(props) {
    super(props);
    this.externalCache = {
      nfts: undefined,
    };
    this.localState = {
      error: undefined,
    }

    this.deriveAndRender();
  };

  deriveAndRender = () => {
    this.deriveExternalCache().then((ret) => {
      this.externalCache = ret;
      this.forceUpdate();
    }).catch((err) => {
      console.log(err);
      this.localState.error = err.message;
      this.forceUpdate();
    });
  };

  deriveExternalCache = async () => {
    const troublesomeCollection = new this.props.web3.eth.Contract(
      DoubleTroubleContract.abi,
      this.props.collection,
    );

    let nfts = [];

    try {
      const tokenIds = await troublesomeCollection.methods.registeredTokens().call();
      for (const id of tokenIds) {
        const tokenURI = await troublesomeCollection.methods.troublesomeTokenURI(id).call();
        const originalAddr = await troublesomeCollection.methods.originalCollection().call();
        const originalCollection = new this.props.web3.eth.Contract(
          GenericNFTContract.abi,
          originalAddr,
        );
        const name = await originalCollection.methods.name().call();
        const symbol = await originalCollection.methods.symbol().call();
        nfts = [...nfts, {tokenId: id, tokenURI, name, symbol}];
      }

    } catch(err) {
      throw new Error('Error retrieving registered tokens in this collection.');
    }

    return {nfts};
  }

  render() {
    if (this.externalCache.nfts === undefined) {
      return <Spinner animation="border"/>
    }

    if (this.localState.error !== undefined) {
      return <ErrorCard error={this.localState.error} />
    }

    return (<CardGroup style={{width: '72rem'}}>
      { this.externalCache.nfts.map(nft => {
        return (
          <Card style={{width: '24rem'}}>
            <Card.Body>
              <ImageCard tokenURI={nft.tokenURI}/>
              <Card.Title>{nft.name}</Card.Title>
              <Card.Subtitle>{nft.symbol}</Card.Subtitle>
              <Card.Link href={`/collections/${this.props.collection}/${nft.tokenId}`}>View it here</Card.Link>
            </Card.Body>
          </Card>
        )
      })}
      </CardGroup>);
  };
}

export default AllNFTsInCollection;
