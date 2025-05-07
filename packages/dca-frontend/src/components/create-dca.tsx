import { useState, FormEvent, FC } from 'react';

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

export const CreateDCA: FC<CreateDCAProps> = ({ onCreate }) => {
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
          <CardTitle className="text-2xl font-bold">Dynamic & Secure DCA on Base</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            This demo agent automatically identifies and purchases the top-performing Base memecoin
            on your predefined schedule.
            <br />
            <br />
            <strong>How It Works (Powered by Vincent):</strong>
            <br />
            Typically, building automated crypto spending agents involves trusting agent developers
            or wallet SaaS companies for <strong>key management</strong>. Vincent enables a more
            secure and simpler process.
            <br />
            <br />
            The agent operates using permissions securely delegated by you, following strict rules
            you establish during setup—such as daily spending limit. These onchain rules are
            cryptographically enforced by{' '}
            <a
              href="https://litprotocol.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Lit Protocol
            </a>
            , ensuring every action stays within your guardrails. With Vincent, you achieve powerful
            automation combined with secure, permissioned execution.
            <br />
            <br />
            <strong>Quick Tip:</strong> Ensure your wallet holds sufficient Base WETH + ETH for the
            demo to function smoothly.
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
