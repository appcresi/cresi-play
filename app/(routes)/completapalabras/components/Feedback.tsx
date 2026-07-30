import { IconStarFilled, IconCircleCheck, IconAlertTriangle } from "@tabler/icons-react";

interface FeedbackProps {
  message: string;
  isComplete: boolean;
  show: boolean;
}

export const Feedback: React.FC<FeedbackProps> = ({ message, isComplete, show }) => {
  if (!show) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
      isComplete
        ? 'bg-green-50 border-green-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isComplete
          ? 'bg-green-100'
          : 'bg-amber-100'
      }`}>
        {isComplete ? (
          <IconCircleCheck className="w-6 h-6 text-green-600" />
        ) : (
          <IconAlertTriangle className="w-6 h-6 text-amber-600" />
        )}
      </div>

      <div className="flex-1">
        <p className={`font-medium ${
          isComplete
            ? 'text-green-800'
            : 'text-amber-800'
        }`}>
          {message}
        </p>
      </div>

      {isComplete && (
        <div className="shrink-0">
          <IconStarFilled className="w-5 h-5 text-yellow-500" />
        </div>
      )}
    </div>
  );
};