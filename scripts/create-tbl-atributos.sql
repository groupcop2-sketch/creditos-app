-- ====================================================================
-- CREACIÓN DE TABLA DE CATÁLOGO DE ATRIBUTOS (tbl_atributos)
-- Proyecto: creditos-app
-- Esquema: "Creditos"
-- ====================================================================

CREATE TABLE IF NOT EXISTS "Creditos"."tbl_atributos" (
    id_atributo SERIAL PRIMARY KEY,
    nombre VARCHAR(180) NOT NULL UNIQUE,
    descripcion VARCHAR(250) NULL,
    aplica_a VARCHAR(50) DEFAULT 'CREDITO',
    tipo_formula VARCHAR(80) DEFAULT 'Manual',
    valor_default NUMERIC(18,2) DEFAULT 0,
    valor2_default NUMERIC(18,2) NULL,
    porcentaje_default NUMERIC(10,4) DEFAULT 0,
    minimo_default NUMERIC(18,2) DEFAULT 0,
    maximo_default NUMERIC(18,2) DEFAULT 0,
    proveedor_default VARCHAR(120) NULL,
    prioridad_default INTEGER DEFAULT 1,
    aplica_iva_default BOOLEAN DEFAULT FALSE,
    obligatorio_default BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fec_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Registros semilla actualizados para tbl_atributos según todas las imágenes del sistema
INSERT INTO "Creditos"."tbl_atributos" 
(nombre, descripcion, aplica_a, tipo_formula, valor_default, porcentaje_default, minimo_default, maximo_default, proveedor_default, prioridad_default, aplica_iva_default, obligatorio_default)
VALUES 
('FIANZA DE CREDITOS COOPHUMANA', 'Fianza de créditos Coophumana - Beneficiario 900528910 COOPHUMANA', 'CREDITO', 'FIANZA', 0, 100.0000, 0, 0, '900528910 COOPHUMANA', 1, true, true),
('SEGURO DE VIDA DEUDORES', 'Póliza seguro de vida deudores - Beneficiario 901342794 WOW DESARROLLOS', 'CREDITO', 'SEGURO DE VIDA', 0, 100.0000, 0, 0, '901342794 WOW DESARROLLOS', 2, false, true),
('CORRETAJE', 'Comisión de corretaje sobre valor desembolso 8% - Beneficiario 901898386 P&S SOLUCIONES', 'CREDITO', 'VALOR DESEMBOLSO * %', 0, 8.0000, 0, 0, '901898386 P&S SOLUCIONES', 3, false, false),
('INTERESES ANTICIPADOS', 'Intereses anticipados sobre valor crédito 5% - Beneficiario 901898386 P&S SOLUCIONES', 'CREDITO', 'VALOR CRÉDITO * % * DIAS', 0, 5.0000, 0, 0, '901898386 P&S SOLUCIONES', 4, false, false),
('AFILIACION COOPHUMANA', 'Cuota afiliación Coophumana (SMMLV * 0.2%) * Plazo + $7,000 - Beneficiario 900528910 COOPHUMANA', 'CREDITO', '(SMMLV * % ) * PLAZO + VALOR', 7000, 0.2000, 0, 0, '900528910 COOPHUMANA', 4, false, false),
('CORRETAJE GARANTIA REAL', 'Corretaje garantía real 14% valor crédito - Beneficiario 901898386 P&S SOLUCIONES', 'CREDITO', 'VALOR CRÉDITO * %', 0, 14.0000, 0, 0, '901898386 P&S SOLUCIONES', 4, false, false),
('INTERES PRIMAS', 'Interés primas 2% valor crédito - Beneficiario 901898386 P&S SOLUCIONES', 'CREDITO', 'VALOR CRÉDITO * %', 0, 2.0000, 0, 0, '901898386 P&S SOLUCIONES', 5, false, false),
('INTERES GARANTIA REAL', 'Interés garantía real 10% valor desembolso - Beneficiario 901898386 P&S SOLUCIONES', 'CREDITO', 'VALOR DESEMBOLSO * %', 0, 10.0000, 0, 0, '901898386 P&S SOLUCIONES', 5, false, false),
('CORRETAJE PRIMAS', 'Corretaje primas 8% valor crédito - Beneficiario 901898386 P&S SOLUCIONES', 'CREDITO', 'VALOR CRÉDITO * %', 0, 8.0000, 0, 0, '901898386 P&S SOLUCIONES', 6, false, false),
('FIANZA TRES', 'Fianza Tres FIANZA LI3M - Beneficiario 900528910 COOPHUMANA', 'CREDITO', 'FIANZA', 0, 100.0000, 0, 0, '900528910 COOPHUMANA', 10, true, true),
('ESTUDIO DE CREDITO', 'Cargo único por análisis crediticio y verificación', 'CREDITO', 'Valor fijo', 25000, 0, 0, 0, 'P&S SOLUCIONES', 11, true, false),
('PLATAFORMA Y TECNOLOGIA', 'Costo de uso de plataforma digital y procesamiento', 'CREDITO', 'Valor fijo', 15000, 0, 0, 0, 'Sistema', 12, true, false),
('COMISION POR MIPYME', 'Comisión mipyme aplicable según ley', 'CREDITO', 'Porcentaje', 0, 1.5000, 0, 0, 'Entidad', 13, true, false),
('GASTOS DE COBRANZA', 'Recargo administrativo por gestión de mora', 'CUOTA', 'Porcentaje', 0, 5.0000, 0, 0, 'Cartera', 14, true, false),
('IVA SOBRE CARGOS', 'Impuesto al valor agregado aplicable a comisiones', 'CREDITO', 'Porcentaje', 0, 19.0000, 0, 0, 'DIAN', 15, false, true),
('GMF / 4 X 1000', 'Gravamen a los movimientos financieros', 'CREDITO', 'Porcentaje', 0, 0.4000, 0, 0, 'Banco', 16, false, false)
ON CONFLICT (nombre) DO UPDATE SET
  aplica_a = EXCLUDED.aplica_a,
  tipo_formula = EXCLUDED.tipo_formula,
  valor_default = EXCLUDED.valor_default,
  porcentaje_default = EXCLUDED.porcentaje_default,
  proveedor_default = EXCLUDED.proveedor_default,
  prioridad_default = EXCLUDED.prioridad_default,
  aplica_iva_default = EXCLUDED.aplica_iva_default,
  obligatorio_default = EXCLUDED.obligatorio_default;
