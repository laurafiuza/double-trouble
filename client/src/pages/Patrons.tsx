import React, {useContext} from 'react'
import { utils } from 'ethers'
import { useEthers } from '@usedapp/core'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import { Title } from '../typography/Title'
import { Text, TextBold, } from '../typography/Text'
import PatronTokensContract from '../abi/PatronTokens.json'
import { DoubleTroubleContext } from '../DoubleTrouble';
import { AccountButton } from '../components/account/AccountButton'
import ImageCard from '../components/ImageCard';
import { Link } from '../components/base/Link'
import { truncAddr, OpenSeaLink, _useContractCall, _useContractCalls, } from '../helpers';
import styled from 'styled-components'
import { Colors, } from '../global/styles'
import _ from 'lodash';

export function Patrons() {
  const { account } = useEthers();
  const { patronTokensAddr } = useContext(DoubleTroubleContext);

  const usePTCall = (method: string, args: any[]) => {
    return _useContractCall({
      abi: new utils.Interface(PatronTokensContract.abi),
      address: patronTokensAddr,
      method: method,
      args: args,
    });
  };

  const totalSupply = usePTCall('totalSupply', []);
  const patronTokens = _.range(totalSupply ?? 0)
  const owners = _useContractCalls(patronTokens.map((n: number) => {
    return {
      abi: new utils.Interface(PatronTokensContract.abi),
      address: patronTokensAddr,
      method: 'ownerOf',
      args: [n],
    }
  }));
  const tokenURIs = _useContractCalls(patronTokens.map((n: number) => {
    return {
      abi: new utils.Interface(PatronTokensContract.abi),
      address: patronTokensAddr,
      method: 'tokenURI',
      args: [n],
    }
  }));
  const info = _useContractCalls(patronTokens.map((n: number) => {
    return {
      abi: new utils.Interface(PatronTokensContract.abi),
      address: patronTokensAddr,
      method: 'patronedCollectionInfo',
      args: [n],
    }
  }));

  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title>Patron Tokens</Title>
            <AccountButton />
          </SectionRow>
          <ContentBlock>
          <ContentRow>
             <h2>How it works</h2>
            <Text>
              If you're the first person to sell an item from a particular collection in DoubleTrouble, we'll mint a special PTRN token corresponding to that collection just for you. The owner of a PTRN token is the Patron of the collection, and will automatically get ~0.75% of the value of all NFT sales in DoubleTrouble corresponding to that collection.
            </Text>
  <Text style={{marginTop: 10}}>
            Patronage can change hands. PTRN tokens are also ERC-721 NFTs, so they can be bought and sold in regular NFT exchanges, as well as of course in Double Trouble.
            </Text>
          </ContentRow>
          </ContentBlock>
          <hr/>
          <TokensContentBlock>
            <h2>All Patron Tokens</h2>
            {patronTokens.length === 0 &&
              <Text>There aren't any yet</Text>
            }
            <List>
              {
                patronTokens.map((i: number) => (
                  <TokenItem key={i}>
                    <TokenImage>
                      <a href={`/collections/${patronTokensAddr}/${i}`}>
                        <ImageCard tokenURI={tokenURIs[i]} />
                      </a>
                    </TokenImage>
                    <TokenName>
                      <Link style={{fontSize: 14}} href={`/collections/${patronTokensAddr}/${i}`}>
                        Patron Token {i}
                      </Link>
                    </TokenName>
                    <TokenCollection>
                      Collection: {(info[i] ?? {}).name}
                    </TokenCollection>
                    <TokenTicker>
                    Owner: {truncAddr(owners[i] ?? '', 8)} {owners[i] === account && '(you)'}
                    </TokenTicker>
                    <OpenSeaLink collection={patronTokensAddr} tokenId={i}
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
    "img name ."
    "img collection view"
    "img ticker ."
    ;
  grid-template-columns: 0.5fr 2fr auto;
  grid-template-rows: auto auto ;
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

const TokenImage = styled.div`
  grid-area: img;
`

const TokenCollection = styled(TextBold)`
grid-area: collection;
`

const TokenTicker = styled(TextBold)`
  grid-area: ticker;
  color: ${Colors.Gray[600]};
`

