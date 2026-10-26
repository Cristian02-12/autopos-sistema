import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
    {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
    title: 'AutoPOS NCR - Ingreso de Operador'
  },
  {
    path: 'app',
    canActivate: [roleGuard],
    children: [
      // Ruta dinámica de la Terminal POS (soporta abrir directo una pantalla o devolución por ID)
      {
        path: 'pos/:modo', // :modo puede ser 'venta', 'supervisor', 'cobro', 'devolucion'
        loadComponent: () => import('./features/pos/terminal-ncr/terminal-ncr').then(m => m.TerminalNcr),
        data: { roles: ['CAJERO', 'SUPERVISOR', 'DUENO', 'PROGRAMADOR'] }
      },
      // Ruta dinámica para cargar directamente una devolución escaneando el QR de 6 dígitos
      {
        path: 'pos/devolucion/:tipo/:idBoleta', // :tipo = 'completa' | 'parcial', :idBoleta = ej. '880001'
        loadComponent: () => import('./features/pos/devoluciones/devoluciones').then(m => m.Devoluciones),
        data: { roles: ['CAJERO', 'SUPERVISOR', 'DUENO', 'PROGRAMADOR'] }
      },
      // Ruta dinámica de Inventario con submódulos (:vista = 'stock' | 'conteo' | 'recepcion' | 'precios')
      {
        path: 'inventario/:vista',
        loadComponent: () => import('./features/inventario/layout-inventario/layout-inventario').then(m => m.LayoutInventario),
        data: { roles: ['CAJERO', 'SUPERVISOR', 'DUENO', 'PROGRAMADOR'] }
      },
      // Catálogo y Cotizaciones A4 con filtro dinámico de código OEM
      {
        path: 'catalogo/:oemFiltro',
        loadComponent: () => import('./features/catalogo/catalogo-equivalencias/catalogo-equivalencias').then(m => m.CatalogoEquivalencias),
        data: { roles: ['CAJERO', 'SUPERVISOR', 'DUENO', 'PROGRAMADOR'] }
      },
      // Auditoría separada por :tipoRegistro ('ventas' | 'devoluciones')
      {
        path: 'auditoria/:tipoRegistro',
        loadComponent: () => import('./features/auditoria/ventas-devoluciones/ventas-devoluciones').then(m => m.VentasDevoluciones),
        data: { roles: ['SUPERVISOR', 'DUENO', 'PROGRAMADOR'] }
      },
      // Resumen Ejecutivo del Dueño parametrizado por periodo (:periodo = 'dia' | 'semana' | 'mes' | 'ano')
      {
        path: 'dueno/reportes/:periodo',
        loadComponent: () => import('./features/dueno/panel-dueno-reportes/panel-dueno-reportes').then(m => m.PanelDuenoReportes),
        data: { roles: ['DUENO', 'PROGRAMADOR'] }
      },
      // Panel Maestro del Programador (:seccion = 'usuarios' | 'tickets' | 'config')
      {
        path: 'programador/:seccion',
        loadComponent: () => import('./features/programador/panel-programador/panel-programador').then(m => m.PanelProgramador),
        data: { roles: ['PROGRAMADOR'] }
      },
      {
        path: '',
        redirectTo: 'pos/venta',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
