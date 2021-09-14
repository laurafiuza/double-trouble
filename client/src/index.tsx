import React from 'react'
import ReactDOM from 'react-dom'
import { ChainId, DAppProvider } from '@usedapp/core'
import { App } from './App'
import { DoubleTroubleContext } from './DoubleTrouble'
import { useEthers } from '@usedapp/core'

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

const doubleTroubleAddresses = {
  // Hardhat local
  "31337": process.env.REACT_APP_DT_ADDR
}

function WrappedApp() {
  const { chainId } = useEthers();
  return  (
    <DoubleTroubleContext.Provider value={(chainId && doubleTroubleAddresses['31337']) ?? '0xdeadbeef'}>
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
