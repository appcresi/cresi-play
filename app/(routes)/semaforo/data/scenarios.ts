// Semáforo del Cuidado — primera actividad pensada específicamente para
// Segundo Ciclo Primario (9-12). El objetivo NO es puntuar "correcto vs.
// incorrecto" ni asustar: es dar vocabulario para reconocer señales propias
// (cuerpo, emociones) en situaciones cotidianas, y reforzar que pedir ayuda
// es un signo de cuidado, no de debilidad.
//
// Por eso cada escenario tiene un solo semáforo "de referencia" con su
// explicación — pero la explicación se muestra siempre, elija lo que elija
// el chico o la chica, en tono de acompañar el razonamiento y no de
// corregir una respuesta "mala". Ver SemaforoDelCuidado.tsx.
//
// Distribución pareja a propósito (9 verde / 8 amarillo / 8 rojo, de 25):
// más de un tercio de las situaciones son ejemplos de cuidado que SÍ está
// bien disfrutar — si todo fuera una señal de alarma, el juego enseñaría
// miedo, no discernimiento.
export type LightColor = 'verde' | 'amarillo' | 'rojo';

export interface SemaforoScenario {
  id: string;
  text: string;
  light: LightColor;
  feedback: string;
}

export const SCENARIOS: SemaforoScenario[] = [
  {
    id: 'secreto-mal',
    text: 'Una persona que conozco me pide que guarde un secreto que me hace sentir mal.',
    light: 'rojo',
    feedback:
      'Cuando un secreto te hace sentir mal, triste o incómodo/a, no tenés que guardarlo. Los secretos que nos hacen sentir así hay que contarlos a una persona adulta de confianza, aunque parezca difícil. Contarlo no es "delatar a nadie" — es cuidarte.',
  },
  {
    id: 'beso-buenas-noches',
    text: 'Mi papá me da un beso en la frente antes de dormir, como todas las noches.',
    light: 'verde',
    feedback:
      'Un gesto de cariño que ya conocés, de alguien que querés, y que a vos te hace sentir bien, está bien disfrutarlo tal cual es.',
  },
  {
    id: 'companero-nuevo',
    text: 'Un compañero nuevo me invitó a sentarme con él en el recreo, pero todavía no sé si me cae bien.',
    light: 'amarillo',
    feedback:
      'No hace falta decidir enseguida si algo o alguien te gusta. Está bien darte tiempo para conocer a una persona y fijarte cómo te sentís vos mientras tanto.',
  },
  {
    id: 'toque-secreto',
    text: 'Un familiar me toca de una manera que no me gusta y me pide que no le cuente a nadie.',
    light: 'rojo',
    feedback:
      'Nadie tiene derecho a tocarte de una forma que no querés, y mucho menos a pedirte que lo guardes en secreto. Esto hay que contarlo a un adulto de confianza lo antes posible. Vos no hiciste nada malo.',
  },
  {
    id: 'cosquillas-respetadas',
    text: 'Le pedí a mi amiga que no me hiciera más cosquillas porque no me gustaban, y ella paró enseguida.',
    light: 'verde',
    feedback:
      '¡Eso es cuidado de verdad! Cuando decís lo que sentís y la otra persona te escucha y lo respeta al toque, la relación está bien.',
  },
  {
    id: 'desconocido-juego',
    text: 'Recibí un mensaje de alguien que no conozco pidiéndome ser su amigo/a en un juego online.',
    light: 'amarillo',
    feedback:
      'Con personas que no conocés en persona, está bien tener dudas antes de aceptar o compartir información. Es un buen momento para preguntarle a un adulto de confianza qué piensa antes de responder.',
  },
  {
    id: 'foto-secreta',
    text: 'Alguien que conocí en un juego online me pide una foto mía y que no se lo cuente a mis papás.',
    light: 'rojo',
    feedback:
      'Pedir fotos y pedir que sea secreto son dos señales importantes de que algo no está bien. No tenés que responder ni sentirte mal por decir que no — y es fundamental contárselo ya a un adulto de confianza.',
  },
  {
    id: 'mama-escucha',
    text: 'Cuando estoy triste, mi mamá me pregunta qué me pasa y me escucha sin apurarme.',
    light: 'verde',
    feedback:
      'Que alguien te escuche con paciencia, sin juzgarte ni apurarte, es una señal de que esa relación te cuida. Está buenísimo tener a alguien así cerca.',
  },
  {
    id: 'risa-companero',
    text: 'Mis amigos se ríen de otro compañero y a mí no me da nada de gracia, pero no sé si decir algo.',
    light: 'amarillo',
    feedback:
      'Sentir que algo no está bien, aunque todavía no sepas cómo actuar, ya es una señal importante. Podés pensarlo con calma, hablarlo con un adulto de confianza, o buscar el momento para decir lo que sentís.',
  },
  {
    id: 'entrenador-incomodo',
    text: 'Un entrenador me abraza de una forma que me hace sentir incómodo/a, y esto pasa seguido.',
    light: 'rojo',
    feedback:
      'Tu incomodidad es una señal válida, aunque la otra persona diga que "no es nada". Si algo se repite y te hace sentir mal, contáselo a un adulto de confianza — está bien pedir ayuda las veces que haga falta.',
  },
  {
    id: 'beso-delante-amigos',
    text: 'Le dije a mi papá que no quería que me diera un beso delante de mis amigos, y él respetó lo que le pedí.',
    light: 'verde',
    feedback:
      'Poner un límite y que te lo respeten es un ejemplo de cuidado real. Tu cuerpo y tus decisiones sobre él importan, incluso con las personas que más querés.',
  },
  {
    id: 'regalo-a-cambio',
    text: 'Un familiar me regaló algo que me gusta mucho y después me pidió que hiciera algo que no tenía muchas ganas de hacer.',
    light: 'amarillo',
    feedback:
      'Un regalo no debería hacerte sentir que ahora "tenés que" hacer algo a cambio. Está bien pensarlo, decir que no si no querés, y comentarlo con otro adulto de confianza si te deja dudas.',
  },
  {
    id: 'tocar-la-puerta',
    text: 'Le pedí a mi hermano que tocara la puerta antes de entrar a mi cuarto, y desde entonces siempre lo hace.',
    light: 'verde',
    feedback:
      'Que respeten tu espacio y tu privacidad, incluso en tu propia casa, es una forma de cuidado. Pedirlo también es un derecho tuyo.',
  },
  {
    id: 'profe-avisa',
    text: 'En el club, el profe nos explicó que si alguna vez algo nos incomoda, podemos decirlo y nos va a escuchar.',
    light: 'verde',
    feedback:
      'Un adulto que te avisa desde el principio que podés hablar si algo te incomoda te está dando una herramienta importante. Guardá esa idea para cualquier situación, no solo en el club.',
  },
  {
    id: 'secreto-lindo',
    text: 'Mi amiga me está guardando el secreto de una fiesta sorpresa que le estamos organizando a mamá.',
    light: 'verde',
    feedback:
      'No todos los secretos son un problema — este es un secreto lindo, pensado para dar una alegría, y no te hace sentir mal ni incómodo/a. Ese tipo de secretos está bien guardarlos.',
  },
  {
    id: 'consulta-medica',
    text: 'En el consultorio, la doctora me explicó por qué me iba a revisar la panza antes de hacerlo, y me dijo que podía preguntar lo que quisiera.',
    light: 'verde',
    feedback:
      'Cuando una revisión médica se hace acompañado/a por un adulto de confianza y te explican qué va a pasar, es parte del cuidado de tu salud. Está bien que tengas preguntas y que las hagas.',
  },
  {
    id: 'espacio-para-cambiarse',
    text: 'En la clase de educación física, nos dejan cambiarnos en un espacio separado si no queremos hacerlo delante de los demás.',
    light: 'verde',
    feedback:
      'Que te den un espacio para tu privacidad cuando lo necesitás es un ejemplo de que tu comodidad importa. No hace falta dar explicaciones para pedirlo.',
  },
  {
    id: 'primo-a-solas',
    text: 'Un primo más grande me invita a jugar a un juego que no conozco a solas, en su cuarto, y no sé si tengo ganas.',
    light: 'amarillo',
    feedback:
      'Está bien no tener ganas de algo aunque no sepas explicar bien por qué. Podés decir que no, proponer jugar en otro lugar, o simplemente pensarlo un poco más antes de decidir.',
  },
  {
    id: 'amenaza-de-exclusion',
    text: 'Un compañero de clase me dice que si cuento lo que pasó en el grupo, voy a quedar afuera de los planes.',
    light: 'amarillo',
    feedback:
      'Que alguien use la amenaza de dejarte afuera para que no cuentes algo es una señal para prestarle atención. Podés hablarlo con un amigo o un adulto de confianza para pensar juntos qué hacer.',
  },
  {
    id: 'video-raro',
    text: 'Vi un video en el celular de un compañero que me hizo sentir raro/a, pero no sé si decir algo.',
    light: 'amarillo',
    feedback:
      'Sentirte raro/a con algo que viste ya es información valiosa, aunque no sepas ponerle nombre todavía. Contárselo a un adulto de confianza te puede ayudar a entender qué pasó y qué hacer.',
  },
  {
    id: 'elogios-y-regalos',
    text: 'Una persona grande que casi no conozco me hace muchos elogios y me regala cosas seguido.',
    light: 'amarillo',
    feedback:
      'Que alguien sea muy amable no es malo en sí mismo, pero si te llama la atención o te genera dudas, está bien contárselo a un adulto de confianza para pensarlo juntos.',
  },
  {
    id: 'videollamada-ropa',
    text: 'Alguien me pide que me saque la remera para una videollamada y me dice que es un juego.',
    light: 'rojo',
    feedback:
      'Nadie tiene que pedirte que te saques la ropa, ni en persona ni por videollamada, y mucho menos llamarlo "juego". Cortá la llamada si podés y contáselo enseguida a un adulto de confianza.',
  },
  {
    id: 'grabacion-sin-permiso',
    text: 'Un compañero más grande me graba con el celular sin que yo se lo permita, y no quiere borrar el video.',
    light: 'rojo',
    feedback:
      'Nadie puede grabarte sin tu permiso y quedarse con eso. Esto hay que contarlo a un adulto de confianza para que te ayude a resolverlo.',
  },
  {
    id: 'pedido-de-mentir',
    text: 'Una persona adulta me pide que le mienta a mis papás sobre dónde estuve.',
    light: 'rojo',
    feedback:
      'Cuando un adulto te pide que le mientas a tu familia, es una señal fuerte de que algo no está bien. Contale a otra persona adulta de confianza lo antes posible.',
  },
  {
    id: 'broma-sobre-el-cuerpo',
    text: 'Un familiar me dice cosas sobre mi cuerpo que me hacen sentir incómodo/a, aunque diga que es en broma.',
    light: 'rojo',
    feedback:
      'Una broma no debería hacerte sentir mal. Si un comentario sobre tu cuerpo te incomoda, tenés derecho a decirlo y a contárselo a otro adulto de confianza.',
  },
];

export const CLOSING_MESSAGE =
  'No hace falta estar 100% seguro/a para pedir ayuda — tener dudas ya es una buena razón para hablar con alguien de confianza. Vos merecés sentirte bien y cuidado/a.';
