'use client';

import React, { useState } from 'react';
import { FlaggedSessionsTable, FlaggedSession } from '@/components/dashboard/FlaggedSessionsTable';
import { SessionReplayModal } from '@/components/dashboard/SessionReplayModal';

interface Props {
  sessions: FlaggedSession[];
}

export default function ClientInteractiveSection({ sessions }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  return (
    <>
      <FlaggedSessionsTable 
        sessions={sessions} 
        onViewSession={(id) => setSelectedSessionId(id)} 
      />
      
      <SessionReplayModal 
        isOpen={!!selectedSessionId} 
        onClose={() => setSelectedSessionId(null)}
        sessionId={selectedSessionId}
      />
    </>
  );
}
