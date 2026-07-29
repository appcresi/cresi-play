'use client';

export default function TriviaSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-5 border border-gray-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon badge */}
              <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />

              <div className="flex-1 min-w-0 space-y-2">
                {/* Title */}
                <div className="h-4 bg-gray-200 rounded-md w-2/3" />
                {/* Description */}
                <div className="h-3.5 bg-gray-100 rounded-md w-1/2" />
                {/* Badges */}
                <div className="flex gap-2 pt-0.5">
                  <div className="h-5 bg-gray-100 rounded-full w-20" />
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
              </div>
            </div>

            {/* Buttons placeholder: 1 pill (Jugar) + 5 íconos circulares */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="h-9 w-20 bg-gray-200 rounded-full" />
              <div className="h-9 w-9 bg-gray-100 rounded-full" />
              <div className="h-9 w-9 bg-gray-100 rounded-full" />
              <div className="h-9 w-9 bg-gray-100 rounded-full" />
              <div className="h-9 w-9 bg-gray-100 rounded-full" />
              <div className="h-9 w-9 bg-gray-100 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}