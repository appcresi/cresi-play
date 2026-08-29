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
  badge,
  onClick,
}: {
  isOn: boolean;
  color: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Etiqueta opcional (por ahora, el ciclo/edad al que está pensada la
   *  sección) — solo la pasa ActivitiesPicker, los demás pickers no la
   *  necesitan. */
  badge?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 ${
      isOn
        ? 'border-transparent shadow-sm'
        : 'border-pink-light dark:border-gray-600 opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
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
    <p className="text-xs font-semibold text-ink dark:text-gray-100 leading-tight mb-0.5 line-clamp-2 break-words">
      {title}
    </p>
    <p className="text-[10px] text-ink/60 dark:text-gray-400 leading-tight">{subtitle}</p>
    {badge && (
      <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-ink/5 dark:bg-gray-700 text-ink/70 dark:text-gray-300">
        {badge}
      </span>
    )}
  </button>
);
