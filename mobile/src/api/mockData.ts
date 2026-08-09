import { ReadingDetail, ReadingListItem, User } from '../types/api';

export const MOCK_STUDENT: User = {
  id: 'u1-student',
  name: 'Carlos Mendoza',
  email: 'carlos.mendoza@estudiante.edu.gt',
  role: 'STUDENT',
  currentLevel: 'BEGINNER',
  totalPoints: 350,
  streak: 4,
};

export const MOCK_READINGS: ReadingListItem[] = [
  {
    id: 'r1-popol-vuh',
    title: 'El Origen del Hombre en el Popol Vuh',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 5,
    questionsCount: 4,
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'r2-quetzal',
    title: 'El Leyenda del Quetzal y Tecún Umán',
    comprehensionLevel: 'INFERENTIAL',
    progressionLevel: 'INTERMEDIATE',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 6,
    questionsCount: 4,
    createdAt: '2026-08-02T10:00:00Z',
  },
  {
    id: 'r3-lago-atitlan',
    title: 'El Misterio del Lago de Atitlán',
    comprehensionLevel: 'CRITICAL',
    progressionLevel: 'ADVANCED',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 8,
    questionsCount: 5,
    createdAt: '2026-08-03T10:00:00Z',
  },
  {
    id: 'r4-maiz-guatemala',
    title: 'La Importancia del Maíz en la Cultura Maya',
    comprehensionLevel: 'INFERENTIAL',
    progressionLevel: 'BEGINNER',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 4,
    questionsCount: 3,
    createdAt: '2026-08-04T10:00:00Z',
  },
];

export const MOCK_READING_DETAILS: Record<string, ReadingDetail> = {
  'r1-popol-vuh': {
    id: 'r1-popol-vuh',
    title: 'El Origen del Hombre en el Popol Vuh',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 5,
    questionsCount: 4,
    order: 1,
    author: { id: 'u0-admin', name: 'Giovanni Educativo' },
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
    content: `En el principio del mundo maya K'iche', todo estaba en calma y en silencio. Los dioses Tepeu y Gucumatz se reunieron en la oscuridad de la noche para crear el mundo y a los seres humanos.

Primero crearon la tierra, las montañas, los valles y las plantas. Luego crearon a los animales: los venados, las aves, los jaguares y las serpientes. Pero los dioses deseaban seres que pudieran hablar, razonar y alabarlos.

En su primer intento, los dioses hicieron hombres de barro. Sin embargo, el barro era blando y se deshacía con el agua. El segundo intento fue hacer hombres de madera. Estos hombres caminaban y hablaban, pero no tenían corazón ni memoria de sus creadores.

Finalmente, los dioses encontraron la mazorca de maíz amarillo y maíz blanco. Con la masa de maíz moldearon el cuerpo de los primeros cuatro hombres verdaderos: B'alam Ki'tze', B'alam Aq'ab, Majuk'utaj e Iq'i B'alam. Estos hombres sí poseían inteligencia, gratitud y sabían honrar a los dioses. Desde entonces, el maíz es el sustento y origen del pueblo maya.`,
    questions: [
      {
        id: 'q1-1',
        statement: '¿De qué material fueron hechos los primeros hombres exitosos según el Popol Vuh?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'opt1', text: 'Madera de pino' },
          { id: 'opt2', text: 'Barro y arcilla' },
          { id: 'opt3', text: 'Masa de maíz amarillo y blanco' },
          { id: 'opt4', text: 'Piedra volcánica' },
        ],
        order: 1,
      },
      {
        id: 'q1-2',
        statement: '¿Por qué descartaron los dioses a los hombres hechos de barro?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'opt1', text: 'Porque eran muy pesados' },
          { id: 'opt2', text: 'Porque el barro se deshacía con el agua' },
          { id: 'opt3', text: 'Porque eran demasiado agresivos' },
          { id: 'opt4', text: 'Porque volaban lejos' },
        ],
        order: 2,
      },
      {
        id: 'q1-3',
        statement: '¿Los hombres de madera poseían corazón y memoria de sus creadores?',
        type: 'TRUE_FALSE',
        options: [
          { id: 'opt1', text: 'Verdadero' },
          { id: 'opt2', text: 'Falso' },
        ],
        order: 3,
      },
      {
        id: 'q1-4',
        statement: '¿Quiénes fueron los dos dioses principales que se reunieron a crear el mundo?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'opt1', text: 'Tepeu y Gucumatz' },
          { id: 'opt2', text: "Tecún y B'alam" },
          { id: 'opt3', text: "K'uk'ulkan y Chaac" },
          { id: 'opt4', text: "B'alam y Iq'i" },
        ],
        order: 4,
      },
    ],
  },
  'r2-quetzal': {
    id: 'r2-quetzal',
    title: 'El Leyenda del Quetzal y Tecún Umán',
    comprehensionLevel: 'INFERENTIAL',
    progressionLevel: 'INTERMEDIATE',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 6,
    questionsCount: 2,
    order: 2,
    author: { id: 'u0-admin', name: 'Giovanni Educativo' },
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z',
    content: `Durante la época de la conquista en los llanos de Olintepeque, tuvo lugar la batalla legendaria entre el príncipe maya K'iche' Tecún Umán y el conquistador Pedro de Alvarado.

Se dice que un hermoso quetzal de plumaje verde esmeralda y larga cola volaba sobre la cabeza de Tecún Umán durante el combate, guiándolo y protegiéndolo. El quetzal no era una ave ordinaria, sino el espíritu protector o "nahual" del héroe maya.

Cuando Tecún Umán cayó en la batalla, el quetzal descendió suavemente y se posó sobre el pecho ensangrentado del guerrero. El ave permaneció allí en silencioso duelo. Al levantar el vuelo hacia los cielos de Guatemala, el pecho del quetzal había quedado teñido para siempre de un rojo carmesí intenso, en memoria del valor y la sangre derramada por la libertad de su pueblo.`,
    questions: [
      {
        id: 'q2-1',
        statement: '¿Qué simboliza el pecho rojo del quetzal según la leyenda?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'opt1', text: 'El sol al atardecer' },
          { id: 'opt2', text: 'La sangre y el valor de Tecún Umán' },
          { id: 'opt3', text: 'El fuego de las montañas' },
          { id: 'opt4', text: 'El fruto de las plantas' },
        ],
        order: 1,
      },
      {
        id: 'q2-2',
        statement: '¿Qué papel desempeñaba el quetzal durante la batalla?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'opt1', text: 'Era el nahual y protector espiritual del héroe' },
          { id: 'opt2', text: 'Traía alimento a los soldados' },
          { id: 'opt3', text: 'Buscaba armas para los guerreros' },
          { id: 'opt4', text: 'Llevaba mensajes entre pueblos' },
        ],
        order: 2,
      },
    ],
  },
};
