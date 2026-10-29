import { Injectable } from '@angular/core';

export interface Usuario {
  code: string;
  shortCode: string;
  pass: string;
  name: string;
  dni: string;
  role: 'CAJERO' | 'SUPERVISOR' | 'DUENO' | 'PROGRAMADOR' | string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  systemConfig = {
    companyName: 'COMPANIA HARD DISCOUNT S.A.C.',
    ruc: '20608280333',
    address: 'CAL. CESAR MORELLI 139 P-3',
    district: 'SAN BORJA, LIMA',
    localCode: '1888',
    cajaCode: '0002',
    serverCode: 'SRV999',
    defaultFixedFund: 150.0,
    usdRate: 3.72,
    currentTranNumber: 5635
  };

  usersDB: Usuario[] = [
    { code: '0019', shortCode: '005', pass: '7434', name: 'CRISTIAN ELINSON OLA', dni: '73075981', role: 'CAJERO' },
    { code: '0001', shortCode: '001', pass: '1234', name: 'ESTEFANY NATALIA NEC', dni: '45892104', role: 'SUPERVISOR' },
    { code: '0002', shortCode: '002', pass: '2026', name: 'ROBERTO GOMEZ (DUEÑO)', dni: '10234567', role: 'DUENO' },
    { code: '9999', shortCode: '999', pass: '7434', name: 'CRISTIAN ELINSON (PROGRAMADOR)', dni: '73075981', role: 'PROGRAMADOR' }
  ];

  currentUser: Usuario = this.usersDB[0];

  clientsDirectory: Record<string, { name: string; type: string }> = {
    '73075981': { name: 'CRISTIAN ELINSON OLA', type: 'Boleta' },
    '45892104': { name: 'CARLOS MENDOZA VARGAS (TOYOTA YARIS)', type: 'Boleta' },
    '10458921041': { name: 'TALLER MECANICO EL RAPIDO E.I.R.L.', type: 'Factura' },
    '20601458921': { name: 'FLOTA TAXI SEGURO S.A.C.', type: 'Factura' },
    '20608280333': { name: 'COMPANIA HARD DISCOUNT S.A.C.', type: 'Factura' }
  };

  getFormattedDateTime(): string {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getFullYear()).slice(-2)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  showToast(message: string, type: 'success' | 'warning' | 'info' = 'info'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = {
      success: 'bg-emerald-900 border-emerald-500 text-white',
      warning: 'bg-amber-950 border-amber-400 text-amber-100',
      info: 'bg-slate-900 border-indigo-500 text-white'
    };
    const icons = {
      success: 'fa-circle-check text-emerald-400',
      warning: 'fa-triangle-exclamation text-amber-400',
      info: 'fa-circle-info text-indigo-400'
    };
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-xl border-l-4 shadow-2xl flex items-center gap-2.5 text-xs font-bold max-w-sm transition-all ${colors[type]}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type]} text-base"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}
