import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import CollectionInspector from "./CollectionInspector";
import About from "./About";
import AllCollections from "./AllCollections";
import { Button, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

class DoubleTrouble extends Component {
  constructor() {
    super();
    this.externalCache = {
      web3: null
    };

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
    const web3 = await getWeb3();
    return {web3}
  };

  render() {
    return (
      <Router>
        <div>
          <ButtonGroup>
            <Button variant="outline-info"><a style={{textDecoration: "none"}} href="/">Home</a></Button>
            <Button variant="outline-info"><a style={{textDecoration: "none"}} href="/collections">All troublesome collections</a></Button>
          </ButtonGroup>
          {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
          <Switch>
            <Route path="/collections/:collection/:tokenId" render={({match}) => {
              return <CollectionInspector web3={this.externalCache.web3}
                collection={match.params.collection} tokenId={match.params.tokenId} />
            }} />
            <Route path="/collections">
              {
                this.externalCache.web3 ? 
                <AllCollections web3={this.externalCache.web3} />
                : <p>boop</p>
              }
            </Route>
            <Route path="/">
              <About />
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}

export default DoubleTrouble;
