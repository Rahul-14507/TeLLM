import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { HintHeatmap, StudentStat } from '@/components/dashboard/HintHeatmap';
import { FlaggedSessionsTable, FlaggedSession } from '@/components/dashboard/FlaggedSessionsTable';
import { SessionReplayModal } from '@/components/dashboard/SessionReplayModal';
import { LayoutDashboard } from 'lucide-react';

interface TeacherSummary {
  total_active_today: number;
  total_active_delta: number;
  avg_hint_level: number;
  avg_hint_delta: number;
  flagged_count: number;
  flagged_delta: number;
  top_topics: string[];
  students: StudentStat[];
  flagged_sessions: FlaggedSession[];
}

async function getTeacherSummary(): Promise<TeacherSummary | null> {
  try {
    const res = await fetch('http://localhost:8000/analytics/teacher-summary', {
      headers: {
        'Authorization': 'Bearer dummy_token_for_mock' 
      },
      next: { revalidate: 60 } // Revalidate every 60s
    });
    
    if (!res.ok) {
      console.error('Failed to fetch teacher summary:', res.status, res.statusText);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching teacher summary:', error);
    return null;
  }
}

// In Next.js App Router, components in app/ directory are Server Components by default
export default async function DashboardPage() {
  const summary = await getTeacherSummary();

  if (!summary) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-500">Could not retrieve data from the server. Ensure the backend is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              Teacher Analytics
            </h1>
            <p className="text-slate-500 mt-2">Class performance and system monitoring overview.</p>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Active Students Today" 
            value={summary.total_active_today} 
            delta={summary.total_active_delta} 
          />
          <StatCard 
            label="Avg Hint Level" 
            value={summary.avg_hint_level.toFixed(1)} 
            delta={summary.avg_hint_delta} 
          />
          <StatCard 
            label="Flagged Sessions" 
            value={summary.flagged_count} 
            delta={summary.flagged_delta} 
          />
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
             <p className="text-sm font-medium text-slate-500 mb-3">Top Topics Struggled With</p>
             <div className="flex flex-wrap gap-2">
               {summary.top_topics.slice(0, 3).map((topic, i) => (
                 <span key={i} className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                   {topic}
                 </span>
               ))}
             </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2/3 width on LG) */}
          <div className="lg:col-span-2 space-y-8">
            <HintHeatmap students={summary.students} />
            
            {/* We cannot have interactity like clicking on a row to open a modal in a Server Component directly.
                Thus we'd normally split this section into a Client Component. 
                For the sake of this MVP without rewriting everything, we'll embed an inline Client Component 
                wrapper or simply provide the view as static if needed by requirements, but the reqs say:
                "Action button: 'View session' -> opens session replay modal"
                This requires a client wrapper around the table & modal.
            */}
            <ClientInteractiveSection sessions={summary.flagged_sessions} />
          </div>

          {/* Right Column (1/3 width on LG) */}
          <div className="space-y-8">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="text-lg font-bold text-slate-900 mb-4">Class Roster Overview</h3>
               <div className="space-y-4">
                 {summary.students.map((student) => (
                   <div key={student.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                     <div>
                       <p className="font-medium text-sm text-slate-800">{student.name}</p>
                       <p className="text-xs text-slate-500">Last seen {student.last_active}</p>
                     </div>
                     <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {student.sessions_today} Sessions
                     </span>
                   </div>
                 ))}
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Client component wrapper for the interactive parts
import ClientInteractiveSection from './ClientInteractiveSection';
