import React, { useState } from 'react';
import type { CatalogModule, SecurityUser } from '../../api';

export type ViewKey =
  | 'dashboard'
  | 'usuarios'
  | 'configuracion'
  | 'salarios'
  | 'fianzas'
  | 'bancos'
  | 'tasas'
  | 'plazos'
  | 'formatos'
  | 'financieras'
  | 'docusign'
  | `modulo:${number}`;

export type ConfigTab = 'roles' | 'permisos' | 'modulos' | 'salarios' | 'fianzas' | 'apariencia';

interface AppSidebarProps {
  view: ViewKey;
  onNavigateView: (view: ViewKey) => void;
  onNavigateModule: (
    moduleType: 'dashboard' | 'aliado' | 'comercial' | 'credito' | 'empresa' | 'seguridad' | 'socio'
  ) => void;
  visibleUserModules: CatalogModule[];
  activeUser: SecurityUser | null;
  onLogout: () => void;
  configTab: ConfigTab;
  isAliadosActive: boolean;
  isComercialesActive: boolean;
  isCreditosActive: boolean;
  isEmpresasActive: boolean;
  isSociosActive: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  view,
  onNavigateView,
  onNavigateModule,
  visibleUserModules,
  activeUser,
  onLogout,
  configTab,
  isAliadosActive,
  isComercialesActive,
  isCreditosActive,
  isEmpresasActive,
  isSociosActive
}) => {
  const isSecondaryFinancialActive = ['plazos', 'bancos', 'docusign'].includes(view);
  const [showMoreFinancial, setShowMoreFinancial] = useState(isSecondaryFinancialActive);

  const getInitials = (name?: string | null) => {
    if (!name) return 'EE';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const isSeguridadActive =
    visibleUserModules.some((m) => m.nombre.toLowerCase().includes('seguridad') && view === `modulo:${m.id}`) ||
    (view === 'configuracion' && configTab === 'roles');

  const fullName = activeUser?.fullName || 'EDWIN ENRIQUE CAPDEVILLA PACHECO';
  const roleDisplay = activeUser?.roles?.length
    ? activeUser.roles.join(' / ').toUpperCase()
    : 'ADMINISTRADOR / ANALISTA DE CRÉDITO / CONSULTOR';

  return (
    <aside className="side-nav">
      {/* 1. Brand Block - Aligned with the left grid */}
      <div className="brand-block">
        <span className="brand-mark">CA</span>
        <div className="brand-text">
          <strong>Creditos App</strong>
          <small>Panel administrativo</small>
        </div>
      </div>

      {/* 2. Navigation List */}
      <nav className="module-nav">
        {/* Dashboard */}
        <button
          type="button"
          className={`module-link ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigateModule('dashboard')}
          id="nav-dashboard"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
            </svg>
          </span>
          <span className="menu-text">Dashboard</span>
        </button>

        {/* Aliados */}
        <button
          type="button"
          className={`module-link ${isAliadosActive ? 'active' : ''}`}
          onClick={() => onNavigateModule('aliado')}
          id="nav-aliados"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="menu-text">Aliados</span>
        </button>

        {/* Comerciales */}
        <button
          type="button"
          className={`module-link ${isComercialesActive ? 'active' : ''}`}
          onClick={() => onNavigateModule('comercial')}
          id="nav-comerciales"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="menu-text">Comerciales</span>
        </button>

        {/* Créditos - Active vivid blue pill */}
        <button
          type="button"
          className={`module-link ${isCreditosActive ? 'active' : ''}`}
          onClick={() => onNavigateModule('credito')}
          id="nav-creditos"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </span>
          <span className="menu-text">Créditos</span>
        </button>

        {/* Empresas */}
        <button
          type="button"
          className={`module-link ${isEmpresasActive ? 'active' : ''}`}
          onClick={() => onNavigateModule('empresa')}
          id="nav-empresas"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="9" y1="22" x2="9" y2="18" />
              <line x1="15" y1="22" x2="15" y2="18" />
              <line x1="8" y1="6" x2="8.01" y2="6" />
              <line x1="16" y1="6" x2="16.01" y2="6" />
              <line x1="8" y1="10" x2="8.01" y2="10" />
              <line x1="16" y1="10" x2="16.01" y2="10" />
              <line x1="8" y1="14" x2="8.01" y2="14" />
              <line x1="16" y1="14" x2="16.01" y2="14" />
            </svg>
          </span>
          <span className="menu-text">Empresas</span>
        </button>

        {/* Seguridad */}
        <button
          type="button"
          className={`module-link ${isSeguridadActive ? 'active' : ''}`}
          onClick={() => onNavigateModule('seguridad')}
          id="nav-seguridad-root"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <span className="menu-text">Seguridad</span>
        </button>

        {/* Socios */}
        <button
          type="button"
          className={`module-link ${isSociosActive ? 'active' : ''}`}
          onClick={() => onNavigateModule('socio')}
          id="nav-socios"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="7" r="4" />
              <path d="M17 11a4 4 0 0 0-4-4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M17 17a4 4 0 0 1 4 4v2" />
            </svg>
          </span>
          <span className="menu-text">Socios</span>
        </button>

        {/* Section Header: SEGURIDAD */}
        <div className="nav-section-title">SEGURIDAD</div>

        {/* Usuarios */}
        <button
          type="button"
          className={`module-link ${view === 'usuarios' ? 'active' : ''}`}
          onClick={() => onNavigateView('usuarios')}
          id="nav-usuarios"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span className="menu-text">Usuarios</span>
        </button>

        {/* Configuración */}
        <button
          type="button"
          className={`module-link ${view === 'configuracion' && configTab !== 'roles' ? 'active' : ''}`}
          onClick={() => onNavigateView('configuracion')}
          id="nav-configuracion"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="menu-text">Configuración</span>
        </button>

        {/* Section Header: CONFIGURACIÓN FINANCIERA */}
        <div className="nav-section-title">CONFIGURACIÓN FINANCIERA</div>

        {/* Tipos de salarios / IVA */}
        <button
          type="button"
          className={`module-link ${view === 'salarios' ? 'active' : ''}`}
          onClick={() => onNavigateView('salarios')}
          id="nav-salarios"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </span>
          <span className="menu-text">Tipos de salarios / IVA</span>
        </button>

        {/* Tipos de fianzas */}
        <button
          type="button"
          className={`module-link ${view === 'fianzas' ? 'active' : ''}`}
          onClick={() => onNavigateView('fianzas')}
          id="nav-fianzas"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="7" y1="16" x2="13" y2="16" />
            </svg>
          </span>
          <span className="menu-text">Tipos de fianzas</span>
        </button>

        {/* Formatos de créditos */}
        <button
          type="button"
          className={`module-link ${view === 'formatos' ? 'active' : ''}`}
          onClick={() => onNavigateView('formatos')}
          id="nav-formatos"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          <span className="menu-text">Formatos de créditos</span>
        </button>

        {/* Tasas de interés */}
        <button
          type="button"
          className={`module-link ${view === 'tasas' ? 'active' : ''}`}
          onClick={() => onNavigateView('tasas')}
          id="nav-tasas"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="7.5" cy="7.5" r="1.5" />
              <circle cx="16.5" cy="16.5" r="1.5" />
            </svg>
          </span>
          <span className="menu-text">Tasas de interés</span>
        </button>

        {/* Financieras & Integraciones */}
        <button
          type="button"
          className={`module-link ${view === 'financieras' ? 'active' : ''}`}
          onClick={() => onNavigateView('financieras')}
          id="nav-financieras"
        >
          <span className="menu-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M3 7v14M21 7v14M6 11h2M6 15h2M11 11h2M11 15h2M16 11h2M16 15h2M12 3L2 7h20L12 3z" />
            </svg>
          </span>
          <span className="menu-text">Financieras & Integraciones</span>
        </button>

        {/* Toggle for extended financial views (Plazos, Bancos, DocuSign) */}
        <button
          type="button"
          className="sidebar-more-toggle"
          onClick={() => setShowMoreFinancial(!showMoreFinancial)}
        >
          <span>{showMoreFinancial ? '▴ Menos opciones' : '▾ Más opciones financieras'}</span>
        </button>

        {showMoreFinancial && (
          <div className="sub-menu-group">
            <button
              type="button"
              className={`module-link sub-link ${view === 'plazos' ? 'active' : ''}`}
              onClick={() => onNavigateView('plazos')}
            >
              <span className="menu-icon-box">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span className="menu-text">Plazos de pago</span>
            </button>

            <button
              type="button"
              className={`module-link sub-link ${view === 'bancos' ? 'active' : ''}`}
              onClick={() => onNavigateView('bancos')}
            >
              <span className="menu-icon-box">
                <svg viewBox="0 0 24 24">
                  <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2l10 5H2l10-5z" />
                </svg>
              </span>
              <span className="menu-text">Entidades bancarias</span>
            </button>

            <button
              type="button"
              className={`module-link sub-link ${view === 'docusign' ? 'active' : ''}`}
              onClick={() => onNavigateView('docusign')}
            >
              <span className="menu-icon-box">
                <svg viewBox="0 0 24 24">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </span>
              <span className="menu-text">Firmas & Pagarés</span>
            </button>
          </div>
        )}
      </nav>

      {/* 3. Bottom User Profile Card - Perfectly aligned */}
      <div className="user-card">
        <div className="user-profile-row">
          <div className="avatar">
            {getInitials(fullName)}
          </div>
          <div className="user-info-text">
            <strong title={fullName}>
              {fullName}
            </strong>
            <small title={roleDisplay}>
              {roleDisplay}
            </small>
          </div>
        </div>
        <button type="button" className="sidebar-logout-btn" onClick={onLogout}>
          Salir
        </button>
      </div>
    </aside>
  );
};
