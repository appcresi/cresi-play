import { MyTrainingTab } from '@/components/teacher/MyTrainingTab';

// La guarda de rol (solo docentes) ya la hace app/docente/layout.tsx para
// todo lo que cuelga de /docente — no hace falta repetirla acá.
export default function FormacionPage() {
  return <MyTrainingTab />;
}
