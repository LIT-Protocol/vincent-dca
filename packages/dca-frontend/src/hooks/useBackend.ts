import { useCallback } from 'react';
import { reactHelpers } from '@lit-protocol/vincent-sdk';

import { BACKEND_URL } from '@/config';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type DCA = {
  lastRunAt: string;
  nextRunAt: string;
  lastFinishedAt: string;
  failedAt: string;
  _id: string;
  disabled: boolean;
  failReason: string;
  data: {
    name: string;
    purchaseAmount: number;
    purchaseIntervalHuman: string;
    vincentAppVersion: number;
    walletAddress: string;
    updatedAt: string;
  };
};

export interface CreateDCARequest {
  name: string;
  purchaseAmount: string;
  purchaseIntervalHuman: string;
}

const { useJwtContext } = reactHelpers;

export const useBackend = () => {
  const { authInfo } = useJwtContext();

  const sendRequest = useCallback(
    async <T>(endpoint: string, method: HTTPMethod, body?: unknown): Promise<T> => {
      if (!authInfo?.jwt) {
        throw new Error('No JWT to query backend');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authInfo.jwt}`,
      };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as { data: T; success: boolean };

      if (!json.success) {
        throw new Error(`Backend error: ${json.data}`);
      }

      return json.data;
    },
    [authInfo]
  );

  const createDCA = useCallback(
    async (dca: CreateDCARequest) => {
      return sendRequest<DCA>('/schedule', 'POST', dca);
    },
    [sendRequest]
  );

  const getDCAs = useCallback(async () => {
    return sendRequest<DCA[]>('/schedules', 'GET');
  }, [sendRequest]);

  const disableDCA = useCallback(
    async (scheduleId: string) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}/disable`, 'PUT');
    },
    [sendRequest]
  );

  const enableDCA = useCallback(
    async (scheduleId: string) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}/enable`, 'PUT');
    },
    [sendRequest]
  );

  const editDCA = useCallback(
    async (scheduleId: string, dca: CreateDCARequest) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}`, 'PUT', dca);
    },
    [sendRequest]
  );

  const deleteDCA = useCallback(
    async (scheduleId: string) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}`, 'DELETE');
    },
    [sendRequest]
  );

  return {
    createDCA,
    deleteDCA,
    disableDCA,
    editDCA,
    enableDCA,
    getDCAs,
  };
};
