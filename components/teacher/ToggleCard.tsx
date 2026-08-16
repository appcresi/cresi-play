import React from 'react';
import { IconCheck } from '@tabler/icons-react';

// Tarjeta "prender/apagar" con icono en cuadrado de color — la usan
// TriviasPicker, CompletaPalabrasPicker y ActivitiesPicker (misma tarjeta,
// solo cambia el icono/color/texto). InfografiasPicker usa miniatura de
// imagen en vez de icono y QuestionsPicker tiene su propia tarjeta
// expandible, así que se quedan con su propio markup en vez de forzar esta
// misma forma.
export const ToggleCard = ({
  isOn,
  color,
  icon,
  title,
  subtitle,
  onClick,
}: {
  isOn: boolean;
  color: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 ${
      isOn
        ? 'border-transparent shadow-sm'
        : 'border-gray-100 opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
    }`}
    style={isOn ? { borderColor: color, backgroundColor: `${color}0D` } : undefined}
  >
    {isOn && (
      <div
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <IconCheck className="w-3 h-3 text-white" />
      </div>
    )}
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>
    <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 line-clamp-2 break-words">
      {title}
    </p>
    <p className="text-[10px] text-gray-500 leading-tight">{subtitle}</p>
  </button>
);
