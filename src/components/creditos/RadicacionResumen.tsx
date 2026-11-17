import React, { useEffect, useState } from 'react';
import { Building2, ClipboardList, UserRound } from 'lucide-react';
import { api, type CreditoExpediente, type CreditoRow, type SoportesClienteResponse } from '../../api';

type Props = {
  token: string;
  credito: CreditoRow;
  expediente: CreditoExpediente | null;
  formatMoney: (val?: number | null) => string;
  formatDateTime: (val?: string | null) => string;
};

const MODALIDAD_LABEL = { EFECTIVO: 'Efectivo', COMPRA_CARTERA: 'Compra de cartera', MIXTO: 'Mixto (efectivo + compra de cartera)' };

const show = (value: string | number | null | undefined) => (value == null || value === '' ? '—' : String(value));
const yesNo = (value: boolean | null | undefined) => (value == null ? '—' : value ? 'Sí' : 'No');
const date = (value: string | null | undefined) => (value ? new Date(value).toLocaleDateString('es-CO') : '—');

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="radicacion-row"><dt>{label}</dt><dd>{value}</dd></div>
);

/** "Radicación" stage: the request exactly as the client sent it, plus applicant and employer data. */
export const RadicacionResumen: React.FC<Props> = ({ token, credito, expediente, formatMoney, formatDateTime }) => {
  const [modalidad, setModalidad] = useState<SoportesClienteResponse | null>(null);

  useEffect(() => {
    api.listSoportesCliente(token, credito.id).then(setModalidad).catch(() => setModalidad(null));
  }, [token, credito.id]);

  const portal = expediente?.perfilCliente?.portal;
  const empleado = expediente?.perfilCliente?.empleado;
  const empresa = expediente?.perfilCliente?.empresa;

  return (
    <div className="radicacion-panel">
      <section className="radicacion-card">
        <h3><ClipboardList size={16} aria-hidden="true" /> Solicitud de crédito</h3>
        <dl>
          <Row label="Producto" value={show(credito.producto)} />
          <Row label="Tipo de crédito" value={show(credito.tipoCredito)} />
          <Row label="Monto solicitado" value={formatMoney(credito.montoSolicitado)} />
          <Row label="Plazo" value={`${credito.plazo} meses`} />
          <Row label="Tasa" value={credito.tasa != null ? `${credito.tasa}%${credito.tipoTasa ? ` ${credito.tipoTasa}` : ''}` : '—'} />
          <Row label="Cuota estimada" value={credito.cuotaEstimada != null ? formatMoney(credito.cuotaEstimada) : '—'} />
          <Row label="Modalidad" value={modalidad ? MODALIDAD_LABEL[modalidad.modalidad] : '—'} />
          {modalidad && modalidad.modalidad !== 'EFECTIVO' && <Row label="Compra de cartera" value={formatMoney(modalidad.valorCompraCartera)} />}
          {modalidad && modalidad.modalidad !== 'COMPRA_CARTERA' && <Row label="Efectivo al cliente" value={formatMoney(modalidad.valorEfectivo)} />}
          <Row label="Asesor / comercial" value={show(credito.comercial)} />
          <Row label="Fecha de radicación" value={formatDateTime(credito.fechaRadicacion)} />
        </dl>
        {modalidad && modalidad.compras.length > 0 && (
          <div className="radicacion-compras">
            <h4>Deudas a comprar</h4>
            <ul>
              {modalidad.compras.map((compra) => (
                <li key={compra.id}><span>{compra.entidad}</span><strong>{formatMoney(compra.valor)}</strong></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="radicacion-card">
        <h3><UserRound size={16} aria-hidden="true" /> Solicitante</h3>
        <dl>
          <Row label="Nombre" value={show(credito.nombreCliente)} />
          <Row label="Identificación" value={show(credito.identificacionCliente)} />
          <Row label="Correo" value={show(portal?.correo || credito.correoCliente)} />
          <Row label="Correo confirmado" value={yesNo(portal?.correoConfirmado)} />
          <Row label="Teléfono" value={show(portal?.telefono || credito.telefonoCliente)} />
          <Row label="Estado civil" value={show(empleado?.estadoCivil)} />
          <Row label="Personas a cargo" value={show(empleado?.personasCargo)} />
          <Row label="Vivienda" value={show(empleado?.tipoVivienda)} />
          <Row label="Banco de nómina" value={show(empleado?.banco)} />
          <Row label="Cuenta de nómina" value={empleado?.cuentaNomina ? `${show(empleado.tipoCuenta)} · ${empleado.cuentaNomina}` : '—'} />
        </dl>
      </section>

      <section className="radicacion-card">
        <h3><Building2 size={16} aria-hidden="true" /> Empleador e información laboral</h3>
        <dl>
          <Row label="Empresa" value={show(empresa?.razonSocial || credito.empresa)} />
          <Row label="NIT" value={show(empresa?.nit)} />
          <Row label="Código de convenio" value={show(empresa?.codigo)} />
          <Row label="Teléfono empresa" value={show(empresa?.telefono)} />
          <Row label="Correo empresa" value={show(empresa?.correo)} />
          <Row label="Representante legal" value={show(empresa?.representanteLegal)} />
          <Row label="Cargo" value={show(portal?.cargo || empleado?.cargo)} />
          <Row label="Tipo de contrato" value={show(portal?.tipoContrato)} />
          <Row label="Fecha de ingreso" value={date(portal?.fechaIngreso)} />
          <Row label="Salario" value={portal?.salario != null || empleado?.salario != null ? formatMoney(portal?.salario ?? empleado?.salario) : '—'} />
          <Row label="Salario neto" value={portal?.neto != null ? formatMoney(portal.neto) : '—'} />
          <Row label="Embargos" value={yesNo(portal?.tieneEmbargos)} />
        </dl>
      </section>
    </div>
  );
};
