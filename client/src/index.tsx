import React from 'react'
import ReactDOM from 'react-dom'
import { ChainId, DAppProvider } from '@usedapp/core'
import { App } from './App'
import { DoubleTroubleContext } from './DoubleTrouble'

const config = {
  readOnlyChainId: ChainId.Mainnet,
  readOnlyUrls: {
    [ChainId.Mainnet]: 'https://mainnet.infura.io/v3/3165a249c65f4198bf57200109b8fadf',
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
    dtAddr: "0xf2D21129B6b93A91A726F24BC436D00331B0B338",
    patronTokensAddr: '0xfdea67b8cd4449f0b1400b856d4715492aacd89b',
  },
  // Hardhat local
  "31337": {
    name: 'Hardhat',
    dtAddr: process.env.REACT_APP_DT_ADDR,
    patronTokensAddr: process.env.REACT_APP_PT_ADDR,
  }
}

function WrappedApp() {
  const chainId = '1' // FIXME
  return  (
    <DoubleTroubleContext.Provider value={{
      dtAddr: (chains[chainId].dtAddr ?? ''),
      patronTokensAddr: (chains[chainId].patronTokensAddr ?? ''),
    }}>
      <App />
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
