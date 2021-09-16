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
    return bignumMin(forceBuyPrice(lastPurchasePrice), forSalePrice)
  } else if (lastPurchasePrice.eq(0) && forSalePrice.gt(0)) {
    return forSalePrice;
  } else if (lastPurchasePrice.gt(0) && forSalePrice.eq(0)) {
    return forceBuyPrice(lastPurchasePrice);
  } else {
    return BigNumber.from(0);
  }
};

export const dtParams = {
  numerator: 11,
  denominator: 10,
}

export const forceBuyPrice = (lastPurchasePrice: BigNumber) => lastPurchasePrice.mul(dtParams.numerator).div(dtParams.denominator);

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

export const EtherscanContractLink = (props: {style?: any, contract: string}) => {
  return (
    <LinkWrapper style={props.style}>
      <Link href={`https://etherscan.io/address/${props.contract}`} target="_blank" rel="noopener noreferrer">
        View Contract on Etherscan
        <LinkIconWrapper>
          <ShareIcon />
        </LinkIconWrapper>
      </Link>
    </LinkWrapper>
  );
}


export const GitHubLink = (props: {style?: any}) => {
  return (
    <LinkWrapper style={props.style}>
      <Link href={`https://github.com/laurafiuza/double-trouble`} target="_blank" rel="noopener noreferrer">
        View Project on GitHub
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

