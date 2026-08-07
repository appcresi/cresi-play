import React from 'react';
import {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodTongueWink2,
  IconBook,
  IconHeart,
  IconMoodPuzzled,
  IconSearch,
} from '@tabler/icons-react';

// Mismo patrón que Features.tsx/ClassroomDesk.tsx: el catálogo guarda el
// ícono como nombre (string), acá lo resolvemos a componente — solo hace
// falta donde realmente se pinta.
export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodTongueWink2,
  IconBook,
  IconHeart,
  IconSearch,
};

export const ActivityIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  const Icon = ICON_MAP[iconName] ?? IconMoodPuzzled;
  return <Icon className={className} />;
};