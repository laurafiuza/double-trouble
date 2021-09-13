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
    '31337': '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9'
  }
}

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <DoubleTroubleContext.Provider value={'0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'}> // process.env
        <App />
      </DoubleTroubleContext.Provider>
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
