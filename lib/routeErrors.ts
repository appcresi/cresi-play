// lib/routeErrors.ts
//
// Para que un 500 de una ruta de API diga QUÉ falló sin filtrar detalles
// internos. Antes un error de Firebase Admin (credenciales, permisos de la
// cuenta de servicio, token mal formado...) llegaba al navegador como un
// "SERVER_ERROR" mudo y solo se podía diagnosticar entrando a los logs del
// hosting. Un código como `auth/argument-error` o `7` (PERMISSION_DENIED de
// gRPC) no expone nada sensible y acorta el diagnóstico.
export function errorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string' || typeof code === 'number') return String(code);
    const name = (err as { name?: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return 'UNKNOWN';
}
