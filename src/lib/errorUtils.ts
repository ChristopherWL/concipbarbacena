/**
 * Sanitize database error messages to prevent information disclosure
 * Maps internal error details to user-friendly messages
 */
export function sanitizeErrorMessage(error: any): string {
  const message = error?.message || error?.toString() || '';
  
  // Check for common database error patterns
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'Este valor já está em uso. Por favor, escolha outro.';
  }
  
  if (message.includes('violates row-level security') || message.includes('row-level security policy')) {
    return 'Você não tem permissão para realizar esta operação.';
  }
  
  if (message.includes('violates foreign key constraint')) {
    return 'Esta operação não pode ser realizada devido a registros relacionados.';
  }
  
  if (message.includes('not-null constraint') || message.includes('null value')) {
    return 'Por favor, preencha todos os campos obrigatórios.';
  }
  
  if (message.includes('relation') && message.includes('does not exist')) {
    return 'Erro de configuração do sistema. Contate o suporte.';
  }
  
  if (message.includes('permission denied')) {
    return 'Acesso negado. Você não tem permissão para esta ação.';
  }
  
  if (message.includes('JWT') || message.includes('token')) {
    return 'Sessão expirada. Por favor, faça login novamente.';
  }
  
  if (message.includes('timeout') || message.includes('connection')) {
    return 'Erro de conexão. Por favor, tente novamente.';
  }

  // For storage errors
  if (message.includes('storage') || message.includes('bucket')) {
    return 'Erro ao processar arquivo. Por favor, tente novamente.';
  }
  
  // Default fallback - generic message
  return 'Erro ao processar requisição. Por favor, tente novamente.';
}

/**
 * Validate and sanitize a color value
 * Returns true if the color is a valid hex, rgb, or hsl format
 */
export function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  
  // Hex color
  if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) return true;
  
  // RGB/RGBA
  if (/^rgba?\([0-9,\s.%]+\)$/i.test(color)) return true;
  
  // HSL/HSLA
  if (/^hsla?\([0-9,\s.%deg]+\)$/i.test(color)) return true;
  
  // CSS color keywords (common ones)
  const validKeywords = [
    'transparent', 'currentColor', 'inherit',
    'red', 'blue', 'green', 'white', 'black', 'gray', 'grey',
    'yellow', 'orange', 'purple', 'pink', 'cyan', 'magenta'
  ];
  if (validKeywords.includes(color.toLowerCase())) return true;
  
  return false;
}

/**
 * Sanitize a string for use in CSS selectors
 * Removes any characters that could be used for CSS injection
 */
export function sanitizeCssId(id: string): string {
  if (!id || typeof id !== 'string') return '';
  // Only allow alphanumeric, hyphens, and underscores
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}
