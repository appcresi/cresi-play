// Preguntas del juego "Ponelo Bien" (Prevención / uso del preservativo).
// Separado del componente para que sea más fácil sumar, editar o revisar
// preguntas sin tocar la lógica del juego.

export interface Step {
  id: number;
  question: string;
  options: {
    text: string;
    emoji: string;
    correct: boolean;
    feedback: string;
  }[];
}

export const stepsData: Step[] = [
  {
    id: 1,
    question: "PASO 1: Estás a punto de usar un preservativo. ¿Cuál es la primera verificación importante?",
    options: [
      { text: "Revisar la fecha de vencimiento cuidadosamente", emoji: "📅", correct: true, feedback: "Correcto. Verificar la fecha de vencimiento es fundamental. Un preservativo vencido pierde efectividad." },
      { text: "Abrirlo rápidamente para no perder el momento", emoji: "⚡", correct: false, feedback: "No es recomendable. Siempre hay que verificar la fecha antes de abrir el envase." },
      { text: "Guardarlo para usar más tarde", emoji: "💾", correct: false, feedback: "Incorrecto. La preparación debe hacerse antes del contacto íntimo." }
    ]
  },
  {
    id: 2,
    question: "PASO 2: El preservativo está en buen estado. ¿Cuál es la forma correcta de abrir el envase?",
    options: [
      { text: "Con los dedos, cuidadosamente por el borde", emoji: "👆", correct: true, feedback: "Excelente. Usar los dedos evita dañar el material del preservativo." },
      { text: "Con los dientes para mayor rapidez", emoji: "🦷", correct: false, feedback: "No recomendado. Los dientes pueden hacer pequeños agujeros imperceptibles." },
      { text: "Con tijeras o cuchillo", emoji: "✂️", correct: false, feedback: "Peligroso. Los objetos cortantes pueden dañar el preservativo." }
    ]
  },
  {
    id: 3,
    question: "PASO 3: Tienes el preservativo en tus manos. ¿Qué debes verificar antes de colocarlo?",
    options: [
      { text: "Que esté orientado correctamente para desenrollarse", emoji: "🔄", correct: true, feedback: "Perfecto. La orientación correcta permite un desenrollado fácil y seguro." },
      { text: "Colocarlo inmediatamente sin verificar", emoji: "⏰", correct: false, feedback: "No es seguro. Siempre hay que verificar la orientación primero." },
      { text: "Inflarlo para verificar que no tenga agujeros", emoji: "🎈", correct: false, feedback: "Incorrecto. Inflarlo puede debilitar el material. Solo verificar visualmente." }
    ]
  },
  {
    id: 4,
    question: "PASO 4: El preservativo está correctamente orientado. ¿Qué hacer con la punta antes de colocarlo?",
    options: [
      { text: "Presionar la punta para expulsar el aire", emoji: "👌", correct: true, feedback: "Correcto. Eliminar el aire previene que se forme una burbuja que podría romperlo." },
      { text: "Humedecerlo con agua", emoji: "💧", correct: false, feedback: "Innecesario. Los preservativos ya vienen con lubricante incorporado." },
      { text: "Colocarlo directamente sin preparación", emoji: "➡️", correct: false, feedback: "No recomendado. Es importante expulsar el aire de la punta primero." }
    ]
  },
  {
    id: 5,
    question: "PASO 5: Has presionado la punta correctamente. ¿Cómo completar la colocación?",
    options: [
      { text: "Desenrollarlo completamente hasta la base", emoji: "📏", correct: true, feedback: "Excelente. La cobertura completa asegura máxima protección." },
      { text: "Cubrir solo la parte superior", emoji: "🔺", correct: false, feedback: "Insuficiente. La protección debe ser completa para mayor seguridad." },
      { text: "Desenrollarlo a medias", emoji: "📊", correct: false, feedback: "Incompleto. Debe desenrollarse completamente para protección óptima." }
    ]
  },
  {
    id: 6,
    question: "PASO 6: Después de la relación sexual, ¿cuál es el procedimiento correcto?",
    options: [
      { text: "Retirarlo cuidadosamente sujetando la base", emoji: "🤲", correct: true, feedback: "Perfecto. Retirar con cuidado evita derrames y mantiene la protección." },
      { text: "Dejarlo puesto hasta que se afloje solo", emoji: "⏳", correct: false, feedback: "Riesgoso. Debe retirarse antes de que se afloje para evitar derrames." },
      { text: "Retirarlo rápidamente de una vez", emoji: "💨", correct: false, feedback: "No recomendado. La retirada brusca puede causar derrames." }
    ]
  },
  {
    id: 7,
    question: "ALMACENAMIENTO: ¿Dónde es mejor guardar los preservativos?",
    options: [
      { text: "En un lugar fresco, seco y sin luz directa", emoji: "🌡️", correct: true, feedback: "Correcto. Las condiciones ideales preservan la integridad del material." },
      { text: "En la billetera para tenerlos siempre", emoji: "💼", correct: false, feedback: "No ideal. El calor corporal y la fricción pueden dañarlos." },
      { text: "En el auto para emergencias", emoji: "🚗", correct: false, feedback: "Problemático. Las temperaturas extremas del auto pueden dañar el látex." }
    ]
  },
  {
    id: 8,
    question: "CONSEJO: Un amigo pregunta si puede usar un preservativo que encontró. ¿Qué le aconsejas?",
    options: [
      { text: "Que verifique la fecha de vencimiento y el estado del envase", emoji: "🔍", correct: true, feedback: "Buen consejo. La verificación es esencial para la seguridad." },
      { text: "Que lo use sin problema, cualquiera sirve", emoji: "🤷", correct: false, feedback: "Mal consejo. No todos los preservativos están en buen estado." },
      { text: "Que lo pruebe inflándolo primero", emoji: "🎈", correct: false, feedback: "Incorrecto. Inflarlo puede debilitarlo y no es método de verificación adecuado." }
    ]
  },
  {
    id: 9,
    question: "REUTILIZACIÓN: ¿Se puede usar el mismo preservativo dos veces en una noche?",
    options: [
      { text: "No, siempre debe usarse uno nuevo cada vez", emoji: "🆕", correct: true, feedback: "Correcto. Cada acto sexual requiere un preservativo nuevo para mantener la efectividad." },
      { text: "Sí, si se lava bien con agua y jabón", emoji: "🧼", correct: false, feedback: "Incorrecto. Lavar no restaura las propiedades protectoras del preservativo." },
      { text: "Sí, si se da vuelta", emoji: "🔃", correct: false, feedback: "Peligroso. Dar vuelta un preservativo usado puede contaminar con fluidos corporales." }
    ]
  },
  {
    id: 10,
    question: "ALERGIAS: Tu pareja menciona alergia al látex. ¿Cuál es la mejor opción?",
    options: [
      { text: "Buscar preservativos de materiales alternativos", emoji: "🔬", correct: true, feedback: "Excelente. Existen preservativos de poliuretano y otros materiales seguros." },
      { text: "Continuar sin protección", emoji: "🚫", correct: false, feedback: "Peligroso. Las alergias son serias y requieren alternativas, no omitir protección." },
      { text: "Suspender la actividad sexual", emoji: "⏹️", correct: false, feedback: "Innecesario. Hay alternativas disponibles sin necesidad de suspender la intimidad." }
    ]
  },
  {
    id: 11,
    question: "REALIDAD vs FICCIÓN: En las películas raramente muestran el uso de preservativos. ¿Qué opinas?",
    options: [
      { text: "Las películas no reflejan la realidad del sexo seguro", emoji: "📺", correct: true, feedback: "Correcto. Las películas priorizan la narrativa sobre la educación sexual realista." },
      { text: "Si no aparece en películas, no es tan importante", emoji: "🤔", correct: false, feedback: "Falso. Los medios de entretenimiento no son fuentes de educación sexual." },
      { text: "Mencionar protección arruina el romanticismo", emoji: "💔", correct: false, feedback: "Incorrecto. Cuidar la salud mutua es un acto de amor y responsabilidad." }
    ]
  },
  {
    id: 12,
    question: "EMERGENCIA: Se rompe el preservativo durante el acto. ¿Cuál es el protocolo correcto?",
    options: [
      { text: "Detenerse inmediatamente y consultar opciones médicas", emoji: "🛑", correct: true, feedback: "Correcto. Existen opciones de anticoncepción de emergencia y profilaxis post-exposición." },
      { text: "Continuar como si nada hubiera pasado", emoji: "👀", correct: false, feedback: "Peligroso. Ignorar la situación aumenta los riesgos considerablemente." },
      { text: "Retirarlo y continuar sin protección", emoji: "🔌", correct: false, feedback: "Muy riesgoso. Continuar sin protección después de una rotura es altamente peligroso." }
    ]
  },
  {
    id: 13,
    question: "COMODIDAD: ¿Qué hacer si los preservativos resultan incómodos?",
    options: [
      { text: "Probar diferentes marcas y tallas hasta encontrar el adecuado", emoji: "📏", correct: true, feedback: "Excelente. La talla correcta es fundamental para comodidad y efectividad." },
      { text: "Aceptar que son incómodos por naturaleza", emoji: "😣", correct: false, feedback: "Falso. Los preservativos bien ajustados deben ser cómodos." },
      { text: "Usar solo cuando sea absolutamente necesario", emoji: "⚠️", correct: false, feedback: "Riesgoso. La protección debe ser consistente, no ocasional." }
    ]
  },
  {
    id: 14,
    question: "COMPATIBILIDAD: ¿Qué tipo de lubricante NO es compatible con preservativos de látex?",
    options: [
      { text: "Lubricantes a base de aceite o petróleo", emoji: "🛢️", correct: true, feedback: "Correcto. Los aceites degradan el látex. Usar solo lubricantes base agua o silicona." },
      { text: "Lubricantes a base de agua", emoji: "💧", correct: false, feedback: "Incorrecto. Los lubricantes base agua son completamente compatibles con látex." },
      { text: "Lubricantes a base de silicona", emoji: "🧴", correct: false, feedback: "Incorrecto. Los lubricantes de silicona también son seguros con látex." }
    ]
  },
  {
    id: 15,
    question: "PREPARACIÓN: Vas a una fiesta o evento social. ¿Cuál es la actitud más responsable?",
    options: [
      { text: "Llevar preservativos por si surge una situación íntima", emoji: "🎯", correct: true, feedback: "Responsable. La preparación es clave para mantener relaciones seguras." },
      { text: "Improvisar si surge la situación", emoji: "🎲", correct: false, feedback: "Riesgoso. La improvisación en temas de salud sexual no es recomendable." },
      { text: "Pedir prestado si es necesario", emoji: "🤝", correct: false, feedback: "No ideal. La responsabilidad personal incluye estar preparado." }
    ]
  },
  {
    id: 16,
    question: "RESPONSABILIDAD COMPARTIDA: ¿De quién es la responsabilidad de tener preservativos?",
    options: [
      { text: "De ambas personas que van a tener relaciones", emoji: "👫", correct: true, feedback: "Correcto. La salud sexual es responsabilidad compartida entre las parejas." },
      { text: "Solo del hombre", emoji: "👨", correct: false, feedback: "Incorrecto. Es un estereotipo desactualizado. Ambos deben estar preparados." },
      { text: "De quien tome la iniciativa", emoji: "🎯", correct: false, feedback: "Incompleto. La responsabilidad es compartida, no solo de quien inicia." }
    ]
  },
  {
    id: 17,
    question: "EDUCACIÓN: ¿Cuál es el mejor enfoque para hablar de sexo seguro?",
    options: [
      { text: "Informar basándose en evidencia científica y sin tabúes", emoji: "🔬", correct: true, feedback: "Excelente. La educación sexual debe ser científica, clara y sin prejuicios." },
      { text: "Cada persona debe investigar por su cuenta", emoji: "🕵️", correct: false, feedback: "Insuficiente. La educación estructurada es importante para evitar información errónea." },
      { text: "Mantener el tema como algo privado y no discutirlo", emoji: "🤐", correct: false, feedback: "Contraproducente. La comunicación abierta es fundamental para la salud sexual." }
    ]
  },
  {
    id: 18,
    question: "PRIMERA VEZ: Alguien va a usar preservativo por primera vez. ¿Qué consejo le das?",
    options: [
      { text: "Practicar colocándolo en privado antes de usarlo con la pareja", emoji: "📚", correct: true, feedback: "Sabio consejo. La práctica previa reduce nervios y asegura uso correcto." },
      { text: "Que aprenda sobre la marcha con su pareja", emoji: "🎭", correct: false, feedback: "No recomendado. La práctica previa es importante para uso correcto." },
      { text: "Que busque tutoriales en internet durante el momento", emoji: "📱", correct: false, feedback: "Impractico. La información debe estudiarse antes, no durante la intimidad." }
    ]
  },
  {
    id: 19,
    question: "ACTITUDES: ¿Los preservativos interfieren con el placer sexual?",
    options: [
      { text: "Con la talla y técnica correctas, no deben interferir significativamente", emoji: "⚖️", correct: true, feedback: "Correcto. El uso adecuado permite disfrutar manteniendo la protección." },
      { text: "Siempre reducen el placer considerablemente", emoji: "📉", correct: false, feedback: "Exagerado. Con el preservativo adecuado, la diferencia es mínima." },
      { text: "Depende del estado de ánimo del momento", emoji: "🎭", correct: false, feedback: "Subjetivo. La percepción varía, pero la protección es objetivamente necesaria." }
    ]
  },
  {
    id: 20,
    question: "PREGUNTA FINAL: ¿Cuál es el principal beneficio del uso de preservativos?",
    options: [
      { text: "Permitir disfrutar la intimidad con tranquilidad y seguridad", emoji: "🕊️", correct: true, feedback: "Excelente. La verdadera libertad sexual viene de la protección y la tranquilidad mental." },
      { text: "Únicamente prevenir embarazos no deseados", emoji: "👶", correct: false, feedback: "Incompleto. También protegen contra infecciones de transmisión sexual." },
      { text: "Demostrar responsabilidad ante la pareja", emoji: "🎓", correct: false, feedback: "Parcial. Aunque es responsable, el beneficio principal es la protección integral." }
    ]
  }
];