import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens } from './tokens';

/**
 * Catálogo vivo de la paleta. Es la referencia que recibe el diseñador: lo que
 * se ve aquí es exactamente lo que renderiza la aplicación, porque sale del
 * mismo archivo.
 */
const meta = {
  title: 'Sistema de diseño/Tokens de color',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const GROUPS: { title: string; note: string; prefix: string[] }[] = [
  {
    title: 'Marca',
    note: '#0072CE es el azul canónico: es el único de los dos propuestos que supera AA sobre blanco.',
    prefix: ['--color-brand', '--color-sidebar', '--color-focus'],
  },
  {
    title: 'Nivel de comprensión',
    note: 'Rampa ordenada cielo → índigo → fucsia. Separación de tono de 43° y 52°, suficiente para distinguirlas a tamaño de badge.',
    prefix: ['--color-literal', '--color-inferential', '--color-critical'],
  },
  {
    title: 'Estado de flujo editorial',
    note: 'El ámbar es exclusivo de "pendiente de revisión" y contenido generado por IA. Ningún nivel pedagógico lo usa.',
    prefix: ['--color-success', '--color-pending', '--color-danger'],
  },
  {
    title: 'Estado de lectura',
    note: 'Archivada es neutra, no roja: archivar no es destructivo. El rojo queda reservado para eliminar.',
    prefix: ['--color-status'],
  },
  {
    title: 'Nivel de progresión del estudiante',
    note: 'Solo se usan en gráficas. Los cinco superan AA sobre blanco y no comparten familia con la escala pedagógica.',
    prefix: ['--color-level'],
  },
  {
    title: 'Superficies, texto y neutros',
    note: 'Neutros fríos, con sesgo hacia el azul de marca.',
    prefix: ['--color-bg', '--color-border', '--color-text', '--color-neutral'],
  },
];

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          background: value,
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-sm)',
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{name}</div>
        <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export const Paleta: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {GROUPS.map((group) => {
        const entries = Object.entries(tokens).filter(([name]) =>
          group.prefix.some((prefix) => name.startsWith(prefix)),
        );
        return (
          <section key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={{ margin: 0, fontSize: 16, color: 'var(--color-text-primary)' }}>{group.title}</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: '68ch' }}>
              {group.note}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 'var(--space-2)',
              }}
            >
              {entries.map(([name, value]) => (
                <Swatch key={name} name={name} value={value} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  ),
};
