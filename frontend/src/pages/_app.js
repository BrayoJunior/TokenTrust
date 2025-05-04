import React from 'react';
import '../styles/globals.css';
import { UserProvider } from '../context/kycContext';

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp;