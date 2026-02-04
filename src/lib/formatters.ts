// Formatadores de campos com máscaras automáticas

export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  return numbers
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const formatDocument = (value: string, type: 'pf' | 'pj' = 'pf'): string => {
  return type === 'pj' ? formatCNPJ(value) : formatCPF(value);
};

export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

export const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
};

export const formatRG = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 9);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})$/, '$1-$2');
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Formats a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 * without timezone conversion issues.
 * 
 * IMPORTANT: Do NOT use `new Date(dateString).toLocaleDateString()` for date-only strings
 * as it interprets them as UTC midnight, causing day shift issues.
 */
export const formatDateBR = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  // Handle ISO date strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-');
  
  if (parts.length !== 3) return dateString;
  
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Parses a date string (YYYY-MM-DD) to a Date object
 * using local timezone to avoid day shift issues.
 */
export const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a Date object to YYYY-MM-DD string for storage/API
 * using local timezone components.
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
