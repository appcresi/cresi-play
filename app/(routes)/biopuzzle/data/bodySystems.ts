// src/data/bodySystems.ts
export type BodyPart = {
    id: string;
    name: string;
    correctPosition: { x: number; y: number };
    currentPosition?: { x: number; y: number };
    placed: boolean;
  };
  
  export type BodySystem = {
    id: string;
    name: string;
    imageUrl: string;
    parts: BodyPart[];
  };
  
  // Datos de los sistemas del cuerpo para la aplicación de anatomía
  export const bodySystems: BodySystem[] = [
    {
      id: 'general',
      name: 'Sistema Reproductor Masculino',
      imageUrl: '/imgleccion.jpg',
      parts: [
        { id: '1', name: 'Pene', correctPosition: { x: 150, y: 600 }, placed: false },
        { id: '2', name: 'Testículo', correctPosition: { x: 270, y: 700 }, placed: false },
        { id: '3', name: 'Próstata', correctPosition: { x: 350, y: 400 }, placed: false },
        { id: '4', name: 'Vesícula seminal', correctPosition: { x: 450, y: 350 }, placed: false },
        { id: '5', name: 'Uretra', correctPosition: { x: 200, y: 500 }, placed: false },
        { id: '6', name: 'Vejiga', correctPosition: { x: 350, y: 300 }, placed: false },
        { id: '7', name: 'Conducto deferente', correctPosition: { x: 260, y: 450 }, placed: false },
        { id: '8', name: 'Recto', correctPosition: { x: 500, y: 500 }, placed: false }
      ]
    },
    {
      id: 'digestivo',
      name: 'Sistema Reproductor Femenino',
      imageUrl: '/imgleccion2.jpg',
      parts: [
        { id: '1', name: 'Ovario', correctPosition: { x: 590, y: 350 }, placed: false },
        { id: '4', name: 'Trompa Uterina', correctPosition: { x: 230, y: 200 }, placed: false },
        { id: '5', name: 'Útero', correctPosition: { x: 385, y: 300 }, placed: false },
        { id: '6', name: 'Endometrio', correctPosition: { x: 385, y: 360 }, placed: false },
        { id: '7', name: 'Cérvix', correctPosition: { x: 385, y: 450 }, placed: false },
        { id: '8', name: 'Vagina', correctPosition: { x: 385, y: 580 }, placed: false }
      ]
    },
    {
      id: 'urinario',
      name: 'Sistema Urinario Masculino',
      imageUrl: '/imgleccion3.jpg',
      parts: [
        { id: '1', name: 'Riñón izquierdo', correctPosition: { x: 317, y: 176 }, placed: false },
        { id: '2', name: 'Riñón derecho', correctPosition: { x: 483, y: 176 }, placed: false },
        { id: '3', name: 'Uréter izquierdo', correctPosition: { x: 340, y: 360 }, placed: false },
        { id: '4', name: 'Uréter derecho', correctPosition: { x: 460, y: 360 }, placed: false },
        { id: '5', name: 'Vejiga', correctPosition: { x: 400, y: 440 }, placed: false },
        { id: '6', name: 'Próstata', correctPosition: { x: 400, y: 504 }, placed: false },
        { id: '7', name: 'Uretra', correctPosition: { x: 400, y: 592 }, placed: false }
      ]
    },
    {
      id: 'genital_externo_femenino',
      name: 'Genitales Externos Femeninos',
      imageUrl: '/imgleccion4.jpg',
      parts: [
        { id: '1', name: 'Monte de Venus', correctPosition: { x: 400, y: 128 }, placed: false },
        { id: '2', name: 'Clítoris', correctPosition: { x: 400, y: 228 }, placed: false },
        { id: '3', name: 'Labios menores', correctPosition: { x: 339, y: 288 }, placed: false },
        { id: '4', name: 'Labios mayores', correctPosition: { x: 310, y: 320 }, placed: false },
        { id: '5', name: 'Orificio uretral', correctPosition: { x: 400, y: 320 }, placed: false },
        { id: '6', name: 'Orificio vaginal', correctPosition: { x: 400, y: 376 }, placed: false },
        { id: '7', name: 'Ano', correctPosition: { x: 400, y: 560 }, placed: false }
      ]
    },
    {
      id: 'respiratorio',
      name: 'Sistema Respiratorio',
      imageUrl: '/imgleccion5.jpg',
      parts: [
        { id: '1', name: 'Cavidad nasal', correctPosition: { x: 331, y: 56 }, placed: false },
        { id: '2', name: 'Faringe', correctPosition: { x: 371, y: 112 }, placed: false },
        { id: '3', name: 'Laringe', correctPosition: { x: 380, y: 168 }, placed: false },
        { id: '4', name: 'Tráquea', correctPosition: { x: 380, y: 288 }, placed: false },
        { id: '5', name: 'Bronquio derecho', correctPosition: { x: 336, y: 432 }, placed: false },
        { id: '6', name: 'Bronquio izquierdo', correctPosition: { x: 444, y: 432 }, placed: false },
        { id: '7', name: 'Pulmón derecho', correctPosition: { x: 277, y: 520 }, placed: false },
        { id: '8', name: 'Pulmón izquierdo', correctPosition: { x: 503, y: 520 }, placed: false },
        { id: '9', name: 'Diafragma', correctPosition: { x: 380, y: 680 }, placed: false }
      ]
    },
    {
      id: 'digestivo2',
      name: 'Sistema Digestivo',
      imageUrl: '/imgleccion6.jpg',
      parts: [
        { id: '1', name: 'Boca', correctPosition: { x: 336, y: 96 }, placed: false },
        { id: '2', name: 'Esófago', correctPosition: { x: 390, y: 240 }, placed: false },
        { id: '3', name: 'Hígado', correctPosition: { x: 356, y: 400 }, placed: false },
        { id: '4', name: 'Vesícula biliar', correctPosition: { x: 371, y: 456 }, placed: false },
        { id: '5', name: 'Estómago', correctPosition: { x: 439, y: 408 }, placed: false },
        { id: '6', name: 'Páncreas', correctPosition: { x: 390, y: 488 }, placed: false },
        { id: '7', name: 'Intestino delgado', correctPosition: { x: 400, y: 584 }, placed: false },
        { id: '8', name: 'Intestino grueso', correctPosition: { x: 331, y: 560 }, placed: false },
        { id: '9', name: 'Apéndice', correctPosition: { x: 341, y: 656 }, placed: false },
        { id: '10', name: 'Recto', correctPosition: { x: 400, y: 736 }, placed: false }
      ]
    }
  ];