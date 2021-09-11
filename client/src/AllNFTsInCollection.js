import React, { Component } from 'react';
import ErrorCard from "./ErrorCard";
import ImageCard from "./ImageCard";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import { Table, Spinner, CardGroup, Card } from "react-bootstrap";
import { derivePrice, truncAddr } from './utils';


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

    let originalCollection, collectionName, collectionSymbol, nfts = [];
    try {
      // Fetch collection metadata
      collectionName = await troublesomeCollection.methods.name().call();
      collectionSymbol = await troublesomeCollection.methods.symbol().call();
      const originalAddr = await troublesomeCollection.methods.originalCollection().call();
      originalCollection = new this.props.web3.eth.Contract(
        GenericNFTContract.abi,
        originalAddr,
      );

      // Fetch all NFTs known to Double Trouble
      const allKnownTokens = (await troublesomeCollection.methods.allKnownTokens().call()).map((t) => {
        return {tokenId: parseInt(t.tokenId), lastPurchasePrice: parseInt(t.lastPurchasePrice), forSalePrice: parseInt(t.forSalePrice)}
      });
      nfts = (await Promise.allSettled(allKnownTokens.map(async (t) => {
        const tokenURI = await troublesomeCollection.methods.troublesomeTokenURI(t.tokenId).call();
        let owner;

        // Troublesome NFT
        if (t.lastPurchasePrice > 0) {
          owner = await troublesomeCollection.methods.ownerOf(t.tokenId).call();

        // Regular NFT
        } else {
          owner = await originalCollection.methods.ownerOf(t.tokenId).call();
        }

        return {
          tokenURI, owner,
          tokenId: t.tokenId, lastPurchasePrice: t.lastPurchasePrice, forSalePrice: t.forSalePrice
        }

      // Filter out the NFTs that failed to fetch
      }))).filter((ret) => ret.status == 'fulfilled').map((ret) => ret.value);

    } catch(err) {
      throw new Error('Error retrieving tokens in this collection.');
    }

    return {collectionName, collectionSymbol, nfts};
  }

  render() {
    if (!this.props.web3) {
      return <div>Please connect to a wallet</div>
    }

    if (this.externalCache.nfts === undefined) {
      return <Spinner animation="border"/>
    }

    if (this.localState.error !== undefined) {
      return <ErrorCard error={this.localState.error} />
    }
    const {collectionName, collectionSymbol, nfts} = this.externalCache;

    return (
      <>
        <h1>{collectionName} {collectionSymbol}</h1>
        <CardGroup style={{width: '72rem'}}>
        { nfts.map(nft => {

          const price = derivePrice(nft.forSalePrice, nft.lastPurchasePrice, 2);
          const priceEth = this.props.web3.utils.fromWei(price.toString(), 'ether');
          const currency = this.props.web3.chain.currency;

          return (
            <Card key={nft.tokenId} style={{width: '24rem'}}>
              <Card.Body>
                <Card.Title>{collectionName} #{nft.tokenId}</Card.Title>
                <ImageCard tokenURI={nft.tokenURI}/>
                <Card.Link href={`/collections/${this.props.collection}/${nft.tokenId}`}>View it here</Card.Link>
              </Card.Body>
              <Table striped bordered hover>
                <tbody>
                  <tr>
                    <td>Owner</td>
                    <td>{truncAddr(nft.owner, 8)} {nft.owner == this.props.web3.defaultAccount && "(You!)"}</td>
                  </tr>
                  {price > 0 &&
                    <tr>
                      <td>Price</td>
                      <td>{priceEth} {currency}</td>
                    </tr>
                  }
                </tbody>
              </Table>
            </Card>
          )
        })}
        </CardGroup>
      </>
    );
  };
}

export default AllNFTsInCollection;
