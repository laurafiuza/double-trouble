import React, { useContext, useState } from 'react'
import { useContractCall, useContractFunction, useEthers } from '@usedapp/core'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import GenericNFTContract from '../abi/IERC721Metadata.json'
import { utils } from 'ethers'
import { Label } from '../typography/Label'
import { Text, TextInline } from '../typography/Text'
import { AccountButton } from '../components/account/AccountButton'
import ImageCard from '../components/ImageCard';
import { Subtitle, Title } from '../typography/Title'
import styled from 'styled-components'
import { Button } from '../components/base/Button'
import { Colors, BorderRad, Transitions } from '../global/styles'
import { Table, Form, InputGroup, FormControl, Card } from 'react-bootstrap';
import { Contract } from '@ethersproject/contracts'
import { DoubleTroubleContext } from '../DoubleTrouble';

export function List() {
  const { chainId, active, account } = useEthers();
  const [collection, setCollection] = useState('');
  const [tokenId, setTokenId] = useState(0);
  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title>List your NFT</Title>
            <AccountButton />
          </SectionRow>
          <ContentBlock>
            <ContentRow>
              <InputGroup className="mb-3">
                <InputGroup.Text>Collection Address</InputGroup.Text>
                <FormControl id="find-nft" aria-describedby="basic-addon3"
                  onChange={(e) => setCollection(e.target.value)}  value={collection || ''} />
              </InputGroup>

              <InputGroup className="mb-3">
                <InputGroup.Text>Token Id</InputGroup.Text>
                <FormControl type="number" id="find-nft" aria-describedby="basic-addon3"
                  onChange={(e) => setTokenId(e.target.value ? parseInt(e.target.value) : 0)}  value={tokenId} />
              </InputGroup>

              {active && collection ?
                (utils.isAddress(collection)
                  ? <NFTViewer collection={collection} tokenId={tokenId} />
                  : <Text>Address {collection} is invalid</Text>
                )
              : ''}
            </ContentRow>
          </ContentBlock>
        </Section>
      </Container>
    </MainContent>
  )
}

function NFTViewer(props: {collection: string, tokenId: number}) {
  const { chainId, account, library } = useEthers();
  const dtAddr = useContext(DoubleTroubleContext);

  const nftContract = new Contract(props.collection, new utils.Interface(GenericNFTContract.abi), library);

  const useNFTCall = (method: string, args: any[]) => {
    return useContractCall({
      abi: nftContract.interface,
      address: props.collection,
      method: method,
      args: args,
    });
  };

  const collectionName = useNFTCall('name', []);
  const collectionSymbol = useNFTCall('symbol', []);
  const owner = useNFTCall('ownerOf', [props.tokenId]);
  const approved = useNFTCall('getApproved', [props.tokenId]);
  const tokenURI = useNFTCall('tokenURI', [props.tokenId]);

  const { state, send } = useContractFunction(nftContract, 'approve', { transactionName: 'approve' })
  console.log(state)
  const approve = () =>
    send(dtAddr, props.tokenId);

  if (!owner) {
    return (
      <>
        <Title>Ops</Title>
        <Text>Could not find token {props.tokenId} in collection {props.collection}. Are you connected to the right Network?</Text>
        <Text>Currently connected to chain {chainId}</Text>
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
          <tr>
            <td>Approved</td>
            <td>{approved}</td>
          </tr>
        </tbody>
      </Table>
      {owner[0] == account &&
        <>
          <Subtitle style={{color: "green"}}>You are the owner</Subtitle>
          {approved && dtAddr == approved[0]
            ?
              <>
                <Text>Put it up for sale in Double Trouble</Text>
                <SmallButton onClick={approve}>Put up for sale</SmallButton>
              </>
            :
              <>
                <Text>Approve DoubleTrouble to operate this token before listing it</Text>
                <SmallButton onClick={approve}>Approve</SmallButton>
              </>
          }
        </>
      }
      <a href={`https://opensea.io/assets/${props.collection}/${props.tokenId}`}>View it on OpenSea</a>
    </>
  );
}

const LabelRow = styled.div`
  display: flex;
  margin: 32px 0 24px 0;
`

const FormTicker = styled.div`
  padding: 0 8px;
`

const SmallButton = styled(Button)`
  display: flex;
  justify-content: center;
  min-width: 95px;
  height: 100%;
  padding: 8px 24px;

  &:disabled {
    color: ${Colors.Gray['600']};
    cursor: unset;
  }

  &:disabled:hover,
  &:disabled:focus {
    background-color: unset;
    color: unset;
  }
`

const Input = styled.input`
  height: 100%;
  width: 120px;
  padding: 0 0 0 24px;
  border: 0;
  border-radius: ${BorderRad.m};
  -moz-appearance: textfield;
  outline: none;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-background-clip: text;
  }
`

const AddressInput = styled(Input)`
  width: 401px;
  padding: 0 0 0 38px;
`

const InputRow = styled.div`
  height: 44px;
  display: flex;
  margin: 0 auto;
  color: ${Colors.Gray['600']};
  align-items: center;
  border: ${Colors.Gray['300']} 1px solid;
  border-radius: ${BorderRad.m};
  overflow: hidden;
  transition: ${Transitions.all};

  &:hover,
  &:focus-within {
    border-color: ${Colors.Black[900]};
  }
`
