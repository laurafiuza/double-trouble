import React, { Component } from "react";
import doubleTroubleOrchestrator from './orchestrator';
import { Card, CardGroup, Spinner } from "react-bootstrap";
import GenericNFTContract from "./contracts/IERC721Metadata.json";

class AllCollections extends Component {
  constructor(props) {
    super(props);
    this.externalCache = {collections: undefined};
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
    // TODO: wrap in try catch?
    const dto = await doubleTroubleOrchestrator(this.props.web3);
    const registeredCollections = await dto.methods.registeredCollections().call();
    let collections = [];
    for (const collection of registeredCollections['1']) {
      const originalCollection = new this.props.web3.eth.Contract(
        GenericNFTContract.abi,
        collection,
      );

      const name = await originalCollection.methods.name().call();
      const symbol = await originalCollection.methods.symbol().call();
      collections = [...collections, {address: collection, name, symbol}];
    }
    return {collections};
  };

  render() {
    if (this.externalCache.collections === undefined) {
      return <Spinner animation='border'/>
    }

    if (this.externalCache.collections.length === 0) {
      return <Card style={{width: "36rem"}}>
        <Card.Body>
        <Card.Text>
          No troublesome collections yet
        </Card.Text>
        </Card.Body>
      </Card>
    }

    return (
      <CardGroup style={{width: "72rem"}}>
        { this.externalCache.collections.map(collection => {
          return (<Card style={{width: '24rem'}}>
            <Card.Body>
              <Card.Title>{collection.name}</Card.Title>
              <Card.Subtitle>{collection.symbol}</Card.Subtitle>
              <Card.Link href={`/collections/${collection.address}`}>View it here</Card.Link>
            </Card.Body>
              </Card>);
          })
        }
      </CardGroup>
    );
  }
}

export default AllCollections;
