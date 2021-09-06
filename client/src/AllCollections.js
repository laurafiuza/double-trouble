import React, {Component} from "react";
import doubleTroubleOrchestrator from './orchestrator';
import { Card } from "react-bootstrap";

class AllCollections extends Component {
  constructor(props) {
    super(props);
    this.externalCache = {collections: []};
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
    console.log("inside");
    const dto = await doubleTroubleOrchestrator(this.props.web3);
    const collections = await dto.methods.registeredCollections().call();
    return {collections}
  };

  render() {
    console.log("beep");
    console.log(this.props);
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
      <div>
      {this.externalCache.collections.map((collection) =>
        <div>{collection}</div>
      )}
      </div>
    );
  }
}

export default AllCollections;
