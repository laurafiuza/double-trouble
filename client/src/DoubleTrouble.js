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
import { Spinner, Navbar, Container, Nav } from 'react-bootstrap';
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
            <Navbar bg="light" expand="lg">
              <Container>
                <Navbar.Brand href="/">Double Trouble</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                  <Nav className="me-auto">
                    <Nav.Link href="/">Home</Nav.Link>
                    <Nav.Link href="/collections">All collections</Nav.Link>
                  </Nav>
                </Navbar.Collapse>
            </Container>
            </Navbar>
            {/* A <Switch> looks through its children <Route>s and
                renders the first one that matches the current URL. */}
            <Switch>
              <Route path="/collections/:collection/:tokenId" render={({match}) => {
                return <CollectionInspector web3={this.externalCache.web3}
                  collection={match.params.collection} tokenId={match.params.tokenId} />
              }} />
              <Route path="/collections">
                {
                  this.externalCache.web3
                    ? 
                  <AllCollections web3={this.externalCache.web3} />
                    :
                  <Spinner animation="border" />
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
