import React, {Component} from "react";
import doubleTroubleOrchestrator from './orchestrator';
import { Card, CardGroup } from "react-bootstrap";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";

class AllCollections extends Component {
  constructor(props) {
    super(props);
    // TODO: delete collections
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
    for (const collection of collections) {
      const troublesomeCollection = new this.props.web3.eth.Contract(
        DoubleTroubleContract.abi,
        collection,
      );
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
        <Card.Header as="h5">Double Trouble</Card.Header>
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
          <Card.Img variant="top" src="https://lh3.googleusercontent.com/xZ4a3gbXAj9J-a5w8H5TIXJyZwQipIGybjXo1LMxafy3PCo71XaSmQ_c2p55tMlek3RoHz_cBZkS0t4si02D7YrZW7Iyzk2NjNo0tQ=s0"/>
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
          <Card.Img variant="top" src="https://lh3.googleusercontent.com/xZ4a3gbXAj9J-a5w8H5TIXJyZwQipIGybjXo1LMxafy3PCo71XaSmQ_c2p55tMlek3RoHz_cBZkS0t4si02D7YrZW7Iyzk2NjNo0tQ=s0"/>
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
          <Card.Img variant="top" src="https://lh3.googleusercontent.com/xZ4a3gbXAj9J-a5w8H5TIXJyZwQipIGybjXo1LMxafy3PCo71XaSmQ_c2p55tMlek3RoHz_cBZkS0t4si02D7YrZW7Iyzk2NjNo0tQ=s0"/>
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
