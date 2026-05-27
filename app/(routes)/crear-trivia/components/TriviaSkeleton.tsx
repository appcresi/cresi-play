'use client';

export default function TriviaSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-6 border border-gray-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              {/* Title */}
              <div className="h-5 bg-gray-200 rounded-md w-2/3" />
              {/* Description */}
              <div className="h-4 bg-gray-100 rounded-md w-1/2" />
              {/* Badge */}
              <div className="h-6 bg-gray-100 rounded-full w-24" />
            </div>
            {/* Buttons placeholder */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-9 w-20 bg-gray-200 rounded-lg" />
              <div className="h-9 w-24 bg-gray-100 rounded-lg" />
              <div className="h-9 w-9 bg-gray-100 rounded-lg" />
              <div className="h-9 w-9 bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}