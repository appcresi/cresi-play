// Reexporta el mapa de íconos compartido (components/ActivityIcon.tsx) para
// no romper los imports existentes que apuntan a './icons' dentro de
// components/teacher/. Antes este archivo tenía su propia copia del mapa.
export { ActivityIcon, ICON_MAP } from '@/components/ActivityIcon';
