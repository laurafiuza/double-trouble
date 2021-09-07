import React, { Component } from 'react';
import { Form, InputGroup, FormControl, Button, Card } from 'react-bootstrap';
import { Redirect } from 'react-router-dom';

const assert = (bool, msg) => {
  if (!bool) {
    throw new Error(msg || "Assertion failed");
  }
};

class Find extends Component {
  constructor() {
    super();
    this.localState = {
      openseaLink: "",
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
    let pathnameArr;
    try {
      const url = new URL(this.localState.openseaLink);
      assert(url.hostname !== "www.opensea.io", "Invalid domain, please use Opensea");
      pathnameArr = url.pathname.split("/");
      assert(pathnameArr[0] !== "assets", "Invalid Opensea Link");
    } catch (err) {
      this.localState.error = err.message;
      this.forceUpdate();
      return;
    }
    this.localState.redirect = `/collections/${pathnameArr[1]}/${pathnameArr[2]}`;
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
        <Form.Label htmlFor="find-nft">Paste Opensea link below</Form.Label>
        <InputGroup className="mb-3">
          <InputGroup.Text id="basic-addon3">
            https://opensea.io/...
          </InputGroup.Text>
          <FormControl id="find-nft" aria-describedby="basic-addon3" onChange={this.localStateLink('openseaLink').onChange} value={this.localState.openseaLink} />
        </InputGroup>
        <Button onClick={() => this.goToTroublesomePage()}>Find NFT</Button>
        <Card.Text text="danger">{this.localState.error}</Card.Text>
      </Card.Body>
      </Card>
    );
  }
}

export default Find;
