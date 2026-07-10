const API_URL = import.meta.env.VITE_API_URL || "";
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { RichDocumentEditor } from './RichDocumentEditor';
import { PdfFieldMapper } from './PdfFieldMapper';
import {
  api,
  type AddressCatalogs,
  type AliadoRow,
  type AliadosCatalogs,
  type CarteraReporte,
  type CatalogModule,
  type ComercialRow,
  type ComercialesCatalogs,
  type CreditoDocumentoRow,
  type CreditoEtapaRow,
  type CreditoExpediente,
  type CreditoRow,
  type CreditosCatalogs,
  type DashboardGerencial,
  type DocumentTemplateDetail,
  type DocumentTemplateRow,
  type DocumentVariable,
  type EmpleadoEmpresaRow,
  type EmpresaRow,
  type EmployeeCatalogs,
  type FirmaCreditoRow,
  type FondeoDisponibleRow,
  type InversionRow,
  type IdentificationTypeRow,
  type LibranzeraRow,
  type PermissionRow,
  type PortalCatalogs,
  type PortalCliente,
  type PortalCreditosResponse,
  type PortalProductoCredito,
  type ProductoAtributoRow,
  type ProductoCreditoRow,
  type ProductoDocumentoRow,
  type ProductoEtapaRow,
  type ProductosCreditoCatalogs,
  type RoleRow,
  type SecurityUser,
  type SimulacionCredito,
  type SocioRow,
  type SociosCatalogs,
  type UserRow
} from './api';

type ViewKey = 'dashboard' | 'usuarios' | 'configuracion' | `modulo:${number}`;
type ConfigTab = 'roles' | 'permisos' | 'modulos' | 'apariencia';
type EmpresaTab = 'registro' | 'directorio' | 'empleados';
type SociosTab = 'registro' | 'directorio' | 'inversiones';
type AliadosTab = 'registro' | 'directorio';
type ComercialesTab = 'libranzera' | 'vendedor' | 'directorio';
type ProductosCreditoTab = 'solicitudes' | 'general' | 'atributos' | 'documentos' | 'etapas';
type ThemeMode = 'light' | 'dark';
type PaletteKey = 'azul' | 'verde' | 'vino' | 'grafito';

type SessionState = {
  token: string;
  user: SecurityUser;
};

type AuthFormState = {
  username: string;
  password: string;
};

type PortalRegisterFormState = {
  codigoEmpresa: string;
  identificacion: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  correo: string;
  telefono: string;
  password: string;
  cargo: string;
  idTipoContrato: string;
  fechaIngreso: string;
  salario: string;
  neto: string;
  tieneEmbargos: boolean;
  idTipoIdentificacion: string;
};

type PortalLoginFormState = {
  identificacion: string;
  password: string;
};

type PortalForgotFormState = {
  correo: string;
  token: string;
  password: string;
};

type PortalCreditoFormState = {
  idProductoCredito: string;
  montoSolicitado: string;
  plazo: string;
  codigoVendedor: string;
  aceptaTerminos: boolean;
};

type DocumentTemplateFormState = {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipoDocumento: string;
  contenido: string;
};

type UserFormState = {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  telefono: string;
  identificacion: string;
  contrasena: string;
  idTipoIdentificacion: string;
  roleIds: string[];
};

type RoleFormState = {
  nombre: string;
  descripcion: string;
};

type PermissionFormState = {
  nombre: string;
  descripcion: string;
};

type ModuleFormState = {
  nombre: string;
  descripcion: string;
};

type SubmoduleFormState = {
  nombre: string;
  descripcion: string;
  link: string;
  idModulo: string;
};

type EmpresaFormState = {
  nit: string;
  razonSocial: string;
  vendedor: string;
  domicilio: string;
  correo: string;
  telefono: string;
  representanteLegal: string;
  telefonoRepresentante: string;
  tipoIdentificacionRepresentante: string;
  identificacionRepresentante: string;
  correoRepresentante: string;
  codigo: string;
  contactoCargo: string;
  contactoNombre: string;
  contactoCorreo: string;
  contactoTelefono: string;
  fechaConstitucion: string;
  capitalSociedad: string;
  fechaVenta: string;
  ventasFecha: string;
  naturaleza: string;
  camaraNumero: string;
  camaraLibro: string;
  camaraCiudad: string;
  periodicidadNomina: string;
  diaCorteNomina: string;
  diaPagoNomina: string;
  segundoDiaPagoNomina: string;
  diaDescuentoLibranza: string;
  ajustarFinSemana: boolean;
  observacionCalendario: string;
  direccion: DireccionFormState;
};

type DireccionFormState = {
  idTipoVia: string;
  numPrincipal: string;
  idLetraPrincipal: string;
  bis: string;
  letraBis: string;
  cuadrantePrincipal: string;
  numSecundario: string;
  idLetraSecundaria: string;
  cuadranteSecundario: string;
  complemento: string;
  barrio: string;
  idCiudad: string;
};

type EmpleadoFormState = {
  idTipoIdentificacion: string;
  identificacion: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  correo: string;
  telefono: string;
  cargo: string;
  idTipoContrato: string;
  salario: string;
  idBanco: string;
  idTipoCuenta: string;
  cuentaNomina: string;
  tieneEmbargos: boolean;
  idEstadoCivil: string;
  personasCargo: string;
  idTipoVivienda: string;
  fechaIngreso: string;
};

type SocioFormState = {
  identificacion: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  correo: string;
  direccion: DireccionFormState;
  idTipoIdentificacion: string;
  fechaNacimiento: string;
  idBanco: string;
  idTipoCuenta: string;
  numeroCuenta: string;
};

type InversionFormState = {
  monto: string;
  fechaInversion: string;
  plazo: string;
  idTasaInversion: string;
};

type AliadoFormState = {
  identificacion: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string;
  logoUrl: string;
  idTipoIdentificacion: string;
  direccion: DireccionFormState;
  idBanco: string;
  idTipoCuenta: string;
  numeroCuenta: string;
  representante: {
    idTipoIdentificacion: string;
    identificacion: string;
    primerNombre: string;
    segundoNombre: string;
    primerApellido: string;
    segundoApellido: string;
    genero: string;
    telefono: string;
    correo: string;
    idCiudad: string;
  };
  camara: {
    numero: string;
    libro: string;
    idCiudad: string;
    rees: string;
    runeol: string;
  };
};

type LibranzeraFormState = {
  nit: string;
  razonSocial: string;
  domicilio: string;
  sitioWeb: string;
  correo: string;
  telefono: string;
  telefonoCallcenter: string;
  camaraNumero: string;
  camaraLibro: string;
  camaraIdCiudad: string;
  fechaConstitucion: string;
  ciiu: string;
  runeol: string;
  representanteLegal: {
    idTipoIdentificacion: string;
    identificacion: string;
    nombre: string;
    genero: string;
    idCiudad: string;
  };
  representanteCartera: {
    idTipoIdentificacion: string;
    identificacion: string;
    nombre: string;
    genero: string;
    idCiudad: string;
    telefono: string;
    correo: string;
  };
  idBanco: string;
  idTipoCuenta: string;
  numeroCuenta: string;
};

type ComercialFormState = {
  idLibranzera: string;
  identificacion: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  codigoVendedor: string;
  idTipoIdentificacion: string;
  idRolVendedor: string;
  idFormulaComercial: string;
  tipoComision: string;
  valorComision: string;
  direccion: DireccionFormState;
  idCiudad: string;
  idBanco: string;
  idTipoCuenta: string;
  numeroCuenta: string;
};

type ProductoCreditoFormState = {
  nombre: string;
  descripcion: string;
  idTipoCredito: string;
  tipoTasa: string;
  idLibranzera: string;
  montoMinimo: string;
  montoMaximo: string;
  salarioMinimo: string;
  salarioMaximo: string;
  plazoMinimo: string;
  plazoMaximo: string;
  modeloPlazo: string;
  permiteCreditoMultiple: boolean;
  interesAjustable: boolean;
  permiteRefinanciacion: boolean;
  permiteRetanqueo: boolean;
  requiereCodeudor: boolean;
  numeroCodeudores: string;
  formatoCredito: string;
  formatoRequisitos: string;
  formatoCodeudores: string;
  proveedorFirma: string;
  periodoGracia: string;
  periodicidad: string;
  diaCorte: string;
  diaPagoOportuno: string;
  ajustarFinSemana: boolean;
  moraDespuesVencimiento: string;
  tasaMoraMensual: string;
  primeraCuotaMesSiguiente: boolean;
  observacionCalendario: string;
};

type ProductoAtributoFormState = {
  idTipoAtributo: string;
  idTipoCalculo: string;
  nombre: string;
  valor: string;
  porcentaje: string;
  minimo: string;
  maximo: string;
  aplicaIva: boolean;
  obligatorio: boolean;
  proveedor: string;
  prioridad: string;
};

type ProductoDocumentoFormState = {
  idDocumentoCredito: string;
  obligatorio: boolean;
  prioridad: string;
  aplicaA: string;
  requiereFirma: boolean;
  requiereValidacion: boolean;
};

type ProductoEtapaFormState = {
  idEtapaCredito: string;
  orden: string;
  obligatoria: boolean;
  permiteDevolucion: boolean;
  responsable: string;
  slaHoras: string;
};

type CreditoFormState = {
  idProductoCredito: string;
  idLibranzera: string;
  idEmpresa: string;
  idEmpleadoEmpresa: string;
  idComercial: string;
  identificacionCliente: string;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente: string;
  montoSolicitado: string;
  plazo: string;
  tasa: string;
};

type Palette = {
  name: string;
  primary: string;
  primaryDark: string;
  accent: string;
};

const palettes: Record<PaletteKey, Palette> = {
  azul: {
    name: 'Azul corporativo',
    primary: '#164d83',
    primaryDark: '#0f3e70',
    accent: '#2f7cc1'
  },
  verde: {
    name: 'Verde financiero',
    primary: '#176b52',
    primaryDark: '#0d513d',
    accent: '#2fa36f'
  },
  vino: {
    name: 'Vino institucional',
    primary: '#7a2240',
    primaryDark: '#5d1830',
    accent: '#b84467'
  },
  grafito: {
    name: 'Grafito sobrio',
    primary: '#303946',
    primaryDark: '#202833',
    accent: '#68778a'
  }
};

const initialUserForm: UserFormState = {
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  nombreCompleto: '',
  nombreUsuario: '',
  correo: '',
  telefono: '',
  identificacion: '',
  contrasena: '',
  idTipoIdentificacion: '',
  roleIds: []
};

const initialRoleForm: RoleFormState = {
  nombre: '',
  descripcion: ''
};

const initialPermissionForm: PermissionFormState = {
  nombre: '',
  descripcion: ''
};

const initialModuleForm: ModuleFormState = {
  nombre: '',
  descripcion: ''
};

const initialSubmoduleForm: SubmoduleFormState = {
  nombre: '',
  descripcion: '',
  link: '',
  idModulo: ''
};

const initialEmpresaForm: EmpresaFormState = {
  nit: '',
  razonSocial: '',
  vendedor: '',
  domicilio: '',
  correo: '',
  telefono: '',
  representanteLegal: '',
  telefonoRepresentante: '',
  tipoIdentificacionRepresentante: '',
  identificacionRepresentante: '',
  correoRepresentante: '',
  codigo: '',
  contactoCargo: '',
  contactoNombre: '',
  contactoCorreo: '',
  contactoTelefono: '',
  fechaConstitucion: '',
  capitalSociedad: '',
  fechaVenta: '',
  ventasFecha: '',
  naturaleza: '',
  camaraNumero: '',
  camaraLibro: '',
  camaraCiudad: '',
  periodicidadNomina: 'MENSUAL',
  diaCorteNomina: '25',
  diaPagoNomina: '30',
  segundoDiaPagoNomina: '',
  diaDescuentoLibranza: '',
  ajustarFinSemana: true,
  observacionCalendario: '',
  direccion: {
    idTipoVia: '',
    numPrincipal: '',
    idLetraPrincipal: '',
    bis: '',
    letraBis: '',
    cuadrantePrincipal: '',
    numSecundario: '',
    idLetraSecundaria: '',
    cuadranteSecundario: '',
    complemento: '',
    barrio: '',
    idCiudad: ''
  }
};

const initialEmpleadoForm: EmpleadoFormState = {
  idTipoIdentificacion: '',
  identificacion: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  correo: '',
  telefono: '',
  cargo: '',
  idTipoContrato: '',
  salario: '',
  idBanco: '',
  idTipoCuenta: '',
  cuentaNomina: '',
  tieneEmbargos: false,
  idEstadoCivil: '',
  personasCargo: '0',
  idTipoVivienda: '',
  fechaIngreso: ''
};

const initialSocioForm: SocioFormState = {
  identificacion: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  telefono: '',
  correo: '',
  direccion: {
    idTipoVia: '',
    numPrincipal: '',
    idLetraPrincipal: '',
    bis: '',
    letraBis: '',
    cuadrantePrincipal: '',
    numSecundario: '',
    idLetraSecundaria: '',
    cuadranteSecundario: '',
    complemento: '',
    barrio: '',
    idCiudad: ''
  },
  idTipoIdentificacion: '',
  fechaNacimiento: '',
  idBanco: '',
  idTipoCuenta: '',
  numeroCuenta: ''
};

const initialInversionForm: InversionFormState = {
  monto: '',
  fechaInversion: '',
  plazo: '',
  idTasaInversion: ''
};

const initialAliadoForm: AliadoFormState = {
  identificacion: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  telefono: '',
  correo: '',
  fechaNacimiento: '',
  logoUrl: '',
  idTipoIdentificacion: '',
  direccion: {
    idTipoVia: '',
    numPrincipal: '',
    idLetraPrincipal: '',
    bis: '',
    letraBis: '',
    cuadrantePrincipal: '',
    numSecundario: '',
    idLetraSecundaria: '',
    cuadranteSecundario: '',
    complemento: '',
    barrio: '',
    idCiudad: ''
  },
  idBanco: '',
  idTipoCuenta: '',
  numeroCuenta: '',
  representante: {
    idTipoIdentificacion: '',
    identificacion: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    genero: '',
    telefono: '',
    correo: '',
    idCiudad: ''
  },
  camara: {
    numero: '',
    libro: '',
    idCiudad: '',
    rees: '',
    runeol: ''
  }
};

const initialLibranzeraForm: LibranzeraFormState = {
  nit: '',
  razonSocial: '',
  domicilio: '',
  sitioWeb: '',
  correo: '',
  telefono: '',
  telefonoCallcenter: '',
  camaraNumero: '',
  camaraLibro: '',
  camaraIdCiudad: '',
  fechaConstitucion: '',
  ciiu: '',
  runeol: '',
  representanteLegal: {
    idTipoIdentificacion: '',
    identificacion: '',
    nombre: '',
    genero: '',
    idCiudad: ''
  },
  representanteCartera: {
    idTipoIdentificacion: '',
    identificacion: '',
    nombre: '',
    genero: '',
    idCiudad: '',
    telefono: '',
    correo: ''
  },
  idBanco: '',
  idTipoCuenta: '',
  numeroCuenta: ''
};

const initialComercialForm: ComercialFormState = {
  idLibranzera: '',
  identificacion: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  codigoVendedor: '',
  idTipoIdentificacion: '',
  idRolVendedor: '',
  idFormulaComercial: '',
  tipoComision: 'PORCENTAJE',
  valorComision: '',
  direccion: {
    idTipoVia: '',
    numPrincipal: '',
    idLetraPrincipal: '',
    bis: '',
    letraBis: '',
    cuadrantePrincipal: '',
    numSecundario: '',
    idLetraSecundaria: '',
    cuadranteSecundario: '',
    complemento: '',
    barrio: '',
    idCiudad: ''
  },
  idCiudad: '',
  idBanco: '',
  idTipoCuenta: '',
  numeroCuenta: ''
};

const initialProductoCreditoForm: ProductoCreditoFormState = {
  nombre: '',
  descripcion: '',
  idTipoCredito: '',
  tipoTasa: 'FIJA',
  idLibranzera: '',
  montoMinimo: '',
  montoMaximo: '',
  salarioMinimo: '',
  salarioMaximo: '',
  plazoMinimo: '',
  plazoMaximo: '',
  modeloPlazo: 'MESES',
  permiteCreditoMultiple: false,
  interesAjustable: false,
  permiteRefinanciacion: false,
  permiteRetanqueo: false,
  requiereCodeudor: false,
  numeroCodeudores: '0',
  formatoCredito: 'NO',
  formatoRequisitos: 'NO',
  formatoCodeudores: 'NO',
  proveedorFirma: '',
  periodoGracia: '',
  periodicidad: 'MENSUAL',
  diaCorte: '25',
  diaPagoOportuno: '30',
  ajustarFinSemana: true,
  moraDespuesVencimiento: '0',
  tasaMoraMensual: '2',
  primeraCuotaMesSiguiente: true,
  observacionCalendario: ''
};

const initialProductoAtributoForm: ProductoAtributoFormState = {
  idTipoAtributo: '',
  idTipoCalculo: '',
  nombre: '',
  valor: '',
  porcentaje: '',
  minimo: '',
  maximo: '',
  aplicaIva: false,
  obligatorio: false,
  proveedor: '',
  prioridad: '1'
};

const initialProductoDocumentoForm: ProductoDocumentoFormState = {
  idDocumentoCredito: '',
  obligatorio: true,
  prioridad: '1',
  aplicaA: 'CLIENTE',
  requiereFirma: false,
  requiereValidacion: false
};

const initialProductoEtapaForm: ProductoEtapaFormState = {
  idEtapaCredito: '',
  orden: '1',
  obligatoria: true,
  permiteDevolucion: true,
  responsable: '',
  slaHoras: ''
};

const initialCreditoForm: CreditoFormState = {
  idProductoCredito: '',
  idLibranzera: '',
  idEmpresa: '',
  idEmpleadoEmpresa: '',
  idComercial: '',
  identificacionCliente: '',
  nombreCliente: '',
  correoCliente: '',
  telefonoCliente: '',
  montoSolicitado: '',
  plazo: '',
  tasa: ''
};

const initialPortalRegisterForm: PortalRegisterFormState = {
  codigoEmpresa: '',
  identificacion: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  correo: '',
  telefono: '',
  password: '',
  cargo: '',
  idTipoContrato: '',
  fechaIngreso: '',
  salario: '',
  neto: '',
  tieneEmbargos: false,
  idTipoIdentificacion: ''
};

const initialPortalLoginForm: PortalLoginFormState = {
  identificacion: '',
  password: ''
};

const initialPortalForgotForm: PortalForgotFormState = {
  correo: '',
  token: '',
  password: ''
};

const initialPortalCreditoForm: PortalCreditoFormState = {
  idProductoCredito: '',
  montoSolicitado: '',
  plazo: '',
  codigoVendedor: '',
  aceptaTerminos: false
};

const initialDocumentTemplateForm: DocumentTemplateFormState = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipoDocumento: 'PAGARE',
  contenido: ''
};

const monthOptions = Array.from({ length: 60 }, (_, index) => index + 1);

function toNumberIds(values: string[]) {
  return values.map(Number).filter((item) => Number.isFinite(item) && item > 0);
}

function initials(value?: string) {
  if (!value) return 'US';
  const parts = value.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'US';
}

function moduleCode(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'MD';
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function nextMonthDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function normalizeStatusClass(value?: string | null) {
  return (value || 'pendiente').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function isApprovalStageName(value?: string | null) {
  const normalized = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return normalized.includes('aprob') || normalized.includes('comite') || normalized.includes('analisis') || normalized.includes('estudio');
}

function isDisbursementStageName(value?: string | null) {
  const normalized = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return normalized.includes('desembol');
}

function normalizeDateInput(value: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function App() {
  const [session, setSession] = useState<SessionState | null>(() => {
    const token = localStorage.getItem('creditos.token');
    const user = localStorage.getItem('creditos.user');

    if (!token || !user) {
      return null;
    }

    try {
      return { token, user: JSON.parse(user) as SecurityUser };
    } catch {
      return null;
    }
  });
  const [dashboard, setDashboard] = useState<DashboardGerencial | null>(null);
  const [dashboardFilters, setDashboardFilters] = useState({ fechaInicio: '', fechaFin: '' });
  const [carteraReporte, setCarteraReporte] = useState<CarteraReporte | null>(null);
  const [carteraFilters, setCarteraFilters] = useState({ fechaInicio: '', fechaFin: '', idEmpresa: '', idProducto: '', idSocio: '', estado: '' });
  const [apiStatus, setApiStatus] = useState('Conectando a la API...');
  const [view, setView] = useState<ViewKey>('dashboard');
  const [configTab, setConfigTab] = useState<ConfigTab>('roles');
  const [authForm, setAuthForm] = useState<AuthFormState>({ username: '', password: '' });
  const [portalRegisterForm, setPortalRegisterForm] = useState<PortalRegisterFormState>(initialPortalRegisterForm);
  const [portalLoginForm, setPortalLoginForm] = useState<PortalLoginFormState>(initialPortalLoginForm);
  const [portalForgotForm, setPortalForgotForm] = useState<PortalForgotFormState>(() => ({
    ...initialPortalForgotForm,
    token: new URLSearchParams(window.location.search).get('reset') ?? ''
  }));
  const [portalCatalogs, setPortalCatalogs] = useState<PortalCatalogs>({ tiposIdentificacion: [], tiposContrato: [] });
  const [portalCliente, setPortalCliente] = useState<PortalCliente | null>(() => {
    const stored = localStorage.getItem('creditos.portal.cliente');
    return stored ? JSON.parse(stored) as PortalCliente : null;
  });
  const [portalMode, setPortalMode] = useState<'registro' | 'login' | 'forgot' | 'reset' | 'confirm'>(() =>
    new URLSearchParams(window.location.search).has('confirm')
      ? 'confirm'
      : new URLSearchParams(window.location.search).has('reset')
        ? 'reset'
        : 'registro'
  );
  const [portalProductos, setPortalProductos] = useState<PortalProductoCredito[]>([]);
  const [portalCreditos, setPortalCreditos] = useState<PortalCreditosResponse>({
    resumen: { activos: 0, solicitados: 0, aprobados: 0, rechazados: 0 },
    creditos: []
  });
  const [portalCreditoForm, setPortalCreditoForm] = useState<PortalCreditoFormState>(initialPortalCreditoForm);
  const [portalSimulacion, setPortalSimulacion] = useState<SimulacionCredito | null>(null);
  const [portalDetalleVisible, setPortalDetalleVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const isPortalRoute = window.location.pathname.startsWith('/portal');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    localStorage.getItem('creditos.theme.mode') === 'dark' ? 'dark' : 'light'
  );
  const [paletteKey, setPaletteKey] = useState<PaletteKey>(() => {
    const stored = localStorage.getItem('creditos.theme.palette') as PaletteKey | null;
    return stored && stored in palettes ? stored : 'azul';
  });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [catalogModules, setCatalogModules] = useState<CatalogModule[]>([]);
  const [userModules, setUserModules] = useState<CatalogModule[]>([]);
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationTypeRow[]>([]);
  const [userForm, setUserForm] = useState<UserFormState>(initialUserForm);
  const [roleForm, setRoleForm] = useState<RoleFormState>(initialRoleForm);
  const [permissionForm, setPermissionForm] = useState<PermissionFormState>(initialPermissionForm);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(initialModuleForm);
  const [submoduleForm, setSubmoduleForm] = useState<SubmoduleFormState>(initialSubmoduleForm);
  const [empresaForm, setEmpresaForm] = useState<EmpresaFormState>(initialEmpresaForm);
  const [empleadoForm, setEmpleadoForm] = useState<EmpleadoFormState>(initialEmpleadoForm);
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([]);
  const [empleadosEmpresa, setEmpleadosEmpresa] = useState<EmpleadoEmpresaRow[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
  const [bulkEmployeesText, setBulkEmployeesText] = useState('');
  const [empresaTab, setEmpresaTab] = useState<EmpresaTab>('registro');
  const [addressCatalogs, setAddressCatalogs] = useState<AddressCatalogs>({ tiposVia: [], letras: [], ciudades: [] });
  const [employeeCatalogs, setEmployeeCatalogs] = useState<EmployeeCatalogs>({
    tiposContrato: [],
    bancos: [],
    tiposCuenta: [],
    estadosCivil: [],
    tiposVivienda: []
  });
  const [citySearch, setCitySearch] = useState('');
  const [cityComboOpen, setCityComboOpen] = useState(false);
  const [sociosTab, setSociosTab] = useState<SociosTab>('registro');
  const [socioForm, setSocioForm] = useState<SocioFormState>(initialSocioForm);
  const [inversionForm, setInversionForm] = useState<InversionFormState>(initialInversionForm);
  const [sociosCatalogs, setSociosCatalogs] = useState<SociosCatalogs>({ tasasInversion: [], bancos: [], tiposCuenta: [] });
  const [socios, setSocios] = useState<SocioRow[]>([]);
  const [inversionesSocio, setInversionesSocio] = useState<InversionRow[]>([]);
  const [selectedSocioId, setSelectedSocioId] = useState<number | null>(null);
  const [socioCitySearch, setSocioCitySearch] = useState('');
  const [socioCityComboOpen, setSocioCityComboOpen] = useState(false);
  const [aliadosTab, setAliadosTab] = useState<AliadosTab>('registro');
  const [aliadoForm, setAliadoForm] = useState<AliadoFormState>(initialAliadoForm);
  const [aliados, setAliados] = useState<AliadoRow[]>([]);
  const [aliadosCatalogs, setAliadosCatalogs] = useState<AliadosCatalogs>({ bancos: [], tiposCuenta: [], generos: [] });
  const [aliadoCitySearch, setAliadoCitySearch] = useState('');
  const [aliadoCityComboOpen, setAliadoCityComboOpen] = useState(false);
  const [aliadoRepCitySearch, setAliadoRepCitySearch] = useState('');
  const [aliadoRepCityComboOpen, setAliadoRepCityComboOpen] = useState(false);
  const [aliadoCamaraCitySearch, setAliadoCamaraCitySearch] = useState('');
  const [aliadoCamaraCityComboOpen, setAliadoCamaraCityComboOpen] = useState(false);
  const [comercialesTab, setComercialesTab] = useState<ComercialesTab>('libranzera');
  const [libranzeraForm, setLibranzeraForm] = useState<LibranzeraFormState>(initialLibranzeraForm);
  const [comercialForm, setComercialForm] = useState<ComercialFormState>(initialComercialForm);
  const [selectedComercialId, setSelectedComercialId] = useState<number | null>(null);
  const [comercialesCatalogs, setComercialesCatalogs] = useState<ComercialesCatalogs>({
    bancos: [],
    tiposCuenta: [],
    rolesVendedor: [],
    formulas: [],
    libranzeras: [],
    generos: []
  });
  const [libranzeras, setLibranzeras] = useState<LibranzeraRow[]>([]);
  const [comerciales, setComerciales] = useState<ComercialRow[]>([]);
  const [productosCreditoTab, setProductosCreditoTab] = useState<ProductosCreditoTab>('general');
  const [productoCreditoForm, setProductoCreditoForm] = useState<ProductoCreditoFormState>(initialProductoCreditoForm);
  const [productoAtributoForm, setProductoAtributoForm] = useState<ProductoAtributoFormState>(initialProductoAtributoForm);
  const [productoDocumentoForm, setProductoDocumentoForm] = useState<ProductoDocumentoFormState>(initialProductoDocumentoForm);
  const [productoEtapaForm, setProductoEtapaForm] = useState<ProductoEtapaFormState>(initialProductoEtapaForm);
  const [selectedProductoEtapaId, setSelectedProductoEtapaId] = useState<number | null>(null);
  const [creditoForm, setCreditoForm] = useState<CreditoFormState>(initialCreditoForm);
  const [productosCreditoCatalogs, setProductosCreditoCatalogs] = useState<ProductosCreditoCatalogs>({
    tiposCredito: [],
    tiposAtributo: [],
    tiposCalculo: [],
    documentos: [],
    etapas: [],
    libranzeras: []
  });
  const [productosCredito, setProductosCredito] = useState<ProductoCreditoRow[]>([]);
  const [selectedProductoCreditoId, setSelectedProductoCreditoId] = useState<number | null>(null);
  const [productoAtributos, setProductoAtributos] = useState<ProductoAtributoRow[]>([]);
  const [productoDocumentos, setProductoDocumentos] = useState<ProductoDocumentoRow[]>([]);
  const [productoEtapas, setProductoEtapas] = useState<ProductoEtapaRow[]>([]);
  const [creditosCatalogs, setCreditosCatalogs] = useState<CreditosCatalogs>({
    productos: [],
    libranzeras: [],
    empresas: [],
    empleados: [],
    comerciales: []
  });
  const [creditos, setCreditos] = useState<CreditoRow[]>([]);
  const [selectedCreditoId, setSelectedCreditoId] = useState<number | null>(null);
  const [creditoDocumentos, setCreditoDocumentos] = useState<CreditoDocumentoRow[]>([]);
  const [creditoEtapas, setCreditoEtapas] = useState<CreditoEtapaRow[]>([]);
  const [creditoExpediente, setCreditoExpediente] = useState<CreditoExpediente | null>(null);
  const [selectedCreditoEtapaId, setSelectedCreditoEtapaId] = useState<number | null>(null);
  const [creditoEtapaObservacion, setCreditoEtapaObservacion] = useState('');
  const [creditoDecisionForm, setCreditoDecisionForm] = useState({
    montoAprobado: '',
    plazoAprobado: '',
    tasaAprobada: '',
    cuotaAprobada: '',
    observacion: ''
  });
  const [creditoFirmas, setCreditoFirmas] = useState<FirmaCreditoRow[]>([]);
  const [creditoFirmaForm, setCreditoFirmaForm] = useState({
    idPlantilla: '',
    firmanteNombre: '',
    firmanteCorreo: '',
    firmanteTelefono: ''
  });
  const [creditoDesembolsoForm, setCreditoDesembolsoForm] = useState({
    valorDesembolso: '',
    fechaDesembolso: new Date().toISOString().slice(0, 10),
    fechaPrimeraCuota: '',
    diaCorte: '25',
    diaPagoOportuno: '30',
    periodicidad: 'MENSUAL',
    ajustarFinSemana: true,
    moraDespuesVencimiento: '0',
    observacionCalendario: '',
    idInversion: '',
    valorFondeo: '',
    bancoDestino: '',
    tipoCuenta: '',
    numeroCuenta: '',
    referenciaPago: '',
    observacion: ''
  });
  const [fondeoDisponible, setFondeoDisponible] = useState<FondeoDisponibleRow[]>([]);
  const [creditoFondeoForm, setCreditoFondeoForm] = useState({
    idInversion: '',
    valorAsignado: '',
    observacion: ''
  });
  const [creditoPagoForm, setCreditoPagoForm] = useState({
    fechaPago: new Date().toISOString().slice(0, 10),
    valorPago: '',
    medioPago: '',
    referenciaPago: '',
    observacion: ''
  });
  const [creditoSimulacion, setCreditoSimulacion] = useState<SimulacionCredito | null>(null);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplateRow[]>([]);
  const [documentVariablesList, setDocumentVariablesList] = useState<DocumentVariable[]>([]);
  const [selectedDocumentTemplate, setSelectedDocumentTemplate] = useState<DocumentTemplateDetail | null>(null);
  const [documentTemplateForm, setDocumentTemplateForm] = useState<DocumentTemplateFormState>(initialDocumentTemplateForm);
  const [documentCreditoId, setDocumentCreditoId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;

    fetch(API_URL + '/api/v1/status')
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo consultar el estado');
        return response.json() as Promise<{ database: string; status: string }>;
      })
      .then((data) => {
        if (mounted) setApiStatus(`API ${data.status} - PostgreSQL ${data.database}`);
      })
      .catch(() => {
        if (mounted) setApiStatus('API no disponible');
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    void reloadSecurityData();
  }, [session]);

  useEffect(() => {
    if (!session || view !== 'dashboard') return;
    void reloadDashboard();
  }, [session, view]);

  useEffect(() => {
    if (!isPortalRoute) return;
    void reloadPortalCatalogs();
  }, [isPortalRoute]);

  useEffect(() => {
    if (!isPortalRoute || !portalCliente) return;
    void reloadPortalProductos();
    void reloadPortalCreditos();
  }, [isPortalRoute, portalCliente]);

  useEffect(() => {
    if (!isPortalRoute) return;
    const confirmToken = new URLSearchParams(window.location.search).get('confirm');
    if (!confirmToken) return;
    void handlePortalConfirmEmail(confirmToken);
  }, [isPortalRoute]);

  const activeUser = useMemo(() => session?.user ?? null, [session]);
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const activePalette = palettes[paletteKey];
  const visibleUserModules = userModules.filter((module) => !module.nombre.toLowerCase().includes('colaborador'));
  const selectedModule =
    view.startsWith('modulo:') ? visibleUserModules.find((module) => `modulo:${module.id}` === view) : null;
  const isEmpresasModule = selectedModule?.nombre.toLowerCase().includes('empresa') || selectedModule?.nombre.toLowerCase().includes('pagadur');
  const selectedEmpresa = empresas.find((empresa) => empresa.id === selectedEmpresaId);
  const selectedSocio = socios.find((socio) => socio.id === selectedSocioId);
  const isSociosModule = selectedModule?.nombre.toLowerCase().includes('socio');
  const isAliadosModule = selectedModule?.nombre.toLowerCase().includes('aliado');
  const isComercialesModule =
    selectedModule?.nombre.toLowerCase().includes('comercial') ||
    selectedModule?.nombre.toLowerCase().includes('vendedor') ||
    selectedModule?.nombre.toLowerCase().includes('libranz');
  const isCarteraModule = selectedModule?.nombre.toLowerCase().includes('cartera');
  const isProductosCreditoModule = selectedModule?.nombre.toLowerCase().includes('credito') && !isComercialesModule && !isCarteraModule;
  const selectedProductoCredito = productosCredito.find((producto) => producto.id === selectedProductoCreditoId);
  const selectedProductoEtapa = productoEtapas.find((etapa) => etapa.id === selectedProductoEtapaId);
  const selectedCredito = creditos.find((credito) => credito.id === selectedCreditoId);
  const selectedCreditoEtapa =
    creditoExpediente?.etapas.find((etapa) => etapa.id === selectedCreditoEtapaId)
    ?? creditoExpediente?.etapas.find((etapa) => etapa.estadoEtapa === 'EN_PROCESO')
    ?? creditoExpediente?.etapas.find((etapa) => etapa.estadoEtapa === 'PENDIENTE')
    ?? null;
  const creditProgress = creditoExpediente?.etapas.length
    ? Math.round((creditoExpediente.etapas.filter((etapa) => etapa.estadoEtapa === 'APROBADA').length / creditoExpediente.etapas.length) * 100)
    : 0;
  const selectedPortalProducto = portalProductos.find((producto) => String(producto.id) === portalCreditoForm.idProductoCredito);
  const selectedCity = addressCatalogs.ciudades.find((item) => String(item.id) === empresaForm.direccion.idCiudad);
  const citySearchValue = citySearch || selectedCity?.nombre || '';
  const filteredCities = addressCatalogs.ciudades
    .filter((item) => item.nombre.toLowerCase().includes(citySearchValue.trim().toLowerCase()))
    .slice(0, 25);
  const selectedSocioCity = addressCatalogs.ciudades.find((item) => String(item.id) === socioForm.direccion.idCiudad);
  const socioCitySearchValue = socioCitySearch || selectedSocioCity?.nombre || '';
  const filteredSocioCities = addressCatalogs.ciudades
    .filter((item) => item.nombre.toLowerCase().includes(socioCitySearchValue.trim().toLowerCase()))
    .slice(0, 25);
  const selectedAliadoCity = addressCatalogs.ciudades.find((item) => String(item.id) === aliadoForm.direccion.idCiudad);
  const aliadoCitySearchValue = aliadoCitySearch || selectedAliadoCity?.nombre || '';
  const filteredAliadoCities = addressCatalogs.ciudades
    .filter((item) => item.nombre.toLowerCase().includes(aliadoCitySearchValue.trim().toLowerCase()))
    .slice(0, 25);
  const selectedAliadoRepCity = addressCatalogs.ciudades.find((item) => String(item.id) === aliadoForm.representante.idCiudad);
  const aliadoRepCitySearchValue = aliadoRepCitySearch || selectedAliadoRepCity?.nombre || '';
  const filteredAliadoRepCities = addressCatalogs.ciudades
    .filter((item) => item.nombre.toLowerCase().includes(aliadoRepCitySearchValue.trim().toLowerCase()))
    .slice(0, 25);
  const selectedAliadoCamaraCity = addressCatalogs.ciudades.find((item) => String(item.id) === aliadoForm.camara.idCiudad);
  const aliadoCamaraCitySearchValue = aliadoCamaraCitySearch || selectedAliadoCamaraCity?.nombre || '';
  const filteredAliadoCamaraCities = addressCatalogs.ciudades
    .filter((item) => item.nombre.toLowerCase().includes(aliadoCamaraCitySearchValue.trim().toLowerCase()))
    .slice(0, 25);
  const comercialDireccionCompuesta = (() => {
    const tipoVia = addressCatalogs.tiposVia.find((item) => String(item.id) === comercialForm.direccion.idTipoVia)?.nombre;
    const letraPrincipal = addressCatalogs.letras.find((item) => String(item.id) === comercialForm.direccion.idLetraPrincipal)?.nombre;
    const letraBis = addressCatalogs.letras.find((item) => String(item.id) === comercialForm.direccion.letraBis)?.nombre;
    const letraSecundaria = addressCatalogs.letras.find((item) => String(item.id) === comercialForm.direccion.idLetraSecundaria)?.nombre;
    const ciudad = addressCatalogs.ciudades.find((item) => String(item.id) === comercialForm.direccion.idCiudad)?.nombre;
    return [
      tipoVia,
      comercialForm.direccion.numPrincipal,
      letraPrincipal,
      comercialForm.direccion.bis,
      letraBis,
      comercialForm.direccion.cuadrantePrincipal,
      comercialForm.direccion.numSecundario ? `# ${comercialForm.direccion.numSecundario}` : '',
      letraSecundaria,
      comercialForm.direccion.cuadranteSecundario,
      comercialForm.direccion.complemento,
      comercialForm.direccion.barrio,
      ciudad
    ].filter(Boolean).join(' ');
  })();
  const pageTitle =
    view === 'dashboard'
      ? 'Dashboard'
      : view === 'usuarios'
        ? 'Registro de usuarios'
        : view === 'configuracion'
          ? 'Configuracion'
          : selectedModule?.nombre ?? 'Modulo';
  const pageKicker =
    view === 'dashboard'
      ? 'Vista general'
      : view === 'usuarios'
        ? 'Seguridad'
        : view === 'configuracion'
          ? 'Parametros del sistema'
          : 'Modulo operativo';

  const overview = [
    { label: 'Usuarios', value: users.length },
    { label: 'Roles', value: roles.length },
    { label: 'Permisos', value: permissions.length },
    { label: 'Mis modulos', value: visibleUserModules.length }
  ];
  const responsableOptions = roles.length
    ? roles
    : [
        { id: 0, nombre: 'Administrador', descripcion: '' },
        { id: -1, nombre: 'Analista', descripcion: '' },
        { id: -2, nombre: 'Comercial', descripcion: '' },
        { id: -3, nombre: 'Operaciones', descripcion: '' }
      ];

  useEffect(() => {
    if (!session || !isEmpresasModule) return;
    void reloadEmpresasData();
  }, [session, isEmpresasModule]);

  useEffect(() => {
    if (!view.startsWith('modulo:')) return;
    const exists = visibleUserModules.some((module) => `modulo:${module.id}` === view);
    if (!exists) setView('dashboard');
  }, [view, visibleUserModules]);

  useEffect(() => {
    if (!session || !isSociosModule) return;
    void reloadSociosData();
  }, [session, isSociosModule]);

  useEffect(() => {
    if (!session || !isAliadosModule) return;
    void reloadAliadosData();
  }, [session, isAliadosModule]);

  useEffect(() => {
    if (!session || !isComercialesModule) return;
    void reloadComercialesData();
  }, [session, isComercialesModule]);

  useEffect(() => {
    if (!session || !isProductosCreditoModule) return;
    void reloadProductosCreditoData();
  }, [session, isProductosCreditoModule]);

  useEffect(() => {
    if (!session || !isCarteraModule) return;
    void reloadCarteraReporte();
  }, [session, isCarteraModule]);

  useEffect(() => {
    if (!session || !selectedProductoCreditoId) {
      setProductoAtributos([]);
      setProductoDocumentos([]);
      setProductoEtapas([]);
      setSelectedProductoEtapaId(null);
      setProductoEtapaForm(initialProductoEtapaForm);
      return;
    }
    setSelectedProductoEtapaId(null);
    setProductoEtapaForm(initialProductoEtapaForm);
    void reloadProductoCreditoDetalle(selectedProductoCreditoId);
  }, [session, selectedProductoCreditoId]);

  useEffect(() => {
    if (!session || !selectedCreditoId) {
      setCreditoDocumentos([]);
      setCreditoEtapas([]);
      setCreditoExpediente(null);
      setCreditoFirmas([]);
      setSelectedCreditoEtapaId(null);
      setCreditoEtapaObservacion('');
      return;
    }
    void reloadCreditoDetalle(selectedCreditoId);
  }, [session, selectedCreditoId]);

  useEffect(() => {
    if (!session || !selectedEmpresaId) {
      setEmpleadosEmpresa([]);
      return;
    }

    void reloadEmpleadosEmpresa(selectedEmpresaId);
  }, [session, selectedEmpresaId]);

  useEffect(() => {
    if (!session || !selectedSocioId) {
      setInversionesSocio([]);
      return;
    }

    void reloadInversionesSocio(selectedSocioId);
  }, [session, selectedSocioId]);

  useEffect(() => {
    if (!session || productosCreditoTab !== 'documentos') return;
    void reloadDocumentManagement();
  }, [session, productosCreditoTab]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeMode;
    root.style.setProperty('--color-primary', activePalette.primary);
    root.style.setProperty('--color-primary-dark', activePalette.primaryDark);
    root.style.setProperty('--color-accent', activePalette.accent);
    localStorage.setItem('creditos.theme.mode', themeMode);
    localStorage.setItem('creditos.theme.palette', paletteKey);
  }, [activePalette, paletteKey, themeMode]);

  const reloadSecurityData = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const [
        usersResponse,
        rolesResponse,
        permissionsResponse,
        modulesResponse,
        myModulesResponse,
        identificationTypesResponse
      ] = await Promise.all([
        api.listUsers(session.token),
        api.listRoles(session.token),
        api.listPermissions(session.token),
        api.listCatalogModules(session.token),
        api.listMyModules(session.token),
        api.listIdentificationTypes(session.token)
      ]);

      setUsers(usersResponse);
      setRoles(rolesResponse);
      setPermissions(permissionsResponse);
      setCatalogModules(modulesResponse);
      setUserModules(myModulesResponse);
      setIdentificationTypes(identificationTypesResponse);
      setUserForm((current) => ({
        ...current,
        idTipoIdentificacion: current.idTipoIdentificacion || String(identificationTypesResponse[0]?.id ?? '')
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const reloadDashboard = async () => {
    if (!session) return;
    try {
      setDashboard(await api.getDashboardGerencial(
        session.token,
        dashboardFilters.fechaInicio,
        dashboardFilters.fechaFin
      ));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el dashboard gerencial');
    }
  };

  const reloadCarteraReporte = async () => {
    if (!session) return;
    setLoading(true);
    setMessage('');
    try {
      setCarteraReporte(await api.getReporteCartera(session.token, carteraFilters));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el reporte de cartera');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCarteraCsv = () => {
    if (!carteraReporte) return;
    const lines: string[] = [];
    lines.push(['REPORTE DE CARTERA'].map(csvCell).join(';'));
    lines.push(['Generado', new Date().toLocaleString('es-CO')].map(csvCell).join(';'));
    lines.push('');
    lines.push(['Resumen'].map(csvCell).join(';'));
    lines.push(['Saldo total', carteraReporte.resumen.saldoTotal].map(csvCell).join(';'));
    lines.push(['Saldo vencido', carteraReporte.resumen.saldoVencido].map(csvCell).join(';'));
    lines.push(['Proximos 15 dias', carteraReporte.resumen.saldoProximo].map(csvCell).join(';'));
    lines.push(['Cuotas pendientes', carteraReporte.resumen.cuotasPendientes].map(csvCell).join(';'));
    lines.push(['Saldo a favor', carteraReporte.resumen.saldoFavor].map(csvCell).join(';'));
    lines.push('');
    lines.push(['Cuotas'].map(csvCell).join(';'));
    lines.push(['Credito', 'Cliente', 'Empresa', 'Producto', 'Cuota', 'Vencimiento', 'Estado', 'Dias mora', 'Valor cuota', 'Mora', 'Pagado', 'Saldo'].map(csvCell).join(';'));
    carteraReporte.cuotas.forEach((item) => {
      lines.push([
        item.credito,
        item.cliente,
        item.empresa,
        item.producto,
        item.numeroCuota,
        item.fechaVencimiento,
        item.estado,
        item.diasMora,
        item.valorCuota,
        item.valorMora,
        item.valorPagado,
        item.saldo
      ].map(csvCell).join(';'));
    });
    lines.push('');
    lines.push(['Recaudos'].map(csvCell).join(';'));
    lines.push(['Fecha', 'Credito', 'Cliente', 'Valor pago', 'Saldo favor', 'Medio'].map(csvCell).join(';'));
    carteraReporte.recaudos.forEach((item) => {
      lines.push([item.fechaPago, item.credito, item.cliente, item.valorPago, item.saldoFavor, item.medioPago ?? ''].map(csvCell).join(';'));
    });
    downloadTextFile(`reporte-cartera-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${lines.join('\n')}`, 'text/csv;charset=utf-8');
  };

  const handleExportCarteraPdf = () => {
    if (!carteraReporte) return;
    const rows = carteraReporte.cuotas.slice(0, 80).map((item) => `
      <tr>
        <td>${escapeHtml(item.credito)}</td>
        <td>${escapeHtml(item.cliente)}</td>
        <td>${escapeHtml(item.empresa)}</td>
        <td>${escapeHtml(item.producto)}</td>
        <td>${escapeHtml(item.numeroCuota)}</td>
        <td>${escapeHtml(item.fechaVencimiento)}</td>
        <td>${escapeHtml(item.estado)}</td>
        <td>${escapeHtml(item.diasMora)}</td>
        <td>${escapeHtml(formatMoney(item.saldo))}</td>
      </tr>
    `).join('');
    const cuts = (title: string, items: Array<{ nombre: string; cantidad: number; saldo: number; vencido?: number }>) => `
      <section>
        <h2>${escapeHtml(title)}</h2>
        <table>
          <thead><tr><th>Nombre</th><th>Creditos</th><th>Saldo</th><th>Vencido</th></tr></thead>
          <tbody>${items.slice(0, 12).map((item) => `<tr><td>${escapeHtml(item.nombre)}</td><td>${item.cantidad}</td><td>${escapeHtml(formatMoney(item.saldo))}</td><td>${typeof item.vencido === 'number' ? escapeHtml(formatMoney(item.vencido)) : '-'}</td></tr>`).join('')}</tbody>
        </table>
      </section>
    `;
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Reporte de cartera</title>
          <style>
            body { font-family: Arial, sans-serif; color: #172033; margin: 32px; }
            h1 { margin: 0 0 4px; color: #0f4c81; }
            h2 { margin: 24px 0 8px; color: #0f4c81; font-size: 16px; }
            .meta { color: #5f6b7a; margin-bottom: 20px; }
            .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 18px 0; }
            .kpis div { border: 1px solid #d9e2ec; padding: 10px; border-radius: 6px; }
            .kpis span { display: block; color: #5f6b7a; font-size: 11px; }
            .kpis strong { display: block; margin-top: 5px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #d9e2ec; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #eef4f8; }
            @media print { body { margin: 18mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Reporte de cartera</h1>
          <div class="meta">Generado: ${escapeHtml(new Date().toLocaleString('es-CO'))}</div>
          <div class="kpis">
            <div><span>Saldo total</span><strong>${escapeHtml(formatMoney(carteraReporte.resumen.saldoTotal))}</strong></div>
            <div><span>Vencido</span><strong>${escapeHtml(formatMoney(carteraReporte.resumen.saldoVencido))}</strong></div>
            <div><span>Proximos 15 dias</span><strong>${escapeHtml(formatMoney(carteraReporte.resumen.saldoProximo))}</strong></div>
            <div><span>Cuotas pendientes</span><strong>${carteraReporte.resumen.cuotasPendientes}</strong></div>
            <div><span>Saldo a favor</span><strong>${escapeHtml(formatMoney(carteraReporte.resumen.saldoFavor))}</strong></div>
          </div>
          <h2>Cuotas de cartera</h2>
          <table>
            <thead><tr><th>Credito</th><th>Cliente</th><th>Empresa</th><th>Producto</th><th>Cuota</th><th>Vencimiento</th><th>Estado</th><th>Dias mora</th><th>Saldo</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="9">Sin registros</td></tr>'}</tbody>
          </table>
          ${cuts('Cartera por empresa', carteraReporte.porEmpresa)}
          ${cuts('Cartera por producto', carteraReporte.porProducto)}
          ${cuts('Cartera por socio fondeador', carteraReporte.porSocio)}
          <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
        </body>
      </html>
    `;
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!reportWindow) {
      setMessage('El navegador bloqueo la ventana del reporte PDF');
      return;
    }
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const reloadPortalCatalogs = async () => {
    try {
      const catalogs = await api.listPortalCatalogs();
      setPortalCatalogs(catalogs);
      setPortalRegisterForm((current) => ({
        ...current,
        idTipoIdentificacion: current.idTipoIdentificacion || String(catalogs.tiposIdentificacion[0]?.id ?? ''),
        idTipoContrato: current.idTipoContrato || String(catalogs.tiposContrato[0]?.id ?? '')
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los catalogos del portal');
    }
  };

  const reloadPortalProductos = async () => {
    const token = localStorage.getItem('creditos.portal.token');
    if (!token) return;
    try {
      const productos = await api.listPortalProductos(token);
      setPortalProductos(productos);
      setPortalCreditoForm((current) => ({
        ...current,
        idProductoCredito: current.idProductoCredito || String(productos[0]?.id ?? '')
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los productos del portal');
    }
  };

  const reloadPortalCreditos = async () => {
    const token = localStorage.getItem('creditos.portal.token');
    if (!token) return;
    try {
      setPortalCreditos(await api.listPortalCreditos(token));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar tus creditos');
    }
  };

  const reloadEmpresasData = async () => {
    if (!session) return;

    try {
      const [catalogs, employeeCatalogResponse] = await Promise.all([
        api.listAddressCatalogs(session.token),
        api.listEmployeeCatalogs(session.token)
      ]);
      setAddressCatalogs(catalogs);
      setEmployeeCatalogs(employeeCatalogResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los catalogos');
    }

    try {
      const response = await api.listEmpresas(session.token);
      setEmpresas(response);
      setSelectedEmpresaId((current) => current ?? response[0]?.id ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar las empresas');
    }
  };

  const reloadSociosData = async () => {
    if (!session) return;

    try {
      const [catalogs, sociosCatalogsResponse, sociosResponse] = await Promise.all([
        api.listAddressCatalogs(session.token),
        api.listSociosCatalogs(session.token),
        api.listSocios(session.token)
      ]);
      setAddressCatalogs(catalogs);
      setSociosCatalogs(sociosCatalogsResponse);
      setSocios(sociosResponse);
      setSelectedSocioId((current) => current ?? sociosResponse[0]?.id ?? null);
      setSocioForm((current) => ({
        ...current,
        idTipoIdentificacion: current.idTipoIdentificacion || String(identificationTypes[0]?.id ?? ''),
        idTipoCuenta: current.idTipoCuenta || String(sociosCatalogsResponse.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? sociosCatalogsResponse.tiposCuenta[0]?.id ?? '')
      }));
      setInversionForm((current) => ({
        ...current,
        idTasaInversion: current.idTasaInversion || String(sociosCatalogsResponse.tasasInversion[0]?.id ?? '')
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los socios');
    }
  };

  const reloadAliadosData = async () => {
    if (!session) return;

    try {
      const [catalogs, aliadosCatalogsResponse] = await Promise.all([
        api.listAddressCatalogs(session.token),
        api.listAliadosCatalogs(session.token)
      ]);
      setAddressCatalogs(catalogs);
      setAliadosCatalogs(aliadosCatalogsResponse);
      setAliadoForm((current) => ({
        ...current,
        idTipoIdentificacion: current.idTipoIdentificacion || String(identificationTypes[0]?.id ?? ''),
        idBanco: current.idBanco || String(aliadosCatalogsResponse.bancos[0]?.id ?? ''),
        idTipoCuenta: current.idTipoCuenta || String(aliadosCatalogsResponse.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? aliadosCatalogsResponse.tiposCuenta[0]?.id ?? ''),
        representante: {
          ...current.representante,
          idTipoIdentificacion: current.representante.idTipoIdentificacion || String(identificationTypes[0]?.id ?? '')
        }
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los catalogos de aliados');
    }

    try {
      const aliadosResponse = await api.listAliados(session.token);
      setAliados(aliadosResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los aliados');
    }
  };

  const reloadComercialesData = async () => {
    if (!session) return;

    try {
      const [addressResponse, catalogsResponse] = await Promise.all([
        api.listAddressCatalogs(session.token),
        api.listComercialesCatalogs(session.token)
      ]);
      setAddressCatalogs(addressResponse);
      setComercialesCatalogs(catalogsResponse);
      setLibranzeraForm((current) => ({
        ...current,
        idBanco: current.idBanco || String(catalogsResponse.bancos[0]?.id ?? ''),
        idTipoCuenta: current.idTipoCuenta || String(catalogsResponse.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? catalogsResponse.tiposCuenta[0]?.id ?? ''),
        representanteLegal: {
          ...current.representanteLegal,
          idTipoIdentificacion: current.representanteLegal.idTipoIdentificacion || String(identificationTypes[0]?.id ?? '')
        },
        representanteCartera: {
          ...current.representanteCartera,
          idTipoIdentificacion: current.representanteCartera.idTipoIdentificacion || String(identificationTypes[0]?.id ?? '')
        }
      }));
      setComercialForm((current) => ({
        ...current,
        idLibranzera: current.idLibranzera || String(catalogsResponse.libranzeras[0]?.id ?? ''),
        idTipoIdentificacion: current.idTipoIdentificacion || String(identificationTypes[0]?.id ?? ''),
        idRolVendedor: current.idRolVendedor || String(catalogsResponse.rolesVendedor[0]?.id ?? ''),
        idFormulaComercial: current.idFormulaComercial || String(catalogsResponse.formulas[0]?.id ?? ''),
        idBanco: current.idBanco || String(catalogsResponse.bancos[0]?.id ?? ''),
        idTipoCuenta: current.idTipoCuenta || String(catalogsResponse.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? catalogsResponse.tiposCuenta[0]?.id ?? '')
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los catalogos comerciales');
    }

    try {
      const [libranzerasResponse, comercialesResponse] = await Promise.all([
        api.listLibranzeras(session.token),
        api.listComerciales(session.token)
      ]);
      setLibranzeras(libranzerasResponse);
      setComerciales(comercialesResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los comerciales');
    }
  };

  const reloadProductosCreditoData = async () => {
    if (!session) return;

    try {
      const [
        catalogsResponse,
        productosResponse,
        creditosCatalogsResponse,
        creditosResponse,
        employeeCatalogsResponse
      ] = await Promise.all([
        api.listProductosCreditoCatalogs(session.token),
        api.listProductosCredito(session.token),
        api.listCreditosCatalogs(session.token),
        api.listCreditos(session.token),
        api.listEmployeeCatalogs(session.token)
      ]);
      setProductosCreditoCatalogs(catalogsResponse);
      setProductosCredito(productosResponse);
      setCreditosCatalogs(creditosCatalogsResponse);
      setCreditos(creditosResponse);
      setEmployeeCatalogs(employeeCatalogsResponse);
      setSelectedProductoCreditoId((current) => current ?? productosResponse[0]?.id ?? null);
      setSelectedCreditoId((current) => current ?? creditosResponse[0]?.id ?? null);
      setProductoCreditoForm((current) => ({
        ...current,
        idTipoCredito: current.idTipoCredito || String(catalogsResponse.tiposCredito[0]?.id ?? ''),
        idLibranzera: current.idLibranzera || String(catalogsResponse.libranzeras[0]?.id ?? '')
      }));
      setCreditoForm((current) => ({
        ...current,
        idProductoCredito: current.idProductoCredito || String(creditosCatalogsResponse.productos[0]?.id ?? ''),
        idLibranzera: current.idLibranzera || String(creditosCatalogsResponse.libranzeras[0]?.id ?? ''),
        idEmpresa: current.idEmpresa || String(creditosCatalogsResponse.empresas[0]?.id ?? ''),
        idComercial: current.idComercial || String(creditosCatalogsResponse.comerciales[0]?.id ?? '')
      }));
      setProductoAtributoForm((current) => ({
        ...current,
        idTipoAtributo: current.idTipoAtributo || String(catalogsResponse.tiposAtributo[0]?.id ?? ''),
        idTipoCalculo: current.idTipoCalculo || String(catalogsResponse.tiposCalculo[0]?.id ?? '')
      }));
      setProductoDocumentoForm((current) => ({
        ...current,
        idDocumentoCredito: current.idDocumentoCredito || String(catalogsResponse.documentos[0]?.id ?? '')
      }));
      setProductoEtapaForm((current) => ({
        ...current,
        idEtapaCredito: current.idEtapaCredito || String(catalogsResponse.etapas[0]?.id ?? '')
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los productos de credito');
    }
  };

  const reloadDocumentManagement = async () => {
    if (!session) return;
    try {
      const [templates, variables] = await Promise.all([
        api.listDocumentTemplates(session.token),
        api.listDocumentVariables(session.token)
      ]);
      setDocumentTemplates(templates);
      setDocumentVariablesList(variables);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar la gestion documental');
    }
  };

  const reloadCreditoDetalle = async (creditoId: number) => {
    if (!session) return;

    try {
      const [expediente, firmasResponse, templatesResponse, fondeoResponse] = await Promise.all([
        api.getCreditoExpediente(session.token, creditoId),
        api.listFirmasCredito(session.token, creditoId),
        api.listDocumentTemplates(session.token),
        api.listOpcionesFondeo(session.token)
      ]);
      setCreditoExpediente(expediente);
      setCreditoDocumentos(expediente.documentos);
      setCreditoEtapas(expediente.etapas);
      setCreditoFirmas(firmasResponse);
      setDocumentTemplates(templatesResponse);
      setFondeoDisponible(fondeoResponse);
      setSelectedCreditoEtapaId((current) =>
        current && expediente.etapas.some((etapa) => etapa.id === current)
          ? current
          : expediente.etapas.find((etapa) => etapa.estadoEtapa === 'EN_PROCESO')?.id
            ?? expediente.etapas.find((etapa) => etapa.estadoEtapa === 'PENDIENTE')?.id
            ?? expediente.etapas[0]?.id
            ?? null
      );
      setCreditoDecisionForm((current) => ({
        montoAprobado: current.montoAprobado || String(expediente.credito.montoSolicitado || ''),
        plazoAprobado: current.plazoAprobado || String(expediente.credito.plazo || ''),
        tasaAprobada: current.tasaAprobada || String(expediente.credito.tasa ?? ''),
        cuotaAprobada: current.cuotaAprobada || String(expediente.credito.cuotaEstimada ?? ''),
        observacion: current.observacion
      }));
      setCreditoFirmaForm((current) => ({
        idPlantilla: current.idPlantilla || String(templatesResponse[0]?.id ?? ''),
        firmanteNombre: current.firmanteNombre || expediente.credito.nombreCliente,
        firmanteCorreo: current.firmanteCorreo || expediente.credito.correoCliente || '',
        firmanteTelefono: current.firmanteTelefono || expediente.credito.telefonoCliente || ''
      }));
      setCreditoDesembolsoForm((current) => ({
        ...current,
        valorDesembolso: current.valorDesembolso || String(expediente.decisiones[0]?.montoAprobado ?? expediente.credito.montoSolicitado ?? ''),
        fechaPrimeraCuota: current.fechaPrimeraCuota || nextMonthDate(current.fechaDesembolso),
        periodicidad: expediente.sugerenciaCalendario?.periodicidad || current.periodicidad || 'MENSUAL',
        diaCorte: String(expediente.sugerenciaCalendario?.diaCorte ?? current.diaCorte ?? 25),
        diaPagoOportuno: String(expediente.sugerenciaCalendario?.diaPagoOportuno ?? current.diaPagoOportuno ?? 30),
        ajustarFinSemana: expediente.sugerenciaCalendario?.ajustarFinSemana ?? current.ajustarFinSemana,
        moraDespuesVencimiento: String(expediente.sugerenciaCalendario?.moraDespuesVencimiento ?? current.moraDespuesVencimiento ?? 0),
        observacionCalendario: expediente.sugerenciaCalendario?.observacionCalendario || current.observacionCalendario || '',
        bancoDestino: current.bancoDestino || expediente.perfilCliente?.empleado.banco || '',
        tipoCuenta: current.tipoCuenta || expediente.perfilCliente?.empleado.tipoCuenta || '',
        numeroCuenta: current.numeroCuenta || expediente.perfilCliente?.empleado.cuentaNomina || ''
      }));
      setCreditoFondeoForm((current) => ({
        ...current,
        idInversion: current.idInversion || String(fondeoResponse[0]?.idInversion ?? ''),
        valorAsignado: current.valorAsignado || String(expediente.decisiones[0]?.montoAprobado ?? expediente.credito.montoSolicitado ?? '')
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el detalle del credito');
    }
  };

  const reloadProductoCreditoDetalle = async (productoId: number) => {
    if (!session) return;

    try {
      const [atributosResponse, documentosResponse, etapasResponse] = await Promise.all([
        api.listProductoAtributos(session.token, productoId),
        api.listProductoDocumentos(session.token, productoId),
        api.listProductoEtapas(session.token, productoId)
      ]);
      setProductoAtributos(atributosResponse);
      setProductoDocumentos(documentosResponse);
      setProductoEtapas(etapasResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el detalle del producto');
    }
  };

  const reloadInversionesSocio = async (socioId: number) => {
    if (!session) return;

    try {
      const response = await api.listInversionesSocio(session.token, socioId);
      setInversionesSocio(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar las inversiones');
    }
  };

  const reloadEmpleadosEmpresa = async (empresaId: number) => {
    if (!session) return;

    try {
      const response = await api.listEmpleadosEmpresa(session.token, empresaId);
      setEmpleadosEmpresa(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los empleados');
    }
  };

  const parseBulkEmployees = (value: string) => {
    const [headerLine, ...rows] = value.trim().split(/\r?\n/).filter(Boolean);
    if (!headerLine) return [];

    const headers = headerLine.split(',').map((header) => header.trim());
    return rows.map((row) => {
      const values = row.split(',').map((item) => item.trim());
      const item = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));

      return {
        idTipoIdentificacion: item.idTipoIdentificacion ? Number(item.idTipoIdentificacion) : null,
        identificacion: item.identificacion,
        primerNombre: item.primerNombre,
        segundoNombre: item.segundoNombre || null,
        primerApellido: item.primerApellido || null,
        segundoApellido: item.segundoApellido || null,
        correo: item.correo || null,
        telefono: item.telefono || null,
        cargo: item.cargo || null,
        idTipoContrato: item.idTipoContrato ? Number(item.idTipoContrato) : null,
        salario: item.salario ? Number(item.salario) : null,
        idBanco: item.idBanco ? Number(item.idBanco) : null,
        idTipoCuenta: item.idTipoCuenta ? Number(item.idTipoCuenta) : null,
        cuentaNomina: item.cuentaNomina || null,
        tieneEmbargos: ['true', '1', 'si', 'sí', 's'].includes((item.tieneEmbargos || '').toLowerCase()),
        idEstadoCivil: item.idEstadoCivil ? Number(item.idEstadoCivil) : null,
        personasCargo: item.personasCargo ? Number(item.personasCargo) : 0,
        idTipoVivienda: item.idTipoVivienda ? Number(item.idTipoVivienda) : null,
        fechaIngreso: item.fechaIngreso || null
      };
    });
  };

  const selectedAddressText = (() => {
    const tipoVia = addressCatalogs.tiposVia.find((item) => String(item.id) === empresaForm.direccion.idTipoVia)?.nombre;
    const letraPrincipal = addressCatalogs.letras.find((item) => String(item.id) === empresaForm.direccion.idLetraPrincipal)?.nombre;
    const letraBis = addressCatalogs.letras.find((item) => String(item.id) === empresaForm.direccion.letraBis)?.nombre;
    const letraSecundaria = addressCatalogs.letras.find((item) => String(item.id) === empresaForm.direccion.idLetraSecundaria)?.nombre;
    const ciudad = addressCatalogs.ciudades.find((item) => String(item.id) === empresaForm.direccion.idCiudad)?.nombre;

    return [
      tipoVia,
      empresaForm.direccion.numPrincipal,
      letraPrincipal,
      empresaForm.direccion.bis,
      letraBis,
      empresaForm.direccion.cuadrantePrincipal,
      empresaForm.direccion.numSecundario ? `# ${empresaForm.direccion.numSecundario}` : '',
      letraSecundaria,
      empresaForm.direccion.cuadranteSecundario,
      empresaForm.direccion.complemento,
      empresaForm.direccion.barrio,
      ciudad
    ].filter(Boolean).join(' ');
  })();

  const buildDireccionPayload = () => {
    if (!empresaForm.direccion.idTipoVia || !empresaForm.direccion.idCiudad) return null;

    return {
      idTipoVia: Number(empresaForm.direccion.idTipoVia),
      numPrincipal: empresaForm.direccion.numPrincipal ? Number(empresaForm.direccion.numPrincipal) : null,
      idLetraPrincipal: empresaForm.direccion.idLetraPrincipal ? Number(empresaForm.direccion.idLetraPrincipal) : null,
      bis: empresaForm.direccion.bis || null,
      letraBis: empresaForm.direccion.letraBis ? Number(empresaForm.direccion.letraBis) : null,
      cuadrantePrincipal: empresaForm.direccion.cuadrantePrincipal || null,
      numSecundario: empresaForm.direccion.numSecundario ? Number(empresaForm.direccion.numSecundario) : null,
      idLetraSecundaria: empresaForm.direccion.idLetraSecundaria ? Number(empresaForm.direccion.idLetraSecundaria) : null,
      cuadranteSecundario: empresaForm.direccion.cuadranteSecundario || null,
      complemento: empresaForm.direccion.complemento || null,
      barrio: empresaForm.direccion.barrio || null,
      idCiudad: Number(empresaForm.direccion.idCiudad),
      esPrincipal: true
    };
  };

  const selectedSocioAddressText = (() => {
    const tipoVia = addressCatalogs.tiposVia.find((item) => String(item.id) === socioForm.direccion.idTipoVia)?.nombre;
    const letraPrincipal = addressCatalogs.letras.find((item) => String(item.id) === socioForm.direccion.idLetraPrincipal)?.nombre;
    const letraBis = addressCatalogs.letras.find((item) => String(item.id) === socioForm.direccion.letraBis)?.nombre;
    const letraSecundaria = addressCatalogs.letras.find((item) => String(item.id) === socioForm.direccion.idLetraSecundaria)?.nombre;
    const ciudad = addressCatalogs.ciudades.find((item) => String(item.id) === socioForm.direccion.idCiudad)?.nombre;

    return [
      tipoVia,
      socioForm.direccion.numPrincipal,
      letraPrincipal,
      socioForm.direccion.bis,
      letraBis,
      socioForm.direccion.cuadrantePrincipal,
      socioForm.direccion.numSecundario ? `# ${socioForm.direccion.numSecundario}` : '',
      letraSecundaria,
      socioForm.direccion.cuadranteSecundario,
      socioForm.direccion.complemento,
      socioForm.direccion.barrio,
      ciudad
    ].filter(Boolean).join(' ');
  })();

  const buildSocioDireccionPayload = () => {
    const typedCity = socioCitySearch.trim().toLowerCase();
    const matchedCityId = typedCity
      ? addressCatalogs.ciudades.find((item) => item.nombre.trim().toLowerCase() === typedCity)?.id
      : null;
    const idCiudad = socioForm.direccion.idCiudad || (matchedCityId ? String(matchedCityId) : '');
    if (!socioForm.direccion.idTipoVia || !idCiudad) return null;

    return {
      idTipoVia: Number(socioForm.direccion.idTipoVia),
      numPrincipal: socioForm.direccion.numPrincipal ? Number(socioForm.direccion.numPrincipal) : null,
      idLetraPrincipal: socioForm.direccion.idLetraPrincipal ? Number(socioForm.direccion.idLetraPrincipal) : null,
      bis: socioForm.direccion.bis || null,
      letraBis: socioForm.direccion.letraBis ? Number(socioForm.direccion.letraBis) : null,
      cuadrantePrincipal: socioForm.direccion.cuadrantePrincipal || null,
      numSecundario: socioForm.direccion.numSecundario ? Number(socioForm.direccion.numSecundario) : null,
      idLetraSecundaria: socioForm.direccion.idLetraSecundaria ? Number(socioForm.direccion.idLetraSecundaria) : null,
      cuadranteSecundario: socioForm.direccion.cuadranteSecundario || null,
      complemento: socioForm.direccion.complemento || null,
      barrio: socioForm.direccion.barrio || null,
      idCiudad: Number(idCiudad),
      esPrincipal: true
    };
  };

  const selectedAliadoAddressText = (() => {
    const tipoVia = addressCatalogs.tiposVia.find((item) => String(item.id) === aliadoForm.direccion.idTipoVia)?.nombre;
    const letraPrincipal = addressCatalogs.letras.find((item) => String(item.id) === aliadoForm.direccion.idLetraPrincipal)?.nombre;
    const letraBis = addressCatalogs.letras.find((item) => String(item.id) === aliadoForm.direccion.letraBis)?.nombre;
    const letraSecundaria = addressCatalogs.letras.find((item) => String(item.id) === aliadoForm.direccion.idLetraSecundaria)?.nombre;
    const ciudad = addressCatalogs.ciudades.find((item) => String(item.id) === aliadoForm.direccion.idCiudad)?.nombre;

    return [
      tipoVia,
      aliadoForm.direccion.numPrincipal,
      letraPrincipal,
      aliadoForm.direccion.bis,
      letraBis,
      aliadoForm.direccion.cuadrantePrincipal,
      aliadoForm.direccion.numSecundario ? `# ${aliadoForm.direccion.numSecundario}` : '',
      letraSecundaria,
      aliadoForm.direccion.cuadranteSecundario,
      aliadoForm.direccion.complemento,
      aliadoForm.direccion.barrio,
      ciudad
    ].filter(Boolean).join(' ');
  })();

  const buildAliadoDireccionPayload = () => {
    if (!aliadoForm.direccion.idTipoVia || !aliadoForm.direccion.idCiudad) return null;

    return {
      idTipoVia: Number(aliadoForm.direccion.idTipoVia),
      numPrincipal: aliadoForm.direccion.numPrincipal ? Number(aliadoForm.direccion.numPrincipal) : null,
      idLetraPrincipal: aliadoForm.direccion.idLetraPrincipal ? Number(aliadoForm.direccion.idLetraPrincipal) : null,
      bis: aliadoForm.direccion.bis || null,
      letraBis: aliadoForm.direccion.letraBis ? Number(aliadoForm.direccion.letraBis) : null,
      cuadrantePrincipal: aliadoForm.direccion.cuadrantePrincipal || null,
      numSecundario: aliadoForm.direccion.numSecundario ? Number(aliadoForm.direccion.numSecundario) : null,
      idLetraSecundaria: aliadoForm.direccion.idLetraSecundaria ? Number(aliadoForm.direccion.idLetraSecundaria) : null,
      cuadranteSecundario: aliadoForm.direccion.cuadranteSecundario || null,
      complemento: aliadoForm.direccion.complemento || null,
      barrio: aliadoForm.direccion.barrio || null,
      idCiudad: Number(aliadoForm.direccion.idCiudad),
      esPrincipal: true
    };
  };

  const splitAddressNumber = (value: string) => {
    const match = value.trim().match(/^(\d+)\s*([a-zA-Z])?$/);
    if (!match) {
      return { number: value.replace(/\D/g, ''), letterId: '' };
    }

    const letter = match[2]?.toUpperCase();
    const letterId = letter
      ? String(addressCatalogs.letras.find((item) => item.nombre.toUpperCase() === letter)?.id ?? '')
      : '';

    return { number: match[1], letterId };
  };

  const updatePrincipalNumber = (value: string) => {
    const parsed = splitAddressNumber(value);
    setEmpresaForm((current) => ({
      ...current,
      direccion: {
        ...current.direccion,
        numPrincipal: parsed.number,
        idLetraPrincipal: parsed.letterId || current.direccion.idLetraPrincipal
      }
    }));
  };

  const updateSecondaryNumber = (value: string) => {
    const parsed = splitAddressNumber(value);
    setEmpresaForm((current) => ({
      ...current,
      direccion: {
        ...current.direccion,
        numSecundario: parsed.number,
        idLetraSecundaria: parsed.letterId || current.direccion.idLetraSecundaria
      }
    }));
  };

  const updateSocioPrincipalNumber = (value: string) => {
    const parsed = splitAddressNumber(value);
    setSocioForm((current) => ({
      ...current,
      direccion: {
        ...current.direccion,
        numPrincipal: parsed.number,
        idLetraPrincipal: parsed.letterId || current.direccion.idLetraPrincipal
      }
    }));
  };

  const updateSocioSecondaryNumber = (value: string) => {
    const parsed = splitAddressNumber(value);
    setSocioForm((current) => ({
      ...current,
      direccion: {
        ...current.direccion,
        numSecundario: parsed.number,
        idLetraSecundaria: parsed.letterId || current.direccion.idLetraSecundaria
      }
    }));
  };

  const updateAliadoPrincipalNumber = (value: string) => {
    const parsed = splitAddressNumber(value);
    setAliadoForm((current) => ({
      ...current,
      direccion: {
        ...current.direccion,
        numPrincipal: parsed.number,
        idLetraPrincipal: parsed.letterId || current.direccion.idLetraPrincipal
      }
    }));
  };

  const updateAliadoSecondaryNumber = (value: string) => {
    const parsed = splitAddressNumber(value);
    setAliadoForm((current) => ({
      ...current,
      direccion: {
        ...current.direccion,
        numSecundario: parsed.number,
        idLetraSecundaria: parsed.letterId || current.direccion.idLetraSecundaria
      }
    }));
  };

  const toggleUserRole = (roleId: string) => {
    setUserForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((item) => item !== roleId)
        : [...current.roleIds, roleId]
    }));
  };

  const toggleSelectedRole = (roleId: string) => {
    setSelectedUserRoleIds((current) =>
      current.includes(roleId) ? current.filter((item) => item !== roleId) : [...current, roleId]
    );
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.login(authForm.username, authForm.password);
      const nextSession = { token: response.token, user: response.user };
      setSession(nextSession);
      localStorage.setItem('creditos.token', response.token);
      localStorage.setItem('creditos.user', JSON.stringify(response.user));
      setAuthForm({ username: '', password: '' });
      setMessage('Sesion iniciada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('creditos.token');
    localStorage.removeItem('creditos.user');
    setSession(null);
    setUsers([]);
    setRoles([]);
    setPermissions([]);
    setCatalogModules([]);
    setUserModules([]);
    setIdentificationTypes([]);
    setMessage('Sesion cerrada');
  };

  const handlePortalRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (portalRegisterForm.password.length < 8) {
      setMessage('La contrasena debe tener minimo 8 caracteres');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await api.registerPortalClient({
        identificacion: portalRegisterForm.identificacion,
        primerNombre: portalRegisterForm.primerNombre,
        segundoNombre: portalRegisterForm.segundoNombre || null,
        primerApellido: portalRegisterForm.primerApellido || null,
        segundoApellido: portalRegisterForm.segundoApellido || null,
        correo: portalRegisterForm.correo,
        telefono: portalRegisterForm.telefono || null,
        password: portalRegisterForm.password,
        idTipoIdentificacion: portalRegisterForm.idTipoIdentificacion ? Number(portalRegisterForm.idTipoIdentificacion) : null
      });
      setPortalRegisterForm(initialPortalRegisterForm);
      setPortalMode('login');
      setMessage(response.confirmationToken
        ? `Registro creado. No se pudo confirmar envio SMTP; activa en desarrollo con /portal?confirm=${response.confirmationToken}`
        : 'Registro creado. Revisa tu correo para activar la cuenta.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalCompleteProfile = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('creditos.portal.token');
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const cliente = await api.completePortalLaborProfile(token, {
        codigoEmpresa: portalRegisterForm.codigoEmpresa,
        cargo: portalRegisterForm.cargo,
        idTipoContrato: Number(portalRegisterForm.idTipoContrato),
        fechaIngreso: normalizeDateInput(portalRegisterForm.fechaIngreso),
        salario: Number(portalRegisterForm.salario),
        neto: Number(portalRegisterForm.neto),
        tieneEmbargos: portalRegisterForm.tieneEmbargos
      });
      localStorage.setItem('creditos.portal.cliente', JSON.stringify(cliente));
      setPortalCliente(cliente);
      setPortalRegisterForm(initialPortalRegisterForm);
      setMessage('Informacion laboral guardada. Ya puedes gestionar tu credito.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la informacion laboral');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await api.loginPortalClient(portalLoginForm.identificacion, portalLoginForm.password);
      localStorage.setItem('creditos.portal.token', response.token);
      localStorage.setItem('creditos.portal.cliente', JSON.stringify(response.cliente));
      setPortalCliente(response.cliente);
      setPortalLoginForm(initialPortalLoginForm);
      setMessage('Sesion de cliente iniciada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion en el portal');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalConfirmEmail = async (token: string) => {
    setLoading(true);
    setMessage('');
    try {
      const cliente = await api.confirmPortalEmail(token);
      setPortalMode('login');
      setMessage(`Cuenta activada para ${cliente.nombreCompleto}. Ya puedes iniciar sesion.`);
      window.history.replaceState({}, '', '/portal');
    } catch (error) {
      setPortalMode('login');
      setMessage(error instanceof Error ? error.message : 'No se pudo activar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await api.forgotPortalPassword(portalForgotForm.correo);
      setMessage(response.resetUrl
        ? `Enlace de recuperacion generado: ${response.resetUrl}`
        : 'Si el correo existe, enviaremos las instrucciones de recuperacion.');
      setPortalMode('login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo solicitar la recuperacion');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (portalForgotForm.password.length < 8) {
      setMessage('La nueva contrasena debe tener minimo 8 caracteres');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await api.resetPortalPassword(portalForgotForm.token, portalForgotForm.password);
      setPortalForgotForm(initialPortalForgotForm);
      setPortalMode('login');
      setMessage('Contrasena actualizada. Ya puedes iniciar sesion.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la contrasena');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalLogout = () => {
    localStorage.removeItem('creditos.portal.token');
    localStorage.removeItem('creditos.portal.cliente');
    setPortalCliente(null);
    setPortalProductos([]);
    setPortalSimulacion(null);
    setPortalCreditoForm(initialPortalCreditoForm);
    setPortalMode('login');
    setMessage('Sesion cerrada correctamente');
    window.history.replaceState({}, '', '/portal');
  };

  const handlePortalSimularCredito = async () => {
    const token = localStorage.getItem('creditos.portal.token');
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await api.simularPortalCredito(token, {
        idProductoCredito: Number(portalCreditoForm.idProductoCredito),
        montoSolicitado: Number(portalCreditoForm.montoSolicitado),
        plazo: Number(portalCreditoForm.plazo),
        codigoVendedor: portalCreditoForm.codigoVendedor || null
      });
      setPortalSimulacion(response);
      setPortalDetalleVisible(false);
      setMessage('Simulacion generada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo simular el credito');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalCrearSolicitud = async () => {
    const token = localStorage.getItem('creditos.portal.token');
    if (!token) return;
    if (!portalCreditoForm.aceptaTerminos) {
      setMessage('Debes aceptar los terminos y condiciones para enviar la solicitud');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const created = await api.crearSolicitudPortal(token, {
        idProductoCredito: Number(portalCreditoForm.idProductoCredito),
        montoSolicitado: Number(portalCreditoForm.montoSolicitado),
        plazo: Number(portalCreditoForm.plazo),
        codigoVendedor: portalCreditoForm.codigoVendedor || null
      });
      setPortalSimulacion(null);
      setPortalDetalleVisible(false);
      setPortalCreditoForm({ ...initialPortalCreditoForm, idProductoCredito: portalCreditoForm.idProductoCredito });
      await reloadPortalCreditos();
      setMessage(`Solicitud enviada correctamente: ${created.consecutivo}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createUser(session.token, {
        primerNombre: userForm.primerNombre,
        segundoNombre: userForm.segundoNombre || null,
        primerApellido: userForm.primerApellido || null,
        segundoApellido: userForm.segundoApellido || null,
        nombreCompleto: userForm.nombreCompleto,
        nombreUsuario: userForm.nombreUsuario,
        correo: userForm.correo,
        telefono: userForm.telefono,
        identificacion: userForm.identificacion,
        contrasena: userForm.contrasena,
        idTipoIdentificacion: Number(userForm.idTipoIdentificacion),
        roleIds: toNumberIds(userForm.roleIds)
      });
      setUserForm({
        ...initialUserForm,
        idTipoIdentificacion: String(identificationTypes[0]?.id ?? '')
      });
      await reloadSecurityData();
      setMessage('Usuario creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: number) => {
    const user = users.find((item) => item.id === userId);
    setSelectedUserId(userId || null);
    setSelectedUserRoleIds(
      user?.roles
        .map((roleName) => roles.find((role) => role.nombre === roleName)?.id)
        .filter((roleId): roleId is number => Boolean(roleId))
        .map(String) ?? []
    );
  };

  const handleAssignRoles = async () => {
    if (!session || !selectedUserId) return;

    try {
      await api.updateUserRoles(session.token, selectedUserId, toNumberIds(selectedUserRoleIds));
      await reloadSecurityData();
      setMessage('Roles del usuario actualizados');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron actualizar los roles');
    }
  };

  const handleCreateRole = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createRole(session.token, roleForm);
      setRoleForm(initialRoleForm);
      await reloadSecurityData();
      setMessage('Rol creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el rol');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createPermission(session.token, permissionForm);
      setPermissionForm(initialPermissionForm);
      await reloadSecurityData();
      setMessage('Permiso creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el permiso');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermissions = async () => {
    if (!session || !selectedRoleId) return;

    try {
      await api.updateRolePermissions(session.token, selectedRoleId, selectedPermissionIds);
      await reloadSecurityData();
      setMessage('Permisos del rol actualizados');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron actualizar los permisos');
    }
  };

  const handleCreateModule = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createModule(session.token, moduleForm);
      setModuleForm(initialModuleForm);
      await reloadSecurityData();
      setMessage('Modulo creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el modulo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmodule = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createSubmodule(session.token, {
        ...submoduleForm,
        idModulo: Number(submoduleForm.idModulo)
      });
      setSubmoduleForm(initialSubmoduleForm);
      await reloadSecurityData();
      setMessage('Submodulo creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el submodulo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmpresa = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      const created = await api.createEmpresa(session.token, {
        ...empresaForm,
        capitalSociedad: empresaForm.capitalSociedad ? Number(empresaForm.capitalSociedad) : null,
        ventasFecha: empresaForm.ventasFecha ? Number(empresaForm.ventasFecha) : null,
        diaCorteNomina: empresaForm.diaCorteNomina ? Number(empresaForm.diaCorteNomina) : null,
        diaPagoNomina: empresaForm.diaPagoNomina ? Number(empresaForm.diaPagoNomina) : null,
        segundoDiaPagoNomina: empresaForm.segundoDiaPagoNomina ? Number(empresaForm.segundoDiaPagoNomina) : null,
        diaDescuentoLibranza: empresaForm.diaDescuentoLibranza ? Number(empresaForm.diaDescuentoLibranza) : null,
        direccion: buildDireccionPayload()
      });
      setEmpresaForm(initialEmpresaForm);
      setCitySearch('');
      await reloadEmpresasData();
      setSelectedEmpresaId(created.id);
      setMessage('Empresa creada correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmpleado = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !selectedEmpresaId) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createEmpleadoEmpresa(session.token, selectedEmpresaId, {
        ...empleadoForm,
        idTipoIdentificacion: empleadoForm.idTipoIdentificacion ? Number(empleadoForm.idTipoIdentificacion) : null,
        idTipoContrato: empleadoForm.idTipoContrato ? Number(empleadoForm.idTipoContrato) : null,
        salario: empleadoForm.salario ? Number(empleadoForm.salario) : null,
        idBanco: empleadoForm.idBanco ? Number(empleadoForm.idBanco) : null,
        idTipoCuenta: empleadoForm.idTipoCuenta ? Number(empleadoForm.idTipoCuenta) : null,
        cuentaNomina: empleadoForm.cuentaNomina || null,
        tieneEmbargos: empleadoForm.tieneEmbargos,
        idEstadoCivil: empleadoForm.idEstadoCivil ? Number(empleadoForm.idEstadoCivil) : null,
        personasCargo: empleadoForm.personasCargo ? Number(empleadoForm.personasCargo) : 0,
        idTipoVivienda: empleadoForm.idTipoVivienda ? Number(empleadoForm.idTipoVivienda) : null
      });
      setEmpleadoForm(initialEmpleadoForm);
      await reloadEmpleadosEmpresa(selectedEmpresaId);
      await reloadEmpresasData();
      setMessage('Empleado guardado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEmployees = async () => {
    if (!session || !selectedEmpresaId) return;

    setLoading(true);
    setMessage('');

    try {
      const empleados = parseBulkEmployees(bulkEmployeesText);
      await api.bulkCreateEmpleadosEmpresa(session.token, selectedEmpresaId, empleados);
      setBulkEmployeesText('');
      await reloadEmpleadosEmpresa(selectedEmpresaId);
      await reloadEmpresasData();
      setMessage(`Carga masiva completada: ${empleados.length} empleados`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo realizar la carga masiva');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSocio = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      const direccion = buildSocioDireccionPayload();
      if (!direccion) {
        setMessage('Selecciona una ciudad valida de la lista para guardar el socio');
        return;
      }
      const created = await api.createSocio(session.token, {
        ...socioForm,
        direccion,
        idCiudad: direccion?.idCiudad ?? null,
        idTipoIdentificacion: Number(socioForm.idTipoIdentificacion),
        idBanco: socioForm.idBanco ? Number(socioForm.idBanco) : null,
        idTipoCuenta: socioForm.idTipoCuenta ? Number(socioForm.idTipoCuenta) : null,
        numeroCuenta: socioForm.numeroCuenta || null
      });
      setSocioForm({
        ...initialSocioForm,
        idTipoIdentificacion: String(identificationTypes[0]?.id ?? ''),
        idTipoCuenta: String(sociosCatalogs.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? sociosCatalogs.tiposCuenta[0]?.id ?? '')
      });
      setSocioCitySearch('');
      await reloadSociosData();
      setSelectedSocioId(created.id);
      setMessage('Socio creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el socio');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAliado = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createAliado(session.token, {
        identificacion: aliadoForm.identificacion,
        primerNombre: aliadoForm.primerNombre,
        segundoNombre: aliadoForm.segundoNombre || null,
        primerApellido: aliadoForm.primerApellido,
        segundoApellido: aliadoForm.segundoApellido || null,
        telefono: aliadoForm.telefono,
        correo: aliadoForm.correo,
        fechaNacimiento: aliadoForm.fechaNacimiento || null,
        logoUrl: aliadoForm.logoUrl || null,
        idTipoIdentificacion: Number(aliadoForm.idTipoIdentificacion),
        direccion: buildAliadoDireccionPayload(),
        idBanco: aliadoForm.idBanco ? Number(aliadoForm.idBanco) : null,
        idTipoCuenta: aliadoForm.idTipoCuenta ? Number(aliadoForm.idTipoCuenta) : null,
        numeroCuenta: aliadoForm.numeroCuenta || null,
        representante: {
          idTipoIdentificacion: aliadoForm.representante.idTipoIdentificacion ? Number(aliadoForm.representante.idTipoIdentificacion) : null,
          identificacion: aliadoForm.representante.identificacion || null,
          primerNombre: aliadoForm.representante.primerNombre || null,
          segundoNombre: aliadoForm.representante.segundoNombre || null,
          primerApellido: aliadoForm.representante.primerApellido || null,
          segundoApellido: aliadoForm.representante.segundoApellido || null,
          genero: aliadoForm.representante.genero || null,
          telefono: aliadoForm.representante.telefono || null,
          correo: aliadoForm.representante.correo || null,
          idCiudad: aliadoForm.representante.idCiudad ? Number(aliadoForm.representante.idCiudad) : null
        },
        camara: {
          numero: aliadoForm.camara.numero || null,
          libro: aliadoForm.camara.libro || null,
          idCiudad: aliadoForm.camara.idCiudad ? Number(aliadoForm.camara.idCiudad) : null,
          rees: aliadoForm.camara.rees || null,
          runeol: aliadoForm.camara.runeol || null
        }
      });
      setAliadoForm({
        ...initialAliadoForm,
        idTipoIdentificacion: String(identificationTypes[0]?.id ?? ''),
        idBanco: String(aliadosCatalogs.bancos[0]?.id ?? ''),
        idTipoCuenta: String(aliadosCatalogs.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? aliadosCatalogs.tiposCuenta[0]?.id ?? ''),
        representante: {
          ...initialAliadoForm.representante,
          idTipoIdentificacion: String(identificationTypes[0]?.id ?? '')
        }
      });
      setAliadoCitySearch('');
      setAliadoRepCitySearch('');
      setAliadoCamaraCitySearch('');
      await reloadAliadosData();
      setAliadosTab('directorio');
      setMessage('Aliado creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el aliado');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLibranzera = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createLibranzera(session.token, {
        nit: libranzeraForm.nit,
        razonSocial: libranzeraForm.razonSocial,
        domicilio: libranzeraForm.domicilio || null,
        sitioWeb: libranzeraForm.sitioWeb || null,
        correo: libranzeraForm.correo || null,
        telefono: libranzeraForm.telefono || null,
        telefonoCallcenter: libranzeraForm.telefonoCallcenter || null,
        camaraNumero: libranzeraForm.camaraNumero || null,
        camaraLibro: libranzeraForm.camaraLibro || null,
        camaraIdCiudad: libranzeraForm.camaraIdCiudad ? Number(libranzeraForm.camaraIdCiudad) : null,
        fechaConstitucion: libranzeraForm.fechaConstitucion || null,
        ciiu: libranzeraForm.ciiu || null,
        runeol: libranzeraForm.runeol || null,
        representanteLegal: {
          idTipoIdentificacion: libranzeraForm.representanteLegal.idTipoIdentificacion ? Number(libranzeraForm.representanteLegal.idTipoIdentificacion) : null,
          identificacion: libranzeraForm.representanteLegal.identificacion || null,
          nombre: libranzeraForm.representanteLegal.nombre || null,
          genero: libranzeraForm.representanteLegal.genero || null,
          idCiudad: libranzeraForm.representanteLegal.idCiudad ? Number(libranzeraForm.representanteLegal.idCiudad) : null
        },
        representanteCartera: {
          idTipoIdentificacion: libranzeraForm.representanteCartera.idTipoIdentificacion ? Number(libranzeraForm.representanteCartera.idTipoIdentificacion) : null,
          identificacion: libranzeraForm.representanteCartera.identificacion || null,
          nombre: libranzeraForm.representanteCartera.nombre || null,
          genero: libranzeraForm.representanteCartera.genero || null,
          idCiudad: libranzeraForm.representanteCartera.idCiudad ? Number(libranzeraForm.representanteCartera.idCiudad) : null,
          telefono: libranzeraForm.representanteCartera.telefono || null,
          correo: libranzeraForm.representanteCartera.correo || null
        },
        idBanco: libranzeraForm.idBanco ? Number(libranzeraForm.idBanco) : null,
        idTipoCuenta: libranzeraForm.idTipoCuenta ? Number(libranzeraForm.idTipoCuenta) : null,
        numeroCuenta: libranzeraForm.numeroCuenta || null
      });
      setLibranzeraForm({
        ...initialLibranzeraForm,
        idBanco: String(comercialesCatalogs.bancos[0]?.id ?? ''),
        idTipoCuenta: String(comercialesCatalogs.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? comercialesCatalogs.tiposCuenta[0]?.id ?? ''),
        representanteLegal: {
          ...initialLibranzeraForm.representanteLegal,
          idTipoIdentificacion: String(identificationTypes[0]?.id ?? '')
        },
        representanteCartera: {
          ...initialLibranzeraForm.representanteCartera,
          idTipoIdentificacion: String(identificationTypes[0]?.id ?? '')
        }
      });
      await reloadComercialesData();
      setComercialesTab('directorio');
      setMessage('Libranzera creada correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la libranzera');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComercial = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        idLibranzera: Number(comercialForm.idLibranzera),
        identificacion: comercialForm.identificacion,
        primerNombre: comercialForm.primerNombre,
        segundoNombre: comercialForm.segundoNombre || null,
        primerApellido: comercialForm.primerApellido,
        segundoApellido: comercialForm.segundoApellido || null,
        fechaNacimiento: comercialForm.fechaNacimiento || null,
        telefono: comercialForm.telefono,
        correo: comercialForm.correo,
        codigoVendedor: comercialForm.codigoVendedor,
        idTipoIdentificacion: Number(comercialForm.idTipoIdentificacion),
        idRolVendedor: comercialForm.idRolVendedor ? Number(comercialForm.idRolVendedor) : null,
        idFormulaComercial: null,
        tipoComision: comercialForm.tipoComision,
        valorComision: comercialForm.valorComision ? Number(comercialForm.valorComision) : 0,
        domicilio: comercialDireccionCompuesta || null,
        idCiudad: comercialForm.direccion.idCiudad ? Number(comercialForm.direccion.idCiudad) : null,
        idBanco: comercialForm.idBanco ? Number(comercialForm.idBanco) : null,
        idTipoCuenta: comercialForm.idTipoCuenta ? Number(comercialForm.idTipoCuenta) : null,
        numeroCuenta: comercialForm.numeroCuenta || null
      };
      if (selectedComercialId) {
        await api.updateComercial(session.token, selectedComercialId, payload);
      } else {
        await api.createComercial(session.token, payload);
      }
      setComercialForm({
        ...initialComercialForm,
        idLibranzera: String(comercialesCatalogs.libranzeras[0]?.id ?? ''),
        idTipoIdentificacion: String(identificationTypes[0]?.id ?? ''),
        idRolVendedor: String(comercialesCatalogs.rolesVendedor[0]?.id ?? ''),
        idFormulaComercial: '',
        idBanco: String(comercialesCatalogs.bancos[0]?.id ?? ''),
        idTipoCuenta: String(comercialesCatalogs.tiposCuenta.find((item) => item.nombre.toLowerCase().includes('ahorro'))?.id ?? comercialesCatalogs.tiposCuenta[0]?.id ?? '')
      });
      setSelectedComercialId(null);
      await reloadComercialesData();
      setComercialesTab('directorio');
      setMessage(selectedComercialId ? 'Asesor actualizado correctamente' : 'Asesor creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el asesor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComercial = (item: ComercialRow) => {
    const [primerNombre = '', segundoNombre = '', primerApellido = '', ...resto] = item.nombreCompleto.split(/\s+/);
    const tipoIdentificacion = identificationTypes.find((type) => item.tipoIdentificacion?.includes(type.sigla));
    const rol = comercialesCatalogs.rolesVendedor.find((role) => role.nombre === item.rolVendedor);
    const banco = comercialesCatalogs.bancos.find((bank) => bank.nombre === item.banco);
    const tipoCuenta = comercialesCatalogs.tiposCuenta.find((account) => account.nombre === item.tipoCuenta);
    const ciudad = addressCatalogs.ciudades.find((city) => city.nombre === item.ciudad);
    setSelectedComercialId(item.id);
    setComercialForm({
      ...initialComercialForm,
      idLibranzera: String(item.idLibranzera),
      identificacion: item.identificacion,
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido: resto.join(' '),
      fechaNacimiento: item.fechaNacimiento?.slice(0, 10) ?? '',
      telefono: item.telefono,
      correo: item.correo,
      codigoVendedor: item.codigoVendedor,
      idTipoIdentificacion: String(tipoIdentificacion?.id ?? identificationTypes[0]?.id ?? ''),
      idRolVendedor: String(rol?.id ?? ''),
      idFormulaComercial: '',
      tipoComision: item.tipoComision ?? 'PORCENTAJE',
      valorComision: item.valorComision !== null && item.valorComision !== undefined ? String(item.valorComision) : '',
      direccion: {
        ...initialComercialForm.direccion,
        complemento: item.domicilio ?? '',
        idCiudad: String(ciudad?.id ?? '')
      },
      idCiudad: '',
      idBanco: String(banco?.id ?? ''),
      idTipoCuenta: String(tipoCuenta?.id ?? ''),
      numeroCuenta: item.numeroCuenta ?? ''
    });
    setComercialesTab('vendedor');
  };

  const handleToggleComercialEstado = async (item: ComercialRow) => {
    if (!session) return;
    setLoading(true);
    setMessage('');
    try {
      const isActive = item.estado?.toLowerCase() === 'activo';
      await api.updateComercialEstado(session.token, item.id, !isActive);
      await reloadComercialesData();
      setMessage(isActive ? 'Asesor inactivado correctamente' : 'Asesor activado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cambiar el estado del asesor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProductoCredito = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setLoading(true);
    setMessage('');
    try {
      const created = await api.createProductoCredito(session.token, {
        nombre: productoCreditoForm.nombre,
        descripcion: productoCreditoForm.descripcion || null,
        idTipoCredito: Number(productoCreditoForm.idTipoCredito),
        tipoTasa: productoCreditoForm.tipoTasa,
        idLibranzera: productoCreditoForm.idLibranzera ? Number(productoCreditoForm.idLibranzera) : null,
        montoMinimo: productoCreditoForm.montoMinimo ? Number(productoCreditoForm.montoMinimo) : null,
        montoMaximo: productoCreditoForm.montoMaximo ? Number(productoCreditoForm.montoMaximo) : null,
        salarioMinimo: productoCreditoForm.salarioMinimo ? Number(productoCreditoForm.salarioMinimo) : null,
        salarioMaximo: productoCreditoForm.salarioMaximo ? Number(productoCreditoForm.salarioMaximo) : null,
        plazoMinimo: productoCreditoForm.plazoMinimo ? Number(productoCreditoForm.plazoMinimo) : null,
        plazoMaximo: productoCreditoForm.plazoMaximo ? Number(productoCreditoForm.plazoMaximo) : null,
        modeloPlazo: productoCreditoForm.modeloPlazo,
        permiteCreditoMultiple: productoCreditoForm.permiteCreditoMultiple,
        interesAjustable: productoCreditoForm.interesAjustable,
        permiteRefinanciacion: productoCreditoForm.permiteRefinanciacion,
        permiteRetanqueo: productoCreditoForm.permiteRetanqueo,
        requiereCodeudor: productoCreditoForm.requiereCodeudor,
        numeroCodeudores: Number(productoCreditoForm.numeroCodeudores || 0),
        formatoCredito: productoCreditoForm.formatoCredito || null,
        formatoRequisitos: productoCreditoForm.formatoRequisitos || null,
        formatoCodeudores: productoCreditoForm.formatoCodeudores || null,
        proveedorFirma: productoCreditoForm.proveedorFirma || null,
        periodoGracia: productoCreditoForm.periodoGracia ? Number(productoCreditoForm.periodoGracia) : null,
        periodicidad: productoCreditoForm.periodicidad,
        diaCorte: productoCreditoForm.diaCorte ? Number(productoCreditoForm.diaCorte) : null,
        diaPagoOportuno: productoCreditoForm.diaPagoOportuno ? Number(productoCreditoForm.diaPagoOportuno) : null,
        ajustarFinSemana: productoCreditoForm.ajustarFinSemana,
        moraDespuesVencimiento: productoCreditoForm.moraDespuesVencimiento ? Number(productoCreditoForm.moraDespuesVencimiento) : 0,
        tasaMoraMensual: productoCreditoForm.tasaMoraMensual ? Number(productoCreditoForm.tasaMoraMensual) : 2,
        primeraCuotaMesSiguiente: productoCreditoForm.primeraCuotaMesSiguiente,
        observacionCalendario: productoCreditoForm.observacionCalendario || null
      });
      setProductoCreditoForm({ ...initialProductoCreditoForm, idTipoCredito: String(productosCreditoCatalogs.tiposCredito[0]?.id ?? ''), idLibranzera: String(productosCreditoCatalogs.libranzeras[0]?.id ?? '') });
      await reloadProductosCreditoData();
      setSelectedProductoCreditoId(created.id);
      setMessage('Producto de credito creado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProductoAtributo = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !selectedProductoCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await api.createProductoAtributo(session.token, selectedProductoCreditoId, {
        idTipoAtributo: Number(productoAtributoForm.idTipoAtributo),
        idTipoCalculo: Number(productoAtributoForm.idTipoCalculo),
        nombre: productoAtributoForm.nombre,
        valor: productoAtributoForm.valor ? Number(productoAtributoForm.valor) : null,
        porcentaje: productoAtributoForm.porcentaje ? Number(productoAtributoForm.porcentaje) : null,
        minimo: productoAtributoForm.minimo ? Number(productoAtributoForm.minimo) : null,
        maximo: productoAtributoForm.maximo ? Number(productoAtributoForm.maximo) : null,
        aplicaIva: productoAtributoForm.aplicaIva,
        obligatorio: productoAtributoForm.obligatorio,
        proveedor: productoAtributoForm.proveedor || null,
        prioridad: Number(productoAtributoForm.prioridad || 1)
      });
      setProductoAtributos(response);
      setProductoAtributoForm({ ...initialProductoAtributoForm, idTipoAtributo: productoAtributoForm.idTipoAtributo, idTipoCalculo: productoAtributoForm.idTipoCalculo });
      await reloadProductosCreditoData();
      setMessage('Atributo agregado');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo agregar el atributo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProductoDocumento = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !selectedProductoCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await api.createProductoDocumento(session.token, selectedProductoCreditoId, {
        idDocumentoCredito: Number(productoDocumentoForm.idDocumentoCredito),
        obligatorio: productoDocumentoForm.obligatorio,
        prioridad: Number(productoDocumentoForm.prioridad || 1),
        aplicaA: productoDocumentoForm.aplicaA,
        requiereFirma: productoDocumentoForm.requiereFirma,
        requiereValidacion: productoDocumentoForm.requiereValidacion
      });
      setProductoDocumentos(response);
      setProductoDocumentoForm({ ...initialProductoDocumentoForm, idDocumentoCredito: productoDocumentoForm.idDocumentoCredito });
      await reloadProductosCreditoData();
      setMessage('Documento agregado');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo agregar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocumentTemplate = async (id: number) => {
    if (!session) return;
    try {
      const template = await api.getDocumentTemplate(session.token, id);
      setSelectedDocumentTemplate(template);
      setDocumentTemplateForm({
        codigo: template.codigo,
        nombre: template.nombre,
        descripcion: template.descripcion ?? '',
        tipoDocumento: template.tipoDocumento,
        contenido: template.contenido ?? ''
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir la plantilla');
    }
  };

  const handleSaveDocumentTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setLoading(true);
    setMessage('');
    try {
      if (selectedDocumentTemplate) {
        await api.createDocumentTemplateVersion(session.token, selectedDocumentTemplate.id, {
          contenido: documentTemplateForm.contenido,
          publicar: false
        });
        await handleSelectDocumentTemplate(selectedDocumentTemplate.id);
        setMessage('Nueva version borrador creada');
      } else {
        const created = await api.createDocumentTemplate(session.token, documentTemplateForm);
        setSelectedDocumentTemplate(created);
        setMessage('Plantilla creada correctamente');
      }
      await reloadDocumentManagement();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishDocumentTemplate = async () => {
    if (!session || !selectedDocumentTemplate) return;
    setLoading(true);
    try {
      await api.createDocumentTemplateVersion(session.token, selectedDocumentTemplate.id, {
        contenido: documentTemplateForm.contenido,
        publicar: true
      });
      await handleSelectDocumentTemplate(selectedDocumentTemplate.id);
      await reloadDocumentManagement();
      setMessage('Plantilla publicada');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!session || !selectedDocumentTemplate || !documentCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const generated = await api.generateDocument(session.token, selectedDocumentTemplate.id, Number(documentCreditoId));
      const blob = await api.getGeneratedDocumentPdf(session.token, generated.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(`Documento generado: ${generated.fileName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo generar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductoEtapa = (etapa: ProductoEtapaRow) => {
    setSelectedProductoEtapaId(etapa.id);
    setProductoEtapaForm({
      idEtapaCredito: String(etapa.idEtapaCredito),
      orden: String(etapa.orden),
      obligatoria: etapa.obligatoria,
      permiteDevolucion: etapa.permiteDevolucion,
      responsable: etapa.responsable ?? '',
      slaHoras: etapa.slaHoras ? String(etapa.slaHoras) : ''
    });
  };

  const handleCancelProductoEtapaEdit = () => {
    setSelectedProductoEtapaId(null);
    setProductoEtapaForm({
      ...initialProductoEtapaForm,
      orden: String((productoEtapas.length || 0) + 1)
    });
  };

  const handleSaveProductoEtapa = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !selectedProductoCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        idEtapaCredito: Number(productoEtapaForm.idEtapaCredito),
        orden: Number(productoEtapaForm.orden || 1),
        obligatoria: productoEtapaForm.obligatoria,
        permiteDevolucion: productoEtapaForm.permiteDevolucion,
        responsable: productoEtapaForm.responsable || null,
        slaHoras: productoEtapaForm.slaHoras ? Number(productoEtapaForm.slaHoras) : null
      };
      const response = selectedProductoEtapaId
        ? await api.updateProductoEtapa(session.token, selectedProductoCreditoId, selectedProductoEtapaId, payload)
        : await api.createProductoEtapa(session.token, selectedProductoCreditoId, payload);
      setProductoEtapas(response);
      setSelectedProductoEtapaId(null);
      setProductoEtapaForm({ ...initialProductoEtapaForm, idEtapaCredito: productoEtapaForm.idEtapaCredito, orden: String((response.length || 0) + 1) });
      await reloadProductosCreditoData();
      setMessage(selectedProductoEtapaId ? 'Etapa actualizada' : 'Etapa agregada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la etapa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredito = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setLoading(true);
    setMessage('');
    try {
      const created = await api.createCredito(session.token, {
        idProductoCredito: Number(creditoForm.idProductoCredito),
        idLibranzera: creditoForm.idLibranzera ? Number(creditoForm.idLibranzera) : null,
        idEmpresa: creditoForm.idEmpresa ? Number(creditoForm.idEmpresa) : null,
        idEmpleadoEmpresa: creditoForm.idEmpleadoEmpresa ? Number(creditoForm.idEmpleadoEmpresa) : null,
        idComercial: creditoForm.idComercial ? Number(creditoForm.idComercial) : null,
        identificacionCliente: creditoForm.identificacionCliente,
        nombreCliente: creditoForm.nombreCliente,
        correoCliente: creditoForm.correoCliente || null,
        telefonoCliente: creditoForm.telefonoCliente || null,
        montoSolicitado: Number(creditoForm.montoSolicitado),
        plazo: Number(creditoForm.plazo),
        tasa: creditoForm.tasa ? Number(creditoForm.tasa) : null
      });
      setCreditoForm({
        ...initialCreditoForm,
        idProductoCredito: String(creditosCatalogs.productos[0]?.id ?? ''),
        idLibranzera: String(creditosCatalogs.libranzeras[0]?.id ?? ''),
        idEmpresa: String(creditosCatalogs.empresas[0]?.id ?? ''),
        idComercial: String(creditosCatalogs.comerciales[0]?.id ?? '')
      });
      await reloadProductosCreditoData();
      setSelectedCreditoId(created.id);
      setProductosCreditoTab('solicitudes');
      setMessage('Credito radicado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo radicar el credito');
    } finally {
      setLoading(false);
    }
  };

  const handleSimularCredito = async () => {
    if (!session) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await api.simularCredito(session.token, {
        idProductoCredito: Number(creditoForm.idProductoCredito),
        montoSolicitado: Number(creditoForm.montoSolicitado),
        plazo: Number(creditoForm.plazo),
        tasa: creditoForm.tasa ? Number(creditoForm.tasa) : null
      });
      setCreditoSimulacion(response);
      setMessage('Simulacion generada correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo simular el credito');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCreditoEtapa = async (estado: 'APROBADA' | 'DEVUELTA' | 'RECHAZADA') => {
    if (!session || !selectedCreditoEtapa || !selectedCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.updateCreditoEtapa(session.token, selectedCreditoEtapa.id, {
        estado,
        observacion: creditoEtapaObservacion || null
      });
      setCreditoExpediente(expediente);
      setCreditoDocumentos(expediente.documentos);
      setCreditoEtapas(expediente.etapas);
      setCreditoEtapaObservacion('');
      setSelectedCreditoEtapaId(
        expediente.etapas.find((etapa) => etapa.estadoEtapa === 'EN_PROCESO')?.id
        ?? expediente.etapas.find((etapa) => etapa.estadoEtapa === 'PENDIENTE')?.id
        ?? selectedCreditoEtapa.id
      );
      const refreshed = await api.listCreditos(session.token);
      setCreditos(refreshed);
      setSelectedCreditoId(selectedCreditoId);
      setMessage('Etapa actualizada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la etapa');
    } finally {
      setLoading(false);
    }
  };

  const applyCreditoExpediente = (expediente: CreditoExpediente) => {
    setCreditoExpediente(expediente);
    setCreditoDocumentos(expediente.documentos);
    setCreditoEtapas(expediente.etapas);
    setSelectedCreditoEtapaId(
      expediente.etapas.find((etapa) => etapa.estadoEtapa === 'EN_PROCESO')?.id
      ?? expediente.etapas.find((etapa) => etapa.estadoEtapa === 'PENDIENTE')?.id
      ?? expediente.etapas[0]?.id
      ?? null
    );
    setCreditoDecisionForm((current) => ({
      montoAprobado: current.montoAprobado || String(expediente.credito.montoSolicitado || ''),
      plazoAprobado: current.plazoAprobado || String(expediente.credito.plazo || ''),
      tasaAprobada: current.tasaAprobada || String(expediente.credito.tasa ?? ''),
      cuotaAprobada: current.cuotaAprobada || String(expediente.credito.cuotaEstimada ?? ''),
      observacion: current.observacion
    }));
    setCreditoDesembolsoForm((current) => ({
      ...current,
      valorDesembolso: current.valorDesembolso || String(expediente.decisiones[0]?.montoAprobado ?? expediente.credito.montoSolicitado ?? ''),
      fechaPrimeraCuota: current.fechaPrimeraCuota || nextMonthDate(current.fechaDesembolso),
      periodicidad: expediente.sugerenciaCalendario?.periodicidad || current.periodicidad || 'MENSUAL',
      diaCorte: String(expediente.sugerenciaCalendario?.diaCorte ?? current.diaCorte ?? 25),
      diaPagoOportuno: String(expediente.sugerenciaCalendario?.diaPagoOportuno ?? current.diaPagoOportuno ?? 30),
      ajustarFinSemana: expediente.sugerenciaCalendario?.ajustarFinSemana ?? current.ajustarFinSemana,
      moraDespuesVencimiento: String(expediente.sugerenciaCalendario?.moraDespuesVencimiento ?? current.moraDespuesVencimiento ?? 0),
      observacionCalendario: expediente.sugerenciaCalendario?.observacionCalendario || current.observacionCalendario || '',
      bancoDestino: current.bancoDestino || expediente.perfilCliente?.empleado.banco || '',
      tipoCuenta: current.tipoCuenta || expediente.perfilCliente?.empleado.tipoCuenta || '',
      numeroCuenta: current.numeroCuenta || expediente.perfilCliente?.empleado.cuentaNomina || ''
    }));
  };

  const handleUpdateCreditoDocumento = async (documentoId: number, estado: 'CARGADO' | 'APROBADO' | 'RECHAZADO') => {
    if (!session) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.updateCreditoDocumento(session.token, documentoId, {
        estado,
        observacion: creditoEtapaObservacion || null
      });
      applyCreditoExpediente(expediente);
      setMessage('Documento actualizado');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCreditoDocumento = async (documentoId: number, file?: File | null) => {
    if (!session || !file) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.uploadCreditoDocumentoArchivo(session.token, documentoId, file);
      applyCreditoExpediente(expediente);
      setMessage('Archivo cargado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCreditoPagoSoporte = async (pagoId: number, file?: File | null) => {
    if (!session || !file) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.uploadCreditoPagoSoporte(session.token, pagoId, file);
      applyCreditoExpediente(expediente);
      setMessage('Soporte de pago cargado correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el soporte de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleDecideCredito = async (decision: 'APROBADO' | 'RECHAZADO' | 'DEVUELTO') => {
    if (!session || !selectedCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.decideCredito(session.token, selectedCreditoId, {
        decision,
        montoAprobado: decision === 'APROBADO' ? Number(creditoDecisionForm.montoAprobado) : null,
        plazoAprobado: decision === 'APROBADO' ? Number(creditoDecisionForm.plazoAprobado) : null,
        tasaAprobada: decision === 'APROBADO' && creditoDecisionForm.tasaAprobada ? Number(creditoDecisionForm.tasaAprobada) : null,
        cuotaAprobada: decision === 'APROBADO' && creditoDecisionForm.cuotaAprobada ? Number(creditoDecisionForm.cuotaAprobada) : null,
        observacion: creditoDecisionForm.observacion || creditoEtapaObservacion || null
      });
      applyCreditoExpediente(expediente);
      const refreshed = await api.listCreditos(session.token);
      setCreditos(refreshed);
      setMessage('Decision registrada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la decision');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarDesembolso = async () => {
    if (!session || !selectedCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.registrarDesembolso(session.token, selectedCreditoId, {
        valorDesembolso: Number(creditoDesembolsoForm.valorDesembolso),
        fechaDesembolso: creditoDesembolsoForm.fechaDesembolso,
        fechaPrimeraCuota: creditoDesembolsoForm.fechaPrimeraCuota || null,
        diaCorte: creditoDesembolsoForm.diaCorte ? Number(creditoDesembolsoForm.diaCorte) : null,
        diaPagoOportuno: creditoDesembolsoForm.diaPagoOportuno ? Number(creditoDesembolsoForm.diaPagoOportuno) : null,
        periodicidad: creditoDesembolsoForm.periodicidad,
        ajustarFinSemana: creditoDesembolsoForm.ajustarFinSemana,
        moraDespuesVencimiento: creditoDesembolsoForm.moraDespuesVencimiento ? Number(creditoDesembolsoForm.moraDespuesVencimiento) : 0,
        observacionCalendario: creditoDesembolsoForm.observacionCalendario || null,
        idInversion: creditoDesembolsoForm.idInversion ? Number(creditoDesembolsoForm.idInversion) : null,
        valorFondeo: creditoDesembolsoForm.valorFondeo ? Number(creditoDesembolsoForm.valorFondeo) : null,
        bancoDestino: creditoDesembolsoForm.bancoDestino || null,
        tipoCuenta: creditoDesembolsoForm.tipoCuenta || null,
        numeroCuenta: creditoDesembolsoForm.numeroCuenta || null,
        referenciaPago: creditoDesembolsoForm.referenciaPago || null,
        observacion: creditoDesembolsoForm.observacion || null
      });
      applyCreditoExpediente(expediente);
      setCreditoDesembolsoForm((current) => ({ ...current, idInversion: '', valorFondeo: '', observacion: '' }));
      const refreshed = await api.listCreditos(session.token);
      setCreditos(refreshed);
      setMessage('Desembolso registrado');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar el desembolso');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarFondeo = async () => {
    if (!session || !selectedCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.asignarFondeoCredito(session.token, selectedCreditoId, {
        idInversion: Number(creditoFondeoForm.idInversion),
        valorAsignado: Number(creditoFondeoForm.valorAsignado),
        observacion: creditoFondeoForm.observacion || null
      });
      applyCreditoExpediente(expediente);
      setFondeoDisponible(await api.listOpcionesFondeo(session.token));
      setCreditoFondeoForm((current) => ({ ...current, observacion: '' }));
      setMessage('Fondeo asignado al credito');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo asignar el fondeo');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarPagoCredito = async () => {
    if (!session || !selectedCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      const expediente = await api.registrarPagoCredito(session.token, selectedCreditoId, {
        fechaPago: creditoPagoForm.fechaPago,
        valorPago: Number(creditoPagoForm.valorPago),
        medioPago: creditoPagoForm.medioPago || null,
        referenciaPago: creditoPagoForm.referenciaPago || null,
        observacion: creditoPagoForm.observacion || null
      });
      applyCreditoExpediente(expediente);
      const refreshed = await api.listCreditos(session.token);
      setCreditos(refreshed);
      setCreditoPagoForm((current) => ({ ...current, valorPago: '', referenciaPago: '', observacion: '' }));
      setMessage('Pago registrado y aplicado a cuotas');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const reloadCreditoFirmas = async (creditoId: number) => {
    if (!session) return;
    try {
      setCreditoFirmas(await api.listFirmasCredito(session.token, creditoId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar las firmas');
    }
  };

  const handleEnviarFirmaCredito = async () => {
    if (!session || !selectedCreditoId || !creditoFirmaForm.idPlantilla) return;
    setLoading(true);
    setMessage('');
    try {
      const generated = await api.generateDocument(session.token, Number(creditoFirmaForm.idPlantilla), selectedCreditoId);
      await api.crearFirmaCredito(session.token, {
        creditoId: selectedCreditoId,
        documentoGeneradoId: generated.id,
        firmanteNombre: creditoFirmaForm.firmanteNombre || selectedCredito?.nombreCliente || '',
        firmanteCorreo: creditoFirmaForm.firmanteCorreo || selectedCredito?.correoCliente || null,
        firmanteTelefono: creditoFirmaForm.firmanteTelefono || selectedCredito?.telefonoCliente || null
      });
      await reloadCreditoFirmas(selectedCreditoId);
      setMessage('Documento enviado a firma');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar a firma');
    } finally {
      setLoading(false);
    }
  };

  const handleFirmaManualEstado = async (firmaId: number, estado: string) => {
    if (!session || !selectedCreditoId) return;
    setLoading(true);
    setMessage('');
    try {
      await api.updateFirmaEstado(session.token, firmaId, estado);
      await reloadCreditoFirmas(selectedCreditoId);
      setMessage('Estado de firma actualizado');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la firma');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFirmaPdf = async (firmaId: number) => {
    if (!session) return;
    try {
      const blob = await api.getFirmaPdfFirmado(session.token, firmaId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir el PDF firmado');
    }
  };

  const handleOpenCreditoDocumento = async (documentoId: number) => {
    if (!session) return;
    try {
      const blob = await api.getCreditoDocumentoArchivo(session.token, documentoId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir el archivo');
    }
  };

  const handleOpenCreditoPagoSoporte = async (pagoId: number) => {
    if (!session) return;
    try {
      const blob = await api.getCreditoPagoSoporte(session.token, pagoId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir el soporte de pago');
    }
  };

  const handleCreateInversion = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !selectedSocioId) return;

    setLoading(true);
    setMessage('');

    try {
      await api.createInversionSocio(session.token, selectedSocioId, {
        monto: Number(inversionForm.monto),
        fechaInversion: inversionForm.fechaInversion,
        plazo: Number(inversionForm.plazo),
        idTasaInversion: Number(inversionForm.idTasaInversion)
      });
      setInversionForm({ ...initialInversionForm, idTasaInversion: String(sociosCatalogs.tasasInversion[0]?.id ?? '') });
      await reloadInversionesSocio(selectedSocioId);
      await reloadSociosData();
      setMessage('Inversion registrada correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la inversion');
    } finally {
      setLoading(false);
    }
  };

  if (isPortalRoute) {
    return (
      <div className="portal-screen">
        <section className="portal-shell">
          <div className="portal-toolbar">
            <div className="portal-logo">P&S</div>
            <div className="portal-controls">
              <button type="button" className={themeMode === 'light' ? 'chip-button active' : 'chip-button'} onClick={() => setThemeMode('light')}>Dia</button>
              <button type="button" className={themeMode === 'dark' ? 'chip-button active' : 'chip-button'} onClick={() => setThemeMode('dark')}>Noche</button>
              <select value={paletteKey} onChange={(event) => setPaletteKey(event.target.value as PaletteKey)} aria-label="Paleta">
                {(Object.entries(palettes) as Array<[PaletteKey, Palette]>).map(([key, palette]) => (
                  <option key={key} value={key}>{palette.name}</option>
                ))}
              </select>
              {portalCliente ? (
                <button type="button" className="portal-logout" onClick={handlePortalLogout}>Salir</button>
              ) : null}
            </div>
          </div>
          <div className="portal-brand">
            <span>P&S</span>
            <h1>{portalCliente ? (portalCliente.perfilCompleto ? 'Portal del cliente' : 'Completa tu perfil') : portalMode === 'registro' ? 'Crea tu cuenta' : 'Iniciar sesion'}</h1>
            <p>{portalCliente ? (portalCliente.perfilCompleto ? 'Gestiona tus solicitudes y creditos.' : 'Asocia tu empresa y registra tu informacion laboral para continuar.') : portalMode === 'registro' ? 'Registra tus datos basicos y activa tu cuenta.' : 'Ingresa con tu identificacion o correo.'}</p>
          </div>

          {portalCliente && !portalCliente.perfilCompleto ? (
            <section className="portal-card">
              <div className="surface-title">
                <div>
                  <span className="section-kicker">Paso 2 de 2</span>
                  <h2>Informacion laboral</h2>
                </div>
              </div>
              <p className="muted-note">Hola, {portalCliente.nombreCompleto}. Usa el codigo entregado por tu empresa para completar la vinculacion.</p>
              <form className="portal-form" onSubmit={handlePortalCompleteProfile}>
                <div className="form-section">
                  <h3>Empresa y contrato</h3>
                  <div className="field-grid two-cols">
                    <input required value={portalRegisterForm.codigoEmpresa} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, codigoEmpresa: event.target.value }))} placeholder="Codigo de empresa *" />
                    <input required value={portalRegisterForm.cargo} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, cargo: event.target.value }))} placeholder="Ocupacion / Cargo *" />
                    <select required value={portalRegisterForm.idTipoContrato} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, idTipoContrato: event.target.value }))}>
                      <option value="">Tipo de contrato *</option>
                      {portalCatalogs.tiposContrato.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input required type="date" value={portalRegisterForm.fechaIngreso} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, fechaIngreso: event.target.value }))} />
                    <input required type="number" min="1" value={portalRegisterForm.salario} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, salario: event.target.value }))} placeholder="Salario *" />
                    <input required type="number" min="0" value={portalRegisterForm.neto} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, neto: event.target.value }))} placeholder="Ingreso neto *" />
                    <label className="inline-check"><input type="checkbox" checked={portalRegisterForm.tieneEmbargos} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, tieneEmbargos: event.target.checked }))} />Actualmente tengo embargos</label>
                  </div>
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar y continuar'}</button>
              </form>
            </section>
          ) : portalCliente ? (
            <section className="portal-card">
              <div className="surface-title">
                <h2>Bienvenido, {portalCliente.nombreCompleto}</h2>
              </div>
              <div className="summary-grid">
                <article><span>Empresa</span><strong>{portalCliente.empresa}</strong></article>
                <article><span>Identificacion</span><strong>{portalCliente.identificacion}</strong></article>
                <article><span>Salario</span><strong>{formatMoney(portalCliente.salario)}</strong></article>
                <article><span>Estado</span><strong>{portalCliente.estado ?? 'Activo'}</strong></article>
              </div>
              <section className="client-credit-dashboard">
                <div className="surface-title">
                  <div>
                    <span className="section-kicker">Estado de tus creditos</span>
                    <h2>Resumen financiero</h2>
                  </div>
                </div>
                <div className="credit-status-grid">
                  <article className="status-active"><span>Creditos activos</span><strong>{portalCreditos.resumen.activos}</strong><small>Obligaciones vigentes</small></article>
                  <article className="status-requested"><span>Solicitudes</span><strong>{portalCreditos.resumen.solicitados}</strong><small>Radicadas o en estudio</small></article>
                  <article className="status-approved"><span>Aprobados</span><strong>{portalCreditos.resumen.aprobados}</strong><small>Pendientes de desembolso</small></article>
                  <article className="status-rejected"><span>Rechazados</span><strong>{portalCreditos.resumen.rechazados}</strong><small>Solicitudes no aprobadas</small></article>
                </div>
                <div className="client-credit-history">
                  <div className="surface-title compact-title"><h3>Mis solicitudes y creditos</h3><span>{portalCreditos.creditos.length} registros</span></div>
                  {portalCreditos.creditos.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Solicitud</th><th>Producto</th><th>Fecha</th><th>Monto</th><th>Plazo</th><th>Estado</th></tr></thead>
                        <tbody>
                          {portalCreditos.creditos.map((credito) => (
                            <tr key={credito.id}>
                              <td><strong>{credito.consecutivo}</strong></td>
                              <td>{credito.producto}</td>
                              <td>{new Date(credito.fecha).toLocaleDateString('es-CO')}</td>
                              <td>{formatMoney(credito.monto)}</td>
                              <td>{credito.plazo} meses</td>
                              <td><span className={`credit-status-badge status-${credito.estado.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{credito.estado.replaceAll('_', ' ')}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-credit-state">
                      <strong>Aun no tienes solicitudes</strong>
                      <span>Cuando simules y envies un credito, podras seguir su estado desde aqui.</span>
                    </div>
                  )}
                </div>
              </section>
              <div className="new-credit-heading">
                <span className="section-kicker">Nueva operacion</span>
                <h2>Solicitar credito</h2>
              </div>
              <div className="portal-credit-layout">
                <div className="credit-data-panel">
                  <div className="credit-panel-heading">
                    <span className="credit-panel-icon">₵</span>
                    <div><h3>Datos del credito</h3><p>Configura el monto y plazo para conocer tu cuota.</p></div>
                  </div>
                  <label className="field-label">Linea de credito *</label>
                  <select value={portalCreditoForm.idProductoCredito} onChange={(event) => { setPortalCreditoForm((current) => ({ ...current, idProductoCredito: event.target.value })); setPortalSimulacion(null); }}>
                    <option value="">Selecciona un producto</option>
                    {portalProductos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
                  </select>
                  {selectedPortalProducto && (
                    <div className="product-limits">
                      <span>Desde <strong>{formatMoney(selectedPortalProducto.montoMinimo)}</strong></span>
                      <span>Hasta <strong>{formatMoney(selectedPortalProducto.montoMaximo)}</strong></span>
                      <span>Plazo <strong>{selectedPortalProducto.plazoMinimo}-{selectedPortalProducto.plazoMaximo} meses</strong></span>
                    </div>
                  )}
                  <label className="field-label">¿Cuanto dinero necesitas? *</label>
                  <input type="number" min={selectedPortalProducto?.montoMinimo ?? 0} max={selectedPortalProducto?.montoMaximo ?? undefined} value={portalCreditoForm.montoSolicitado} onChange={(event) => { setPortalCreditoForm((current) => ({ ...current, montoSolicitado: event.target.value })); setPortalSimulacion(null); }} placeholder="Monto solicitado" />
                  <label className="field-label">¿A cuantos meses? *</label>
                  <select value={portalCreditoForm.plazo} onChange={(event) => { setPortalCreditoForm((current) => ({ ...current, plazo: event.target.value })); setPortalSimulacion(null); }}>
                    <option value="">Selecciona el plazo</option>
                    {monthOptions
                      .filter((month) => !selectedPortalProducto || (month >= (selectedPortalProducto.plazoMinimo ?? 1) && month <= (selectedPortalProducto.plazoMaximo ?? 60)))
                      .map((month) => <option key={month} value={month}>{month} meses</option>)}
                  </select>
                  <label className="field-label">Codigo del vendedor <span>(opcional)</span></label>
                  <input value={portalCreditoForm.codigoVendedor} onChange={(event) => { setPortalCreditoForm((current) => ({ ...current, codigoVendedor: event.target.value.toUpperCase() })); setPortalSimulacion(null); }} placeholder="Ej. VEN-001" />
                  <label className="terms-check">
                    <input type="checkbox" checked={portalCreditoForm.aceptaTerminos} onChange={(event) => setPortalCreditoForm((current) => ({ ...current, aceptaTerminos: event.target.checked }))} />
                    <span>He leido y acepto los <u>terminos y condiciones</u>.</span>
                  </label>
                  <button type="button" disabled={loading || !portalCreditoForm.idProductoCredito || !portalCreditoForm.montoSolicitado || !portalCreditoForm.plazo} onClick={handlePortalSimularCredito}>
                    {loading ? 'Calculando...' : portalSimulacion ? 'Volver a simular' : 'Simular credito'}
                  </button>
                </div>

                <aside className="credit-summary-panel">
                  <div className="credit-panel-heading">
                    <span className="credit-panel-icon">▤</span>
                    <div><h3>Resumen</h3><p>Estimacion antes de continuar.</p></div>
                  </div>
                  <div className="estimated-payment">
                    <span>Cuota estimada</span>
                    <strong>{portalSimulacion ? formatMoney(portalSimulacion.resumen.cuotaEstimada) : '--'}</strong>
                  </div>
                  <dl className="credit-summary-list">
                    <div><dt>Linea</dt><dd>{selectedPortalProducto?.nombre ?? 'Sin seleccionar'}</dd></div>
                    <div><dt>Desembolso</dt><dd>{portalSimulacion ? formatMoney(portalSimulacion.resumen.valorDesembolso) : '--'}</dd></div>
                    <div><dt>Valor credito</dt><dd>{portalSimulacion ? formatMoney(portalSimulacion.resumen.valorCredito) : '--'}</dd></div>
                    <div><dt>Plazo</dt><dd>{portalSimulacion ? `${portalCreditoForm.plazo} cuotas` : '--'}</dd></div>
                    <div><dt>Tasa mensual</dt><dd>{portalSimulacion ? `${portalSimulacion.resumen.tasaMensual}%` : '--'}</dd></div>
                  </dl>
                  <button type="button" className="details-button" disabled={!portalSimulacion} onClick={() => setPortalDetalleVisible((current) => !current)}>
                    {portalDetalleVisible ? 'Ver menos detalles' : 'Ver mas detalles'}
                  </button>
                  <p className="credit-disclaimer">La cuota puede variar segun validacion, fechas de pago y condiciones aprobadas.</p>
                  <button type="button" disabled={loading || !portalSimulacion || !portalCreditoForm.aceptaTerminos} onClick={handlePortalCrearSolicitud}>Enviar solicitud</button>
                </aside>
              </div>
              {portalSimulacion && portalDetalleVisible && (
                <div className="credit-details-panel">
                  <div className="surface-title"><h3>Detalle de la simulacion</h3><span>{portalSimulacion.plan.length} cuotas</span></div>
                  <div className="detail-values">
                    {portalSimulacion.atributos.map((item) => <div key={item.id}><span>{item.nombre}</span><strong>{formatMoney(item.valorCalculado)}</strong></div>)}
                    <div><span>Total a pagar</span><strong>{formatMoney(portalSimulacion.resumen.totalPagar)}</strong></div>
                  </div>
                  <div className="surface-title compact-title"><h3>Plan de amortizacion</h3></div>
                  <div className="table-wrap amortization-table">
                    <table>
                      <thead><tr><th>No.</th><th>Saldo inicial</th><th>Capital</th><th>Interes</th><th>Cuota</th><th>Saldo final</th></tr></thead>
                      <tbody>{portalSimulacion.plan.map((item) => <tr key={item.numero}><td>{item.numero}</td><td>{formatMoney(item.saldoInicial)}</td><td>{formatMoney(item.capital)}</td><td>{formatMoney(item.interes)}</td><td>{formatMoney(item.cuota)}</td><td>{formatMoney(item.saldoFinal)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="portal-card">
              <div className="config-tabs">
                <button type="button" className={portalMode === 'registro' ? 'tab-button active' : 'tab-button'} onClick={() => setPortalMode('registro')}>Registro</button>
                <button type="button" className={portalMode === 'login' ? 'tab-button active' : 'tab-button'} onClick={() => setPortalMode('login')}>Login</button>
                <button type="button" className={portalMode === 'forgot' || portalMode === 'reset' ? 'tab-button active' : 'tab-button'} onClick={() => setPortalMode('forgot')}>Olvide mi contrasena</button>
              </div>

              {portalMode === 'registro' ? (
                <form className="portal-form" onSubmit={handlePortalRegister}>
                  <div className="form-section">
                    <h3>Documento</h3>
                    <div className="field-grid two-cols">
                      <select value={portalRegisterForm.idTipoIdentificacion} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, idTipoIdentificacion: event.target.value }))}>
                        <option value="">Tipo documento</option>
                        {portalCatalogs.tiposIdentificacion.map((item) => <option key={item.id} value={item.id}>{item.sigla} - {item.descripcion}</option>)}
                      </select>
                      <input value={portalRegisterForm.identificacion} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, identificacion: event.target.value }))} placeholder="Numero de identificacion *" />
                    </div>
                  </div>
                  <div className="form-section">
                    <h3>Datos personales</h3>
                    <div className="field-grid two-cols">
                      <input value={portalRegisterForm.primerNombre} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, primerNombre: event.target.value }))} placeholder="Primer nombre *" />
                      <input value={portalRegisterForm.segundoNombre} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, segundoNombre: event.target.value }))} placeholder="Segundo nombre" />
                      <input value={portalRegisterForm.primerApellido} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, primerApellido: event.target.value }))} placeholder="Primer apellido" />
                      <input value={portalRegisterForm.segundoApellido} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, segundoApellido: event.target.value }))} placeholder="Segundo apellido" />
                      <input value={portalRegisterForm.telefono} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Telefono" />
                      <input value={portalRegisterForm.correo} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo electronico *" />
                      <input type="password" autoComplete="new-password" value={portalRegisterForm.password} onChange={(event) => setPortalRegisterForm((current) => ({ ...current, password: event.target.value }))} placeholder="Contrasena *" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrarse'}</button>
                </form>
              ) : portalMode === 'login' ? (
                <form className="portal-form" onSubmit={handlePortalLogin}>
                  <div className="field-grid">
                    <input value={portalLoginForm.identificacion} onChange={(event) => setPortalLoginForm((current) => ({ ...current, identificacion: event.target.value }))} placeholder="Identificacion o correo" />
                    <input type="password" autoComplete="current-password" value={portalLoginForm.password} onChange={(event) => setPortalLoginForm((current) => ({ ...current, password: event.target.value }))} placeholder="Contrasena" />
                    <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                  </div>
                </form>
              ) : portalMode === 'forgot' ? (
                <form className="portal-form" onSubmit={handlePortalForgotPassword}>
                  <div className="form-section clean">
                    <h3>Recuperar contrasena</h3>
                    <p className="muted-note">Escribe el correo registrado y enviaremos un enlace para cambiar tu contrasena.</p>
                    <input value={portalForgotForm.correo} onChange={(event) => setPortalForgotForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo electronico" />
                    <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</button>
                  </div>
                </form>
              ) : portalMode === 'reset' ? (
                <form className="portal-form" onSubmit={handlePortalResetPassword}>
                  <div className="form-section clean">
                    <h3>Nueva contrasena</h3>
                    <input value={portalForgotForm.token} onChange={(event) => setPortalForgotForm((current) => ({ ...current, token: event.target.value }))} placeholder="Token de recuperacion" />
                    <input type="password" autoComplete="new-password" value={portalForgotForm.password} onChange={(event) => setPortalForgotForm((current) => ({ ...current, password: event.target.value }))} placeholder="Nueva contrasena" />
                    <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Actualizar contrasena'}</button>
                  </div>
                </form>
              ) : (
                <div className="portal-form">
                  <div className="form-section clean">
                    <h3>Activando cuenta</h3>
                    <p className="muted-note">{loading ? 'Estamos validando tu enlace de activacion.' : 'Si el enlace es valido, tu cuenta quedara activa en unos segundos.'}</p>
                  </div>
                </div>
              )}
            </section>
          )}
          {message && <p className="form-message">{message}</p>}
        </section>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-screen">
        <section className="login-panel">
          <div className="login-brand">
            <span>Creditos App</span>
            <h1>Gestion de creditos y accesos</h1>
            <p>Seguridad, empresas, creditos, cartera e inversionistas desde una base modular.</p>
            <strong>{apiStatus}</strong>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <h2>Iniciar sesion</h2>
            <div className="theme-toolbar login-theme-toolbar">
              <div className="mode-switch" aria-label="Modo de visualizacion">
                <button
                  type="button"
                  className={themeMode === 'light' ? 'mode-button active' : 'mode-button'}
                  onClick={() => setThemeMode('light')}
                >
                  Dia
                </button>
                <button
                  type="button"
                  className={themeMode === 'dark' ? 'mode-button active' : 'mode-button'}
                  onClick={() => setThemeMode('dark')}
                >
                  Noche
                </button>
              </div>
              <select value={paletteKey} onChange={(event) => setPaletteKey(event.target.value as PaletteKey)}>
                {(Object.entries(palettes) as Array<[PaletteKey, Palette]>).map(([key, palette]) => (
                  <option key={key} value={key}>{palette.name}</option>
                ))}
              </select>
            </div>
            <label>
              Usuario o correo
              <input
                value={authForm.username}
                onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="admin o correo@dominio.com"
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="********"
              />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
            <p className="message-line">{message}</p>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="side-nav">
        <div className="brand-block">
          <span className="brand-mark">CA</span>
          <div>
            <strong>Creditos App</strong>
            <small>Panel administrativo</small>
          </div>
        </div>

        <nav className="module-nav">
          <button
            type="button"
            className={view === 'dashboard' ? 'module-link active' : 'module-link'}
            onClick={() => setView('dashboard')}
          >
            <span>DB</span>
            Dashboard
          </button>
          {visibleUserModules.map((module) => (
            <button
              key={module.id}
              type="button"
              className={view === `modulo:${module.id}` ? 'module-link active' : 'module-link'}
              onClick={() => setView(`modulo:${module.id}`)}
            >
              <span>{moduleCode(module.nombre)}</span>
              {module.nombre}
            </button>
          ))}
          <div className="nav-divider">Seguridad</div>
          <button
            type="button"
            className={view === 'usuarios' ? 'module-link active' : 'module-link'}
            onClick={() => setView('usuarios')}
          >
            <span>US</span>
            Usuarios
          </button>
          <button
            type="button"
            className={view === 'configuracion' ? 'module-link active' : 'module-link'}
            onClick={() => setView('configuracion')}
          >
            <span>CF</span>
            Configuracion
          </button>
        </nav>

        <div className="user-card">
          <span className="avatar">{initials(activeUser?.fullName)}</span>
          <div>
            <strong>{activeUser?.fullName}</strong>
            <small>{activeUser?.roles.join(' / ') || 'Sin roles'}</small>
          </div>
          <button type="button" className="ghost-button" onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <span className="section-kicker">{pageKicker}</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="header-actions">
            <div className="theme-toolbar">
              <div className="mode-switch" aria-label="Modo de visualizacion">
                <button
                  type="button"
                  className={themeMode === 'light' ? 'mode-button active' : 'mode-button'}
                  onClick={() => setThemeMode('light')}
                >
                  Dia
                </button>
                <button
                  type="button"
                  className={themeMode === 'dark' ? 'mode-button active' : 'mode-button'}
                  onClick={() => setThemeMode('dark')}
                >
                  Noche
                </button>
              </div>
              <select value={paletteKey} onChange={(event) => setPaletteKey(event.target.value as PaletteKey)}>
                {(Object.entries(palettes) as Array<[PaletteKey, Palette]>).map(([key, palette]) => (
                  <option key={key} value={key}>{palette.name}</option>
                ))}
              </select>
            </div>
            <div className="status-pill">{apiStatus}</div>
          </div>
        </header>

        <section className="metrics-strip">
          {overview.map((item) => (
            <div key={item.label} className="metric-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        {view === 'dashboard' && (
          <section className="dashboard-view executive-dashboard">
            <div className="executive-heading">
              <div>
                <span className="section-kicker">Panel gerencial</span>
                <h2>Resumen financiero y comercial</h2>
                <p>Seguimiento consolidado de colocacion, capital, cartera y solicitudes.</p>
              </div>
              <div className="dashboard-filters">
                <label>Desde<input type="date" value={dashboardFilters.fechaInicio} onChange={(event) => setDashboardFilters((current) => ({ ...current, fechaInicio: event.target.value }))} /></label>
                <label>Hasta<input type="date" value={dashboardFilters.fechaFin} onChange={(event) => setDashboardFilters((current) => ({ ...current, fechaFin: event.target.value }))} /></label>
                <button type="button" onClick={reloadDashboard}>Aplicar</button>
              </div>
            </div>

            <div className="executive-kpis">
              <article><span>Solicitudes</span><strong>{dashboard?.indicadores.solicitudes ?? 0}</strong><small>Operaciones radicadas</small></article>
              <article><span>Monto solicitado</span><strong>{formatMoney(dashboard?.indicadores.montoSolicitado)}</strong><small>Colocacion acumulada</small></article>
              <article><span>Capital inversionistas</span><strong>{formatMoney(dashboard?.indicadores.capitalInversionistas)}</strong><small>Recursos registrados</small></article>
              <article><span>Saldo de cartera</span><strong>{formatMoney(dashboard?.indicadores.saldoCartera)}</strong><small>Capital pendiente</small></article>
              <article><span>Recaudo registrado</span><strong>{formatMoney(dashboard?.indicadores.recaudo)}</strong><small>Pagos aplicados</small></article>
              <article><span>Cartera vencida</span><strong>{formatMoney(dashboard?.indicadores.carteraVencida)}</strong><small>Cuotas vencidas/en mora</small></article>
              <article><span>Proximos 15 dias</span><strong>{formatMoney(dashboard?.indicadores.proximosVencimientos)}</strong><small>Vencimientos cercanos</small></article>
              <article><span>Recaudo hoy</span><strong>{formatMoney(dashboard?.indicadores.recaudoHoy)}</strong><small>Aplicado del dia</small></article>
              <article><span>Recaudo mes</span><strong>{formatMoney(dashboard?.indicadores.recaudoMes)}</strong><small>Aplicado del mes</small></article>
              <article><span>Saldos a favor</span><strong>{formatMoney(dashboard?.indicadores.saldoFavor)}</strong><small>Excedentes registrados</small></article>
            </div>

            <div className="executive-chart-grid">
              <section className="surface chart-panel chart-wide">
                <div className="surface-title"><div><span className="section-kicker">Tendencia</span><h2>Colocacion mensual</h2></div><span>{dashboard?.mensual.length ?? 0} periodos</span></div>
                <div className="chart-frame">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.mensual ?? []}>
                      <defs><linearGradient id="creditArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35}/><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="periodo" />
                      <YAxis tickFormatter={(value) => `$${Math.round(Number(value) / 1000000)}M`} />
                      <Tooltip formatter={(value) => formatMoney(Number(value))} />
                      <Area type="monotone" dataKey="monto" name="Monto" stroke="var(--color-primary)" strokeWidth={3} fill="url(#creditArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="surface chart-panel">
                <div className="surface-title"><div><span className="section-kicker">Pipeline</span><h2>Solicitudes por estado</h2></div></div>
                <div className="chart-frame">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboard?.estados ?? []} dataKey="cantidad" nameKey="estado" innerRadius={54} outerRadius={82} paddingAngle={3}>
                        {(dashboard?.estados ?? []).map((item, index) => <Cell key={item.estado} fill={['#1479c9', '#18a779', '#f2a900', '#d84a58', '#7b61a8'][index % 5]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="surface chart-panel">
                <div className="surface-title"><div><span className="section-kicker">Portafolio</span><h2>Productos colocados</h2></div></div>
                <div className="chart-frame">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard?.productos ?? []} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => `$${Math.round(Number(value) / 1000000)}M`} />
                      <YAxis type="category" dataKey="producto" width={110} />
                      <Tooltip formatter={(value) => formatMoney(Number(value))} />
                      <Bar dataKey="monto" name="Monto" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="surface chart-panel chart-wide">
                <div className="surface-title"><div><span className="section-kicker">Concentracion</span><h2>Ranking de empresas</h2></div><span>Por monto solicitado</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Empresa</th><th>Solicitudes</th><th>Monto</th><th>Participacion</th></tr></thead>
                    <tbody>{(dashboard?.empresas ?? []).map((empresa, index) => {
                      const total = dashboard?.indicadores.montoSolicitado || 1;
                      return <tr key={empresa.empresa}><td>{index + 1}</td><td><strong>{empresa.empresa}</strong></td><td>{empresa.cantidad}</td><td>{formatMoney(empresa.monto)}</td><td><div className="share-cell"><span style={{ width: `${Math.min((empresa.monto / total) * 100, 100)}%` }} /><strong>{((empresa.monto / total) * 100).toFixed(1)}%</strong></div></td></tr>;
                    })}</tbody>
                  </table>
                </div>
              </section>

              <section className="surface chart-panel chart-wide">
                <div className="surface-title"><div><span className="section-kicker">Cartera</span><h2>Vencida y en mora</h2></div><span>{dashboard?.cartera.vencida.length ?? 0} creditos</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Credito</th><th>Cliente</th><th>Empresa</th><th>Vence</th><th>Dias mora</th><th>Saldo</th></tr></thead>
                    <tbody>{(dashboard?.cartera.vencida ?? []).map((item) => (
                      <tr key={`${item.credito}-${item.fechaVencimiento}`}><td>{item.credito}</td><td>{item.cliente}</td><td>{item.empresa}</td><td>{item.fechaVencimiento}</td><td>{item.diasMora}</td><td>{formatMoney(item.saldo)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section className="surface chart-panel chart-wide">
                <div className="surface-title"><div><span className="section-kicker">Agenda</span><h2>Proximos vencimientos</h2></div><span>15 dias</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Credito</th><th>Cliente</th><th>Producto</th><th>Vencimiento</th><th>Saldo</th></tr></thead>
                    <tbody>{(dashboard?.cartera.proximosVencimientos ?? []).map((item) => (
                      <tr key={`${item.credito}-${item.fechaVencimiento}`}><td>{item.credito}</td><td>{item.cliente}</td><td>{item.producto}</td><td>{item.fechaVencimiento}</td><td>{formatMoney(item.saldo)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section className="surface chart-panel">
                <div className="surface-title"><div><span className="section-kicker">Recaudo</span><h2>Mensual</h2></div></div>
                <div className="chart-frame">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard?.cartera.recaudoMensual ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="periodo" />
                      <YAxis tickFormatter={(value) => `$${Math.round(Number(value) / 1000000)}M`} />
                      <Tooltip formatter={(value) => formatMoney(Number(value))} />
                      <Bar dataKey="valor" name="Recaudo" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="surface chart-panel chart-wide">
                <div className="surface-title"><div><span className="section-kicker">Cortes de cartera</span><h2>Empresa, producto y socio</h2></div></div>
                <div className="triple-report-grid">
                  {[
                    ['Empresa', dashboard?.cartera.porEmpresa ?? []],
                    ['Producto', dashboard?.cartera.porProducto ?? []],
                    ['Socio fondeador', dashboard?.cartera.porSocio ?? []]
                  ].map(([title, rows]) => (
                    <div className="mini-report" key={String(title)}>
                      <h3>{String(title)}</h3>
                      {(rows as Array<{ nombre: string; cantidad: number; saldo: number; vencido?: number }>).slice(0, 5).map((item) => (
                        <div className="mini-report-row" key={item.nombre}>
                          <span>{item.nombre}<small>{item.cantidad} creditos</small></span>
                          <strong>{formatMoney(item.saldo)}</strong>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}

        {selectedModule && isEmpresasModule && (
          <section className="pagadurias-view">
            <div className="config-tabs">
              {(['registro', 'directorio', 'empleados'] as EmpresaTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={empresaTab === tab ? 'tab-button active' : 'tab-button'}
                  onClick={() => setEmpresaTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {empresaTab === 'registro' && (
            <form className="surface pagaduria-form" onSubmit={handleCreateEmpresa}>
              <div className="surface-title">
                <h2>Crear empresa</h2>
                <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar empresa'}</button>
              </div>

              <div className="form-section">
                <h3>Informacion general</h3>
                <div className="field-grid four-cols">
                  <input value={empresaForm.nit} onChange={(event) => setEmpresaForm((current) => ({ ...current, nit: event.target.value }))} placeholder="NIT *" />
                  <input value={empresaForm.razonSocial} onChange={(event) => setEmpresaForm((current) => ({ ...current, razonSocial: event.target.value }))} placeholder="Razon social *" />
                  <input value={empresaForm.vendedor} onChange={(event) => setEmpresaForm((current) => ({ ...current, vendedor: event.target.value }))} placeholder="Vendedor" />
                  <input value={empresaForm.domicilio} onChange={(event) => setEmpresaForm((current) => ({ ...current, domicilio: event.target.value }))} placeholder="Domicilio" />
                  <input value={empresaForm.correo} onChange={(event) => setEmpresaForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo" />
                  <input value={empresaForm.telefono} onChange={(event) => setEmpresaForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Telefono" />
                  <input value={empresaForm.codigo} onChange={(event) => setEmpresaForm((current) => ({ ...current, codigo: event.target.value }))} placeholder="Codigo" />
                  <input value={empresaForm.naturaleza} onChange={(event) => setEmpresaForm((current) => ({ ...current, naturaleza: event.target.value }))} placeholder="Naturaleza" />
                </div>
              </div>

              <div className="form-section">
                <h3>Representante y contacto</h3>
                <div className="field-grid four-cols">
                  <input value={empresaForm.representanteLegal} onChange={(event) => setEmpresaForm((current) => ({ ...current, representanteLegal: event.target.value }))} placeholder="Representante legal" />
                  <input value={empresaForm.tipoIdentificacionRepresentante} onChange={(event) => setEmpresaForm((current) => ({ ...current, tipoIdentificacionRepresentante: event.target.value }))} placeholder="D.I. representante" />
                  <input value={empresaForm.identificacionRepresentante} onChange={(event) => setEmpresaForm((current) => ({ ...current, identificacionRepresentante: event.target.value }))} placeholder="Identificacion representante" />
                  <input value={empresaForm.telefonoRepresentante} onChange={(event) => setEmpresaForm((current) => ({ ...current, telefonoRepresentante: event.target.value }))} placeholder="Telefono representante" />
                  <input value={empresaForm.correoRepresentante} onChange={(event) => setEmpresaForm((current) => ({ ...current, correoRepresentante: event.target.value }))} placeholder="Correo representante" />
                  <input value={empresaForm.contactoCargo} onChange={(event) => setEmpresaForm((current) => ({ ...current, contactoCargo: event.target.value }))} placeholder="Cargo contacto" />
                  <input value={empresaForm.contactoNombre} onChange={(event) => setEmpresaForm((current) => ({ ...current, contactoNombre: event.target.value }))} placeholder="Nombre contacto" />
                  <input value={empresaForm.contactoCorreo} onChange={(event) => setEmpresaForm((current) => ({ ...current, contactoCorreo: event.target.value }))} placeholder="Correo contacto" />
                  <input value={empresaForm.contactoTelefono} onChange={(event) => setEmpresaForm((current) => ({ ...current, contactoTelefono: event.target.value }))} placeholder="Telefono contacto" />
                </div>
              </div>

              <div className="form-section">
                <h3>Direccion principal</h3>
                {!addressCatalogs.tiposVia.length && (
                  <div className="address-preview">No se han cargado los catalogos de direccion. Revisa la sesion o reinicia la API.</div>
                )}
                <div className="field-grid four-cols">
                  <select value={empresaForm.direccion.idTipoVia} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, idTipoVia: event.target.value } }))}>
                    <option value="">Tipo de via *</option>
                    {addressCatalogs.tiposVia.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input value={empresaForm.direccion.numPrincipal} onChange={(event) => updatePrincipalNumber(event.target.value)} placeholder="Numero principal, ej. 59B" />
                  <select value={empresaForm.direccion.idLetraPrincipal} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraPrincipal: event.target.value } }))}>
                    <option value="">Letra principal</option>
                    {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input value={empresaForm.direccion.bis} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, bis: event.target.value } }))} placeholder="Bis" />
                  <select value={empresaForm.direccion.letraBis} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, letraBis: event.target.value } }))}>
                    <option value="">Letra bis</option>
                    {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input value={empresaForm.direccion.cuadrantePrincipal} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, cuadrantePrincipal: event.target.value } }))} placeholder="Cuadrante principal" />
                  <input value={empresaForm.direccion.numSecundario} onChange={(event) => updateSecondaryNumber(event.target.value)} placeholder="Numero secundario, ej. 120A" />
                  <select value={empresaForm.direccion.idLetraSecundaria} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraSecundaria: event.target.value } }))}>
                    <option value="">Letra secundaria</option>
                    {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input value={empresaForm.direccion.cuadranteSecundario} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, cuadranteSecundario: event.target.value } }))} placeholder="Cuadrante secundario" />
                  <input value={empresaForm.direccion.complemento} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, complemento: event.target.value } }))} placeholder="Complemento" />
                  <input value={empresaForm.direccion.barrio} onChange={(event) => setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, barrio: event.target.value } }))} placeholder="Barrio" />
                  <div className="city-search" onBlur={() => window.setTimeout(() => setCityComboOpen(false), 120)}>
                    <input
                      value={citySearchValue}
                      onFocus={() => setCityComboOpen(true)}
                      onChange={(event) => {
                        setCitySearch(event.target.value);
                        setCityComboOpen(true);
                        setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: '' } }));
                      }}
                      placeholder="Ciudad *"
                    />
                    {cityComboOpen && (
                      <div className="city-results">
                        {(citySearchValue ? filteredCities : addressCatalogs.ciudades.slice(0, 25)).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setEmpresaForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: String(item.id) } }));
                              setCitySearch('');
                              setCityComboOpen(false);
                            }}
                          >
                            {item.nombre}
                          </button>
                        ))}
                        {citySearchValue && !filteredCities.length && <span>No hay coincidencias</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="address-preview">{selectedAddressText || 'La direccion se ira armando con los campos seleccionados.'}</div>
              </div>

              <div className="form-section">
                <h3>Calendario de nomina y libranza</h3>
                <div className="field-grid four-cols">
                  <select value={empresaForm.periodicidadNomina} onChange={(event) => setEmpresaForm((current) => ({ ...current, periodicidadNomina: event.target.value }))}>
                    <option value="MENSUAL">Nomina mensual</option>
                    <option value="QUINCENAL">Nomina quincenal</option>
                  </select>
                  <input value={empresaForm.diaCorteNomina} onChange={(event) => setEmpresaForm((current) => ({ ...current, diaCorteNomina: event.target.value }))} placeholder="Dia corte nomina" />
                  <input value={empresaForm.diaPagoNomina} onChange={(event) => setEmpresaForm((current) => ({ ...current, diaPagoNomina: event.target.value }))} placeholder="Dia pago nomina" />
                  <input value={empresaForm.segundoDiaPagoNomina} onChange={(event) => setEmpresaForm((current) => ({ ...current, segundoDiaPagoNomina: event.target.value }))} placeholder="Segundo dia pago" />
                  <input value={empresaForm.diaDescuentoLibranza} onChange={(event) => setEmpresaForm((current) => ({ ...current, diaDescuentoLibranza: event.target.value }))} placeholder="Dia descuento libranza" />
                  <label className="inline-check"><input type="checkbox" checked={empresaForm.ajustarFinSemana} onChange={(event) => setEmpresaForm((current) => ({ ...current, ajustarFinSemana: event.target.checked }))} />Ajustar fin de semana</label>
                  <input value={empresaForm.observacionCalendario} onChange={(event) => setEmpresaForm((current) => ({ ...current, observacionCalendario: event.target.value }))} placeholder="Observacion calendario" />
                </div>
              </div>

              <div className="form-section">
                <h3>Informacion financiera y camara de comercio</h3>
                <div className="field-grid four-cols">
                  <input type="date" value={empresaForm.fechaConstitucion} onChange={(event) => setEmpresaForm((current) => ({ ...current, fechaConstitucion: event.target.value }))} />
                  <input value={empresaForm.capitalSociedad} onChange={(event) => setEmpresaForm((current) => ({ ...current, capitalSociedad: event.target.value }))} placeholder="Capital de sociedad" />
                  <input type="date" value={empresaForm.fechaVenta} onChange={(event) => setEmpresaForm((current) => ({ ...current, fechaVenta: event.target.value }))} />
                  <input value={empresaForm.ventasFecha} onChange={(event) => setEmpresaForm((current) => ({ ...current, ventasFecha: event.target.value }))} placeholder="Ventas de la fecha" />
                  <input value={empresaForm.camaraNumero} onChange={(event) => setEmpresaForm((current) => ({ ...current, camaraNumero: event.target.value }))} placeholder="Camara numero" />
                  <input value={empresaForm.camaraLibro} onChange={(event) => setEmpresaForm((current) => ({ ...current, camaraLibro: event.target.value }))} placeholder="Libro" />
                  <input value={empresaForm.camaraCiudad} onChange={(event) => setEmpresaForm((current) => ({ ...current, camaraCiudad: event.target.value }))} placeholder="Ciudad camara" />
                </div>
              </div>
            </form>
            )}

            {empresaTab === 'directorio' && (
            <section className="content-grid pagaduria-grid">
              <aside className="surface pagaduria-list">
                <div className="surface-title">
                  <h2>Empresas</h2>
                  <span>{empresas.length} registros</span>
                </div>
                <div className="list-panel">
                  {empresas.map((empresa) => (
                    <button
                      key={empresa.id}
                      type="button"
                      className={selectedEmpresaId === empresa.id ? 'company-row active' : 'company-row'}
                      onClick={() => setSelectedEmpresaId(empresa.id)}
                    >
                      <strong>{empresa.razonSocial}</strong>
                      <span>{empresa.nit} · {empresa.empleados} empleados</span>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="surface company-detail">
                <div className="surface-title">
                  <h2>{selectedEmpresa?.razonSocial ?? 'Detalle de empresa'}</h2>
                  <span>{selectedEmpresa?.estado ?? 'Sin seleccion'}</span>
                </div>
                {selectedEmpresa ? (
                  <div className="detail-sections">
                    <div className="detail-section">
                      <h3>Informacion general</h3>
                      <div className="detail-grid">
                        <p><strong>Nit:</strong> {selectedEmpresa.nit}</p>
                        <p><strong>Razon social:</strong> {selectedEmpresa.razonSocial}</p>
                        <p><strong>Vendedor:</strong> {selectedEmpresa.vendedor ?? '-'}</p>
                        <p><strong>Direccion:</strong> {selectedEmpresa.direccionCompuesta ?? selectedEmpresa.domicilio ?? '-'}</p>
                        <p><strong>Correo:</strong> {selectedEmpresa.correo ?? '-'}</p>
                        <p><strong>Telefono:</strong> {selectedEmpresa.telefono ?? '-'}</p>
                        <p><strong>Codigo:</strong> {selectedEmpresa.codigo ?? '-'}</p>
                      </div>
                    </div>
                    <div className="detail-section">
                      <h3>Contactos</h3>
                      <div className="detail-grid">
                        <p><strong>Cargo:</strong> {selectedEmpresa.contactoCargo ?? '-'}</p>
                        <p><strong>Nombre:</strong> {selectedEmpresa.contactoNombre ?? '-'}</p>
                        <p><strong>Correo:</strong> {selectedEmpresa.contactoCorreo ?? '-'}</p>
                        <p><strong>Telefono:</strong> {selectedEmpresa.contactoTelefono ?? '-'}</p>
                      </div>
                    </div>
                    <div className="detail-section">
                      <h3>Informacion financiera</h3>
                      <div className="detail-grid">
                        <p><strong>Fecha constitucion:</strong> {selectedEmpresa.fechaConstitucion ?? '-'}</p>
                        <p><strong>Capital:</strong> {selectedEmpresa.capitalSociedad ?? '-'}</p>
                        <p><strong>Fecha venta:</strong> {selectedEmpresa.fechaVenta ?? '-'}</p>
                        <p><strong>Ventas:</strong> {selectedEmpresa.ventasFecha ?? '-'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="message-line">Selecciona una empresa para ver el detalle.</p>
                )}
              </section>
            </section>
            )}

            {empresaTab === 'empleados' && (
            <section className="surface employees-panel">
              <div className="surface-title">
                <h2>Empleados de la empresa</h2>
                <span>{empleadosEmpresa.length} empleados</span>
              </div>
              <form className="employee-form" onSubmit={handleCreateEmpleado}>
                <select value={empleadoForm.idTipoIdentificacion} onChange={(event) => setEmpleadoForm((current) => ({ ...current, idTipoIdentificacion: event.target.value }))}>
                  <option value="">Tipo documento</option>
                  {identificationTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.sigla} - {type.descripcion}</option>
                  ))}
                </select>
                <input value={empleadoForm.identificacion} onChange={(event) => setEmpleadoForm((current) => ({ ...current, identificacion: event.target.value }))} placeholder="Identificacion" />
                <input value={empleadoForm.primerNombre} onChange={(event) => setEmpleadoForm((current) => ({ ...current, primerNombre: event.target.value }))} placeholder="Primer nombre" />
                <input value={empleadoForm.segundoNombre} onChange={(event) => setEmpleadoForm((current) => ({ ...current, segundoNombre: event.target.value }))} placeholder="Segundo nombre" />
                <input value={empleadoForm.primerApellido} onChange={(event) => setEmpleadoForm((current) => ({ ...current, primerApellido: event.target.value }))} placeholder="Primer apellido" />
                <input value={empleadoForm.segundoApellido} onChange={(event) => setEmpleadoForm((current) => ({ ...current, segundoApellido: event.target.value }))} placeholder="Segundo apellido" />
                <input value={empleadoForm.correo} onChange={(event) => setEmpleadoForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo" />
                <input value={empleadoForm.telefono} onChange={(event) => setEmpleadoForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Telefono" />
                <input value={empleadoForm.cargo} onChange={(event) => setEmpleadoForm((current) => ({ ...current, cargo: event.target.value }))} placeholder="Cargo" />
                <select value={empleadoForm.idTipoContrato} onChange={(event) => setEmpleadoForm((current) => ({ ...current, idTipoContrato: event.target.value }))}>
                  <option value="">Tipo de contrato</option>
                  {employeeCatalogs.tiposContrato.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <input value={empleadoForm.salario} onChange={(event) => setEmpleadoForm((current) => ({ ...current, salario: event.target.value }))} placeholder="Salario" />
                <select value={empleadoForm.idBanco} onChange={(event) => setEmpleadoForm((current) => ({ ...current, idBanco: event.target.value }))}>
                  <option value="">Entidad bancaria</option>
                  {employeeCatalogs.bancos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <select value={empleadoForm.idTipoCuenta} onChange={(event) => setEmpleadoForm((current) => ({ ...current, idTipoCuenta: event.target.value }))}>
                  <option value="">Tipo de cuenta</option>
                  {employeeCatalogs.tiposCuenta.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <input value={empleadoForm.cuentaNomina} onChange={(event) => setEmpleadoForm((current) => ({ ...current, cuentaNomina: event.target.value }))} placeholder="Cuenta de nomina" />
                <label className="inline-check">
                  <input type="checkbox" checked={empleadoForm.tieneEmbargos} onChange={(event) => setEmpleadoForm((current) => ({ ...current, tieneEmbargos: event.target.checked }))} />
                  Tiene embargos
                </label>
                <select value={empleadoForm.idEstadoCivil} onChange={(event) => setEmpleadoForm((current) => ({ ...current, idEstadoCivil: event.target.value }))}>
                  <option value="">Estado civil</option>
                  {employeeCatalogs.estadosCivil.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <input value={empleadoForm.personasCargo} onChange={(event) => setEmpleadoForm((current) => ({ ...current, personasCargo: event.target.value }))} placeholder="Personas a cargo" />
                <select value={empleadoForm.idTipoVivienda} onChange={(event) => setEmpleadoForm((current) => ({ ...current, idTipoVivienda: event.target.value }))}>
                  <option value="">Tipo de vivienda</option>
                  {employeeCatalogs.tiposVivienda.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <input type="date" value={empleadoForm.fechaIngreso} onChange={(event) => setEmpleadoForm((current) => ({ ...current, fechaIngreso: event.target.value }))} />
                <button type="submit" disabled={!selectedEmpresaId || loading}>Guardar empleado</button>
              </form>

              <div className="bulk-box">
                <textarea
                  value={bulkEmployeesText}
                  onChange={(event) => setBulkEmployeesText(event.target.value)}
                  placeholder="idTipoIdentificacion,identificacion,primerNombre,segundoNombre,primerApellido,segundoApellido,correo,telefono,cargo,idTipoContrato,salario,idBanco,idTipoCuenta,cuentaNomina,tieneEmbargos,idEstadoCivil,personasCargo,idTipoVivienda,fechaIngreso"
                />
                <button type="button" onClick={handleBulkEmployees} disabled={!selectedEmpresaId || !bulkEmployeesText.trim() || loading}>Cargar empleados CSV</button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Identificacion</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Cargo</th>
                      <th>Contrato</th>
                      <th>Banco</th>
                      <th>Cuenta</th>
                      <th>Embargos</th>
                      <th>Estado civil</th>
                      <th>Personas a cargo</th>
                      <th>Vivienda</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosEmpresa.map((empleado) => (
                      <tr key={empleado.id}>
                        <td>{empleado.identificacion}</td>
                        <td>{empleado.nombreCompleto}</td>
                        <td>{empleado.correo ?? '-'}</td>
                        <td>{empleado.cargo ?? '-'}</td>
                        <td>{empleado.tipoContrato ?? '-'}</td>
                        <td>{empleado.banco ?? '-'}</td>
                        <td>{empleado.cuentaNomina ?? '-'}</td>
                        <td>{empleado.tieneEmbargos ? 'Si' : 'No'}</td>
                        <td>{empleado.estadoCivil ?? '-'}</td>
                        <td>{empleado.personasCargo ?? 0}</td>
                        <td>{empleado.tipoVivienda ?? '-'}</td>
                        <td>{empleado.estado ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            )}
          </section>
        )}

        {selectedModule && isSociosModule && (
          <section className="socios-view">
            <div className="config-tabs">
              {(['registro', 'directorio', 'inversiones'] as SociosTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={sociosTab === tab ? 'tab-button active' : 'tab-button'}
                  onClick={() => setSociosTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {sociosTab === 'registro' && (
              <form className="surface pagaduria-form" onSubmit={handleCreateSocio}>
                <div className="surface-title">
                  <h2>Crear socio</h2>
                  <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar socio'}</button>
                </div>
                <div className="form-section">
                  <h3>Informacion general</h3>
                  <div className="field-grid four-cols">
                    <select value={socioForm.idTipoIdentificacion} onChange={(event) => setSocioForm((current) => ({ ...current, idTipoIdentificacion: event.target.value }))}>
                      <option value="">Tipo documento *</option>
                      {identificationTypes.map((type) => <option key={type.id} value={type.id}>{type.sigla} - {type.descripcion}</option>)}
                    </select>
                    <input value={socioForm.identificacion} onChange={(event) => setSocioForm((current) => ({ ...current, identificacion: event.target.value }))} placeholder="Identificacion *" />
                    <input value={socioForm.primerNombre} onChange={(event) => setSocioForm((current) => ({ ...current, primerNombre: event.target.value }))} placeholder="Primer nombre *" />
                    <input value={socioForm.segundoNombre} onChange={(event) => setSocioForm((current) => ({ ...current, segundoNombre: event.target.value }))} placeholder="Segundo nombre" />
                    <input value={socioForm.primerApellido} onChange={(event) => setSocioForm((current) => ({ ...current, primerApellido: event.target.value }))} placeholder="Primer apellido *" />
                    <input value={socioForm.segundoApellido} onChange={(event) => setSocioForm((current) => ({ ...current, segundoApellido: event.target.value }))} placeholder="Segundo apellido" />
                    <input value={socioForm.telefono} onChange={(event) => setSocioForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Telefono *" />
                    <input value={socioForm.correo} onChange={(event) => setSocioForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo *" />
                    <input type="date" value={socioForm.fechaNacimiento} onChange={(event) => setSocioForm((current) => ({ ...current, fechaNacimiento: event.target.value }))} />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Direccion principal</h3>
                  <div className="field-grid four-cols">
                    <select value={socioForm.direccion.idTipoVia} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, idTipoVia: event.target.value } }))}>
                      <option value="">Tipo de via *</option>
                      {addressCatalogs.tiposVia.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={socioForm.direccion.numPrincipal} onChange={(event) => updateSocioPrincipalNumber(event.target.value)} placeholder="Numero principal, ej. 59B" />
                    <select value={socioForm.direccion.idLetraPrincipal} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraPrincipal: event.target.value } }))}>
                      <option value="">Letra principal</option>
                      {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={socioForm.direccion.bis} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, bis: event.target.value } }))} placeholder="Bis" />
                    <select value={socioForm.direccion.letraBis} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, letraBis: event.target.value } }))}>
                      <option value="">Letra bis</option>
                      {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={socioForm.direccion.cuadrantePrincipal} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, cuadrantePrincipal: event.target.value } }))} placeholder="Cuadrante principal" />
                    <input value={socioForm.direccion.numSecundario} onChange={(event) => updateSocioSecondaryNumber(event.target.value)} placeholder="Numero secundario, ej. 120A" />
                    <select value={socioForm.direccion.idLetraSecundaria} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraSecundaria: event.target.value } }))}>
                      <option value="">Letra secundaria</option>
                      {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={socioForm.direccion.cuadranteSecundario} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, cuadranteSecundario: event.target.value } }))} placeholder="Cuadrante secundario" />
                    <input value={socioForm.direccion.complemento} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, complemento: event.target.value } }))} placeholder="Complemento" />
                    <input value={socioForm.direccion.barrio} onChange={(event) => setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, barrio: event.target.value } }))} placeholder="Barrio" />
                    <div
                      className="city-search"
                      onBlur={() => window.setTimeout(() => {
                        const typedCity = socioCitySearch.trim().toLowerCase();
                        const matchedCity = typedCity
                          ? addressCatalogs.ciudades.find((item) => item.nombre.trim().toLowerCase() === typedCity)
                          : null;
                        if (matchedCity) {
                          setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: String(matchedCity.id) } }));
                          setSocioCitySearch('');
                        }
                        setSocioCityComboOpen(false);
                      }, 120)}
                    >
                      <input
                        value={socioCitySearchValue}
                        onFocus={() => setSocioCityComboOpen(true)}
                        onChange={(event) => {
                          setSocioCitySearch(event.target.value);
                          setSocioCityComboOpen(true);
                          setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: '' } }));
                        }}
                        placeholder="Ciudad *"
                      />
                      {socioCityComboOpen && (
                        <div className="city-results">
                          {(socioCitySearchValue ? filteredSocioCities : addressCatalogs.ciudades.slice(0, 25)).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setSocioForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: String(item.id) } }));
                                setSocioCitySearch('');
                                setSocioCityComboOpen(false);
                              }}
                            >
                              {item.nombre}
                            </button>
                          ))}
                          {socioCitySearchValue && !filteredSocioCities.length && <span>No hay coincidencias</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="address-preview">{selectedSocioAddressText || 'La direccion del socio se ira armando con los campos seleccionados.'}</div>
                </div>

                <div className="form-section">
                  <h3>Informacion financiera</h3>
                  <div className="field-grid four-cols">
                    <select value={socioForm.idBanco} onChange={(event) => setSocioForm((current) => ({ ...current, idBanco: event.target.value }))}>
                      <option value="">Entidad bancaria</option>
                      {sociosCatalogs.bancos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <select value={socioForm.idTipoCuenta} onChange={(event) => setSocioForm((current) => ({ ...current, idTipoCuenta: event.target.value }))}>
                      <option value="">Tipo de cuenta</option>
                      {sociosCatalogs.tiposCuenta.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={socioForm.numeroCuenta} onChange={(event) => setSocioForm((current) => ({ ...current, numeroCuenta: event.target.value }))} placeholder="Cuenta de ahorros / bancaria" />
                  </div>
                </div>
              </form>
            )}

            {sociosTab === 'directorio' && (
              <section className="surface employees-panel">
                <div className="surface-title">
                  <h2>Socios</h2>
                  <span>{socios.length} registros</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Identificacion</th>
                        <th>Nombre</th>
                        <th>Contacto</th>
                        <th>Direccion</th>
                        <th>Cuenta</th>
                        <th>Inversiones</th>
                        <th>Monto invertido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socios.map((socio) => (
                        <tr key={socio.id} onClick={() => setSelectedSocioId(socio.id)}>
                          <td>{socio.tipoIdentificacion} {socio.identificacion}</td>
                          <td>{socio.nombreCompleto}</td>
                          <td>{socio.telefono}<br />{socio.correo}</td>
                          <td>{socio.direccionCompuesta || socio.direccion || socio.ciudad}</td>
                          <td>{socio.banco || 'Sin banco'}<br />{socio.tipoCuenta || ''} {socio.numeroCuenta || ''}</td>
                          <td>{socio.inversiones}</td>
                          <td>{socio.montoInvertido.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {sociosTab === 'inversiones' && (
              <section className="content-grid pagaduria-grid">
                <aside className="surface pagaduria-list">
                  <div className="surface-title">
                    <h2>Socios</h2>
                    <span>{socios.length}</span>
                  </div>
                  <div className="list-panel">
                    {socios.map((socio) => (
                      <button
                        key={socio.id}
                        type="button"
                        className={selectedSocioId === socio.id ? 'company-row active' : 'company-row'}
                        onClick={() => setSelectedSocioId(socio.id)}
                      >
                        <strong>{socio.nombreCompleto}</strong>
                        <span>{socio.inversiones} inversiones · {socio.montoInvertido.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </aside>
                <section className="surface employees-panel">
                  <div className="surface-title">
                    <h2>{selectedSocio?.nombreCompleto ?? 'Inversiones'}</h2>
                    <span>{inversionesSocio.length} registros</span>
                  </div>
                  {selectedSocio && (
                    <div className="metric-grid compact">
                      <article className="metric-card">
                        <span>Capital invertido</span>
                        <strong>{formatMoney(selectedSocio.montoInvertido)}</strong>
                      </article>
                      <article className="metric-card">
                        <span>En creditos</span>
                        <strong>{formatMoney(selectedSocio.montoAsignado)}</strong>
                      </article>
                      <article className="metric-card">
                        <span>Disponible</span>
                        <strong>{formatMoney(selectedSocio.saldoDisponible)}</strong>
                      </article>
                    </div>
                  )}
                  <form className="employee-form" onSubmit={handleCreateInversion}>
                    <input value={inversionForm.monto} onChange={(event) => setInversionForm((current) => ({ ...current, monto: event.target.value }))} placeholder="Monto" />
                    <input type="date" value={inversionForm.fechaInversion} onChange={(event) => setInversionForm((current) => ({ ...current, fechaInversion: event.target.value }))} />
                    <input value={inversionForm.plazo} onChange={(event) => setInversionForm((current) => ({ ...current, plazo: event.target.value }))} placeholder="Plazo meses" />
                    <select value={inversionForm.idTasaInversion} onChange={(event) => setInversionForm((current) => ({ ...current, idTasaInversion: event.target.value }))}>
                      <option value="">Tasa de inversion</option>
                      {sociosCatalogs.tasasInversion.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre} - {item.tasa}%{item.plazo ? ` / ${item.plazo} meses` : ''}
                        </option>
                      ))}
                    </select>
                    <button type="submit" disabled={!selectedSocioId || loading}>Registrar inversion</button>
                  </form>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Asignado</th>
                          <th>Disponible</th>
                          <th>Plazo</th>
                          <th>Tasa</th>
                          <th>Creditos</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inversionesSocio.map((inversion) => (
                          <tr key={inversion.id}>
                            <td>{inversion.fechaInversion}</td>
                            <td>{formatMoney(inversion.monto)}</td>
                            <td>{formatMoney(inversion.montoAsignado)}</td>
                            <td>{formatMoney(inversion.saldoDisponible)}</td>
                            <td>{inversion.plazo}</td>
                            <td>{inversion.tasaNombre ? `${inversion.tasaNombre} - ` : ''}{inversion.tasa}%</td>
                            <td>{inversion.creditos.length ? inversion.creditos.join(' / ') : '-'}</td>
                            <td>{inversion.estado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>
            )}
          </section>
        )}

        {selectedModule && isAliadosModule && (
          <section className="socios-view">
            <div className="config-tabs">
              {(['registro', 'directorio'] as AliadosTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={aliadosTab === tab ? 'tab-button active' : 'tab-button'}
                  onClick={() => setAliadosTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {aliadosTab === 'registro' && (
              <form className="surface pagaduria-form" onSubmit={handleCreateAliado}>
                <div className="surface-title">
                  <h2>Crear aliado comercial</h2>
                  <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar aliado'}</button>
                </div>

                <div className="form-section">
                  <h3>Informacion personal</h3>
                  <div className="field-grid four-cols">
                    <input value={aliadoForm.logoUrl} onChange={(event) => setAliadoForm((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="URL del logo" />
                    <select value={aliadoForm.idTipoIdentificacion} onChange={(event) => setAliadoForm((current) => ({ ...current, idTipoIdentificacion: event.target.value }))}>
                      <option value="">Tipo documento *</option>
                      {identificationTypes.map((type) => <option key={type.id} value={type.id}>{type.sigla} - {type.descripcion}</option>)}
                    </select>
                    <input value={aliadoForm.identificacion} onChange={(event) => setAliadoForm((current) => ({ ...current, identificacion: event.target.value }))} placeholder="Numero de identificacion *" />
                    <input value={aliadoForm.primerNombre} onChange={(event) => setAliadoForm((current) => ({ ...current, primerNombre: event.target.value }))} placeholder="Primer nombre *" />
                    <input value={aliadoForm.segundoNombre} onChange={(event) => setAliadoForm((current) => ({ ...current, segundoNombre: event.target.value }))} placeholder="Segundo nombre" />
                    <input value={aliadoForm.primerApellido} onChange={(event) => setAliadoForm((current) => ({ ...current, primerApellido: event.target.value }))} placeholder="Primer apellido *" />
                    <input value={aliadoForm.segundoApellido} onChange={(event) => setAliadoForm((current) => ({ ...current, segundoApellido: event.target.value }))} placeholder="Segundo apellido" />
                    <input type="date" value={aliadoForm.fechaNacimiento} onChange={(event) => setAliadoForm((current) => ({ ...current, fechaNacimiento: event.target.value }))} />
                    <input value={aliadoForm.telefono} onChange={(event) => setAliadoForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Numero de telefono *" />
                    <input value={aliadoForm.correo} onChange={(event) => setAliadoForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo electronico *" />
                  </div>
                </div>

                <div className="content-grid pagaduria-grid">
                  <div className="form-section">
                    <h3>Domicilio</h3>
                    <div className="field-grid three-cols">
                      <select value={aliadoForm.direccion.idTipoVia} onChange={(event) => setAliadoForm((current) => ({ ...current, direccion: { ...current.direccion, idTipoVia: event.target.value } }))}>
                        <option value="">Tipo de via *</option>
                        {addressCatalogs.tiposVia.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <input value={aliadoForm.direccion.numPrincipal} onChange={(event) => updateAliadoPrincipalNumber(event.target.value)} placeholder="Primer numero de via, ej. 59B" />
                      <input value={aliadoForm.direccion.numSecundario} onChange={(event) => updateAliadoSecondaryNumber(event.target.value)} placeholder="Segundo numero de via, ej. 120A" />
                      <select value={aliadoForm.direccion.idLetraPrincipal} onChange={(event) => setAliadoForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraPrincipal: event.target.value } }))}>
                        <option value="">Letra principal</option>
                        {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <select value={aliadoForm.direccion.idLetraSecundaria} onChange={(event) => setAliadoForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraSecundaria: event.target.value } }))}>
                        <option value="">Letra secundaria</option>
                        {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <input value={aliadoForm.direccion.complemento} onChange={(event) => setAliadoForm((current) => ({ ...current, direccion: { ...current.direccion, complemento: event.target.value } }))} placeholder="Complemento" />
                      <input value={aliadoForm.direccion.barrio} onChange={(event) => setAliadoForm((current) => ({ ...current, direccion: { ...current.direccion, barrio: event.target.value } }))} placeholder="Barrio" />
                      <div className="city-search" onBlur={() => window.setTimeout(() => setAliadoCityComboOpen(false), 120)}>
                        <input
                          value={aliadoCitySearchValue}
                          onFocus={() => setAliadoCityComboOpen(true)}
                          onChange={(event) => {
                            setAliadoCitySearch(event.target.value);
                            setAliadoCityComboOpen(true);
                            setAliadoForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: '' } }));
                          }}
                          placeholder="Ciudad *"
                        />
                        {aliadoCityComboOpen && (
                          <div className="city-results">
                            {(aliadoCitySearchValue ? filteredAliadoCities : addressCatalogs.ciudades.slice(0, 25)).map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  setAliadoForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: String(item.id) } }));
                                  setAliadoCitySearch('');
                                  setAliadoCityComboOpen(false);
                                }}
                              >
                                {item.nombre}
                              </button>
                            ))}
                            {aliadoCitySearchValue && !filteredAliadoCities.length && <span>No hay coincidencias</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="address-preview">{selectedAliadoAddressText || 'La direccion del aliado se ira armando con los campos seleccionados.'}</div>
                  </div>

                  <div className="form-section">
                    <h3>Informacion bancaria</h3>
                    <div className="field-grid three-cols">
                      <select value={aliadoForm.idBanco} onChange={(event) => setAliadoForm((current) => ({ ...current, idBanco: event.target.value }))}>
                        <option value="">Entidad bancaria *</option>
                        {aliadosCatalogs.bancos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <select value={aliadoForm.idTipoCuenta} onChange={(event) => setAliadoForm((current) => ({ ...current, idTipoCuenta: event.target.value }))}>
                        <option value="">Tipo de cuenta *</option>
                        {aliadosCatalogs.tiposCuenta.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <input value={aliadoForm.numeroCuenta} onChange={(event) => setAliadoForm((current) => ({ ...current, numeroCuenta: event.target.value }))} placeholder="Numero de cuenta *" />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Representante legal</h3>
                  <div className="field-grid four-cols">
                    <select value={aliadoForm.representante.idTipoIdentificacion} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, idTipoIdentificacion: event.target.value } }))}>
                      <option value="">Tipo de documento</option>
                      {identificationTypes.map((type) => <option key={type.id} value={type.id}>{type.sigla} - {type.descripcion}</option>)}
                    </select>
                    <input value={aliadoForm.representante.identificacion} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, identificacion: event.target.value } }))} placeholder="Numero de identificacion" />
                    <input value={aliadoForm.representante.primerNombre} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, primerNombre: event.target.value } }))} placeholder="Primer nombre" />
                    <input value={aliadoForm.representante.segundoNombre} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, segundoNombre: event.target.value } }))} placeholder="Segundo nombre" />
                    <input value={aliadoForm.representante.primerApellido} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, primerApellido: event.target.value } }))} placeholder="Primer apellido" />
                    <input value={aliadoForm.representante.segundoApellido} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, segundoApellido: event.target.value } }))} placeholder="Segundo apellido" />
                    <select value={aliadoForm.representante.genero} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, genero: event.target.value } }))}>
                      <option value="">Genero</option>
                      {aliadosCatalogs.generos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={aliadoForm.representante.telefono} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, telefono: event.target.value } }))} placeholder="Numero de telefono" />
                    <input value={aliadoForm.representante.correo} onChange={(event) => setAliadoForm((current) => ({ ...current, representante: { ...current.representante, correo: event.target.value } }))} placeholder="Correo electronico" />
                    <div className="city-search" onBlur={() => window.setTimeout(() => setAliadoRepCityComboOpen(false), 120)}>
                      <input
                        value={aliadoRepCitySearchValue}
                        onFocus={() => setAliadoRepCityComboOpen(true)}
                        onChange={(event) => {
                          setAliadoRepCitySearch(event.target.value);
                          setAliadoRepCityComboOpen(true);
                          setAliadoForm((current) => ({ ...current, representante: { ...current.representante, idCiudad: '' } }));
                        }}
                        placeholder="Ciudad"
                      />
                      {aliadoRepCityComboOpen && (
                        <div className="city-results">
                          {(aliadoRepCitySearchValue ? filteredAliadoRepCities : addressCatalogs.ciudades.slice(0, 25)).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setAliadoForm((current) => ({ ...current, representante: { ...current.representante, idCiudad: String(item.id) } }));
                                setAliadoRepCitySearch('');
                                setAliadoRepCityComboOpen(false);
                              }}
                            >
                              {item.nombre}
                            </button>
                          ))}
                          {aliadoRepCitySearchValue && !filteredAliadoRepCities.length && <span>No hay coincidencias</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Camara de comercio</h3>
                  <div className="field-grid four-cols">
                    <input value={aliadoForm.camara.numero} onChange={(event) => setAliadoForm((current) => ({ ...current, camara: { ...current.camara, numero: event.target.value } }))} placeholder="Numero" />
                    <input value={aliadoForm.camara.libro} onChange={(event) => setAliadoForm((current) => ({ ...current, camara: { ...current.camara, libro: event.target.value } }))} placeholder="Libro" />
                    <div className="city-search" onBlur={() => window.setTimeout(() => setAliadoCamaraCityComboOpen(false), 120)}>
                      <input
                        value={aliadoCamaraCitySearchValue}
                        onFocus={() => setAliadoCamaraCityComboOpen(true)}
                        onChange={(event) => {
                          setAliadoCamaraCitySearch(event.target.value);
                          setAliadoCamaraCityComboOpen(true);
                          setAliadoForm((current) => ({ ...current, camara: { ...current.camara, idCiudad: '' } }));
                        }}
                        placeholder="Ciudad camara"
                      />
                      {aliadoCamaraCityComboOpen && (
                        <div className="city-results">
                          {(aliadoCamaraCitySearchValue ? filteredAliadoCamaraCities : addressCatalogs.ciudades.slice(0, 25)).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setAliadoForm((current) => ({ ...current, camara: { ...current.camara, idCiudad: String(item.id) } }));
                                setAliadoCamaraCitySearch('');
                                setAliadoCamaraCityComboOpen(false);
                              }}
                            >
                              {item.nombre}
                            </button>
                          ))}
                          {aliadoCamaraCitySearchValue && !filteredAliadoCamaraCities.length && <span>No hay coincidencias</span>}
                        </div>
                      )}
                    </div>
                    <input value={aliadoForm.camara.rees} onChange={(event) => setAliadoForm((current) => ({ ...current, camara: { ...current.camara, rees: event.target.value } }))} placeholder="REES" />
                    <input value={aliadoForm.camara.runeol} onChange={(event) => setAliadoForm((current) => ({ ...current, camara: { ...current.camara, runeol: event.target.value } }))} placeholder="RUNEOL" />
                  </div>
                </div>
              </form>
            )}

            {aliadosTab === 'directorio' && (
              <section className="surface employees-panel">
                <div className="surface-title">
                  <h2>Aliados comerciales</h2>
                  <span>{aliados.length} registros</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Identificacion</th>
                        <th>Aliado</th>
                        <th>Contacto</th>
                        <th>Direccion</th>
                        <th>Banco</th>
                        <th>Representante</th>
                        <th>Camara</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aliados.map((aliado) => (
                        <tr key={aliado.id}>
                          <td>{aliado.tipoIdentificacion} {aliado.identificacion}</td>
                          <td>{aliado.nombreCompleto}</td>
                          <td>{aliado.telefono}<br />{aliado.correo}</td>
                          <td>{aliado.direccionCompuesta || aliado.direccion || aliado.ciudad || '-'}</td>
                          <td>{aliado.banco || '-'}<br />{aliado.tipoCuenta || ''} {aliado.numeroCuenta || ''}</td>
                          <td>{[aliado.representante.primerNombre, aliado.representante.primerApellido].filter(Boolean).join(' ') || '-'}<br />{aliado.representante.telefono || ''}</td>
                          <td>{aliado.camara.numero || '-'}<br />{aliado.camara.ciudad || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </section>
        )}

        {selectedModule && isComercialesModule && (
          <section className="socios-view">
            <div className="config-tabs">
              {(['libranzera', 'vendedor', 'directorio'] as ComercialesTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={comercialesTab === tab ? 'tab-button active' : 'tab-button'}
                  onClick={() => setComercialesTab(tab)}
                >
                  {{ libranzera: 'Libranzera', vendedor: 'Asesor', directorio: 'Directorio' }[tab]}
                </button>
              ))}
            </div>

            {comercialesTab === 'libranzera' && (
              <form className="surface pagaduria-form" onSubmit={handleCreateLibranzera}>
                <div className="surface-title">
                  <h2>Crear empresa libranzera</h2>
                  <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar libranzera'}</button>
                </div>

                <div className="form-section">
                  <h3>Informacion del operador de libranza</h3>
                  <div className="field-grid four-cols">
                    <input value={libranzeraForm.nit} onChange={(event) => setLibranzeraForm((current) => ({ ...current, nit: event.target.value }))} placeholder="Nit *" />
                    <input value={libranzeraForm.razonSocial} onChange={(event) => setLibranzeraForm((current) => ({ ...current, razonSocial: event.target.value }))} placeholder="Razon social o nombre *" />
                    <input value={libranzeraForm.domicilio} onChange={(event) => setLibranzeraForm((current) => ({ ...current, domicilio: event.target.value }))} placeholder="Domicilio" />
                    <input value={libranzeraForm.sitioWeb} onChange={(event) => setLibranzeraForm((current) => ({ ...current, sitioWeb: event.target.value }))} placeholder="Sitio web" />
                    <input value={libranzeraForm.correo} onChange={(event) => setLibranzeraForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo electronico" />
                    <input value={libranzeraForm.telefono} onChange={(event) => setLibranzeraForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Numero de telefono" />
                    <input value={libranzeraForm.telefonoCallcenter} onChange={(event) => setLibranzeraForm((current) => ({ ...current, telefonoCallcenter: event.target.value }))} placeholder="Telefono callcenter" />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Camara de comercio</h3>
                  <div className="field-grid four-cols">
                    <input value={libranzeraForm.camaraNumero} onChange={(event) => setLibranzeraForm((current) => ({ ...current, camaraNumero: event.target.value }))} placeholder="Numero" />
                    <input value={libranzeraForm.camaraLibro} onChange={(event) => setLibranzeraForm((current) => ({ ...current, camaraLibro: event.target.value }))} placeholder="Libro" />
                    <select value={libranzeraForm.camaraIdCiudad} onChange={(event) => setLibranzeraForm((current) => ({ ...current, camaraIdCiudad: event.target.value }))}>
                      <option value="">Ciudad</option>
                      {addressCatalogs.ciudades.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input type="date" value={libranzeraForm.fechaConstitucion} onChange={(event) => setLibranzeraForm((current) => ({ ...current, fechaConstitucion: event.target.value }))} />
                    <input value={libranzeraForm.ciiu} onChange={(event) => setLibranzeraForm((current) => ({ ...current, ciiu: event.target.value }))} placeholder="CIIU" />
                    <input value={libranzeraForm.runeol} onChange={(event) => setLibranzeraForm((current) => ({ ...current, runeol: event.target.value }))} placeholder="RUNEOL" />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Representante legal</h3>
                  <div className="field-grid four-cols">
                    <select value={libranzeraForm.representanteLegal.idTipoIdentificacion} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteLegal: { ...current.representanteLegal, idTipoIdentificacion: event.target.value } }))}>
                      <option value="">Tipo documento</option>
                      {identificationTypes.map((type) => <option key={type.id} value={type.id}>{type.sigla} - {type.descripcion}</option>)}
                    </select>
                    <input value={libranzeraForm.representanteLegal.identificacion} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteLegal: { ...current.representanteLegal, identificacion: event.target.value } }))} placeholder="Numero documento" />
                    <input value={libranzeraForm.representanteLegal.nombre} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteLegal: { ...current.representanteLegal, nombre: event.target.value } }))} placeholder="Nombre" />
                    <select value={libranzeraForm.representanteLegal.genero} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteLegal: { ...current.representanteLegal, genero: event.target.value } }))}>
                      <option value="">Genero</option>
                      {comercialesCatalogs.generos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <select value={libranzeraForm.representanteLegal.idCiudad} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteLegal: { ...current.representanteLegal, idCiudad: event.target.value } }))}>
                      <option value="">Ciudad</option>
                      {addressCatalogs.ciudades.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Representante de cartera</h3>
                  <div className="field-grid four-cols">
                    <select value={libranzeraForm.representanteCartera.idTipoIdentificacion} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteCartera: { ...current.representanteCartera, idTipoIdentificacion: event.target.value } }))}>
                      <option value="">Tipo documento</option>
                      {identificationTypes.map((type) => <option key={type.id} value={type.id}>{type.sigla} - {type.descripcion}</option>)}
                    </select>
                    <input value={libranzeraForm.representanteCartera.identificacion} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteCartera: { ...current.representanteCartera, identificacion: event.target.value } }))} placeholder="Numero documento" />
                    <input value={libranzeraForm.representanteCartera.nombre} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteCartera: { ...current.representanteCartera, nombre: event.target.value } }))} placeholder="Nombre" />
                    <select value={libranzeraForm.representanteCartera.genero} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteCartera: { ...current.representanteCartera, genero: event.target.value } }))}>
                      <option value="">Genero</option>
                      {comercialesCatalogs.generos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <select value={libranzeraForm.representanteCartera.idCiudad} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteCartera: { ...current.representanteCartera, idCiudad: event.target.value } }))}>
                      <option value="">Ciudad</option>
                      {addressCatalogs.ciudades.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={libranzeraForm.representanteCartera.telefono} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteCartera: { ...current.representanteCartera, telefono: event.target.value } }))} placeholder="Telefono" />
                    <input value={libranzeraForm.representanteCartera.correo} onChange={(event) => setLibranzeraForm((current) => ({ ...current, representanteCartera: { ...current.representanteCartera, correo: event.target.value } }))} placeholder="Correo" />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Medio de pago principal</h3>
                  <div className="field-grid four-cols">
                    <select value={libranzeraForm.idBanco} onChange={(event) => setLibranzeraForm((current) => ({ ...current, idBanco: event.target.value }))}>
                      <option value="">Entidad bancaria</option>
                      {comercialesCatalogs.bancos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <select value={libranzeraForm.idTipoCuenta} onChange={(event) => setLibranzeraForm((current) => ({ ...current, idTipoCuenta: event.target.value }))}>
                      <option value="">Tipo de cuenta</option>
                      {comercialesCatalogs.tiposCuenta.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={libranzeraForm.numeroCuenta} onChange={(event) => setLibranzeraForm((current) => ({ ...current, numeroCuenta: event.target.value }))} placeholder="Numero de cuenta" />
                  </div>
                </div>
              </form>
            )}

            {comercialesTab === 'vendedor' && (
              <form className="surface pagaduria-form" onSubmit={handleCreateComercial}>
                <div className="surface-title">
                  <h2>{selectedComercialId ? 'Editar asesor' : 'Crear asesor'}</h2>
                  <div className="row-actions">
                    {selectedComercialId && (
                      <button type="button" className="ghost" onClick={() => { setSelectedComercialId(null); setComercialForm(initialComercialForm); }}>
                        Cancelar
                      </button>
                    )}
                    <button type="submit" disabled={loading}>{loading ? 'Guardando...' : selectedComercialId ? 'Guardar cambios' : 'Guardar asesor'}</button>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Informacion personal</h3>
                  <div className="field-grid four-cols">
                    <select value={comercialForm.idLibranzera} onChange={(event) => setComercialForm((current) => ({ ...current, idLibranzera: event.target.value }))}>
                      <option value="">Libranzera *</option>
                      {comercialesCatalogs.libranzeras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <select value={comercialForm.idTipoIdentificacion} onChange={(event) => setComercialForm((current) => ({ ...current, idTipoIdentificacion: event.target.value }))}>
                      <option value="">Tipo documento *</option>
                      {identificationTypes.map((type) => <option key={type.id} value={type.id}>{type.sigla} - {type.descripcion}</option>)}
                    </select>
                    <input value={comercialForm.identificacion} onChange={(event) => setComercialForm((current) => ({ ...current, identificacion: event.target.value }))} placeholder="Numero de identificacion *" />
                    <input value={comercialForm.primerNombre} onChange={(event) => setComercialForm((current) => ({ ...current, primerNombre: event.target.value }))} placeholder="Primer nombre *" />
                    <input value={comercialForm.segundoNombre} onChange={(event) => setComercialForm((current) => ({ ...current, segundoNombre: event.target.value }))} placeholder="Segundo nombre" />
                    <input value={comercialForm.primerApellido} onChange={(event) => setComercialForm((current) => ({ ...current, primerApellido: event.target.value }))} placeholder="Primer apellido *" />
                    <input value={comercialForm.segundoApellido} onChange={(event) => setComercialForm((current) => ({ ...current, segundoApellido: event.target.value }))} placeholder="Segundo apellido" />
                    <input type="date" value={comercialForm.fechaNacimiento} onChange={(event) => setComercialForm((current) => ({ ...current, fechaNacimiento: event.target.value }))} />
                    <input value={comercialForm.telefono} onChange={(event) => setComercialForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Numero de telefono *" />
                    <input value={comercialForm.correo} onChange={(event) => setComercialForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo electronico *" />
                    <input value={comercialForm.codigoVendedor} onChange={(event) => setComercialForm((current) => ({ ...current, codigoVendedor: event.target.value }))} placeholder="Codigo de asesor *" />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Rol y comision</h3>
                  <div className="field-grid four-cols">
                    <select value={comercialForm.idRolVendedor} onChange={(event) => setComercialForm((current) => ({ ...current, idRolVendedor: event.target.value }))}>
                      <option value="">Rol del asesor</option>
                      {comercialesCatalogs.rolesVendedor.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <select value={comercialForm.tipoComision} onChange={(event) => setComercialForm((current) => ({ ...current, tipoComision: event.target.value }))}>
                      <option value="PORCENTAJE">Comision por porcentaje</option>
                      <option value="VALOR_FIJO">Comision por valor fijo</option>
                    </select>
                    <input value={comercialForm.valorComision} onChange={(event) => setComercialForm((current) => ({ ...current, valorComision: event.target.value }))} placeholder={comercialForm.tipoComision === 'PORCENTAJE' ? 'Porcentaje de comision %' : 'Valor fijo de comision'} />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Domicilio</h3>
                  <div className="field-grid four-cols">
                    <select value={comercialForm.direccion.idTipoVia} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, idTipoVia: event.target.value } }))}>
                      <option value="">Tipo de via</option>
                      {addressCatalogs.tiposVia.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={comercialForm.direccion.numPrincipal} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, numPrincipal: event.target.value } }))} placeholder="Numero principal, ej. 30B" />
                    <select value={comercialForm.direccion.idLetraPrincipal} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraPrincipal: event.target.value } }))}>
                      <option value="">Letra principal</option>
                      {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={comercialForm.direccion.bis} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, bis: event.target.value } }))} placeholder="Bis" />
                    <select value={comercialForm.direccion.letraBis} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, letraBis: event.target.value } }))}>
                      <option value="">Letra bis</option>
                      {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={comercialForm.direccion.cuadrantePrincipal} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, cuadrantePrincipal: event.target.value } }))} placeholder="Cuadrante principal" />
                    <input value={comercialForm.direccion.numSecundario} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, numSecundario: event.target.value } }))} placeholder="Numero secundario, ej. 196C" />
                    <select value={comercialForm.direccion.idLetraSecundaria} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, idLetraSecundaria: event.target.value } }))}>
                      <option value="">Letra secundaria</option>
                      {addressCatalogs.letras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={comercialForm.direccion.cuadranteSecundario} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, cuadranteSecundario: event.target.value } }))} placeholder="Cuadrante secundario" />
                    <input value={comercialForm.direccion.complemento} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, complemento: event.target.value } }))} placeholder="Complemento" />
                    <input value={comercialForm.direccion.barrio} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, barrio: event.target.value } }))} placeholder="Barrio" />
                    <select value={comercialForm.direccion.idCiudad} onChange={(event) => setComercialForm((current) => ({ ...current, direccion: { ...current.direccion, idCiudad: event.target.value } }))}>
                      <option value="">Ciudad</option>
                      {addressCatalogs.ciudades.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                  </div>
                  {comercialDireccionCompuesta && <div className="address-preview">{comercialDireccionCompuesta}</div>}
                </div>

                <div className="form-section">
                  <h3>Informacion bancaria</h3>
                  <div className="field-grid four-cols">
                    <select value={comercialForm.idBanco} onChange={(event) => setComercialForm((current) => ({ ...current, idBanco: event.target.value }))}>
                      <option value="">Entidad bancaria</option>
                      {comercialesCatalogs.bancos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <select value={comercialForm.idTipoCuenta} onChange={(event) => setComercialForm((current) => ({ ...current, idTipoCuenta: event.target.value }))}>
                      <option value="">Tipo de cuenta</option>
                      {comercialesCatalogs.tiposCuenta.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                    <input value={comercialForm.numeroCuenta} onChange={(event) => setComercialForm((current) => ({ ...current, numeroCuenta: event.target.value }))} placeholder="Numero de cuenta" />
                  </div>
                </div>
              </form>
            )}

            {comercialesTab === 'directorio' && (
              <section className="content-grid pagaduria-grid">
                <section className="surface employees-panel">
                  <div className="surface-title">
                    <h2>Libranzeras</h2>
                    <span>{libranzeras.length} registros</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Nit</th>
                          <th>Razon social</th>
                          <th>Contacto</th>
                          <th>Cuenta</th>
                          <th>Vendedores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {libranzeras.map((item) => (
                          <tr key={item.id}>
                            <td>{item.nit}</td>
                            <td>{item.razonSocial}</td>
                            <td>{item.telefono ?? '-'}<br />{item.correo ?? ''}</td>
                            <td>{item.banco ?? '-'}<br />{item.tipoCuenta ?? ''} {item.numeroCuenta ?? ''}</td>
                            <td>{item.vendedores}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="surface employees-panel">
                  <div className="surface-title">
                    <h2>Asesores</h2>
                    <span>{comerciales.length} registros</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Codigo</th>
                          <th>Nombre</th>
                          <th>Libranzera</th>
                          <th>Rol</th>
                          <th>Comision</th>
                          <th>Cuenta</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comerciales.map((item) => (
                          <tr key={item.id}>
                            <td>{item.codigoVendedor}</td>
                            <td>{item.nombreCompleto}<br />{item.identificacion}</td>
                            <td>{item.libranzera}</td>
                            <td>{item.rolVendedor ?? '-'}</td>
                            <td>{item.tipoComision === 'PORCENTAJE' ? `${item.valorComision ?? 0}%` : formatMoney(item.valorComision)}</td>
                            <td>{item.banco ?? '-'}<br />{item.tipoCuenta ?? ''} {item.numeroCuenta ?? ''}</td>
                            <td><span className={`status-pill small status-${normalizeStatusClass(item.estado)}`}>{item.estado ?? '-'}</span></td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="ghost tiny" onClick={() => handleEditComercial(item)}>Editar</button>
                                <button type="button" className="ghost tiny" onClick={() => void handleToggleComercialEstado(item)}>
                                  {item.estado?.toLowerCase() === 'activo' ? 'Inactivar' : 'Activar'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>
            )}
          </section>
        )}

        {selectedModule && isCarteraModule && (
          <section className="pagadurias-view cartera-view">
            <div className="surface pagaduria-form">
              <div className="surface-title">
                <div>
                  <span className="section-kicker">Gestion operativa</span>
                  <h2>Cartera</h2>
                </div>
                <div className="row-actions">
                  <button type="button" className="ghost" onClick={handleExportCarteraCsv} disabled={!carteraReporte}>Exportar Excel</button>
                  <button type="button" className="ghost" onClick={handleExportCarteraPdf} disabled={!carteraReporte}>Exportar PDF</button>
                  <button type="button" onClick={reloadCarteraReporte} disabled={loading}>Actualizar</button>
                </div>
              </div>
              <div className="field-grid six-cols">
                <label>Desde<input type="date" value={carteraFilters.fechaInicio} onChange={(event) => setCarteraFilters((current) => ({ ...current, fechaInicio: event.target.value }))} /></label>
                <label>Hasta<input type="date" value={carteraFilters.fechaFin} onChange={(event) => setCarteraFilters((current) => ({ ...current, fechaFin: event.target.value }))} /></label>
                <select value={carteraFilters.idEmpresa} onChange={(event) => setCarteraFilters((current) => ({ ...current, idEmpresa: event.target.value }))}>
                  <option value="">Empresa</option>
                  {(carteraReporte?.filtros.empresas ?? []).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <select value={carteraFilters.idProducto} onChange={(event) => setCarteraFilters((current) => ({ ...current, idProducto: event.target.value }))}>
                  <option value="">Producto</option>
                  {(carteraReporte?.filtros.productos ?? []).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <select value={carteraFilters.idSocio} onChange={(event) => setCarteraFilters((current) => ({ ...current, idSocio: event.target.value }))}>
                  <option value="">Socio fondeador</option>
                  {(carteraReporte?.filtros.socios ?? []).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
                <select value={carteraFilters.estado} onChange={(event) => setCarteraFilters((current) => ({ ...current, estado: event.target.value }))}>
                  <option value="">Estado cuota</option>
                  {(carteraReporte?.filtros.estados ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className="executive-kpis cartera-kpis">
              <article><span>Saldo total</span><strong>{formatMoney(carteraReporte?.resumen.saldoTotal)}</strong><small>Cartera filtrada</small></article>
              <article><span>Vencido</span><strong>{formatMoney(carteraReporte?.resumen.saldoVencido)}</strong><small>Vencida y en mora</small></article>
              <article><span>Proximo</span><strong>{formatMoney(carteraReporte?.resumen.saldoProximo)}</strong><small>15 dias</small></article>
              <article><span>Cuotas pendientes</span><strong>{carteraReporte?.resumen.cuotasPendientes ?? 0}</strong><small>Sin pagar</small></article>
              <article><span>Saldo a favor</span><strong>{formatMoney(carteraReporte?.resumen.saldoFavor)}</strong><small>Excedentes</small></article>
            </div>

            <section className="surface">
              <div className="surface-title"><div><span className="section-kicker">Detalle</span><h2>Cuotas de cartera</h2></div><span>{carteraReporte?.cuotas.length ?? 0}</span></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Credito</th><th>Cliente</th><th>Empresa</th><th>Producto</th><th>Cuota</th><th>Vencimiento</th><th>Estado</th><th>Mora</th><th>Pagado</th><th>Saldo</th></tr></thead>
                  <tbody>{(carteraReporte?.cuotas ?? []).map((item) => (
                    <tr key={`${item.credito}-${item.numeroCuota}-${item.fechaVencimiento}`}>
                      <td>{item.credito}</td>
                      <td>{item.cliente}</td>
                      <td>{item.empresa}</td>
                      <td>{item.producto}</td>
                      <td>{item.numeroCuota}</td>
                      <td>{item.fechaVencimiento}</td>
                      <td><span className={`status-pill small status-${normalizeStatusClass(item.estado)}`}>{item.estado}</span></td>
                      <td>{item.diasMora} dias · {formatMoney(item.valorMora)}</td>
                      <td>{formatMoney(item.valorPagado)}</td>
                      <td>{formatMoney(item.saldo)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>

            <div className="cartera-grid">
              <section className="surface">
                <div className="surface-title"><div><span className="section-kicker">Recaudo</span><h2>Pagos registrados</h2></div><span>{carteraReporte?.recaudos.length ?? 0}</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Fecha</th><th>Credito</th><th>Cliente</th><th>Valor</th><th>Saldo favor</th><th>Medio</th></tr></thead>
                    <tbody>{(carteraReporte?.recaudos ?? []).map((item) => (
                      <tr key={`${item.credito}-${item.fechaPago}-${item.valorPago}`}>
                        <td>{item.fechaPago}</td>
                        <td>{item.credito}</td>
                        <td>{item.cliente}</td>
                        <td>{formatMoney(item.valorPago)}</td>
                        <td>{item.saldoFavor > 0 ? formatMoney(item.saldoFavor) : '-'}</td>
                        <td>{item.medioPago ?? '-'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section className="surface">
                <div className="surface-title"><div><span className="section-kicker">Concentracion</span><h2>Cortes</h2></div></div>
                <div className="triple-report-grid cartera-reports">
                  {[
                    ['Empresa', carteraReporte?.porEmpresa ?? []],
                    ['Producto', carteraReporte?.porProducto ?? []],
                    ['Socio', carteraReporte?.porSocio ?? []]
                  ].map(([title, rows]) => (
                    <div className="mini-report" key={String(title)}>
                      <h3>{String(title)}</h3>
                      {(rows as Array<{ nombre: string; cantidad: number; saldo: number; vencido?: number }>).slice(0, 8).map((item) => (
                        <div className="mini-report-row" key={item.nombre}>
                          <span>{item.nombre}<small>{item.cantidad} creditos{typeof item.vencido === 'number' ? ` · vencido ${formatMoney(item.vencido)}` : ''}</small></span>
                          <strong>{formatMoney(item.saldo)}</strong>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}

        {selectedModule && isProductosCreditoModule && (
          <section className="socios-view">
            <div className="config-tabs">
              {(['solicitudes', 'general', 'atributos', 'documentos', 'etapas'] as ProductosCreditoTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={productosCreditoTab === tab ? 'tab-button active' : 'tab-button'}
                  onClick={() => setProductosCreditoTab(tab)}
                >
                  {{
                    solicitudes: 'Solicitudes',
                    general: 'Productos',
                    atributos: 'Condiciones y cargos',
                    documentos: 'Documentacion',
                    etapas: 'Flujo del credito'
                  }[tab]}
                </button>
              ))}
            </div>

            {productosCreditoTab !== 'solicitudes' && productosCreditoTab !== 'general' && (
              <div className="product-context-bar">
                <div>
                  <span className="section-kicker">Producto en configuracion</span>
                  <strong>{selectedProductoCredito?.nombre ?? 'Selecciona un producto'}</strong>
                </div>
                <select value={selectedProductoCreditoId ?? ''} onChange={(event) => setSelectedProductoCreditoId(Number(event.target.value) || null)}>
                  <option value="">Seleccionar producto</option>
                  {productosCredito.map((producto) => <option key={producto.id} value={producto.id}>{producto.consecutivo} - {producto.nombre}</option>)}
                </select>
                {selectedProductoCredito && (
                  <div className="context-counts">
                    <span>{selectedProductoCredito.atributos} cargos</span>
                    <span>{selectedProductoCredito.documentos} documentos</span>
                    <span>{selectedProductoCredito.etapas} etapas</span>
                  </div>
                )}
              </div>
            )}

            {productosCreditoTab === 'solicitudes' && (
              <section className="content-grid credit-product-grid">
                <form className="surface pagaduria-form" onSubmit={handleCreateCredito}>
                  <div className="surface-title">
                    <h2>Radicar credito</h2>
                    <div className="inline-actions">
                      <button type="button" disabled={loading} onClick={handleSimularCredito}>Simular</button>
                      <button type="submit" disabled={loading}>{loading ? 'Radicando...' : 'Guardar solicitud'}</button>
                    </div>
                  </div>
                  <div className="form-section">
                    <h3>Producto y origen</h3>
                    <div className="field-grid four-cols">
                      <select value={creditoForm.idProductoCredito} onChange={(event) => setCreditoForm((current) => ({ ...current, idProductoCredito: event.target.value }))}>
                        <option value="">Producto de credito *</option>
                        {creditosCatalogs.productos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <select value={creditoForm.idLibranzera} onChange={(event) => setCreditoForm((current) => ({ ...current, idLibranzera: event.target.value }))}>
                        <option value="">Libranzera</option>
                        {creditosCatalogs.libranzeras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <select value={creditoForm.idEmpresa} onChange={(event) => setCreditoForm((current) => ({ ...current, idEmpresa: event.target.value }))}>
                        <option value="">Empresa</option>
                        {creditosCatalogs.empresas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <select value={creditoForm.idComercial} onChange={(event) => setCreditoForm((current) => ({ ...current, idComercial: event.target.value }))}>
                        <option value="">Comercial</option>
                        {creditosCatalogs.comerciales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-section">
                    <h3>Cliente y condiciones</h3>
                    <div className="field-grid four-cols">
                      <select value={creditoForm.idEmpleadoEmpresa} onChange={(event) => setCreditoForm((current) => ({ ...current, idEmpleadoEmpresa: event.target.value }))}>
                        <option value="">Empleado asociado</option>
                        {creditosCatalogs.empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <input value={creditoForm.identificacionCliente} onChange={(event) => setCreditoForm((current) => ({ ...current, identificacionCliente: event.target.value }))} placeholder="Identificacion cliente *" />
                      <input value={creditoForm.nombreCliente} onChange={(event) => setCreditoForm((current) => ({ ...current, nombreCliente: event.target.value }))} placeholder="Nombre cliente *" />
                      <input value={creditoForm.telefonoCliente} onChange={(event) => setCreditoForm((current) => ({ ...current, telefonoCliente: event.target.value }))} placeholder="Telefono" />
                      <input value={creditoForm.correoCliente} onChange={(event) => setCreditoForm((current) => ({ ...current, correoCliente: event.target.value }))} placeholder="Correo" />
                      <input value={creditoForm.montoSolicitado} onChange={(event) => setCreditoForm((current) => ({ ...current, montoSolicitado: event.target.value }))} placeholder="Monto solicitado *" />
                      <select value={creditoForm.plazo} onChange={(event) => setCreditoForm((current) => ({ ...current, plazo: event.target.value }))}>
                        <option value="">Plazo *</option>
                        {monthOptions.map((month) => <option key={month} value={month}>{month} meses</option>)}
                      </select>
                      <input value={creditoForm.tasa} onChange={(event) => setCreditoForm((current) => ({ ...current, tasa: event.target.value }))} placeholder="Tasa %" />
                    </div>
                  </div>
                </form>

                {creditoSimulacion && (
                  <section className="surface employees-panel">
                    <div className="surface-title">
                      <h2>Simulacion</h2>
                      <span>{creditoSimulacion.producto.nombre}</span>
                    </div>
                    <div className="summary-grid">
                      <article>
                        <span>Cuota estimada</span>
                        <strong>{formatMoney(creditoSimulacion.resumen.cuotaEstimada)}</strong>
                      </article>
                      <article>
                        <span>Valor credito</span>
                        <strong>{formatMoney(creditoSimulacion.resumen.valorCredito)}</strong>
                      </article>
                      <article>
                        <span>Desembolso</span>
                        <strong>{formatMoney(creditoSimulacion.resumen.valorDesembolso)}</strong>
                      </article>
                      <article>
                        <span>Total a pagar</span>
                        <strong>{formatMoney(creditoSimulacion.resumen.totalPagar)}</strong>
                      </article>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Concepto</th><th>Tipo</th><th>Valor</th></tr></thead>
                        <tbody>{creditoSimulacion.atributos.map((item) => <tr key={item.id}><td>{item.nombre}</td><td>{item.tipoAtributo}</td><td>{formatMoney(item.valorCalculado)}</td></tr>)}</tbody>
                      </table>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>No.</th><th>Saldo inicial</th><th>Capital</th><th>Interes</th><th>Cuota</th></tr></thead>
                        <tbody>{creditoSimulacion.plan.slice(0, 6).map((item) => <tr key={item.numero}><td>{item.numero}</td><td>{formatMoney(item.saldoInicial)}</td><td>{formatMoney(item.capital)}</td><td>{formatMoney(item.interes)}</td><td>{formatMoney(item.cuota)}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </section>
                )}

                <section className="surface employees-panel">
                  <div className="surface-title">
                    <h2>Solicitudes radicadas</h2>
                    <span>{creditos.length}</span>
                  </div>
                  <div className="list-panel">
                    {creditos.map((credito) => (
                      <button
                        key={credito.id}
                        type="button"
                        className={selectedCreditoId === credito.id ? 'company-row active' : 'company-row'}
                        onClick={() => setSelectedCreditoId(credito.id)}
                      >
                        <strong>{credito.consecutivo} - {credito.nombreCliente}</strong>
                        <span>{credito.producto} Â· {formatMoney(credito.montoSolicitado)} Â· {credito.plazo} meses Â· cuota {formatMoney(credito.cuotaEstimada)}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="surface employees-panel credit-file">
                  <div className="surface-title">
                    <div>
                      <h2>Expediente {selectedCredito?.consecutivo ?? 'sin seleccionar'}</h2>
                      <p>{creditoExpediente?.siguienteAccion ?? 'Selecciona una solicitud para revisar el flujo'}</p>
                    </div>
                    <span className={`status-pill status-${normalizeStatusClass(selectedCredito?.estado)}`}>{selectedCredito?.estado ?? 'Sin seleccionar'}</span>
                  </div>

                  {selectedCredito && (
                    <>
                      <div className="credit-file-summary">
                        <article><span>Cliente</span><strong>{selectedCredito.nombreCliente}</strong><small>{selectedCredito.identificacionCliente}</small></article>
                        <article><span>Producto</span><strong>{selectedCredito.producto}</strong><small>{selectedCredito.tipoCredito}</small></article>
                        <article><span>Monto</span><strong>{formatMoney(selectedCredito.montoSolicitado)}</strong><small>{selectedCredito.plazo} meses</small></article>
                        <article><span>Cuota estimada</span><strong>{formatMoney(selectedCredito.cuotaEstimada)}</strong><small>Tasa {selectedCredito.tasa ?? 0}%</small></article>
                      </div>

                      <div className="credit-progress">
                        <div><strong>{creditProgress}%</strong><span>Avance del proceso</span></div>
                        <i><b style={{ width: `${creditProgress}%` }} /></i>
                      </div>

                      <section className="subsurface client-review-panel">
                        <div className="surface-title compact">
                          <h3>Informacion diligenciada por el cliente</h3>
                          <span>{creditoExpediente?.perfilCliente?.portal?.id ? 'Portal vinculado' : 'Sin registro portal'}</span>
                        </div>
                        <div className="client-review-grid">
                          <article>
                            <h4>Datos personales</h4>
                            <p><strong>Nombre:</strong> {creditoExpediente?.perfilCliente?.portal.nombre ?? selectedCredito.nombreCliente}</p>
                            <p><strong>Identificacion:</strong> {selectedCredito.identificacionCliente}</p>
                            <p><strong>Correo:</strong> {creditoExpediente?.perfilCliente?.portal.correo ?? selectedCredito.correoCliente ?? '-'}</p>
                            <p><strong>Telefono:</strong> {creditoExpediente?.perfilCliente?.portal.telefono ?? selectedCredito.telefonoCliente ?? '-'}</p>
                            <p><strong>Correo confirmado:</strong> {creditoExpediente?.perfilCliente?.portal.correoConfirmado ? 'Si' : 'No'}</p>
                          </article>
                          <article>
                            <h4>Informacion laboral</h4>
                            <p><strong>Cargo:</strong> {creditoExpediente?.perfilCliente?.portal.cargo ?? creditoExpediente?.perfilCliente?.empleado.cargo ?? '-'}</p>
                            <p><strong>Contrato:</strong> {creditoExpediente?.perfilCliente?.portal.tipoContrato ?? '-'}</p>
                            <p><strong>Ingreso:</strong> {creditoExpediente?.perfilCliente?.portal.fechaIngreso ?? '-'}</p>
                            <p><strong>Salario:</strong> {formatMoney(creditoExpediente?.perfilCliente?.portal.salario ?? creditoExpediente?.perfilCliente?.empleado.salario)}</p>
                            <p><strong>Neto:</strong> {formatMoney(creditoExpediente?.perfilCliente?.portal.neto)}</p>
                            <p><strong>Embargos:</strong> {creditoExpediente?.perfilCliente?.portal.tieneEmbargos ? 'Si' : 'No'}</p>
                          </article>
                          <article>
                            <h4>Empresa</h4>
                            <p><strong>Razon social:</strong> {creditoExpediente?.perfilCliente?.empresa.razonSocial ?? selectedCredito.empresa ?? '-'}</p>
                            <p><strong>NIT:</strong> {creditoExpediente?.perfilCliente?.empresa.nit ?? '-'}</p>
                            <p><strong>Codigo:</strong> {creditoExpediente?.perfilCliente?.empresa.codigo ?? '-'}</p>
                            <p><strong>Correo:</strong> {creditoExpediente?.perfilCliente?.empresa.correo ?? '-'}</p>
                            <p><strong>Telefono:</strong> {creditoExpediente?.perfilCliente?.empresa.telefono ?? '-'}</p>
                            <p><strong>Representante:</strong> {creditoExpediente?.perfilCliente?.empresa.representanteLegal ?? '-'}</p>
                          </article>
                          <article>
                            <h4>Financiera y hogar</h4>
                            <p><strong>Banco nomina:</strong> {creditoExpediente?.perfilCliente?.empleado.banco ?? '-'}</p>
                            <p><strong>Tipo cuenta:</strong> {creditoExpediente?.perfilCliente?.empleado.tipoCuenta ?? '-'}</p>
                            <p><strong>Cuenta:</strong> {creditoExpediente?.perfilCliente?.empleado.cuentaNomina ?? '-'}</p>
                            <p><strong>Estado civil:</strong> {creditoExpediente?.perfilCliente?.empleado.estadoCivil ?? '-'}</p>
                            <p><strong>Personas a cargo:</strong> {creditoExpediente?.perfilCliente?.empleado.personasCargo ?? '-'}</p>
                            <p><strong>Vivienda:</strong> {creditoExpediente?.perfilCliente?.empleado.tipoVivienda ?? '-'}</p>
                          </article>
                        </div>
                      </section>

                      <div className="credit-file-layout">
                        <div className="credit-stage-panel">
                          <div className="surface-title compact">
                            <h3>Flujo del credito</h3>
                            <span>{creditoEtapas.length} etapas</span>
                          </div>
                          <div className="stage-timeline">
                            {creditoEtapas.map((etapa) => (
                              <button
                                key={etapa.id}
                                type="button"
                                className={`stage-item status-${normalizeStatusClass(etapa.estadoEtapa)} ${selectedCreditoEtapa?.id === etapa.id ? 'active' : ''}`}
                                onClick={() => setSelectedCreditoEtapaId(etapa.id)}
                              >
                                <b>{etapa.orden}</b>
                                <span>
                                  <strong>{etapa.etapa}</strong>
                                  <small>{etapa.responsable ?? 'Sin responsable'} · {etapa.estadoEtapa}</small>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="credit-action-panel">
                          <div className="surface-title compact">
                            <h3>{selectedCreditoEtapa?.etapa ?? 'Etapa'}</h3>
                            <span className={`status-pill small status-${normalizeStatusClass(selectedCreditoEtapa?.estadoEtapa)}`}>{selectedCreditoEtapa?.estadoEtapa ?? '-'}</span>
                          </div>
                          <div className="stage-meta">
                            <p><strong>Responsable:</strong> {selectedCreditoEtapa?.responsable ?? 'Sin asignar'}</p>
                            <p><strong>Inicio:</strong> {formatDateTime(selectedCreditoEtapa?.fechaInicio)}</p>
                            <p><strong>Fin:</strong> {formatDateTime(selectedCreditoEtapa?.fechaFin)}</p>
                          </div>
                          {isApprovalStageName(selectedCreditoEtapa?.etapa) && (
                            <div className="decision-box">
                              <div className="surface-title compact">
                                <h3>Decision del credito</h3>
                                <span>{creditoExpediente?.decisiones[0]?.decision ?? 'Sin decision'}</span>
                              </div>
                              <div className="field-grid two-cols">
                                <input value={creditoDecisionForm.montoAprobado} onChange={(event) => setCreditoDecisionForm((current) => ({ ...current, montoAprobado: event.target.value }))} placeholder="Monto aprobado" />
                                <select value={creditoDecisionForm.plazoAprobado} onChange={(event) => setCreditoDecisionForm((current) => ({ ...current, plazoAprobado: event.target.value }))}>
                                  <option value="">Plazo aprobado</option>
                                  {monthOptions.map((month) => <option key={month} value={month}>{month} meses</option>)}
                                </select>
                                <input value={creditoDecisionForm.tasaAprobada} onChange={(event) => setCreditoDecisionForm((current) => ({ ...current, tasaAprobada: event.target.value }))} placeholder="Tasa aprobada %" />
                                <input value={creditoDecisionForm.cuotaAprobada} onChange={(event) => setCreditoDecisionForm((current) => ({ ...current, cuotaAprobada: event.target.value }))} placeholder="Cuota aprobada" />
                              </div>
                              <textarea
                                value={creditoDecisionForm.observacion}
                                onChange={(event) => setCreditoDecisionForm((current) => ({ ...current, observacion: event.target.value }))}
                                placeholder="Observacion de aprobacion, comite o analisis"
                              />
                              <div className="stage-actions">
                                <button type="button" disabled={loading} onClick={() => handleDecideCredito('APROBADO')}>Registrar aprobacion</button>
                                <button type="button" className="secondary" disabled={loading} onClick={() => handleDecideCredito('DEVUELTO')}>Devolver credito</button>
                                <button type="button" className="danger" disabled={loading} onClick={() => handleDecideCredito('RECHAZADO')}>Rechazar credito</button>
                              </div>
                            </div>
                          )}
                          {isDisbursementStageName(selectedCreditoEtapa?.etapa) && (
                            <div className="decision-box">
                              <div className="surface-title compact">
                                <h3>Registro de desembolso</h3>
                                <span>{creditoExpediente?.desembolsos[0] ? 'Registrado' : 'Pendiente'}</span>
                              </div>
                              <div className="field-grid two-cols">
                                <input value={creditoDesembolsoForm.valorDesembolso} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, valorDesembolso: event.target.value }))} placeholder="Valor desembolsado" />
                                <input type="date" value={creditoDesembolsoForm.fechaDesembolso} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, fechaDesembolso: event.target.value }))} />
                                <input type="date" value={creditoDesembolsoForm.fechaPrimeraCuota} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, fechaPrimeraCuota: event.target.value }))} title="Fecha primera cuota" />
                                <select value={creditoDesembolsoForm.periodicidad} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, periodicidad: event.target.value }))}>
                                  <option value="MENSUAL">Periodicidad mensual</option>
                                  <option value="QUINCENAL">Periodicidad quincenal</option>
                                </select>
                                <input value={creditoDesembolsoForm.diaCorte} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, diaCorte: event.target.value }))} placeholder="Dia de corte" />
                                <input value={creditoDesembolsoForm.diaPagoOportuno} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, diaPagoOportuno: event.target.value }))} placeholder="Dia pago oportuno" />
                                <input value={creditoDesembolsoForm.moraDespuesVencimiento} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, moraDespuesVencimiento: event.target.value }))} placeholder="Mora despues de dias" />
                                <label className="check-card compact-check">
                                  <input type="checkbox" checked={creditoDesembolsoForm.ajustarFinSemana} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, ajustarFinSemana: event.target.checked }))} />
                                  Ajustar fin de semana
                                </label>
                                <select
                                  value={creditoDesembolsoForm.idInversion}
                                  onChange={(event) => {
                                    const option = fondeoDisponible.find((item) => String(item.idInversion) === event.target.value);
                                    setCreditoDesembolsoForm((current) => ({
                                      ...current,
                                      idInversion: event.target.value,
                                      valorFondeo: event.target.value ? String(Math.min(Number(current.valorDesembolso || 0) || option?.saldoDisponible || 0, option?.saldoDisponible || 0)) : ''
                                    }));
                                  }}
                                >
                                  <option value="">Socio / inversion que apalanca</option>
                                  {fondeoDisponible.map((item) => (
                                    <option key={item.idInversion} value={item.idInversion}>
                                      {item.inversionista} - disponible {formatMoney(item.saldoDisponible)}
                                    </option>
                                  ))}
                                </select>
                                <input value={creditoDesembolsoForm.valorFondeo} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, valorFondeo: event.target.value }))} placeholder="Valor tomado de la inversion" />
                                <select value={creditoDesembolsoForm.bancoDestino} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, bancoDestino: event.target.value }))}>
                                  <option value="">Banco destino</option>
                                  {employeeCatalogs.bancos.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
                                </select>
                                <select value={creditoDesembolsoForm.tipoCuenta} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, tipoCuenta: event.target.value }))}>
                                  <option value="">Tipo de cuenta</option>
                                  {employeeCatalogs.tiposCuenta.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
                                </select>
                                <input value={creditoDesembolsoForm.numeroCuenta} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, numeroCuenta: event.target.value }))} placeholder="Numero de cuenta" />
                                <input value={creditoDesembolsoForm.referenciaPago} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, referenciaPago: event.target.value }))} placeholder="Referencia de pago" />
                                <input value={creditoDesembolsoForm.observacionCalendario} onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, observacionCalendario: event.target.value }))} placeholder="Observacion calendario" />
                              </div>
                              <textarea
                                value={creditoDesembolsoForm.observacion}
                                onChange={(event) => setCreditoDesembolsoForm((current) => ({ ...current, observacion: event.target.value }))}
                                placeholder="Observacion del desembolso"
                              />
                              <div className="stage-actions">
                                <button type="button" disabled={loading} onClick={handleRegistrarDesembolso}>Registrar desembolso</button>
                              </div>
                            </div>
                          )}
                          <textarea
                            value={creditoEtapaObservacion}
                            onChange={(event) => setCreditoEtapaObservacion(event.target.value)}
                            placeholder="Observacion de la gestion"
                          />
                          <div className="stage-actions">
                            <button type="button" disabled={loading || !selectedCreditoEtapa} onClick={() => handleUpdateCreditoEtapa('APROBADA')}>Aprobar etapa</button>
                            <button type="button" className="secondary" disabled={loading || !selectedCreditoEtapa} onClick={() => handleUpdateCreditoEtapa('DEVUELTA')}>Devolver</button>
                            <button type="button" className="danger" disabled={loading || !selectedCreditoEtapa} onClick={() => handleUpdateCreditoEtapa('RECHAZADA')}>Rechazar</button>
                          </div>
                        </div>
                      </div>

                      <div className="credit-file-layout">
                        <section className="subsurface">
                          <div className="surface-title compact"><h3>Documentos</h3><span>{creditoDocumentos.filter((item) => item.estadoDocumento === 'PENDIENTE').length} pendientes</span></div>
                          <div className="table-wrap">
                            <table>
                              <thead><tr><th>Documento</th><th>Aplica a</th><th>Estado</th><th>Obligatorio</th><th>Gestion</th></tr></thead>
                              <tbody>{creditoDocumentos.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.documento}</td>
                                  <td>{item.aplicaA}</td>
                                  <td>
                                    <span className={`status-pill small status-${normalizeStatusClass(item.estadoDocumento)}`}>{item.estadoDocumento}</span>
                                    {item.archivoNombre && <small className="file-name">{item.archivoNombre}</small>}
                                  </td>
                                  <td>{item.obligatorio ? 'Si' : 'No'}</td>
                                  <td>
                                    <div className="row-actions">
                                      <label className="mini-upload">
                                        Cargar
                                        <input
                                          type="file"
                                          accept="application/pdf,image/png,image/jpeg"
                                          disabled={loading}
                                          onChange={(event) => {
                                            void handleUploadCreditoDocumento(item.id, event.target.files?.[0]);
                                            event.currentTarget.value = '';
                                          }}
                                        />
                                      </label>
                                      {item.archivoNombre && (
                                        <button type="button" disabled={loading} onClick={() => handleOpenCreditoDocumento(item.id)}>Ver</button>
                                      )}
                                      {item.estadoDocumento !== 'APROBADO' && (
                                        <button type="button" disabled={loading} onClick={() => handleUpdateCreditoDocumento(item.id, 'APROBADO')}>Aprobar</button>
                                      )}
                                      {item.estadoDocumento !== 'RECHAZADO' && (
                                        <button type="button" className="danger" disabled={loading} onClick={() => handleUpdateCreditoDocumento(item.id, 'RECHAZADO')}>Rechazar</button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        </section>

                        <section className="subsurface">
                          <div className="surface-title compact"><h3>Liquidacion</h3><span>{creditoExpediente?.liquidacion.length ?? 0} conceptos</span></div>
                          <div className="table-wrap">
                            <table>
                              <thead><tr><th>Concepto</th><th>Tipo</th><th>Valor</th></tr></thead>
                              <tbody>{(creditoExpediente?.liquidacion ?? []).map((item) => <tr key={item.id}><td>{item.nombre}</td><td>{item.tipoAtributo ?? '-'}</td><td>{formatMoney(item.valorCalculado)}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </section>
                      </div>

                      <section className="subsurface signature-panel">
                        <div className="surface-title compact">
                          <h3>Firma digital</h3>
                          <span>{creditoFirmas.length} solicitudes</span>
                        </div>
                        <div className="signature-send-grid">
                          <select value={creditoFirmaForm.idPlantilla} onChange={(event) => setCreditoFirmaForm((current) => ({ ...current, idPlantilla: event.target.value }))}>
                            <option value="">Plantilla para firmar</option>
                            {documentTemplates.map((template) => <option key={template.id} value={template.id}>{template.nombre}</option>)}
                          </select>
                          <input value={creditoFirmaForm.firmanteNombre} onChange={(event) => setCreditoFirmaForm((current) => ({ ...current, firmanteNombre: event.target.value }))} placeholder="Firmante" />
                          <input value={creditoFirmaForm.firmanteCorreo} onChange={(event) => setCreditoFirmaForm((current) => ({ ...current, firmanteCorreo: event.target.value }))} placeholder="Correo" />
                          <input value={creditoFirmaForm.firmanteTelefono} onChange={(event) => setCreditoFirmaForm((current) => ({ ...current, firmanteTelefono: event.target.value }))} placeholder="Telefono" />
                          <button type="button" disabled={loading || !creditoFirmaForm.idPlantilla} onClick={handleEnviarFirmaCredito}>Enviar a firma</button>
                        </div>
                        <div className="table-wrap">
                          <table>
                            <thead><tr><th>Documento</th><th>Firmante</th><th>Proveedor</th><th>Estado</th><th>Fecha envio</th><th>Acciones</th></tr></thead>
                            <tbody>{creditoFirmas.map((firma) => (
                              <tr key={firma.id}>
                                <td>{firma.documento ?? `Documento ${firma.documentoGeneradoId}`}</td>
                                <td>{firma.firmanteNombre}<small className="file-name">{firma.firmanteCorreo ?? firma.firmanteTelefono ?? ''}</small></td>
                                <td>{firma.proveedor}</td>
                                <td><span className={`status-pill small status-${normalizeStatusClass(firma.estado)}`}>{firma.estado}</span></td>
                                <td>{formatDateTime(firma.fechaEnvio)}</td>
                                <td>
                                  <div className="row-actions">
                                    {firma.signUrl && <button type="button" onClick={() => window.open(firma.signUrl ?? '', '_blank', 'noopener,noreferrer')}>Abrir firma</button>}
                                    {firma.estado === 'FIRMADO' && <button type="button" disabled={loading} onClick={() => handleOpenFirmaPdf(firma.id)}>PDF firmado</button>}
                                    {firma.estado !== 'FIRMADO' && <button type="button" disabled={loading} onClick={() => handleFirmaManualEstado(firma.id, 'FIRMADO')}>Marcar firmado</button>}
                                    {firma.estado !== 'RECHAZADO' && <button type="button" className="danger" disabled={loading} onClick={() => handleFirmaManualEstado(firma.id, 'RECHAZADO')}>Rechazar</button>}
                                  </div>
                                </td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      </section>

                      <section className="subsurface signature-panel">
                        <div className="surface-title compact">
                          <h3>Trazabilidad de inversionistas</h3>
                          <span>{formatMoney((creditoExpediente?.fondeos ?? []).reduce((total, item) => total + item.valorAsignado, 0))}</span>
                        </div>
                        <div className="table-wrap">
                          <table>
                            <thead><tr><th>Inversionista</th><th>Inversion</th><th>Valor asignado</th><th>Fecha</th><th>Usuario</th></tr></thead>
                            <tbody>{(creditoExpediente?.fondeos ?? []).map((item) => (
                              <tr key={item.id}>
                                <td>{item.inversionista}</td>
                                <td>#{item.idInversion}</td>
                                <td>{formatMoney(item.valorAsignado)}</td>
                                <td>{item.fechaAsignacion}</td>
                                <td>{item.usuario ?? 'Sistema'}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      </section>

                      {(creditoExpediente?.desembolsos.length ?? 0) > 0 && (
                        <section className="subsurface">
                          <div className="surface-title compact"><h3>Desembolsos</h3><span>{creditoExpediente?.desembolsos.length ?? 0} registros</span></div>
                          <div className="table-wrap">
                            <table>
                              <thead><tr><th>Fecha</th><th>Valor</th><th>Banco</th><th>Cuenta</th><th>Referencia</th><th>Usuario</th></tr></thead>
                              <tbody>{creditoExpediente?.desembolsos.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.fechaDesembolso}</td>
                                  <td>{formatMoney(item.valorDesembolso)}</td>
                                  <td>{item.bancoDestino ?? '-'}</td>
                                  <td>{[item.tipoCuenta, item.numeroCuenta].filter(Boolean).join(' ') || '-'}</td>
                                  <td>{item.referenciaPago ?? '-'}</td>
                                  <td>{item.usuario ?? 'Sistema'}</td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        </section>
                      )}

                      {(creditoExpediente?.cuotas.length ?? 0) > 0 && (
                        <section className="subsurface">
                          <div className="surface-title compact">
                            <h3>Registro de pagos</h3>
                            <span>{formatMoney((creditoExpediente?.cuotas ?? []).reduce((total, item) => total + item.saldoCuota, 0))} pendiente</span>
                          </div>
                          <div className="signature-send-grid">
                            <input type="date" value={creditoPagoForm.fechaPago} onChange={(event) => setCreditoPagoForm((current) => ({ ...current, fechaPago: event.target.value }))} />
                            <input value={creditoPagoForm.valorPago} onChange={(event) => setCreditoPagoForm((current) => ({ ...current, valorPago: event.target.value }))} placeholder="Valor pagado" />
                            <select value={creditoPagoForm.medioPago} onChange={(event) => setCreditoPagoForm((current) => ({ ...current, medioPago: event.target.value }))}>
                              <option value="">Medio de pago</option>
                              <option value="TRANSFERENCIA">Transferencia</option>
                              <option value="CONSIGNACION">Consignacion</option>
                              <option value="NOMINA">Descuento nomina</option>
                              <option value="EFECTIVO">Efectivo</option>
                              <option value="OTRO">Otro</option>
                            </select>
                            <input value={creditoPagoForm.referenciaPago} onChange={(event) => setCreditoPagoForm((current) => ({ ...current, referenciaPago: event.target.value }))} placeholder="Referencia" />
                            <input value={creditoPagoForm.observacion} onChange={(event) => setCreditoPagoForm((current) => ({ ...current, observacion: event.target.value }))} placeholder="Observacion" />
                            <button type="button" disabled={loading || !creditoPagoForm.valorPago} onClick={handleRegistrarPagoCredito}>Aplicar pago</button>
                          </div>
                          {(creditoExpediente?.pagos.length ?? 0) > 0 && (
                            <div className="table-wrap">
                              <table>
                                <thead><tr><th>Fecha</th><th>Valor</th><th>Saldo favor</th><th>Medio</th><th>Referencia</th><th>Soporte</th><th>Usuario</th></tr></thead>
                                <tbody>{creditoExpediente?.pagos.map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.fechaPago}</td>
                                    <td>{formatMoney(item.valorPago)}</td>
                                    <td>{item.saldoFavor > 0 ? formatMoney(item.saldoFavor) : '-'}</td>
                                    <td>{item.medioPago ?? '-'}</td>
                                    <td>{item.referenciaPago ?? '-'}</td>
                                    <td>
                                      <div className="row-actions">
                                        {item.soportes > 0 && (
                                          <button type="button" className="ghost tiny" onClick={() => void handleOpenCreditoPagoSoporte(item.id)}>
                                            Ver
                                          </button>
                                        )}
                                        <label className="mini-upload">
                                          {item.soportes > 0 ? 'Reemplazar' : 'Cargar'}
                                          <input
                                            type="file"
                                            accept="application/pdf,image/jpeg,image/png"
                                            onChange={(event) => {
                                              void handleUploadCreditoPagoSoporte(item.id, event.target.files?.[0]);
                                              event.currentTarget.value = '';
                                            }}
                                          />
                                        </label>
                                      </div>
                                      {item.soporteNombre && <small className="file-name">{item.soporteNombre}</small>}
                                    </td>
                                    <td>{item.usuario ?? 'Sistema'}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          )}
                        </section>
                      )}

                      {(creditoExpediente?.cuotas.length ?? 0) > 0 && (
                        <section className="subsurface">
                          <div className="surface-title compact">
                            <h3>Cartera definitiva</h3>
                            <span>{creditoExpediente?.cuotas.length ?? 0} cuotas</span>
                          </div>
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>No.</th>
                                  <th>Corte</th>
                                  <th>Pago oportuno</th>
                                  <th>Vencimiento</th>
                                  <th>Saldo inicial</th>
                                  <th>Capital</th>
                                  <th>Interes</th>
                                  <th>Cargos</th>
                                  <th>Cuota</th>
                                  <th>Dias mora</th>
                                  <th>Mora</th>
                                  <th>Pagado</th>
                                  <th>Pendiente</th>
                                  <th>Saldo final</th>
                                  <th>Estado</th>
                                </tr>
                              </thead>
                              <tbody>{creditoExpediente?.cuotas.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.numero}</td>
                                  <td>{item.fechaCorte}</td>
                                  <td>{item.fechaPagoOportuno}</td>
                                  <td>{item.fechaVencimiento}</td>
                                  <td>{formatMoney(item.saldoInicial)}</td>
                                  <td>{formatMoney(item.capital)}</td>
                                  <td>{formatMoney(item.interes)}</td>
                                  <td>{formatMoney(item.cargos)}</td>
                                  <td>{formatMoney(item.valorCuota)}</td>
                                  <td>{item.diasMora}</td>
                                  <td>{formatMoney(item.valorMora)}</td>
                                  <td>{formatMoney(item.valorPagado)}</td>
                                  <td>{formatMoney(item.saldoCuota)}</td>
                                  <td>{formatMoney(item.saldoFinal)}</td>
                                  <td><span className={`status-pill small status-${normalizeStatusClass(item.estado)}`}>{item.estado}</span></td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        </section>
                      )}

                      <section className="subsurface">
                        <div className="surface-title compact"><h3>Historial</h3><span>{creditoExpediente?.historial.length ?? 0} movimientos</span></div>
                        {(creditoExpediente?.decisiones.length ?? 0) > 0 && (
                          <div className="table-wrap decision-history">
                            <table>
                              <thead><tr><th>Decision</th><th>Monto</th><th>Plazo</th><th>Cuota</th><th>Usuario</th><th>Fecha</th></tr></thead>
                              <tbody>{creditoExpediente?.decisiones.map((item) => (
                                <tr key={item.id}>
                                  <td><span className={`status-pill small status-${normalizeStatusClass(item.decision)}`}>{item.decision}</span></td>
                                  <td>{formatMoney(item.montoAprobado)}</td>
                                  <td>{item.plazoAprobado ? `${item.plazoAprobado} meses` : '-'}</td>
                                  <td>{formatMoney(item.cuotaAprobada)}</td>
                                  <td>{item.usuario ?? 'Sistema'}</td>
                                  <td>{formatDateTime(item.fecha)}</td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        )}
                        <div className="history-list">
                          {(creditoExpediente?.historial ?? []).map((item) => (
                            <article key={item.id}>
                              <strong>{item.accion.replaceAll('_', ' ')}</strong>
                              <span>{formatDateTime(item.fecha)} · {item.usuario ?? 'Sistema'}</span>
                              <small>{item.observacion ?? `${item.estadoAnterior ?? '-'} → ${item.estadoNuevo ?? '-'}`}</small>
                            </article>
                          ))}
                        </div>
                      </section>
                    </>
                  )}
                </section>
              </section>
            )}

            {productosCreditoTab === 'general' && (
              <section className="content-grid credit-product-grid">
                <form className="surface pagaduria-form" onSubmit={handleCreateProductoCredito}>
                  <div className="surface-title">
                    <h2>Crear producto de credito</h2>
                    <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar producto'}</button>
                  </div>
                  <div className="form-section">
                    <h3>Informacion general</h3>
                    <div className="field-grid four-cols">
                      <input value={productoCreditoForm.nombre} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre *" />
                      <select value={productoCreditoForm.idTipoCredito} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, idTipoCredito: event.target.value }))}>
                        <option value="">Tipo de credito *</option>
                        {productosCreditoCatalogs.tiposCredito.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <select value={productoCreditoForm.tipoTasa} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, tipoTasa: event.target.value }))}>
                        <option value="FIJA">Tasa fija</option>
                        <option value="DIFERENCIAL">Tasa diferencial</option>
                        <option value="VARIABLE">Tasa variable</option>
                      </select>
                      <select value={productoCreditoForm.idLibranzera} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, idLibranzera: event.target.value }))}>
                        <option value="">Libranzera</option>
                        {productosCreditoCatalogs.libranzeras.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                      </select>
                      <input value={productoCreditoForm.montoMinimo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, montoMinimo: event.target.value }))} placeholder="Tope minimo" />
                      <input value={productoCreditoForm.montoMaximo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, montoMaximo: event.target.value }))} placeholder="Tope maximo" />
                      <input value={productoCreditoForm.salarioMinimo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, salarioMinimo: event.target.value }))} placeholder="Salario minimo" />
                      <input value={productoCreditoForm.salarioMaximo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, salarioMaximo: event.target.value }))} placeholder="Salario maximo" />
                      <select value={productoCreditoForm.plazoMinimo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, plazoMinimo: event.target.value }))}>
                        <option value="">Minimo de meses</option>
                        {monthOptions.map((month) => <option key={month} value={month}>{month} meses</option>)}
                      </select>
                      <select value={productoCreditoForm.plazoMaximo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, plazoMaximo: event.target.value }))}>
                        <option value="">Maximo de meses</option>
                        {monthOptions.map((month) => <option key={month} value={month}>{month} meses</option>)}
                      </select>
                      <select value={productoCreditoForm.modeloPlazo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, modeloPlazo: event.target.value }))}>
                        <option value="MESES">Meses</option>
                        <option value="DIAS">Dias</option>
                        <option value="CUOTAS">Cuotas</option>
                      </select>
                      <input value={productoCreditoForm.numeroCodeudores} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, numeroCodeudores: event.target.value }))} placeholder="Numero de codeudores" />
                    </div>
                    <div className="field-grid four-cols">
                      <label className="inline-check"><input type="checkbox" checked={productoCreditoForm.permiteCreditoMultiple} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, permiteCreditoMultiple: event.target.checked }))} />Credito multiple</label>
                      <label className="inline-check"><input type="checkbox" checked={productoCreditoForm.interesAjustable} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, interesAjustable: event.target.checked }))} />Interes ajustable</label>
                      <label className="inline-check"><input type="checkbox" checked={productoCreditoForm.permiteRefinanciacion} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, permiteRefinanciacion: event.target.checked }))} />Refinanciacion</label>
                      <label className="inline-check"><input type="checkbox" checked={productoCreditoForm.permiteRetanqueo} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, permiteRetanqueo: event.target.checked }))} />Retanqueo</label>
                      <label className="inline-check"><input type="checkbox" checked={productoCreditoForm.requiereCodeudor} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, requiereCodeudor: event.target.checked }))} />Codeudor</label>
                    </div>
                  </div>
                  <div className="form-section">
                    <h3>Regla base de cartera</h3>
                    <div className="field-grid four-cols">
                      <select value={productoCreditoForm.periodicidad} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, periodicidad: event.target.value }))}>
                        <option value="MENSUAL">Mensual</option>
                        <option value="QUINCENAL">Quincenal</option>
                      </select>
                      <input value={productoCreditoForm.diaCorte} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, diaCorte: event.target.value }))} placeholder="Dia de corte" />
                      <input value={productoCreditoForm.diaPagoOportuno} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, diaPagoOportuno: event.target.value }))} placeholder="Dia pago oportuno" />
                      <input value={productoCreditoForm.moraDespuesVencimiento} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, moraDespuesVencimiento: event.target.value }))} placeholder="Mora despues de dias" />
                      <input value={productoCreditoForm.tasaMoraMensual} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, tasaMoraMensual: event.target.value }))} placeholder="Tasa mora mensual %" />
                      <label className="inline-check"><input type="checkbox" checked={productoCreditoForm.primeraCuotaMesSiguiente} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, primeraCuotaMesSiguiente: event.target.checked }))} />Primera cuota mes siguiente</label>
                      <label className="inline-check"><input type="checkbox" checked={productoCreditoForm.ajustarFinSemana} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, ajustarFinSemana: event.target.checked }))} />Ajustar fin de semana</label>
                      <input value={productoCreditoForm.observacionCalendario} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, observacionCalendario: event.target.value }))} placeholder="Observacion calendario" />
                    </div>
                  </div>
                  <div className="form-section">
                    <h3>Formatos y descripcion</h3>
                    <div className="field-grid four-cols">
                      <select value={productoCreditoForm.formatoCredito} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, formatoCredito: event.target.value }))}>
                        <option value="NO">Formato de credito: NO</option>
                        <option value="SI">Formato de credito: SI</option>
                      </select>
                      <select value={productoCreditoForm.formatoRequisitos} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, formatoRequisitos: event.target.value }))}>
                        <option value="NO">Formato de requisitos: NO</option>
                        <option value="SI">Formato de requisitos: SI</option>
                      </select>
                      <select value={productoCreditoForm.formatoCodeudores} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, formatoCodeudores: event.target.value }))}>
                        <option value="NO">Formato codeudores: NO</option>
                        <option value="SI">Formato codeudores: SI</option>
                      </select>
                      <input value={productoCreditoForm.proveedorFirma} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, proveedorFirma: event.target.value }))} placeholder="Proveedor firma electronica" />
                      <input value={productoCreditoForm.periodoGracia} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, periodoGracia: event.target.value }))} placeholder="Periodo de gracia" />
                    </div>
                    <textarea value={productoCreditoForm.descripcion} onChange={(event) => setProductoCreditoForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Descripcion" />
                  </div>
                </form>

                <section className="surface employees-panel">
                  <div className="surface-title">
                    <h2>Productos configurados</h2>
                    <span>{productosCredito.length}</span>
                  </div>
                  <div className="list-panel">
                    {productosCredito.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        className={selectedProductoCreditoId === producto.id ? 'company-row active' : 'company-row'}
                        onClick={() => setSelectedProductoCreditoId(producto.id)}
                      >
                        <strong>{producto.nombre}</strong>
                        <span>{producto.consecutivo ?? 'Auto'} · {producto.tipoCredito} · {producto.tipoTasa} · {producto.atributos} atributos · {producto.documentos} documentos · {producto.etapas} etapas</span>
                      </button>
                    ))}
                  </div>
                </section>
              </section>
            )}

            {productosCreditoTab === 'atributos' && (
              <section className="surface employees-panel">
                <div className="surface-title">
                  <h2>Atributos de {selectedProductoCredito?.nombre ?? 'producto'}</h2>
                  <span>{productoAtributos.length} registros</span>
                </div>
                <form className="employee-form" onSubmit={handleCreateProductoAtributo}>
                  <select value={productoAtributoForm.idTipoAtributo} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, idTipoAtributo: event.target.value }))}>
                    <option value="">Tipo atributo</option>
                    {productosCreditoCatalogs.tiposAtributo.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <select value={productoAtributoForm.idTipoCalculo} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, idTipoCalculo: event.target.value }))}>
                    <option value="">Tipo calculo</option>
                    {productosCreditoCatalogs.tiposCalculo.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input value={productoAtributoForm.nombre} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre" />
                  <input value={productoAtributoForm.valor} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, valor: event.target.value }))} placeholder="Valor" />
                  <input value={productoAtributoForm.porcentaje} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, porcentaje: event.target.value }))} placeholder="Porcentaje" />
                  <input value={productoAtributoForm.minimo} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, minimo: event.target.value }))} placeholder="Minimo" />
                  <input value={productoAtributoForm.maximo} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, maximo: event.target.value }))} placeholder="Maximo" />
                  <input value={productoAtributoForm.proveedor} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, proveedor: event.target.value }))} placeholder="Proveedor" />
                  <input value={productoAtributoForm.prioridad} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, prioridad: event.target.value }))} placeholder="Prioridad" />
                  <label className="inline-check"><input type="checkbox" checked={productoAtributoForm.aplicaIva} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, aplicaIva: event.target.checked }))} />IVA</label>
                  <label className="inline-check"><input type="checkbox" checked={productoAtributoForm.obligatorio} onChange={(event) => setProductoAtributoForm((current) => ({ ...current, obligatorio: event.target.checked }))} />Obligatorio</label>
                  <button type="submit" disabled={!selectedProductoCreditoId || loading}>Agregar atributo</button>
                </form>
                <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Tipo</th><th>Calculo</th><th>Valor</th><th>%</th><th>IVA</th></tr></thead><tbody>{productoAtributos.map((item) => <tr key={item.id}><td>{item.nombre}</td><td>{item.tipoAtributo}</td><td>{item.tipoCalculo}</td><td>{item.valor ?? '-'}</td><td>{item.porcentaje ?? '-'}</td><td>{item.aplicaIva ? 'Si' : 'No'}</td></tr>)}</tbody></table></div>
              </section>
            )}

            {productosCreditoTab === 'documentos' && (
              <section className="configuration-split">
                <aside className="surface config-library-panel">
                  <div className="surface-title"><h2>Biblioteca documental</h2><span>{productosCreditoCatalogs.documentos.length}</span></div>
                  <p className="muted-note">Documentos disponibles para reutilizar en los productos de credito.</p>
                  <div className="catalog-list">
                    {productosCreditoCatalogs.documentos.map((item) => (
                      <div key={item.id} className="catalog-list-item">
                        <span className="document-mark">DOC</span>
                        <strong>{item.nombre}</strong>
                      </div>
                    ))}
                  </div>
                </aside>
                <section className="surface employees-panel">
                <div className="surface-title"><div><span className="section-kicker">Requisitos del producto</span><h2>Documentos de {selectedProductoCredito?.nombre ?? 'producto'}</h2></div><span>{productoDocumentos.length} asignados</span></div>
                <form className="employee-form" onSubmit={handleCreateProductoDocumento}>
                  <select value={productoDocumentoForm.idDocumentoCredito} onChange={(event) => setProductoDocumentoForm((current) => ({ ...current, idDocumentoCredito: event.target.value }))}>
                    <option value="">Documento</option>
                    {productosCreditoCatalogs.documentos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input value={productoDocumentoForm.prioridad} onChange={(event) => setProductoDocumentoForm((current) => ({ ...current, prioridad: event.target.value }))} placeholder="Prioridad" />
                  <select value={productoDocumentoForm.aplicaA} onChange={(event) => setProductoDocumentoForm((current) => ({ ...current, aplicaA: event.target.value }))}>
                    <option value="CLIENTE">Cliente</option>
                    <option value="CODEUDOR">Codeudor</option>
                    <option value="EMPRESA">Empresa</option>
                    <option value="VEHICULO">Vehiculo</option>
                  </select>
                  <label className="inline-check"><input type="checkbox" checked={productoDocumentoForm.obligatorio} onChange={(event) => setProductoDocumentoForm((current) => ({ ...current, obligatorio: event.target.checked }))} />Obligatorio</label>
                  <label className="inline-check"><input type="checkbox" checked={productoDocumentoForm.requiereFirma} onChange={(event) => setProductoDocumentoForm((current) => ({ ...current, requiereFirma: event.target.checked }))} />Firma</label>
                  <label className="inline-check"><input type="checkbox" checked={productoDocumentoForm.requiereValidacion} onChange={(event) => setProductoDocumentoForm((current) => ({ ...current, requiereValidacion: event.target.checked }))} />Validacion</label>
                  <button type="submit" disabled={!selectedProductoCreditoId || loading}>Agregar documento</button>
                </form>
                <div className="table-wrap"><table><thead><tr><th>Documento</th><th>Prioridad</th><th>Aplica a</th><th>Obligatorio</th><th>Firma</th><th>Validacion</th></tr></thead><tbody>{productoDocumentos.map((item) => <tr key={item.id}><td>{item.documento}</td><td>{item.prioridad}</td><td>{item.aplicaA}</td><td>{item.obligatorio ? 'Si' : 'No'}</td><td>{item.requiereFirma ? 'Si' : 'No'}</td><td>{item.requiereValidacion ? 'Si' : 'No'}</td></tr>)}</tbody></table></div>
                </section>
                <section className="document-template-workspace">
                  <aside className="surface template-list-panel">
                    <div className="surface-title"><h2>Plantillas automaticas</h2><button type="button" onClick={() => { setSelectedDocumentTemplate(null); setDocumentTemplateForm(initialDocumentTemplateForm); }}>Nueva</button></div>
                    <div className="catalog-list">
                      {documentTemplates.map((template) => (
                        <button key={template.id} type="button" className={selectedDocumentTemplate?.id === template.id ? 'template-row active' : 'template-row'} onClick={() => handleSelectDocumentTemplate(template.id)}>
                          <strong>{template.nombre}</strong>
                          <span>{template.codigo} · v{template.ultimaVersion ?? 0} · {template.estado}</span>
                        </button>
                      ))}
                    </div>
                  </aside>
                  <form className="surface template-editor" onSubmit={handleSaveDocumentTemplate}>
                    <div className="surface-title">
                      <div><span className="section-kicker">{selectedDocumentTemplate ? `Version ${selectedDocumentTemplate.version}` : 'Nueva plantilla'}</span><h2>Editor documental</h2></div>
                      <div className="inline-actions">
                        <button type="submit" disabled={loading}>{selectedDocumentTemplate ? 'Guardar nueva version' : 'Crear plantilla'}</button>
                        <button type="button" disabled={!selectedDocumentTemplate || loading} onClick={handlePublishDocumentTemplate}>Publicar</button>
                      </div>
                    </div>
                    <div className="field-grid three-cols">
                      <input required value={documentTemplateForm.codigo} disabled={Boolean(selectedDocumentTemplate)} onChange={(event) => setDocumentTemplateForm((current) => ({ ...current, codigo: event.target.value.toUpperCase() }))} placeholder="Codigo *" />
                      <input required value={documentTemplateForm.nombre} disabled={Boolean(selectedDocumentTemplate)} onChange={(event) => setDocumentTemplateForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre *" />
                      <select value={documentTemplateForm.tipoDocumento} disabled={Boolean(selectedDocumentTemplate)} onChange={(event) => setDocumentTemplateForm((current) => ({ ...current, tipoDocumento: event.target.value }))}>
                        <option value="PAGARE">Pagare</option>
                        <option value="CONTRATO">Contrato</option>
                        <option value="AUTORIZACION">Autorizacion</option>
                        <option value="FORMULARIO">Formulario</option>
                        <option value="FIANZA">Fianza</option>
                      </select>
                    </div>
                    {!selectedDocumentTemplate && <input value={documentTemplateForm.descripcion} onChange={(event) => setDocumentTemplateForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Descripcion" />}
                    {selectedDocumentTemplate?.modoPlantilla !== 'PDF_BASE' && (
                      <RichDocumentEditor
                        value={documentTemplateForm.contenido}
                        variables={documentVariablesList}
                        onChange={(contenido) => setDocumentTemplateForm((current) => ({ ...current, contenido }))}
                      />
                    )}
                    {selectedDocumentTemplate?.modoPlantilla === 'PDF_BASE' && session && (
                      <div className="pdf-base-section">
                        <div className="surface-title">
                          <div><span className="section-kicker">Formato existente</span><h2>Editor visual de PDF</h2></div>
                          <span>Campos por coordenadas</span>
                        </div>
                        <p className="muted-note">Carga el PDF institucional, selecciona un campo y haz clic sobre la página. Haz doble clic sobre un campo para eliminarlo.</p>
                        <PdfFieldMapper
                          token={session.token}
                          templateId={selectedDocumentTemplate.id}
                          variables={documentVariablesList}
                          onMessage={setMessage}
                        />
                      </div>
                    )}
                    <div className="document-generate-bar">
                      <select value={documentCreditoId} onChange={(event) => setDocumentCreditoId(event.target.value)}>
                        <option value="">Selecciona un credito para vista previa</option>
                        {creditos.map((credito) => <option key={credito.id} value={credito.id}>{credito.consecutivo} - {credito.nombreCliente}</option>)}
                      </select>
                      <button type="button" disabled={!selectedDocumentTemplate || !documentCreditoId || loading} onClick={handleGenerateDocument}>Generar PDF</button>
                    </div>
                  </form>
                </section>
              </section>
            )}

            {productosCreditoTab === 'etapas' && (
              <section className="surface employees-panel">
                <div className="surface-title"><div><span className="section-kicker">Proceso de originacion</span><h2>Flujo de {selectedProductoCredito?.nombre ?? 'producto'}</h2></div><span>{productoEtapas.length} etapas</span></div>
                <p className="muted-note">Define el recorrido de la solicitud desde la radicacion hasta el desembolso. El orden determina la secuencia operativa.</p>
                <div className="workflow-canvas">
                  {productoEtapas.length ? [...productoEtapas].sort((a, b) => a.orden - b.orden).map((item, index) => (
                    <div key={item.id} className={`workflow-step${selectedProductoEtapaId === item.id ? ' active' : ''}`}>
                      <span className="workflow-number">{item.orden}</span>
                      <div>
                        <strong>{item.etapa}</strong>
                        <small>{item.responsable ?? 'Sin responsable'} · SLA {item.slaHoras ?? '-'} h</small>
                      </div>
                      <div className="workflow-flags">
                        {item.obligatoria && <span>Obligatoria</span>}
                        {item.permiteDevolucion && <span>Permite devolucion</span>}
                      </div>
                      <button type="button" className="workflow-edit-button" onClick={() => handleEditProductoEtapa(item)}>Editar</button>
                      {index < productoEtapas.length - 1 && <i aria-hidden="true">›</i>}
                    </div>
                  )) : <div className="empty-credit-state"><strong>Este producto aun no tiene flujo</strong><span>Agrega la primera etapa para comenzar el proceso.</span></div>}
                </div>
                <form className="employee-form" onSubmit={handleSaveProductoEtapa}>
                  {selectedProductoEtapa && (
                    <div className="form-helper">
                      Editando etapa: <strong>{selectedProductoEtapa.etapa}</strong>
                    </div>
                  )}
                  <select value={productoEtapaForm.idEtapaCredito} onChange={(event) => setProductoEtapaForm((current) => ({ ...current, idEtapaCredito: event.target.value }))}>
                    <option value="">Etapa</option>
                    {productosCreditoCatalogs.etapas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input value={productoEtapaForm.orden} onChange={(event) => setProductoEtapaForm((current) => ({ ...current, orden: event.target.value }))} placeholder="Orden" />
                  <select value={productoEtapaForm.responsable} onChange={(event) => setProductoEtapaForm((current) => ({ ...current, responsable: event.target.value }))}>
                    <option value="">Responsable / perfil</option>
                    {productoEtapaForm.responsable && !responsableOptions.some((role) => role.nombre === productoEtapaForm.responsable) && (
                      <option value={productoEtapaForm.responsable}>{productoEtapaForm.responsable} (actual)</option>
                    )}
                    {responsableOptions.map((role) => <option key={role.id} value={role.nombre}>{role.nombre}</option>)}
                  </select>
                  <input value={productoEtapaForm.slaHoras} onChange={(event) => setProductoEtapaForm((current) => ({ ...current, slaHoras: event.target.value }))} placeholder="SLA horas" />
                  <label className="inline-check"><input type="checkbox" checked={productoEtapaForm.obligatoria} onChange={(event) => setProductoEtapaForm((current) => ({ ...current, obligatoria: event.target.checked }))} />Obligatoria</label>
                  <label className="inline-check"><input type="checkbox" checked={productoEtapaForm.permiteDevolucion} onChange={(event) => setProductoEtapaForm((current) => ({ ...current, permiteDevolucion: event.target.checked }))} />Devolucion</label>
                  <button type="submit" disabled={!selectedProductoCreditoId || loading}>{selectedProductoEtapaId ? 'Guardar cambios' : 'Agregar etapa'}</button>
                  {selectedProductoEtapaId && <button type="button" className="ghost-button" onClick={handleCancelProductoEtapaEdit}>Cancelar edicion</button>}
                </form>
              </section>
            )}
          </section>
        )}

        {selectedModule && !isEmpresasModule && !isSociosModule && !isAliadosModule && !isComercialesModule && !isCarteraModule && !isProductosCreditoModule && (
          <section className="module-detail-view">
            <article className="welcome-panel module-hero">
              <div>
                <span className="section-kicker">{selectedModule.nombre}</span>
                <h2>{selectedModule.descripcion}</h2>
                <p>Este modulo viene de la tabla de modulos de PostgreSQL. Sus submodulos tambien se cargan desde la base.</p>
              </div>
              <div className="welcome-badge">
                <strong>{selectedModule.submodules.length}</strong>
                <span>submodulos</span>
              </div>
            </article>

            <div className="module-board">
              {selectedModule.submodules.map((submodule) => (
                <article key={submodule.id} className="module-card elevated">
                  <header>
                    <strong>{submodule.nombre}</strong>
                    <span>{submodule.roles.length} roles</span>
                  </header>
                  <p>{submodule.descripcion}</p>
                  <div className="submodule-row">
                    <strong>Ruta</strong>
                    <span>{submodule.link}</span>
                  </div>
                </article>
              ))}
              {selectedModule.submodules.length === 0 && (
                <div className="surface empty-module">Este modulo aun no tiene submodulos registrados.</div>
              )}
            </div>
          </section>
        )}

        {view === 'usuarios' && (
          <section className="content-grid users-grid">
            <form className="surface user-form" onSubmit={handleCreateUser}>
              <div className="surface-title">
                <h2>Crear usuario</h2>
                <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear usuario'}</button>
              </div>

              <div className="form-section">
                <h3>Informacion personal</h3>
                <div className="field-grid five-cols">
                  <select value={userForm.idTipoIdentificacion} onChange={(event) => setUserForm((current) => ({ ...current, idTipoIdentificacion: event.target.value }))}>
                    <option value="">Tipo documento *</option>
                    {identificationTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.sigla} - {type.descripcion}
                      </option>
                    ))}
                  </select>
                  <input value={userForm.identificacion} onChange={(event) => setUserForm((current) => ({ ...current, identificacion: event.target.value }))} placeholder="Numero de identificacion *" />
                  <input value={userForm.primerNombre} onChange={(event) => setUserForm((current) => ({ ...current, primerNombre: event.target.value }))} placeholder="Primer nombre *" />
                  <input value={userForm.segundoNombre} onChange={(event) => setUserForm((current) => ({ ...current, segundoNombre: event.target.value }))} placeholder="Segundo nombre" />
                  <input value={userForm.primerApellido} onChange={(event) => setUserForm((current) => ({ ...current, primerApellido: event.target.value }))} placeholder="Primer apellido" />
                  <input value={userForm.segundoApellido} onChange={(event) => setUserForm((current) => ({ ...current, segundoApellido: event.target.value }))} placeholder="Segundo apellido" />
                  <input value={userForm.nombreCompleto} onChange={(event) => setUserForm((current) => ({ ...current, nombreCompleto: event.target.value }))} placeholder="Nombre completo *" />
                  <input value={userForm.telefono} onChange={(event) => setUserForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Telefono *" />
                  <input value={userForm.correo} onChange={(event) => setUserForm((current) => ({ ...current, correo: event.target.value }))} placeholder="Correo electronico *" />
                  <input value={userForm.nombreUsuario} onChange={(event) => setUserForm((current) => ({ ...current, nombreUsuario: event.target.value }))} placeholder="Usuario *" />
                  <input type="password" value={userForm.contrasena} onChange={(event) => setUserForm((current) => ({ ...current, contrasena: event.target.value }))} placeholder="Contrasena *" />
                </div>
              </div>

              <div className="form-section">
                <h3>Roles iniciales</h3>
                <div className="check-grid">
                  {roles.map((role) => (
                    <label key={role.id} className="check-tile">
                      <input
                        type="checkbox"
                        checked={userForm.roleIds.includes(String(role.id))}
                        onChange={() => toggleUserRole(String(role.id))}
                      />
                      <span>{role.nombre}</span>
                      <small>{role.descripcion}</small>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <aside className="surface access-panel">
              <div className="surface-title">
                <h2>Asignacion de accesos</h2>
                <button type="button" onClick={handleAssignRoles} disabled={!selectedUserId}>Aplicar roles</button>
              </div>
              <select value={selectedUserId ?? ''} onChange={(event) => handleSelectUser(Number(event.target.value))}>
                <option value="">Selecciona un usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.nombreCompleto}</option>
                ))}
              </select>

              {selectedUser && (
                <div className="selected-user">
                  <span className="avatar large">{initials(selectedUser.nombreCompleto)}</span>
                  <div>
                    <strong>{selectedUser.nombreCompleto}</strong>
                    <small>{selectedUser.correo}</small>
                  </div>
                </div>
              )}

              <div className="check-stack">
                {roles.map((role) => (
                  <label key={role.id} className="compact-check">
                    <input
                      type="checkbox"
                      checked={selectedUserRoleIds.includes(String(role.id))}
                      onChange={() => toggleSelectedRole(String(role.id))}
                    />
                    <span>{role.nombre}</span>
                  </label>
                ))}
              </div>
            </aside>

            <section className="surface full-span">
              <div className="surface-title">
                <h2>Lista de usuarios</h2>
                <span>{users.length} registros</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.nombreUsuario}</td>
                        <td>{user.nombreCompleto}</td>
                        <td>{user.correo}</td>
                        <td><span className="state-badge">{user.estado}</span></td>
                        <td>{user.roles.join(', ') || 'Sin roles'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}

        {view === 'configuracion' && (
          <section className="surface config-surface">
            <div className="config-tabs">
              {(['roles', 'permisos', 'modulos', 'apariencia'] as ConfigTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={configTab === tab ? 'tab-button active' : 'tab-button'}
                  onClick={() => setConfigTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {configTab === 'roles' && (
              <div className="config-grid">
                <form className="form-section clean" onSubmit={handleCreateRole}>
                  <h2>Crear rol</h2>
                  <input value={roleForm.nombre} onChange={(event) => setRoleForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre del rol" />
                  <input value={roleForm.descripcion} onChange={(event) => setRoleForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Descripcion" />
                  <button type="submit" disabled={loading}>Guardar rol</button>
                </form>

                <div className="form-section clean">
                  <h2>Permisos por rol</h2>
                  <select value={selectedRoleId ?? ''} onChange={(event) => setSelectedRoleId(Number(event.target.value) || null)}>
                    <option value="">Selecciona rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.nombre}</option>
                    ))}
                  </select>
                  <select multiple value={selectedPermissionIds.map(String)} onChange={(event) => setSelectedPermissionIds(Array.from(event.target.selectedOptions, (option) => Number(option.value)))}>
                    {permissions.map((permission) => (
                      <option key={permission.id} value={permission.id}>{permission.nombre}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAssignPermissions} disabled={!selectedRoleId}>Asignar permisos</button>
                </div>

                <div className="list-panel">
                  {roles.map((role) => (
                    <article key={role.id} className="row-card">
                      <strong>{role.nombre}</strong>
                      <span>{role.descripcion}</span>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {configTab === 'permisos' && (
              <div className="config-grid two-cols">
                <form className="form-section clean" onSubmit={handleCreatePermission}>
                  <h2>Crear permiso</h2>
                  <input value={permissionForm.nombre} onChange={(event) => setPermissionForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="usuarios:create" />
                  <input value={permissionForm.descripcion} onChange={(event) => setPermissionForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Descripcion" />
                  <button type="submit" disabled={loading}>Guardar permiso</button>
                </form>

                <div className="list-panel tall">
                  {permissions.map((permission) => (
                    <article key={permission.id} className="row-card">
                      <strong>{permission.nombre}</strong>
                      <span>{permission.descripcion}</span>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {configTab === 'modulos' && (
              <div className="config-grid modules-config">
                <form className="form-section clean" onSubmit={handleCreateModule}>
                  <h2>Crear modulo</h2>
                  <input value={moduleForm.nombre} onChange={(event) => setModuleForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Empresas" />
                  <input value={moduleForm.descripcion} onChange={(event) => setModuleForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Descripcion" />
                  <button type="submit" disabled={loading}>Guardar modulo</button>
                </form>

                <form className="form-section clean" onSubmit={handleCreateSubmodule}>
                  <h2>Crear submodulo</h2>
                  <select value={submoduleForm.idModulo} onChange={(event) => setSubmoduleForm((current) => ({ ...current, idModulo: event.target.value }))}>
                    <option value="">Modulo padre</option>
                    {catalogModules.map((module) => (
                      <option key={module.id} value={module.id}>{module.nombre}</option>
                    ))}
                  </select>
                  <input value={submoduleForm.nombre} onChange={(event) => setSubmoduleForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Registro de usuarios" />
                  <input value={submoduleForm.link} onChange={(event) => setSubmoduleForm((current) => ({ ...current, link: event.target.value }))} placeholder="/usuarios/registro" />
                  <input value={submoduleForm.descripcion} onChange={(event) => setSubmoduleForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Descripcion" />
                  <button type="submit" disabled={loading}>Guardar submodulo</button>
                </form>

                <div className="module-board">
                  {catalogModules.map((module) => (
                    <article key={module.id} className="module-card">
                      <header>
                        <strong>{module.nombre}</strong>
                        <span>{module.submodules.length} submodulos</span>
                      </header>
                      <p>{module.descripcion}</p>
                      <div className="submodule-list">
                        {module.submodules.map((submodule) => (
                          <div key={submodule.id} className="submodule-row">
                            <strong>{submodule.nombre}</strong>
                            <span>{submodule.link}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {configTab === 'apariencia' && (
              <div className="appearance-grid">
                <section className="form-section clean">
                  <h2>Modo de visualizacion</h2>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={themeMode === 'light' ? 'segment active' : 'segment'}
                      onClick={() => setThemeMode('light')}
                    >
                      Dia
                    </button>
                    <button
                      type="button"
                      className={themeMode === 'dark' ? 'segment active' : 'segment'}
                      onClick={() => setThemeMode('dark')}
                    >
                      Noche
                    </button>
                  </div>
                </section>

                <section className="form-section clean">
                  <h2>Paleta corporativa</h2>
                  <div className="palette-grid">
                    {(Object.entries(palettes) as Array<[PaletteKey, Palette]>).map(([key, palette]) => (
                      <button
                        key={key}
                        type="button"
                        className={paletteKey === key ? 'palette-option active' : 'palette-option'}
                        onClick={() => setPaletteKey(key)}
                      >
                        <span className="swatches">
                          <i style={{ background: palette.primary }} />
                          <i style={{ background: palette.primaryDark }} />
                          <i style={{ background: palette.accent }} />
                        </span>
                        <strong>{palette.name}</strong>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="brand-preview">
                  <div className="preview-sidebar">
                    <span className="brand-mark">CA</span>
                    <strong>Creditos App</strong>
                  </div>
                  <div className="preview-content">
                    <span className="section-kicker">Vista previa</span>
                    <h2>{activePalette.name}</h2>
                    <p>La seleccion se guarda en este navegador y actualiza el panel administrativo al instante.</p>
                    <button type="button">Accion principal</button>
                  </div>
                </section>
              </div>
            )}
          </section>
        )}

        <p className="message-line">{message}</p>
      </main>
    </div>
  );
}

export default App;
