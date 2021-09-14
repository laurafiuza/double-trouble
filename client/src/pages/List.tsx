import React, { useState } from 'react'
import { useEthers } from '@usedapp/core'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import { utils } from 'ethers'
import { Text, } from '../typography/Text'
import { AccountButton } from '../components/account/AccountButton'
import { Title } from '../typography/Title'
import {NFTViewer} from './ViewNFT'
import { InputGroup, FormControl } from 'react-bootstrap';

export function List() {
  const { active } = useEthers();
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

