import React, { Component } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import axios from 'axios';
import _ from 'lodash';

class ImageCard extends Component {
  constructor(props) {
    super(props);
    this.externalCache = {
      image: undefined
    };
    this.localState = {
      error: undefined
    };
  };

  componentDidMount() {
    this.deriveAndRender();
  };

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.deriveAndRender();
    }
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
    if (!this.props.tokenURI) {
      return {};
    }
    try {
      const ret = await axios.get(this.props.tokenURI);
      this.localState.state = 'loaded';
      return { image: ret.data.image };
    } catch(err) {
      this.localState.state = 'failed';
      return {}
    }
  };

  handleImgError = () => {
    this.externalCache.image = null;
    this.forceUpdate();
  };

  render() {
    /* Loading */
    if (this.localState.state === 'loading') {
      return <Spinner animation="border" />;
    }
    /* Image source is not valid */
    if (this.localState.state === 'failed') {
      return <div>Unable to load image. See <a href={this.props.tokenURI}>metadata</a></div>
    }
    return (
      <Card.Img style={_.extend({maxWidth: 300}, this.props.style)}
        onError={() => this.handleImgError()}
        variant="top"
        src={this.externalCache.image}
        />);
  };
}

export default ImageCard;
