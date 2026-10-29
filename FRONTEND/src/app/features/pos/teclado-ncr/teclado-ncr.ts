import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-teclado-ncr',
  styleUrl: './teclado-ncr.css',
  templateUrl: './teclado-ncr.html',
})
export class TecladoNcr implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);

  ngAfterViewInit(): void {
    const win = window as any;

    win.pressNumpad = (char: string) => {
      win.appendDigitToMainInput?.(char);
      document.getElementById('ncr-main-input')?.focus();
    };

    win.quickScanCode = (barcodeStr: string) => {
      if (!['SALES', 'MAIN_MENU', 'RETURN_PARTIAL_SCAN'].includes(this.caja.posScreenState)) {
        win.setPosState?.('SALES');
      }
      (document.getElementById('ncr-main-input') as HTMLInputElement).value = barcodeStr;
      win.handleMainEnter?.();
    };

    win.triggerKey = (keyName: string) => {
      const input = document.getElementById('ncr-main-input') as HTMLInputElement;
      if (keyName === 'DESLOGUEO') {
        document.getElementById('login-screen')?.classList.remove('hidden');
        this.auth.showToast('Sesión cerrada. Ingrese credenciales de operador.', 'info');
        return;
      }
      if (keyName === 'MENU_PRINCIPAL') {
        win.setPosState?.('MAIN_MENU');
        return;
      }
      if (keyName === 'MENU_SUPERVISOR') {
        this.caja.supSelectedIndex = -1;
        win.setPosState?.('SUP_MENU');
        return;
      }
      if (keyName === 'MENU_CAJERO') {
        win.setPosState?.('SALES');
        this.auth.showToast('Modo Venta de Cajero activo', 'info');
        return;
      }
      if (keyName === 'RETORNAR') {
        win.backspaceMainInputDigit?.();
        input?.focus();
        return;
      }
      if (keyName === 'LIMPIAR') {
        win.resetMainInputBar?.();
        if (['FONDO_FIJO_INPUT', 'RETIRO_INPUT', 'ARQUEO_INPUT'].includes(this.caja.posScreenState)) {
          this.caja.tempCashEntries = [];
          win.renderCashTable?.();
        }
        input?.focus();
        return;
      }
      if (keyName === 'ANULAR_TRANSAC') {
        this.caja.currentCart = [];
        this.caja.selectedCartIndex = -1;
        this.caja.currentPaymentBlocks = [];
        this.caja.currentCustomer = { doc: '0', name: '--', docType: 'Boleta', plate: '' };
        win.setPosState?.('SALES');
        this.auth.showToast('Transacción actual anulada', 'warning');
        return;
      }
      if (keyName === 'ELIMINAR_ITEM') {
        if (this.caja.currentCart.length === 0) {
          this.auth.showToast('No hay productos en la lista de compra', 'warning');
          return;
        }
        if (this.caja.selectedCartIndex < 0 || this.caja.selectedCartIndex >= this.caja.currentCart.length) {
          this.auth.showToast('⚠️ Primero haz clic sobre el producto que deseas quitar en la tabla y luego presiona BORRAR ITEM', 'warning');
          return;
        }
        const removed = this.caja.currentCart.splice(this.caja.selectedCartIndex, 1)[0];
        this.caja.selectedCartIndex = -1;
        win.renderSalesTable?.();
        this.auth.showToast(`Se eliminó únicamente "${removed.name}". El resto de la compra sigue intacto.`, 'info');
        return;
      }
      if (keyName === 'CANTIDAD') {
        const val = parseInt(input.value, 10);
        if (val > 0 && val <= 99) {
          this.caja.nextQtyMultiplier = val;
          win.resetMainInputBar?.();
          this.auth.showToast(`Próximo producto se multiplicará x${this.caja.nextQtyMultiplier} unidades`, 'info');
        } else {
          this.auth.showToast('Digita un número en la barra y luego presiona CANTIDAD', 'warning');
        }
        return;
      }
      if (keyName === 'VENDEDOR') {
        win.toggleMechanicTariff?.();
        return;
      }
      if (keyName === 'CATALOGO') {
        win.toggleCatalogDrawer?.();
        return;
      }
      if (keyName === 'CLIENTE_DNI') {
        win.promptClientDocument?.('Boleta');
        return;
      }
      if (keyName === 'COTIZAR') {
        win.saveCurrentCartAsQuote?.();
        return;
      }
      if (keyName === 'TOTAL_IMPRIMIR') {
        win.handleTotalImprimir?.();
      }
    };
  }
}
