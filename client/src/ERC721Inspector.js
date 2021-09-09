import React, { Component } from "react";
import doubleTroubleOrchestrator from './orchestrator';
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import ErrorCard from './ErrorCard';
import ImageCard from './ImageCard';
import { Table, Card, Button, Spinner } from "react-bootstrap";
import { Redirect } from "react-router-dom";

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

    const originalCollection = new this.props.web3.eth.Contract(
      GenericNFTContract.abi,
      this.props.collection,
    );

    var troublesomeCollection;
    try {
      troublesomeCollection = await dto.methods.troublesomeCollection(this.props.collection).call();
    } catch(err) {
      throw new Error(`Unable to connect to DoubleTroubleOrchestrator`);
    }
    const collectionName = await originalCollection.methods.name().call();
    const collectionSymbol = await originalCollection.methods.symbol().call();

    var originalOwner, tokenURI;
    try {
      originalOwner = await originalCollection.methods.ownerOf(this.props.tokenId).call();
      tokenURI = await originalCollection.methods.tokenURI(this.props.tokenId).call();
    } catch(_err) {
      throw new Error(`NFT ${this.props.tokenId} not found in collection ${this.props.collection}`)
    }
    const isOwner = originalOwner && originalOwner === this.props.web3.defaultAccount;

    var metadata = undefined;
    try {
      metadata = await fetch(tokenURI).then(resp => resp.json());
    } catch(err) {
      // NOOP
    }

    return {
      dto, originalCollection, troublesomeCollection, originalOwner, isOwner,
      collectionName, collectionSymbol, tokenURI, metadata,
    };
  }

  render() {
    const {originalCollection, metadata} = this.externalCache;

    if (this.props.web3 === undefined || this.externalCache.troublesomeCollection === undefined) {
      return <Spinner animation="border" />;
    }

    if (this.localState.error !== undefined) {
      return <ErrorCard error={this.localState.error}/>
    }

    if (this.externalCache.troublesomeCollection && this.externalCache.troublesomeCollection != ZERO_ADDR) {
      return (<Redirect to={`/collections/${this.externalCache.troublesomeCollection}/${this.props.tokenId}`} />)
    }

    return (
      <Card style={{width: '36rem'}}>
        <Card.Body>
          <ImageCard tokenURI={this.externalCache.tokenURI}/>
          <Table striped bordered hover>
            <tbody>
              { this.externalCache.collectionName &&
                <tr>
                  <td>Collection Name</td>
                  <td>{this.externalCache.collectionName}</td>
                </tr>
              }
              { this.externalCache.collectionSymbol &&
                <tr>
                  <td>Collection Symbol</td>
                  <td>{this.externalCache.collectionSymbol}</td>
                </tr>
              }
              <tr>
                <td>Token ID</td>
                <td>{this.props.tokenId}</td>
              </tr>
              <tr>
                <td>Owner</td>
                <td>{this.externalCache.originalOwner}</td>
              </tr>
              { metadata && metadata.description &&
                <tr>
                  <td>Description</td>
                  <td>{metadata.description}</td>
                </tr>
              }
            </tbody>
          </Table>

          { this.externalCache.troublesomeCollection === ZERO_ADDR &&
            <>
              <Card.Text>You are the first to bring this collection to DoubleTrouble. Click below to become its Patron and receive a % fee for any NFTs from this collection sold within Double Trouble.</Card.Text>
              <Button variant="outline-dark" onClick={this.makeTroublesomeCollection}>
                Innaugurate this troublesome collection and claim your PTRN token
              </Button>
            </>
          }

          <Card.Link href={`https://opensea.io/assets/${originalCollection._address}/${this.props.tokenId}`}>View it on OpenSea</Card.Link>
        </Card.Body>
      </Card>
    );

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
