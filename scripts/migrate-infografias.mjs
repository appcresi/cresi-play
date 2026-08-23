/**
 * scripts/migrate-infografias.mjs
 *
 * Sube las 47 infografías (hoy en un archivo data.json estático) a una
 * colección nueva de Firestore (`infografias`), con author: 'CRESI'.
 *
 * IMPORTANTE sobre los títulos: en el archivo original, las 47 infografías
 * tenían el mismo título literal ("Infografía 1") copiado y pegado. Este
 * script genera un título provisorio para cada una a partir del texto de
 * "informacion" (agarra el patrón "El/La X es..." y usa X). Funcionó bien
 * para 29 de las 47 — las otras 18 quedan marcadas con
 * `titleNeedsReview: true` y un título más genérico, para que las corrijas
 * a mano en Firebase Console después de subir (o directo acá en el
 * script, antes de correrlo).
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué subiría, sin tocar nada:
 *        node scripts/migrate-infografias.mjs
 *   2. Si se ve bien, subir de verdad:
 *        node scripts/migrate-infografias.mjs --apply
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

// Copiado de app/(routes)/infografias/data.json, con un título generado
// para cada una (ver comentario arriba). Si el data.json original cambió
// desde la última vez que armamos este script, actualizar acá también.
const infografias = [
  {
    "title": "Hepatitis",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-1.png",
    "download": "/infographics/infographics-1.pdf",
    "informacion": "La hepatitis es la inflamación del hígado, generalmente causada por infecciones virales, aunque también puede ser provocada por el consumo excesivo de alcohol, medicamentos o enfermedades autoinmunes. Existen varios tipos de hepatitis, siendo las más comunes la hepatitis A, B y C, cada una con diferentes modos de transmisión y grados de gravedad. Los síntomas pueden incluir fatiga, fiebre, ictericia y dolor abdominal, aunque algunas personas pueden ser asintomáticas. La prevención incluye la vacunación, prácticas de higiene adecuadas y el acceso a tratamientos médicos para las hepatitis virales."
  },
  {
    "title": "Shealthing",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-2.png",
    "download": "/infographics/infographics-2.pdf",
    "informacion": "El shealthing es una práctica sexual en la que un hombre retira el preservativo durante el acto sexual, pero sin informar a su pareja. Esta práctica puede aumentar el riesgo de transmisión de infecciones de transmisión sexual (ITS) y embarazos no planeados. Aunque algunas personas pueden pensar que mejora la sensación durante el sexo, muchos expertos advierten sobre los peligros de la falta de comunicación y los riesgos asociados. Es fundamental mantener una conversación abierta sobre la salud sexual y el uso adecuado de métodos de protección."
  },
  {
    "title": "Anillo vaginal",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-3.png",
    "download": "/infographics/infographics-3.pdf",
    "informacion": "El anillo vaginal es un método anticonceptivo hormonal que se coloca en la vagina y libera hormonas (estrógeno y progestina) para prevenir el embarazo. Se utiliza de forma continua durante tres semanas, seguido de una semana sin el anillo, durante la cual ocurre la menstruación. Este método es efectivo en un 91-99% cuando se utiliza correctamente y puede ayudar a regular el ciclo menstrual y reducir los síntomas del síndrome premenstrual. Además, el anillo vaginal no requiere atención diaria, lo que lo convierte en una opción conveniente para muchas personas."
  },
  {
    "title": "Parche anticonceptivo",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-4.png",
    "download": "/infographics/infographics-4.pdf",
    "informacion": "El parche anticonceptivo es un método de control de la natalidad que se adhiere a la piel y libera hormonas (estrógeno y progestina) en el torrente sanguíneo para prevenir el embarazo. Se aplica una vez a la semana durante tres semanas, seguido de una semana sin parche, momento en el cual se produce la menstruación. Este método es eficaz en un 91-99% si se utiliza correctamente y puede ofrecer beneficios adicionales, como la regulación del ciclo menstrual y la reducción de síntomas menstruales. El parche es fácil de usar y no requiere atención diaria, lo que lo convierte en una opción conveniente para muchas personas."
  },
  {
    "title": "Anticonceptivo inyectable",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-5.png",
    "download": "/infographics/infographics-5.pdf",
    "informacion": "El anticonceptivo inyectable es un método de control de la natalidad que consiste en la administración de hormonas, generalmente progestina, mediante una inyección intramuscular o subcutánea. Se aplica cada tres meses, lo que proporciona una protección efectiva contra el embarazo con una eficacia del 94-99% cuando se utiliza correctamente. Este método es conveniente para aquellas personas que prefieren no tener que recordar tomar una píldora diariamente y también puede ayudar a regular el ciclo menstrual y reducir los síntomas menstruales. Sin embargo, es importante consultar a un profesional de la salud para discutir los posibles efectos secundarios y determinar si es la opción adecuada para cada persona."
  },
  {
    "title": "Gonorrea",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-6.png",
    "download": "/infographics/infographics-6.pdf",
    "informacion": "La gonorrea es una infección de transmisión sexual (ITS) causada por la bacteria Neisseria gonorrhoeae. Puede afectar tanto a hombres como a mujeres, y los síntomas suelen incluir secreción inusual del pene o la vagina, dolor al orinar y, en algunos casos, dolor abdominal. Si no se trata, la gonorrea puede provocar complicaciones graves, como enfermedad pélvica inflamatoria en mujeres y epididimitis en hombres, así como un mayor riesgo de contraer otras ITS, incluido el VIH. El tratamiento generalmente implica antibióticos, y es importante que las parejas sexuales también se hagan pruebas y reciban tratamiento para evitar la reinfección."
  },
  {
    "title": "Virus del papiloma humano (VPH)",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-7.png",
    "download": "/infographics/infographics-7.pdf",
    "informacion": "El virus del papiloma humano (VPH) es una infección de transmisión sexual muy común que afecta tanto a hombres como a mujeres. Existen más de 100 tipos de VPH, algunos de los cuales pueden causar verrugas genitales o estar asociados con varios tipos de cáncer, como el cáncer de cuello uterino, anal y de garganta. La mayoría de las infecciones por VPH son asintomáticas y suelen desaparecer por sí solas, pero algunas pueden persistir y causar problemas de salud a largo plazo. La vacunación contra el VPH es una forma eficaz de prevenir las infecciones por los tipos de alto riesgo y se recomienda en la adolescencia."
  },
  {
    "title": "VIH (virus de la inmunodeficiencia humana)",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-8.png",
    "download": "/infographics/infographics-8.pdf",
    "informacion": "El VIH (virus de la inmunodeficiencia humana) es un virus que ataca el sistema inmunológico, debilitándolo y dejando al cuerpo vulnerable a infecciones y enfermedades. Si no se trata, el VIH puede progresar a una etapa avanzada conocida como SIDA (síndrome de inmunodeficiencia adquirida), en la que el sistema inmunológico ya no puede defenderse eficazmente. El VIH se transmite a través de ciertos fluidos corporales, como la sangre, el semen y las secreciones vaginales, principalmente durante relaciones sexuales sin protección o el uso compartido de agujas. Aunque no tiene cura, los tratamientos antirretrovirales permiten a las personas con VIH llevar una vida saludable y reducir el riesgo de transmisión."
  },
  {
    "title": "Menarca",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-9.png",
    "download": "/infographics/infographics-9.pdf",
    "informacion": "La menarca es el término médico para referirse a la primera menstruación en una persona, marcando el inicio de la pubertad y la capacidad reproductiva. Generalmente ocurre entre los 9 y 15 años, aunque la edad puede variar según factores genéticos, nutricionales y de salud. La menarca es un proceso natural que suele acompañarse de cambios físicos y emocionales, y es parte del desarrollo del sistema reproductor femenino. Es importante que, previo a la menarca, las jóvenes reciban educación adecuada sobre su cuerpo y el ciclo menstrual para vivir esta etapa con confianza y conocimiento."
  },
  {
    "title": "En Argentina, la detención de menores...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-10.png",
    "download": "/infographics/infographics-10.pdf",
    "informacion": "En Argentina, la detención de menores de edad para la averiguación de antecedentes está limitada por la ley y los principios de derechos humanos. Según la normativa y el Código Penal, las personas menores de edad solo pueden ser detenidas en casos específicos, como la flagrancia de un delito o si existe una orden judicial. La práctica de detener a un menor exclusivamente para averiguar sus antecedentes es generalmente considerada una violación de derechos, ya que se prioriza la protección y el bienestar del menor. Cualquier procedimiento con menores debe respetar la Ley Nacional de Protección Integral de los Derechos de Niños, Niñas y Adolescentes, que enfatiza el derecho a la libertad y el debido proceso"
  },
  {
    "title": "Sífilis",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-11.png",
    "download": "/infographics/infographics-11.pdf",
    "informacion": "La sífilis es una infección de transmisión sexual causada por la bacteria Treponema pallidum. Se desarrolla en varias etapas (primaria, secundaria, latente y terciaria), cada una con síntomas específicos, como llagas en la zona genital, erupciones en la piel y, en casos avanzados, daño a órganos internos. Sin tratamiento, la sífilis puede tener consecuencias graves, pero es fácilmente curable en sus primeras etapas con antibióticos, generalmente penicilina. La detección temprana y el tratamiento adecuado son fundamentales, al igual que el uso de métodos de protección para reducir el riesgo de transmisión."
  },
  {
    "title": "Pene",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-12.png",
    "download": "/infographics/infographics-12.pdf",
    "informacion": "El pene es el órgano sexual masculino que participa en la reproducción y la micción. Está compuesto por tejido eréctil que permite la erección durante la estimulación sexual, facilitando la penetración y la eyaculación, que es la expulsión de esperma. Además, el pene también cumple una función excretora, ya que permite la salida de la orina desde la vejiga. La salud del pene es fundamental para el bienestar sexual y reproductivo, y se recomienda mantener una higiene adecuada y realizar revisiones médicas periódicas para prevenir enfermedades e infecciones."
  },
  {
    "title": "Vagina",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-13.png",
    "download": "/infographics/infographics-13.pdf",
    "informacion": "La vagina es el órgano del sistema reproductor femenino que conecta el útero con el exterior del cuerpo y cumple funciones clave en la reproducción, la menstruación y el parto. Es un conducto muscular y elástico que facilita la salida del flujo menstrual, la relación sexual y, en el momento del parto, el paso del bebé. La vagina también alberga una flora bacteriana natural que ayuda a mantener su pH y protegerla de infecciones. Mantener una buena higiene íntima y acudir a chequeos ginecológicos periódicos son importantes para la salud vaginal y general."
  },
  {
    "title": "Cuando se dice que una infección...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-14.png",
    "download": "/infographics/infographics-14.pdf",
    "informacion": "Cuando se dice que una infección de transmisión sexual (ITS) es asintomática, significa que la persona infectada no presenta síntomas visibles o molestos. Esto puede hacer que la infección pase desapercibida y no se trate a tiempo, aumentando el riesgo de complicaciones de salud y de transmisión a otras personas sin saberlo. Algunas ITS, como el VIH, la clamidia y el VPH, pueden permanecer asintomáticas durante largos períodos, pero aún así afectar la salud a largo plazo. Por ello, es importante realizarse pruebas de detección regularmente, incluso si no se tienen síntomas, para asegurar una buena salud sexual."
  },
  {
    "title": "El calor puede afectar la calidad...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-15.png",
    "download": "/infographics/infographics-15.pdf",
    "informacion": "El calor puede afectar la calidad y efectividad de los preservativos, ya que temperaturas altas pueden debilitar el material (látex o poliuretano) y aumentar el riesgo de rupturas durante su uso. Es recomendable almacenar los preservativos en lugares frescos y evitar dejarlos en sitios expuestos a calor extremo, como automóviles, bolsillos o cerca de fuentes de calor. La exposición prolongada al sol o altas temperaturas puede hacer que el preservativo se vuelva menos flexible y menos resistente. Para asegurar su eficacia, es importante revisar la fecha de vencimiento y mantenerlos en un lugar adecuado antes de usarlos."
  },
  {
    "title": "Contagiar y transmitir son términos relacionados,...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-16.png",
    "download": "/infographics/infographics-16.pdf",
    "informacion": "Contagiar y transmitir son términos relacionados, pero tienen matices diferentes en su uso. Contagiar se refiere al proceso mediante el cual una persona adquiere una enfermedad o infección a través del contacto con alguien que ya está infectado; es decir, implica la recepción del agente infeccioso. Por otro lado, transmitir se refiere al acto de pasar o propagar la enfermedad de una persona a otra; en este caso, es la persona que tiene la enfermedad la que la transmite. En resumen, la transmisión es el acto de difundir la enfermedad, mientras que el contagio es el acto de recibirla."
  },
  {
    "title": "Fimosis",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-17.png",
    "download": "/infographics/infographics-17.pdf",
    "informacion": "La fimosis es una condición médica en la que el prepucio del pene no puede retirarse completamente sobre el glande, lo que puede causar dificultades durante la higiene, el acto sexual o la micción. Es común en recién nacidos y en niños, ya que el prepucio suele ser más estrecho al nacer, pero en muchos casos, la fimosis se resuelve de forma natural con el tiempo. Sin embargo, si persiste en la edad adulta o causa molestias, infecciones recurrentes o problemas funcionales, puede ser necesario el tratamiento, que puede incluir medidas no quirúrgicas o, en casos más graves, la circuncisión. Es importante consultar a un profesional de la salud si se experimentan síntomas relacionados con la fimosis para determinar la mejor opción de tratamiento."
  },
  {
    "title": "Para usar correctamente un preservativo, primero...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-18.png",
    "download": "/infographics/infographics-18.pdf",
    "informacion": "Para usar correctamente un preservativo, primero verifica que no esté caducado y que el paquete esté intacto. Abre el paquete con cuidado, coloca el preservativo en el glande del pene erecto y desenróllalo hacia la base, asegurándote de dejar espacio en la punta. Utiliza lubricante a base de agua o silicona si es necesario, pero evita los que son a base de aceite. Después de usarlo, retira el preservativo sujetando la base y deséchalo adecuadamente en la basura, nunca en el inodoro."
  },
  {
    "title": "El mosquito no transmite el VIH...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-19.png",
    "download": "/infographics/infographics-19.pdf",
    "informacion": "El mosquito no transmite el VIH porque el virus no se reproduce ni se multiplica dentro del cuerpo del mosquito. Cuando un mosquito pica a una persona infectada con VIH, la saliva del mosquito no contiene el virus, ya que este se queda en el sistema digestivo del insecto. Además, el VIH es un virus frágil que no puede sobrevivir fuera del cuerpo humano, lo que impide que se transmita a través de picaduras. Por lo tanto, el contagio del VIH se produce principalmente a través de fluidos corporales como sangre, semen y fluidos vaginales, no por insectos."
  },
  {
    "title": "Cuidado de la boca durante el sexo oral",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-20.png",
    "download": "/infographics/infographics-20.pdf",
    "informacion": "El cuidado de la boca durante el sexo oral es fundamental para prevenir infecciones de transmisión sexual (ITS). Es importante mantener una buena higiene dental, cepillándose los dientes y usando hilo dental, pero evitando hacerlo justo antes o después del sexo oral para no irritar las encías. Usar barreras de protección, como condones o mantas de dental, puede ayudar a reducir el riesgo de transmisión de ITS. Además, es recomendable evitar el sexo oral si hay heridas abiertas, llagas o infecciones en la boca o los genitales para minimizar el riesgo de contagio."
  },
  {
    "title": "Dispositivo intrauterino (DIU)",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-21.png",
    "download": "/infographics/infographics-21.pdf",
    "informacion": "El dispositivo intrauterino (DIU) es un método anticonceptivo que se coloca en el útero para prevenir el embarazo. Existen dos tipos principales de DIU: el de cobre, que actúa impidiendo la fertilización, y el hormonal, que libera progesterona para reducir la ovulación y el grosor del moco cervical. El DIU es una opción a largo plazo que puede permanecer en su lugar durante varios años, dependiendo del tipo. Además de ser altamente efectivo, el DIU no interfiere con las relaciones sexuales y puede ser retirado en cualquier momento por un profesional de salud."
  },
  {
    "title": "Las pastillas anticonceptivas funcionan regulando los...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-22.png",
    "download": "/infographics/infographics-22.pdf",
    "informacion": "Las pastillas anticonceptivas funcionan regulando los niveles hormonales en el cuerpo, lo que previene la ovulación y, en consecuencia, la menstruación. Cuando se utilizan pastillas combinadas, se toma un ciclo de hormonas que simula el ciclo menstrual natural, y durante la fase de descanso o de placebo se puede experimentar una sangrado leve, conocido como sangrado por privación. Sin embargo, en algunas mujeres que usan pastillas de manera continua, pueden no tener ningún sangrado, ya que el cuerpo no experimenta los cambios hormonales que normalmente inducen la menstruación."
  },
  {
    "title": "Implante subdérmico",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-23.png",
    "download": "/infographics/infographics-23.pdf",
    "informacion": "El implante subdérmico es un método anticonceptivo que consiste en un pequeño bastón flexible que se inserta debajo de la piel del brazo, liberando hormonas para prevenir el embarazo. Este anticonceptivo es altamente efectivo y puede durar de 3 a 5 años, dependiendo del tipo de implante utilizado. Funciona principalmente al liberar progestina, que impide la ovulación y espesa el moco cervical, dificultando la fertilización. Además, el implante es reversible; una vez retirado, la fertilidad puede volver rápidamente a la normalidad."
  },
  {
    "title": "Mayoría de los métodos comerciales y quirúrgicos que prometen agrandar el pene",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-24.png",
    "download": "/infographics/infographics-24.pdf",
    "informacion": "La mayoría de los métodos comerciales y quirúrgicos que prometen agrandar el pene son ineficaces y pueden resultar peligrosos. La anatomía del pene y su estructura natural limitan su capacidad de crecimiento, y la mayoría de las intervenciones no logran resultados satisfactorios o permanentes. Además, muchos procedimientos pueden conllevar riesgos significativos, como infecciones, cicatrices y disfunción eréctil. Es importante tener expectativas realistas y entender que el tamaño del pene no determina la satisfacción sexual ni el valor personal."
  },
  {
    "title": "En Argentina, una empresa no puede...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-25.png",
    "download": "/infographics/infographics-25.pdf",
    "informacion": "En Argentina, una empresa no puede obligar a un empleado a realizarse pruebas de VIH sin su consentimiento, ya que esto violaría los derechos a la privacidad y la confidencialidad de la persona. La Ley Nacional de SIDA (Ley 23.798) establece que las pruebas de VIH deben ser voluntarias y siempre realizadas con el consentimiento informado del individuo. Además, la discriminación basada en el estado serológico es ilegal y puede llevar a sanciones para la empresa. Es fundamental que las políticas de salud en el lugar de trabajo respeten los derechos humanos y la dignidad de los empleados."
  },
  {
    "title": "Actualmente, existen más de 30 infecciones...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-26.png",
    "download": "/infographics/infographics-26.pdf",
    "informacion": "Actualmente, existen más de 30 infecciones de transmisión sexual (ITS) reconocidas, cada una causada por diferentes patógenos, incluidos virus, bacterias y parásitos. Las ITS más comunes incluyen la clamidia, la gonorrea, la sífilis, el VIH, el herpes genital y el virus del papiloma humano (VPH). La prevalencia de estas infecciones varía según la región, la población y otros factores socioeconómicos. La educación sobre prevención, pruebas regulares y el uso de métodos de protección son fundamentales para reducir la propagación de las ITS."
  },
  {
    "title": "Puerperio",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-27.png",
    "download": "/infographics/infographics-27.pdf",
    "informacion": "El puerperio es el período que sigue al parto y se extiende aproximadamente hasta seis semanas después del nacimiento del bebé. Durante este tiempo, el cuerpo de la mujer experimenta una serie de cambios físicos y hormonales para recuperarse del embarazo y el parto, incluyendo la involución del útero y la adaptación a la lactancia. Además, el puerperio también implica un ajuste emocional y psicológico, ya que la madre se adapta a su nuevo rol y puede experimentar cambios en su estado de ánimo. Es fundamental recibir atención médica durante este período para monitorear la salud física y emocional de la madre y abordar cualquier complicación que pueda surgir."
  },
  {
    "title": "Los espermatozoides se producen en los...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-28.png",
    "download": "/infographics/infographics-28.pdf",
    "informacion": "Los espermatozoides se producen en los testículos a través de un proceso llamado espermatogénesis, que ocurre en los túbulos seminíferos. Una vez formados, los espermatozoides maduran y se almacenan en el epidídimo, donde adquieren movilidad y capacidad para fertilizar un óvulo. Durante la eyaculación, los espermatozoides son transportados desde el epidídimo a través de los conductos deferentes, donde se mezclan con el líquido seminal de las glándulas seminales y la próstata para formar el semen. Finalmente, el semen es expulsado a través de la uretra durante la eyaculación, liberando los espermatozoides en el tracto reproductivo femenino."
  },
  {
    "title": "La viruela símica, también conocida como...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-29.png",
    "download": "/infographics/infographics-29.pdf",
    "informacion": "La viruela símica, también conocida como viruela del simio, es una enfermedad viral causada por el virus de la viruela símica, que pertenece a la misma familia de virus que el de la viruela humana. Aunque se considera menos grave que la viruela tradicional, puede provocar síntomas similares, como fiebre, erupciones cutáneas y ganglios linfáticos inflamados. La transmisión del virus ocurre principalmente a través del contacto directo con fluidos corporales, lesiones en la piel o superficies contaminadas de personas infectadas o animales, como roedores y primates. Desde su descubrimiento en 1958, la viruela símica ha estado presente principalmente en África, pero se han reportado brotes en otras partes del mundo, lo que ha llevado a un aumento en la vigilancia y la investigación para controlar su propagación."
  },
  {
    "title": "Pastillas anticonceptivas",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-30.png",
    "download": "/infographics/infographics-30.pdf",
    "informacion": "Las pastillas anticonceptivas son un método hormonal que previene el embarazo al inhibir la ovulación y alterar el revestimiento del útero, lo que dificulta la implantación de un óvulo fertilizado. Existen principalmente dos tipos: las combinadas, que contienen estrógenos y progestina, y las de solo progestina, que son adecuadas para mujeres que no pueden tomar estrógenos. Además de su efectividad en la anticoncepción, las pastillas pueden regular el ciclo menstrual, reducir los síntomas del síndrome premenstrual y disminuir el riesgo de ciertas afecciones, como quistes ováricos y cáncer de ovario. "
  },
  {
    "title": "Molusco contagiosum",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-31.png",
    "download": "/infographics/infographics-31.pdf",
    "informacion": "El molusco contagiosum es una infección cutánea viral causada por un poxvirus, que se manifiesta a través de pequeñas protuberancias o pápulas en la piel, generalmente indoloras y con un aspecto perlado. Se transmite principalmente a través del contacto directo con la piel de una persona infectada o mediante el uso compartido de toallas, ropa o juguetes. Aunque el molusco contagiosum no suele ser peligroso y a menudo se resuelve espontáneamente en un período de meses a años, puede ser incómodo y provocar picazón. El tratamiento puede incluir la eliminación de las lesiones mediante métodos como la crioterapia, el curetaje o el uso de medicamentos tópicos, especialmente en casos donde la apariencia o la incomodidad son preocupaciones para el paciente."
  },
  {
    "title": "Método sintotérmico",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-32.png",
    "download": "/infographics/infographics-32.pdf",
    "informacion": "El método sintotérmico es un enfoque de planificación familiar natural que combina la observación de los signos y síntomas de la fertilidad con el seguimiento de la temperatura basal del cuerpo. Este método se basa en la idea de que la temperatura corporal de la mujer aumenta ligeramente después de la ovulación, lo que indica que ha pasado el período fértil. Además, se analizan otros signos como el moco cervical, que cambia en consistencia y cantidad durante el ciclo menstrual, proporcionando información adicional sobre los días fértiles. Al utilizar estos indicadores, las parejas pueden identificar los momentos de mayor fertilidad para concebir o evitar el embarazo de manera efectiva y natural."
  },
  {
    "title": "Gonorrea",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-33.png",
    "download": "/infographics/infographics-33.pdf",
    "informacion": "La gonorrea es una infección de transmisión sexual (ITS) causada por la bacteria Neisseria gonorrhoeae, que afecta tanto a hombres como a mujeres. Los síntomas pueden incluir dolor al orinar, secreción inusual y, en las mujeres, dolor abdominal o vaginal, aunque muchas personas pueden ser asintomáticas. Si no se trata, la gonorrea puede causar complicaciones graves, como enfermedades inflamatorias pélvicas en mujeres y problemas de fertilidad en ambos sexos. El tratamiento generalmente implica antibióticos, y es fundamental que las parejas sexuales también se sometan a pruebas y tratamiento para prevenir la reinfección."
  },
  {
    "title": "Clamidia",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-34.png",
    "download": "/infographics/infographics-34.pdf",
    "informacion": "La clamidia es una infección de transmisión sexual (ITS) causada por la bacteria Chlamydia trachomatis, que afecta tanto a hombres como a mujeres. Muchas personas infectadas no presentan síntomas, lo que puede llevar a complicaciones graves si no se detecta y trata a tiempo, como enfermedad inflamatoria pélvica en mujeres y epididimitis en hombres. Los síntomas, cuando aparecen, pueden incluir dolor al orinar, secreción anormal y dolor en la parte baja del abdomen. El tratamiento efectivo de la clamidia generalmente implica el uso de antibióticos, y es importante que las parejas sexuales también sean examinadas y tratadas para evitar la reinfección."
  },
  {
    "title": "Infecciones de transmisión sexual (ITS)",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-35.png",
    "download": "/infographics/infographics-35.pdf",
    "informacion": "Las infecciones de transmisión sexual (ITS) son causadas por diversos agentes patógenos, incluidos virus, bacterias y parásitos. Los virus como el VIH, el herpes simple y el virus del papiloma humano (VPH) se transmiten principalmente a través del contacto sexual directo y pueden permanecer en el cuerpo de forma latente. Las bacterias, como Neisseria gonorrhoeae (gonorrea) y Chlamydia trachomatis (clamidia), se propagan a través de relaciones sexuales desprotegidas y pueden causar infecciones en los órganos reproductivos. Los parásitos, como los que causan la tricomoniasis, se transmiten durante las relaciones sexuales y pueden afectar tanto a hombres como a mujeres, destacando la importancia del uso de métodos de protección para prevenir la transmisión de ITS."
  },
  {
    "title": "Las ligaduras de trompas, también conocidas...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-36.png",
    "download": "/infographics/infographics-36.pdf",
    "informacion": "Las ligaduras de trompas, también conocidas como salpingoclasia, son un método de anticoncepción permanente en el que se cortan, sellan o bloquean las trompas de Falopio para evitar que los óvulos se unan con los espermatozoides. Este procedimiento se realiza generalmente bajo anestesia y puede llevarse a cabo a través de laparoscopia o mediante una técnica más invasiva. Aunque es un método altamente efectivo para prevenir el embarazo, se considera irreversible en la mayoría de los casos, aunque en algunas ocasiones puede ser posible una reconexión quirúrgica. Además, las ligaduras de trompas no protegen contra infecciones de transmisión sexual, por lo que es importante considerar otras formas de protección si es necesario."
  },
  {
    "title": "La ladilla, también conocida como piojo...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-37.png",
    "download": "/infographics/infographics-37.pdf",
    "informacion": "La ladilla, también conocida como piojo del pubis o Pthirus pubis, es un parásito que infesta el vello púbico y otras áreas con vello corporal, como las axilas y la barba. Se transmite principalmente a través del contacto sexual, aunque también puede contagiarse mediante el uso compartido de toallas, ropa o sábanas contaminadas. Los síntomas incluyen picazón intensa en la zona afectada y la presencia de pequeñas manchas o piojos visibles en el vello. El tratamiento generalmente implica el uso de lociones o champús insecticidas específicos, así como la limpieza de la ropa y la ropa de cama para prevenir la reinfestación."
  },
  {
    "title": "La efectividad real de los preservativos...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-38.png",
    "download": "/infographics/infographics-38.pdf",
    "informacion": "La efectividad real de los preservativos varía según su uso, con una tasa de efectividad del 85% al 90% en la prevención del embarazo y las infecciones de transmisión sexual (ITS) en la práctica habitual. Esto se debe a factores como el uso inconsistente, la aplicación incorrecta y el deterioro del preservativo. Para aumentar su efectividad, es esencial seguir las instrucciones de uso, asegurándose de que el preservativo esté bien colocado y sin daños. A pesar de estas variaciones, los preservativos siguen siendo una de las opciones más accesibles y efectivas para la prevención de embarazos no planificados y la transmisión de ITS."
  },
  {
    "title": "Para manejar conflictos en una discusión...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-39.png",
    "download": "/infographics/infographics-39.pdf",
    "informacion": "Para manejar conflictos en una discusión de pareja, es importante establecer reglas de comunicación, como hablar desde el Yo en lugar del Tú, para evitar que la otra persona se sienta atacada. Escuchar activamente y dar espacio al otro para expresar sus sentimientos y puntos de vista sin interrupciones también es fundamental para fomentar un diálogo constructivo. Además, es útil evitar el uso de generalizaciones como siempre o nunca, que pueden escalar el conflicto y desviar la atención del problema específico. Por último, tomarse un tiempo para calmarse si la discusión se intensifica puede ayudar a ambos a regresar a la conversación con una mentalidad más abierta y enfocada en la solución."
  },
  {
    "title": "Vasectomía",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-40.png",
    "download": "/infographics/infographics-40.pdf",
    "informacion": "La vasectomía es un procedimiento quirúrgico de anticoncepción permanente para hombres que implica el corte y la ligadura de los conductos deferentes, que son los tubos que transportan los espermatozoides desde los testículos hasta la uretra. Este método es altamente efectivo, con una tasa de éxito superior al 99% en la prevención del embarazo, y se considera irreversible, aunque en algunos casos puede ser posible realizar una vasovasostomía para revertir el procedimiento. La vasectomía no afecta la producción de hormonas ni la capacidad de tener erecciones, ya que los espermatozoides simplemente se reabsorben por el cuerpo en lugar de ser liberados durante la eyaculación. "
  },
  {
    "title": "Herpes",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-41.png",
    "download": "/infographics/infographics-41.pdf",
    "informacion": "El herpes es una infección viral común causada por el virus del herpes simple (VHS), que se presenta en dos tipos: el VHS-1, que generalmente causa herpes oral, y el VHS-2, que suele estar asociado con herpes genital. Esta infección se transmite principalmente a través del contacto directo con lesiones, fluidos corporales o superficies infectadas, y muchas personas pueden ser asintomáticas, lo que facilita su propagación. Los síntomas del herpes incluyen ampollas dolorosas, picazón y malestar en la zona afectada, que pueden aparecer en brotes recurrentes a lo largo del tiempo. Aunque no existe una cura para el herpes, los tratamientos antivirales pueden ayudar a reducir la gravedad y la frecuencia de los brotes, así como a disminuir el riesgo de transmisión a otras personas."
  },
  {
    "title": "Es importante usar preservativos incluso si...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-42.png",
    "download": "/infographics/infographics-42.pdf",
    "informacion": "Es importante usar preservativos incluso si la pareja está tomando pastillas anticonceptivas o utilizando otros métodos anticonceptivos hormonales, ya que estos métodos no ofrecen protección contra las infecciones de transmisión sexual (ITS). Aunque los anticonceptivos hormonales son efectivos para prevenir el embarazo, no son infalibles, y el uso de preservativos proporciona una barrera adicional que puede prevenir embarazos no deseados y reducir el riesgo de contagio de ITS. Además, el uso conjunto de preservativos y anticonceptivos hormonales puede aumentar la efectividad general de la prevención del embarazo. Por lo tanto, combinar ambos métodos es una práctica recomendable para garantizar una mayor seguridad sexual."
  },
  {
    "title": "Para usar correctamente un preservativo, primero...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-43.png",
    "download": "/infographics/infographics-43.pdf",
    "informacion": "Para usar correctamente un preservativo, primero verifica que no esté caducado y que el paquete esté intacto. Abre el paquete con cuidado, coloca el preservativo en el glande del pene erecto y desenróllalo hacia la base, asegurándote de dejar espacio en la punta. Utiliza lubricante a base de agua o silicona si es necesario, pero evita los que son a base de aceite. Después de usarlo, retira el preservativo sujetando la base y deséchalo adecuadamente en la basura, nunca en el inodoro."
  },
  {
    "title": "Candidiasis",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-44.png",
    "download": "/infographics/infographics-44.pdf",
    "informacion": "La candidiasis es una infección causada por un crecimiento excesivo del hongo Candida, que suele habitar de forma natural en el cuerpo humano, especialmente en áreas como la boca, la garganta y la vagina. Esta infección puede manifestarse de diferentes maneras, siendo la candidiasis vaginal una de las formas más comunes, caracterizada por picazón, ardor y una secreción blanca y grumosa. Factores como el uso de antibióticos, cambios hormonales, diabetes y un sistema inmunológico debilitado pueden aumentar la probabilidad de desarrollar candidiasis. El tratamiento generalmente implica el uso de antifúngicos, ya sea en forma de cremas, tabletas o supositorios, y es importante abordar cualquier factor de riesgo subyacente para prevenir futuras infecciones."
  },
  {
    "title": "Tricomoniasis",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-45.png",
    "download": "/infographics/infographics-45.pdf",
    "informacion": "La tricomoniasis es una infección de transmisión sexual (ITS) causada por el parásito Trichomonas vaginalis, que afecta principalmente a mujeres, aunque los hombres también pueden ser portadores. Los síntomas en mujeres pueden incluir flujo vaginal maloliente, picazón, ardor y dolor durante la relación sexual, mientras que los hombres a menudo son asintomáticos. La tricomoniasis se transmite a través de relaciones sexuales sin protección y, si no se trata, puede aumentar el riesgo de otras ITS y complicaciones durante el embarazo. El tratamiento es efectivo y generalmente implica el uso de antibióticos, como el metronidazol, y es importante que ambas parejas sean tratadas para prevenir la reinfección."
  },
  {
    "title": "Métodos anticonceptivos",
    "titleNeedsReview": false,
    "cover": "/infographics/infographics-46.png",
    "download": "/infographics/infographics-46.pdf",
    "informacion": "Los métodos anticonceptivos tienen la función principal de prevenir el embarazo, y se dividen en varias categorías, incluyendo métodos hormonales, de barrera, intrauterinos y naturales. Aunque muchos de estos métodos son efectivos para controlar la natalidad, solo el preservativo proporciona una protección adicional contra las infecciones de transmisión sexual (ITS). Por esta razón, es recomendable utilizar preservativos en conjunto con otros métodos anticonceptivos para maximizar la protección contra embarazos no deseados y reducir el riesgo de contagio de ITS. La educación sobre el uso adecuado de estos métodos es crucial para garantizar la salud sexual y reproductiva de las personas."
  },
  {
    "title": "En Argentina, la Educación Sexual Integral...",
    "titleNeedsReview": true,
    "cover": "/infographics/infographics-47.png",
    "download": "/infographics/infographics-47.pdf",
    "informacion": "En Argentina, la Educación Sexual Integral (ESI) es un derecho reconocido por la Ley Nacional de Educación 26.150, que establece su implementación en todos los niveles educativos del sistema escolar, desde la educación inicial hasta la educación secundaria, incluyendo el terciario. La ley estipula que la ESI debe abordarse de manera integral y continua, adaptándose a las características y necesidades de los estudiantes en cada etapa de su desarrollo. Además, las provincias tienen la responsabilidad de implementar programas de ESI en sus currículos, garantizando que se brinde información adecuada y accesible para todos los alumnos. La inclusión de la ESI en las escuelas tiene como objetivo promover el respeto por la diversidad, la prevención de violencias y el cuidado de la salud sexual y reproductiva."
  }
];

async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se van a crear documentos en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada, solo se muestra qué subiría.\n');

  const existingSnap = await db.collection('infografias').where('author', '==', 'CRESI').get();
  const existingCovers = new Set(existingSnap.docs.map((d) => d.data().cover));

  let toCreate = 0;
  let needsReview = 0;

  for (const item of infografias) {
    const alreadyExists = existingCovers.has(item.cover);
    const reviewFlag = item.titleNeedsReview ? '  ⚠️  revisar título' : '';
    const status = alreadyExists ? '⏭️  YA EXISTE, se saltea' : '✅ se va a crear';
    console.log(`${status} — "${item.title}"${reviewFlag}`);

    if (!alreadyExists) {
      toCreate++;
      if (item.titleNeedsReview) needsReview++;

      if (APPLY) {
        const now = new Date().toISOString();
        await db.collection('infografias').add({
          title: item.title,
          informacion: item.informacion,
          cover: item.cover,
          download: item.download,
          author: 'CRESI',
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  console.log(`\n${toCreate} para crear, de las cuales ${needsReview} tienen título provisorio a revisar.`);

  if (!APPLY) {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si el resumen de arriba te parece correcto, corré:');
    console.log('  node scripts/migrate-infografias.mjs --apply');
  } else {
    console.log('\n✅ Listo. No te olvides de revisar los títulos marcados con ⚠️ en Firebase Console.');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo la migración:', err);
  process.exit(1);
});
