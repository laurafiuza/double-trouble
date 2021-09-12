import { getExplorerTransactionLink, useNotifications, useTransactions, getStoredTransactionState, shortenTransactionHash, } from '@usedapp/core';
import React from 'react';
import styled from 'styled-components';
import { TextBold } from '../../typography/Text';
import { ContentBlock } from '../base/base';
import { CheckIcon, ClockIcon, ExclamationIcon, ShareIcon, UnwrapIcon, WalletIcon, WrapIcon, SpinnerIcon, } from './Icons';
import { Colors, Shadows } from '../../global/styles';
import { AnimatePresence, motion } from 'framer-motion';
import { formatEther } from '@ethersproject/units';
import { BigNumber } from 'ethers';
import { Link } from '../base/Link';
const formatter = new Intl.NumberFormat('en-us', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
});
const formatBalance = (balance) => formatter.format(parseFloat(formatEther(balance !== null && balance !== void 0 ? balance : BigNumber.from('0'))));
const TableWrapper = ({ children, title }) => (React.createElement(SmallContentBlock, null,
    React.createElement(TitleRow, null, title),
    React.createElement(Table, null, children)));
const DateCell = ({ date, className }) => {
    const dateObject = new Date(date);
    const formattedDate = dateObject.toLocaleDateString();
    const formattedTime = dateObject.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
    return (React.createElement(DateRow, { className: className },
        React.createElement(DateDisplay, null, formattedDate),
        React.createElement(HourDisplay, null, formattedTime)));
};
const TransactionLink = ({ transaction }) => (React.createElement(React.Fragment, null, transaction && (React.createElement(Link, { href: getExplorerTransactionLink(transaction.hash, transaction.chainId), target: "_blank", rel: "noopener noreferrer" },
    "View on Etherscan",
    React.createElement(LinkIconWrapper, null,
        React.createElement(ShareIcon, null))))));
const notificationContent = {
    transactionFailed: { title: 'Transaction failed', icon: React.createElement(ExclamationIcon, null) },
    transactionStarted: { title: 'Transaction started', icon: React.createElement(ClockIcon, null) },
    transactionSucceed: { title: 'Transaction succeed', icon: React.createElement(CheckIcon, null) },
    walletConnected: { title: 'Wallet connected', icon: React.createElement(WalletIcon, null) },
};
const ListElement = ({ transaction, icon, title, date }) => {
    return (React.createElement(ListElementWrapper, { layout: true, initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } },
        React.createElement(ListIconContainer, null, icon),
        React.createElement(ListDetailsWrapper, null,
            React.createElement(TextBold, null, title),
            React.createElement(TransactionLink, { transaction: transaction })),
        React.createElement(NotificationDate, { date: date })));
};
function TransactionIcon(transaction) {
    if (getStoredTransactionState(transaction) === 'Mining') {
        return React.createElement(SpinnerIcon, null);
    }
    else if (getStoredTransactionState(transaction) === 'Fail') {
        return React.createElement(ExclamationIcon, null);
    }
    else if (transaction.transactionName === 'Unwrap') {
        return React.createElement(UnwrapIcon, null);
    }
    else if (transaction.transactionName === 'Wrap') {
        return React.createElement(WrapIcon, null);
    }
    else {
        return React.createElement(CheckIcon, null);
    }
}
export const TransactionsList = () => {
    const { transactions } = useTransactions();
    return (React.createElement(TableWrapper, { title: "Transactions history" },
        React.createElement(AnimatePresence, { initial: false }, transactions.map((transaction) => (React.createElement(ListElement, { transaction: transaction.transaction, title: transaction.transactionName, icon: TransactionIcon(transaction), key: transaction.transaction.hash, date: transaction.submittedAt }))))));
};
const NotificationElement = ({ transaction, icon, title }) => {
    return (React.createElement(NotificationWrapper, { layout: true, initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } },
        React.createElement(NotificationIconContainer, null, icon),
        React.createElement(NotificationDetailsWrapper, null,
            React.createElement(NotificationText, null, title),
            React.createElement(TransactionLink, { transaction: transaction }),
            React.createElement(TransactionDetails, null, transaction && `${shortenTransactionHash(transaction === null || transaction === void 0 ? void 0 : transaction.hash)} #${transaction.nonce}`)),
        transaction && React.createElement("div", { style: { marginLeft: 'auto' } },
            "- ",
            formatBalance(transaction.value),
            " ETH")));
};
export const NotificationsList = () => {
    const { notifications } = useNotifications();
    return (React.createElement(NotificationsWrapper, null,
        React.createElement(AnimatePresence, { initial: false }, notifications.map((notification) => {
            if ('transaction' in notification)
                return (React.createElement(NotificationElement, { key: notification.id, icon: notificationContent[notification.type].icon, title: notificationContent[notification.type].title, transaction: notification.transaction, date: Date.now() }));
            else
                return (React.createElement(NotificationElement, { key: notification.id, icon: notificationContent[notification.type].icon, title: notificationContent[notification.type].title, date: Date.now() }));
        }))));
};
const NotificationText = styled(TextBold) `
  font-size: 20px;
  margin-bottom: 5px;
`;
const TransactionDetails = styled.div `
  font-size: 14px;
`;
const NotificationWrapper = styled(motion.div) `
  display: flex;
  align-items: center;
  background-color: ${Colors.White};
  box-shadow: ${Shadows.notification};
  width: 395px;
  border-radius: 10px;
  margin: 15px;
  padding: 10px 20px 10px 20px;
`;
const NotificationsWrapper = styled.div `
  position: fixed;
  right: 24px;
  bottom: 24px;
`;
const NotificationIconContainer = styled.div `
  width: 60px;
  height: 60px;
  padding: 0px;
  margin-right: 20px;
`;
const ListIconContainer = styled.div `
  width: 48px;
  height: 48px;
  padding: 12px;
  padding: 14px 16px 14px 12px;
`;
const ListElementWrapper = styled(motion.div) `
  display: flex;
  justify-content: space-between;
`;
const NotificationDetailsWrapper = styled.div `
  display: flex;
  flex-direction: column;
  padding: 4px 0;
`;
const ListDetailsWrapper = styled.div `
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 4px 0;
`;
const Table = styled.div `
  height: 300px;
  overflow: scroll;
  padding: 12px;

  & > * + * {
    margin-top: 12px;
  }
`;
const LinkIconWrapper = styled.div `
  width: 12px;
  height: 12px;
  margin-left: 8px;
`;
const SmallContentBlock = styled(ContentBlock) `
  padding: 0;
`;
const TitleRow = styled(TextBold) `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: ${Colors.Gray['300']} 1px solid;
  padding: 16px;
  font-size: 18px;
`;
const DateRow = styled.div `
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: end;
  padding: 8px;
`;
const NotificationDate = styled(DateCell) `
  margin-left: auto;
`;
const DateDisplay = styled.div `
  font-size: 14px;
`;
const HourDisplay = styled.div`
  font-size: 12px;
  color: ${Colors.Gray['600']};
`
