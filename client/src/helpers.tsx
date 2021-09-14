import { useContractCall, useContractCalls } from '@usedapp/core'
import { BigNumber } from '@ethersproject/bignumber'
import { Link } from './components/base/Link'
import { ShareIcon } from './components/Transactions/Icons'
import styled from 'styled-components'

export const truncAddr = (str: string, num: number) => {
  if (str.length <= num) {
    return str
  }
  return str.slice(0, num) + '...'
}

export const _useContractCall = (arg: any) => {
  const ret = useContractCall(arg);
  return ret === undefined ? undefined : ret[0];
}

export const _useContractCalls = (arg: any) => {
  return useContractCalls(arg).map((ret) =>
    ret === undefined ? undefined : ret[0]
  )
}

export const zeroAddr = '0x0000000000000000000000000000000000000000';

export const bignumMin = (bn1: BigNumber, bn2: BigNumber) =>
  bn1.gt(bn2) ? bn2 : bn1

export const effectiveNFTPrice = (forSalePrice: BigNumber, lastPurchasePrice: BigNumber) => {
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


export const OpenSeaLink = (props: {style?: any, collection: string, tokenId: number}) => {
  return (
    <LinkWrapper style={props.style}>
      <Link href={`https://opensea.io/assets/${props.collection}/${props.tokenId}`} target="_blank" rel="noopener noreferrer">
        View on OpenSea
        <LinkIconWrapper>
          <ShareIcon />
        </LinkIconWrapper>
      </Link>
    </LinkWrapper>
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

