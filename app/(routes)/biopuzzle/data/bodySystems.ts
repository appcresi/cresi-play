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
      imageUrl: 'imgleccion.jpg',
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
      imageUrl: 'imgleccion2.jpg',
      parts: [
        { id: '1', name: 'Ovario', correctPosition: { x: 630, y: 250 }, placed: false },
        { id: '4', name: 'Trompa Uterina', correctPosition: { x: 230, y: 200 }, placed: false },
        { id: '5', name: 'Útero', correctPosition: { x: 385, y: 300 }, placed: false },
        { id: '6', name: 'Endometrio', correctPosition: { x: 385, y: 360 }, placed: false },
        { id: '7', name: 'Cérvix', correctPosition: { x: 385, y: 450 }, placed: false },
        { id: '8', name: 'Vagina', correctPosition: { x: 385, y: 580 }, placed: false }
      ]
    }
  ];