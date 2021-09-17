import React, { useContext, useState } from 'react'
import { useContractFunction, useEthers, useEtherBalance } from '@usedapp/core'
import { utils } from 'ethers'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import { Text, } from '../typography/Text'
import { Subtitle, Title } from '../typography/Title'
import { Spinner, Table, InputGroup, FormControl, } from 'react-bootstrap';
import styled from 'styled-components'
import { Colors, } from '../global/styles'
import { AccountButton } from '../components/account/AccountButton'
import { Button } from '../components/base/Button'
import ImageCard from '../components/ImageCard';
import { BigNumber } from '@ethersproject/bignumber'
import { DoubleTroubleContext } from '../DoubleTrouble';
import countdown from 'countdown';
import GenericNFTContract from '../abi/IERC721Metadata.json'
import DoubleTroubleContract from '../abi/DoubleTrouble.json'
import PatronTokensContract from '../abi/PatronTokens.json'
import { Contract } from '@ethersproject/contracts'
import 'bootstrap/dist/css/bootstrap.min.css';
import { forceBuyPrice, zeroAddr, OpenSeaLink, _useContractCall, effectiveNFTPrice } from '../helpers';
import { useNft } from "use-nft"


export function ViewNFT(props: {collection: string, tokenId: number}) {
  const { active } = useEthers();
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

/*
 * Component that shows and allows user to interact with an NFT
 * both Troublesome or not.
 **/
export function NFTViewer(props: {collection: string, tokenId: number}) {
  const { chainId, account, library, } = useEthers();
  const { dtAddr, patronTokensAddr }  = useContext(DoubleTroubleContext);
  const userBalance = useEtherBalance(account);

  const { nft } = useNft(props.collection, props.tokenId.toString());
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

  const usePatronTokensCall = (method: string, args: any[]) => {
    return _useContractCall({
      abi: new utils.Interface(PatronTokensContract.abi),
      address: patronTokensAddr,
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
    if (forSalePrice.gt(userBalance)) {
      window.alert('Not enough balance for this purchase')
      return
    }
    buySend(props.collection, props.tokenId, {value: forSalePrice})
  }

  const { state: forceBuyState, send: forceBuySend} = useContractFunction(dtContract, 'forceBuy', { transactionName: 'forceBuy' })
  const forceBuy = () => {
    if (forSalePrice.gt(userBalance)) {
      window.alert('Not enough balance for this purchase')
      return
    }
    forceBuySend(props.collection, props.tokenId, {value: forceBuyPrice(lastPurchasePrice)})
  }

  const { state: withdrawState, send: withdrawSend} = useContractFunction(dtContract, 'withdraw', { transactionName: 'withdraw' })
  const withdraw = () => {
    const fee = lastPurchasePrice.div(65).add(1);
    withdrawSend(props.collection, props.tokenId, {value: fee})
  }

  // Read from PatronTokens contract
  const patron = usePatronTokensCall('patronOf', [props.collection]);

  // Derived variables
  const countdownToWithdraw = countdown(Date.now() + secondsToWithdraw * 1000);
  const isTroublesome = originalOwner === dtAddr;
  const owner = isTroublesome ? troublesomeOwner : originalOwner;
  const effectivePrice = effectiveNFTPrice(forSalePrice ?? BigNumber.from(0), lastPurchasePrice ?? BigNumber.from(0));

  // loading
  if (!patron) {
    return <Spinner animation="border" />
  }

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
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <Title>{nft && nft.name}</Title>
        <OpenSeaLink collection={props.collection} tokenId={props.tokenId} style={{width: 122, display: 'flex', flexDirection: 'column'}} />
      </div>
      <ImageCard style={{marginBottom: 20}} imageURI={nft && nft.image}/>
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
          {nft && nft.description &&
            <tr>
              <td>Description</td>
              <td>{nft.description}</td>
            </tr>
          }
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
      {owner === account &&
        <>
          <Subtitle style={{color: "green"}}>You are the owner</Subtitle>
          {isTroublesome &&
            <Text style={{marginBottom: 10}}>Anyone can already purchase this NFT for <strong>{utils.formatEther(effectivePrice)} ETH</strong> in DoubleTrouble. But you can still set a lower price below.</Text>
          }
          {(isTroublesome || dtAddr === approved) &&
              <>
                <InputGroup className="mb-3">
                  <InputGroup.Text>Price in ETH</InputGroup.Text>
                  <FormControl
                    onChange={(e) => setSalePrice(e.target.value)}  value={salePrice} />
                </InputGroup>
                <div style={{display: 'flex'}}>
                  <SmallButton disabled={setPriceState.status === 'Mining'} onClick={() => setPrice(salePrice)}>
                    {effectivePrice.eq(0) ? 'Put up for sale' : 'Change price'}
                  </SmallButton>
                  {forSalePrice > 0 &&
                    <SmallButton disabled={setPriceState.status === 'Mining'} onClick={() => setPrice('0')}>
                      Remove from sale
                    </SmallButton>
                  }
                </div>
              </>
          }
          {!isTroublesome && approved !== dtAddr &&
              <>
                <Text>Approve DoubleTrouble to operate this token before listing it</Text>
                <SmallButton style={{marginTop: 10, marginBottom: 10}} onClick={approve} disabled={approveState.status === 'Mining'}>Approve</SmallButton>
              </>
          }
          {patron === zeroAddr &&
            <Text style={{marginTop: 10}}><strong>No Patron.</strong> No one has claimed Patronage for <strong>{collectionName}</strong> yet. Be the first to sell an NFT from this collection in DoubleTrouble and claim your <a style={{textDecoration: 'underline'}} href="/patrons">Patron Token.</a></Text>
          }
        </>
      }
      <div style={{display: 'flex'}}>
        {owner !== account && forSalePrice > 0 &&
          <SmallButton disabled={buyState.status === 'Mining'} onClick={buy}>
            Buy for {utils.formatEther(forSalePrice)} ETH
          </SmallButton>
        }
        {owner !== account && lastPurchasePrice > 0 &&
          <SmallButton disabled={forceBuyState.status === 'Mining'} onClick={forceBuy}>
            Force Buy for {utils.formatEther(forceBuyPrice(lastPurchasePrice))} ETH
          </SmallButton>
        }
        {isTroublesome && owner === account && secondsToWithdraw <= 0 &&
          <Button disabled={withdrawState.status === 'Mining'} onClick={withdraw} style={{padding: 5, marginTop: 10}}>
            Withdraw from DoubleTrouble
          </Button>
        }
      </div>
    </>
  );
}



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

