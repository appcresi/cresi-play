import React from 'react';
import {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconTypography,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconBook,
  IconPuzzle,
  IconShield,
  IconNotebook,
  IconBrain,
  IconBriefcase,
  IconHeart,
  IconHeartHandshake,
  IconMask,
  IconSearch,
  IconPhoto,
} from '@tabler/icons-react';

// Única fuente de verdad para resolver el `iconName` (string) de cada
// actividad en `lib/activities.ts` a su componente de ícono real. Antes
// había 4 copias independientes de este mismo mapa (Features.tsx,
// ClassroomDesk.tsx, WelcomeLanding.tsx, teacher/icons.tsx) — agregar una
// actividad nueva significaba acordarse de actualizar las 4, y si te
// olvidabas una, esa pantalla mostraba el ícono de relleno (IconMoodPuzzled)
// sin que nadie lo notara. Ahora solo hace falta tocar acá.
export const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconTypography,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconBook,
  IconPuzzle,
  IconShield,
  IconNotebook,
  IconBrain,
  IconBriefcase,
  IconHeart,
  IconHeartHandshake,
  IconMask,
  IconSearch,
  IconPhoto,
};

export const ActivityIcon = ({
  iconName,
  size,
  className,
}: {
  iconName: string;
  size?: number;
  className?: string;
}): JSX.Element => {
  const Icon = ICON_MAP[iconName] ?? IconMoodPuzzled;
  return <Icon size={size} className={className} />;
};
