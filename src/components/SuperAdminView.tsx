import React, { useEffect, useState } from 'react';
import { BadgeCheck, Building2, Globe, ImagePlus, KeyRound, Palette, Save, Trash2 } from 'lucide-react';
import { api, type ConfigPlataforma, type ConfigPlataformaInput } from '../api';
import { iniciales, logoSrc, refreshBranding, shade } from '../branding';

type Props = {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
};

const toInput = (c: ConfigPlataforma): ConfigPlataformaInput => ({
  nombreComercial: c.nombreComercial,
  razonSocial: c.razonSocial ?? '',
  nit: c.nit ?? '',
  correoSoporte: c.correoSoporte ?? '',
  telefono: c.telefono ?? '',
  colorPrimario: c.colorPrimario,
  colorAcento: c.colorAcento,
  urlAdmin: c.urlAdmin ?? '',
  urlPortal: c.urlPortal ?? '',
  licencia: { plan: c.licencia.plan ?? '', inicio: c.licencia.inicio ?? '', vencimiento: c.licencia.vencimiento ?? '', maxUsuarios: c.licencia.maxUsuarios, estado: c.licencia.estado }
});

const readDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
  reader.readAsDataURL(file);
});

/** Super Admin: brand, URLs and license of this installation. Only for the software vendor (superadmin:config). */
export const SuperAdminView: React.FC<Props> = ({ token, notify }) => {
  const [config, setConfig] = useState<ConfigPlataforma | null>(null);
  const [form, setForm] = useState<ConfigPlataformaInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPlataformaConfig(token)
      .then((c) => { setConfig(c); setForm(toInput(c)); })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la configuración'));
  }, [token]);

  if (error) return <p className="estudio-error" role="alert">{error}</p>;
  if (!config || !form) return <p className="muted-note">Cargando configuración de la plataforma…</p>;

  const set = (patch: Partial<ConfigPlataformaInput>) => setForm({ ...form, ...patch });
  const setLic = (patch: Partial<ConfigPlataformaInput['licencia']>) => setForm({ ...form, licencia: { ...form.licencia, ...patch } });
  const aplicar = async (c: ConfigPlataforma, texto: string) => {
    setConfig(c);
    setForm(toInput(c));
    await refreshBranding();
    notify(texto, 'success');
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await aplicar(await api.savePlataformaConfig(token, form), 'Configuración de la plataforma guardada');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const subirLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return notify('El logo debe ser PNG, JPG o WEBP', 'error');
    if (file.size > 1024 * 1024) return notify('El logo debe pesar menos de 1 MB', 'error');
    setSaving(true);
    try {
      await aplicar(await api.savePlataformaLogo(token, { mimeType: file.type, base64: await readDataUrl(file) }), 'Logo actualizado');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo subir el logo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const quitarLogo = async () => {
    setSaving(true);
    try { await aplicar(await api.savePlataformaLogo(token, null), 'Logo eliminado'); }
    catch (e) { notify(e instanceof Error ? e.message : 'No se pudo quitar el logo', 'error'); }
    finally { setSaving(false); }
  };

  const lic = config.licencia;
  const logo = logoSrc({ ...config, licenciaVigente: true });
  const licTone = !lic.vigente ? 'bad' : lic.diasRestantes !== null && lic.diasRestantes <= 30 ? 'warn' : 'ok';

  return (
    <form className="superadmin" onSubmit={guardar}>
      <header className="superadmin-header">
        <div>
          <span className="section-kicker">Super Admin</span>
          <h1>Plataforma</h1>
          <p>Marca, direcciones y licencia de esta instalación. Solo visible para el proveedor del software.</p>
        </div>
        <button type="submit" className="stage-btn-primary" disabled={saving}><Save size={15} aria-hidden="true" /> {saving ? 'Guardando…' : 'Guardar cambios'}</button>
      </header>

      <section className={`superadmin-licencia ${licTone}`} aria-label="Estado de la licencia">
        <BadgeCheck size={22} aria-hidden="true" />
        <div>
          <strong>{lic.vigente ? 'Licencia vigente' : lic.motivo}</strong>
          <span>
            {lic.vencimiento ? (lic.diasRestantes! >= 0 ? `Vence en ${lic.diasRestantes} días (${lic.vencimiento})` : `Venció el ${lic.vencimiento}`) : 'Sin fecha de vencimiento'}
            {' · '}
            {lic.usuariosActivos} usuarios activos{lic.maxUsuarios ? ` de ${lic.maxUsuarios}` : ' (sin límite)'}
          </span>
        </div>
      </section>

      <div className="superadmin-grid">
        <fieldset className="superadmin-card">
          <legend><Building2 size={16} aria-hidden="true" /> Empresa cliente</legend>
          <label><span>Nombre comercial *</span><input required minLength={2} maxLength={120} value={form.nombreComercial} onChange={(e) => set({ nombreComercial: e.target.value })} /></label>
          <label><span>Razón social</span><input maxLength={200} value={form.razonSocial ?? ''} onChange={(e) => set({ razonSocial: e.target.value })} /></label>
          <label><span>NIT</span><input maxLength={30} value={form.nit ?? ''} onChange={(e) => set({ nit: e.target.value })} /></label>
          <label><span>Correo de soporte</span><input type="email" maxLength={200} value={form.correoSoporte ?? ''} onChange={(e) => set({ correoSoporte: e.target.value })} /></label>
          <label><span>Teléfono</span><input maxLength={40} value={form.telefono ?? ''} onChange={(e) => set({ telefono: e.target.value })} /></label>
        </fieldset>

        <fieldset className="superadmin-card">
          <legend><Palette size={16} aria-hidden="true" /> Marca y tema</legend>
          <div className="superadmin-logo">
            {logo ? <img src={logo} alt={`Logo de ${config.nombreComercial}`} /> : <span className="brand-mark" aria-hidden="true">{iniciales(form.nombreComercial)}</span>}
            <div>
              <label className="doc-action-btn superadmin-file">
                <ImagePlus size={14} aria-hidden="true" /> {logo ? 'Cambiar logo' : 'Subir logo'}
                <input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={(e) => { subirLogo(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {logo && <button type="button" className="doc-action-btn" disabled={saving} onClick={quitarLogo}><Trash2 size={14} aria-hidden="true" /> Quitar</button>}
              <small>PNG, JPG o WEBP, máx. 1 MB. Se guarda al instante.</small>
            </div>
          </div>
          <div className="superadmin-colors">
            <label><span>Color principal</span><span className="superadmin-color"><input type="color" value={form.colorPrimario} onChange={(e) => set({ colorPrimario: e.target.value })} /><code>{form.colorPrimario}</code></span></label>
            <label><span>Color de acento</span><span className="superadmin-color"><input type="color" value={form.colorAcento} onChange={(e) => set({ colorAcento: e.target.value })} /><code>{form.colorAcento}</code></span></label>
          </div>
          <div className="superadmin-preview" aria-label="Vista previa del tema">
            <div style={{ background: `linear-gradient(135deg, ${shade(form.colorPrimario, -0.35)}, ${form.colorPrimario})` }}>
              <strong>{form.nombreComercial || 'Nombre'}</strong>
              <span style={{ color: form.colorAcento }}>Valor a desembolsar</span>
            </div>
            <button type="button" tabIndex={-1} style={{ background: form.colorPrimario }}>Acción principal</button>
          </div>
        </fieldset>

        <fieldset className="superadmin-card">
          <legend><Globe size={16} aria-hidden="true" /> Direcciones (URL)</legend>
          <label><span>Panel administrativo</span><input type="url" placeholder="https://admin.empresa.com" value={form.urlAdmin ?? ''} onChange={(e) => set({ urlAdmin: e.target.value })} /></label>
          <label><span>Portal de clientes</span><input type="url" placeholder="https://clientes.empresa.com" value={form.urlPortal ?? ''} onChange={(e) => set({ urlPortal: e.target.value })} /></label>
          <small className="muted-note">La URL del portal se usa en los correos que reciben los clientes.</small>
        </fieldset>

        <fieldset className="superadmin-card">
          <legend><KeyRound size={16} aria-hidden="true" /> Licencia</legend>
          <label><span>Plan</span><input maxLength={60} placeholder="Ej. Profesional" value={form.licencia.plan ?? ''} onChange={(e) => setLic({ plan: e.target.value })} /></label>
          <div className="superadmin-row">
            <label><span>Inicio</span><input type="date" value={form.licencia.inicio ?? ''} onChange={(e) => setLic({ inicio: e.target.value })} /></label>
            <label><span>Vencimiento</span><input type="date" min={form.licencia.inicio || undefined} value={form.licencia.vencimiento ?? ''} onChange={(e) => setLic({ vencimiento: e.target.value })} /></label>
          </div>
          <div className="superadmin-row">
            <label><span>Máximo de usuarios activos</span><input type="number" min={1} placeholder="Sin límite" value={form.licencia.maxUsuarios ?? ''} onChange={(e) => setLic({ maxUsuarios: e.target.value ? Number(e.target.value) : null })} /></label>
            <label>
              <span>Estado</span>
              <select value={form.licencia.estado} onChange={(e) => setLic({ estado: e.target.value as 'ACTIVA' | 'SUSPENDIDA' })}>
                <option value="ACTIVA">Activa</option>
                <option value="SUSPENDIDA">Suspendida</option>
              </select>
            </label>
          </div>
          <small className="muted-note">Con la licencia vencida o suspendida solo el Super Admin puede iniciar sesión. Sin vencimiento ni límite, el uso es ilimitado.</small>
        </fieldset>
      </div>
    </form>
  );
};
