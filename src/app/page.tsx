'use client';

import { useAzionConfig } from '@/hooks/useAzionConfig';
import { TokenSetup } from '@/components/TokenSetup';
import { DatabaseList } from '@/components/DatabaseList';
import { DatabaseExplorer } from '@/components/DatabaseExplorer';
import { useState } from 'react';

interface Database {
  id: number;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export default function Page() {
  const { isConfigured, clearToken } = useAzionConfig();
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);

  if (!isConfigured) {
    return <TokenSetup onConfigured={() => {}} />;
  }

  if (selectedDatabase) {
    return (
      <DatabaseExplorer
        database={selectedDatabase}
        onBack={() => setSelectedDatabase(null)}
      />
    );
  }

  return (
    <DatabaseList
      onDatabaseSelect={setSelectedDatabase}
      onLogout={clearToken}
    />
  );
}
