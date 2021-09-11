export const truncAddr = (str, num) => {
  if (str.length <= num) {
    return str
  }
  return str.slice(0, num) + '...'
}

export const derivePrice = (forSalePrice, lastPurchasePrice, dtFactor) => {
  if (forSalePrice === 0 && lastPurchasePrice === 0) {
    return 0;
  } else if (forSalePrice > 0 && lastPurchasePrice > 0) {
    return Math.min(forSalePrice, lastPurchasePrice * dtFactor);
  } else if (forSalePrice > 0) {
    return forSalePrice;
  } else {
    return lastPurchasePrice * dtFactor;
  }
};
