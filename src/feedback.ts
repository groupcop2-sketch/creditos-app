export type ApiRequestError = Error & {
  status?: number;
  details?: unknown;
};

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const status = (error as ApiRequestError).status;
  const raw = error.message.trim();
  const normalized = raw.toLowerCase();

  if (status === 401 || normalized.includes('credenciales invalidas')) {
    return 'Usuario o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.';
  }

  if (status === 403 || normalized.includes('no esta activo') || normalized.includes('activar tu cuenta')) {
    return normalized.includes('activar')
      ? 'Debes activar tu cuenta antes de iniciar sesión. Revisa tu correo.'
      : 'Tu cuenta no está activa. Contacta al administrador.';
  }

  if (
    status === 400
    || normalized.includes('too small')
    || normalized.includes('expected string')
    || normalized.includes('datos invalidos')
  ) {
    return 'Completa el usuario y la contraseña para continuar.';
  }

  if (
    normalized.includes('failed to fetch')
    || normalized.includes('networkerror')
    || normalized.includes('load failed')
    || normalized.includes('network request failed')
  ) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }

  return raw || fallback;
}
