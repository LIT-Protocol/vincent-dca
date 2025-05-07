import { FC } from 'react';

import { Box } from '@/components/ui/box';

export const Info: FC = () => {
  return (
    <Box className="flex-row gap-1 m-4 p-0 text-sm text-gray-500 bg-transparent">
      <a
        href="https://litprotocol.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Vincent Docs
      </a>
      <span className="mx-2">-</span>
      Powered by{' '}
      <a
        href="https://litprotocol.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Lit Protocol
      </a>
    </Box>
  );
};
