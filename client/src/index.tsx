import React from 'react'
import ReactDOM from 'react-dom'
import { useEthers, ChainId, DAppProvider } from '@usedapp/core'
import { App } from './App'
import { DoubleTroubleContext } from './DoubleTrouble'
import { NftProvider } from "use-nft"

const config = {
  readOnlyChainId: ChainId.Mainnet,
  readOnlyUrls: {
    [ChainId.Mainnet]: 'https://eth-mainnet.alchemyapi.io/v2/fkTVf8kXxNZEkz6W1cjHik5rFC1g92D6',
  },
  multicallAddresses: {
    // FIXME should be passed via process.env
    '31337': process.env.REACT_APP_MULTICALL_ADDR ?? ''
  }
}

const chains = {
  // Ethereum Mainnet
  "1": {
    name: 'Ethereum',
    dtAddr: "0x4C2Bc0d85D42C2Ed65BDd40C78A7b71A5b412648",
    patronTokensAddr: '0xD8fb428BcE0A7176912869EC169eFd4cEf51335d',
  },
  // Hardhat local
  "31337": {
    name: 'Hardhat',
    dtAddr: process.env.REACT_APP_DT_ADDR,
    patronTokensAddr: process.env.REACT_APP_PT_ADDR,
  }
}

function WrappedApp() {
  const { library } = useEthers();
  const chainId = '1' // FIXME
  return  (
    <DoubleTroubleContext.Provider value={{
      dtAddr: (chains[chainId].dtAddr ?? ''),
      patronTokensAddr: (chains[chainId].patronTokensAddr ?? ''),
    }}>
      <NftProvider fetcher={["ethers", {provider: library}]} jsonProxy={(url) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      }>
        <App />
      </NftProvider>
    </DoubleTroubleContext.Provider>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <WrappedApp />
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
