import { FC } from 'react';

import { Presentation } from '@/components/presentation';

export const Login: FC = () => {
  return (
    <div
      className={'flex flex-col items-center justify-center min-h-screen min-w-screen bg-gray-100'}
    >
      <Presentation />
    </div>
  );
};
