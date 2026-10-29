import { Routes } from '@angular/router';
import { TerminalNcr } from './features/pos/terminal-ncr/terminal-ncr';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'sistema/pos',
    pathMatch: 'full'
  },
  {
    // Ruta dinámica que recibe el módulo activo (:modulo = pos | inventory | quotes | audit | owner | programmer)
    path: 'sistema/:modulo',
    component: TerminalNcr,
    title: 'AutoPOS NCR - Sistema Digital de Autopartes'
  },
  {
    path: '**',
    redirectTo: 'sistema/pos'
  }
];
