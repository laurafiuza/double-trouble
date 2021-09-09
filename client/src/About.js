import React, { Component } from "react";
import { Card, ListGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

class About extends Component {
  render() {
    return <Card style={{width: '36rem'}}>
      <Card.Body>
          <ListGroup>
          <ListGroup.Item>
            <Card.Title>About</Card.Title>
            <ListGroup variant="flush">
              <ListGroup.Item>
                Double Trouble is an NFT exchange platform with a catch: you can force buy any NFT in the platform as long as you're willing to pay 2x what the current owner paid for it.
              </ListGroup.Item>
              <ListGroup.Item>
                You can list existing NFTs you own for sale in Double Trouble. Our platform works for any NFT that implements the <a href="https://ethereum.org/en/developers/docs/standards/tokens/erc-721/">ERC-721 interface</a>.
              </ListGroup.Item>
            </ListGroup>
          </ListGroup.Item>
          <ListGroup.Item>
          <Card.Title>How it works</Card.Title>
          <ListGroup variant="flush">
            <ListGroup.Item>
              Under the hood, we create a new Troublesome contract (i.e. Troublesome Collection) out of any existing NFT contract (i.e. Original Collection). Once you buy an NFT within DoubleTrouble, you own it in the Troublesome Collection, but the Troublesome Contract itself owns it from the perspective of the Original Collection. This way, you are still the only de facto (human) owner of the NFT.
            </ListGroup.Item>
            <ListGroup.Item>
              You can list an existing NFT for sale within Double Trouble without any commitments. However, as soon as someone purchases it, that NFT becomes forever locked in the platform - so anyone wanting to buy it from the new owner needs to do so in Double Trouble moving forward - so as to forever preserve the 2x force buy functionality for that NFT.
            </ListGroup.Item>
          </ListGroup>
          </ListGroup.Item>
          <ListGroup.Item>
            <Card.Title>Patron Tokens</Card.Title>
            <ListGroup variant="flush">
              <ListGroup.Item>
                If you're the first person to bring a new NFT collection to DoubleTrouble, we'll mint a special PTRN token just for you. The owner of a PTRN token is the Patron of the collection, and will automatically get ~0.75% of the value of all NFT sales in Double Trouble corresponding to that collection.
              </ListGroup.Item>
              <ListGroup.Item>
              Patronage can change hands. PTRN tokens are also ERC-721 NFTs, so they can be bought and sold in regular NFT exchanges, as well as of course in Double Trouble.
              </ListGroup.Item>
            </ListGroup>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
      </Card>;
  };
}

export default About;
