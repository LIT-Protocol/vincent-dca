import { useCallback, useEffect, useState, FC } from 'react';
import { Delete, Pause, Play } from 'lucide-react';

import { useBackend, DCA } from '@/hooks/useBackend';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DialogueEditDCA } from '@/components/dialogue-edit-dca';
import { FREQUENCIES } from '@/components/select-frequency';
import { Spinner } from '@/components/ui/spinner';
import { DialogueDcaFailedDetails } from '@/components/dialogue-dca-failed-details';

import { cn } from '@/lib/utils';

function renderDCASchedulesTable(
  activeDCAs: DCA[],
  handleUpdatedDCA: (updatedDCA: DCA) => Promise<void>,
  handleDisableDCA: (dcaId: string) => Promise<void>,
  handleEnableDCA: (dcaId: string) => Promise<void>,
  handleDeleteDCA: (dcaId: string) => Promise<void>
) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Amount (USD)</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Last Update</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {activeDCAs.map((dca) => {
          const {
            disabled,
            lastFinishedAt,
            failedAt,
            _id: uniqueKey,
            data: { purchaseAmount, purchaseIntervalHuman, updatedAt },
          } = dca;

          const failedAfterLastRun =
            failedAt && lastFinishedAt ? new Date(lastFinishedAt) <= new Date(failedAt) : false;

          const active = !disabled;
          return (
            <TableRow key={uniqueKey}>
              <TableCell>${purchaseAmount}</TableCell>
              <TableCell>
                {FREQUENCIES.find((freq) => freq.value === purchaseIntervalHuman)?.label ||
                  purchaseIntervalHuman}
              </TableCell>
              <TableCell>{new Date(updatedAt).toLocaleString()}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    active && !failedAfterLastRun && 'text-green-500',
                    active && failedAfterLastRun && 'text-red-500'
                  )}
                >
                  {!active ? 'Inactive' : failedAfterLastRun ? 'Failed' : 'Active'}
                  {failedAfterLastRun && <DialogueDcaFailedDetails dca={dca} />}
                </span>
              </TableCell>
              <TableCell>
                <Box className="flex flex-row items-center justify-end gap-2 p-1">
                  <DialogueEditDCA dca={dca} onUpdate={handleUpdatedDCA} />
                  {active ? (
                    <Button variant="destructive" onClick={() => handleDisableDCA(dca._id)}>
                      <Pause />
                    </Button>
                  ) : (
                    <Button variant="default" onClick={() => handleEnableDCA(dca._id)}>
                      <Play />
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => handleDeleteDCA(dca._id)}>
                    <Delete />
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function renderSpinner() {
  return (
    <div className="flex items-center justify-center">
      <Spinner />
    </div>
  );
}

function renderContent(
  activeDCAs: DCA[],
  isLoading: boolean,
  handleUpdatedDCA: (updatedDCA: DCA) => Promise<void>,
  handleDisableDCA: (dcaId: string) => Promise<void>,
  handleEnableDCA: (dcaId: string) => Promise<void>,
  handleDeleteDCA: (dcaId: string) => Promise<void>
) {
  console.log('activeDCAs', activeDCAs);
  if (!activeDCAs.length && isLoading) {
    return renderSpinner();
  } else if (activeDCAs.length) {
    return renderDCASchedulesTable(
      activeDCAs,
      handleUpdatedDCA,
      handleDisableDCA,
      handleEnableDCA,
      handleDeleteDCA
    );
  } else {
    return <div className="flex justify-center">No active DCAs</div>;
  }
}

export const ActiveDcas: FC = () => {
  const [activeDCAs, setActiveDCAs] = useState<DCA[]>([]);
  const { deleteDCA, disableDCA, enableDCA, getDCAs } = useBackend();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDCAs = async () => {
      try {
        const dcas = await getDCAs();

        setActiveDCAs(dcas);
      } catch (error) {
        console.error('Error fetching active DCAs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDCAs();
  }, [getDCAs]);

  const handleDisableDCA = useCallback(
    async (dcaId: string) => {
      try {
        await disableDCA(dcaId);

        const updatedDCAs = [...activeDCAs];
        const index = updatedDCAs.findIndex((dca) => dca._id === dcaId);
        updatedDCAs[index].disabled = true;
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, disableDCA, setActiveDCAs]
  );

  const handleEnableDCA = useCallback(
    async (dcaId: string) => {
      try {
        await enableDCA(dcaId);

        const updatedDCAs = [...activeDCAs];
        const index = updatedDCAs.findIndex((dca) => dca._id === dcaId);
        updatedDCAs[index].disabled = false;
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, enableDCA, setActiveDCAs]
  );

  const handleUpdatedDCA = useCallback(
    async (updatedDCA: DCA) => {
      try {
        const updatedDCAs = [...activeDCAs];
        const index = updatedDCAs.findIndex((dca) => dca._id === updatedDCA._id);
        updatedDCAs[index] = updatedDCA;
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, setActiveDCAs]
  );

  const handleDeleteDCA = useCallback(
    async (dcaId: string) => {
      try {
        await deleteDCA(dcaId);

        const updatedDCAs = [...activeDCAs.filter((dca) => dca._id !== dcaId)];
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, deleteDCA, setActiveDCAs]
  );

  return (
    <Card data-test-id="active-dcas" className="w-full bg-white p-6 shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Active DCA Schedules</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent>
        {renderContent(
          activeDCAs,
          isLoading,
          handleUpdatedDCA,
          handleDisableDCA,
          handleEnableDCA,
          handleDeleteDCA
        )}
      </CardContent>
    </Card>
  );
};
