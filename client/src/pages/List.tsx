import React, { useContext, useState } from 'react'
import { useContractCall, useContractFunction, useEthers } from '@usedapp/core'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import GenericNFTContract from '../abi/IERC721Metadata.json'
import DoubleTroubleContract from '../abi/DoubleTrouble.json'
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
import { BigNumber } from '@ethersproject/bignumber'
import { DoubleTroubleContext } from '../DoubleTrouble';
import { Link } from '../components/base/Link'
import { ShareIcon } from '../components/Transactions/Icons'
import countdown from 'countdown';

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

const _useContractCall = (arg: any) => {
  const ret = useContractCall(arg);
  return ret === undefined ? undefined : ret[0];
}

function NFTViewer(props: {collection: string, tokenId: number}) {
  const { chainId, account, library } = useEthers();
  const dtAddr = useContext(DoubleTroubleContext);

  const nftContract = new Contract(props.collection, new utils.Interface(GenericNFTContract.abi), library);
  const dtContract = new Contract(dtAddr, new utils.Interface(DoubleTroubleContract.abi), library);

  const useNFTCall = (method: string, args: any[]) => {
    return _useContractCall({
      abi: nftContract.interface,
      address: props.collection,
      method: method,
      args: args,
    });
  };

  const useDTCall = (method: string, args: any[]) => {
    return _useContractCall({
      abi: dtContract.interface,
      address: dtAddr,
      method: method,
      args: args,
    });
  };

  // Local state
  const [salePrice, setSalePrice] = useState('1.0');

  // Read from NFT contract
  const collectionName = useNFTCall('name', []);
  const collectionSymbol = useNFTCall('symbol', []);
  const originalOwner = useNFTCall('ownerOf', [props.tokenId]);
  const approved = useNFTCall('getApproved', [props.tokenId]);
  const tokenURI = useNFTCall('tokenURI', [props.tokenId]);

  // Write to NFT contract
  const { state: approveState, send: approveSend } = useContractFunction(nftContract, 'approve', { transactionName: 'approve' })
  const approve = () => {
    approveSend(dtAddr, props.tokenId);
  }

  // Read from DT contract
  const forSalePrice = useDTCall('forSalePrice', [props.collection, props.tokenId]);
  const lastPurchasePrice = useDTCall('lastPurchasePrice', [props.collection, props.tokenId]);
  const secondsToWithdraw = useDTCall('secondsToWithdraw', [props.collection, props.tokenId]);
  const troublesomeOwner = useDTCall('ownerOf', [props.collection, props.tokenId]);

  // Write to DT contract
  const { state: setPriceState, send: setPriceSend} = useContractFunction(dtContract, 'setPrice', { transactionName: 'setPrice' })
  const setPrice = (newPrice: string) => {
    setPriceSend(props.collection, props.tokenId, utils.parseEther(newPrice))
  }

  const { state: buyState, send: buySend} = useContractFunction(dtContract, 'buy', { transactionName: 'buy' })
  const buy = () => {
    buySend(props.collection, props.tokenId, {value: forSalePrice})
  }

  const { state: forceBuyState, send: forceBuySend} = useContractFunction(dtContract, 'forceBuy', { transactionName: 'forceBuy' })
  const forceBuy = () => {
    forceBuySend(props.collection, props.tokenId, {value: lastPurchasePrice.mul(2)})
  }

  // Derived variables
  const countdownToWithdraw = countdown(Date.now() + secondsToWithdraw * 1000);
  const isTroublesome = originalOwner == dtAddr;
  const owner = isTroublesome ? troublesomeOwner : originalOwner;
  const bignumMin = (bn1: BigNumber, bn2: BigNumber) =>
    bn1.gt(bn2) ? bn2 : bn1
  const calculateEffectivePrice = (forSalePrice: BigNumber, lastPurchasePrice: BigNumber) => {
    if (lastPurchasePrice.gt(0) && forSalePrice.gt(0)) {
      return bignumMin(lastPurchasePrice.mul(2), forSalePrice)
    } else if (lastPurchasePrice.eq(0) && forSalePrice.gt(0)) {
      return forSalePrice;
    } else if (lastPurchasePrice.gt(0) && forSalePrice.eq(0)) {
      return lastPurchasePrice.mul(2);
    } else {
      return BigNumber.from(0);
    }
  };
  const effectivePrice = calculateEffectivePrice(forSalePrice ?? BigNumber.from(0), lastPurchasePrice ?? BigNumber.from(0));

  if (!originalOwner) {
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
      <div style={{position: 'relative'}}>
        <Title>{collectionName} #{props.tokenId}</Title>
        <LinkWrapper style={{position: 'absolute', right: 0, margin: 0, top: 10}}>
          <Link href={`https://opensea.io/assets/${props.collection}/${props.tokenId}`} target="_blank" rel="noopener noreferrer">
            View on OpenSea
            <LinkIconWrapper>
              <ShareIcon />
            </LinkIconWrapper>
          </Link>
        </LinkWrapper>
      </div>
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
          { effectivePrice && effectivePrice.gt(BigNumber.from(0)) &&
            <tr>
              <td>Price</td>
              <td>{utils.formatEther(effectivePrice)} ETH</td>
            </tr>
          }
          { isTroublesome && countdownToWithdraw &&
            <tr>
              <td>Time to withdraw</td>
              <td>{countdownToWithdraw.toString()}</td>
            </tr>
          }
        </tbody>
      </Table>
      {owner == account &&
        <>
          <Subtitle style={{color: "green"}}>You are the owner</Subtitle>
          {isTroublesome &&
            <Text style={{marginBottom: 10}}>Anyone can already purchase this NFT for <strong>{utils.formatEther(effectivePrice)} ETH</strong> in DoubleTrouble. But you can still set a lower price below.</Text>
          }
          {(isTroublesome || dtAddr == approved) &&
              <>
                <InputGroup className="mb-3">
                  <InputGroup.Text>Price in ETH</InputGroup.Text>
                  <FormControl
                    onChange={(e) => setSalePrice(e.target.value)}  value={salePrice} />
                </InputGroup>
                <div style={{display: 'flex'}}>
                  <SmallButton disabled={setPriceState.status == 'Mining'} onClick={() => setPrice(salePrice)}>
                    {effectivePrice.eq(0) ? 'Put up for sale' : 'Change price'}
                  </SmallButton>
                  {forSalePrice > 0 &&
                    <SmallButton disabled={setPriceState.status == 'Mining'} onClick={() => setPrice('0')}>
                      Remove from sale
                    </SmallButton>
                  }
                </div>
              </>
          }
          {!isTroublesome && approved != dtAddr &&
              <>
                <Text>Approve DoubleTrouble to operate this token before listing it</Text>
                <SmallButton onClick={approve}>Approve</SmallButton>
              </>
          }
        </>
      }
      {owner != account && forSalePrice > 0 &&
        <SmallButton disabled={buyState.status == 'Mining'} onClick={buy}>
          Buy for {utils.formatEther(forSalePrice)} ETH
        </SmallButton>
      }
      {owner != account && lastPurchasePrice > 0 &&
        <SmallButton disabled={forceBuyState.status == 'Mining'} onClick={forceBuy}>
          Force Buy for {utils.formatEther(lastPurchasePrice.mul(2))} ETH
        </SmallButton>
      }
    </>
  );
}

const LinkWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`

const LinkIconWrapper = styled.div`
  width: 12px;
  height: 12px;
`

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
