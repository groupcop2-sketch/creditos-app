import React, { useEffect, useMemo, useState } from 'react';
import { FileUp, Plus, Upload } from 'lucide-react';
import { api } from '../../api';
import { ESTADO, fecha, leerArchivo, money, parseMoney, recaudoApi, RESULTADO, type Campo, type Conciliacion, type Lote, type Plantilla } from './recaudo.api';
import { EmpresaSelect, errorMsg, MotivoBox, Pill, type Ctx } from './recaudo.shared';

const hoy = () => new Date().toISOString().slice(0, 10);

/* ---------- Cargar pagos ---------- */
export const CargaTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const empresas = ctx.resumen?.empresas ?? [];
  const sel = empresas.find((e) => e.id === ctx.empresaId) ?? empresas[0] ?? null;
  const [texto, setTexto] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [fechaGiro, setFechaGiro] = useState(hoy());
  const [valorGirado, setValorGirado] = useState('');
  const [conc, setConc] = useState<Conciliacion | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [busy, setBusy] = useState(false);
  const [revirtiendo, setRevirtiendo] = useState<number | null>(null);

  const cargarLotes = () => recaudoApi.lotes(ctx.token, ctx.periodo).then(setLotes).catch(() => setLotes([]));
  useEffect(() => { void cargarLotes(); }, [ctx.token, ctx.periodo]);
  useEffect(() => { setConc(null); setTexto(''); setNombreArchivo(''); setValorGirado(''); }, [sel?.id, ctx.periodo]);

  const giro = parseMoney(valorGirado);
  const cuadra = conc != null && Number.isFinite(giro) && Math.round(giro * 100) === Math.round(conc.totales.totalArchivo * 100);
  const cuentaAbierta = conc ? ['GENERADA', 'ENVIADA'].includes(conc.cuenta.estado) : false;
  const puedeAplicar = conc && cuadra && cuentaAbierta && !conc.loteExistente && !conc.errores.length && conc.totales.pagos > 0 && !ctx.cerrado && !busy;

  const elegirArchivo = async (file: File | undefined) => {
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name)) { ctx.notify('Guarda el Excel como CSV (Archivo → Guardar como → CSV) y súbelo de nuevo.', 'warning'); return; }
    setTexto(await leerArchivo(file));
    setNombreArchivo(file.name);
    setConc(null);
  };
  const conciliar = async () => {
    if (!sel) return;
    setBusy(true);
    try {
      const c = await recaudoApi.conciliar(ctx.token, { empresaId: sel.id, periodo: ctx.periodo, texto });
      setConc(c);
      if (!valorGirado) setValorGirado(String(c.totales.totalArchivo));
    } catch (e) { ctx.notify(errorMsg(e, 'No se pudo leer el archivo'), 'error'); }
    finally { setBusy(false); }
  };
  const aplicar = async () => {
    if (!sel || !conc) return;
    setBusy(true);
    try {
      const lote = await recaudoApi.aplicar(ctx.token, { empresaId: sel.id, periodo: ctx.periodo, texto, nombreArchivo, fechaGiro, valorGirado: giro });
      ctx.notify(`${lote.codigo}: ${lote.pagos} pagos aplicados por ${money(lote.totalAplicado)}`, 'success');
      setConc(null); setTexto(''); setNombreArchivo(''); setValorGirado('');
      await Promise.all([ctx.recargar(), cargarLotes()]);
    } catch (e) { ctx.notify(errorMsg(e, 'No se pudo aplicar el lote'), 'error'); }
    finally { setBusy(false); }
  };
  const reversar = async (id: number, motivo: string) => {
    try {
      const l = await recaudoApi.reversar(ctx.token, id, motivo);
      ctx.notify(`${l.codigo} reversado: ${l.pagos} pagos anulados`, 'success');
      setRevirtiendo(null);
      await Promise.all([ctx.recargar(), cargarLotes()]);
    } catch (e) { ctx.notify(errorMsg(e, 'No se pudo reversar el lote'), 'error'); }
  };

  if (!empresas.length) return <div className="rec-panel"><p className="muted-note">No hay empresas con cobro en este periodo.</p></div>;
  const lineas = texto ? texto.split(/\r?\n/).filter((l) => l.trim()).length : 0;

  return (
    <>
      <section className="rec-panel">
        <div className="rec-form-grid">
          <EmpresaSelect id="carga-empresa" value={sel?.id ?? null} onChange={(id) => ctx.setEmpresaId(id)} empresas={empresas.map((e) => ({ id: e.id, nombre: e.nombre, extra: e.tienePlantilla ? undefined : 'sin formato' }))} />
          <div className="rec-field"><span>Cuenta de cobro</span><strong className="rec-static">{sel?.cuenta ? `${sel.cuenta.consecutivo} · ${money(sel.cuenta.total)}` : 'Sin generar'}</strong></div>
          {sel?.cuenta && <div className="rec-field"><span>Estado</span><span className="rec-static"><Pill tone={ESTADO[sel.cuenta.estado][1]}>{ESTADO[sel.cuenta.estado][0]}</Pill></span></div>}
        </div>
        {!sel?.cuenta ? (
          <div className="rec-callout warn">Primero genera la cuenta de cobro de esta empresa: el archivo se concilia contra ella.
            <div><button type="button" className="rec-btn" onClick={() => ctx.ir('cobro', sel?.id)}>Ir a la cuenta de cobro</button></div></div>
        ) : !sel.tienePlantilla ? (
          <div className="rec-callout warn">{sel.nombre} todavía no tiene formato de archivo. Se configura una sola vez con un archivo de ejemplo.
            {ctx.puede('recaudo:config') && <div><button type="button" className="rec-btn" onClick={() => ctx.ir('formatos', sel.id)}>Configurar formato</button></div>}</div>
        ) : (
          <>
            <div className="rec-form-grid">
              <label className="rec-field rec-file" htmlFor="carga-archivo">
                <span>Archivo de la empresa (CSV o TXT)</span>
                <span className="rec-btn"><FileUp size={15} aria-hidden="true" /> {nombreArchivo || 'Elegir archivo'}</span>
                <input id="carga-archivo" type="file" accept=".csv,.txt,text/csv,text/plain,.xls,.xlsx" onChange={(e) => { void elegirArchivo(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <label className="rec-field" htmlFor="carga-fecha"><span>Fecha del giro</span><input id="carga-fecha" type="date" max={hoy()} value={fechaGiro} onChange={(e) => setFechaGiro(e.target.value)} /></label>
              <label className="rec-field" htmlFor="carga-giro"><span>Valor girado (según extracto)</span><input id="carga-giro" inputMode="decimal" placeholder="Ej. 1.776.500" value={valorGirado} onChange={(e) => setValorGirado(e.target.value)} /></label>
            </div>
            {texto && <details className="rec-details"><summary>{nombreArchivo} · {lineas} líneas</summary><pre>{texto.slice(0, 4000)}{texto.length > 4000 ? '\n…' : ''}</pre></details>}
            <div className="rec-actions"><span className="rec-spacer rec-hint">Nada se aplica hasta que revises la conciliación y la confirmes.</span>
              <button type="button" className="rec-btn primary" disabled={!texto || busy} onClick={conciliar}><Upload size={15} aria-hidden="true" /> Leer y conciliar</button></div>
          </>
        )}
      </section>

      {conc && (
        <section className="rec-panel">
          <div className="rec-actions">
            <h2 className="rec-spacer">Conciliación · {conc.cuenta.consecutivo}</h2>
            <div className="rec-chips">
              {Object.entries(conc.items.reduce<Record<string, number>>((m, i) => ((m[i.resultado] = (m[i.resultado] || 0) + 1), m), {}))
                .map(([k, n]) => <Pill key={k} tone={RESULTADO[k as keyof typeof RESULTADO][1]}>{RESULTADO[k as keyof typeof RESULTADO][0]}: {n}</Pill>)}
            </div>
          </div>
          <div className="rec-tiles">
            <div><span>Total del archivo</span><strong>{money(conc.totales.totalArchivo)}</strong></div>
            <div><span>Valor girado</span><strong>{Number.isFinite(giro) ? money(giro) : '—'}</strong></div>
            <div><span>Se aplica a {conc.totales.pagos} créditos</span><strong>{money(conc.totales.aplicar)}</strong></div>
            <div><span>Queda en revisión</span><strong>{money(conc.totales.revision)}</strong></div>
          </div>
          {conc.loteExistente ? <p className="rec-callout bad">Este archivo ya se aplicó (lote L-{String(conc.loteExistente).padStart(4, '0')}). Un archivo no se puede aplicar dos veces.</p>
            : !cuentaAbierta ? <p className="rec-callout bad">La cuenta de cobro está {ESTADO[conc.cuenta.estado][0].toLowerCase()}. Para cargar otro archivo, reversa primero el lote aplicado.</p>
              : !cuadra ? <p className="rec-callout bad">El archivo suma {money(conc.totales.totalArchivo)} y el giro registrado es {Number.isFinite(giro) ? money(giro) : 'inválido'}. Deben coincidir para aplicar.</p>
                : <p className="rec-callout good">El archivo cuadra con el giro. Revisa las diferencias y confirma; las filas en revisión no se aplican.</p>}
          {conc.errores.length > 0 && <p className="rec-callout warn">{conc.errores.length} filas no se pudieron leer: {conc.errores.slice(0, 8).map((e) => `fila ${e.fila} (${e.motivo})`).join(', ')}{conc.errores.length > 8 ? '…' : ''}. Corrige el archivo.</p>}
          <div className="rec-tscroll">
            <table className="rec-table">
              <thead><tr><th className="num">Fila</th><th className="num">Identificación</th><th>Empleado</th><th>Crédito</th><th className="num">Cobrado</th><th className="num">Descontado</th><th>Resultado</th></tr></thead>
              <tbody>
                {conc.items.map((i, k) => (
                  <tr key={k}>
                    <td className="num">{i.fila ?? '—'}</td>
                    <td className="num">{i.identificacion}</td>
                    <td>{i.nombre ?? i.nombreArchivo ?? '—'}{i.nombre && i.nombreArchivo && <small>En el archivo: {i.nombreArchivo}</small>}</td>
                    <td>{i.consecutivo ?? '—'}</td>
                    <td className="num">{i.cobrado == null ? '—' : money(i.cobrado)}</td>
                    <td className="num">{i.fila == null ? '—' : money(i.valor)}</td>
                    <td><Pill tone={RESULTADO[i.resultado][1]}>{RESULTADO[i.resultado][0]}</Pill>{i.detalle && <small>{i.detalle}</small>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rec-actions">
            <span className="rec-spacer rec-hint">Cada pago se aplica con la regla de cartera: cuotas más antiguas primero; mora, cargos, interés y capital.</span>
            <button type="button" className="rec-btn" onClick={() => setConc(null)}>Descartar</button>
            <button type="button" className="rec-btn primary" disabled={!puedeAplicar} onClick={aplicar}>{busy ? 'Aplicando…' : `Aplicar ${conc.totales.pagos} pagos por ${money(conc.totales.aplicar)}`}</button>
          </div>
        </section>
      )}

      <section className="rec-panel flush">
        <div className="rec-panel-head"><h2>Lotes cargados</h2><span className="rec-hint">Reversar un lote anula todos sus pagos y devuelve cada cuota a su saldo anterior.</span></div>
        <div className="rec-tscroll">
          <table className="rec-table">
            <thead><tr><th>Lote</th><th>Empresa</th><th>Giro</th><th className="num">Filas</th><th className="num">Pagos</th><th className="num">Aplicado</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {!lotes.length && <tr><td colSpan={8} className="muted-note">Todavía no hay lotes en este periodo.</td></tr>}
              {lotes.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.codigo}</strong><small>{l.nombreArchivo ?? ''}{l.usuario ? ` · ${l.usuario}` : ''}</small></td>
                  <td>{l.empresa}<small>{l.consecutivo}</small></td>
                  <td>{fecha(l.fechaGiro)}<small>{money(l.valorGirado)}</small></td>
                  <td className="num">{l.filas}</td>
                  <td className="num">{l.pagos}</td>
                  <td className="num">{money(l.totalAplicado)}</td>
                  <td><Pill tone={l.estado === 'APLICADO' ? 'good' : 'neutral'}>{l.estado === 'APLICADO' ? 'Aplicado' : 'Reversado'}</Pill>{l.motivoReverso && <small>{l.motivoReverso}</small>}</td>
                  <td>
                    {l.estado === 'APLICADO' && ctx.puede('recaudo:aplicar') && (ctx.cerrado ? <small>Periodo cerrado</small>
                      : revirtiendo === l.id
                        ? <MotivoBox id={`rev-${l.id}`} label="Motivo de la reversión" boton={`Reversar ${l.pagos} pagos`} placeholder="Ej. la empresa envió un archivo corregido" onCancel={() => setRevirtiendo(null)} onConfirm={(m) => reversar(l.id, m)} />
                        : <button type="button" className="rec-btn link danger" onClick={() => setRevirtiendo(l.id)}>Reversar</button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

/* ---------- Formatos por empresa ---------- */
const CAMPOS: Array<[Campo, string]> = [['', 'Ignorar'], ['identificacion', 'Identificación *'], ['valor', 'Valor descontado *'], ['credito', 'Número de crédito'], ['nombre', 'Nombre del empleado'], ['novedad', 'Código de novedad'], ['periodo', 'Periodo'], ['fecha', 'Fecha de pago']];
const NOVEDADES_BASE: Array<[string, string]> = [['RT', 'Retiro'], ['IN', 'Incapacidad'], ['LM', 'Licencia'], ['VA', 'Vacaciones']];

function sugerir(h: string): Campo {
  if (/c[eé]dula|documento|identif|^cc$|^nit$/i.test(h)) return 'identificacion';
  if (/valor|monto|deduc|descont/i.test(h)) return 'valor';
  if (/libranza|cr[eé]dito|pagar[eé]|obligaci/i.test(h)) return 'credito';
  if (/nombre|empleado/i.test(h)) return 'nombre';
  if (/nov|observ|motivo/i.test(h)) return 'novedad';
  if (/periodo|^mes$/i.test(h)) return 'periodo';
  if (/fecha/i.test(h)) return 'fecha';
  return '';
}
function celdas(line: string, sep: string) {
  const out: string[] = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === sep && !q) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export const FormatosTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const [empresas, setEmpresas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [separador, setSeparador] = useState(';');
  const [fila, setFila] = useState(1);
  const [mapeo, setMapeo] = useState<Record<string, Campo>>({});
  const [novedades, setNovedades] = useState<Array<[string, string]>>(NOVEDADES_BASE);
  const [texto, setTexto] = useState('');
  const [guardada, setGuardada] = useState(false);
  const [prueba, setPrueba] = useState<{ ok: boolean; texto: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listEmpresas(ctx.token)
      .then((rows) => setEmpresas(rows.map((e) => ({ id: e.id, nombre: e.razonSocial }))))
      .catch(() => setEmpresas((ctx.resumen?.empresas ?? []).map((e) => ({ id: e.id, nombre: e.nombre }))));
  }, [ctx.token]);
  const empresaId = ctx.empresaId ?? empresas[0]?.id ?? null;

  useEffect(() => {
    if (!empresaId) return;
    setPrueba(null);
    recaudoApi.plantilla(ctx.token, empresaId).then((p) => {
      setGuardada(Boolean(p));
      setSeparador(p?.separador ?? ';');
      setFila(p?.filaEncabezado ?? 1);
      setMapeo(p?.mapeo ?? {});
      setNovedades(p ? Object.entries(p.novedades) : NOVEDADES_BASE);
      setTexto(p?.archivoEjemplo ?? '');
    }).catch((e) => ctx.notify(errorMsg(e, 'No se pudo cargar el formato'), 'error'));
  }, [empresaId, ctx.token]);

  const sepChar = separador === 'tab' ? '\t' : separador;
  const lines = useMemo(() => texto.replace(/^﻿/, '').split(/\r?\n/), [texto]);
  const headers = useMemo(() => celdas(lines[fila - 1] ?? '', sepChar).filter(Boolean), [lines, fila, sepChar]);
  const muestra = useMemo(() => celdas(lines[fila] ?? '', sepChar), [lines, fila, sepChar]);
  // Suggest a field for headers seen for the first time.
  useEffect(() => {
    setMapeo((m) => {
      const next = { ...m };
      let changed = false;
      for (const h of headers) if (!(h in next)) { next[h] = sugerir(h); changed = true; }
      return changed ? next : m;
    });
  }, [headers]);

  const plantilla = (): Plantilla => ({
    separador, filaEncabezado: fila,
    mapeo: Object.fromEntries(headers.map((h) => [h, mapeo[h] ?? ''])),
    novedades: Object.fromEntries(novedades.filter(([k, v]) => k.trim() && v.trim())),
    archivoEjemplo: texto.slice(0, 200_000)
  });
  const elegirArchivo = async (file: File | undefined) => {
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name)) { ctx.notify('Guarda el Excel como CSV y súbelo de nuevo.', 'warning'); return; }
    const t = await leerArchivo(file);
    setTexto(t);
    const first = t.split(/\r?\n/)[0] ?? '';
    setSeparador(first.includes(';') ? ';' : first.includes('\t') ? 'tab' : first.includes('|') ? '|' : ',');
    setPrueba(null);
  };
  const probar = async () => {
    setBusy(true);
    try {
      const r = await recaudoApi.probarPlantilla(ctx.token, plantilla(), texto);
      setPrueba(r.error ? { ok: false, texto: r.error } : { ok: true, texto: `${r.filas} filas leídas, ${r.totalErrores} rechazadas.${r.errores.length ? ' ' + r.errores.slice(0, 5).map((e) => `Fila ${e.fila}: ${e.motivo}`).join(' · ') : ''}` });
    } catch (e) { setPrueba({ ok: false, texto: errorMsg(e, 'No se pudo probar el formato') }); }
    finally { setBusy(false); }
  };
  const guardar = async () => {
    if (!empresaId) return;
    setBusy(true);
    try {
      await recaudoApi.guardarPlantilla(ctx.token, empresaId, plantilla());
      setGuardada(true);
      ctx.notify('Formato guardado. Ya puedes cargar el archivo de esta empresa.', 'success');
      await ctx.recargar();
    } catch (e) { ctx.notify(errorMsg(e, 'No se pudo guardar el formato'), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rec-two">
      <section className="rec-panel">
        <div className="rec-actions"><h2 className="rec-spacer">1. Archivo de ejemplo</h2><Pill tone={guardada ? 'good' : 'warn'}>{guardada ? 'Formato guardado' : 'Sin formato'}</Pill></div>
        <EmpresaSelect id="fmt-empresa" value={empresaId} onChange={(id) => ctx.setEmpresaId(id)} empresas={empresas} />
        <div className="rec-form-grid">
          <label className="rec-field" htmlFor="fmt-sep"><span>Separador</span>
            <select id="fmt-sep" value={separador} onChange={(e) => { setSeparador(e.target.value); setPrueba(null); }}>
              <option value=";">Punto y coma ;</option><option value=",">Coma ,</option><option value="tab">Tabulador</option><option value="|">Barra |</option>
            </select>
          </label>
          <label className="rec-field" htmlFor="fmt-fila"><span>Fila de encabezados</span><input id="fmt-fila" type="number" min={1} max={50} value={fila} onChange={(e) => { setFila(Math.max(1, Number(e.target.value) || 1)); setPrueba(null); }} /></label>
          <label className="rec-field rec-file" htmlFor="fmt-archivo"><span>Archivo real de la empresa</span>
            <span className="rec-btn"><FileUp size={15} aria-hidden="true" /> Subir ejemplo</span>
            <input id="fmt-archivo" type="file" accept=".csv,.txt,text/csv,text/plain,.xls,.xlsx" onChange={(e) => { void elegirArchivo(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        <label className="rec-field" htmlFor="fmt-texto"><span>Contenido (puedes pegarlo aquí)</span>
          <textarea id="fmt-texto" spellCheck={false} value={texto} onChange={(e) => { setTexto(e.target.value); setPrueba(null); }} placeholder="CEDULA;NOMBRE;VALOR DESCONTADO;NOVEDAD" />
        </label>
        <p className="rec-hint">Excel (.xlsx): guárdalo como CSV antes de subirlo.</p>
      </section>

      <div className="rec-stack">
        <section className="rec-panel flush">
          <div className="rec-panel-head"><h2>2. ¿Qué es cada columna?</h2><span className="rec-hint">Sugerido por el nombre del encabezado</span></div>
          <div className="rec-tscroll">
            <table className="rec-table">
              <thead><tr><th>Columna</th><th>Ejemplo</th><th>Campo del sistema</th></tr></thead>
              <tbody>
                {!headers.length && <tr><td colSpan={3} className="muted-note">Sube o pega un archivo de ejemplo para ver sus columnas.</td></tr>}
                {headers.map((h, i) => (
                  <tr key={h}>
                    <td className="rec-mono">{h}</td>
                    <td className="rec-mono rec-muted">{muestra[i] ?? ''}</td>
                    <td><select aria-label={`Campo para la columna ${h}`} value={mapeo[h] ?? ''} onChange={(e) => { setMapeo({ ...mapeo, [h]: e.target.value as Campo }); setPrueba(null); }}>
                      {CAMPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rec-panel flush">
          <div className="rec-panel-head"><h2>3. Códigos de novedad</h2><button type="button" className="rec-btn link" onClick={() => setNovedades([...novedades, ['', '']])}><Plus size={14} aria-hidden="true" /> Agregar código</button></div>
          <div className="rec-tscroll">
            <table className="rec-table">
              <thead><tr><th>Código en el archivo</th><th>Significa</th><th /></tr></thead>
              <tbody>
                {novedades.map(([k, v], i) => (
                  <tr key={i}>
                    <td><input aria-label="Código" className="rec-mono" style={{ width: 100 }} value={k} onChange={(e) => setNovedades(novedades.map((n, j) => (j === i ? [e.target.value.toUpperCase(), n[1]] : n)))} /></td>
                    <td><input aria-label="Significado" style={{ width: '100%' }} value={v} onChange={(e) => setNovedades(novedades.map((n, j) => (j === i ? [n[0], e.target.value] : n)))} /></td>
                    <td><button type="button" className="rec-btn link" aria-label={`Quitar código ${k}`} onClick={() => setNovedades(novedades.filter((_, j) => j !== i))}>Quitar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rec-panel">
          {prueba ? <p className={`rec-callout ${prueba.ok ? 'good' : 'bad'}`}>{prueba.texto}</p> : <p className="rec-hint">Prueba el formato con el ejemplo antes de guardarlo.</p>}
          <div className="rec-actions"><span className="rec-spacer" />
            <button type="button" className="rec-btn" disabled={!texto || busy} onClick={probar}>Probar con el ejemplo</button>
            <button type="button" className="rec-btn primary" disabled={!headers.length || busy || !ctx.puede('recaudo:config')} onClick={guardar}>Guardar formato</button>
          </div>
        </section>
      </div>
    </div>
  );
};
