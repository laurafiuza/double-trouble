import React, { Component } from "react";
import { Card, ListGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

class About extends Component {
  render() {
    return <Card style={{width: '36rem'}}>
      <Card.Body>
        <Card.Title>About</Card.Title>
          <ListGroup>
          <ListGroup.Item>
            <Card.Title>About</Card.Title>
            <ListGroup variant="flush">
              <ListGroup.Item>
                Any NFT that has been put up for sale on
                Double Trouble can be purchased for 2x the last purchase price
                of the NFT — even if it’s not for sale!!
                (Otherwise it will stay there “forever”).
              </ListGroup.Item>
              <ListGroup.Item style={{fontStyle: "italic"}}>
                Our platform currently works for Polygon and Ethereum and
                any NFT that is ERC 721.
              </ListGroup.Item>
            </ListGroup>
          </ListGroup.Item>
          <ListGroup.Item>
          <Card.Title>How it works</Card.Title>
          <ListGroup variant="flush">
            <ListGroup.Item>
              Just go to double-trouble.io/collections/[collection-address]/[token-id]
              and click “put up for sale” and choose the initial price
              that it could be purchased.
            </ListGroup.Item>
            <ListGroup.Item>
              If it’s not purchased yet, you can still redeem your NFT.
            </ListGroup.Item>
            <ListGroup.Item>
              Once NFT is purchased, "the fun" begins: either the NFT will be bought again
              for "twice the previous price paid", or it will be stuck there "forever"...
            </ListGroup.Item>
            <ListGroup.Item>
              You can still “lower the selling price” as much as you want
              - and hope for someone to buy it. 
            </ListGroup.Item>
          </ListGroup>
          </ListGroup.Item>
          <ListGroup.Item>
          <Card.Title>What happens if you don't find your NFT collection?</Card.Title>
          <ListGroup variant="flush">
            <ListGroup.Item>
              Be the first to create a NFT collection and win a
              Double Trouble premium historical NFT series.
            </ListGroup.Item>
          </ListGroup>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
      </Card>;
  };
}

export default About;
