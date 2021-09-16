import React from 'react';
import { Card } from 'react-bootstrap';
import _ from 'lodash';

export default function ImageCard(props: {imageURI: string, style: any}) {
  if (!props.imageURI) {
    return <div></div>;
  }

  return (
    <Card.Img style={_.extend({maxWidth: 300}, props.style)}
      variant="top"
      src={props.imageURI}
      />);
}
