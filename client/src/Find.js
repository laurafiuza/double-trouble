import React, { Component } from 'react';
import { Form, InputGroup, FormControl, Button, Card } from 'react-bootstrap';
import { Redirect } from 'react-router-dom';

class Find extends Component {
  constructor() {
    super();
    this.localState = {
      collectionAddress: "",
      tokenId: "",
      error: undefined,
      redirect: null,
    };
  };

  localStateLink = (attr) => {
    return {
      value: this.localState[attr],
      onChange: ((e) => {
        this.localState[attr] = e.target.value;
        this.forceUpdate();
      })
    }
  };

  goToTroublesomePage = () => {
    this.localState.redirect = `/collections/${this.localState.collectionAddress}/${this.localState.tokenId}`;
    this.forceUpdate();
  }

  render() {
    if (this.localState.redirect) {
      return (
        <Redirect to={this.localState.redirect}/>
      );
    }
    return (
      <Card style={{width: '36rem'}}>
        <Card.Body>
        <Form.Label htmlFor="find-nft">Collection Address</Form.Label>
        <InputGroup className="mb-3">
          <FormControl id="find-nft" aria-describedby="basic-addon3" onChange={this.localStateLink('collectionAddress').onChange} value={this.localState.collectionAddress} />
        </InputGroup>
        <Form.Label htmlFor="find-nft">Token ID</Form.Label>
        <InputGroup className="mb-3">
          <FormControl id="find-nft" aria-describedby="basic-addon3" onChange={this.localStateLink('tokenId').onChange} value={this.localState.tokenId}/>
        </InputGroup>
        <Button onClick={() => this.goToTroublesomePage()}>Find NFT</Button>
      </Card.Body>
      </Card>
    );
  }
}

export default Find;
