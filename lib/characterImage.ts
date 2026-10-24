/**
 * El perfil guarda el personaje como "/personajeN.webp": es un id estable
 * (lo validan safeCharacterImage y las reglas), no el archivo que se dibuja.
 * El dibujo real vive en /avatares/ con otro nombre, porque las imágenes
 * optimizadas se cachean un año por URL (ver next.config.js): reutilizar el
 * nombre viejo seguiría mostrando el dibujo anterior.
 * Se usa el retrato (solo la cara): el avatar siempre se muestra en recuadros
 * o círculos chicos, y el cuerpo entero dejaba la cara cortada.
 */
const CHARACTER_ART: Record<string, string> = {
  '/personaje1.webp': '/avatares/aventurero-cara.webp',
  '/personaje2.webp': '/avatares/exploradora-cara.webp',
  '/personaje3.webp': '/avatares/valiente-cara.webp',
};

/** Ruta a dibujar para la imagen de personaje guardada; '' si no hay. */
export function characterImageSrc(image: string | null | undefined): string {
  if (!image) return '';
  const path = `/${image.replace(/^\/+/, '')}`;
  return CHARACTER_ART[path] ?? path;
}
