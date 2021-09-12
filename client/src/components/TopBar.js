import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { Colors, Shadows, Sizes, Transitions } from '../global/styles'
import { HeaderContainer } from './base/base'
import { Button } from './base/Button'
import { injectedConnector } from '../App';
import { useWeb3React } from '@web3-react/core'
import { Badge } from 'react-bootstrap';

export function TopBar(props) {
  const { chainId, account, active, activate } = useWeb3React()
  return (
    <Header>
      <HeaderContainer>
        <HeaderNav>
          <ToMain href="/">
            <span>DoubleTrouble</span>
          </ToMain>
          <HeaderNavLinks>
            <HeaderLink activeClassName="active-page" to="/all">
              {' '}
              All NFTs{' '}
            </HeaderLink>
            <HeaderLink activeClassName="active-page" to="/list">
              {' '}
              List for sale{' '}
            </HeaderLink>
            <HeaderLink activeClassName="active-page" to="/patrons">
              {' '}
              Patron Tokens{' '}
            </HeaderLink>
          </HeaderNavLinks>
          <div style={{width: 150, position: 'absolute', right: 50}}>
          { active
            ?
              <>
                <div style={{textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>
                  Wallet: {account}
                </div>
                <Badge style={{width: '100%'}} className="bg-info">{chainId}</Badge>
              </>
            :
            <Button onClick={() => activate(injectedConnector)}>Connect</Button>
          }
        </div>
        </HeaderNav>
      </HeaderContainer>
    </Header>
  )
}

const Header = styled.header`
  display: flex;
  position: fixed;
  top: 0;
  align-items: center;
  width: 100%;
  height: ${Sizes.headerHeight};
  background-color: ${Colors.White};
  box-shadow: ${Shadows.main};
  z-index: 100;
`

const HeaderNav = styled.nav`
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
`

const ToMain = styled.a`
  display: flex;
  flex-direction: column;
  width: fit-content;
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  transition: ${Transitions.all};

  &:hover {
    color: ${Colors.Yellow[500]};
  }
`

const ToMainBottom = styled.span`
  display: grid;
  grid-auto-flow: column;
  grid-column-gap: 4px;
  align-items: center;
  width: fit-content;
  font-size: 10px;
  line-height: 14px;
  font-weight: 500;
`

const Handshaking = styled.span`
  letter-spacing: -0.3em;
`

const HeaderNavLinks = styled.div`
  display: grid;
  position: absolute;
  left: 50%;
  grid-auto-flow: column;
  align-items: center;
  grid-column-gap: 20px;
  align-items: center;
  height: 100%;
  transform: translateX(-50%);
`

const HeaderLink = styled(NavLink)`
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 10px;
  font-size: 12px;
  line-height: 24px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: ${Transitions.all};
  white-space: nowrap;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    width: calc(100% - 20px);
    height: 2px;
    background-color: ${Colors.Yellow[500]};
    transform: scaleX(0);
    transform-origin: 50% 50%;
    transition: ${Transitions.all};
  }

  &:hover {
    color: ${Colors.Yellow[500]};

    &:after {
      transform: scaleX(1);
    }
  }
  &.active-page {
    &:after {
      transform: scaleX(1);
    }
  }
`
