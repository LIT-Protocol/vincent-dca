import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import { reactHelpers } from '@lit-protocol/vincent-sdk';

import '@/App.css';

import Loading from '@/components/loading';
import { APP_ID } from '@/config';
import { Home } from '@/pages/home';
import { Login } from '@/pages/login';

const { JwtProvider, useJwtContext } = reactHelpers;

function AppContent() {
  const { authInfo, loading } = useJwtContext();

  if (loading) {
    return <Loading />;
  }

  return authInfo ? <Home /> : <Login />;
}

// Async wrapper around localstorage to show loading state
// In reality you would use the jwt storage solution you want. SDK defaults to localstorage if nothing is passed
const TIME = 0;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const asyncStorage = {
  getItem: async (key: string) => {
    await wait(TIME);
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await wait(TIME);
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await wait(TIME);
    localStorage.removeItem(key);
  },
};

function App() {
  return (
    <JwtProvider
      appId={APP_ID}
      storage={asyncStorage}
      storageKeyBuilder={(appId) => `vincentApp${appId}`}
    >
      <AppContent />
    </JwtProvider>
  );
}

export default App;
