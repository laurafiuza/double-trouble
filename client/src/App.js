import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import CollectionInspector from "./CollectionInspector";

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/collections/0xdeadbeef/1234">NFT</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/about">
            <div>We are cool</div>
          </Route>
          <Route path="/collections/:collection/:tokenId" render={({match}) => {
            return <CollectionInspector collection={match.params.collection} tokenId={match.params.tokenId} />
          }} />
          <Route path="/">
            <div>Home</div>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
