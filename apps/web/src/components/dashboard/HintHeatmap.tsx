import React from 'react';

export interface StudentStat {
  id: string;
  name: string;
  sessions_today: number;
  avg_hint_level: number;
  last_active: string;
  hint_distribution: number[]; // [level1_count, level2, level3, level4, level5]
}

interface HintHeatmapProps {
  students: StudentStat[];
}

// Colors for hint levels 1 to 5 (green to red scale)
const HINT_COLORS = [
  '#10b981', // Level 1 - Green
  '#84cc16', // Level 2 - Light Green/Yellow
  '#f59e0b', // Level 3 - Amber
  '#f97316', // Level 4 - Orange
  '#ef4444', // Level 5 - Red
];

export const HintHeatmap: React.FC<HintHeatmapProps> = ({ students }) => {
  // Sort students by highest average hint level
  const sortedStudents = [...students].sort((a, b) => b.avg_hint_level - a.avg_hint_level);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Student Hint Distribution</h3>
      
      <div className="space-y-6">
        {sortedStudents.map((student) => {
          const totalHints = student.hint_distribution.reduce((sum, count) => sum + count, 0);
          
          return (
            <div key={student.id} className="group">
              <div className="flex justify-between items-end mb-2">
                <span className="font-medium text-sm text-slate-800">{student.name}</span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Avg Hint: {student.avg_hint_level.toFixed(1)}
                </span>
              </div>
              
              {/* SVG Heatmap Bar */}
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                {totalHints > 0 ? (
                  student.hint_distribution.map((count, index) => {
                    if (count === 0) return null;
                    const widthPercent = (count / totalHints) * 100;
                    return (
                      <div
                        key={index}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: HINT_COLORS[index],
                        }}
                        className="h-full transition-all duration-300 hover:opacity-80 cursor-pointer"
                        title={`Level ${index + 1}: ${count} hints`}
                      />
                    );
                  })
                ) : (
                  <div className="w-full h-full bg-slate-200 text-[10px] text-center text-slate-400 font-medium leading-4">No Hints</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
