import React, { Component } from "react";
import { Card, Button } from "react-bootstrap";

class ErrorCard extends Component {
  render() {
    return (
      <Card bg="danger" text="white" style={{width: "18rem"}}>
        <Card.Body>
          <Card.Title>Error</Card.Title>
          <Card.Text>{this.props.error}</Card.Text>
        </Card.Body>
        </Card>
    );
  };
}

export default ErrorCard;
