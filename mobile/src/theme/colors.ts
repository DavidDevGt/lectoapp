/**
 * Sistema de tokens de diseño para LectoApp Móvil (Figma / Stripe Quality Bar)
 */

export const colors = {
  // Marca Principal (Azul Guatemala & Índigo Gamificado)
  brandPrimary: '#2563EB',
  brandHover: '#1D4ED8',
  brandBg: '#EFF6FF',
  brandFg: '#1E40AF',
  brandLightText: '#DBEAFE',
  brandGradientStart: '#3B82F6',
  brandGradientEnd: '#1D4ED8',

  // Fondos y Superficies de Alta Densidad
  bgApp: '#F8FAFC',
  bgSurface: '#FFFFFF',
  bgSunken: '#F1F5F9',
  bgElevated: '#FFFFFF',
  bgDark: '#0F172A',
  overlayBg: 'rgba(15, 23, 42, 0.75)',

  // Bordes y Divisores
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderFocus: '#3B82F6',

  // Texto
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  textOnBrand: '#FFFFFF',

  // Niveles de Comprensión Lector
  literalBg: '#E0F2FE',
  literalFg: '#0369A1',
  literalSolid: '#0284C7',

  inferentialBg: '#EEF2FF',
  inferentialFg: '#3730A3',
  inferentialSolid: '#4F46E5',

  criticalBg: '#FDF4FF',
  criticalFg: '#86198F',
  criticalSolid: '#C026D3',

  // Niveles de Progresión del Estudiante
  beginner: '#64748B',
  intermediate: '#0D9488',
  advanced: '#2563EB',
  expert: '#9333EA',
  supreme: '#D97706',

  // Estado y Gamificación
  successBg: '#DCFCE7',
  successFg: '#15803D',
  successSolid: '#16A34A',

  pendingBg: '#FEF3C7',
  pendingFg: '#92400E',
  pendingSolid: '#D97706',

  dangerBg: '#FEE2E2',
  dangerFg: '#991B1B',
  dangerSolid: '#DC2626',

  // Recompensas y Rachas Gamificadas
  goldBg: '#FEF3C7',
  goldFg: '#B45309',
  goldSolid: '#F59E0B',

  streakBg: '#FFE4E6',
  streakFg: '#BE123C',
  streakSolid: '#F43F5E',
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};
