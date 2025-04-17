import React, { createContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { jwt } from '@lit-protocol/vincent-sdk';

const { verify } = jwt;

import { APP_ID } from '@/config';
import { useVincentWebAppClient } from '@/hooks/useVincentWebAppClient';

const APP_JWT_KEY = `${APP_ID}-jwt`;

export interface AuthInfo {
  jwt: string;
  pkp: IRelayPKP;
}

interface JwtContextType {
  authInfo: AuthInfo | null | undefined;
  logWithJwt: (token: string | null) => void;
  logOut: () => void;
}

export const JwtContext = createContext<JwtContextType>({
  authInfo: undefined,
  logWithJwt: () => {},
  logOut: () => {},
});

interface JwtProviderProps {
  children: ReactNode;
}

export const JwtProvider: React.FC<JwtProviderProps> = ({ children }) => {
  const vincentWebAppClient = useVincentWebAppClient();
  const [authInfo, setAuthInfo] = useState<AuthInfo | null | undefined>(undefined);

  const logOut = useCallback(() => {
    setAuthInfo(null);
    localStorage.removeItem(APP_JWT_KEY);
  }, []);

  const logWithJwt = useCallback(() => {
    const existingJwtStr = localStorage.getItem(APP_JWT_KEY);
    const didJustLogin = vincentWebAppClient.isLogin();

    if (didJustLogin) {
      try {
        const jwtResult = vincentWebAppClient.decodeVincentLoginJWT(window.location.origin);

        if (jwtResult) {
          const { decodedJWT, jwtStr } = jwtResult;

          localStorage.setItem(APP_JWT_KEY, jwtStr);
          vincentWebAppClient.removeLoginJWTFromURI();
          setAuthInfo({
            jwt: jwtStr,
            pkp: decodedJWT.payload.pkp,
          });
          return;
        } else {
          logOut();
          return;
        }
      } catch (e) {
        console.error('Error decoding JWT:', e);
        logOut();
        return;
      }
    }

    if (existingJwtStr) {
      try {
        const decodedJWT = verify(existingJwtStr, window.location.origin);

        setAuthInfo({
          jwt: existingJwtStr,
          pkp: decodedJWT.payload.pkp,
        });
      } catch (error: unknown) {
        console.error(`Error verifying existing JWT. Need to relogin: ${(error as Error).message}`);
        logOut();
      }
    }
  }, [logOut, vincentWebAppClient]);

  useEffect(() => {
    try {
      logWithJwt();
    } catch {
      logOut();
    }
  }, [logWithJwt, logOut]);

  return (
    <JwtContext.Provider value={{ authInfo, logWithJwt, logOut }}>{children}</JwtContext.Provider>
  );
};
