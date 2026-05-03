import type { TaskColor } from '../../../domain/board';

export const taskColorLabels: Record<TaskColor, string> = {
  none: 'No color',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  orange: 'Orange',
  red: 'Red',
  purple: 'Purple',
};

export const taskColorValues: Record<TaskColor, string> = {
  none: 'transparent',
  blue: '#2684ff',
  green: '#36b37e',
  yellow: '#ffab00',
  orange: '#ff8b00',
  red: '#ff5630',
  purple: '#6554c0',
};

export const taskColorTintValues: Record<TaskColor, string> = {
  none: '#ffffff',
  blue: '#f0f6ff',
  green: '#effaf5',
  yellow: '#fff8e6',
  orange: '#fff3e6',
  red: '#fff1ee',
  purple: '#f4f2ff',
};

