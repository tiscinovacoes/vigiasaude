import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex h-12 items-center px-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`head-${i}`} className="flex-1 px-2">
              <div className="h-4 w-2/3 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex h-16 items-center px-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`col-${rowIndex}-${colIndex}`} className="flex-1 px-2">
                <div 
                  className="h-4 bg-gray-100 rounded-md" 
                  style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }}
                ></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
