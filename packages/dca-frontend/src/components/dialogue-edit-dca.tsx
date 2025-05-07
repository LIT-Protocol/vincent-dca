import { FormEvent, useCallback, useState, FC } from 'react';
import { Pencil } from 'lucide-react';

import { InputAmount } from '@/components/input-amount';
import { SelectFrequency } from '@/components/select-frequency';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DCA, useBackend } from '@/hooks/useBackend';

export interface EditDialogProps {
  dca: DCA;
  onUpdate?: (updatedDCA: DCA) => void;
}

export const DialogueEditDCA: FC<EditDialogProps> = ({ dca, onUpdate }) => {
  const { data } = dca;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [purchaseAmount, setPurchaseAmount] = useState<string>(String(data.purchaseAmount));
  const [frequency, setFrequency] = useState<string>(data.purchaseIntervalHuman);

  const { editDCA } = useBackend();

  const handleEditDCA = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
        const updatedDCA = await editDCA(dca._id, {
          name: data.name,
          purchaseAmount,
          purchaseIntervalHuman: frequency,
        });
        onUpdate?.(updatedDCA);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [dca, editDCA, frequency, onUpdate, purchaseAmount]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleEditDCA}>
          <DialogHeader>
            <DialogTitle>Edit DCA Schedule</DialogTitle>
            <DialogDescription>
              Make changes to your DCA Schedule here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Box className="grid gap-4 py-4">
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
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
