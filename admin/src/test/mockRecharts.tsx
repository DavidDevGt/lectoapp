import { ReactElement, ReactNode, cloneElement, isValidElement } from 'react';

/**
 * Replacement for recharts' `ResponsiveContainer`.
 *
 * jsdom reports 0x0 for element dimensions, so the real `ResponsiveContainer`
 * never measures a usable size and recharts renders nothing. This mock
 * clones the chart child with a fixed width/height, mirroring what
 * `ResponsiveContainer` does once it has measured its parent in a real browser.
 *
 * Usage in a test file:
 *
 * ```ts
 * import { MockResponsiveContainer } from '../../test/mockRecharts';
 *
 * vi.mock('recharts', async (importOriginal) => {
 *   const actual = await importOriginal<typeof import('recharts')>();
 *   return { ...actual, ResponsiveContainer: MockResponsiveContainer };
 * });
 * ```
 */
export function MockResponsiveContainer({ children }: { children: ReactNode }) {
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement<{ width?: number; height?: number }>, {
      width: 600,
      height: 300,
    });
  }

  return <>{children}</>;
}
