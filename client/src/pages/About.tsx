import React, {useContext} from 'react'
import { Container, ContentBlock, ContentRow, MainContent, Section } from '../components/base/base'
import { Text, } from '../typography/Text'
import { GitHubLink, EtherscanContractLink } from '../helpers'
import { DoubleTroubleContext } from '../DoubleTrouble';

export function About() {
  const { dtAddr } = useContext(DoubleTroubleContext);
  return (
    <MainContent>
      <Container>
        <Section>
          <ContentBlock>
            <ContentRow>
              <h1 style={{textAlign: 'center'}}>DoubleTrouble 🤝</h1>
            </ContentRow>
            <ContentRow>
              <h2>About</h2>
              <Text>Double Trouble is an Open Source NFT exchange platform with a catch: you can "force buy" any NFT in the platform - i.e. force someone to sell it as long as you're willing to pay 1.1x what the current owner paid for it.</Text>
    <Text style={{marginTop: 10}}>
                You can list existing NFTs you own for sale in Double Trouble. Our platform works for any NFT that implements the <a href="https://ethereum.org/en/developers/docs/standards/tokens/erc-721/">ERC-721 interface</a>.
    </Text>
            </ContentRow>
            <ContentRow>
              <h2>How it works</h2>
              <Text>
                Once you buy an NFT within DoubleTrouble, the NFT gets locked in escrow for 30 days in the DoubleTrouble contract in order to preserve the force buy functionality. The NFT is still 100% yours. You can still sell it (or someone else can still force buy it) while it's in escrow. But if you want to withdraw the NFT from DoubleTrouble for any utility purposes, you need to wait 30 days after purchasing it.
              </Text>
            </ContentRow>
            <ContentRow>
              <h2>Patron Tokens</h2>
              <Text>
                If you're the first person to sell an item from a particular collection in DoubleTrouble, we'll mint a special PTRN token corresponding to that collection just for you. The owner of a PTRN token is the Patron of the collection, and will automatically get ~0.75% of the value of all NFT sales in DoubleTrouble corresponding to that collection.
              </Text>
    <Text style={{marginTop: 10}}>
              Patronage can change hands. PTRN tokens are also ERC-721 NFTs, so they can be bought and sold in regular NFT exchanges, as well as of course in Double Trouble.
              </Text>
            </ContentRow>
            <ContentRow style={{paddingTop: 20}}>
              <EtherscanContractLink style={{position: 'absolute', bottom: 40, right: 20}} contract={dtAddr} />
              <GitHubLink style={{position: 'absolute', bottom: 20, right: 20}} />
            </ContentRow>
          </ContentBlock>
        </Section>
      </Container>
    </MainContent>
  )
}

