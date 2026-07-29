// types/activity.ts
//
// El ícono se guarda como nombre (string, de @tabler/icons-react) y no como
// JSX ya resuelto, para que este archivo lo puedan importar módulos que no
// necesitan renderizar nada (AuthModal, TeacherDashboard, userDataManager).
// Donde sí hace falta pintar el ícono, se resuelve el nombre a componente
// con un mapa chico local (ver ICON_MAP en Features.tsx).
export interface ActivityDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  color: string;
  image: string;
  category: string;
  iconName: string;
  iconSize?: number;
  priority?: boolean;
}