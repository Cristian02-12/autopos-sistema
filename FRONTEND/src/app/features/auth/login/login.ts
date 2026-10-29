import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements AfterViewInit {
  private auth = inject(Auth);

  ngAfterViewInit(): void {
    const win = window as any;

    win.fillLogin = (code: string, pass: string) => {
      (document.getElementById('login-code') as HTMLInputElement).value = code;
      (document.getElementById('login-pass') as HTMLInputElement).value = pass;
      document.getElementById('login-error')?.classList.add('hidden');
    };

    win.handleLoginSubmit = (e: Event) => {
      e.preventDefault();
      const code = (document.getElementById('login-code') as HTMLInputElement).value.trim();
      const pass = (document.getElementById('login-pass') as HTMLInputElement).value.trim();

      const user = this.auth.usersDB.find(u => (u.code === code || u.shortCode === code) && u.pass === pass);
      if (!user) {
        const err = document.getElementById('login-error')!;
        err.textContent = '❌ Código de operador o clave incorrectos. Verifica las credenciales.';
        err.classList.remove('hidden');
        return;
      }

      this.auth.currentUser = user;
      document.getElementById('login-screen')?.classList.add('hidden');
      win.applyRolePermissions?.();
      win.switchModule?.('pos');
      win.setPosState?.('MAIN_MENU');
      win.updateHeaderStatus?.();
      this.auth.showToast(`Bienvenido ${this.auth.currentUser.name} (${this.auth.currentUser.role})`, 'success');
    };
  }
}
