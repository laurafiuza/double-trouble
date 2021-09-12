import React from 'react'
import { formatEther } from '@ethersproject/units'
import { useContractCall, useEtherBalance, useEthers } from '@usedapp/core'
import { Container, ContentBlock, ContentRow, MainContent, Section, SectionRow } from '../components/base/base'
import { Label } from '../typography/Label'
import { TextInline } from '../typography/Text'
import { Title } from '../typography/Title'
import DoubleTroubleContract from "../abi/DoubleTrouble.json";

import { AccountButton } from '../components/account/AccountButton'

const dtAddr = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
console.log(dtAddr);

function useAllTokens() {
  const ret =
    useContractCall({
          abi: DoubleTroubleContract,
          address: dtAddr,
          method: 'allKnownTokens',
          args: [],
    });
  return ret;
}

export function Balance() {
  const { account } = useEthers()
  const userBalance = useEtherBalance(account)
  const test = useAllTokens();

  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title>Balance</Title>
            <AccountButton />
          </SectionRow>
          <ContentBlock>
            {account && (
              <ContentRow>
                <Label>Account:</Label> <TextInline>{account}</TextInline>
              </ContentRow>
            )}
            {userBalance && (
              <ContentRow>
                <Label>Ether balance:</Label> <TextInline>{formatEther(userBalance)}</TextInline> <Label>ETH</Label>
              </ContentRow>
            )}
            <ContentRow>
            {test}
            </ContentRow>
          </ContentBlock>
        </Section>
      </Container>
    </MainContent>
  )
}
