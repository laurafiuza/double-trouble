import React, { useContext, useState } from 'react'
import { useContractCall, useContractFunction, useEthers } from '@usedapp/core'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import { utils } from 'ethers'
import { Label } from '../typography/Label'
import { Text, TextInline } from '../typography/Text'
import { AccountButton } from '../components/account/AccountButton'
import { Title } from '../typography/Title'
import { Colors, BorderRad, Transitions } from '../global/styles'
import {NFTViewer} from './ViewNFT'
import { InputGroup, FormControl } from 'react-bootstrap';

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

