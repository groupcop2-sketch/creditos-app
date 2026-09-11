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

-- Registros semilla iniciales para tbl_atributos
INSERT INTO "Creditos"."tbl_atributos" 
(nombre, descripcion, aplica_a, tipo_formula, valor_default, porcentaje_default, minimo_default, maximo_default, proveedor_default, prioridad_default, aplica_iva_default, obligatorio_default)
VALUES 
('FIANZA CREDITO', 'Cobertura de fianza sobre el monto del crédito', 'CREDITO', 'Manual', 0, 0, 0, 0, 'Beneficiario', 1, false, true),
('AVAL CREDITO', 'Garantía de aval otorgado por fondo de garantías', 'CREDITO', 'Porcentaje', 0, 2.5000, 0, 0, 'Fianzacredito', 1, true, true),
('SEGURO DE VIDA DEUDORES', 'Póliza de seguro de vida para amparo de deudores', 'CUOTA', 'Valor fijo', 5000, 0, 0, 0, 'Aseguradora', 2, false, true),
('ESTUDIO DE CREDITO', 'Cargo único por análisis crediticio y verificación', 'CREDITO', 'Valor fijo', 25000, 0, 0, 0, 'P&S Soluciones', 3, true, false),
('PLATAFORMA Y TECNOLOGIA', 'Costo de uso de plataforma digital y procesamiento', 'CREDITO', 'Valor fijo', 15000, 0, 0, 0, 'Sistema', 4, true, false),
('COMISION POR MIPYME', 'Comisión mipyme aplicable según ley', 'CREDITO', 'Porcentaje', 0, 1.5000, 0, 0, 'Entidad', 5, true, false),
('GASTOS DE COBRANZA', 'Recargo administrativo por gestión de mora', 'CUOTA', 'Porcentaje', 0, 5.0000, 0, 0, 'Cartera', 6, true, false),
('IVA SOBRE CARGOS', 'Impuesto al valor agregado aplicable a comisiones', 'CREDITO', 'Porcentaje', 0, 19.0000, 0, 0, 'DIAN', 7, false, true),
('GMF / 4 X 1000', 'Gravamen a los movimientos financieros', 'CREDITO', 'Porcentaje', 0, 0.4000, 0, 0, 'Banco', 8, false, false)
ON CONFLICT (nombre) DO UPDATE SET
  aplica_a = EXCLUDED.aplica_a,
  tipo_formula = EXCLUDED.tipo_formula,
  valor_default = EXCLUDED.valor_default,
  porcentaje_default = EXCLUDED.porcentaje_default,
  aplica_iva_default = EXCLUDED.aplica_iva_default,
  obligatorio_default = EXCLUDED.obligatorio_default;
