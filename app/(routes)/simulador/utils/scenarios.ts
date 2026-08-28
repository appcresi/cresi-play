export type ChatOutcome = 'safe' | 'unsafe';

export interface ChatOption {
  text: string;
  outcome: ChatOutcome;
  next: string;
  feedbackTitle: string;
  feedbackText: string;
}

export interface ChatNode {
  id: string;
  message: string;
  /** Vacío = esta rama termina la escena (se pasa a la siguiente). */
  options: ChatOption[];
}

export interface ChatScenario {
  id: string;
  startNode: string;
  nodes: Record<string, ChatNode>;
}

// Cada escena arranca con un mensaje del desconocido y se ramifica según
// la respuesta elegida: compartir información hace que la conversación
// escale (el desconocido insiste, cambia de táctica o pide más), mientras
// que poner un límite hace que la insista de otra forma o afloje. Antes
// esto era una lista plana de preguntas sin relación entre sí — ahora cada
// elección tiene una consecuencia visible en el chat, no solo en el
// puntaje. Las 8 escenas cubren señales de alerta distintas: pedir
// ubicación, pedir contacto directo, pedir identidad, pedir fotos, aislar
// con un "secreto", pedir videollamada, sobornar con regalos, y presión
// emocional con una amistad "exclusiva".
export const SCENARIOS: ChatScenario[] = [
  {
    id: 'ubicacion',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: 'Hola! Vi tu perfil y me pareces súper copado/a. ¿A qué escuela vas? Seguro queda cerca de mi casa.',
        options: [
          {
            text: 'Prefiero no compartir esa info con gente que no conozco.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Bien ahí!',
            feedbackText: 'Poner un límite claro y amable es la mejor respuesta. No le debés explicaciones a un desconocido.',
          },
          {
            text: 'Voy a la Escuela N°12, en el centro.',
            outcome: 'unsafe',
            next: 'unsafe_school',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Acabás de darle información que puede usar para ubicarte o esperarte a la salida. Nunca compartas el nombre de tu escuela con desconocidos.',
          },
          {
            text: 'Eh... no sé si debería decirte eso.',
            outcome: 'unsafe',
            next: 'unsafe_hesitant',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Dudar está bien, pero dejar la puerta abierta invita a que sigan insistiendo. La próxima vez, decí que no de forma clara.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Ah, dale, no hay drama. Igual sos re copado/a, ¿seguimos hablando de otra cosa?',
        options: [
          {
            text: 'Sí, dale, pero de cosas generales, nada personal.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Perfecto!',
            feedbackText: 'Podés seguir charlando de temas generales sin compartir datos que te identifiquen.',
          },
          {
            text: 'Bueno, te cuento todo lo que quieras.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Ojo!',
            feedbackText: 'Ceder "un poco" después de haber puesto un límite también es riesgoso — un límite se sostiene, no se negocia.',
          },
        ],
      },
      unsafe_school: {
        id: 'unsafe_school',
        message: 'Genial, ¡la conozco! ¿Y en qué barrio vivís? Así capaz nos cruzamos caminando.',
        options: [
          {
            text: 'Prefiero no decir dónde vivo.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡A tiempo!',
            feedbackText: 'Nunca es tarde para frenar. Cortar acá evita que la situación avance más.',
          },
          {
            text: 'Vivo cerca de la plaza principal.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Peligro!',
            feedbackText: 'Ahora sabe tu escuela y tu zona — es exactamente la información que un desconocido no debería tener.',
          },
        ],
      },
      unsafe_hesitant: {
        id: 'unsafe_hesitant',
        message: 'Dale, no seas tímido/a, ya somos amigos. ¿Cuál es el nombre de tu escuela?',
        options: [
          {
            text: 'No, en serio, prefiero no decirlo.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien hecho!',
            feedbackText: 'Sostener el "no" aunque insistan es exactamente lo que hay que hacer.',
          },
          {
            text: 'Bueno, está bien, te digo.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'La insistencia funcionó — así es como muchos desconocidos consiguen información: presionando hasta que cedés.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
  {
    id: 'contacto',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: 'Sos re piola. ¿Me pasás tu número así hablamos directo por WhatsApp? Acá a veces no me llegan los mensajes.',
        options: [
          {
            text: 'Prefiero seguir hablando por acá.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Bien!',
            feedbackText: 'Quedarte en el mismo canal, sin pasar a algo más privado, es una buena forma de mantener distancia.',
          },
          {
            text: 'Dale, mi número es +54 9 11 1234-5678.',
            outcome: 'unsafe',
            next: 'unsafe_shared',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Ahora tiene una forma directa de contactarte fuera de donde te conoció, sin que nadie más pueda verlo.',
          },
          {
            text: 'No sé si debería... bueno, dale.',
            outcome: 'unsafe',
            next: 'unsafe_gaveIn',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Dudar y después ceder es justo lo que un desconocido espera: que la insistencia funcione.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Bueno, tranqui. ¿Tenés alguna otra red? Así igual hablamos.',
        options: [
          {
            text: 'No, prefiero solo por acá.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Excelente!',
            feedbackText: 'Sostener el límite en todos los canales, no solo en uno, es la forma correcta de manejarlo.',
          },
          {
            text: 'Tengo Instagram, es @mariap.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Ojo!',
            feedbackText: 'Aunque no diste el número, abriste otro canal privado — el resultado termina siendo parecido.',
          },
        ],
      },
      unsafe_shared: {
        id: 'unsafe_shared',
        message: 'Genial, ya te escribí. Guardame como "mejor amigo/a" 😉 ¿A qué hora estás sola/o en tu casa?',
        options: [
          {
            text: 'Prefiero no decir eso.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien ahí!',
            feedbackText: 'Frenar en seco acá evita revelar cuándo estás sin supervisión — una de las preguntas más riesgosas que puede hacer un desconocido.',
          },
          {
            text: 'Estoy sola/o de tarde, mis papás trabajan.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Peligro!',
            feedbackText: 'Revelaste un horario en el que estás sin supervisión — es exactamente la información que buscan estas preguntas.',
          },
        ],
      },
      unsafe_gaveIn: {
        id: 'unsafe_gaveIn',
        message: '¿Viste que no pasa nada? Ahora contame, ¿tus papás revisan tu celular?',
        options: [
          {
            text: 'Sí, y está bien que lo hagan.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien!',
            feedbackText: 'Que un adulto de confianza pueda ver lo que hablás es justamente lo que protege en estas situaciones.',
          },
          {
            text: 'No, casi nunca miran.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Le acabás de decir que nadie va a notar esta conversación — es información que un desconocido usa a su favor.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
  {
    id: 'identidad',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: '¿Cuál es tu nombre completo? Quiero agregarte bien en mis contactos.',
        options: [
          {
            text: 'Con mi apodo alcanza, no hace falta el apellido.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Bien pensado!',
            feedbackText: 'Tu apellido, sumado a otros datos, puede alcanzar para encontrarte. No hace falta darlo para chatear.',
          },
          {
            text: 'Me llamo Martina Gómez.',
            outcome: 'unsafe',
            next: 'unsafe_shared',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Con tu nombre completo, alguien puede buscarte en redes y encontrar más datos tuyos fácilmente.',
          },
          {
            text: 'Uy, no sé si decírtelo...',
            outcome: 'unsafe',
            next: 'unsafe_hesitant',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Dudar es una buena señal, pero hay que animarse a decir que no en vez de quedar a mitad de camino.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Bueno, como quieras. ¿Y tenés hermanos? Pregunto nomás, para conocerte más.',
        options: [
          {
            text: 'Prefiero no hablar de mi familia con desconocidos.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Muy bien!',
            feedbackText: 'La información de tu familia también es información sensible — está bien no compartirla.',
          },
          {
            text: 'Sí, tengo un hermano menor.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Ojo!',
            feedbackText: 'Contar sobre tu familia sigue sumando piezas que un desconocido puede usar para conocer tu rutina.',
          },
        ],
      },
      unsafe_shared: {
        id: 'unsafe_shared',
        message: 'Recién te busqué y encontré tu perfil en otra red. ¿Sos vos la de la foto con el buzo rojo?',
        options: [
          {
            text: 'No voy a confirmar esa información.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien hecho!',
            feedbackText: 'No confirmar te protege: ya usó tu nombre para buscarte, y confirmar le daría certeza de que es tu perfil real.',
          },
          {
            text: 'Sí, esa soy yo.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Peligro!',
            feedbackText: 'Confirmaste tu identidad y cómo te ves — ahora puede reconocerte en persona. Esto es una señal seria: contale a un adulto de confianza.',
          },
        ],
      },
      unsafe_hesitant: {
        id: 'unsafe_hesitant',
        message: 'Dale, contame, prometo que queda solo entre nosotros.',
        options: [
          {
            text: 'No, prefiero no decir mi apellido.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien!',
            feedbackText: 'Sostener el límite, incluso cuando prometen "guardar el secreto", es lo correcto.',
          },
          {
            text: 'Está bien, te lo digo.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'El "queda entre nosotros" es una frase típica para que bajes la guardia — funcionó, y ahora tiene tu apellido.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
  {
    id: 'fotos',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: 'Che, ¿tenés una foto tuya más actual? La de tu perfil está media vieja.',
        options: [
          {
            text: 'No suelo mandar fotos mías a gente que no conozco en persona.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Perfecto!',
            feedbackText: 'No compartir fotos con desconocidos es una de las reglas más importantes para cuidarte.',
          },
          {
            text: 'Dale, te mando una.',
            outcome: 'unsafe',
            next: 'unsafe_sent',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Una vez que mandás una foto, perdés el control sobre dónde termina — puede guardarse o compartirse sin tu permiso.',
          },
          {
            text: 'No sé... bueno, una nomás.',
            outcome: 'unsafe',
            next: 'unsafe_gaveIn',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Ceder "solo una vez" suele ser el primer paso — después llega el pedido de otra, y otra más.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Uy, tranqui, era solo para saber cómo estás. ¿Puedo ver fotos de tu cuarto o de dónde vivís?',
        options: [
          {
            text: 'Tampoco, prefiero no compartir esas cosas.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Muy bien!',
            feedbackText: 'Las fotos de tu casa también revelan mucho sobre dónde vivís — hiciste bien en no mandarlas.',
          },
          {
            text: 'Bueno, te mando una de mi cuarto.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Peligro!',
            feedbackText: 'Las fotos del hogar pueden revelar la zona donde vivís y detalles de tu rutina — es información sensible.',
          },
        ],
      },
      unsafe_sent: {
        id: 'unsafe_sent',
        message: 'Qué linda/o! ¿Tenés alguna en traje de baño de tus vacaciones? Me encantaría verla.',
        options: [
          {
            text: 'No, ese tipo de fotos no las comparto con nadie que no conozco.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien ahí!',
            feedbackText: 'Pedir fotos de tu cuerpo es una señal de alerta grave. Frenar acá y contarle a un adulto de confianza es lo correcto.',
          },
          {
            text: 'Bueno, busco una.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Alerta!',
            feedbackText: 'Esto es una señal de alerta grave: nadie que te respeta te va a pedir fotos así. Contale a un adulto de confianza apenas puedas.',
          },
        ],
      },
      unsafe_gaveIn: {
        id: 'unsafe_gaveIn',
        message: 'Genial, sos re linda/o. ¿Me mandás otra pero sonriendo, de más cerca?',
        options: [
          {
            text: 'No, ya fue suficiente, prefiero no seguir mandando fotos.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien hecho!',
            feedbackText: 'Frenar el pedido "de una más" corta la escalada antes de que siga creciendo.',
          },
          {
            text: 'Bueno, dale.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Pedir "una más" es una técnica para ir escalando de a poco — cada vez pide un poco más que la anterior.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
  {
    id: 'secreto',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: 'Esto que hablamos es un secreto entre nosotros, ¿no? No hace falta que se lo cuentes a tus papás, no lo van a entender.',
        options: [
          {
            text: 'En mi casa no tenemos secretos, si algo me incomoda se los cuento.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Excelente!',
            feedbackText: 'Pedir que guardes un secreto de un adulto de confianza es una de las señales más claras de alerta. Muy bien no aceptarlo.',
          },
          {
            text: 'Dale, no le digo a nadie.',
            outcome: 'unsafe',
            next: 'unsafe_agreed',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Aceptar guardar el secreto te aísla de las personas que podrían ayudarte si algo se pone incómodo.',
          },
          {
            text: 'Bueno, no creo que haga falta contarles.',
            outcome: 'unsafe',
            next: 'unsafe_softAgree',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Aunque no lo dijiste tan directo, terminaste aceptando el pedido de mantenerlo oculto.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Uy, está bien, tranqui. Sos muy correcto/a jaja. ¿Igual seguimos hablando?',
        options: [
          {
            text: 'Sí, pero de cosas generales.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien!',
            feedbackText: 'Podés seguir la charla sin ceder en lo que ya dejaste claro.',
          },
          {
            text: 'Sí, dale, de lo que quieras.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Ojo!',
            feedbackText: 'Aceptar "sin límites" después de haber puesto uno le resta fuerza a lo que ya dijiste.',
          },
        ],
      },
      unsafe_agreed: {
        id: 'unsafe_agreed',
        message: 'Perfecto, sos mi persona de confianza. Ahora contame algo que nunca le dijiste a nadie.',
        options: [
          {
            text: 'No, prefiero no compartir cosas así con vos.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡A tiempo!',
            feedbackText: 'Frenar acá evita crear una falsa intimidad. Contale a un adulto de confianza sobre esta conversación.',
          },
          {
            text: 'Bueno... te cuento algo.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Alerta!',
            feedbackText: 'Compartir secretos personales crea una falsa cercanía que un desconocido puede usar en tu contra. Es momento de contarle a un adulto de confianza.',
          },
        ],
      },
      unsafe_softAgree: {
        id: 'unsafe_softAgree',
        message: 'Genial, así sigue siendo solo nuestro. ¿Nadie sabe que hablamos, no?',
        options: [
          {
            text: 'La verdad es que sí lo saben, no tengo por qué ocultarlo.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Muy bien!',
            feedbackText: 'Romper el aislamiento — que otros sepan de esta conversación — es justamente lo que te protege.',
          },
          {
            text: 'No, nadie sabe.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Alerta!',
            feedbackText: 'Que nadie sepa de esta conversación es una de las señales más peligrosas. Contale a un adulto de confianza, aunque te hayan pedido que no lo hagas.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
  {
    id: 'videollamada',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: '¿Hacemos una videollamada? Así nos conocemos mejor, cara a cara.',
        options: [
          {
            text: 'Prefiero no hacer videollamadas con gente que no conozco en persona.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Bien!',
            feedbackText: 'Una videollamada muestra tu cara, tu voz y tu entorno — mucha información de una sola vez. Está bien decir que no.',
          },
          {
            text: 'Dale, ¿ahora?',
            outcome: 'unsafe',
            next: 'unsafe_accepted',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Aceptar una videollamada con un desconocido expone mucho más que un mensaje de texto.',
          },
          {
            text: 'No sé, ¿para qué sería?',
            outcome: 'unsafe',
            next: 'unsafe_asked',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Preguntar "para qué" deja la puerta abierta en vez de cerrarla directamente.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Bueno, entiendo. ¿Y mandarías un audio nomás? Así te escucho la voz.',
        options: [
          {
            text: 'Tampoco, prefiero seguir escribiendo.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Excelente!',
            feedbackText: 'Un audio también revela tu voz y puede dar pistas de dónde estás — sostener el límite fue lo correcto.',
          },
          {
            text: 'Bueno, te mando uno.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Ojo!',
            feedbackText: 'Un audio deja escuchar tu voz y hasta sonidos de fondo de donde estás — es más información de la que parece.',
          },
        ],
      },
      unsafe_accepted: {
        id: 'unsafe_accepted',
        message: 'Genial, prendé la cámara. ¿Estás en tu cuarto? Mostrame un poco.',
        options: [
          {
            text: 'En realidad, prefiero no hacerlo, me arrepentí.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡A tiempo!',
            feedbackText: 'Nunca es tarde para arrepentirte y frenar, aunque ya hayas aceptado antes.',
          },
          {
            text: 'Bueno, prendo la cámara.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Peligro!',
            feedbackText: 'Mostrar tu entorno por cámara puede revelar dónde vivís y ponerte en una situación de riesgo. Contale a un adulto de confianza.',
          },
        ],
      },
      unsafe_asked: {
        id: 'unsafe_asked',
        message: 'Para conocernos mejor, ¡dale, no seas tímido/a! Va a ser solo un ratito.',
        options: [
          {
            text: 'No, prefiero que no.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien hecho!',
            feedbackText: 'Sostener el "no" aunque insistan con que "va a ser solo un ratito" es la respuesta correcta.',
          },
          {
            text: 'Bueno, está bien.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Ceder ante la insistencia, aunque hayas dudado antes, sigue siendo un riesgo.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
  {
    id: 'soborno',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: 'Tengo códigos gratis para el juego que te gusta. Te los paso si me contás un poco más de vos, ¿va?',
        options: [
          {
            text: 'No hace falta, no necesito nada a cambio de información mía.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Muy bien!',
            feedbackText: 'Ofrecer algo a cambio de datos personales es una técnica común — no caer en el "trato" es lo correcto.',
          },
          {
            text: 'Dale, ¿qué querés saber?',
            outcome: 'unsafe',
            next: 'unsafe_agreed',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Aceptar el "trato" abre la puerta a que te sigan pidiendo cosas a cambio de "regalos".',
          },
          {
            text: 'Mmm, ¿qué tipo de códigos son?',
            outcome: 'unsafe',
            next: 'unsafe_curious',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Mostrar interés en el "regalo" antes de decir que no deja la negociación abierta.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Como quieras, te los mando igual, sin condiciones.',
        options: [
          {
            text: 'Igual prefiero no aceptar regalos de gente que no conozco.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Perfecto!',
            feedbackText: 'Rechazar el regalo por completo evita quedar en deuda con un desconocido, aunque "no pida nada a cambio".',
          },
          {
            text: 'Bueno, dale, gracias.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Ojo!',
            feedbackText: 'Aceptar regalos de desconocidos, aunque parezcan gratis, suele generar una sensación de "deberle algo" a esa persona.',
          },
        ],
      },
      unsafe_agreed: {
        id: 'unsafe_agreed',
        message: 'Buenísimo. Para mandarte el código necesito tu usuario y tu clave, así te lo cargo directo.',
        options: [
          {
            text: 'No, mi clave no la doy nunca, a nadie.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Excelente!',
            feedbackText: 'Nunca hay que compartir contraseñas, ni con amigos ni con desconocidos. Muy bien frenar acá.',
          },
          {
            text: 'Bueno, te la paso.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Alerta!',
            feedbackText: 'Compartir tu contraseña le da acceso total a tu cuenta. Cambiala apenas puedas y contale a un adulto de confianza.',
          },
        ],
      },
      unsafe_curious: {
        id: 'unsafe_curious',
        message: 'Son códigos limitados, se acaban rápido. Decime tu edad y tu ciudad y te guardo uno.',
        options: [
          {
            text: 'No, prefiero no dar esos datos por un código.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien hecho!',
            feedbackText: 'La urgencia ("se acaban rápido") es una táctica para que decidas rápido sin pensar. No caer en eso está muy bien.',
          },
          {
            text: 'Bueno, tengo 12 años y vivo en Escobar.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'La urgencia funcionó: diste tu edad y tu ciudad solo por no perder un "premio". Un regalo nunca vale ese riesgo.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
  {
    id: 'exclusividad',
    startNode: 'root',
    nodes: {
      root: {
        id: 'root',
        message: 'Sos la única persona que me entiende de verdad. Nadie más me habla así. ¿Puedo contar con vos siempre?',
        options: [
          {
            text: 'Está bien que hablemos, pero yo también tengo otros amigos y familia.',
            outcome: 'safe',
            next: 'safe_reply',
            feedbackTitle: '¡Muy bien!',
            feedbackText: 'Dejar en claro que tenés tu vida y tus vínculos evita caer en una relación de dependencia.',
          },
          {
            text: 'Sí, contá conmigo para lo que sea.',
            outcome: 'unsafe',
            next: 'unsafe_agreed',
            feedbackTitle: '¡Cuidado!',
            feedbackText: 'Prometer estar disponible "para lo que sea" es un compromiso muy grande con alguien que recién conocés.',
          },
          {
            text: 'Aww, bueno, trataré de estar.',
            outcome: 'unsafe',
            next: 'unsafe_softAgree',
            feedbackTitle: '¡Casi!',
            feedbackText: 'Aunque suene amable, terminaste aceptando un compromiso que no tenés por qué asumir.',
          },
        ],
      },
      safe_reply: {
        id: 'safe_reply',
        message: 'Está bien, entiendo. Igual sos importante para mí. ¿Hablamos todos los días?',
        options: [
          {
            text: 'Podemos hablar de vez en cuando, no todos los días.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien!',
            feedbackText: 'Marcar la frecuencia con la que querés hablar es parte de sostener tus límites.',
          },
          {
            text: 'Sí, dale, todos los días.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Ojo!',
            feedbackText: 'La exclusividad y la frecuencia excesiva son señales de que se está construyendo una dependencia.',
          },
        ],
      },
      unsafe_agreed: {
        id: 'unsafe_agreed',
        message: 'Qué bueno tenerte. Si alguna vez me siento mal, ¿me vas a responder aunque sea tarde a la noche?',
        options: [
          {
            text: 'No, de noche no puedo estar disponible, tengo mis horarios.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Bien hecho!',
            feedbackText: 'Poner horarios y límites de disponibilidad es sano, incluso con alguien que te cae bien.',
          },
          {
            text: 'Sí, a cualquier hora.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Alerta!',
            feedbackText: 'Estar disponible "a cualquier hora, sin límites" es una señal de manipulación emocional. Nadie tiene derecho a exigirte eso.',
          },
        ],
      },
      unsafe_softAgree: {
        id: 'unsafe_softAgree',
        message: 'Sabía que podía confiar en vos. Sos especial, no como los demás. ¿Verdad que no le contás a nadie lo que hablamos?',
        options: [
          {
            text: 'Eso no te lo puedo prometer, no tengo por qué ocultar de qué hablamos.',
            outcome: 'safe',
            next: 'end',
            feedbackTitle: '¡Excelente!',
            feedbackText: 'El combo "sos especial" + "es un secreto" es una táctica clásica de aislamiento. Muy bien no aceptarla.',
          },
          {
            text: 'No, no le cuento a nadie.',
            outcome: 'unsafe',
            next: 'end',
            feedbackTitle: '¡Alerta!',
            feedbackText: 'Sentirte "especial" y guardar el secreto al mismo tiempo es una combinación de manipulación emocional muy usada. Contale a un adulto de confianza sobre esta conversación.',
          },
        ],
      },
      end: { id: 'end', message: '', options: [] },
    },
  },
];
