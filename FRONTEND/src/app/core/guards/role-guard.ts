import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const usuario = auth.currentUser;

  if (!usuario) {
    router.navigate(['/sistema/pos']);
    return false;
  }

  const childRoute = route.firstChild;
  const rolesPermitidos: string[] | undefined = childRoute?.data?.['roles'];

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.role)) {
    router.navigate(['/sistema/pos']);
    return false;
  }

  return true;
};
