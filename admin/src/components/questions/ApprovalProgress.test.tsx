import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ApprovalProgress } from './ApprovalProgress';

describe('ApprovalProgress', () => {
  it('should show how many questions are missing when below the publish threshold', () => {
    renderWithProviders(<ApprovalProgress approvedCount={3} draftCount={4} />);

    expect(screen.getByText(/faltan 2 preguntas aprobadas para publicar/i)).toBeInTheDocument();
  });

  it('should show that it is ready to publish when the threshold is reached', () => {
    renderWithProviders(<ApprovalProgress approvedCount={6} draftCount={0} />);

    expect(screen.getByText(/lista para publicar/i)).toBeInTheDocument();
    expect(screen.getByText(/6 aprobadas/i)).toBeInTheDocument();
  });
});
