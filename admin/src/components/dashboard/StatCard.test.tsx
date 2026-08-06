import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('should render as an article with an accessible name equal to the label', () => {
    renderWithProviders(<StatCard label="Lecturas totales" value={12} />);

    expect(screen.getByRole('article', { name: /lecturas totales/i })).toBeInTheDocument();
  });

  it('should render the value inside the article, including a literal 0', () => {
    renderWithProviders(<StatCard label="Estudiantes" value={0} />);

    expect(screen.getByRole('article', { name: /estudiantes/i })).toHaveTextContent('0');
  });

  it('should render a plain hint when no "to" is provided', () => {
    renderWithProviders(<StatCard label="Tasa de aprobación" value="72.5%" hint="Últimos 30 días" />);

    expect(screen.getByText(/últimos 30 días/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should render the hint as a link to "to" when both are provided', () => {
    renderWithProviders(
      <StatCard label="Pendientes de revisión" value={8} hint="Revisar preguntas pendientes" to="/readings" />,
    );

    expect(screen.getByRole('link', { name: /revisar preguntas pendientes/i })).toHaveAttribute(
      'href',
      '/readings',
    );
  });

  it('should not render a link when "to" is absent even if hint is set', () => {
    renderWithProviders(<StatCard label="Publicadas" value={7} hint="Solo texto" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
