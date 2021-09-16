import React, {useContext} from 'react'
import { Container, ContentBlock,  MainContent, Section, SectionRow } from '../components/base/base'
import { utils } from 'ethers'
import { TextBold, } from '../typography/Text'
import { Title } from '../typography/Title'
import { Colors, } from '../global/styles'
import styled from 'styled-components'
import { AccountButton } from '../components/account/AccountButton'
import { useEthers } from '@usedapp/core'
import { truncAddr, OpenSeaLink, _useContractCall, _useContractCalls, effectiveNFTPrice } from '../helpers';
import { DoubleTroubleContext } from '../DoubleTrouble';
import DoubleTroubleContract from '../abi/DoubleTrouble.json'
import GenericNFTContract from '../abi/IERC721Metadata.json'
import { Link } from '../components/base/Link'


export function All() {
  const { account } = useEthers();
  const { dtAddr } = useContext(DoubleTroubleContext);

  const useDTCall = (method: string, args: any[]) => {
    return _useContractCall({
      abi: new utils.Interface(DoubleTroubleContract.abi),
      address: dtAddr,
      method: method,
      args: args,
    });
  };

  const allNfts = (useDTCall('allKnownTokens', []) ?? []).filter((t: any) =>
    !effectiveNFTPrice(t.forSalePrice, t.lastPurchasePrice).isZero()
  );
  const nameForNfts = _useContractCalls((allNfts).map((t: any) => {
    return {
      abi: new utils.Interface(GenericNFTContract.abi),
      address: t.collection,
      method: 'name',
      args: [],
    }
  }))
  const ownerForNfts = _useContractCalls((allNfts).map((t: any) => {
    return {
      abi: new utils.Interface(GenericNFTContract.abi),
      address: t.collection,
      method: 'ownerOf',
      args: [t.tokenId],
    }
  }))

  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title>All NFTs</Title>
            <AccountButton />
          </SectionRow>
          <TokensContentBlock>
            <List>
              {allNfts &&
                allNfts.map((t: any, i: number) => (
                  <TokenItem key={`${t.collection}${t.tokenId.toString()}`}>
                    <TokenName>
                      <Link href={`/collections/${t.collection}/${t.tokenId}`}>
                        {nameForNfts[i] ?? t.collection} {t.tokenId.toString()}
                      </Link>
                    </TokenName>
                    <TokenPrice>
                    Selling for {utils.formatEther(effectiveNFTPrice(t.forSalePrice, t.lastPurchasePrice))} ETH
                    </TokenPrice>
                    <TokenTicker>
                    Owner: {truncAddr(ownerForNfts[i] ?? '', 8)} {ownerForNfts[i] === account && '(you)'}
                    </TokenTicker>
                    <OpenSeaLink collection={t.collection} tokenId={t.tokenId}
                      style={{gridArea: 'view', marginTop: 0}} />
                  </TokenItem>
                ))}
            </List>
          </TokensContentBlock>
        </Section>
      </Container>
    </MainContent>
  )
}

const TokensContentBlock = styled(ContentBlock)`
  padding: 16px 32px;
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const TokenItem = styled.li`
  display: grid;
  grid-template-areas:
    'name price view'
    'ticker price view';
  grid-template-columns: 1fr 2fr auto;
  grid-template-rows: auto auto;
  grid-column-gap: 20px;
  grid-row-gap: 8px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;

  & + & {
    border-top: 1px solid ${Colors.Black[200]};
  }
`


const TokenName = styled(TextBold)`
  grid-area: name;
`

const TokenTicker = styled(TextBold)`
  grid-area: ticker;
  color: ${Colors.Gray[600]};
`

const TokenPrice = styled(TextBold)`
  grid-area: price;
  font-size: 18px;
  line-height: 32px;
`
