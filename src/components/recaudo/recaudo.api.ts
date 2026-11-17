import { API_URL, request } from '../../api';

export type EstadoCuenta = 'SIN_GENERAR' | 'GENERADA' | 'ENVIADA' | 'CONCILIADA_PARCIAL' | 'CONCILIADA' | 'NO_GIRO' | 'ANULADA';
export type Resultado = 'COMPLETO' | 'PARCIAL' | 'EXCEDENTE' | 'NOVEDAD' | 'CERO' | 'FALTANTE' | 'NO_ENCONTRADO' | 'DUPLICADO';
export type Campo = 'identificacion' | 'valor' | 'credito' | 'nombre' | 'novedad' | 'periodo' | 'fecha' | '';

export type CuentaCobro = {
  id: number; consecutivo: string; empresaId: number; periodo: string; fechaEmision: string; fechaPagoNomina: string; fechaLimiteGiro: string;
  total: number; recibido: number; estado: EstadoCuenta; idCuentaEgreso: number | null; envios: number; fechaUltimoEnvio: string | null; correoUltimoEnvio: string | null;
};
export type DetalleCobro = {
  idCredito: number; consecutivo: string; identificacion: string; nombre: string; numeroCuota: number; totalCuotas: number; cuotasPendientes: number;
  valorCuota: number; mora: number; total: number; saldoCapital: number;
};
export type CuentaCobroDetalle = CuentaCobro & {
  periodoNombre: string;
  empresa: { id: number; nombre: string; nit: string | null; contacto: string | null; correo: string | null };
  cuentaGiro: { banco: string; tipo: string; numero: string; titular: string | null } | null;
  detalle: DetalleCobro[];
};
export type EmpresaPeriodo = {
  id: number; nombre: string; nit: string | null; correo: string | null; tienePlantilla: boolean; creditos: number; cobrado: number; recibido: number;
  fechaPagoNomina: string; fechaLimiteGiro: string; cuenta: CuentaCobro | null; estado: EstadoCuenta;
};
export type ResumenPeriodo = { periodo: string; nombre: string; cierre: { estado: string; fecha: string } | null; empresas: EmpresaPeriodo[] };
export type Plantilla = { separador: string; filaEncabezado: number; mapeo: Record<string, Campo>; novedades: Record<string, string>; archivoEjemplo?: string | null };
export type ItemConciliado = {
  id?: number; fila: number | null; identificacion: string; nombreArchivo?: string | null; nombre: string | null; idCredito: number | null; consecutivo?: string | null;
  cobrado: number | null; valor: number; novedad: string | null; resultado: Resultado; detalle: string; resuelta?: boolean;
};
export type Conciliacion = {
  cuenta: CuentaCobro; encabezados: string[]; errores: Array<{ fila: number; motivo: string }>; items: ItemConciliado[];
  totales: { totalArchivo: number; aplicar: number; pagos: number; revision: number }; loteExistente: number | null;
};
export type Lote = {
  id: number; codigo: string; empresaId: number; empresa: string; cuentaCobroId: number; consecutivo: string; periodo: string; nombreArchivo: string | null;
  fechaGiro: string; valorGirado: number; totalArchivo: number; totalAplicado: number; filas: number; pagos: number; estado: 'APLICADO' | 'REVERSADO';
  motivoReverso: string | null; fecha: string; usuario: string | null; items?: ItemConciliado[];
};
export type ResumenCierreCuenta = { pagadas: number; conSaldo: number; arrastre: number; reclamar: number; novedades: number; favor: number };
export type EstadoCierre = {
  periodo: string; nombre: string; siguiente: string;
  cierre: { estado: 'CERRADO' | 'REABIERTO'; fecha: string; motivoReapertura: string | null } | null;
  chequeos: {
    sinCuenta: Array<{ id: number; nombre: string }>;
    sinEnviar: Array<{ id: number; empresaId: number; nombre: string; consecutivo: string }>;
    sinPago: Array<{ id: number; empresaId: number; nombre: string; consecutivo: string }>;
    revision: Array<{ id: number; lote: string; identificacion: string; nombre: string | null; valor: number; detalle: string | null; empresa: string }>;
    novedadesPendientes: number; novedadesTotal: number;
    sinVencer: Array<{ nombre: string; fechaLimiteGiro: string }>;
  };
  listo: boolean;
  totales: { recaudado: number; cuotasPagadas: number; cuotasConSaldo: number; arrastre: number; reclamar: number; saldoFavor: number; porIdentificar: number };
  cuentas: Array<CuentaCobro & { empresa: string; resumen: ResumenCierreCuenta | null }>;
  borradores?: Array<{ empresa: string; consecutivo?: string; error?: string }>;
};

const R = '/api/v1/recaudo';
const json = (body: unknown = {}) => ({ method: 'POST', body: JSON.stringify(body) });

async function blob(token: string, path: string) {
  const response = await fetch(`${API_URL}${R}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || 'No se pudo descargar el archivo');
  }
  return response.blob();
}

export const recaudoApi = {
  periodo: (t: string, periodo: string) => request<ResumenPeriodo>(`${R}/periodos/${periodo}`, {}, t),
  vistaPrevia: (t: string, empresaId: number, periodo: string) =>
    request<{ fechaPagoNomina: string; fechaLimiteGiro: string; detalle: DetalleCobro[]; total: number }>(`${R}/cuentas-cobro/vista-previa?empresaId=${empresaId}&periodo=${periodo}`, {}, t),
  generarCuenta: (t: string, body: { empresaId: number; periodo: string; fechaPagoNomina?: string | null; idCuentaEgreso?: number | null }) =>
    request<CuentaCobroDetalle>(`${R}/cuentas-cobro`, json(body), t),
  cuenta: (t: string, id: number) => request<CuentaCobroDetalle>(`${R}/cuentas-cobro/${id}`, {}, t),
  pdf: (t: string, id: number) => blob(t, `/cuentas-cobro/${id}/pdf`),
  excel: (t: string, id: number) => blob(t, `/cuentas-cobro/${id}/excel`),
  enviar: (t: string, id: number, manual = false) => request<CuentaCobroDetalle>(`${R}/cuentas-cobro/${id}/enviar`, json({ manual }), t),
  anular: (t: string, id: number, motivo: string) => request<CuentaCobroDetalle>(`${R}/cuentas-cobro/${id}/anular`, json({ motivo }), t),
  noGiro: (t: string, id: number) => request<CuentaCobroDetalle>(`${R}/cuentas-cobro/${id}/no-giro`, json(), t),
  plantilla: (t: string, empresaId: number) => request<Plantilla | null>(`${R}/plantillas/${empresaId}`, {}, t),
  guardarPlantilla: (t: string, empresaId: number, p: Plantilla) => request<Plantilla>(`${R}/plantillas/${empresaId}`, { method: 'PUT', body: JSON.stringify(p) }, t),
  probarPlantilla: (t: string, plantilla: Plantilla, texto: string) =>
    request<{ error: string | null; encabezados: string[]; filas: number; errores: Array<{ fila: number; motivo: string }>; totalErrores: number }>(`${R}/plantillas/probar`, json({ plantilla, texto }), t),
  conciliar: (t: string, body: { empresaId: number; periodo: string; texto: string }) => request<Conciliacion>(`${R}/lotes/conciliar`, json(body), t),
  aplicar: (t: string, body: { empresaId: number; periodo: string; texto: string; nombreArchivo?: string | null; fechaGiro: string; valorGirado: number }) =>
    request<Lote>(`${R}/lotes`, json(body), t),
  lotes: (t: string, periodo: string) => request<Lote[]>(`${R}/lotes?periodo=${periodo}`, {}, t),
  lote: (t: string, id: number) => request<Lote>(`${R}/lotes/${id}`, {}, t),
  reversar: (t: string, id: number, motivo: string) => request<Lote>(`${R}/lotes/${id}/reversar`, json({ motivo }), t),
  porIdentificar: (t: string, filaId: number) => request<{ ok: boolean }>(`${R}/lotes/filas/${filaId}/por-identificar`, json(), t),
  asignar: (t: string, filaId: number, creditoId: number) => request<Lote>(`${R}/lotes/filas/${filaId}/asignar`, json({ creditoId }), t),
  novedadesRevisadas: (t: string, periodo: string) => request<{ revisadas: number }>(`${R}/periodos/${periodo}/novedades-revisadas`, json(), t),
  cierre: (t: string, periodo: string) => request<EstadoCierre>(`${R}/cierres/${periodo}`, {}, t),
  cerrar: (t: string, periodo: string) => request<EstadoCierre>(`${R}/cierres/${periodo}`, json(), t),
  reabrir: (t: string, periodo: string, motivo: string) => request<EstadoCierre>(`${R}/cierres/${periodo}/reabrir`, json({ motivo }), t)
};

/* ---------- Shared formatting ---------- */
const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const money = (n: number | null | undefined) => cop.format(Math.round(n ?? 0));
export const fecha = (d: string | null | undefined) =>
  d ? new Date(d.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const nombrePeriodo = (p: string) => { const [y, m] = p.split('-').map(Number); return `${MESES[m - 1]} ${y}`; };

export const ESTADO: Record<EstadoCuenta, [string, string]> = {
  SIN_GENERAR: ['Sin generar', 'neutral'], GENERADA: ['Generada', 'neutral'], ENVIADA: ['Enviada', 'info'],
  CONCILIADA_PARCIAL: ['Conciliada parcial', 'warn'], CONCILIADA: ['Conciliada', 'good'], NO_GIRO: ['No giró', 'bad'], ANULADA: ['Anulada', 'bad']
};
export const RESULTADO: Record<Resultado, [string, string]> = {
  COMPLETO: ['Pago completo', 'good'], PARCIAL: ['Pago parcial', 'warn'], EXCEDENTE: ['Excedente a favor', 'info'], NOVEDAD: ['Novedad', 'neutral'],
  CERO: ['Descontó $0', 'bad'], FALTANTE: ['No viene en el archivo', 'bad'], NO_ENCONTRADO: ['No encontrado', 'bad'], DUPLICADO: ['Duplicado', 'bad']
};

/** Same rules as the server: 1.776.500 · 1776500 · 1.776.500,50 · 1776500.50 · $ 1.776.500. */
export function parseMoney(raw: string): number {
  let s = raw.trim().replace(/[$\s]/g, '');
  if (!s) return Number.NaN;
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > -1 && ld > -1) s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (lc > -1) s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  else if (ld > -1 && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return Number(s);
}

/** Reads a payroll file as text: UTF-8 first, Windows-1252 when Excel saved it in ANSI. */
export async function leerArchivo(file: File) {
  const buffer = await file.arrayBuffer();
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buffer); } catch { return new TextDecoder('windows-1252').decode(buffer); }
}
