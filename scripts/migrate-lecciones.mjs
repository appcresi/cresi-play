/**
 * scripts/migrate-lecciones.mjs
 *
 * Sube el contenido de "Lecciones" (antes hardcodeado en
 * app/(routes)/lecciones/data/lessons.ts, ya borrado) a una colección
 * nueva de Firestore (`lecciones`), con author: 'CRESI'.
 *
 * Incluye las 3 lecciones que ya existían (Pubertad, Sexualidad,
 * Planificación Familiar — con sus imágenes) más 2 lecciones nuevas
 * (Placer Sexual, Mi Primera Vez — sin imagen todavía, el campo es
 * opcional).
 *
 * Cada lección usa un id fijo (mismo slug que tenía en el código) en vez
 * de un id autogenerado — así el script es re-corrible: si ya existe, lo
 * actualiza (upsert) en vez de duplicarlo.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué subiría, sin tocar nada:
 *        node scripts/migrate-lecciones.mjs
 *   2. Si se ve bien, subir de verdad:
 *        node scripts/migrate-lecciones.mjs --apply
 */

import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('❌ Faltan variables de entorno en .env.local (FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).');
  process.exit(1);
}

// API modular (`firebase-admin/app`, `firebase-admin/firestore`), no la
// vieja forma `admin.initializeApp()/admin.apps.length` — desde que se
// actualizó el paquete a v14, `admin.apps` ya no existe en el default
// export y ese estilo viejo rompe en silencio.
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const APPLY = process.argv.includes('--apply');

const lecciones = [
  {
    id: 'pubertad',
    title: 'Pubertad',
    author: 'CRESI',
    lecciones: [
      {
        text: "¡¡Hola!! ¿Cómo están? Hoy vamos a hablar sobre la Pubertad. Empecemos preguntándonos: ¿Cómo te diste cuenta que estabas entrando en la pubertad? ¿Cómo te diste cuenta que estás más grande? Quizás porque la ropa que usabas hace unos años ya no te queda. O porque tenés opiniones diferentes o formas nuevas de ver el mundo. Eso se debe a que estás creciendo. Durante toda nuestra vida pasamos por distintas etapas. Seguramente ahora estás pasando por la pubertad, que es paso de la niñez hacia la adolescencia. La pubertad marca el fin de la niñez, y nos damos cuenta porque experimentamos grandes cambios tanto físicos, como emocionales y psicológicos. Y para qué se dan tantos cambios, para alcanzar la capacidad de reproducirnos.",
        questions: [
          { question: "¿Durante la pubertad solo se experimentan cambios físicos?", correctAnswer: false },
          { question: "¿La pubertad es la etapa de transición de la niñez hacia la adolescencia?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion.png",
      },
      {
        text: "En las mujeres, los cambios más importantes son: Crecimiento de los senos, aparición del vello corporal, aumento del sudor, los ovarios comienzan a ovular y con eso aparecerá la menstruación. En los varones, los cambios que se dan son: Crecimiento de los testículos y el pene, aparición del vello corporal, aumento del sudor, cambios en la voz, los testículos empezarán a producir espermatozoides y con eso aparecerá la eyaculación. Esta etapa trae cambios hormonales que pueden afectar tus emociones, como cambios de humor, irritabilidad y atracción hacia otras personas.  Puede ser que también comiences a cuestionar a tus padres y a desear más libertad. Estos cambios ocurren a su propio ritmo, por lo que es importante no compararse con los demás.",
        questions: [
          { question: "¿Los cambios físicos y emocionales durante esta etapa ocurren al mismo ritmo para todas las personas?", correctAnswer: false },
          { question: "¿En los varones, los testículos comienzan a producir espermatozoides y esto lleva a la aparición de la eyaculación.?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion2.png",
      },
      {
        text: "Si bien los cambios que se dan en la pubertad nos permiten alcanzar la capacidad de reproducirnos, eso no quiere decir que ya tenemos que salir a reproducirnos… Todavía hay mucho que aprender. Entre los cambios físicos que nombramos aparecieron dos palabras que quizás no conocías. Una es la eyaculación y otra la menstruación. ¿Escuchaste hablar de cada una de ellas? Para hablar de eyaculación conviene que empecemos viendo cómo está formado el aparato sexual masculino. Está formado por órganos internos y externos. Los principales órganos externos son los testículos, el epidídimo y el pene. Los testículos se alojan en el escroto. Las estructuras internas son los conductos deferentes y glándulas como la próstata. ",
        questions: [
          { question: "¿El escroto es el lugar donde se alojan los testículos?", correctAnswer: true },
          { question: "¿Entre los principales órganos internos están los testículos y el pene?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion3.png",
      },
      {
        text: "Al llegar la adolescencia los testículos comienzan a producir a los espermatozoides, para lo cual necesitan estar a una temperatura menor a la corporal, por eso están alojados en el escroto. Cuando se produce una estimulación sexual los espermatozoides viajan por los conductos deferentes. A su vez las vesículas seminales y la próstata se contraen, expulsando el semen que se combina con los espermatozoides y viajan por la uretra. Al llegar al orgasmo, o al punto de mayor tensión sexual, el semen es expulsado a través del pene hacia afuera, produciendo la eyaculación. La primera eyaculación se llama espermarquia. A partir de este momento, si los espermatozoides logran llegar a la vagina, podrían fecundar un óvulo y producir un embarazo.",
        questions: [
          { question: "¿Los testículos necesitan estar a una temperatura mayor a la corporal para producir espermatozoides?", correctAnswer: false },
          { question: "¿El semen y los espermatozoides se combinan antes de viajar por la uretra?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion4.png",
      },
      {
        text: "Ahora hablemos de menstruación. Recibe muchos nombres como el periodo o la regla. En el aparato sexual femenino podemos diferenciar dos partes, una externa que es la más visible, y otra interna que no se puede ver a simple vista. En la parte externa podemos diferenciar la vulva, formada por los labios internos y externos, y el clítoris cuya función es brindar placer. Además hay varios orificios: el de la uretra por donde sale la orina, y el orificio de la vagina por donde sale la menstruación. Por el orificio de la vagina se llega al útero, luego a las trompas uterinas y de ahí a los ovarios. Estas son unas glándulas en las que se forman los óvulos y se producen las hormonas estrógeno y progesterona. ",
        questions: [
          { question: "¿El clítoris es parte del aparato sexual femenino y está relacionado con el placer?", correctAnswer: true },
          { question: "¿El orificio de la uretra es por donde sale la menstruación?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion5.png",
      },
      {
        text: "A partir de la adolescencia el útero se empieza a preparar para recibir un posible embarazo. Las paredes del útero se van engrosando con el pasar de los días. Luego sucede la ovulación, es decir la salida del óvulo del ovario. Si en ese momento, se tiene una relación sexual sin protección y un espermatozoides entra por el útero llegando a las trompas uterinas, se da la fecundación. El óvulo fecundado viaja hasta el útero y se implanta en sus paredes. Pero, si después de la salida del óvulo no sucede la fecundación, este se desintegra y entre los 14 días aproximadamente el revestimiento que se había formado en el útero se termina cayendo como coágulos de sangre a través de la vagina.",
        questions: [
          { question: "¿Si no ocurre la fecundación, el óvulo fecundado se implanta en las paredes del útero?", correctAnswer: false },
          { question: "¿La ovulación es la salida del óvulo del ovario?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion6.png",
      },
      {
        text: "Este proceso entre una menstruación y otra puede durar entre 25 a 31 días aproximadamente. Y el sangrado o menstruación dura entre 5 a 7 días, también aproximadamente. La primera menstruación se llama menarquía, y antes que se de la primera menstruación se da la primera ovulación, por lo que a partir de este momento si un espermatozoides logra llegar a la vagina durante una penetración en una relación sexual, podrían fecundar un óvulo y producir un embarazo.",
        questions: [
          { question: "¿El sangrado menstrual puede durar entre 5 a 7 días aproximadamente.?", correctAnswer: true },
          { question: "¿El ciclo menstrual entre una menstruación y otra dura siempre exactamente 28 días?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion7.png",
      },
    ],
  },
  {
    id: 'sexualidad',
    title: 'Sexualidad',
    author: 'CRESI',
    lecciones: [
      {
        text: "La sexualidad humana de acuerdo con la Organización Mundial de la Salud (OMS) se define como: Un aspecto central del ser humano, presente a lo largo de su vida. Abarca al sexo, las identidades y los papeles de género, el erotismo, el placer, la intimidad, la reproducción y la orientación sexual. Se vive y se expresa a través de pensamientos, fantasías, deseos, creencias, actitudes, valores, conductas, prácticas, papeles y relaciones interpersonales. Desde la fecundación entre le óvulo y el espermatozoides se va determinando nuestro sexo. Es una condición biológica determinada y transmitida genéticamente. Se distinguen varios componentes: los cromosomas, los órganos sexuales, la preponderancia de ciertas hormonas y algunas características sexuales secundarias.  La genitalidad es el conjunto de órganos sexuales externos de una persona, es decir, los órganos que se encuentran en la región pélvica y que sirven para la reproducción, y también el placer.",
        questions: [
          { question: "¿La sexualidad humana abarca solo lo biológico como el sexo?", correctAnswer: false },
          { question: "¿La genitalidad incluye únicamente los órganos sexuales internos y no tiene relación con el placer?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion8.png",
      },
      {
        text: "Pero, ¿cuando nos relacionamos con otras personas solo entra en juego la genitalidad o el sexo biológico? Una persona es mucho más que sus genitales, por eso también hablamos de género. El género se refiere a la manera en que la sociedad cree que tenemos que vernos, pensar y actuar como niñas y mujeres, y niños y hombres. Cada cultura tiene sus creencias y reglas informales sobre cómo debe ser  la vestimenta, el lenguaje y la forma en que se comportan las personas según su género. La identidad de género es cómo te sientes en tu interior y cómo expresas tu género a través de tu manera de vestir, de comportarte y de tu apariencia personal. Por último, la orientación sexual es la atracción romántica y/o sexual que una persona siente hacia otras personas. Por ejemplo, la heterosexualidad, la homosexualidad y la bisexualidad.",
        questions: [
          { question: "¿La identidad de género es lo mismo que la orientación sexual?", correctAnswer: false },
          { question: "¿El sexo biológico y la identidad de género son diferentes?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion9.png",
      },
      {
        text: "Hemos visto que la genitalidad es el conjunto de órganos sexuales externos, la sexualidad es la capacidad de sentir y expresar deseo sexual, placer y amor, el sexo es una categoría biológica determinada por lo genético, el género es una categoría social y cultural asignada en función del sexo, la identidad de género es la forma en que una persona se siente y se expresa como hombre, mujer, ambos o ninguno de ellos, y la orientación sexual es la atracción romántica y/o sexual que una persona siente hacia otras personas. En un mundo que a menudo reduce la sexualidad a lo biológico o lo emocional, esta perspectiva integral nos invita a redescubrir la grandeza de nuestra capacidad de amar y construir vínculos. Es importante recordar que estos conceptos no son mutuamente excluyentes y que cada persona es única y tiene derecho a ser respetada y valorada por quien es, sin importar su genitalidad, sexualidad, sexo, género, identidad de género o orientación sexual.",
        questions: [
          { question: "¿El género es una categoría biológica determinada genéticamente?", correctAnswer: false },
          { question: "¿Los conceptos de sexo, género, identidad de género y orientación sexual son mutuamente excluyentes?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion10.png",
      },
      {
        text: "Desde antes de nuestro nacimiento, ya somos seres sexuados, es decir tenemos un sexo biológico. Al nacer de acuerdo a nuestros genitales se nos asigna el sexo femenino o masculino. A medida que crecemos, a través de nuestro cuerpo podemos expresar emociones, nuestra forma de ser y de comportarnos. De esta manera se va formando lo que somos, es decir nuestra identidad de género. La cual es la percepción que tiene una persona de ser mujeres o ser varones. Esto significa que la identidad de género la mayoria de las veces coincide con el sexo biológico. También existen personas que nacen con características físicas femeninas pero se perciben a sí mismos como varones, o personas con características físicas masculinas pero se perciben como mujeres, en estos casos se habla de persona trans o transgénero. Además existen personas que no se identifican ni con el género masculino ni femenino, identificandose con un género no binario.  Es importante destacar que toda persona tiene derecho a explorar su identidad de género sin presión ni discriminación.",
        questions: [
          { question: "¿La identidad de género es la percepción que una persona tiene de ser mujer o varón?", correctAnswer: true },
          { question: "¿Las personas trans son aquellas cuya identidad de género no coincide con el sexo biológico?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion11.png",
      },
      {
        text: "Por otro lado, cuando van pasando los años y nos seguimos desarrollando sentimos que hay personas con las que nos gusta estar, nos agrada, nos pone más felices y hasta nos atraen sexual y amorosamente, como así también nos pasa que hay personas con las que no nos gusta estar. Esta atracción sexual hacia determinados tipo de personas se llama orientación sexual. La orientación sexual de una persona puede ser heterosexual (atracción a personas del sexo opuesto), homosexual (atracción a personas del mismo sexo) o bisexual (atracción a personas de ambos sexos). Ser heterosexual, homosexual o bisexual no es algo que una persona pueda elegir ni elegir cambiar. Forma parte de nuestros derechos ser respetados cualquiera sea nuestra orientación sexual. Podemos resumir diciendo que la identidad de género es lo que somos, y la orientación sexual es lo que sentimos.",
        questions: [
          { question: "¿La orientación sexual es la atracción sexual y amorosa que sentimos hacia determinadas personas?", correctAnswer: true },
          { question: "¿La identidad de género es lo que sentimos, y la orientación sexual es lo que somos?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion12.png",
      },
      {
        text: "Cuando tratamos de definir qué es un varón y qué es una mujer, tendemos a hacer generalizaciones que dejan de lado las particularidades. Estas generalizaciones acerca del género se conocen como estereotipos de género. Un estereotipo es negativo cuando no nos deja actuar con libertad, y no nos permite ser lo que verdaderamente somos o queremos hacer. Cuando decimos que los varones tienen que jugar al fútbol, o jugar con autos, tienen que ser fuertes y deben llevar el pelo corto, estamos dando un estereotipo de género. El problema de este estereotipo es que a un varón le puede no gustar el fútbol y no por eso deja de ser varón, incluso puede haber mujeres a las que le guste el fútbol y no por eso se convierten automáticamente en varones. Entre los estereotipos asociados al varón encontramos por ejemplo: Debe usar color celeste, que le guste el deporte, que trabaje y mantenga a la familia, que no demuestre emociones de ternura ni llore. ",
        questions: [
          { question: "¿Los estereotipos de género son estáticos y no cambian con el tiempo ni entre culturas?", correctAnswer: false },
          { question: "¿Los estereotipos de género pueden limitar la libertad de las personas?", correctAnswer: true },
          { question: "¿Decir que los varones deben jugar al fútbol y llevar el pelo corto es un ejemplo de estereotipo de género?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion13.png",
      },
      {
        text: "Entre los estereotipos asociados a la mujer encontramos por ejemplo: Debe usar color rosado, debe jugar con muñecas, bebés y juguetes relacionados a la tareas de la casa como cocinitas, debe realizar tareas doméstica, debe ser delicada y emocional, etc. ¿Se te ocurren otros? Nuestras expectativas de lo que hacen o cómo deben ser las mujeres y lo que hacen o cómo deben ser los varones va cambiando con la historia, y cambia también entre culturas. Por lo que estos estereotipos no son estáticos, pueden cambiar, y son necesarios cambiarlos cuando no nos dejan ser libres. Debido a esto debemos aprender nuevas formas de ser hombre, y nuevas formas de ser mujer que nos permitan desarrollarnos libremente.",
        questions: [
          { question: "¿A una mujer le puede gustar el fútbol sin dejar de ser mujer?", correctAnswer: true },
          { question: "¿Es innecesario cuestionar los estereotipos de género porque no afectan a la vida de las personas?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion14.png",
      },
    ],
  },
  {
    id: 'planificacion-familiar',
    title: 'Planificación Familiar',
    author: 'CRESI',
    lecciones: [
      {
        text: "A partir de la adolescencia con la maduración de los ovarios que ya pueden liberar óvulos, y de los testículos que ya producen espermatozoides, existe la posibilidad de que se produzcan embarazos.  Pero, aunque el cuerpo ya esté preparado para un embarazo, también se requiere una maduración emocional y psicológica que nos permita afrontar con responsabilidad la tarea de tener una familia. Por eso antes de empezar a tener relaciones sexuales, primero hay que aprender todo lo necesario para planificar o postergar la llegada de un bebé. La planificación familiar es cuando las personas deciden cuándo quieren tener hijos y cómo hacerlo de manera segura y responsable, cuidando la salud de los integrantes de la pareja. Hay muchos métodos anticonceptivos diferentes que pueden ayudar a postergar un embarazo. ",
        questions: [
          { question: "¿Existen múltiples métodos anticonceptivos que pueden ayudar a postergar un embarazo?", correctAnswer: true },
          { question: "¿En la adolescencia, ovarios y testículos pueden producir óvulos y espermatozoides?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion15.png",
      },
      {
        text: "Hay muchos métodos anticonceptivos diferentes que pueden ayudar a postergar un embarazo. El objetivo principal de los anticonceptivos es impedir la unión del óvulo y el espermatozoides, para esto algunos impiden la salida de los óvulos del ovario, o espesan el moco cervical que impiden la llegada del espermatozoides al óvulo, o impiden que los espermatozoides lleguen al útero poniendo una barrera física. Podemos clasificar los anticonceptivos en temporales o definitivos. Los anticonceptivos temporales son aquellos que se utilizan durante un período de tiempo para evitar el embarazo, pero que pueden ser interrumpidos en cualquier momento si se quiere tener un bebé. Por otro lado, los anticonceptivos definitivos son aquellos que proporcionan una protección permanente generalmente a través de una cirugía y no pueden ser reversibles en la mayoría de los casos.",
        questions: [
          { question: "¿Los anticonceptivos impiden la unión del óvulo y el espermatozoide?", correctAnswer: true },
          { question: "¿El moco cervical facilita el paso de espermatozoides?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion16.png",
      },
      {
        text: "También, se pueden clasificar en hormonales o no hormonales. Los anticonceptivos hormonales contienen hormonas sintéticas que imitan a las hormonas femeninas y actúan principalmente impidiendo la ovulación. Estos anticonceptivos se pueden administrar en forma de píldoras, parches, anillos, inyecciones y dispositivos intrauterinos hormonales. Actualmente,  se están estudiando anticonceptivos que detienen la producción de espermatozoides en los testículos. Recordemos que sin óvulo, o sin espermatozoides no hay embarazo. Impidiendo la producción natural de alguno de los dos no hay concepción.  Por otro lado, los anticonceptivos no hormonales no contienen hormonas sintéticas y pueden funcionar de diferentes maneras, como crear una barrera física para impedir la fertilización o hacer que el ambiente vaginal sea menos favorable para que se produzca un embarazo.",
        questions: [
          { question: "¿Los anticonceptivos hormonales impiden la ovulación?", correctAnswer: true },
          { question: "¿Existen píldoras y parches como métodos hormonales?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion17.png",
      },
      {
        text: "Por último, se puede clasificar a los métodos anticonceptivos como de corta o larga duración según el tiempo durante el cual son efectivos y la frecuencia de su uso. Los métodos anticonceptivos de corta duración son aquellos que requieren un uso regular y continuo, como las pastillas anticonceptivas, que deben tomarse diariamente a la misma hora para mantener su efectividad. En cambio, los métodos anticonceptivos de larga duración ofrecen una protección prolongada contra el embarazo con una intervención mínima una vez que se colocan o administran. Por ejemplo, los dispositivos intrauterinos (DIU), tanto hormonales como de cobre, pueden durar entre 3 y 10 años dependiendo del tipo, mientras que los implantes subdérmicos tienen una efectividad de hasta 3 años. ",
        questions: [
          { question: "¿Los métodos de larga duración necesitan uso diario?", correctAnswer: false },
          { question: "¿Las pastillas anticonceptivas deben tomarse diariamente?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion18.png",
      },
      {
        text: "Al elegir un método anticonceptivo, es importante tener en cuenta: La efectividad, es decir el porcentaje de probabilidad que exista un embarazo no deseado. También es necesario tener en cuenta la salud y necesidades especiales de cada persona, incluyendo: posibles alergias, problemas de salud o medicamentos que puedan afectar la eficacia del método anticonceptivo. Por otro lado, hay que evaluar los posibles costos. Algunos métodos pueden ser más costosos que otros, por lo que es importante evaluar los costos a largo plazo y la disponibilidad en el mercado o si existe la posibilidad de obtenerlos en forma gratuita en centros médicos. Ten en cuenta que algunos métodos requieren un uso correcto y diario para ser efectivos. Por lo tanto, se debe evaluar la capacidad de cada persona para seguir las instrucciones de uso. Te recomendamos que consultes a un especialista en salud para obtener más información sobre los diferentes métodos anticonceptivos y puedas elegir el método que mejor se adapte a tus necesidades y preferencias individuales. ",
        questions: [
          { question: "¿La efectividad mide la probabilidad de evitar un embarazo no deseado?", correctAnswer: true },
          { question: "¿Algunos métodos anticonceptivos pueden obtenerse gratis en centros médicos?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion19.png",
      },
      {
        text: "De todos los métodos anticonceptivos el único que previene las infecciones de transmisión sexual es el preservativo. Por eso, para lograr un mayor cuidado y protección de la salud se puede usar el preservativo junto a otros métodos anticonceptivos. Antes de abrir el envoltorio, verifica la fecha de vencimiento del preservativo. No se usa un preservativo que haya pasado la fecha de vencimiento. Abrir el paquete del preservativo cuidadosamente, asegurándose de no rasgarlo con las uñas o los dientes. Verificar que el preservativo esté en buenas condiciones antes de usarlo. Si el preservativo no tiene lubricante, se puede agregar un lubricante a base de agua en la punta del preservativo antes de usarlo. Asegurarse de que el pene esté erecto antes de colocar el preservativo. Apretar la punta del preservativo para dejar un espacio para el semen. Desenrollar suavemente el preservativo hasta la base del pene con la otra mano. Asegúrate de que esté completamente desenrollado para que cubra todo el pene. Después del coito, retira el preservativo mientras el pene aún está erecto, sujetándolo por la base para evitar que se deslice y se derrame el semen. ",
        questions: [
          { question: "¿El preservativo es el único método que previene infecciones de transmisión sexual?", correctAnswer: true },
          { question: "¿Es seguro usar un preservativo vencido si parece estar en buenas condiciones?", correctAnswer: false },
        ],
        imagen: "/images/leccion/imgleccion20.png",
      },
      {
        text: "En la medida que se conozca y se use de forma correcta los preservativos, la eficacia aumenta. En la práctica diaria se cometen algunos errores en su uso, por ejemplo: No usar el preservativo desde el principio a fin de la relación sexual: Recordemos que antes que suceda la eyaculación, del pene sale el líquido preseminal que puede tener espermatozoides que produzca un embarazo. Otro error que se comete es no apretar el aire del extremo del preservativo ya que  si queda aire atrapado en la punta del preservativo, puede causar que se rompa durante el acto sexual. También, a veces no se tiene en cuenta que hay preservativos de distintos tamaños, lo que hace que el preservativo se pueda salir más fácilmente si no queda ajustado. Sumada a esto, muchas personas se equivocan en el uso de lubricantes.  El uso de cualquier aceite puede dañar el preservativo, recordemos usar siempre lubricante a base de agua. En algunos casos se cometen errores al retirar el preservativo. Después del acto sexual, es importante retirarlo adecuadamente para evitar el derrame del semen. Se debe retirar del mismo sujetando la base y desenrollándolo suavemente hacia afuera.",
        questions: [
          { question: "¿El líquido preseminal puede contener espermatozoides?", correctAnswer: true },
          { question: "¿Los preservativos vienen en diferentes tamaños para un mejor ajuste?", correctAnswer: true },
          { question: "¿Es seguro usar aceites como lubricantes con preservativos?", correctAnswer: false },
          { question: "¿Se debe sujetar la base del preservativo al retirarlo para evitar derrames?", correctAnswer: true },
        ],
        imagen: "/images/leccion/imgleccion21.png",
      },
    ],
  },
  {
    id: 'placer-sexual',
    title: 'Placer Sexual',
    author: 'CRESI',
    lecciones: [
      {
        text: "El placer es una sensación de bienestar, alegría y satisfacción que experimentamos cuando hacemos o percibimos algo que nos gusta. Esto puede incluir cosas como pasar tiempo con nuestras amistades, comer una comida deliciosa, leer un buen libro, ver una serie entretenida o cantar una canción. También hay ciertas partes del cuerpo que nos dan más placer que otras. Estas son zonas erógenas que por su sensibilidad provocan sensaciones de placer al ser estimuladas, dado que en ellas se acumulan muchas terminaciones nerviosas. Por ejemplo, el pene tiene cuatro mil terminaciones nerviosas, el clítoris tiene el doble, es decir 8 mil. Esto hace que sean las zonas que mayor sensación de placer nos dan al estimularlas.",
        questions: [
          { question: "¿El placer es una sensación de bienestar y satisfacción?", correctAnswer: true },
          { question: "¿El clítoris tiene menos terminaciones nerviosas que el pene?", correctAnswer: false },
        ],
      },
      {
        text: "Crecer implica conocernos, y mientras una persona más se conoce más libre es para determinar qué cosas le gustan y cuáles no. Por eso la autoexploración de nuestro cuerpo es una actividad normal. De esta forma conocemos nuestra propia anatomía, descubrimos cómo se siente el placer y aprendemos a reconocer los límites entre lo que nos hace sentir bien y lo que no.",
        questions: [
          { question: "¿La autoexploración de nuestro cuerpo es una actividad normal?", correctAnswer: true },
          { question: "¿Conocernos a nosotros mismos nos hace menos libres para saber qué nos gusta?", correctAnswer: false },
        ],
      },
      {
        text: "La masturbación es una forma de autoexploración de los genitales. Es una actividad normal que realizan tanto hombres como mujeres, así como también hay personas que no se masturban y también es normal, porque forma parte de descubrir lo que nos gusta o no. Al estimular el pene en forma directa puede producirse la erección del mismo, en algunos casos, puede aparecer un líquido llamado preseminal, y si la estimulación es muy intensa, puede incluso llegar a la eyaculación. En el caso de la estimulación del clítoris, suceden procesos físicos parecidos, el clítoris aumenta de tamaño, los labios de la vulva pueden cambiar de color producto de la sangre que se acumula en ellos debido a la excitación, puede también aparecer un tipo de mucosidad o líquido que lubrique la vagina y humedezca, incluso puede aparecer una especie de eyaculación. La acumulación de tensión sexual durante la masturbación también puede llevar al orgasmo.",
        questions: [
          { question: "¿La masturbación es una práctica normal tanto para hombres como para mujeres?", correctAnswer: true },
          { question: "¿Es anormal que una persona no se masturbe nunca?", correctAnswer: false },
        ],
      },
      {
        text: "Hay muchos prejuicios asociados a la masturbación, producto de mitos que no son ciertos por ejemplo: ceguera, manos con pelos, infertilidad, etc. Es importante recordar que es una práctica reservada a nuestra intimidad, en donde podamos conectarnos con nosotros mismos y con lo que sentimos. No es correcto hacerlo en lugares públicos, porque estás violentando a otras personas para que vean cosas que no desean ver. Si la masturbación interfiere tu vida social, si ocupa la mayoría de tu energía o tiempo puede ser necesario que hables con una persona adulta o un especialista para que no se transforme en una adicción.",
        questions: [
          { question: "¿Es cierto que la masturbación causa ceguera o hace crecer pelo en las manos?", correctAnswer: false },
          { question: "¿Está bien masturbarse en lugares públicos?", correctAnswer: false },
        ],
      },
      {
        text: "Algunas personas se estimulan sexualmente y sienten placer por lo que ven. Hay imágenes o videos diseñados exclusivamente para excitar llamadas pornografía en donde se muestran contenidos como escenas sexuales explícitas, desnudos o actos sexuales. La pornografía está dirigida a adultos, y en la mayoría de los casos está llena de estereotipos en donde se cosifican a las personas con el único objeto de tener placer. También la mayoría de la pornografía promueve estándares de belleza que son irreales, sin tener en cuenta la diversidad corporal de las personas. Así como tampoco se enfoca en los sentimientos de las personas que intervienen en una relación sexual, y mucho menos en el amor. Puede ser que sintamos curiosidad de ver pornografía, pero es importante destacar que las relaciones sexuales son mucho más complejas de lo que se muestra en una película pornográfica, por eso no deben ser consideradas un recurso para aprender de sexualidad o un modelo a imitar. Recordá que en una relación sexual debe haber respeto y afecto hacia la otra persona. Una persona no siempre puede estar disponible sexualmente como se muestra en las películas pornográficas, ni siempre debe tener ganas de tener relaciones.",
        questions: [
          { question: "¿La pornografía muestra de forma realista los cuerpos y las relaciones sexuales?", correctAnswer: false },
          { question: "¿Una persona siempre debe estar disponible para tener relaciones sexuales?", correctAnswer: false },
        ],
      },
    ],
  },
  {
    id: 'mi-primera-vez',
    title: 'Mi Primera Vez',
    author: 'CRESI',
    lecciones: [
      {
        text: "Muchos jóvenes experimentan ansiedad o incertidumbre cuando se acerca su primera vez sexual. Puede que se pregunten si su cuerpo cambiará o si dolerá. También, si la persona con la que tendremos relaciones sexuales es la correcta. Veamos un ejemplo sencillo, una persona de 12 años podría encender un auto y conducirlo, físicamente nada se lo impide. Entonces, ¿por qué no es legal que una persona de 12 años pueda manejar un automóvil? Esto se debe a que si bien tiene cierta madurez física, no tiene la madurez necesaria para afrontar las consecuencias de si chocara a otra persona. Algo parecido sucede con la sexualidad. A partir de la primera eyaculación o de la primera menstruación, una persona ya tiene cierta madurez física para tener relaciones, pero puede pasar que todavía no tenga la madurez psicológica o afectiva para vivir en forma responsable la acción que está por realizar. La edad apropiada para tener una primera relación sexual depende de muchos factores, como la cultura, la religión, los valores familiares y personales, entre otros.",
        questions: [
          { question: "¿Es normal sentir ansiedad o incertidumbre antes de la primera relación sexual?", correctAnswer: true },
          { question: "¿Tener madurez física para tener relaciones significa automáticamente tener también la madurez psicológica necesaria?", correctAnswer: false },
        ],
      },
      {
        text: "La primera experiencia sexual es un gran momento que recordaremos toda la vida, podemos hacer de ese momento un buen recuerdo. Para que sea un buen momento hay varias cuestiones a tener en cuenta en la primera experiencia sexual: La primera es que nadie te apura. Respeta tus tiempos, y haz que las demás personas la respeten. No es una carrera para ver quién lo hace primero, y que tus amistades ya lo hayan hecho no significa que tú tienes la obligación de hacerlo. Que sea un momento vivido en libertad y sin presiones. Tampoco debés tener relaciones para demostrar amor.",
        questions: [
          { question: "¿Es una carrera para ver quién tiene relaciones sexuales primero?", correctAnswer: false },
          { question: "¿Hay que tener relaciones sexuales para demostrar amor?", correctAnswer: false },
        ],
      },
      {
        text: "El sexo puede tener consecuencias no deseadas como un embarazo o el contraer una infección de transmisión sexual. Por eso es importante prever con anticipación qué método anticonceptivo se va a utilizar. Aprende a usarlos con antelación, para cuando llegue el momento no haya riesgo de cometer errores, para esto busca información y especialistas que te expliquen cómo se usan. Hay muchas opciones disponibles, como preservativos, anticonceptivos hormonales y dispositivos intrauterinos. Siempre es recomendable usar preservativo junto a otro método para lograr mayor efectividad.",
        questions: [
          { question: "¿Es importante prever con anticipación qué método anticonceptivo se va a usar?", correctAnswer: true },
          { question: "¿Usar preservativo junto a otro método aumenta la efectividad?", correctAnswer: true },
        ],
      },
      {
        text: "También es necesario que haya una comunicación abierta y honesta con tu pareja sobre tus límites, deseos y expectativas antes de tener relaciones sexuales. Este es el momento para comentarle tus miedos y tus fantasías. La intimidad comienza cuando nos atrevemos a abrir el corazón y contar lo qué nos pasa. Recuerda que es muy importante el consentimiento, por eso asegúrate de que todas las personas involucradas estén de acuerdo en tener relaciones sexuales y que no hay presión por parte de ninguna.",
        questions: [
          { question: "¿Es importante hablar con tu pareja sobre tus límites y deseos antes de tener relaciones?", correctAnswer: true },
          { question: "¿El consentimiento debe darse sin ningún tipo de presión?", correctAnswer: true },
        ],
      },
      {
        text: "Por otro lado, es fundamental tener expectativas realistas. Es necesario entender que la primera vez puede no ser perfecta y que es normal sentir nerviosismo o incertidumbre. Incluso puede ser que los nervios no te jueguen una buena pasada y no se produzca una erección o no haya lubricación, este es un buen momento para hablar. En estas situaciones es muy importante el juego previo, con caricias, besos o abrazos. Además se puede usar un lubricante a base de agua para facilitar la penetración.",
        questions: [
          { question: "¿Es normal que la primera vez no sea perfecta o que haya nerviosismo?", correctAnswer: true },
          { question: "¿Si los nervios impiden la erección o la lubricación, hay que evitar hablarlo?", correctAnswer: false },
        ],
      },
      {
        text: "Puede que la primera vez que haya penetración en la vagina duela o sangre pero no le pasa a todo el mundo. Algunas personas naturalmente tienen más tejido en el himen que otras, por lo que el dolor o sangrado pueden suceder cuando el himen se estira. Pasado el momento de la primera vez pueden surgir muchas emociones, como de amor, culpabilidad o inseguridad. A veces por temor a un embarazo y el estrés de pensar en ello, puede ser que la menstruación se atrase. No hay que perder la calma, pueden buscar asesoramiento de un profesional de la salud si tienes preguntas o inquietudes sobre el tema. Recuerda que tener relaciones sexuales por primera vez es una decisión importante y personal y debes hacerlo cuando te sientas con comodidad y seguridad.",
        questions: [
          { question: "¿El dolor o sangrado en la primera penetración vaginal le pasa a todo el mundo?", correctAnswer: false },
          { question: "¿Es normal sentir distintas emociones (amor, culpa, inseguridad) después de la primera vez?", correctAnswer: true },
        ],
      },
    ],
  },
];

async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se van a crear/actualizar documentos en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada, solo se muestra qué subiría.\n');

  for (const leccion of lecciones) {
    const ref = db.collection('lecciones').doc(leccion.id);
    const existing = await ref.get();
    const status = existing.exists ? '🔁 YA EXISTE, se actualizaría' : '✅ se va a crear';
    console.log(`${status} — "${leccion.title}" (${leccion.lecciones.length} partes)`);

    if (APPLY) {
      const now = new Date().toISOString();
      await ref.set(
        {
          title: leccion.title,
          author: leccion.author,
          lecciones: leccion.lecciones,
          updated_at: now,
          ...(existing.exists ? {} : { created_at: now }),
        },
        { merge: true }
      );
    }
  }

  console.log(`\n${lecciones.length} lecciones en total.`);

  if (!APPLY) {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si el resumen de arriba te parece correcto, corré:');
    console.log('  node scripts/migrate-lecciones.mjs --apply');
  } else {
    console.log('\n✅ Listo.');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo la migración:', err);
  process.exit(1);
});
