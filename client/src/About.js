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
                Double Trouble is a NFT exchange platform with a catch: you can force buy any NFT in the platform as long as you're willing to pay 2x what the current owner paid for it.
              </ListGroup.Item>
              <ListGroup.Item>
                You can bring existing NFTs into Double Trouble. And if you need liquidity and want to sell an NFT fast
      you can of course always set a price lower than 2x what you paid. Our platform works for any NFT that implements the <a href="https://ethereum.org/en/developers/docs/standards/tokens/erc-721/">ERC-721 interface</a>.
              </ListGroup.Item>
            </ListGroup>
          </ListGroup.Item>
          <ListGroup.Item>
          <Card.Title>How it works</Card.Title>
          <ListGroup variant="flush">
            <ListGroup.Item>
              Under the hood, we create a new Troublesome contract (i.e. Troublesome Collection) out of any existing NFT contract (i.e. Original Collection). Once you bring an NFT into DoubleTrouble, you own it in the Troublesome Collection, but the Troublesome Contract itself owns it from the perspective of the Original Collection. This way, you are still the only de facto owner of the NFT.
            </ListGroup.Item>
            <ListGroup.Item>
              When you first put an NFT up for sale in Double Trouble, you still have a chance to "untrouble" it - i.e. remove it from the Troublesome collection. As soon as someone purchases an NFT in Double Trouble, however, that NFT becomes forever locked in the platform, to forever preserve the 2x force buy functionality for it.
            </ListGroup.Item>
          </ListGroup>
          </ListGroup.Item>
          <ListGroup.Item>
            <Card.Title>TRBL Tokens</Card.Title>
            <ListGroup variant="flush">
              <ListGroup.Item>
                If you're the first person to bring a new NFT collection to DoubleTrouble, we'll mint a special TRBL token just for you. A TRBL token will automatically grant its owner a percentage of all sales that happen for the corresponding Troublesome Collection. TRBL tokens are also ERC-721 NFTs, so they can be bought and sold in regular NFT exchanges, as well as of course in the Double Trouble platform.
              </ListGroup.Item>
            </ListGroup>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
      </Card>;
  };
}

export default About;
