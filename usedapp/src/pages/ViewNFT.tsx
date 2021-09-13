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
  const { active } = useEthers()
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
  const tokenURI = useContractCall({
    abi: new utils.Interface(GenericNFTContract.abi),
    address: props.collection,
    method: 'tokenURI',
    args: [props.tokenId],
  });

  const collectionName = useContractCall({
    abi: new utils.Interface(GenericNFTContract.abi),
    address: props.collection,
    method: 'name',
    args: [],
  });

  const collectionSymbol = useContractCall({
    abi: new utils.Interface(GenericNFTContract.abi),
    address: props.collection,
    method: 'symbol',
    args: [],
  });

  const owner = useContractCall({
    abi: new utils.Interface(GenericNFTContract.abi),
    address: props.collection,
    method: 'ownerOf',
    args: [props.tokenId],
  });

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
