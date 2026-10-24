// Correcciones de contenido de octubre 2026 (informe de insights del 23/10).
//
// `match` es el texto ACTUAL de la pregunta (se compara sin distinguir
// mayúsculas ni espacios de más). `set` son los campos nuevos. Se aplican al
// banco (`questions`) y a las copias en las trivias de CrESI; las trivias de
// docentes no se tocan (ver scripts/fix-contenido-2026-10.mjs).

/** Las 5 preguntas con más error del informe: el problema estaba en la pregunta. */
export const correccionesError = [
  {
    // 93% de error. La correcta era "Insomnio, irritabilidad..." pero también
    // estaba "Todas son correctas", que incluía ataques de pánico y fobia
    // social (también son ansiedad): elegir "Todas" era razonable.
    match: '¿Cuáles son los signos y síntomas más comunes de la ansiedad?',
    set: {
      question: '¿Cuál de estos grupos reúne síntomas frecuentes de la ansiedad?',
      answer: 'Preocupación excesiva, inquietud, palpitaciones y dificultad para dormir.',
      options: {
        first: 'Tristeza persistente, pérdida de interés en todo y pensamientos de muerte.',
        second: 'Fiebre, tos y dolor de garganta.',
        third: 'Sentir nervios un rato antes de una prueba y calmarse después.',
      },
      resume: 'La ansiedad se manifiesta con preocupación excesiva y difícil de controlar, inquietud, palpitaciones, tensión muscular y problemas para dormir. Sentir nervios antes de una prueba es normal; se vuelve un problema cuando es intensa, dura mucho o no deja hacer la vida cotidiana. La tristeza persistente y la pérdida de interés son más propias de la depresión. Si te pasa seguido, hablalo con un adulto de confianza o con un profesional de la salud.',
    },
  },
  {
    // 86% de error. La correcta era "Todas las opciones", que incluía
    // agorafobia y fobia social (no son síntomas de depresión): contradecía
    // la pregunta de ansiedad.
    match: '¿Cuáles son los signos y síntomas más comunes de la depresión?',
    set: {
      question: '¿Cuál de estos grupos reúne síntomas frecuentes de la depresión?',
      answer: 'Tristeza persistente, pérdida de interés en las actividades y cambios en el sueño o el apetito.',
      options: {
        first: 'Preocupación excesiva, palpitaciones y miedo intenso sin un motivo claro.',
        second: 'Fiebre, tos y dolor de garganta.',
        third: 'Estar triste un día después de recibir una mala noticia.',
      },
      resume: 'La depresión no es solo estar triste un día: es una tristeza que dura semanas, con pérdida de interés en lo que antes gustaba, cansancio, cambios en el sueño o el apetito y, a veces, pensamientos de muerte. Es un problema de salud que tiene tratamiento. Si te sentís así o te preocupa alguien, hablalo con un adulto de confianza o con un profesional de la salud.',
    },
  },
  {
    // 86% de error. Decía que el útero interviene en la "fertilización", pero
    // la fecundación ocurre en las trompas, y los ovarios también se
    // desarrollan en la pubertad: era ambigua.
    match: '¿Qué órgano interno de las mujeres se desarrolla durante la pubertad y juega un papel en la menstruación y la fertilización?',
    set: {
      question: 'Durante la pubertad, ¿en qué órgano se forma cada mes el endometrio, la capa que se desprende durante la menstruación?',
      answer: 'Útero.',
      options: { first: 'Ovarios.', second: 'Trompas de Falopio.', third: 'Vulva.' },
      resume: 'El útero crece durante la pubertad. Cada mes su capa interna, el endometrio, se engrosa para recibir un posible embarazo; si no ocurre, se desprende y sale como menstruación. Los ovarios producen los óvulos y las hormonas, y la fecundación ocurre en las trompas de Falopio.',
    },
  },
  {
    // 90% de error. La correcta era "Columna vertebral", pero en la pubertad
    // la densidad aumenta en todos los huesos: no había una única respuesta.
    match: '¿Qué parte del cuerpo experimenta un aumento en la densidad ósea durante la pubertad?',
    set: {
      question: '¿Qué pasa con los huesos durante la pubertad?',
      answer: 'Crecen y ganan densidad: se forma una gran parte de la masa ósea de toda la vida.',
      options: {
        first: 'Dejan de crecer por completo.',
        second: 'Pierden calcio y se vuelven más frágiles.',
        third: 'Solo crecen los huesos de la cabeza.',
      },
      resume: 'En la pubertad los huesos crecen rápido (el "estirón") y ganan densidad en todo el cuerpo. En esta etapa se forma una gran parte de la masa ósea que vamos a tener de adultos, por eso ayudan una alimentación con calcio, la actividad física y dormir bien.',
    },
  },
  {
    // 84% de error. La respuesta no mencionaba lo central: que es sin consentimiento.
    match: '¿Qué es el stealthing?',
    set: {
      question: '¿Qué es el stealthing?',
      answer: 'Quitarse el preservativo durante la relación sexual sin el consentimiento de la otra persona.',
      options: {
        first: 'Una infección de transmisión sexual.',
        second: 'Pedirle a la pareja que use preservativo.',
        third: 'Una nueva forma de demostrar amor.',
      },
      resume: 'El stealthing es quitarse el preservativo a escondidas o sin acuerdo durante una relación sexual. Es una forma de violencia sexual: la otra persona aceptó una relación con preservativo, no sin él, y queda expuesta a ITS y a un embarazo no buscado. Si te pasa, no es tu culpa: podés pedir ayuda y hacer la denuncia.',
    },
  },
];

/** Preguntas de Diversidad desactualizadas o con errores (banco y trivia "Diversidad Sexual"). */
export const correccionesDiversidad = [
  {
    // Definía la bisexualidad solo como "mismo sexo y distinto".
    match: '¿A qué se denomina bisexualidad?',
    set: {
      question: '¿A qué se denomina bisexualidad?',
      answer: 'Atracción afectiva o sexual hacia personas de más de un género.',
      options: {
        first: 'Atracción solo hacia personas de distinto género.',
        second: 'Atracción solo hacia personas del mismo género.',
        third: 'No sentir atracción sexual por nadie.',
      },
      resume: 'La bisexualidad es una orientación sexual: la persona puede sentir atracción afectiva o sexual por personas de más de un género. No significa que esté "confundida" ni que tenga que sentir lo mismo por todos los géneros.',
    },
  },
  {
    // "Rol sexual": hoy se habla de rol de género.
    match: '¿Qué es el Rol Sexual?',
    set: {
      question: '¿Qué es el rol de género?',
      answer: 'El conjunto de tareas y conductas que una sociedad espera de una persona según su género.',
      options: {
        first: 'La orientación sexual de una persona.',
        second: 'El sexo biológico.',
        third: 'Una ley que regula la igualdad.',
      },
      resume: 'Los roles de género son expectativas sociales, como "las mujeres cuidan" o "los varones mantienen la casa". No son naturales: cambian según la época y la cultura, y cada persona puede elegir qué tareas y actividades hacer más allá de su género.',
    },
  },
  {
    // Usaba "preferencia", término que se dejó de usar.
    match: '¿Qué es la Orientación Sexual?',
    set: {
      question: '¿Qué es la orientación sexual?',
      answer: 'Hacia quién siente una persona atracción afectiva o sexual.',
      options: {
        first: 'Una infección de transmisión sexual.',
        second: 'Un método anticonceptivo.',
        third: 'El género con el que una persona se identifica.',
      },
      resume: 'La orientación sexual es hacia quién sentimos atracción afectiva o sexual (heterosexual, homosexual, bisexual, asexual, entre otras). No se elige como una preferencia ni se cambia por decisión de otros. No hay que confundirla con la identidad de género, que es quién es cada persona.',
    },
  },
  {
    // Definía travesti como "vestirse de otro género". En Argentina es una identidad.
    match: '¿A qué se llama travestismo?',
    set: {
      question: 'En Argentina, ¿qué significa la palabra travesti?',
      answer: 'Es una identidad de género con la que se reconocen muchas personas de sexo biológico masculino que construyen una identidad femenina.',
      options: {
        first: 'Una persona que se disfraza para una fiesta.',
        second: 'Una orientación sexual.',
        third: 'Una enfermedad.',
      },
      resume: 'En Argentina y América Latina, "travesti" es una identidad de género reivindicada por el propio colectivo, con una larga historia de lucha por sus derechos. La Ley de Cupo Laboral (27.636) lleva el nombre de dos activistas travestis: Diana Sacayán y Lohana Berkins. Lo respetuoso es nombrar a cada persona como ella se identifica.',
    },
  },
  {
    // "Transexualidad": hoy se usa "persona trans".
    match: '¿Qué es la transexualidad?',
    set: {
      question: '¿Qué significa ser una persona trans?',
      answer: 'Que su identidad de género es distinta de su sexo biológico.',
      options: {
        first: 'Que tiene una orientación sexual distinta.',
        second: 'Que se hizo una operación sí o sí.',
        third: 'Que tiene una enfermedad.',
      },
      resume: 'Una persona trans tiene una identidad de género distinta de su sexo biológico. No necesita operarse ni hacer ningún tratamiento para serlo: la Ley de Identidad de Género (26.743) reconoce la identidad según cómo cada persona la vive. Ser trans es una identidad, no una orientación sexual.',
    },
  },
  {
    // Un distractor ("preferencia sexual") estaba desactualizado; se usa la definición de la Ley 26.743.
    match: '¿Qué es la Identidad de Género?',
    set: {
      question: '¿Qué es la identidad de género?',
      answer: 'La vivencia interna de cada persona sobre su género, que puede coincidir o no con su sexo biológico.',
      options: {
        first: 'Una infección de transmisión sexual.',
        second: 'Un método anticonceptivo.',
        third: 'Hacia quién siente atracción una persona.',
      },
      resume: 'Según la Ley 26.743, la identidad de género es la vivencia interna e individual del género tal como cada persona la siente, que puede corresponder o no con su sexo biológico. Es quién soy; la orientación sexual, en cambio, es hacia quién siento atracción.',
    },
  },
  {
    // Un distractor ("Significa homosexual en inglés") era parcialmente cierto.
    match: '¿Qué significa la palabra gay?',
    set: {
      question: '¿Qué significa la palabra gay?',
      answer: 'Manera de referirse a alguien homosexual.',
      options: {
        first: 'Una persona que no siente atracción por nadie.',
        second: 'Intercambio de sexo.',
        third: 'Vestirse del otro sexo.',
      },
      resume: 'Gay es una palabra que usan las personas homosexuales para nombrarse, sobre todo los varones. Es una forma respetuosa de referirse a ellas, a diferencia de los insultos o apodos que discriminan.',
    },
  },
  {
    // Las ITS también se transmiten por contacto de piel y mucosas, no solo de fluidos.
    match: 'En las relaciones sexuales entre dos mujeres, ¿se pueden contraer ITS?',
    set: {
      question: 'En las relaciones sexuales entre dos mujeres, ¿se pueden contraer ITS?',
      answer: 'Sí: las ITS se transmiten por contacto con fluidos, mucosas o piel.',
      options: {
        first: 'Nunca, es muy seguro.',
        second: 'No, porque no hay penetración.',
        third: 'No, porque dos mujeres no pueden tener relaciones sexuales.',
      },
      resume: 'Algunas ITS, como el VPH o el herpes, se transmiten por contacto de piel y mucosas, y otras por fluidos. Por eso en las relaciones entre mujeres también hay que cuidarse: por ejemplo, con campo de látex o preservativo cortado, y no compartiendo juguetes sexuales sin protección.',
    },
  },
  {
    // "Queer" se marcaba como identidad de género y se daba por incorrecto "orientación sexual".
    match: '¿A qué se llama Queer?',
    set: {
      question: '¿A qué se llama queer?',
      answer: 'Un término que usan algunas personas para nombrar una identidad u orientación que no encaja en las categorías tradicionales.',
      options: {
        first: 'Significa reina en inglés.',
        second: 'Es un método anticonceptivo.',
        third: 'Es una enfermedad.',
      },
      resume: 'Queer es una palabra en inglés que antes se usaba como insulto y que el colectivo LGBTIQ+ recuperó con orgullo. Hoy la usan personas cuya identidad de género u orientación sexual no encaja en las categorías tradicionales.',
    },
  },
  {
    // La pregunta estaba incompleta ("¿Cómo se dice...?").
    match: '¿Cómo se dice...?',
    set: {
      question: '¿Cuál es la forma respetuosa de nombrar a alguien que tiene una discapacidad?',
      answer: 'Persona con discapacidad.',
      options: { first: 'Minusválido.', second: 'Persona con capacidades especiales.', third: 'Discapacitado.' },
      resume: '"Persona con discapacidad" es el término de la Convención de las Naciones Unidas sobre los Derechos de las Personas con Discapacidad, que en Argentina tiene jerarquía constitucional. Pone primero a la persona: la discapacidad es una característica, no lo que la define.',
    },
  },
  {
    // La T se traducía como "Transexual" y faltaban letras.
    match: '¿Qué significa LGBT?',
    set: {
      question: '¿Qué significan las siglas LGBTIQ+?',
      answer: 'Lesbianas, gays, bisexuales, trans, intersex, queer y otras identidades y orientaciones.',
      options: {
        first: 'Una infección de transmisión sexual.',
        second: 'Un grupo de rock.',
        third: 'Un grupo que odia a los heterosexuales.',
      },
      resume: 'LGBTIQ+ nombra a lesbianas, gays, bisexuales, personas trans (travestis, transexuales y transgénero), intersex y queer. El "+" incluye otras identidades y orientaciones, como las personas no binarias o asexuales. Las siglas fueron sumando letras para que más personas se sientan nombradas.',
    },
  },
];
