import React, { useEffect, useState } from 'react';

export type Branding = {
  nombreComercial: string;
  colorPrimario: string;
  colorAcento: string;
  logoUrl: string | null;
  urlPortal: string | null;
  correoSoporte: string | null;
  licenciaVigente: boolean;
};

const API_URL = import.meta.env.VITE_API_URL || '';
export const DEFAULT_BRANDING: Branding = {
  nombreComercial: 'Creditos App',
  colorPrimario: '#14325c',
  colorAcento: '#c49a45',
  logoUrl: null,
  urlPortal: null,
  correoSoporte: null,
  licenciaVigente: true
};

let cache: Branding | null = null;
const listeners = new Set<(b: Branding) => void>();

export async function refreshBranding() {
  try {
    const response = await fetch(`${API_URL}/api/v1/plataforma/branding`);
    if (!response.ok) throw new Error(String(response.status));
    cache = { ...DEFAULT_BRANDING, ...(await response.json()) };
  } catch {
    cache ??= DEFAULT_BRANDING; // API down: keep the default brand, never block the UI
  }
  listeners.forEach((fn) => fn(cache!));
  return cache!;
}

/** Brand configured by the Super Admin (name, logo, colors). Shared by every component. */
export function useBranding() {
  const [branding, setBranding] = useState<Branding>(cache ?? DEFAULT_BRANDING);
  useEffect(() => {
    listeners.add(setBranding);
    if (!cache) void refreshBranding();
    return () => { listeners.delete(setBranding); };
  }, []);
  useEffect(() => { document.title = branding.nombreComercial; }, [branding.nombreComercial]);
  return branding;
}

export const logoSrc = (b: Branding) => (b.logoUrl ? `${API_URL}${b.logoUrl}` : null);

export const iniciales = (nombre: string) => {
  const parts = nombre.replace(/[^\p{L}\p{N}& ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CA';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
};

/** Mixes a #rrggbb color with black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Logo image when configured, otherwise the initials badge. `className` styles the badge. */
export const BrandMark: React.FC<{ branding: Branding; className: string; imgClassName?: string }> = ({ branding, className, imgClassName }) => {
  const src = logoSrc(branding);
  return src
    ? React.createElement('img', { src, alt: branding.nombreComercial, className: imgClassName ?? 'brand-logo-img' })
    : React.createElement('span', { className, 'aria-hidden': true }, iniciales(branding.nombreComercial));
};
