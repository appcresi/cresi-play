import { IconStar } from "@tabler/icons-react";

interface FeedbackProps {
  message: string;
  isComplete: boolean;
  show: boolean;
}

export const Feedback: React.FC<FeedbackProps> = ({ message, isComplete, show }) => {
  if (!show) return null;
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-300 ${
      isComplete 
        ? 'bg-green-50 border-green-200' 
        : 'bg-amber-50 border-amber-200'
    }`}>
      {/* Icono de feedback */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isComplete 
          ? 'bg-green-100' 
          : 'bg-amber-100'
      }`}>
        {isComplete ? (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </div>

      {/* Mensaje */}
      <div className="flex-1">
        <p className={`font-medium ${
          isComplete 
            ? 'text-green-800' 
            : 'text-amber-800'
        }`}>
          {message}
        </p>
      </div>

      {/* Estrella decorativa (solo cuando está completo) */}
      {isComplete && (
        <div className="flex-shrink-0">
          <IconStar className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        </div>
      )}
    </div>
  );
};