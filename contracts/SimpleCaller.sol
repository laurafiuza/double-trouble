// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import './SimpleStorage.sol';

contract SimpleCaller {
  address constant storage_addr = 0x7ED550B0B04D0671d8fF6089c58a2B1923c1164b;

  function get() public view returns (uint) {
    return SimpleStorage(storage_addr).get() + 42;
  }
}
