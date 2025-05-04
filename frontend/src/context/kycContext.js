import React, { createContext, useState, useEffect } from 'react';
import { getSigner, isKYCVerified } from '../services/blockchain';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    address: null,
    isKYCVerified: false,
  });

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      const verified = await isKYCVerified(address);
      setUser({ address, isKYCVerified: verified });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setUser({ address: null, isKYCVerified: false });
  };

  const refreshKYCStatus = async (address) => {
    try {
      const verified = await isKYCVerified(address);
      setUser((prev) => ({ ...prev, isKYCVerified: verified }));
    } catch (error) {
      console.error('Failed to refresh KYC status:', error);
    }
  };

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const address = accounts[0];
          const verified = await isKYCVerified(address);
          setUser({ address, isKYCVerified: verified });
        }
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          const address = accounts[0];
          isKYCVerified(address).then((verified) => {
            setUser({ address, isKYCVerified: verified });
          });
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, connectWallet, disconnectWallet, refreshKYCStatus }}>
      {children}
    </UserContext.Provider>
  );
};