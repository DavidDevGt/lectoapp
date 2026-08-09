import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
// Los tokens primero: cada componente se documenta con los mismos valores que
// usa la aplicación, no con una copia del catálogo.
import '../src/styles/tokens.css';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: {
      // 'todo' muestra las violaciones en el panel sin bloquear la navegación;
      // el gate que rompe el build vive en src/test/a11y.test.tsx.
      test: 'todo',
    },
    backgrounds: {
      options: {
        panel: { name: 'Panel', value: '#F8FAFC' },
        surface: { name: 'Superficie', value: '#FFFFFF' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'panel' },
  },
  decorators: [
    (Story) => {
      // Varios componentes disparan mutaciones o navegan; se les da el mismo
      // entorno que en la app para poder documentarlos sin modificarlos.
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
