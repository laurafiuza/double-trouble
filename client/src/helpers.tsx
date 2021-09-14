import { useContractCall } from '@usedapp/core'
import { BigNumber } from '@ethersproject/bignumber'


export const _useContractCall = (arg: any) => {
  const ret = useContractCall(arg);
  return ret === undefined ? undefined : ret[0];
}

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

