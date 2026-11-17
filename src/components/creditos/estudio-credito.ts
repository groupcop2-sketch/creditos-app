// Same formulas as ms-creditos-app/src/modules/creditos/estudio-credito.ts (the server recalculates on save).
import type { TipoEstudio } from '../../api';

export type VariablesEstudio = {
  salario?: number;
  aportesLey?: number;
  deduccionesNomina?: number;
  ingresosDemostrables?: number;
  obligacionesCentrales?: number;
};

export const PORCENTAJE_ESTUDIO_DEFECTO = 70;
export const PORCENTAJE_APORTES_LEY = 8; // salud 4% + pensión 4%

const round2 = (value: number) => Math.round(value * 100) / 100;
const num = (value: number | undefined) => (Number.isFinite(value) ? Number(value) : 0);

export function calcularEstudio(tipo: TipoEstudio, variables: VariablesEstudio, porcentaje: number) {
  const pct = porcentaje > 0 && porcentaje <= 100 ? porcentaje : 0;
  if (tipo === 'LIBRANZA') {
    const netoBase = num(variables.salario) - num(variables.aportesLey);
    const minimoVariable = netoBase / 2;
    const disponible = minimoVariable - num(variables.deduccionesNomina);
    return { netoBase: round2(netoBase), minimoVariable: round2(minimoVariable), disponible: round2(disponible), cuotaMaxima: round2((Math.max(0, disponible) * pct) / 100) };
  }
  const netoBase = num(variables.ingresosDemostrables) - num(variables.obligacionesCentrales);
  const disponible = netoBase / 2;
  return { netoBase: round2(netoBase), minimoVariable: null, disponible: round2(disponible), cuotaMaxima: round2((Math.max(0, disponible) * pct) / 100) };
}
