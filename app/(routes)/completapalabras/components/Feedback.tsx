import { IconStar } from "@tabler/icons-react";

interface FeedbackProps {
  message: string;
  isComplete: boolean;
  show: boolean;
}

export const Feedback: React.FC<FeedbackProps> = ({ message, isComplete, show }) => {
  if (!show) return null;
  
  return (
    <div className={`relative p-4 mb-6 border-4 border-black rounded-lg transform transition-all duration-300 ${
      isComplete ? 'bg-green-100 rotate-2' : 'bg-yellow-100 -rotate-1'
    }`}>
      <div className="absolute -top-2 -left-2">
        <IconStar className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
      <p className="text-center font-bold text-lg">{message}</p>
    </div>
  );
};