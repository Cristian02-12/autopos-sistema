import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const usuarioActual = authService.usuarioActivo() as unknown as { rol: string } | null; // Signal de Angular 20

  if (!usuarioActual) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar roles permitidos en la ruta hija activa
  const childRoute = route.firstChild;
  const rolesPermitidos: string[] | undefined = childRoute?.data?.['roles'];

  if (rolesPermitidos && !rolesPermitidos.includes(usuarioActual.rol)) {
    // Si no tiene permiso, redirige a su terminal de ventas
    router.navigate(['/app/pos/venta']);
    return false;
  }

  return true;
};
