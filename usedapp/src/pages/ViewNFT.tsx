import React from 'react'
import { useContractCall, useEthers } from '@usedapp/core'
import { utils } from 'ethers'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import { Label } from '../typography/Label'
import { TextInline } from '../typography/Text'
import { Title } from '../typography/Title'
import GenericNFTContract from '../abi/IERC721Metadata.json'


export function ViewNFT(props: {collection: string, tokenId: number}) {
  const { account, chainId, active } = useEthers()
  const ret = useContractCall({
    abi: new utils.Interface(GenericNFTContract.abi),
    address: props.collection,
    method: 'tokenURI',
    args: [props.tokenId],
  })
  console.log(ret);

  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title>NFT</Title>
          </SectionRow>
          <ContentBlock>
            <ContentRow>
            </ContentRow>
          </ContentBlock>
        </Section>
      </Container>
    </MainContent>
  );
}
