import React, { useEffect } from 'react'
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import MetamaskProvider from './MetamaskProvider';
import DoubleTroubleContract from './contracts/DoubleTrouble.json';
import useSWR from 'swr';
import { isAddress } from '@ethersproject/address';
import About from "./About";
import Find from "./Find";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Page, MainContent } from './components/base/base'
import { TopBar } from './components/TopBar'
import { GlobalStyle } from './global/GlobalStyle'

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    1, // Mainet
    3, // Ropsten
    4, // Rinkeby
    5, // Goerli
    42, // Kovan
    31337, // localhost
  ],
})

function getLibrary(provider) {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

const fetcher = (library, abi, method) => (...args) => {
  const [arg1, arg2, ...params] = args
  // it's a contract
  if (isAddress(arg1)) {
    const address = arg1
    const method = arg2
    const contract = new Contract(address, abi, library.getSigner())
    return contract[method](...params)
  }
  // it's a eth call
  const method = arg1
  return library[method](arg2, ...params)
}

// Switch for chainId
const dtAddr = '0x610178dA211FEF7D417bC0e6FeD39F05609AD788';

export const Wallet = () => {
  const { chainId, library, account, activate, active } = useWeb3React()
  const { data: nfts, mutate } = useSWR([dtAddr, 'allKnownTokens'], fetcher(library, DoubleTroubleContract.abi));
  console.log(nfts);

  useEffect(() => {
    // listen for changes on an Ethereum address
    console.log(`listening for Transfer...`)
    const contract = new Contract(dtAddr, DoubleTroubleContract.abi, library.getSigner())
    console.log('effect');
    console.log(contract);
    return () => {
      console.log('unmount');
    }
  }, []);


  return (
    <MainContent>
      Wallet on
    </MainContent>
  );
}

const Everything = () => {
  const { active } = useWeb3React()
  return (
    <Page>
      <GlobalStyle />
      <BrowserRouter>
        <TopBar />
        { active &&
          <Switch>
            <Route exact path="/" component={Wallet} />
          </Switch>
        }
      </BrowserRouter>
    </Page>
  );
}

export const App = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <MetamaskProvider>
        <Everything/>
      </MetamaskProvider>
    </Web3ReactProvider>
  )
}
