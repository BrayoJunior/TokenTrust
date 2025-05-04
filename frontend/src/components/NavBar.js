import React, { useContext } from 'react';
import Link from 'next/link';
import { UserContext } from '../context/kycContext';

export default function NavBar() {
  const { user, connectWallet, disconnectWallet } = useContext(UserContext);

  return (
    <nav className="p-4 bg-gray-900 text-white flex justify-between items-center">
      <div className="text-lg font-bold">
        <Link href="/">TokenTrust</Link>
      </div>
      <div className="flex space-x-4">
        <Link href="/sell" className="hover:text-blue-300">Submit Asset</Link>
        <Link href="/list" className="hover:text-blue-300">List Asset</Link>
        <Link href="/auctions" className="hover:text-blue-300">Auctions</Link>
        <Link href="/verify" className="hover:text-blue-300">Verify KYC</Link>
        <Link href="/admin" className="hover:text-blue-300">Admin</Link>
        {user?.address ? (
          <div className="flex items-center space-x-2">
            <span>
              {user.address.slice(0, 6)}...{user.address.slice(-4)}
              {user.isKYCVerified && (
                <span className="ml-2 text-green-400">
                  ✔ Verified
                </span>
              )}
            </span>
            <button
              onClick={disconnectWallet}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}