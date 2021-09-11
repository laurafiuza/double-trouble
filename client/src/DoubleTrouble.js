import MetaMaskOnboarding from '@metamask/onboarding';
import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import CollectionInspector from "./CollectionInspector";
import About from "./About";
import Find from "./Find";
import PatronedCollections from "./PatronedCollections";
import { Badge, Navbar, Container, Nav, Button } from 'react-bootstrap';
import ErrorCard from "./ErrorCard";
import AllNFTsInCollection from "./AllNFTsInCollection";
import 'bootstrap/dist/css/bootstrap.min.css';

function EnsureConnected(props) {
  if (!props.web3) {
    return <div>Please connect to your wallet...</div>;
  }

  if (props.web3.chain === undefined || props.web3.chain.orchestratorAddr === undefined) {
    return <>
      <h2>Ops</h2>
      <div>Network with Chain ID {props.web3.chainId} not supported. Please connect your wallet to a different network.</div>
      </>;
  }

  return props.children;
}

class DoubleTrouble extends Component {
  constructor() {
    super();
    this.externalCache = {
      web3: null
    };
    this.localState = {
      loaded: false,
      shouldLoadWeb3: false,
      onboarding: new MetaMaskOnboarding(),
      error: undefined
    };

    // Keep connected to Metamask after user connected once
    // FIXME what if window.ethereum doesnt exist here?
    window.ethereum.on('connect', this.connect);
  };

  useEffect() {
    if (this.externalCache.web3 && !this.localState.loaded) {
      // Listen to Metamask changes and refresh everything
      window.ethereum.on('accountsChanged', this.deriveAndRender);
      window.ethereum.on('chainChanged', this.deriveAndRender);

      window.ethereum.on('disconnected', () => {
        this.localState.error = 'Wallet disconnected. Please reconnect and refresh.'
        this.forceUpdate();
      });
      this.localState.loaded = true;
    }
  }

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
    const web3 = this.localState.shouldLoadWeb3 ? (await getWeb3()) : null;
    return {web3};
  };

  render() {
    if (this.localState.error !== undefined) {
      return <ErrorCard error={this.localState.error} />;
    }


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
                    <Button><a style={{textDecoration: "none", color: "white"}} href="/find">List your NFT in Double Trouble</a></Button>
                  </Nav>
                </Navbar.Collapse>
            </Container>
            <Container style={{width: 330}}>
              { this.externalCache.web3
                ?
                  <>
                    <div style={{textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>
                      Wallet: {this.externalCache.web3.accounts[0]}
                    </div>
                    <Badge className="bg-info">{this.externalCache.web3.chain.name}</Badge>
                  </>
                :
                <Button disabled={this.localState.shouldLoadWeb3} onClick={this.connect}>Connect with Metamask</Button>
              }
            </Container>
            </Navbar>
            {/* A <Switch> looks through its children <Route>s and
                renders the first one that matches the current URL. */}
            <Switch>
              <Route path="/collections/:collection/:tokenId" render={({match}) => {
                return (
                  <EnsureConnected web3={this.externalCache.web3}>
                    <CollectionInspector web3={this.externalCache.web3} collection={match.params.collection} tokenId={match.params.tokenId} />
                  </EnsureConnected>
                );
              }} />
              <Route path="/collections/:collection" render={({match}) => {
                return (
                  <EnsureConnected web3={this.externalCache.web3}>
                    <AllNFTsInCollection web3={this.externalCache.web3} collection={match.params.collection} />
                  </EnsureConnected>
                );
              }} />
              <Route path="/collections">
                <EnsureConnected web3={this.externalCache.web3}>
                  <PatronedCollections web3={this.externalCache.web3} />
                </EnsureConnected>
              </Route>
              <Route path="/find">
                <EnsureConnected web3={this.externalCache.web3}>
                  <Find />
                </EnsureConnected>
              </Route>
              <Route path="/">
                <About />
              </Route>
            </Switch>
          </div>
        </Router>
    );
  }

  connect = () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      this.localState.shouldLoadWeb3 = true;
      this.forceUpdate();
      this.deriveAndRender();
    } else {
      this.localState.onboarding.startOnboarding();
    }
  }
}

export default DoubleTrouble;
