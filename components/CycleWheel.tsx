import React from 'react';
import { PHASES } from '../constants';
import { CycleStatus } from '../types';

interface CycleWheelProps {
  status: CycleStatus;
}

const CycleWheel: React.FC<CycleWheelProps> = ({ status }) => {
  const size = 280;
  const center = size / 2;
  const radius = 120;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash based on 28 day cycle for visualization
  const standardCycle = 28;
  const segmentSize = circumference / standardCycle;

  // Helper to create arc path
  const createArc = (startDay: number, endDay: number, color: string) => {
    // This is a simplified visualization assuming a standard 28 day visual ring
    // independent of user actual cycle length to keep the UI clean
    const startAngle = ((startDay - 1) / standardCycle) * 360;
    const endAngle = (endDay / standardCycle) * 360;
    
    // CSS Conic gradients are easier for full rings than SVG paths for this specific "segment" look
    // But SVG allows better interaction if needed later.
    // Let's use a simpler approach: SVG circles with dasharray
    
    // Actually, for a clean look, let's just render the 'active' day progress
    return null; 
  };
  
  const phaseConfig = Object.values(PHASES).find(p => 
    status.day >= p.start && status.day <= p.end
  ) || PHASES.LUTEAL;

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Track */}
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#ffe4e6"
                strokeWidth={strokeWidth}
            />
            
            {/* Active Progress */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={phaseConfig.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - ((status.day / standardCycle) * circumference)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
            />
        </svg>

        {/* Center Content */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold text-gray-800">Day {status.day}</h2>
            <p className="text-sm font-medium uppercase tracking-wide mt-1" style={{ color: phaseConfig.color }}>
                {status.phase} Phase
            </p>
            <div className="mt-4 text-center">
                <p className="text-gray-500 text-xs">Next Period in</p>
                <p className="text-xl font-semibold text-gray-700">{status.daysUntilNext} Days</p>
            </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-3 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Period</span>
        </div>
        <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Ovulation</span>
        </div>
      </div>
    </div>
  );
};

export default CycleWheel;