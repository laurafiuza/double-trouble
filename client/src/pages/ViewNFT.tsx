import React from 'react'
import { useContractCall, useEthers } from '@usedapp/core'
import { utils } from 'ethers'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import { Label } from '../typography/Label'
import { TextInline } from '../typography/Text'
import { Title } from '../typography/Title'
import GenericNFTContract from '../abi/IERC721Metadata.json'
import { Table } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import { AccountButton } from '../components/account/AccountButton'
import ImageCard from '../components/ImageCard';


export function ViewNFT(props: {collection: string, tokenId: number}) {
  const { active, account } = useEthers()
  console.log(active, account)
  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title> </Title>
            <AccountButton />
          </SectionRow>
          <ContentBlock>
            <ContentRow>
            {active &&
              <NFTViewer collection={props.collection} tokenId={props.tokenId} />
            }
            </ContentRow>
          </ContentBlock>
        </Section>
      </Container>
    </MainContent>
  );
}

function NFTViewer(props: {collection: string, tokenId: number}) {
  const { chainId } = useEthers();

  const useNFTCall = (method: string, args: any[]) => {
    return useContractCall({
      abi: new utils.Interface(GenericNFTContract.abi),
      address: props.collection,
      method: method,
      args: args,
    });
  };

  const collectionName = useNFTCall('name', []);
  const collectionSymbol = useNFTCall('symbol', []);
  const owner = useNFTCall('ownerOf', [props.tokenId]);
  const tokenURI = useNFTCall('tokenURI', [props.tokenId]);

  if (!owner) {
    return (
      <>
        <Title>Ops</Title>
        <div>Could not find token {props.tokenId} in collection {props.collection}. Are you connected to the right Network?</div>
        <div>Currently connected to chain {chainId}</div>
      </>
    );
  }

  return (
    <>
      <Title>{collectionName} #{props.tokenId}</Title>
      <ImageCard tokenURI={tokenURI}/>
      <Table striped bordered hover>
        <tbody>
          { collectionName &&
            <tr>
              <td>Collection Name</td>
              <td>{collectionName}</td>
            </tr>
          }
          { collectionSymbol &&
            <tr>
              <td>Collection Symbol</td>
              <td>{collectionSymbol}</td>
            </tr>
          }
          <tr>
            <td>Token ID</td>
            <td>{props.tokenId}</td>
          </tr>
          <tr>
            <td>Owner</td>
            <td>{owner}</td>
          </tr>
        </tbody>
      </Table>
    </>
  );
}
