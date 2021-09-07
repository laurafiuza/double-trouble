import React, {Component} from "react";
import doubleTroubleOrchestrator from './orchestrator';
import { Card, CardGroup } from "react-bootstrap";
import ImageCard from './ImageCard';
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";

class AllCollections extends Component {
  constructor(props) {
    super(props);
    // TODO: delete collections from externalCache, only use nfts
    this.externalCache = {collections: [], nfts: {}, web3: null};
    this.localState = {};

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
    const dto = await doubleTroubleOrchestrator(this.props.web3);
    const collections = await dto.methods.registeredCollections().call();
    let nfts = {};
    const flatCollections = Object.values(collections).flat();
    for (const collection of flatCollections) {
      console.log("collection");
      console.log(collection);
      const troublesomeCollection = new this.props.web3.eth.Contract(
        DoubleTroubleContract.abi,
        collection,
      );
      console.log("troublesomeCollection");
      console.log(troublesomeCollection.methods.registeredTokens());
      const registeredTokens = await troublesomeCollection.methods.registeredTokens().call();
      // TODO: registered tokens is not printing to console log, debug
      nfts[collection] = registeredTokens;
    }
    return {nfts, collections, web3: this.props.web3};
  };

  render() {
    const originalCollection = "boop";
    const tokenId = 0;
    if (this.externalCache.collections.length === 0) {
      return <Card style={{width: "36rem"}}>
        <Card.Body>
        <Card.Title>Double Trouble</Card.Title>
        <Card.Text>
          No troublesome collections yet
        </Card.Text>
        </Card.Body>
      </Card>
    }

    return (
      <>
      <CardGroup style={{width: "72rem"}}>
      {this.externalCache.collections.map((collection) =>
        <>
        <Card style={{width: "24rem"}}>
          <ImageCard tokenURI={"https://api.artblocks.io/token/0"}/>
          <Card.Body>
            <Card.Title>
              Collection Title
            </Card.Title>
            <Card.Subtitle>
              SYMB
            </Card.Subtitle>
            <Card.Link href={`/collections/${originalCollection}/${tokenId}`}>View it here</Card.Link>
            <Card.Footer>
              <small className="text-muted">Last updated 3 mins ago</small>
            </Card.Footer>
          </Card.Body>
        </Card>
        <Card style={{width: "24rem"}}>
          <ImageCard tokenURI={"https://api.artblocks.io/token/1"}/>
          <Card.Body>
            <Card.Title>
              Collection Title
            </Card.Title>
            <Card.Subtitle>
              SYMB
            </Card.Subtitle>
            <Card.Link href={`/collections/${originalCollection}/${tokenId}`}>View it here</Card.Link>
            <Card.Footer>
              <small className="text-muted">Last updated 3 mins ago</small>
            </Card.Footer>
          </Card.Body>
        </Card>
        <Card style={{width: "24rem"}}>
          <ImageCard tokenURI={"https://api.artblocks.io/token/2"}/>
          <Card.Body>
            <Card.Title>
              Collection Title
            </Card.Title>
            <Card.Subtitle>
              SYMB
            </Card.Subtitle>
            <Card.Link href={`/collections/${originalCollection}/${tokenId}`}>View it here</Card.Link>
            <Card.Footer>
              <small className="text-muted">Last updated 3 mins ago</small>
            </Card.Footer>
          </Card.Body>
        </Card>
        </>
      )}
      </CardGroup>
      </>
    );
  }
}

export default AllCollections;
