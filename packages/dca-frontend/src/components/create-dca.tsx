import React, { useState, FormEvent } from 'react';

import { useBackend } from '@/hooks/useBackend';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_VALUE, InputAmount } from '@/components/input-amount';
import { FREQUENCIES, SelectFrequency } from '@/components/select-frequency';

export interface CreateDCAProps {
  onCreate?: () => void;
}

export const CreateDCA: React.FC<CreateDCAProps> = ({ onCreate }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [name] = useState<string>('name');
  const [purchaseAmount, setPurchaseAmount] = useState<string>(DEFAULT_VALUE);
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[0].value);
  const { createDCA } = useBackend();

  const handleCreateDCA = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!purchaseAmount || Number(purchaseAmount) <= 0) {
      alert('Please enter a positive DCA amount.');
      return;
    }
    if (!frequency) {
      alert('Please select a frequency.');
      return;
    }

    try {
      setLoading(true);
      await createDCA({
        name,
        purchaseAmount,
        purchaseIntervalHuman: frequency,
      });
      onCreate?.();
    } catch (error) {
      console.error('Error creating DCA:', error);
      alert('Error creating DCA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between bg-white p-6 shadow-sm">
      <form onSubmit={handleCreateDCA}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Start DCA into Top Base Memecoins</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            This system will automatically purchase the top memecoin using WETH on Base at regular
            intervals based on your schedule.
            <br />
            <br />
            Fund your wallet with Base WETH and ETH to start. Without it, your transactions will not
            execute or even fail.
          </CardDescription>
        </CardHeader>

        <Separator className="my-8" />

        <CardContent className="my-8">
          <Box className="space-y-4">
            <InputAmount
              required
              value={purchaseAmount}
              onChange={setPurchaseAmount}
              disabled={loading}
            />

            <Separator />

            <SelectFrequency
              required
              value={frequency}
              onChange={setFrequency}
              disabled={loading}
            />
          </Box>
        </CardContent>

        <Separator className="my-8" />

        <CardFooter className="flex justify-center">
          <Button className="w-full" type="submit">
            Create DCA
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
