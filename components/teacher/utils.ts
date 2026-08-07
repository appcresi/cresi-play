export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return 'Todavía no jugó';
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays > 1) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-AR');
};