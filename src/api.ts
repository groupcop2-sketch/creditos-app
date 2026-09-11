export type LoginResponse = {
  token: string;
  user: SecurityUser;
};

export type SecurityUser = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  identification: string;
  roles: string[];
  permissions: string[];
};

export type UserRow = {
  id: number;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  telefono: string;
  identificacion: string;
  idTipoIdentificacion: number;
  idEstado: number;
  estado: string;
  roles: string[];
};

export type RoleRow = {
  id: number;
  nombre: string;
  descripcion: string;
  montoMaximoAprobacion: number | null;
};

export type PermissionRow = {
  id: number;
  nombre: string;
  descripcion: string;
};

export type DashboardGerencial = {
  indicadores: {
    solicitudes: number;
    montoSolicitado: number;
    capitalInversionistas: number;
    saldoCartera: number;
    recaudo: number;
    cuotaPromedio: number;
    carteraVencida: number;
    proximosVencimientos: number;
    recaudoHoy: number;
    recaudoMes: number;
    saldoFavor: number;
    desembolsosPeriodo: number;
    cantidadDesembolsos: number;
    comitePendiente: number;
    valorComitePendiente: number;
    liquidacionesPendientes: number;
    valorLiquidacionesPendientes: number;
    documentosPendientes: number;
  };
  estados: Array<{ estado: string; cantidad: number; monto: number }>;
  mensual: Array<{ periodo: string; cantidad: number; monto: number }>;
  empresas: Array<{ empresa: string; cantidad: number; monto: number }>;
  productos: Array<{ producto: string; cantidad: number; monto: number }>;
  cartera: {
    vencida: Array<{ credito: string; cliente: string; empresa: string; fechaVencimiento: string; diasMora: number; saldo: number }>;
    proximosVencimientos: Array<{ credito: string; cliente: string; producto: string; fechaVencimiento: string; saldo: number }>;
    recaudoMensual: Array<{ periodo: string; valor: number; saldoFavor: number }>;
    porEmpresa: Array<{ nombre: string; cantidad: number; saldo: number; vencido: number }>;
    porProducto: Array<{ nombre: string; cantidad: number; saldo: number; vencido: number }>;
    porSocio: Array<{ nombre: string; cantidad: number; saldo: number }>;
  };
  moraEdades: Array<{ rango: string; cantidad: number; saldo: number }>;
  pendientesRol: Array<{ rol: string; cantidad: number; valor: number }>;
  recaudoPagaduria: Array<{ nombre: string; valor: number; pagos: number }>;
  alertas: Array<{ tipo: string; titulo: string; cantidad: number; valor: number; severidad: string }>;
};

export type OperativoReporte = {
  filtros: { empresas: AddressCatalogItem[]; productos: AddressCatalogItem[]; estados: string[] };
  resumen: {
    solicitudes: number; montoSolicitado: number; aprobadas: number; rechazadas: number;
    comitePendiente: number; liquidacionesPendientes: number; valorLiquidacionesPendientes: number;
    desembolsos: number; valorDesembolsado: number;
  };
  solicitudes: Array<{ credito: string; cliente: string; empresa: string; producto: string; estado: string; fecha: string; monto: number; plazo: number | null; cuota: number | null }>; 
  desembolsos: Array<{ credito: string; cliente: string; empresa: string; fechaDesembolso: string; valorDesembolso: number; bancoDestino: string | null; numeroOrden: string | null; estadoDesembolso: string; comprobantePago: string | null }>; 
  liquidacionesPendientes: Array<{ credito: string; cliente: string; empresa: string; version: number; fecha: string; valorDesembolso: number; valorCredito: number; cuota: number }>; 
  comite: Array<{ credito: string; cliente: string; empresa: string; monto: number; votos: number; votosRequeridos: number | null; fecha: string }>; 
};
export type CarteraReporte = {
  filtros: {
    empresas: AddressCatalogItem[];
    productos: AddressCatalogItem[];
    socios: AddressCatalogItem[];
    estados: string[];
  };
  resumen: {
    saldoTotal: number;
    saldoVencido: number;
    saldoProximo: number;
    cuotasPendientes: number;
    saldoFavor: number;
  };
  cuotas: Array<{
    credito: string;
    cliente: string;
    empresa: string;
    producto: string;
    numeroCuota: number;
    fechaVencimiento: string;
    estado: string;
    diasMora: number;
    valorCuota: number;
    valorMora: number;
    valorPagado: number;
    saldo: number;
  }>;
  recaudos: Array<{
    fechaPago: string;
    credito: string;
    cliente: string;
    valorPago: number;
    saldoFavor: number;
    medioPago: string | null;
  }>;
  porEmpresa: Array<{ nombre: string; cantidad: number; saldo: number; vencido: number }>;
  porProducto: Array<{ nombre: string; cantidad: number; saldo: number; vencido: number }>;
  porSocio: Array<{ nombre: string; cantidad: number; saldo: number }>;
};

export type DocumentTemplateRow = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipoDocumento: string;
  modoPlantilla: string;
  estado: string;
  versiones: number;
  ultimaVersion: number | null;
};

export type DocumentTemplateDetail = DocumentTemplateRow & {
  idVersion: number | null;
  version: number | null;
  contenido: string | null;
  variables: string[];
  estadoVersion: string | null;
};

export type DocumentVariable = { key: string; label: string };
export type PdfTemplateField = {
  id?: number;
  variable: string;
  etiqueta: string;
  tipo: 'TEXTO' | 'CASILLA' | 'FIRMA';
  pagina: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  tamanoFuente: number;
};

export type IdentificationTypeRow = {
  id: number;
  descripcion: string;
  sigla: string;
  codigoDane: string;
};

export type CatalogPermission = {
  id: number;
  nombre: string;
  descripcion: string;
};

export type CatalogSubmodule = {
  id: number;
  nombre: string;
  descripcion: string;
  link: string;
  roles: string[];
  permissions: CatalogPermission[];
};

export type CatalogModule = {
  id: number;
  nombre: string;
  descripcion: string;
  submodules: CatalogSubmodule[];
};

export type CreateModuleBody = {
  nombre: string;
  descripcion: string;
};

export type CreateSubmoduleBody = {
  nombre: string;
  descripcion: string;
  link: string;
  idModulo: number;
};

export type EmpresaRow = {
  id: number;
  nit: string;
  razonSocial: string;
  vendedor: string | null;
  domicilio: string | null;
  direccionCompuesta: string | null;
  idDireccion: number | null;
  correo: string | null;
  telefono: string | null;
  representanteLegal: string | null;
  telefonoRepresentante: string | null;
  tipoIdentificacionRepresentante: string | null;
  identificacionRepresentante: string | null;
  correoRepresentante: string | null;
  codigo: string | null;
  contactoCargo: string | null;
  contactoNombre: string | null;
  contactoCorreo: string | null;
  contactoTelefono: string | null;
  fechaConstitucion: string | null;
  capitalSociedad: number | null;
  fechaVenta: string | null;
  ventasFecha: number | null;
  naturaleza: string | null;
  camaraNumero: string | null;
  camaraLibro: string | null;
  camaraCiudad: string | null;
  periodicidadNomina: string | null;
  diaCorteNomina: number | null;
  diaPagoNomina: number | null;
  segundoDiaPagoNomina: number | null;
  diaDescuentoLibranza: number | null;
  ajustarFinSemana: boolean | null;
  observacionCalendario: string | null;
  estado: string | null;
  empleados: number;
};

export type AddressCatalogItem = {
  id: number;
  nombre: string;
};

export type AddressCatalogs = {
  tiposVia: AddressCatalogItem[];
  letras: AddressCatalogItem[];
  ciudades: AddressCatalogItem[];
};

export type EmployeeCatalogs = {
  tiposContrato: AddressCatalogItem[];
  bancos: AddressCatalogItem[];
  tiposCuenta: AddressCatalogItem[];
  estadosCivil: AddressCatalogItem[];
  tiposVivienda: AddressCatalogItem[];
};

export type EmpleadoEmpresaRow = {
  id: number;
  idEmpresa: number;
  idTipoIdentificacion: number | null;
  identificacion: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  nombreCompleto: string;
  correo: string | null;
  telefono: string | null;
  cargo: string | null;
  idTipoContrato: number | null;
  tipoContrato: string | null;
  salario: number | null;
  idBanco: number | null;
  banco: string | null;
  idTipoCuenta: number | null;
  tipoCuenta: string | null;
  cuentaNomina: string | null;
  tieneEmbargos: boolean;
  idEstadoCivil: number | null;
  estadoCivil: string | null;
  personasCargo: number;
  idTipoVivienda: number | null;
  tipoVivienda: string | null;
  fechaIngreso: string | null;
  estado: string | null;
};

export type SocioRow = {
  id: number;
  identificacion: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  correo: string;
  nombreCompleto: string;
  direccion: string;
  direccionCompuesta: string | null;
  idDireccion: number | null;
  idCiudad: number;
  ciudad: string;
  estado: string;
  idTipoIdentificacion: number;
  tipoIdentificacion: string;
  fechaNacimiento: string | null;
  idBanco: number | null;
  banco: string | null;
  idTipoCuenta: number | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  inversiones: number;
  montoInvertido: number;
  montoAsignado: number;
  saldoDisponible: number;
};

export type InvestmentRateRow = {
  id: number;
  nombre: string;
  tasa: number;
  plazo: number | null;
};

export type SociosCatalogs = {
  tasasInversion: InvestmentRateRow[];
  bancos: AddressCatalogItem[];
  tiposCuenta: AddressCatalogItem[];
};

export type InversionRow = {
  id: number;
  monto: number;
  fechaInversion: string;
  plazo: number;
  tasa: number;
  idTasaInversion: number | null;
  tasaNombre: string | null;
  idSocio: number;
  estado: string;
  montoAsignado: number;
  saldoDisponible: number;
  creditos: string[];
};

export type AliadoRow = {
  id: number;
  identificacion: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string | null;
  logoUrl: string | null;
  direccion: string | null;
  direccionCompuesta: string | null;
  idDireccion: number | null;
  idCiudad: number | null;
  ciudad: string | null;
  idTipoIdentificacion: number;
  tipoIdentificacion: string;
  idBanco: number | null;
  banco: string | null;
  idTipoCuenta: number | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  representante: {
    idTipoIdentificacion: number | null;
    tipoIdentificacion: string | null;
    identificacion: string | null;
    primerNombre: string | null;
    segundoNombre: string | null;
    primerApellido: string | null;
    segundoApellido: string | null;
    genero: string | null;
    telefono: string | null;
    correo: string | null;
    idCiudad: number | null;
    ciudad: string | null;
  };
  camara: {
    numero: string | null;
    libro: string | null;
    idCiudad: number | null;
    ciudad: string | null;
    rees: string | null;
    runeol: string | null;
  };
  estado: string | null;
};

export type AliadosCatalogs = {
  bancos: AddressCatalogItem[];
  tiposCuenta: AddressCatalogItem[];
  generos: Array<{ id: string; nombre: string }>;
};

export type LibranzeraRow = {
  id: number;
  nit: string;
  razonSocial: string;
  domicilio: string | null;
  sitioWeb: string | null;
  correo: string | null;
  telefono: string | null;
  telefonoCallcenter: string | null;
  camaraNumero: string | null;
  camaraLibro: string | null;
  camaraCiudad: string | null;
  fechaConstitucion: string | null;
  ciiu: string | null;
  runeol: string | null;
  representanteLegal: string | null;
  representanteCartera: string | null;
  banco: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  estado: string | null;
  vendedores: number;
};

export type ComercialRow = {
  id: number;
  idLibranzera: number;
  libranzera: string;
  identificacion: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  codigoVendedor: string;
  fechaNacimiento: string | null;
  tipoIdentificacion: string;
  rolVendedor: string | null;
  formulaComercial: string | null;
  tipoComision: string | null;
  valorComision: number | null;
  domicilio: string | null;
  ciudad: string | null;
  banco: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  estado: string | null;
};

export type ComercialesCatalogs = {
  bancos: AddressCatalogItem[];
  tiposCuenta: AddressCatalogItem[];
  rolesVendedor: AddressCatalogItem[];
  formulas: AddressCatalogItem[];
  libranzeras: AddressCatalogItem[];
  generos: Array<{ id: string; nombre: string }>;
};

export type ProductoCreditoRow = {
  id: number;
  consecutivo: string | null;
  nombre: string;
  descripcion: string | null;
  idTipoCredito: number;
  tipoCredito: string;
  idLibranzera: number | null;
  libranzera: string | null;
  montoMinimo: number | null;
  montoMaximo: number | null;
  salarioMinimo: number | null;
  salarioMaximo: number | null;
  plazoMinimo: number | null;
  plazoMaximo: number | null;
  modeloPlazo: string;
  tipoTasa: string;
  permiteCreditoMultiple: boolean;
  interesAjustable: boolean;
  permiteRefinanciacion: boolean;
  permiteRetanqueo: boolean;
  requiereCodeudor: boolean;
  numeroCodeudores: number;
  formatoCredito: string | null;
  formatoRequisitos: string | null;
  formatoCodeudores: string | null;
  proveedorFirma: string | null;
  periodoGracia: number | null;
  periodicidad: string | null;
  diaCorte: number | null;
  diaPagoOportuno: number | null;
  ajustarFinSemana: boolean | null;
  moraDespuesVencimiento: number | null;
  tasaMoraMensual: number | null;
  primeraCuotaMesSiguiente: boolean | null;
  observacionCalendario: string | null;
  estado: string | null;
  activo: boolean;
  version: number;
  idProductoBase: number | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  porcentajeEndeudamientoMaximo: number | null;
  antiguedadMinimaMeses: number | null;
  requiereEmpleadoActivo: boolean;
  bloqueaEmbargos: boolean;
  atributos: number;
  documentos: number;
  etapas: number;
};

export type ParametroFinancieroRow = {
  id: number;
  codigo: string;
  nombre: string;
  valor: number;
  unidad: string;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  activo: boolean;
};

export type FormulaCalculoRow = {
  id: number;
  nombre: string;
  codigo: string | null;
  baseCalculo: string;
  operacion: string;
  requiereValor: boolean;
  requiereValor2: boolean;
  requierePorcentaje: boolean;
  aplicaMinimo: boolean;
  aplicaMaximo: boolean;
  activo: boolean;
};

export type ProductoAtributoRow = {
  id: number;
  tipoAtributo: string;
  tipoCalculo: string;
  nombre: string;
  valor: number | null;
  porcentaje: number | null;
  valor2: number | null;
  minimo: number | null;
  maximo: number | null;
  aplicaIva: boolean;
  obligatorio: boolean;
  proveedor: string | null;
  prioridad: number;
};

export type ProductoConvenioRow = {
  id: number;
  idProductoCredito: number;
  idEmpresa: number;
  empresa: string;
  nit: string | null;
  cupoTotal: number | null;
  cupoUsado: number;
  cupoDisponible: number | null;
  porcentajeEndeudamientoMaximo: number | null;
  requiereValidacionPagaduria: boolean;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  activo: boolean;
  observacion: string | null;
};

export type ProductoDocumentoRow = {
  id: number;
  documento: string;
  obligatorio: boolean;
  prioridad: number;
  aplicaA: string;
  requiereFirma: boolean;
  requiereValidacion: boolean;
};

export type ProductoEtapaRow = {
  id: number;
  idEtapaCredito: number;
  etapa: string;
  orden: number;
  obligatoria: boolean;
  permiteDevolucion: boolean;
  responsable: string | null;
  slaHoras: number | null;
};

export type AtributoCatalogoRow = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  aplicaA?: string | null;
  tipoFormula?: string | null;
  idTipoAtributo?: number | null;
  idTipoCalculo?: number | null;
  valorDefault?: number | null;
  porcentajeDefault?: number | null;
  minimoDefault?: number | null;
  maximoDefault?: number | null;
  proveedorDefault?: string | null;
  prioridadDefault?: number | null;
  aplicaIvaDefault?: boolean;
  obligatorioDefault?: boolean;
};

export type ProductosCreditoCatalogs = {
  tiposCredito: AddressCatalogItem[];
  tiposAtributo: AddressCatalogItem[];
  tiposCalculo: FormulaCalculoRow[];
  documentos: AddressCatalogItem[];
  etapas: AddressCatalogItem[];
  libranzeras: AddressCatalogItem[];
  atributosCatalogo?: AtributoCatalogoRow[];
};

export type CreditoRow = {
  id: number;
  consecutivo: string;
  idProductoCredito: number;
  producto: string;
  tipoCredito: string;
  idLibranzera: number | null;
  libranzera: string | null;
  idEmpresa: number | null;
  empresa: string | null;
  idEmpleadoEmpresa: number | null;
  empleado: string | null;
  idComercial: number | null;
  comercial: string | null;
  identificacionCliente: string;
  nombreCliente: string;
  correoCliente: string | null;
  telefonoCliente: string | null;
  montoSolicitado: number;
  plazo: number;
  tipoTasa: string | null;
  tasa: number | null;
  cuotaEstimada: number | null;
  estado: string | null;
  fechaRadicacion: string;
  documentos: number;
  etapas: number;
};

export type CreditosCatalogs = {
  productos: AddressCatalogItem[];
  libranzeras: AddressCatalogItem[];
  empresas: AddressCatalogItem[];
  empleados: AddressCatalogItem[];
  comerciales: AddressCatalogItem[];
};

export type CreditoDocumentoRow = {
  id: number;
  documento: string;
  obligatorio: boolean;
  aplicaA: string;
  prioridad: number;
  requiereFirma: boolean;
  requiereValidacion: boolean;
  estadoDocumento: string;
  archivoUrl: string | null;
  archivoNombre: string | null;
  archivoMime: string | null;
  archivoTamano: number | null;
};

export type CreditoEtapaRow = {
  id: number;
  etapa: string;
  orden: number;
  obligatoria: boolean;
  permiteDevolucion: boolean;
  responsable: string | null;
  slaHoras: number | null;
  estadoEtapa: string;
  fechaInicio: string | null;
  fechaFin: string | null;
};

export type CreditoLiquidacionRow = {
  id: number;
  nombre: string;
  tipoAtributo: string | null;
  tipoCalculo: string | null;
  valor: number | null;
  porcentaje: number | null;
  valorCalculado: number | null;
  aplicaIva: boolean;
};

export type CreditoLiquidacionDefinitivaRow = {
  id: number;
  creditoId: number;
  version: number;
  estado: string;
  montoSolicitado: number;
  montoAprobado: number | null;
  plazo: number;
  tasaMensual: number;
  cuota: number;
  cargosFinanciados: number;
  descuentosDesembolso: number;
  iva: number;
  valorDesembolso: number;
  valorCredito: number;
  totalIntereses: number;
  totalPagar: number;
  conceptos: Array<Record<string, unknown>>;
  planPagos: Array<Record<string, unknown>>;
  observacion: string | null;
  requiereComite: boolean;
  votosRequeridos: number | null;
  votosActuales: number | null;
  estadoComite: string | null;
  usuario: string | null;
  fecha: string;
};

export type CreditoHistorialRow = {
  id: number;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  observacion: string | null;
  usuario: string | null;
  fecha: string;
};

export type CreditoEvaluacionRow = EvaluacionCreditoAutomatica & {
  id: number;
  observacion: string | null;
  usuario: string | null;
  fecha: string;
};

export type CreditoDecisionRow = {
  id: number;
  decision: string;
  montoAprobado: number | null;
  plazoAprobado: number | null;
  tasaAprobada: number | null;
  cuotaAprobada: number | null;
  observacion: string | null;
  requiereComite: boolean;
  votosRequeridos: number | null;
  votosActuales: number | null;
  estadoComite: string | null;
  usuario: string | null;
  fecha: string;
};

export type CreditoDesembolsoRow = {
  id: number;
  valorDesembolso: number;
  fechaDesembolso: string;
  bancoDestino: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  referenciaPago: string | null;
  numeroOrden: string | null;
  estadoDesembolso: string;
  fechaOrden: string | null;
  fechaEjecucion: string | null;
  comprobantePago: string | null;
  observacion: string | null;
  usuario: string | null;
  fechaRegistro: string;
};

export type CreditoFondeoRow = {
  id: number;
  idInversion: number;
  idInversionista: number;
  inversionista: string;
  valorAsignado: number;
  fechaAsignacion: string;
  observacion: string | null;
  usuario: string | null;
};

export type CreditoCuotaRow = {
  id: number;
  numero: number;
  fechaCorte: string;
  fechaPagoOportuno: string;
  fechaVencimiento: string;
  saldoInicial: number;
  capital: number;
  interes: number;
  cargos: number;
  valorCuota: number;
  diasMora: number;
  valorMora: number;
  capitalCausado: number;
  interesCausado: number;
  cargosCausados: number;
  moraCausada: number;
  fechaCausacion: string | null;
  valorPagado: number;
  saldoCuota: number;
  capitalPagado: number;
  interesPagado: number;
  cargosPagados: number;
  moraPagada: number;
  fechaUltimoPago: string | null;
  saldoFinal: number;
  estado: string;
  periodicidad: string;
  observacion: string | null;
};

export type RecaudoMasivoResultado = {
  referenciaLote: string | null;
  periodoNomina: string;
  fechaPago: string;
  totalFilas: number;
  aplicados: number;
  rechazados: number;
  valorAplicado: number;
  valorRechazado: number;
  resultados: Array<{
    fila: number;
    aplicado: boolean;
    creditoId: number | null;
    consecutivo: string | null;
    valorPago: number;
    mensaje: string;
  }>;
};

export type CreditoExtractoRow = {
  id: number;
  fecha: string;
  tipo: string;
  concepto: string;
  debito: number;
  credito: number;
  saldoContable: number;
  carteraCausada: number;
  interesCausado: number;
  moraCausada: number;
  recaudoAplicado: number;
  referenciaTipo: string | null;
  referenciaId: number | null;
  observacion: string | null;
  usuario: string | null;
  fechaRegistro: string;
};

export type CreditoPagoRow = {
  id: number;
  fechaPago: string;
  valorPago: number;
  saldoFavor: number;
  medioPago: string | null;
  referenciaPago: string | null;
  tipoRecaudo: string;
  periodoNomina: string | null;
  estadoPago: string;
  observacion: string | null;
  usuario: string | null;
  soportes: number;
  soporteNombre: string | null;
  soporteMimeType: string | null;
  fechaRegistro: string;
};

export type FondeoDisponibleRow = {
  idInversion: number;
  idInversionista: number;
  inversionista: string;
  fechaInversion: string;
  montoInversion: number;
  montoAsignado: number;
  saldoDisponible: number;
  tasa: number;
  plazo: number;
};

export type FirmaCreditoRow = {
  id: number;
  creditoId: number;
  documentoGeneradoId: number;
  proveedor: string;
  externalDocumentId: string | null;
  signUrl: string | null;
  estado: string;
  firmanteNombre: string;
  firmanteCorreo: string | null;
  firmanteTelefono: string | null;
  documento?: string;
  documentoFirmado?: string | null;
  fechaEnvio: string | null;
  fechaFirma: string | null;
};

export type EvaluacionCreditoAutomatica = {
  recomendacion: 'APROBAR' | 'REVISAR' | 'RECHAZAR';
  puntaje: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  bloqueos: string[];
  alertas: string[];
  positivos: string[];
  metricas: {
    ingresoBase: number | null;
    cuota: number;
    usoCapacidad: number | null;
    cargos: number;
    relacionCargos: number;
  };
};

export type CreditoExpediente = {
  credito: CreditoRow;
  evaluacionAutomatica?: EvaluacionCreditoAutomatica;
  sugerenciaCalendario?: {
    periodicidad: string;
    diaCorte: number;
    diaPagoOportuno: number;
    segundoDiaPagoNomina: number | null;
    ajustarFinSemana: boolean;
    moraDespuesVencimiento: number;
    tasaMoraMensual: number;
    primeraCuotaMesSiguiente: boolean;
    observacionCalendario: string | null;
    origen: string;
  };
  documentos: CreditoDocumentoRow[];
  etapas: CreditoEtapaRow[];
  liquidacion: CreditoLiquidacionRow[];
  liquidacionDefinitiva: CreditoLiquidacionDefinitivaRow | null;
  liquidacionesDefinitivas: CreditoLiquidacionDefinitivaRow[];
  historial: CreditoHistorialRow[];
  evaluaciones: CreditoEvaluacionRow[];
  decisiones: CreditoDecisionRow[];
  desembolsos: CreditoDesembolsoRow[];
  fondeos: CreditoFondeoRow[];
  cuotas: CreditoCuotaRow[];
  pagos: CreditoPagoRow[];
  extracto: CreditoExtractoRow[];
  perfilCliente: {
    portal: {
      id: number | null;
      nombre: string | null;
      correo: string | null;
      telefono: string | null;
      cargo: string | null;
      tipoContrato: string | null;
      fechaIngreso: string | null;
      salario: number | null;
      neto: number | null;
      tieneEmbargos: boolean | null;
      correoConfirmado: boolean | null;
    };
    empleado: {
      nombre: string | null;
      cargo: string | null;
      salario: number | null;
      banco: string | null;
      tipoCuenta: string | null;
      cuentaNomina: string | null;
      estadoCivil: string | null;
      personasCargo: number | null;
      tipoVivienda: string | null;
    };
    empresa: {
      nit: string | null;
      razonSocial: string | null;
      codigo: string | null;
      correo: string | null;
      telefono: string | null;
      representanteLegal: string | null;
    };
  } | null;
  siguienteAccion: string;
};

export type SimulacionCredito = {
  producto: {
    id: number;
    nombre: string;
    tipoTasa: string | null;
    montoMinimo: number | null;
    montoMaximo: number | null;
    plazoMinimo: number | null;
    plazoMaximo: number | null;
  };
  resumen: {
    montoSolicitado: number;
    valorDesembolso: number;
    valorCredito: number;
    cargosFinanciados: number;
    descuentosDesembolso: number;
    plazo: number;
    tasaMensual: number;
    cuotaEstimada: number;
    totalIntereses: number;
    totalPagar: number;
  };
  evaluacion?: {
    aprobado: boolean;
    requiereRevision: boolean;
    alertas: string[];
    bloqueos: string[];
    reglas: { porcentajeEndeudamientoMaximo: number; antiguedadMinimaMeses: number; requiereEmpleadoActivo: boolean; bloqueaEmbargos: boolean };
    empleado: { id: number; nombre: string | null; salario: number; neto: number; estado: string | null; tieneEmbargos: boolean; antiguedadMeses: number | null } | null;
    capacidad: { base: number; cuota: number; capacidadMaxima: number; disponible: number; usoCapacidad: number | null } | null;
  };
  atributos: Array<{
    id: number;
    nombre: string;
    tipoAtributo: string;
    tipoCalculo: string;
    valor: number | null;
    porcentaje: number | null;
    valorCalculado: number;
    aplicaIva: boolean;
    obligatorio: boolean;
    prioridad: number;
    sumaAlCredito: boolean;
    esDescuento: boolean;
  }>;
  plan: Array<{
    numero: number;
    saldoInicial: number;
    capital: number;
    interes: number;
    cuota: number;
    saldoFinal: number;
  }>;
};

export type PortalCliente = {
  id: number;
  idEmpresa: number | null;
  empresa: string | null;
  codigoEmpresa: string | null;
  idEmpleadoEmpresa: number | null;
  identificacion: string;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  cargo: string | null;
  tipoContrato: string | null;
  fechaIngreso: string | null;
  salario: number | null;
  neto: number | null;
  tieneEmbargos: boolean;
  correoConfirmado: boolean;
  perfilCompleto: boolean;
  estado: string | null;
};

export type PortalCatalogs = {
  tiposIdentificacion: IdentificationTypeRow[];
  tiposContrato: AddressCatalogItem[];
};

export type PortalAuthResponse = {
  token: string;
  cliente: PortalCliente;
  confirmationToken?: string;
};

export type PortalProductoCredito = {
  id: number;
  nombre: string;
  descripcion: string | null;
  montoMinimo: number | null;
  montoMaximo: number | null;
  plazoMinimo: number | null;
  plazoMaximo: number | null;
  tipoTasa: string | null;
  tipoCredito: string;
  tasaMensual: number | null;
};

export type PortalCreditosResponse = {
  resumen: {
    activos: number;
    solicitados: number;
    aprobados: number;
    rechazados: number;
  };
  creditos: Array<{
    id: number;
    consecutivo: string;
    producto: string;
    monto: number;
    plazo: number;
    cuota: number | null;
    estado: string;
    fecha: string;
  }>;
};

const API_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const issueMessage = Array.isArray(payload?.issues)
      ? payload.issues.map((issue: { path?: string[]; message?: string }) => `${issue.path?.join('.') || 'campo'}: ${issue.message}`).join(' | ')
      : null;
    const message = issueMessage || payload?.message || 'Error inesperado';
    const error = new Error(message) as Error & { status?: number; details?: unknown };
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload as T;
}

export const api = {
  getDashboardGerencial: (token: string, fechaInicio = '', fechaFin = '') => {
    const query = new URLSearchParams();
    if (fechaInicio) query.set('fechaInicio', fechaInicio);
    if (fechaFin) query.set('fechaFin', fechaFin);
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<DashboardGerencial>(`/api/v1/dashboard/gerencial${suffix}`, {}, token);
  },
  getReporteOperativo: (token: string, filters: { fechaInicio?: string; fechaFin?: string; idEmpresa?: string; idProducto?: string; estado?: string }) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<OperativoReporte>(`/api/v1/dashboard/operativo${suffix}`, {}, token);
  },
  getReporteCartera: (token: string, filters: { fechaInicio?: string; fechaFin?: string; idEmpresa?: string; idProducto?: string; idSocio?: string; estado?: string }) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<CarteraReporte>(`/api/v1/dashboard/cartera${suffix}`, {}, token);
  },
  listDocumentTemplates: (token: string) => request<DocumentTemplateRow[]>('/api/v1/documentos/plantillas', {}, token),
  getDocumentTemplate: (token: string, id: number) => request<DocumentTemplateDetail>(`/api/v1/documentos/plantillas/${id}`, {}, token),
  listDocumentVariables: (token: string) => request<DocumentVariable[]>('/api/v1/documentos/variables', {}, token),
  createDocumentTemplate: (token: string, body: unknown) =>
    request<DocumentTemplateDetail>('/api/v1/documentos/plantillas', { method: 'POST', body: JSON.stringify(body) }, token),
  createDocumentTemplateVersion: (token: string, id: number, body: unknown) =>
    request<{ idVersion: number }>(`/api/v1/documentos/plantillas/${id}/versiones`, { method: 'POST', body: JSON.stringify(body) }, token),
  generateDocument: (token: string, templateId: number, creditoId: number) =>
    request<{ id: number; fileName: string; hash: string }>(`/api/v1/documentos/plantillas/${templateId}/generar`, {
      method: 'POST', body: JSON.stringify({ creditoId })
    }, token),
  getGeneratedDocumentPdf: async (token: string, id: number) => {
    const response = await fetch(`${API_URL}/api/v1/documentos/generados/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('No se pudo abrir el documento generado');
    return response.blob();
  },
  uploadTemplatePdfBase: async (token: string, templateId: number, file: File) => {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch(`${API_URL}/api/v1/documentos/plantillas/${templateId}/pdf-base`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: data
    });
    if (!response.ok) throw new Error('No se pudo cargar el PDF base');
    return response.json() as Promise<{ fileName: string; hash: string; pages: number }>;
  },
  getTemplatePdfBase: async (token: string, templateId: number) => {
    const response = await fetch(`${API_URL}/api/v1/documentos/plantillas/${templateId}/pdf-base`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('La plantilla no tiene un PDF base');
    return response.arrayBuffer();
  },
  listTemplatePdfFields: (token: string, templateId: number) =>
    request<PdfTemplateField[]>(`/api/v1/documentos/plantillas/${templateId}/campos-pdf`, {}, token),
  saveTemplatePdfFields: (token: string, templateId: number, campos: PdfTemplateField[]) =>
    request<PdfTemplateField[]>(`/api/v1/documentos/plantillas/${templateId}/campos-pdf`, {
      method: 'PUT', body: JSON.stringify({ campos })
    }, token),
  login: (username: string, password: string) =>
    request<LoginResponse>('/api/v1/security/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: (token: string) => request<SecurityUser>('/api/v1/security/auth/me', {}, token),
  listUsers: (token: string) => request<UserRow[]>('/api/v1/security/usuarios', {}, token),
  listRoles: (token: string) => request<RoleRow[]>('/api/v1/security/roles', {}, token),
  listPermissions: (token: string) => request<PermissionRow[]>('/api/v1/security/permisos', {}, token),
  listCatalogModules: (token: string) => request<CatalogModule[]>('/api/v1/security/catalogo/modulos', {}, token),
  listMyModules: (token: string) => request<CatalogModule[]>('/api/v1/security/catalogo/mis-modulos', {}, token),
  listIdentificationTypes: (token: string) => request<IdentificationTypeRow[]>('/api/v1/security/catalogo/tipos-identificacion', {}, token),
  createUser: (token: string, body: unknown) => request<SecurityUser>('/api/v1/security/usuarios', { method: 'POST', body: JSON.stringify(body) }, token),
  createRole: (token: string, body: unknown) => request<RoleRow>('/api/v1/security/roles', { method: 'POST', body: JSON.stringify(body) }, token),
  createPermission: (token: string, body: unknown) => request<PermissionRow>('/api/v1/security/permisos', { method: 'POST', body: JSON.stringify(body) }, token),
  createModule: (token: string, body: CreateModuleBody) => request<CatalogModule>('/api/v1/security/modulos', { method: 'POST', body: JSON.stringify(body) }, token),
  createSubmodule: (token: string, body: CreateSubmoduleBody) =>
    request<CatalogSubmodule>('/api/v1/security/submodulos', { method: 'POST', body: JSON.stringify(body) }, token),
  updateUserRoles: (token: string, userId: number, roleIds: number[]) =>
    request<{ updated: boolean }>(`/api/v1/security/usuarios/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ roleIds }) }, token),
  updateRolePermissions: (token: string, roleId: number, permissionIds: number[]) =>
    request<{ updated: boolean }>(`/api/v1/security/roles/${roleId}/permisos`, { method: 'PUT', body: JSON.stringify({ permissionIds }) }, token),
  updatePassword: (token: string, userId: number, contrasena: string) =>
    request<{ updated: boolean }>(`/api/v1/security/usuarios/${userId}/contrasena`, { method: 'PATCH', body: JSON.stringify({ contrasena }) }, token),
  listAddressCatalogs: (token: string) => request<AddressCatalogs>('/api/v1/empresas/catalogos-direccion', {}, token),
  listEmployeeCatalogs: (token: string) => request<EmployeeCatalogs>('/api/v1/empresas/catalogos-empleados', {}, token),
  listEmpresas: (token: string) => request<EmpresaRow[]>('/api/v1/empresas', {}, token),
  createEmpresa: (token: string, body: unknown) => request<EmpresaRow>('/api/v1/empresas', { method: 'POST', body: JSON.stringify(body) }, token),
  listEmpleadosEmpresa: (token: string, empresaId: number) => request<EmpleadoEmpresaRow[]>(`/api/v1/empresas/${empresaId}/empleados`, {}, token),
  createEmpleadoEmpresa: (token: string, empresaId: number, body: unknown) =>
    request<EmpleadoEmpresaRow>(`/api/v1/empresas/${empresaId}/empleados`, { method: 'POST', body: JSON.stringify(body) }, token),
  bulkCreateEmpleadosEmpresa: (token: string, empresaId: number, empleados: unknown[]) =>
    request<{ total: number; empleados: EmpleadoEmpresaRow[] }>(`/api/v1/empresas/${empresaId}/empleados/carga-masiva`, { method: 'POST', body: JSON.stringify({ empleados }) }, token),
  listSociosCatalogs: (token: string) => request<SociosCatalogs>('/api/v1/socios/catalogos', {}, token),
  listSocios: (token: string) => request<SocioRow[]>('/api/v1/socios', {}, token),
  createSocio: (token: string, body: unknown) => request<SocioRow>('/api/v1/socios', { method: 'POST', body: JSON.stringify(body) }, token),
  listInversionesSocio: (token: string, socioId: number) => request<InversionRow[]>(`/api/v1/socios/${socioId}/inversiones`, {}, token),
  createInversionSocio: (token: string, socioId: number, body: unknown) =>
    request<InversionRow>(`/api/v1/socios/${socioId}/inversiones`, { method: 'POST', body: JSON.stringify(body) }, token),
  listAliadosCatalogs: (token: string) => request<AliadosCatalogs>('/api/v1/aliados/catalogos', {}, token),
  listAliados: (token: string) => request<AliadoRow[]>('/api/v1/aliados', {}, token),
  createAliado: (token: string, body: unknown) => request<AliadoRow>('/api/v1/aliados', { method: 'POST', body: JSON.stringify(body) }, token),
  listComercialesCatalogs: (token: string) => request<ComercialesCatalogs>('/api/v1/comerciales/catalogos', {}, token),
  listLibranzeras: (token: string) => request<LibranzeraRow[]>('/api/v1/comerciales/libranzeras', {}, token),
  createLibranzera: (token: string, body: unknown) => request<LibranzeraRow>('/api/v1/comerciales/libranzeras', { method: 'POST', body: JSON.stringify(body) }, token),
  listComerciales: (token: string) => request<ComercialRow[]>('/api/v1/comerciales/vendedores', {}, token),
  createComercial: (token: string, body: unknown) => request<ComercialRow>('/api/v1/comerciales/vendedores', { method: 'POST', body: JSON.stringify(body) }, token),
  updateComercial: (token: string, id: number, body: unknown) => request<ComercialRow>(`/api/v1/comerciales/vendedores/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  updateComercialEstado: (token: string, id: number, activo: boolean) =>
    request<ComercialRow>(`/api/v1/comerciales/vendedores/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo }) }, token),
  listProductosCreditoCatalogs: (token: string) => request<ProductosCreditoCatalogs>('/api/v1/productos-creditos/catalogos', {}, token),
  listProductosCredito: (token: string) => request<ProductoCreditoRow[]>('/api/v1/productos-creditos', {}, token),
  createTipoCalculoCredito: (token: string, body: unknown) => request<FormulaCalculoRow>('/api/v1/productos-creditos/formulas', { method: 'POST', body: JSON.stringify(body) }, token),
  listParametrosFinancieros: (token: string) => request<ParametroFinancieroRow[]>('/api/v1/productos-creditos/parametros', {}, token),
  createParametroFinanciero: (token: string, body: unknown) => request<ParametroFinancieroRow>('/api/v1/productos-creditos/parametros', { method: 'POST', body: JSON.stringify(body) }, token),
  createProductoCredito: (token: string, body: unknown) => request<ProductoCreditoRow>('/api/v1/productos-creditos', { method: 'POST', body: JSON.stringify(body) }, token),
  updateProductoCredito: (token: string, id: number, body: unknown) => request<ProductoCreditoRow>(`/api/v1/productos-creditos/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  updateProductoCreditoEstado: (token: string, id: number, activo: boolean) => request<ProductoCreditoRow>(`/api/v1/productos-creditos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo }) }, token),
  createProductoCreditoVersion: (token: string, id: number) => request<ProductoCreditoRow>(`/api/v1/productos-creditos/${id}/versiones`, { method: 'POST' }, token),
  deleteProductoCredito: (token: string, id: number) => request<{ deleted: boolean }>(`/api/v1/productos-creditos/${id}`, { method: 'DELETE' }, token),
  listProductoAtributos: (token: string, productoId: number) => request<ProductoAtributoRow[]>(`/api/v1/productos-creditos/${productoId}/atributos`, {}, token),
  createProductoAtributo: (token: string, productoId: number, body: unknown) =>
    request<ProductoAtributoRow[]>(`/api/v1/productos-creditos/${productoId}/atributos`, { method: 'POST', body: JSON.stringify(body) }, token),
  updateProductoAtributo: (token: string, productoId: number, atributoId: number, body: unknown) =>
    request<ProductoAtributoRow[]>(`/api/v1/productos-creditos/${productoId}/atributos/${atributoId}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  deleteProductoAtributo: (token: string, productoId: number, atributoId: number) =>
    request<ProductoAtributoRow[]>(`/api/v1/productos-creditos/${productoId}/atributos/${atributoId}`, { method: 'DELETE' }, token),
  listProductoConvenios: (token: string, productoId: number) => request<ProductoConvenioRow[]>(`/api/v1/productos-creditos/${productoId}/convenios`, {}, token),
  saveProductoConvenio: (token: string, productoId: number, body: unknown) =>
    request<ProductoConvenioRow[]>(`/api/v1/productos-creditos/${productoId}/convenios`, { method: 'POST', body: JSON.stringify(body) }, token),
  deleteProductoConvenio: (token: string, productoId: number, convenioId: number) =>
    request<ProductoConvenioRow[]>(`/api/v1/productos-creditos/${productoId}/convenios/${convenioId}`, { method: 'DELETE' }, token),
  listProductoDocumentos: (token: string, productoId: number) => request<ProductoDocumentoRow[]>(`/api/v1/productos-creditos/${productoId}/documentos`, {}, token),
  createProductoDocumento: (token: string, productoId: number, body: unknown) =>
    request<ProductoDocumentoRow[]>(`/api/v1/productos-creditos/${productoId}/documentos`, { method: 'POST', body: JSON.stringify(body) }, token),
  updateProductoDocumento: (token: string, productoId: number, documentoId: number, body: unknown) =>
    request<ProductoDocumentoRow[]>(`/api/v1/productos-creditos/${productoId}/documentos/${documentoId}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  deleteProductoDocumento: (token: string, productoId: number, documentoId: number) =>
    request<ProductoDocumentoRow[]>(`/api/v1/productos-creditos/${productoId}/documentos/${documentoId}`, { method: 'DELETE' }, token),
  listProductoEtapas: (token: string, productoId: number) => request<ProductoEtapaRow[]>(`/api/v1/productos-creditos/${productoId}/etapas`, {}, token),
  createProductoEtapa: (token: string, productoId: number, body: unknown) =>
    request<ProductoEtapaRow[]>(`/api/v1/productos-creditos/${productoId}/etapas`, { method: 'POST', body: JSON.stringify(body) }, token),
  updateProductoEtapa: (token: string, productoId: number, etapaId: number, body: unknown) =>
    request<ProductoEtapaRow[]>(`/api/v1/productos-creditos/${productoId}/etapas/${etapaId}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  deleteProductoEtapa: (token: string, productoId: number, etapaId: number) =>
    request<ProductoEtapaRow[]>(`/api/v1/productos-creditos/${productoId}/etapas/${etapaId}`, { method: 'DELETE' }, token),
  listCreditosCatalogs: (token: string) => request<CreditosCatalogs>('/api/v1/creditos/catalogos', {}, token),
  listCreditos: (token: string) => request<CreditoRow[]>('/api/v1/creditos', {}, token),
  simularCredito: (token: string, body: unknown) => request<SimulacionCredito>('/api/v1/creditos/simular', { method: 'POST', body: JSON.stringify(body) }, token),
  createCredito: (token: string, body: unknown) => request<CreditoRow>('/api/v1/creditos', { method: 'POST', body: JSON.stringify(body) }, token),
  listCreditoDocumentos: (token: string, creditoId: number) => request<CreditoDocumentoRow[]>(`/api/v1/creditos/${creditoId}/documentos`, {}, token),
  listCreditoEtapas: (token: string, creditoId: number) => request<CreditoEtapaRow[]>(`/api/v1/creditos/${creditoId}/etapas`, {}, token),
  getCreditoExpediente: (token: string, creditoId: number) => request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/expediente`, {}, token),
  registrarEvaluacionCredito: (token: string, creditoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/evaluacion`, { method: 'POST', body: JSON.stringify(body) }, token),
  registrarLiquidacionDefinitiva: (token: string, creditoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/liquidacion-definitiva`, { method: 'POST', body: JSON.stringify(body) }, token),
  anularLiquidacionDefinitiva: (token: string, liquidacionId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/liquidaciones/${liquidacionId}/anulacion`, { method: 'POST', body: JSON.stringify(body) }, token),
  decideCredito: (token: string, creditoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/decision`, { method: 'POST', body: JSON.stringify(body) }, token),
  registrarDesembolso: (token: string, creditoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/desembolso`, { method: 'POST', body: JSON.stringify(body) }, token),
  anularDesembolsoCredito: (token: string, desembolsoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/desembolsos/${desembolsoId}/anulacion`, { method: 'POST', body: JSON.stringify(body) }, token),
  causarCredito: (token: string, creditoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/causacion`, { method: 'POST', body: JSON.stringify(body) }, token),
  listOpcionesFondeo: (token: string) => request<FondeoDisponibleRow[]>('/api/v1/creditos/fondeo/opciones', {}, token),
  asignarFondeoCredito: (token: string, creditoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/fondeo`, { method: 'POST', body: JSON.stringify(body) }, token),
  registrarPagoCredito: (token: string, creditoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/${creditoId}/pagos`, { method: 'POST', body: JSON.stringify(body) }, token),
  reversarPagoCredito: (token: string, pagoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/pagos/${pagoId}/reverso`, { method: 'POST', body: JSON.stringify(body) }, token),
  registrarRecaudoMasivo: (token: string, body: unknown) =>
    request<RecaudoMasivoResultado>('/api/v1/creditos/recaudos/masivo', { method: 'POST', body: JSON.stringify(body) }, token),
  uploadCreditoPagoSoporte: async (token: string, pagoId: number, file: File) => {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch(`${API_URL}/api/v1/creditos/pagos/${pagoId}/soporte`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: data
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'No se pudo cargar el soporte de pago');
    return payload as CreditoExpediente;
  },
  getCreditoPagoSoporte: async (token: string, pagoId: number) => {
    const response = await fetch(`${API_URL}/api/v1/creditos/pagos/${pagoId}/soporte`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('No se pudo abrir el soporte de pago');
    return response.blob();
  },
  updateCreditoEtapa: (token: string, etapaId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/etapas/${etapaId}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  updateCreditoDocumento: (token: string, documentoId: number, body: unknown) =>
    request<CreditoExpediente>(`/api/v1/creditos/documentos/${documentoId}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  uploadCreditoDocumentoArchivo: async (token: string, documentoId: number, file: File) => {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch(`${API_URL}/api/v1/creditos/documentos/${documentoId}/archivo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: data
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'No se pudo cargar el archivo');
    return payload as CreditoExpediente;
  },
  getCreditoDocumentoArchivo: async (token: string, documentoId: number) => {
    const response = await fetch(`${API_URL}/api/v1/creditos/documentos/${documentoId}/archivo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('No se pudo abrir el archivo');
    return response.blob();
  },
  listFirmasCredito: (token: string, creditoId: number) => request<FirmaCreditoRow[]>(`/api/v1/firmas/creditos/${creditoId}`, {}, token),
  crearFirmaCredito: (token: string, body: unknown) =>
    request<FirmaCreditoRow>('/api/v1/firmas', { method: 'POST', body: JSON.stringify(body) }, token),
  updateFirmaEstado: (token: string, firmaId: number, estado: string) =>
    request<FirmaCreditoRow>(`/api/v1/firmas/${firmaId}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }, token),
  getFirmaPdfFirmado: async (token: string, firmaId: number) => {
    const response = await fetch(`${API_URL}/api/v1/firmas/${firmaId}/pdf-firmado`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('No se pudo abrir el PDF firmado');
    return response.blob();
  },
  listPortalCatalogs: () => request<PortalCatalogs>('/api/v1/portal/catalogos'),
  registerPortalClient: (body: unknown) => request<PortalAuthResponse>('/api/v1/portal/registro', { method: 'POST', body: JSON.stringify(body) }),
  loginPortalClient: (identificacion: string, password: string) =>
    request<PortalAuthResponse>('/api/v1/portal/login', { method: 'POST', body: JSON.stringify({ identificacion, password }) }),
  forgotPortalPassword: (correo: string) =>
    request<{ sent: boolean; emailSent?: boolean; resetUrl?: string }>('/api/v1/portal/forgot-password', { method: 'POST', body: JSON.stringify({ correo }) }),
  resetPortalPassword: (token: string, password: string) =>
    request<{ updated: boolean }>('/api/v1/portal/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  confirmPortalEmail: (token: string) =>
    request<PortalCliente>('/api/v1/portal/confirm-email', { method: 'POST', body: JSON.stringify({ token }) }),
  mePortal: (token: string) => request<PortalCliente>('/api/v1/portal/me', {}, token),
  completePortalLaborProfile: (token: string, body: unknown) =>
    request<PortalCliente>('/api/v1/portal/perfil-laboral', { method: 'PUT', body: JSON.stringify(body) }, token),
  listPortalProductos: (token: string) => request<PortalProductoCredito[]>('/api/v1/portal/productos', {}, token),
  listPortalCreditos: (token: string) => request<PortalCreditosResponse>('/api/v1/portal/creditos', {}, token),
  simularPortalCredito: (token: string, body: unknown) => request<SimulacionCredito>('/api/v1/portal/simular', { method: 'POST', body: JSON.stringify(body) }, token),
  crearSolicitudPortal: (token: string, body: unknown) => request<CreditoRow>('/api/v1/portal/solicitudes', { method: 'POST', body: JSON.stringify(body) }, token)
};

