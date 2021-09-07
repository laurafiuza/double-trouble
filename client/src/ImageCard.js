import React, { Component } from 'react';
import { Card, Spinner } from 'react-bootstrap';

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
    const image = await fetch(this.props.tokenURI)
      .then(resp => resp.json())
      .then(data => data.image);

    return { image }; 
  };

  handleImgError = () => {
    this.externalCache.image = null;
    this.forceUpdate();
  };

  render() {
    /* Loading */
    if (this.externalCache.image === undefined) {
      return <Spinner animation="border" />;
    }
    /* Image source is not valid */
    if (this.externalCache.image === null) {
      return null;
    }
    return (
      <Card.Img
        onError={() => this.handleImgError()} 
        variant="top"
        src={this.externalCache.image}
        />); 
  };
}

export default ImageCard;
