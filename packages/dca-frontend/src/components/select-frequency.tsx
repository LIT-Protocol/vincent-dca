import { FC } from 'react';

import { Box } from '@/components/ui/box';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const FREQUENCIES = [
  {
    label: 'Every minute',
    value: '1 minute',
  },
  {
    label: 'Hourly',
    value: '1 hour',
  },
  {
    label: 'Daily',
    value: '1 day',
  },
  {
    label: 'Weekly',
    value: '1 week',
  },
  {
    label: 'Monthly',
    value: '1 month',
  },
];

export interface FrequencySelectProps {
  disabled?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  value?: string;
}

export const SelectFrequency: FC<FrequencySelectProps> = ({
  disabled,
  onChange,
  value,
  required,
}) => {
  return (
    <Box className="py-0 gap-0 text-center">
      <Label htmlFor="frequency" className="mb-1 block text-sm font-medium">
        Frequency
      </Label>
      <Select required={required} value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="frequency" className="w-full">
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent>
          {FREQUENCIES.map((frequency) => (
            <SelectItem key={frequency.value} value={frequency.value}>
              {frequency.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Box>
  );
};
