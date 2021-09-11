import React, { Component } from "react";
import doubleTroubleOrchestrator from './orchestrator';
import { Table, Card, CardGroup, Spinner } from "react-bootstrap";
import DoubleTrouble from "./contracts/DoubleTrouble.json";
import ErrorCard from './ErrorCard';
import ImageCard from './ImageCard';


function truncAddr(str, num) {
  if (str.length <= num) {
    return str
  }
  return str.slice(0, num) + '...'
}

class PatronedCollections extends Component {
  constructor(props) {
    super(props);
    this.externalCache = {patronedCollections: undefined};
    this.localState = {};

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

  deriveExternalCache = async () => {
    const dto = await doubleTroubleOrchestrator(this.props.web3);
    const {'1': registeredTroublesomeCollections} = await dto.methods.registeredCollections().call();
    const patronedCollections = await Promise.all(registeredTroublesomeCollections.map(async (troublesomeAddr, i) => {
      const troublesomeCollection = new this.props.web3.eth.Contract(
        DoubleTrouble.abi,
        troublesomeAddr,
      );

      let name, symbol, tokenURI, patron, registeredTokens;
      try {
        name = await troublesomeCollection.methods.name().call();
        symbol = await troublesomeCollection.methods.symbol().call();
        tokenURI = await dto.methods.tokenURI(i).call();
        patron = await dto.methods.patronOfTokenId(i).call();
        registeredTokens = await troublesomeCollection.methods.registeredTokens().call();
      } catch(err) {
        // NOOP
      }

      return {name, symbol, tokenURI, patron, troublesomeAddr, registeredTokens, tokenId: i};
    }));
    return {dto, patronedCollections};
  };

  render() {
    if (this.localState.error !== undefined) {
      return <ErrorCard error={this.localState.error}/>
    }

    if (this.externalCache.patronedCollections === undefined) {
      return <Spinner animation='border'/>
    }

    if (this.externalCache.patronedCollections.length === 0) {
      return <Card style={{width: "36rem"}}>
        <Card.Body>
        <Card.Text>
          No troublesome collections yet
        </Card.Text>
        </Card.Body>
      </Card>
    }

    return (
      <CardGroup style={{width: "72rem"}}>
        { this.externalCache.patronedCollections.map(collection => {
          return (<Card key={collection.troublesomeAddr} style={{width: '24rem'}}>
            <Card.Body>
              <Card.Title>{collection.name}</Card.Title>
              <Card.Subtitle>{collection.symbol}</Card.Subtitle>
              <ImageCard tokenURI={collection.tokenURI}/>

              <div>
                <Card.Link href={`/collections/${collection.troublesomeAddr}`}>View collection</Card.Link>
                <Card.Link href={`/collections/${this.externalCache.dto._address}/${collection.tokenId}`}>View PTRN token</Card.Link>
              </div>
              <Table striped bordered hover>
                <tbody>
                  <tr>
                    <td>Patron</td>
                    <td className="ellipsis-overflow">{truncAddr(collection.patron, 8)}</td>
                  </tr>
                  <tr>
                    <td>NFTs in DoubleTrouble</td>
                    <td>{(collection.registeredTokens ? collection.registeredTokens : []).length}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
              </Card>);
          })
        }
      </CardGroup>
    );
  }
}

export default PatronedCollections;
