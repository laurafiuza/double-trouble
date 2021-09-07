import React, { Component } from "react";
import GenericNFTContract from "./contracts/IERC721Metadata.json";
import ERC721Inspector from './ERC721Inspector';
import TroublesomeCollectionInspector from './TroublesomeCollectionInspector';
import { Spinner } from 'react-bootstrap';
import ErrorCard from './ErrorCard';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

class CollectionInspector extends Component {
  constructor() {
    super();
    this.localState = {error: undefined};
    this.externalCache = {};
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props !== prevProps) {
      this.deriveAndRender();
    }
  };

  componentDidMount() {
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

  refreshPage = () => {
    window.location.reload();
  };

  deriveExternalCache = async () => {
    if (!this.props.web3) {
      return {};
    }

    const nftCollection = new this.props.web3.eth.Contract(
      GenericNFTContract.abi,
      this.props.collection,
    );

    var isTroublesome, isERC721 = false;
    try {
      await nftCollection.methods.name().call();
      await nftCollection.methods.symbol().call();
      isERC721 = true;
    } catch(err) {
      throw new Error(`Invalid ERC721 address ${this.props.collection}`);
    }

    try {
      isTroublesome = await nftCollection.methods.supportsInterface("0xdeadbeef").call();
    } catch(err) {
      isTroublesome = false;
    }

    return {isTroublesome, isERC721}
  };

  render() {
    if (this.localState.error) {
      return <ErrorCard error={this.localState.error}/>
    } else if (this.externalCache.isTroublesome) {
      return <TroublesomeCollectionInspector web3={this.props.web3}
        collection={this.props.collection} tokenId={this.props.tokenId} />;
    } else if (this.externalCache.isERC721) {
      return <ERC721Inspector web3={this.props.web3}
        collection={this.props.collection} tokenId={this.props.tokenId} />;
    } else {
      return <Spinner animation="border" />;
    }
  };
}


export default CollectionInspector;
