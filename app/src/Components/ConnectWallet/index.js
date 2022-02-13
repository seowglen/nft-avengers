import React from 'react';
import './ConnectWallet.css';

const ConnectWallet = ({ connectWalletAction }) => {
  return (
    <div className="connect-wallet-container">
      <img
        src="https://64.media.tumblr.com/99f0c35fb35c2fc8484c1e0435b0fce1/tumblr_nob0mki1ML1shiv3ro1_500.gifv"
        alt="Avengers Gif"
      />
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWalletAction}
      >
        Connect Wallet To Get Started
      </button>
    </div>
  );
};

export default ConnectWallet;