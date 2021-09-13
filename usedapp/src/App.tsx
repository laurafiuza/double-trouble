import React from 'react'
import { Redirect, Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { Page } from './components/base/base'
import { TopBar } from './components/TopBar'
import { GlobalStyle } from './global/GlobalStyle'
import { About } from './pages/About'
import { List } from './pages/List'
import { All } from './pages/All'
import { Patrons } from './pages/Patrons'
import { ViewNFT } from './pages/ViewNFT'
import { NotificationsList } from './components/Transactions/History'

export function App() {
  return (
    <Page>
      <GlobalStyle />
      <BrowserRouter>
        <TopBar />
        <Switch>
          <Route path="/collections/:collection/:tokenId" render={({match}) => {
            return (
              <ViewNFT collection={match.params.collection} tokenId={parseInt(match.params.tokenId)} />
            );
          }} />
          <Route exact path="/" component={About} />
          <Route exact path="/all" component={All} />
          <Route exact path="/list" component={List} />
          <Route exact path="/patrons" component={Patrons} />
          <Redirect exact from="/" to="/about" />
        </Switch>
      </BrowserRouter>
      <NotificationsList />
    </Page>
  )
}
