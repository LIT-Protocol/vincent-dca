import { useCallback, FC } from 'react';
import { reactHelpers } from '@lit-protocol/vincent-sdk';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info } from '@/components/info';
import { REDIRECT_URI } from '@/config';

const { useJwtContext } = reactHelpers;

export const Presentation: FC = () => {
  const { connect } = useJwtContext();

  const getJwt = useCallback(() => {
    connect(REDIRECT_URI);
  }, [connect]);

  return (
    <Card data-testId="presentation" className="w-full md:max-w-md bg-white p-8 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Dynamic & Secure DCA on Base</CardTitle>
        <CardDescription className="text-gray-600">
          Automated Dollar-Cost Averaging for Cryptocurrency
        </CardDescription>
      </CardHeader>

      <Separator className="my-4" />

      <CardContent className="text-center">
        <p className="text-gray-700">
          Welcome to the Vincent DCA Service. This application allows you to set up automated
          dollar-cost-averaging for your cryptocurrency investments on Base.
        </p>
        <p className="mt-4 text-gray-700">Support for more chains coming soon.</p>
        <p className="mt-4 text-gray-700">
          To get started, please Auth with Vincent to manage your DCA schedules.
        </p>
        <p className="mt-4 text-gray-700">
          This app is provided to demonstrate the capabilities of the Vincent platform, and not
          intended for production use.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col items-center">
        <Button onClick={getJwt} className="bg-purple-600 text-white hover:bg-purple-700">
          Auth with Vincent
        </Button>
        <Info />
      </CardFooter>
    </Card>
  );
};
