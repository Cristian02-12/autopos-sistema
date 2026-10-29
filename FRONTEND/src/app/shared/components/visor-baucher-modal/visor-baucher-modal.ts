import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-visor-baucher-modal',
  styleUrl: './visor-baucher-modal.css',
  templateUrl: './visor-baucher-modal.html',
})
export class VisorBaucherModal implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);

  ngAfterViewInit(): void {
    const win = window as any;

    win.openVoucherModal = (title: string, htmlContent: string, afterCloseAction: string) => {
      this.caja.closeAfterVoucherAction = afterCloseAction;
      document.getElementById('voucher-modal-title')!.textContent = title;
      document.getElementById('voucher-paper')!.innerHTML = htmlContent;
      document.getElementById('voucher-modal')?.classList.remove('hidden');
    };

    win.closeVoucherModal = () => {
      document.getElementById('voucher-modal')?.classList.add('hidden');
      if (this.caja.closeAfterVoucherAction === 'LOGOUT_SHIFT') {
        this.caja.shiftState.fixedFund = 0;
        this.caja.shiftState.cashSalesTotal = 0;
        this.caja.shiftState.withdrawalsTotal = 0;
        this.caja.shiftState.cashRefundsTotal = 0;
        this.caja.shiftState.arqueoLines = [];
        this.caja.shiftState.arqueoTotal = 0;
        win.updateHeaderStatus?.();
        document.getElementById('login-screen')?.classList.remove('hidden');
      } else if (this.caja.closeAfterVoucherAction !== 'STAY_AUDIT') {
        win.setPosState?.('SALES');
      }
    };

    win.sendVoucherWhatsApp = () => {
      const phone = (document.getElementById('voucher-wsp-phone') as HTMLInputElement).value.trim() || '999888777';
      this.auth.showToast(`📲 Comprobante digital enviado por WhatsApp al +51 ${phone}`, 'success');
    };

    win.openQrSipModal = (methodLabel = 'QR SIP') => {
      const remaining = this.caja.getRemainingToPay();
      if (remaining <= 0.009) {
        this.auth.showToast('La cuenta ya está pagada. Presiona TOTAL IMPRIMIR.', 'info');
        return;
      }
      this.caja.pendingQrMethodLabel = methodLabel;
      const typedVal = parseFloat((document.getElementById('ncr-main-input') as HTMLInputElement).value) || 0;
      const amountForQr = typedVal > 0 && typedVal <= remaining ? typedVal : remaining;

      document.getElementById('qrsip-amount-label')!.textContent = `S/ ${amountForQr.toFixed(2)} (${methodLabel})`;
      (document.getElementById('qrsip-dni-input') as HTMLInputElement).value =
        this.caja.currentCustomer.doc !== '0' ? this.caja.currentCustomer.doc : this.auth.currentUser.dni;
      document.getElementById('qrsip-modal')?.classList.remove('hidden');
    };

    win.closeQrSipModal = () => document.getElementById('qrsip-modal')?.classList.add('hidden');

    win.generateQrSipCode = () => {
      const dni = (document.getElementById('qrsip-dni-input') as HTMLInputElement).value.trim();
      if (this.auth.clientsDirectory[dni]) {
        this.caja.currentCustomer.doc = dni;
        this.caja.currentCustomer.name = this.auth.clientsDirectory[dni].name;
        win.renderSalesTable?.();
      }
      this.auth.showToast(`Código QR activado para DNI ${dni}.`, 'info');
    };

    win.confirmQrSipPayment = () => {
      win.closeQrSipModal();
      win.addPartialOrFullPayment?.('QR SIP', this.caja.pendingQrMethodLabel);
    };
  }
}
