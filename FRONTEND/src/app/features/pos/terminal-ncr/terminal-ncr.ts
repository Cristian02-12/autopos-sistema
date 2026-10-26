import { Component, computed, signal } from '@angular/core';

export type ModoPantallaPOS = 'VENTA' | 'MENU_SUPERVISOR' | 'COBRO_EFECTIVO' | 'FONDO_FIJO_10' | 'RETIRO_11' | 'ARQUEO_09';

@Component({
  imports: [],
  selector: 'app-terminal-ncr',
  standalone: true,
  styleUrl: './terminal-ncr.css',
  templateUrl: './terminal-ncr.html',
})
export class TerminalNcr {
  modoActual = signal<ModoPantallaPOS>('VENTA');
  digitosCrudos = signal<string>(''); // Solo almacena dígitos del 0 al 9
  opcionSupervisorSeleccionada = signal<number | null>(null); // Inicia en null (sin preselección)

  // Determina si la pantalla actual es de ingreso de dinero
  esModoEfectivo = computed(() =>
    ['COBRO_EFECTIVO', 'FONDO_FIJO_10', 'RETIRO_11', 'ARQUEO_09'].includes(this.modoActual())
  );

  // Valor que se muestra en la barra principal
  valorBarraPrincipal = computed(() => {
    const raw = this.digitosCrudos();
    if (this.esModoEfectivo()) {
      if (!raw) return '0.00';
      return `${parseInt(raw, 10)}.00`;
    }
    return raw; // Limpio si no hay dígitos en pantallas normales
  });

  // Presionar número en el teclado NCR o teclado físico
  presionarDigito(digito: string): void {
    if (!/^[0-9]$/.test(digito)) return; // Bloquea letras y puntos
    this.digitosCrudos.update(actual => (actual + digito).slice(0, 15));
  }

  // Botón RETORNAR (ESC): elimina dígito por dígito de derecha a izquierda
  presionarRetornarEsc(): void {
    if (this.digitosCrudos().length > 0) {
      this.digitosCrudos.update(actual => actual.slice(0, -1));
      return;
    }
    // Si la barra ya está vacía, regresa a la pantalla principal de ventas
    this.irMenuPrincipal();
  }

  abrirMenuSupervisor(): void {
    this.modoActual.set('MENU_SUPERVISOR');
    this.opcionSupervisorSeleccionada.set(null); // Ninguna opción seleccionada al entrar
    this.digitosCrudos.set(''); // Barra limpia
  }

  irMenuPrincipal(): void {
    this.modoActual.set('VENTA');
    this.opcionSupervisorSeleccionada.set(null);
    this.digitosCrudos.set('');
  }
}
