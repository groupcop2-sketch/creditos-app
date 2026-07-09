const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    process.env[key.trim()] ??= valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const schema = '"Creditos"';

async function getActiveStateId(client) {
  const result = await client.query(`select id_estado from ${schema}."TBL_ESTADOS" where lower(v_descripcion) = 'activo' limit 1`);
  if (result.rows[0]?.id_estado) return result.rows[0].id_estado;
  const created = await client.query(`insert into ${schema}."TBL_ESTADOS" (v_descripcion) values ('Activo') returning id_estado`);
  return created.rows[0].id_estado;
}

async function ensureByName(client, table, idColumn, nameColumn, name, extraColumns = '', extraValues = []) {
  const found = await client.query(`select ${idColumn} as id from ${schema}."${table}" where upper(${nameColumn}) = upper($1) limit 1`, [name]);
  if (found.rows[0]?.id) return found.rows[0].id;
  const columns = extraColumns ? `${nameColumn}, ${extraColumns}` : nameColumn;
  const placeholders = [name, ...extraValues].map((_, index) => `$${index + 1}`).join(', ');
  const created = await client.query(
    `insert into ${schema}."${table}" (${columns}) values (${placeholders}) returning ${idColumn} as id`,
    [name, ...extraValues]
  );
  return created.rows[0].id;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('begin');

    const activeStateId = await getActiveStateId(client);
    const tipoIdentificacionId = await ensureByName(client, 'TBL_TIP_IDENTIFICACIONES', 'id_tip_identificacion', 'v_sigla_identificacion', 'CC', 'v_des_identificacion, v_cod_dane', ['CEDULA DE CIUDADANIA', '13']);
    const bancoId = await ensureByName(client, 'TBL_BANCOS', 'id_banco', 'des_banco', 'BANCOLOMBIA');
    const tipoCuentaId = await ensureByName(client, 'TBL_TIPO_CUENTAS', 'id_tipo_cuenta', 'des_tipo_cuenta', 'AHORRO');
    const tipoContratoId = await ensureByName(client, 'TBL_TIPO_CONTRATO', 'id_tipo_contrato', 'des_tipo_contrato', 'INDEFINIDO');
    const estadoCivilId = await ensureByName(client, 'TBL_ESTADO_CIVIL', 'id_estado_civil', 'des_estado_civil', 'SOLTERO');
    const tipoViviendaId = await ensureByName(client, 'TBL_TIPO_VIVIENDA', 'id_tipo_vivienda', 'des_tipo_vivienda', 'FAMILIAR');
    const rolVendedorId = await ensureByName(client, 'TBL_ROLES_VENDEDOR', 'id_rol_vendedor', 'des_rol_vendedor', 'ASESOR COMERCIAL');
    const formulaComercialId = await ensureByName(client, 'TBL_FORMULAS_COMERCIAL', 'id_formula_comercial', 'des_formula', 'COMISION BASE', 'val_porcentaje', [1.5]);
    const ciudadId = await ensureByName(client, 'TBL_CIUDADES', 'id_ciudad', 'v_nom_ciudad', 'BARRANQUILLA', 'v_cod_dane', ['08001']);

    const tipoCreditoId = await ensureByName(client, 'TBL_TIPOS_CREDITO', 'id_tipo_credito', 'des_tipo_credito', 'LIBRANZA');
    const tipoAtributoCreditoId = await ensureByName(client, 'TBL_TIPOS_ATRIBUTO_CREDITO', 'id_tipo_atributo', 'des_tipo_atributo', 'CREDITO');
    const tipoAtributoCuotaId = await ensureByName(client, 'TBL_TIPOS_ATRIBUTO_CREDITO', 'id_tipo_atributo', 'des_tipo_atributo', 'CUOTA');
    const tipoCalculoValorId = await ensureByName(client, 'TBL_TIPOS_CALCULO_CREDITO', 'id_tipo_calculo', 'des_tipo_calculo', 'VALOR FIJO');
    const tipoCalculoPorcentajeId = await ensureByName(client, 'TBL_TIPOS_CALCULO_CREDITO', 'id_tipo_calculo', 'des_tipo_calculo', 'PORCENTAJE');

    const documentos = [
      ['CONTRATO DE MUTUO CON DESCUENTO DIRECTO', 'CONTRATOS'],
      ['AUTORIZACION DE DESCUENTO POR NOMINA', 'CONTRATOS'],
      ['PAGARE', 'PAGARE'],
      ['SEGURO DE VIDA DEUDORES', 'SEGUROS']
    ];
    const documentoIds = [];
    for (const [nombre, grupo] of documentos) {
      const found = await client.query(`select id_documento_credito as id from ${schema}."TBL_DOCUMENTOS_CREDITO" where upper(des_documento) = upper($1) limit 1`, [nombre]);
      if (found.rows[0]?.id) {
        documentoIds.push(found.rows[0].id);
      } else {
        const created = await client.query(`insert into ${schema}."TBL_DOCUMENTOS_CREDITO" (des_documento, grupo) values ($1, $2) returning id_documento_credito as id`, [nombre, grupo]);
        documentoIds.push(created.rows[0].id);
      }
    }

    const etapas = ['RADICACION', 'VALIDACION DOCUMENTAL', 'ESTUDIO DE CREDITO', 'APROBACION', 'DESEMBOLSO'];
    const etapaIds = [];
    for (const nombre of etapas) {
      etapaIds.push(await ensureByName(client, 'TBL_ETAPAS_CREDITO', 'id_etapa_credito', 'des_etapa', nombre));
    }

    const libranzera = await client.query(`select id_libranzera from ${schema}."TBL_LIBRANZERAS" where v_nit = $1 limit 1`, ['901888001']);
    const libranzeraId = libranzera.rows[0]?.id_libranzera ?? (await client.query(
      `insert into ${schema}."TBL_LIBRANZERAS" (
        v_nit, v_razon_social, v_domicilio, v_sitio_web, v_correo, v_telefono,
        camara_numero, camara_libro, camara_id_ciudad, fec_constitucion, v_ciiu, v_runeol,
        rl_id_tip_identificacion, rl_identificacion, rl_nombre, rl_genero, rl_id_ciudad,
        rc_id_tip_identificacion, rc_identificacion, rc_nombre, rc_genero, rc_id_ciudad, rc_telefono, rc_correo,
        id_estado
      ) values (
        '901888001', 'P&S SOLUCIONES FINANCIERAS SAS', 'CALLE 77B # 57-103', 'https://pyssoluciones.com/',
        'gerenciaderiesgos@pyssoluciones.com', '3235894532',
        '488222', 'IX', $1, '2024-11-21', '6494', '000000000000000',
        $2, '1140888320', 'MARCOS TORRES', 'MASCULINO', $1,
        $2, '1048327695', 'LORAINE SAMPER', 'FEMENINO', $1, '3046032635', 'loraineanaltysamper@gmail.com',
        $3
      ) returning id_libranzera`,
      [ciudadId, tipoIdentificacionId, activeStateId]
    )).rows[0].id_libranzera;

    await client.query(
      `insert into ${schema}."TBL_LIBRANZERA_CUENTAS" (id_libranzera, id_banco, id_tipo_cuenta, v_num_cuenta, es_principal)
       select $1, $2, $3, '44213979164', true
       where not exists (select 1 from ${schema}."TBL_LIBRANZERA_CUENTAS" where id_libranzera = $1 and v_num_cuenta = '44213979164')`,
      [libranzeraId, bancoId, tipoCuentaId]
    );

    const empresa = await client.query(`select id_empresa from ${schema}."TBL_EMPRESAS" where v_nit = $1 limit 1`, ['900036347-0']);
    const empresaId = empresa.rows[0]?.id_empresa ?? (await client.query(
      `insert into ${schema}."TBL_EMPRESAS" (
        v_nit, v_razon_social, v_vendedor, v_domicilio, v_correo, v_telefono,
        v_representante_legal, v_telefono_representante, v_tipo_identificacion_representante,
        v_identificacion_representante, v_correo_representante, v_codigo,
        v_contacto_cargo, v_contacto_nombre, v_contacto_correo, v_contacto_telefono,
        fec_constitucion, val_capital_sociedad, v_naturaleza, v_camara_numero, v_camara_libro, v_camara_ciudad, id_estado
      ) values (
        '900036347-0', 'KAL TIRE S.A. DE C.V. SUCURSAL COLOMBIA', 'SILVANA BARRIOS',
        'CALLE 10 # 59 - 120', 'CO_NOTIFISCALES@KALTIRE.COM', '3859765',
        'ARMANDO BELEÑO BOLAÑO', '(314) 597-7588', 'CEDULA DE CIUDADANIA',
        '72203630', 'ARMANDO_BELENO@KALTIRE.COM', 'EMP-KAL-001',
        'GERENTE RECURSOS HUMANOS', 'ARMANDO BELEÑO BOLAÑO', 'ARMANDO_BELENO@KALTIRE.COM', '(314) 597-7588',
        '2005-07-01', 509871000, 'PRIVADO', '37904', 'VI', 'BARRANQUILLA', $1
      ) returning id_empresa`,
      [activeStateId]
    )).rows[0].id_empresa;

    const empleado = await client.query(`select id_empleado_empresa from ${schema}."TBL_EMPLEADOS_EMPRESA" where v_identificacion = $1 limit 1`, ['72291914']);
    const empleadoId = empleado.rows[0]?.id_empleado_empresa ?? (await client.query(
      `insert into ${schema}."TBL_EMPLEADOS_EMPRESA" (
        id_empresa, id_tip_identificacion, v_identificacion, v_primer_nombre, v_segundo_nombre,
        v_primer_apellido, v_segundo_apellido, v_nombre_completo, v_correo, v_telefono,
        v_cargo, val_salario, fec_ingreso, id_estado, id_tipo_contrato, id_banco, id_tipo_cuenta,
        v_cuenta_nomina, ind_tiene_embargos, id_estado_civil, num_personas_cargo, id_tipo_vivienda
      ) values (
        $1, $2, '72291914', 'EDWIN', 'ENRIQUE', 'PEREZ', 'MARTINEZ',
        'EDWIN ENRIQUE PEREZ MARTINEZ', 'edwinecp@hotmail.com', '3001234567',
        'ANALISTA OPERATIVO', 3500000, '2022-02-01', $3, $4, $5, $6,
        '1234567890', false, $7, 1, $8
      ) returning id_empleado_empresa`,
      [empresaId, tipoIdentificacionId, activeStateId, tipoContratoId, bancoId, tipoCuentaId, estadoCivilId, tipoViviendaId]
    )).rows[0].id_empleado_empresa;

    const comercial = await client.query(`select id_comercial from ${schema}."TBL_COMERCIALES" where v_codigo_vendedor = $1 limit 1`, ['VEN-001']);
    const comercialId = comercial.rows[0]?.id_comercial ?? (await client.query(
      `insert into ${schema}."TBL_COMERCIALES" (
        id_libranzera, v_identificacion, v_primer_nombre, v_seg_nombre, v_primer_apell, v_seg_apell,
        v_nombre_completo, fec_nacimiento, v_telefono, v_correo, v_codigo_vendedor,
        id_tip_identificacion, id_rol_vendedor, id_formula_comercial, v_direccion, id_ciudad,
        id_banco, id_tipo_cuenta, v_num_cuenta, id_estado
      ) values (
        $1, '1045678901', 'CAMILA', null, 'ROJAS', 'GOMEZ',
        'CAMILA ROJAS GOMEZ', '1992-04-10', '3015557788', 'camila.rojas@demo.com', 'VEN-001',
        $2, $3, $4, 'CARRERA 51B # 80-20', $5,
        $6, $7, '9876543210', $8
      ) returning id_comercial`,
      [libranzeraId, tipoIdentificacionId, rolVendedorId, formulaComercialId, ciudadId, bancoId, tipoCuentaId, activeStateId]
    )).rows[0].id_comercial;

    const producto = await client.query(`select id_producto_credito from ${schema}."TBL_PRODUCTOS_CREDITO" where nombre = $1 limit 1`, ['LIBRANZA PLUS']);
    const productoId = producto.rows[0]?.id_producto_credito ?? (await client.query(
      `insert into ${schema}."TBL_PRODUCTOS_CREDITO" (
        consecutivo, nombre, descripcion, id_tipo_credito, tipo_tasa, id_libranzera,
        monto_minimo, monto_maximo, salario_minimo, salario_maximo, plazo_minimo, plazo_maximo,
        modelo_plazo, permite_credito_multiple, interes_ajustable, permite_refinanciacion,
        permite_retanqueo, requiere_codeudor, numero_codeudores, formato_credito,
        formato_requisitos, formato_codeudores, proveedor_firma, periodo_gracia, id_estado
      ) values (
        'PC-000001', 'LIBRANZA PLUS', 'Producto demo para creditos de libranza',
        $1, 'FIJA', $2, 1500000, 20000000, 1, 15, 1, 36,
        'MESES', true, false, false, false, false, 0, 'SI',
        'SI', 'NO', 'DEMO SIGN', 0, $3
      ) returning id_producto_credito`,
      [tipoCreditoId, libranzeraId, activeStateId]
    )).rows[0].id_producto_credito;

    const atributos = [
      [tipoAtributoCuotaId, tipoCalculoPorcentajeId, 'INTERES CORRIENTE', null, 2.13, null, null, false, true, null, 1],
      [tipoAtributoCreditoId, tipoCalculoPorcentajeId, 'FIANZA DE CREDITOS', null, 1.2, null, null, false, true, 'COOPHUMANA', 2],
      [tipoAtributoCreditoId, tipoCalculoPorcentajeId, 'SEGURO DE VIDA DEUDORES', null, 1.5, null, null, false, true, 'BMI', 3],
      [tipoAtributoCreditoId, tipoCalculoValorId, 'AFILIACION COOPHUMANA', 112054, null, null, null, false, false, 'COOPHUMANA', 4],
      [tipoAtributoCreditoId, tipoCalculoValorId, 'CORRETAJE', 1600000, null, null, null, false, false, null, 5]
    ];
    for (const item of atributos) {
      await client.query(
        `insert into ${schema}."TBL_PRODUCTO_CREDITO_ATRIBUTOS" (
          id_producto_credito, id_tipo_atributo, id_tipo_calculo, nombre, valor, porcentaje,
          minimo, maximo, aplica_iva, obligatorio, proveedor, prioridad
        )
        select $1::int,$2::int,$3::int,$4::varchar,$5::numeric,$6::numeric,$7::numeric,$8::numeric,$9::boolean,$10::boolean,$11::varchar,$12::int
        where not exists (
          select 1 from ${schema}."TBL_PRODUCTO_CREDITO_ATRIBUTOS"
          where id_producto_credito = $1::int and upper(nombre) = upper($4::varchar)
        )`,
        [productoId, ...item]
      );
    }

    for (let index = 0; index < documentoIds.length; index += 1) {
      await client.query(
        `insert into ${schema}."TBL_PRODUCTO_CREDITO_DOCUMENTOS" (
          id_producto_credito, id_documento_credito, obligatorio, grupo, prioridad, aplica_a, requiere_firma, requiere_validacion
        )
        select $1, $2, true, null, $3, 'CLIENTE', true, true
        where not exists (
          select 1 from ${schema}."TBL_PRODUCTO_CREDITO_DOCUMENTOS"
          where id_producto_credito = $1 and id_documento_credito = $2
        )`,
        [productoId, documentoIds[index], index + 1]
      );
    }

    for (let index = 0; index < etapaIds.length; index += 1) {
      await client.query(
        `insert into ${schema}."TBL_PRODUCTO_CREDITO_ETAPAS" (
          id_producto_credito, id_etapa_credito, orden, obligatoria, permite_devolucion, responsable, sla_horas
        )
        select $1, $2, $3, true, true, $4, $5
        where not exists (
          select 1 from ${schema}."TBL_PRODUCTO_CREDITO_ETAPAS"
          where id_producto_credito = $1 and id_etapa_credito = $2
        )`,
        [productoId, etapaIds[index], index + 1, index < 2 ? 'Operaciones' : 'Credito', index < 2 ? 8 : 24]
      );
    }

    await client.query('commit');

    console.log(JSON.stringify({
      libranzeraId,
      empresaId,
      empleadoId,
      comercialId,
      productoId,
      codigoEmpresa: 'EMP-KAL-001',
      codigoVendedor: 'VEN-001'
    }, null, 2));
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
