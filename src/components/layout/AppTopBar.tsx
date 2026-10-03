import React from 'react';
import type { SecurityUser } from '../../api';

export interface AppTopBarProps {
  breadcrumbRoot: string;
  breadcrumbCurrent: string;
  onRootClick?: () => void;
  currentUser?: SecurityUser | null;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onNotificationClick?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  breadcrumbRoot,
  breadcrumbCurrent,
  onRootClick,
  currentUser,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Buscar créditos, clientes...',
  themeMode = 'light',
  onToggleTheme,
  onNotificationClick
}) => {
  const getInitials = (name?: string | null) => {
    if (!name) return 'EC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getFriendlyName = (name?: string | null) => {
    if (!name) return 'Edwin Capdevilla';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 2) {
      return parts.map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
    const first = parts[0][0].toUpperCase() + parts[0].slice(1).toLowerCase();
    const surname = parts[2]
      ? parts[2][0].toUpperCase() + parts[2].slice(1).toLowerCase()
      : parts[1][0].toUpperCase() + parts[1].slice(1).toLowerCase();
    return `${first} ${surname}`;
  };

  const getDisplayRole = (roles?: string[] | null) => {
    if (!roles || roles.length === 0) return 'Analista de crédito';
    const r = roles[0];
    return r[0].toUpperCase() + r.slice(1).toLowerCase();
  };

  const fullName = currentUser?.fullName || 'Edwin Capdevilla';
  const friendlyName = getFriendlyName(currentUser?.fullName);
  const displayRole = getDisplayRole(currentUser?.roles);

  return (
    <header className="credit-top-bar">
      {/* Left: Breadcrumb trail */}
      <nav className="credit-breadcrumb" aria-label="Breadcrumb">
        {onRootClick ? (
          <button
            type="button"
            className="credit-breadcrumb-btn"
            onClick={onRootClick}
            title={`Volver a ${breadcrumbRoot}`}
          >
            <svg className="breadcrumb-back-icon" viewBox="0 0 24 24">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
            <span>{breadcrumbRoot}</span>
          </button>
        ) : (
          <span className="credit-breadcrumb-root">{breadcrumbRoot}</span>
        )}
        <span className="credit-breadcrumb-separator">›</span>
        <span className="credit-breadcrumb-current">{breadcrumbCurrent}</span>
      </nav>

      {/* Right: Actions, Notifications, User Profile */}
      <div className="credit-top-bar-right">
        {/* Search Input Box */}
        <div className="credit-top-search">
          <svg className="credit-search-icon" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Theme mode toggle */}
        {onToggleTheme && (
          <button
            type="button"
            className="credit-theme-btn"
            onClick={onToggleTheme}
            title={themeMode === 'light' ? 'Cambiar a modo noche' : 'Cambiar a modo día'}
          >
            {themeMode === 'light' ? '🌙' : '☀️'}
          </button>
        )}

        {/* Notification Bell with red dot */}
        <button
          type="button"
          className="credit-bell-btn"
          title="Notificaciones del sistema"
          onClick={onNotificationClick}
        >
          <svg className="credit-bell-icon" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="credit-bell-dot" />
        </button>

        {/* User Pill */}
        <div className="credit-user-pill" title={fullName}>
          <div className="credit-user-avatar">
            {getInitials(currentUser?.fullName)}
          </div>
          <div className="credit-user-details">
            <span className="credit-user-name">{friendlyName}</span>
            <span className="credit-user-role">{displayRole}</span>
          </div>
          <svg className="credit-user-chevron" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
};
