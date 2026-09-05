// lib/joinCode.ts
//
// Generador de códigos cortos para "salas con código" — clases,
// Nube de Palabras, Trivia en Vivo. Antes cada servicio (classroomService,
// wordCloudService, liveTriviaService) tenía su propia copia de este mismo
// alfabeto + generador + loop de reintento; se comparte acá para que un
// cambio (alfabeto, cantidad de reintentos) no tenga que aplicarse tres
// veces. Cada servicio sigue con su propio chequeo de "¿este código ya
// existe?", porque eso sí depende de dónde vive cada colección.
//
// Evitamos caracteres confusos: 0/O, 1/I.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 5): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** Genera un código y reintenta (hasta 5 veces) si `exists` dice que ya
 *  está en uso. Con 32 símbolos posibles por posición, una colisión real
 *  es rarísima incluso en longitud 5 — 5 intentos alcanza de sobra. */
export async function generateUniqueJoinCode(
  exists: (code: string) => Promise<boolean>,
  length = 5
): Promise<string> {
  let code = generateJoinCode(length);
  for (let attempt = 0; attempt < 5 && (await exists(code)); attempt++) {
    code = generateJoinCode(length);
  }
  return code;
}
