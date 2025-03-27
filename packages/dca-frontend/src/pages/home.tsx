import React, { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreateDCA } from '@/components/create-dca';
import { ActiveDcas } from '@/components/active-dcas';
import { Wallet } from '@/components/wallet';

enum Tab {
  CreateDCA = 'create-dca',
  ActiveDCAs = 'active-dcas',
  Wallet = 'balance',
}

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CreateDCA);

  return (
    <div className={'flex flex-col items-center justify-center h-screen w-screen bg-gray-100'}>
      <Tabs
        data-testId="dca-tabs"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
        className="bg-white p-6 shadow-sm min-w-1/2 min-h-3/4"
      >
        <TabsList className="mb-4 flex space-x-2 rounded-md bg-gray-200 p-2 w-full">
          <TabsTrigger value="create-dca">Create DCA</TabsTrigger>
          <TabsTrigger value="active-dcas">Active DCAs</TabsTrigger>
          <TabsTrigger value="balance">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="create-dca">
          <CreateDCA onCreate={() => setActiveTab(Tab.ActiveDCAs)} />
        </TabsContent>
        <TabsContent value="active-dcas">
          <ActiveDcas />
        </TabsContent>
        <TabsContent value="balance">
          <Wallet />
        </TabsContent>
      </Tabs>
    </div>
  );
};
