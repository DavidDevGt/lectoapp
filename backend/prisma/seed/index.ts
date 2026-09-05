import { PrismaClient, ComprehensionLevel, ProgressionLevel } from '../../src/generated/prisma';
import { hashPassword } from '../../src/shared/utils/password';

const prisma = new PrismaClient();

const READINGS: {
  title: string;
  content: string;
  comprehensionLevel: ComprehensionLevel;
  progressionLevel: ProgressionLevel;
  estimatedTimeMin: number;
}[] = [
  {
    title: 'El Popol Vuh: Origen del Mundo',
    content:
      'En el principio, todo era silencio y oscuridad. No había tierra, ni cielo, ni luz. ' +
      'Solo el mar en calma y el espacio inmenso. Los formadores, Tepeu y Gucumatz, hablaron entre ' +
      'la oscuridad y decidieron crear la tierra. Así surgieron las montañas, los valles y los ríos ' +
      'que hoy conocemos en Guatemala.',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    estimatedTimeMin: 5,
  },
  {
    title: 'Leyendas de Guatemala: La Llorona',
    content:
      'Cuenta la leyenda que, en las noches de luna llena, un lamento recorre las calles empedradas ' +
      'de la antigua ciudad. Una mujer vestida de blanco camina cerca del río, buscando algo que ' +
      'perdió hace mucho tiempo. Los que la han visto dicen que su llanto se escucha primero lejano, ' +
      'y luego cada vez más cerca, aunque ella nunca aparece del todo.',
    comprehensionLevel: 'INFERENTIAL',
    progressionLevel: 'INTERMEDIATE',
    estimatedTimeMin: 6,
  },
  {
    title: 'El Valor del Agua en las Comunidades Rurales',
    content:
      'Muchas comunidades rurales de Guatemala dependen de fuentes de agua compartidas para el riego ' +
      'y el consumo diario. Cuando una empresa propuso construir una planta embotelladora cerca de un ' +
      'río comunitario, los vecinos se dividieron: algunos vieron una oportunidad de empleo, otros ' +
      'temieron por la escasez futura del agua. El debate sigue abierto en la región.',
    comprehensionLevel: 'CRITICAL',
    progressionLevel: 'ADVANCED',
    estimatedTimeMin: 7,
  },
];

/**
 * Estudiantes de prueba. Sin ellos no se puede usar la app móvil: todas las rutas
 * de /api/progress exigen rol STUDENT, así que la cuenta de admin devuelve 403.
 */
const STUDENTS: {
  email: string;
  name: string;
  gradeLevel: string;
  currentLevel: ProgressionLevel;
  totalPoints: number;
  streak: number;
}[] = [
  {
    email: 'carlos.mendoza@estudiante.edu.gt',
    name: 'Carlos Mendoza',
    gradeLevel: '5to Primaria',
    currentLevel: 'BEGINNER',
    totalPoints: 0,
    streak: 0,
  },
  {
    email: 'lucia.ramos@estudiante.edu.gt',
    name: 'Lucía Ramos',
    gradeLevel: '6to Primaria',
    currentLevel: 'BEGINNER',
    totalPoints: 0,
    streak: 0,
  },
];

async function main(): Promise<void> {
  const adminPassword = await hashPassword('LectoAdmin2026!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lectoapp.gt' },
    update: {},
    create: {
      email: 'admin@lectoapp.gt',
      password: adminPassword,
      name: 'Admin LectoApp',
      role: 'ADMIN',
    },
  });

  const studentPassword = await hashPassword('Estudiante123!');

  for (const student of STUDENTS) {
    await prisma.user.upsert({
      where: { email: student.email },
      // Reseteamos el bloqueo por intentos fallidos para que reejecutar el seed
      // siempre deje la cuenta de prueba utilizable.
      update: { failedLoginAttempts: 0, lockedUntil: null },
      create: {
        email: student.email,
        password: studentPassword,
        name: student.name,
        role: 'STUDENT',
        gradeLevel: student.gradeLevel,
        currentLevel: student.currentLevel,
        totalPoints: student.totalPoints,
        streak: student.streak,
      },
    });
  }

  for (const readingData of READINGS) {
    const reading = await prisma.reading.upsert({
      where: { id: `seed-${readingData.comprehensionLevel.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-${readingData.comprehensionLevel.toLowerCase()}`,
        title: readingData.title,
        content: readingData.content,
        comprehensionLevel: readingData.comprehensionLevel,
        progressionLevel: readingData.progressionLevel,
        estimatedTimeMin: readingData.estimatedTimeMin,
        status: 'PUBLISHED',
        authorId: admin.id,
      },
    });

    const existingQuestions = await prisma.question.count({ where: { readingId: reading.id } });
    if (existingQuestions > 0) continue;

    await prisma.question.createMany({
      data: [
        {
          readingId: reading.id,
          statement: `¿Cuál es el tema principal de "${readingData.title}"?`,
          type: 'MULTIPLE_CHOICE',
          options: [
            { id: 'a', text: 'El tema descrito en el texto' },
            { id: 'b', text: 'Un tema no relacionado' },
            { id: 'c', text: 'Un evento deportivo' },
            { id: 'd', text: 'Una receta de cocina' },
          ],
          correctAnswer: 'a',
          explanation: 'El texto trata explícitamente sobre el tema indicado en el título.',
          order: 1,
          status: 'APPROVED',
        },
        {
          readingId: reading.id,
          statement: 'El texto está ambientado en Guatemala.',
          type: 'TRUE_FALSE',
          options: [
            { id: 'true', text: 'Verdadero' },
            { id: 'false', text: 'Falso' },
          ],
          correctAnswer: 'true',
          explanation: 'El contenido hace referencia directa a lugares y contexto guatemalteco.',
          order: 2,
          status: 'APPROVED',
        },
        {
          readingId: reading.id,
          statement: '¿Qué nivel de comprensión evalúa principalmente esta lectura?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { id: 'a', text: readingData.comprehensionLevel },
            { id: 'b', text: 'Ninguno' },
            { id: 'c', text: 'Todos por igual' },
            { id: 'd', text: 'No aplica' },
          ],
          correctAnswer: 'a',
          explanation: `Esta lectura fue clasificada como nivel ${readingData.comprehensionLevel}.`,
          order: 3,
          status: 'APPROVED',
        },
        {
          readingId: reading.id,
          statement: '¿El texto menciona algún lugar o elemento cultural guatemalteco?',
          type: 'TRUE_FALSE',
          options: [
            { id: 'true', text: 'Verdadero' },
            { id: 'false', text: 'Falso' },
          ],
          correctAnswer: 'true',
          explanation: 'Sí — el texto incluye referencias culturales o geográficas de Guatemala.',
          order: 4,
          status: 'APPROVED',
        },
        {
          readingId: reading.id,
          statement: '¿Cuál de estas opciones resume mejor el texto leído?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { id: 'a', text: 'Un resumen fiel a lo leído' },
            { id: 'b', text: 'Un resumen de otro texto' },
            { id: 'c', text: 'Información falsa' },
            { id: 'd', text: 'Ninguna de las anteriores' },
          ],
          correctAnswer: 'a',
          explanation: 'La opción correcta refleja fielmente el contenido de la lectura.',
          order: 5,
          status: 'APPROVED',
        },
      ],
    });
  }

  const avatarItems = [
    { name: 'Camisa Azul', category: 'SHIRT', imageUrl: '/avatars/shirt-blue.png', price: 0, isDefault: true },
    { name: 'Camisa Roja', category: 'SHIRT', imageUrl: '/avatars/shirt-red.png', price: 0, isDefault: true },
    { name: 'Camisa Verde', category: 'SHIRT', imageUrl: '/avatars/shirt-green.png', price: 0, isDefault: true },
    { name: 'Fondo Neutro', category: 'BACKGROUND', imageUrl: '/avatars/bg-neutral.png', price: 0, isDefault: true },
    { name: 'Fondo Escuela', category: 'BACKGROUND', imageUrl: '/avatars/bg-school.png', price: 0, isDefault: true },
  ] as const;

  for (const item of avatarItems) {
    await prisma.avatarItem.upsert({
      where: { id: `seed-${item.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `seed-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        price: item.price,
        isDefault: item.isDefault,
      },
    });
  }

  console.log(
    `Seed completado: admin, ${STUDENTS.length} estudiantes, 3 lecturas (5 preguntas c/u) y avatar items por defecto.`,
  );
  console.log('  Admin:       admin@lectoapp.gt / LectoAdmin2026!');
  for (const student of STUDENTS) {
    console.log(`  Estudiante:  ${student.email} / Estudiante123!`);
  }
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
