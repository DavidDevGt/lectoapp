import { ReadingDetail, ReadingListItem, Question, User } from '../types/api';

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
    estimatedTimeMin: 5,
    questionCount: 4,
    isCompleted: false,
  },
  {
    id: 'r2-quetzal',
    title: 'El Leyenda del Quetzal y Tecún Umán',
    comprehensionLevel: 'INFERENTIAL',
    progressionLevel: 'INTERMEDIATE',
    estimatedTimeMin: 6,
    questionCount: 4,
    isCompleted: false,
  },
  {
    id: 'r3-lago-atitlan',
    title: 'El Misterio del Lago de Atitlán',
    comprehensionLevel: 'CRITICAL',
    progressionLevel: 'ADVANCED',
    estimatedTimeMin: 8,
    questionCount: 5,
    isCompleted: false,
  },
  {
    id: 'r4-maiz-guatemala',
    title: 'La Importancia del Maíz en la Cultura Maya',
    comprehensionLevel: 'INFERENTIAL',
    progressionLevel: 'BEGINNER',
    estimatedTimeMin: 4,
    questionCount: 3,
    isCompleted: true,
  },
];

export const MOCK_READING_DETAILS: Record<string, ReadingDetail> = {
  'r1-popol-vuh': {
    id: 'r1-popol-vuh',
    title: 'El Origen del Hombre en el Popol Vuh',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    estimatedTimeMin: 5,
    questionCount: 4,
    isCompleted: false,
    content: `En el principio del mundo maya K'iche', todo estaba en calma y en silencio. Los dioses Tepeu y Gucumatz se reunieron en la oscuridad de la noche para crear el mundo y a los seres humanos.

Primero crearon la tierra, las montañas, los valles y las plantas. Luego crearon a los animales: los venados, las aves, los jaguares y las serpientes. Pero los dioses deseaban seres que pudieran hablar, razonar y alabarlos.

En su primer intento, los dioses hicieron hombres de barro. Sin embargo, el barro era blando y se deshacía con el agua. El segundo intento fue hacer hombres de madera. Estos hombres caminaban y hablaban, pero no tenían corazón ni memoria de sus creadores.

Finalmente, los dioses encontraron la mazorca de maíz amarillo y maíz blanco. Con la masa de maíz moldearon el cuerpo de los primeros cuatro hombres verdaderos: B'alam Ki'tze', B'alam Aq'ab, Majuk'utaj e Iq'i B'alam. Estos hombres sí poseían inteligencia, gratitud y sabían honrar a los dioses. Desde entonces, el maíz es el sustento y origen del pueblo maya.`,
    questions: [
      {
        id: 'q1-1',
        readingId: 'r1-popol-vuh',
        prompt: '¿De qué material fueron hechos los primeros hombres exitosos según el Popol Vuh?',
        type: 'MULTIPLE_CHOICE',
        options: ['Madera de pino', 'Barro y arcilla', 'Masa de maíz amarillo y blanco', 'Piedra volcánica'],
        explanation: 'Los dioses moldearon el cuerpo de los primeros cuatro hombres verdaderos usando masa de maíz.',
        comprehensionLevel: 'LITERAL',
      },
      {
        id: 'q1-2',
        readingId: 'r1-popol-vuh',
        prompt: '¿Por qué descartaron los dioses a los hombres hechos de barro?',
        type: 'MULTIPLE_CHOICE',
        options: ['Porque eran muy pesados', 'Porque el barro se deshacía con el agua', 'Porque eran demasiado agresivos', 'Porque volaban lejos'],
        explanation: 'El texto indica que el barro era blando y se deshacía con la lluvia.',
        comprehensionLevel: 'LITERAL',
      },
      {
        id: 'q1-3',
        readingId: 'r1-popol-vuh',
        prompt: '¿Los hombres de madera poseían corazón y memoria de sus creadores?',
        type: 'TRUE_FALSE',
        options: ['Verdadero', 'Falso'],
        explanation: 'Falso. El texto señala que los hombres de madera no tenían corazón ni recordaban a los dioses.',
        comprehensionLevel: 'LITERAL',
      },
      {
        id: 'q1-4',
        readingId: 'r1-popol-vuh',
        prompt: '¿Quiénes fueron los dos dioses principales que se reunieron a crear el mundo?',
        type: 'MULTIPLE_CHOICE',
        options: ['Tepeu y Gucumatz', 'Tecún y B\'alam', 'K\'uk\'ulkan y Chaac', 'B\'alam y Iq\'i'],
        explanation: 'Tepeu y Gucumatz se reunieron en la oscuridad para planear la creación.',
        comprehensionLevel: 'LITERAL',
      },
    ],
  },
  'r2-quetzal': {
    id: 'r2-quetzal',
    title: 'El Leyenda del Quetzal y Tecún Umán',
    comprehensionLevel: 'INFERENTIAL',
    progressionLevel: 'INTERMEDIATE',
    estimatedTimeMin: 6,
    questionCount: 4,
    isCompleted: false,
    content: `Durante la época de la conquista en los llanos de Olintepeque, tuvo lugar la batalla legendaria entre el príncipe maya K'iche' Tecún Umán y el conquistador Pedro de Alvarado.

Se dice que un hermoso quetzal de plumaje verde esmeralda y larga cola volaba sobre la cabeza de Tecún Umán durante el combate, guiándolo y protegiéndolo. El quetzal no era una ave ordinaria, sino el espíritu protector o "nahual" del héroe maya.

Cuando Tecún Umán cayó en la batalla, el quetzal descendió suavemente y se posó sobre el pecho ensangrentado del guerrero. El ave permaneció allí en silencioso duelo. Al levantar el vuelo hacia los cielos de Guatemala, el pecho del quetzal había quedado teñido para siempre de un rojo carmesí intenso, en memoria del valor y la sangre derramada por la libertad de su pueblo.`,
    questions: [
      {
        id: 'q2-1',
        readingId: 'r2-quetzal',
        prompt: '¿Qué simboliza el pecho rojo del quetzal según la leyenda?',
        type: 'MULTIPLE_CHOICE',
        options: ['El sol al atardecer', 'La sangre y el valor de Tecún Umán', 'El fuego de las montañas', 'El fruto de las plantas'],
        explanation: 'El pecho rojo representa la sangre del héroe derramada por la libertad.',
        comprehensionLevel: 'INFERENTIAL',
      },
      {
        id: 'q2-2',
        readingId: 'r2-quetzal',
        prompt: '¿Qué papel desempeñaba el quetzal durante la batalla?',
        type: 'MULTIPLE_CHOICE',
        options: ['Era el nahual y protector espiritual del héroe', 'Traía alimento a los soldados', 'Buscaba armas para los guerreros', 'Llevaba mensajes entre pueblos'],
        explanation: 'El texto explica que el quetzal actuaba como el espíritu nahual de Tecún Umán.',
        comprehensionLevel: 'INFERENTIAL',
      },
    ],
  },
};
