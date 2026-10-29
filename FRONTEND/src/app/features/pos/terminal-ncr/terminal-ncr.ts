import { Component, AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { Inventario } from '../../../core/services/inventario';
import { Login } from '../../auth/login/login';
import { NavbarRoles } from '../../../shared/components/navbar-roles/navbar-roles';
import { VisorBaucherModal } from '../../../shared/components/visor-baucher-modal/visor-baucher-modal';
import { MenuSupervisor } from '../menu-supervisor/menu-supervisor';
import { Devoluciones } from '../devoluciones/devoluciones';
import { CatalogoEquivalencias } from '../../catalogo/catalogo-equivalencias/catalogo-equivalencias';
import { TecladoNcr } from '../teclado-ncr/teclado-ncr';
import { LayoutInventario } from '../../inventario/layout-inventario/layout-inventario';
import { CotizadorA4 } from '../../cotizaciones/cotizador-a4/cotizador-a4';
import { VentasDevoluciones } from '../../auditoria/ventas-devoluciones/ventas-devoluciones';
import { PanelDuenoReportes } from '../../dueno/panel-dueno-reportes/panel-dueno-reportes';
import { PanelProgramador } from '../../programador/panel-programador/panel-programador';

@Component({
  imports: [CommonModule, Login, NavbarRoles, VisorBaucherModal, MenuSupervisor, Devoluciones, CatalogoEquivalencias, TecladoNcr, LayoutInventario, CotizadorA4, VentasDevoluciones, PanelDuenoReportes, PanelProgramador],
  selector: 'app-terminal-ncr',
  standalone: true,
  styleUrl: './terminal-ncr.css',
  templateUrl: './terminal-ncr.html',
  encapsulation: ViewEncapsulation.None
})

export class TerminalNcr implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  private caja = inject(CajaNcr);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    this.inicializarTerminalVentasPOS();

    this.route.paramMap.subscribe(params => {
      const mod = params.get('modulo');
      const win = window as any;
      if (mod && win.switchModule && ['pos', 'inventory', 'quotes', 'audit', 'owner', 'programmer'].includes(mod)) {
        win.switchModule(mod, false);
      }
    });
  }

  private inicializarTerminalVentasPOS(): void {
    const win = window as any;

    win.syncAuthMirror = () => {
      const input = document.getElementById('ncr-main-input') as HTMLInputElement;
      const mirror = document.getElementById('ncr-auth-box-mirror') as HTMLInputElement;
      if (!mirror || !input) return;
      mirror.value = input.type === 'password' ? '•'.repeat(input.value.length) : input.value;
    };

    win.resetMainInputBar = () => {
      const input = document.getElementById('ncr-main-input') as HTMLInputElement;
      this.caja.cashDigitsBuffer = '';
      if (input) {
        input.value = this.caja.isCashScreenState() ? '0.00' : '';
      }
      win.syncAuthMirror();
    };

    win.appendDigitToMainInput = (digit: string) => {
      if (!/^[0-9]$/.test(digit)) return;
      const input = document.getElementById('ncr-main-input') as HTMLInputElement;
      if (!input) return;

      if (this.caja.isCashScreenState()) {
        if (this.caja.cashDigitsBuffer === '' && digit === '0') {
          input.value = '0.00';
          return;
        }
        if (this.caja.cashDigitsBuffer.length >= 6) return;
        this.caja.cashDigitsBuffer += digit;
        input.value = `${parseInt(this.caja.cashDigitsBuffer, 10)}.00`;
      } else {
        if (input.value.length >= 16) return;
        input.value += digit;
      }
      win.syncAuthMirror();
    };

    win.backspaceMainInputDigit = () => {
      const input = document.getElementById('ncr-main-input') as HTMLInputElement;
      if (!input) return;
      if (this.caja.isCashScreenState()) {
        if (this.caja.cashDigitsBuffer.length > 0) {
          this.caja.cashDigitsBuffer = this.caja.cashDigitsBuffer.slice(0, -1);
        }
        input.value = this.caja.cashDigitsBuffer.length > 0 ? `${parseInt(this.caja.cashDigitsBuffer, 10)}.00` : '0.00';
      } else if (input.value.length > 0) {
        input.value = input.value.slice(0, -1);
      }
      win.syncAuthMirror();
    };

    win.handleMainInputKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        win.handleMainEnter();
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        win.backspaceMainInputDigit();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        win.moveSupCursor?.(-1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        win.moveSupCursor?.(1);
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        win.appendDigitToMainInput(e.key);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    };

    win.setPosState = (newState: string) => {
      this.caja.posScreenState = newState;
      const input = document.getElementById('ncr-main-input') as HTMLInputElement;
      const promptTitle = document.getElementById('ncr-prompt-title')!;
      const promptSub = document.getElementById('ncr-prompt-subtitle')!;
      const modePill = document.getElementById('ncr-mode-pill')!;
      const helperHint = document.getElementById('ncr-helper-hint')!;

      document.getElementById('center-view-sales')?.classList.add('hidden');
      document.getElementById('center-view-sup-menu')?.classList.add('hidden');
      document.getElementById('center-view-auth')?.classList.add('hidden');
      document.getElementById('center-view-cash-table')?.classList.add('hidden');
      document.getElementById('center-view-return')?.classList.add('hidden');

      input.type = 'text';
      input.placeholder = '';
      helperHint.classList.add('hidden');
      win.resetMainInputBar();

      if (newState === 'SALES' || newState === 'MAIN_MENU') {
        document.getElementById('center-view-sales')?.classList.remove('hidden');
        promptTitle.textContent = 'Escanee el producto o ingrese el código numérico y presione Enter.';
        promptSub.textContent = 'Solo números: código de barras (ej. 671576) o ingresa un ID Único de Boleta (ej. 880001) para devolución.';
        modePill.textContent = newState === 'MAIN_MENU' ? 'MENÚ PRINCIPAL CAJA' : 'MODO VENTA MOSTRADOR';
        helperHint.classList.remove('hidden');
        win.renderSalesTable();
      } else if (newState === 'PAYMENT') {
        document.getElementById('center-view-sales')?.classList.remove('hidden');
        const remaining = this.caja.getRemainingToPay();
        promptTitle.textContent = remaining > 0 ? `Ingrese monto a cobrar (Por pagar: S/ ${remaining.toFixed(2)})` : `Cuenta cubierta (S/ 0.00 por pagar). Presione TOTAL IMPRIMIR para emitir el comprobante.`;
        promptSub.textContent = 'Puedes cobrar efectivo en bloques (ej. 100 + Enter y luego 100 + Enter) o combinar 2 medios de pago. Al terminar presiona TOTAL IMPRIMIR.';
        modePill.textContent = 'COBRO / PASARELA MULTIPAGO';
        win.renderSalesTable();
      } else if (newState === 'SUP_MENU') {
        document.getElementById('center-view-sup-menu')?.classList.remove('hidden');
        promptTitle.textContent = 'Seleccione una opción del Menú Supervisor';
        promptSub.textContent = 'Ninguna opción está preseleccionada. Haz clic en una opción, usa las flechas o digita el código (03, 09, 10, 11, 19, 21, 76) + Enter.';
        modePill.textContent = 'MENÚ SUPERVISOR';
        input.value = '';
        win.renderSupMenuList?.();
      } else if (newState === 'RETURN_MENU') {
        document.getElementById('center-view-sup-menu')?.classList.remove('hidden');
        promptTitle.textContent = 'Módulo de Devolución - Seleccione modalidad';
        promptSub.textContent = 'Seleccione 01 para Devolución Completa o 02 para Devolución Parcial y presione Enter.';
        modePill.textContent = 'MENÚ DE DEVOLUCIONES';
        input.value = this.caja.returnOptionsList[this.caja.supSelectedIndex].code;
        win.renderReturnMenuList?.();
      } else if (newState === 'RETURN_ASK_TICKET') {
        document.getElementById('center-view-auth')?.classList.remove('hidden');
        promptTitle.textContent = `Devolución ${this.caja.returnFlowState.mode} - Ingrese ID Único numérico de la Boleta`;
        promptSub.textContent = 'Digita los 6 dígitos del Identificador Único del comprobante (Ejemplo de prueba: 880001) y presiona Enter.';
        document.getElementById('auth-step-title')!.textContent = `DEVOLUCIÓN ${this.caja.returnFlowState.mode}`;
        document.getElementById('auth-step-subtitle')!.textContent = 'DIGITE IDENTIFICADOR ÚNICO DE LA BOLETA (EJ. 880001) + ENTER';
        modePill.textContent = `BUSCANDO BOLETA (${this.caja.returnFlowState.mode})`;
      } else if (newState === 'RETURN_COMPLETE_VIEW') {
        document.getElementById('center-view-return')?.classList.remove('hidden');
        promptTitle.textContent = 'Devolución Completa identificada - Verifique productos y presione TOTAL IMPRIMIR';
        promptSub.textContent = 'Todos los productos de la compra han sido cargados. Elige el canal de reembolso abajo y presiona TOTAL IMPRIMIR.';
        modePill.textContent = '01. DEVOLUCIÓN COMPLETA';
        win.renderReturnView?.();
      } else if (newState === 'RETURN_PARTIAL_SCAN') {
        document.getElementById('center-view-return')?.classList.remove('hidden');
        promptTitle.textContent = 'Devolución Parcial - Ingrese el código numérico del producto a devolver y presione Enter';
        promptSub.textContent = 'Solo se devolverá el producto que digites en la barra (Ej. 671576 o 20391060). Luego presiona TOTAL IMPRIMIR.';
        modePill.textContent = '02. DEVOLUCIÓN PARCIAL';
        win.renderReturnView?.();
      } else if (newState === 'AUTH_SUP_CODE') {
        document.getElementById('center-view-auth')?.classList.remove('hidden');
        promptTitle.textContent = 'Autorización Requerida - Ingrese Código Supervisor y presione Enter';
        promptSub.textContent = 'Credencial de Supervisora de prueba: Código 0001';
        document.getElementById('auth-step-title')!.textContent = 'INGRESAR AUTORIZADOR';
        document.getElementById('auth-step-subtitle')!.textContent = 'Ingrese código de supervisora (0001) y presione ENTER';
        modePill.textContent = `AUTORIZANDO OPCIÓN ${this.caja.pendingSupOption}`;
      } else if (newState === 'AUTH_SUP_PASS') {
        document.getElementById('center-view-auth')?.classList.remove('hidden');
        input.type = 'password';
        promptTitle.textContent = 'Digite Clave de Supervisora y presione Enter';
        promptSub.textContent = 'Clave de Supervisora de prueba: 1234';
        document.getElementById('auth-step-title')!.textContent = this.caja.tempSupUser ? this.caja.tempSupUser.name : 'ESTEFANY NATALIA NEC';
        document.getElementById('auth-step-subtitle')!.textContent = 'DIGITE CLAVE (1234) Y PRESIONE ENTER';
        modePill.textContent = 'CLAVE SUPERVISOR';
      } else if (newState === 'AUTH_CASHIER_PASS') {
        document.getElementById('center-view-auth')?.classList.remove('hidden');
        input.type = 'password';
        promptTitle.textContent = 'Digite Clave del Cajero Actual y presione Enter';
        promptSub.textContent = `Cajero actual: ${this.auth.currentUser.name} (Clave: ${this.auth.currentUser.pass})`;
        document.getElementById('auth-step-title')!.textContent = this.auth.currentUser.name;
        document.getElementById('auth-step-subtitle')!.textContent = `DIGITE CLAVE DEL CAJERO (${this.auth.currentUser.pass}) PARA ABRIR CAJÓN`;
        modePill.textContent = 'APERTURA DE CAJÓN (03)';
      } else if (newState === 'FONDO_FIJO_INPUT') {
        document.getElementById('center-view-cash-table')?.classList.remove('hidden');
        promptTitle.textContent = 'Ingrese fondo fijo - SOLES 1';
        promptSub.textContent = 'Ingrese el monto (ej. 150), presione ENTER para registrar y luego TOTAL IMPRIMIR para emitir el baucher.';
        modePill.textContent = '10. FONDO FIJO';
        win.renderCashTable?.();
      } else if (newState === 'RETIRO_DNI') {
        document.getElementById('center-view-auth')?.classList.remove('hidden');
        promptTitle.textContent = 'Retiro de Efectivo - Ingrese DNI del Cajero y presione Enter';
        promptSub.textContent = `DNI de ${this.auth.currentUser.name}: ${this.auth.currentUser.dni}`;
        document.getElementById('auth-step-title')!.textContent = 'INGRESAR DNI DEL CAJERO';
        document.getElementById('auth-step-subtitle')!.textContent = `Digite su DNI (${this.auth.currentUser.dni}) y presione ENTER`;
        modePill.textContent = '11. RETIRO DE CAJA';
      } else if (newState === 'RETIRO_INPUT') {
        document.getElementById('center-view-cash-table')?.classList.remove('hidden');
        const currentDrawer = this.caja.getCurrentCashInDrawer();
        const suggestedWithdraw = Math.max(0, Math.floor((currentDrawer - this.caja.shiftState.fixedFund) / 10) * 10);
        promptTitle.textContent = 'Ingrese monto a retirar (Monto exacto y redondo)';
        promptSub.textContent = `Efectivo en cajón: S/ ${currentDrawer.toFixed(2)} | Fondo Fijo: S/ ${this.caja.shiftState.fixedFund.toFixed(2)} | Sugerido redondo: S/ ${suggestedWithdraw}.00 (Enter y luego Total Imprimir)`;
        modePill.textContent = '11. RETIRO DE EFECTIVO';
        win.renderCashTable?.();
      } else if (newState === 'ARQUEO_INPUT') {
        document.getElementById('center-view-cash-table')?.classList.remove('hidden');
        promptTitle.textContent = `Ingrese Arqueo - SOLES ${this.caja.tempCashEntries.length + 1}`;
        promptSub.textContent = 'Ingresa cada monto de efectivo restante en el cajón + ENTER. Al terminar presiona TOTAL IMPRIMIR.';
        modePill.textContent = '09. ARQUEO DE CAJA';
        win.renderCashTable?.();
      } else if (newState === 'CLIENT_DOC_INPUT') {
        document.getElementById('center-view-sales')?.classList.remove('hidden');
        promptTitle.textContent = `Ingrese ${this.caja.currentCustomer.docType === 'Factura' ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'} del Cliente y presione Enter`;
        promptSub.textContent = 'Ejemplos automáticos: DNI 73075981, DNI 45892104 o RUC 20601458921';
        modePill.textContent = `IDENTIFICANDO ${this.caja.currentCustomer.docType.toUpperCase()}`;
      }

      win.renderSoftkeysColumn();
      setTimeout(() => input?.focus(), 50);
    };

    win.renderSoftkeysColumn = () => {
      const col = document.getElementById('ncr-softkeys-column');
      if (!col) return;
      const st = this.caja.posScreenState;

      if (st === 'MAIN_MENU' || st === 'SUP_MENU' || st === 'RETURN_MENU' || st.startsWith('AUTH_')) {
        col.innerHTML = `
          <button onclick="triggerKey('DESLOGUEO')" class="touch-softkey">DESLOGUEO</button>
          <button onclick="openReturnMenu()" class="touch-softkey border-rose-600 bg-rose-50 text-rose-900">DEVOLUCIÓN<br>PRODUCTOS</button>
          <div class="touch-softkey opacity-40"></div>
          <button onclick="triggerKey('MENU_SUPERVISOR')" class="touch-softkey border-amber-600 bg-amber-50">MENU<br>SUPERVISOR</button>
          <button onclick="triggerKey('MENU_CAJERO')" class="touch-softkey">MENU DE<br>CAJERO</button>
          <button onclick="setPosState('SALES')" class="touch-softkey text-indigo-900">IR A VENTA<br>MOSTRADOR</button>
          <button onclick="toggleCatalogDrawer()" class="touch-softkey">CATÁLOGO<br>ITEM / OEM</button>
          <div class="touch-softkey opacity-40"></div>
        `;
      } else if (st === 'PAYMENT') {
        col.innerHTML = `
          <button onclick="addPartialOrFullPayment('SOLES')" class="touch-softkey border-emerald-600 bg-emerald-50 text-emerald-950">EFECTIVO<br>SOLES (+)</button>
          <button onclick="openQrSipModal('YAPE / PLIN (QR SIP)')" class="touch-softkey border-purple-600 bg-purple-50 text-purple-950 flex justify-between px-2">
              <span>YAPE / PLIN</span><span class="bg-purple-700 text-white px-1 py-0.5 rounded text-[8px]">QR</span>
          </button>
          <button onclick="openQrSipModal('BILLETERA DIGITAL QR')" class="touch-softkey border-blue-600 bg-blue-50 flex justify-between px-2">
              <span>QR SIP</span><span class="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] lowercase">sip</span>
          </button>
          <button onclick="addPartialOrFullPayment('TARJ BANC')" class="touch-softkey">TARJETA<br>BANCARIA</button>
          <button onclick="addPartialOrFullPayment('DEBITO SIP')" class="touch-softkey flex justify-between px-2">
              <span>DÉBITO SIP</span><span class="bg-blue-700 text-white px-1 py-0.5 rounded text-[8px]">sip</span>
          </button>
          <button onclick="addPartialOrFullPayment('CREDITO SIP')" class="touch-softkey flex justify-between px-2">
              <span>CRÉDITO SIP</span><span class="bg-slate-800 text-white px-1 py-0.5 rounded text-[8px]">sip</span>
          </button>
          <button onclick="clearCurrentPaymentBlocks()" class="touch-softkey text-rose-800">REINICIAR<br>COBROS</button>
          <button onclick="setPosState('SALES')" class="touch-softkey">VOLVER A<br>PRODUCTOS</button>
        `;
      } else if (st === 'RETURN_ASK_TICKET' || st === 'RETURN_COMPLETE_VIEW' || st === 'RETURN_PARTIAL_SCAN') {
        col.innerHTML = `
          <button onclick="triggerKey('TOTAL_IMPRIMIR')" class="touch-softkey bg-emerald-100 border-emerald-600 text-emerald-950">CONFIRMAR /<br>TOTAL IMPR.</button>
          <button onclick="openReturnMenu()" class="touch-softkey">CAMBIAR TIPO<br>DEVOLUCIÓN</button>
          <button onclick="quickFillDemoReturnTicket()" class="touch-softkey bg-amber-50 border-amber-500 text-amber-900">PROBAR BOLETA<br>ID: 880001</button>
          <button onclick="setPosState('SALES')" class="touch-softkey text-rose-800">CANCELAR<br>DEVOLUCIÓN</button>
          <div class="touch-softkey opacity-40"></div>
          <div class="touch-softkey opacity-40"></div>
          <div class="touch-softkey opacity-40"></div>
          <div class="touch-softkey opacity-40"></div>
        `;
      } else if (st === 'ARQUEO_INPUT') {
        col.innerHTML = `
          <button onclick="loadSampleArqueoBatch()" class="touch-softkey bg-amber-100 border-amber-500 text-amber-950">CARGAR LOTE<br>EJEMPLO (155)</button>
          <button onclick="triggerKey('TOTAL_IMPRIMIR')" class="touch-softkey bg-emerald-100 border-emerald-600 text-emerald-950">TOTAL<br>IMPRIMIR</button>
          <button onclick="triggerKey('LIMPIAR')" class="touch-softkey">LIMPIAR<br>LISTA</button>
          <button onclick="setPosState('SALES')" class="touch-softkey">SALIR A<br>VENTAS</button>
          <div class="touch-softkey opacity-40"></div>
          <div class="touch-softkey opacity-40"></div>
          <div class="touch-softkey opacity-40"></div>
          <div class="touch-softkey opacity-40"></div>
        `;
      } else {
        col.innerHTML = `
          <button onclick="promptClientDocument('Boleta')" class="touch-softkey">1. CLIENTE<br>(BOLETA DNI)</button>
          <button onclick="promptClientDocument('Factura')" class="touch-softkey">2. FACTURA<br>(RUC)</button>
          <button onclick="toggleMechanicTariff()" class="touch-softkey ${this.caja.isMechanicPrice ? 'bg-amber-200 border-amber-600' : ''}">TARIFA<br>MECÁNICO</button>
          <button onclick="openReturnMenu()" class="touch-softkey border-rose-500 bg-rose-50 text-rose-900">DEVOLUCIÓN<br>(ID BOLETA)</button>
          <button onclick="saveCurrentCartAsQuote()" class="touch-softkey text-emerald-900">EMITIR<br>COTIZACIÓN A4</button>
          <button onclick="triggerKey('MENU_SUPERVISOR')" class="touch-softkey">MENU<br>SUPERVISOR</button>
          <button onclick="triggerKey('MENU_PRINCIPAL')" class="touch-softkey">MENU<br>PRINCIPAL</button>
          <button onclick="triggerKey('TOTAL_IMPRIMIR')" class="touch-softkey bg-emerald-100 border-emerald-600 text-emerald-950">COBRAR /<br>TOTAL IMPR.</button>
        `;
      }
    };

    win.handleMainEnter = () => {
      const input = document.getElementById('ncr-main-input') as HTMLInputElement;
      const rawVal = input.value.trim();
      const st = this.caja.posScreenState;

      if (st === 'SUP_MENU') {
        if (rawVal) {
          const code = rawVal.padStart(2, '0');
          const foundIdx = this.caja.supOptionsList.findIndex(o => o.code === code || parseInt(o.code, 10) === parseInt(rawVal, 10));
          if (foundIdx !== -1) {
            this.caja.supSelectedIndex = foundIdx;
            win.renderSupMenuList?.();
            win.selectSupervisorOption?.(this.caja.supOptionsList[foundIdx].code);
          } else {
            this.auth.showToast(`Opción "${rawVal}" no válida en el Menú Supervisor`, 'warning');
            win.resetMainInputBar();
          }
        } else if (this.caja.supSelectedIndex >= 0 && this.caja.supSelectedIndex < this.caja.supOptionsList.length) {
          win.selectSupervisorOption?.(this.caja.supOptionsList[this.caja.supSelectedIndex].code);
        } else {
          this.auth.showToast('Seleccione una opción o digite su número en la barra y presione Enter', 'warning');
        }
        return;
      }

      if (st === 'RETURN_MENU') {
        const code = rawVal.padStart(2, '0');
        const foundIdx = this.caja.returnOptionsList.findIndex(o => o.code === code || parseInt(o.code, 10) === parseInt(rawVal, 10));
        const chosen = foundIdx !== -1 ? this.caja.returnOptionsList[foundIdx].code : this.caja.returnOptionsList[this.caja.supSelectedIndex].code;
        win.startReturnOption?.(chosen);
        return;
      }

      if (st === 'RETURN_ASK_TICKET') {
        if (!rawVal) {
          this.auth.showToast('Digita el código identificador único de la boleta (ej. 880001)', 'warning');
          return;
        }
        const foundSale = this.caja.salesHistoryDB.find(s => s.uniqueId === rawVal);
        if (!foundSale) {
          this.auth.showToast(`No se encontró ninguna boleta con el ID único "${rawVal}". Prueba con 880001`, 'warning');
          win.resetMainInputBar();
          return;
        }
        win.loadSaleForReturn?.(foundSale);
        return;
      }

      if (st === 'RETURN_PARTIAL_SCAN') {
        if (!rawVal) {
          this.auth.showToast('Digita el código numérico del producto a devolver y presiona Enter', 'warning');
          return;
        }
        win.addPartialProductByCode?.(rawVal);
        win.resetMainInputBar();
        return;
      }

      if (st === 'AUTH_SUP_CODE') {
        const sup = this.auth.usersDB.find(u => (u.code === rawVal || u.shortCode === rawVal) && ['SUPERVISOR', 'DUENO', 'PROGRAMADOR'].includes(u.role));
        if (!sup) {
          this.auth.showToast('Código de Autorizador inválido. Prueba con 0001', 'warning');
          win.resetMainInputBar();
          return;
        }
        this.caja.tempSupUser = sup;
        win.setPosState('AUTH_SUP_PASS');
        return;
      }

      if (st === 'AUTH_SUP_PASS') {
        if (!this.caja.tempSupUser || rawVal !== this.caja.tempSupUser.pass) {
          this.auth.showToast('Clave de Supervisora incorrecta. Prueba con 1234', 'warning');
          win.resetMainInputBar();
          return;
        }
        win.executeAuthorizedSupOption?.();
        return;
      }

      if (st === 'AUTH_CASHIER_PASS') {
        if (rawVal !== this.auth.currentUser.pass) {
          this.auth.showToast(`Clave de cajero incorrecta. Prueba con ${this.auth.currentUser.pass}`, 'warning');
          win.resetMainInputBar();
          return;
        }
        document.getElementById('drawer-open-banner')?.classList.remove('hidden');
        this.auth.showToast('🔓 Cajón de dinero desbloqueado. Ciérrelo para quitar la alerta.', 'success');
        win.setPosState('SALES');
        return;
      }

      if (st === 'FONDO_FIJO_INPUT') {
        const amount = parseFloat(rawVal);
        if (isNaN(amount) || amount <= 0) {
          this.auth.showToast('Ingresa un monto válido (ej. 150) y presiona Enter', 'warning');
          return;
        }
        this.caja.tempCashEntries = [{ label: 'SOLES', amount }];
        win.resetMainInputBar();
        win.renderCashTable?.();
        this.auth.showToast(`Fondo fijo de S/ ${amount.toFixed(2)} registrado. Presiona TOTAL IMPRIMIR.`, 'success');
        return;
      }

      if (st === 'RETIRO_DNI') {
        if (rawVal.length < 8) {
          this.auth.showToast(`Ingresa los 8 dígitos del DNI del cajero (Ej. ${this.auth.currentUser.dni})`, 'warning');
          return;
        }
        this.caja.tempCashEntries = [];
        win.setPosState('RETIRO_INPUT');
        return;
      }

      if (st === 'RETIRO_INPUT') {
        const amount = parseFloat(rawVal);
        if (isNaN(amount) || amount <= 0) {
          this.auth.showToast('Ingresa un monto a retirar válido', 'warning');
          return;
        }
        if (amount % 10 !== 0) {
          this.auth.showToast(`⚠️ Atención: Ingresaste S/ ${amount.toFixed(2)} (no es redondo de 10 en 10).`, 'warning');
        } else {
          this.auth.showToast(`Retiro de S/ ${amount.toFixed(2)} listo. Presiona TOTAL IMPRIMIR.`, 'success');
        }
        this.caja.tempCashEntries = [{ label: 'SOLES', amount }];
        win.resetMainInputBar();
        win.renderCashTable?.();
        return;
      }

      if (st === 'ARQUEO_INPUT') {
        const amount = parseFloat(rawVal);
        if (isNaN(amount) || amount <= 0) {
          this.auth.showToast('Ingresa un monto de efectivo para sumar al Arqueo o presiona TOTAL IMPRIMIR', 'warning');
          return;
        }
        this.caja.tempCashEntries.push({ label: 'SOLES', amount });
        win.resetMainInputBar();
        document.getElementById('ncr-prompt-title')!.textContent = `Ingrese Arqueo - SOLES ${this.caja.tempCashEntries.length + 1}`;
        win.renderCashTable?.();
        return;
      }

      if (st === 'CLIENT_DOC_INPUT') {
        if (!rawVal) {
          win.setPosState('SALES');
          return;
        }
        const foundClient = this.auth.clientsDirectory[rawVal];
        if (foundClient) {
          this.caja.currentCustomer.doc = rawVal;
          this.caja.currentCustomer.name = foundClient.name;
          this.caja.currentCustomer.docType = foundClient.type;
        } else {
          this.caja.currentCustomer.doc = rawVal;
          this.caja.currentCustomer.name = rawVal.length === 11 ? `EMPRESA RUC ${rawVal} S.A.C.` : `CLIENTE DNI ${rawVal}`;
        }
        this.auth.showToast(`Cliente asignado: ${this.caja.currentCustomer.name}`, 'success');
        win.setPosState('SALES');
        return;
      }

      if (st === 'PAYMENT') {
        win.addPartialOrFullPayment('SOLES');
        return;
      }

      if (!rawVal) return;

      const matchedSale = this.caja.salesHistoryDB.find(s => s.uniqueId === rawVal);
      if (matchedSale) {
        this.caja.returnFlowState.mode = 'COMPLETA';
        win.loadSaleForReturn?.(matchedSale);
        this.auth.showToast(`Boleta ID ${rawVal} identificada para Devolución`, 'info');
        return;
      }

      const product = this.inv.productsDB.find(p => p.barcode === rawVal || String(p.id) === rawVal);
      if (!product) {
        this.auth.showToast(`Código numérico "${rawVal}" no encontrado. Abriendo Catálogo Visual...`, 'warning');
        win.toggleCatalogDrawer?.();
        return;
      }

      win.addProductToPosCart(product.id);
      win.resetMainInputBar();
    };

    win.addProductToPosCart = (productId: number) => {
      const p = this.inv.productsDB.find(prod => prod.id === productId);
      if (!p) return;
      if (p.stock <= 0) {
        this.auth.showToast(`🔴 ${p.name} está AGOTADO. Abriendo equivalentes OEM (${p.oem})...`, 'warning');
        win.filterCatalogByOEM?.(p.oem);
        return;
      }

      const qtyToAdd = this.caja.nextQtyMultiplier;
      this.caja.nextQtyMultiplier = 1;

      const existingIdx = this.caja.currentCart.findIndex(i => i.productId === productId);
      if (existingIdx !== -1) {
        this.caja.currentCart[existingIdx].qty += qtyToAdd;
        this.caja.selectedCartIndex = existingIdx;
      } else {
        this.caja.currentCart.push({
          productId: p.id,
          barcode: p.barcode,
          sku: p.sku,
          name: p.name,
          location: p.location,
          qty: qtyToAdd,
          price: p.price,
          mechanicPrice: p.mechanicPrice || Math.round(p.price * 0.85 * 100) / 100
        });
        this.caja.selectedCartIndex = this.caja.currentCart.length - 1;
      }
      win.renderSalesTable();
    };

    win.selectCartRow = (idx: number) => {
      this.caja.selectedCartIndex = idx === this.caja.selectedCartIndex ? -1 : idx;
      win.renderSalesTable();
    };

    win.renderSalesTable = () => {
      const tbody = document.getElementById('ncr-sales-tbody');
      if (!tbody) return;
      tbody.innerHTML = this.caja.currentCart
        .map((item, idx) => {
          const effPrice = this.caja.getUnitEffectivePrice(item);
          const disc = (item.price - effPrice) * item.qty;
          const lineTotal = effPrice * item.qty;
          const isSelected = idx === this.caja.selectedCartIndex;
          return `
            <tr onclick="selectCartRow(${idx})" class="cursor-pointer transition-all ${isSelected ? 'bg-amber-200/90 border-l-4 border-rose-600 font-bold' : 'hover:bg-blue-50/50'}">
                <td class="py-1.5 px-2.5 font-bold text-slate-800">${isSelected ? '<i class="fa-solid fa-check-circle text-rose-600 mr-1"></i>' : ''}${item.barcode}</td>
                <td class="py-1.5 px-2.5">
                    <span class="font-bold text-slate-900">${item.name}</span>
                    <span class="text-[10px] text-indigo-700 block">${item.sku} • ${item.location} ${isSelected ? '• [SELECCIONADO PARA BORRAR ITEM]' : ''}</span>
                </td>
                <td class="py-1.5 px-2 text-center font-bold">${item.qty}</td>
                <td class="py-1.5 px-2 text-right">S/ ${item.price.toFixed(2)}</td>
                <td class="py-1.5 px-2 text-right text-emerald-700">S/ ${disc.toFixed(2)}</td>
                <td class="py-1.5 px-2.5 text-right font-extrabold text-slate-950">S/ ${lineTotal.toFixed(2)}</td>
            </tr>
          `;
        })
        .join('');

      const partialBox = document.getElementById('ncr-partial-payments-box')!;
      const partialList = document.getElementById('ncr-partial-payments-list')!;
      const partialSummary = document.getElementById('partial-paid-summary')!;

      if (this.caja.posScreenState === 'PAYMENT' || this.caja.currentPaymentBlocks.length > 0) {
        partialBox.classList.remove('hidden');
        partialSummary.textContent = `Total Abonado: S/ ${this.caja.getTotalPaidInBlocks().toFixed(2)}`;
        partialList.innerHTML = this.caja.currentPaymentBlocks.length === 0
          ? `<p class="text-[11px] text-slate-500 italic">Sin abonos aún. Ingresa un monto en la barra + Enter (ej. 100) o selecciona un medio de pago.</p>`
          : this.caja.currentPaymentBlocks.map((b, i) => `<div class="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-emerald-200"><span class="font-bold text-slate-800">Pago #${i + 1}: ${b.label}</span><span class="font-black text-emerald-800">S/ ${b.amount.toFixed(2)}</span></div>`).join('');
      } else {
        partialBox.classList.add('hidden');
      }

      document.getElementById('sum-items-count')!.textContent = String(this.caja.currentCart.reduce((s, i) => s + i.qty, 0));
      document.getElementById('sum-customer-name')!.textContent = this.caja.currentCustomer.name;
      document.getElementById('sum-customer-doc')!.textContent = this.caja.currentCustomer.doc;
      document.getElementById('sum-doc-type')!.textContent = this.caja.currentCustomer.docType;
      document.getElementById('sum-subtotal')!.textContent = `S/ ${this.caja.getCartTotal().toFixed(2)}`;
      document.getElementById('sum-savings')!.textContent = `S/ ${this.caja.getCartSavings().toFixed(2)}`;
      document.getElementById('sum-change')!.textContent = `S/ ${this.caja.getCalculatedChange().toFixed(2)}`;
      document.getElementById('sum-total-pay')!.textContent = `S/ ${this.caja.getRemainingToPay().toFixed(2)}`;
    };

    win.clearCurrentPaymentBlocks = () => {
      this.caja.currentPaymentBlocks = [];
      win.resetMainInputBar();
      win.renderSalesTable();
      document.getElementById('ncr-prompt-title')!.textContent = `Ingrese monto a cobrar (Por pagar: S/ ${this.caja.getRemainingToPay().toFixed(2)})`;
      this.auth.showToast('Pagos parciales reiniciados.', 'info');
    };

    win.addPartialOrFullPayment = (methodKey: string, customLabel: string | null = null) => {
      const remaining = this.caja.getRemainingToPay();
      if (remaining <= 0.009) {
        this.auth.showToast('La cuenta ya está cubierta. Presiona TOTAL IMPRIMIR.', 'info');
        return;
      }

      const typedVal = parseFloat((document.getElementById('ncr-main-input') as HTMLInputElement).value) || 0;
      let amountToRecord = typedVal;

      if (methodKey === 'SOLES') {
        if (amountToRecord <= 0) {
          this.auth.showToast('Digita en la barra el monto de efectivo entregado (ej. 100) y presiona Enter', 'warning');
          return;
        }
      } else if (amountToRecord <= 0 || amountToRecord > remaining) {
        amountToRecord = remaining;
      }

      const blockNum = this.caja.currentPaymentBlocks.filter(b => b.method === methodKey).length + 1;
      const displayLabel = customLabel || (methodKey === 'SOLES' ? `EFECTIVO SOLES (Bloque ${blockNum})` : methodKey);

      this.caja.currentPaymentBlocks.push({ method: methodKey, label: displayLabel, amount: amountToRecord });
      win.resetMainInputBar();
      win.renderSalesTable();

      const newRemaining = this.caja.getRemainingToPay();
      const change = this.caja.getCalculatedChange();

      if (newRemaining > 0.009) {
        document.getElementById('ncr-prompt-title')!.textContent = `Abonado S/ ${amountToRecord.toFixed(2)} (${displayLabel}) • RESTA POR PAGAR: S/ ${newRemaining.toFixed(2)}`;
        this.auth.showToast(`Se restaron S/ ${amountToRecord.toFixed(2)}. Queda por cobrar: S/ ${newRemaining.toFixed(2)}`, 'info');
      } else {
        document.getElementById('ncr-prompt-title')!.textContent = change > 0
          ? `✅ Cuenta cubierta • ENTREGAR VUELTO AL CLIENTE: S/ ${change.toFixed(2)} • Presione TOTAL IMPRIMIR`
          : `✅ Cuenta exacta cubierta (Por pagar: S/ 0.00) • Presione TOTAL IMPRIMIR`;
        this.auth.showToast(
          change > 0
            ? `Cuenta completada. Vuelto para el cliente: S/ ${change.toFixed(2)}. Presiona TOTAL IMPRIMIR.`
            : `Cuenta completada (S/ 0.00 por pagar). Presiona TOTAL IMPRIMIR para emitir la boleta.`,
          'success'
        );
      }
    };

    win.promptClientDocument = (docType: string) => {
      this.caja.currentCustomer.docType = docType;
      win.setPosState('CLIENT_DOC_INPUT');
    };

    win.toggleMechanicTariff = () => {
      this.caja.isMechanicPrice = !this.caja.isMechanicPrice;
      document.getElementById('ncr-price-mode-indicator')!.textContent = this.caja.isMechanicPrice ? 'TARIFA: MECÁNICO (-15%)' : 'TARIFA: PÚBLICO';
      win.renderSalesTable();
      win.renderSoftkeysColumn();
      this.auth.showToast(this.caja.isMechanicPrice ? '🔧 Tarifa Mecánico (-15%) activada' : 'Tarifa Público estándar activada', 'info');
    };

    win.handleTotalImprimir = () => {
      const st = this.caja.posScreenState;
      if (st === 'FONDO_FIJO_INPUT') {
        const inputVal = parseFloat((document.getElementById('ncr-main-input') as HTMLInputElement).value);
        if (this.caja.tempCashEntries.length === 0 && inputVal > 0) {
          this.caja.tempCashEntries.push({ label: 'SOLES', amount: inputVal });
        }
        if (this.caja.tempCashEntries.length === 0) {
          this.auth.showToast('Primero ingresa el monto del fondo fijo (150) y presiona Enter', 'warning');
          return;
        }
        const fundAmount = this.caja.tempCashEntries.reduce((s, i) => s + i.amount, 0);
        this.caja.shiftState.fixedFund += fundAmount;
        win.updateHeaderStatus?.();
        win.showFondoFijoVoucher?.(fundAmount);
        return;
      }

      if (st === 'RETIRO_INPUT') {
        if (this.caja.tempCashEntries.length === 0) {
          this.auth.showToast('Primero ingresa el monto redondo a retirar (ej. 250) y presiona Enter', 'warning');
          return;
        }
        const withdrawAmount = this.caja.tempCashEntries.reduce((s, i) => s + i.amount, 0);
        this.caja.shiftState.withdrawalsTotal += withdrawAmount;
        this.caja.shiftState.withdrawalsCount += 1;
        win.updateHeaderStatus?.();
        win.showRetiroVoucher?.(withdrawAmount);
        return;
      }

      if (st === 'ARQUEO_INPUT') {
        if (this.caja.tempCashEntries.length === 0) {
          this.auth.showToast('Ingresa al menos un monto de efectivo en el Arqueo antes de imprimir', 'warning');
          return;
        }
        this.caja.shiftState.arqueoLines = [...this.caja.tempCashEntries];
        this.caja.shiftState.arqueoTotal = this.caja.tempCashEntries.reduce((s, i) => s + i.amount, 0);
        win.showArqueoVoucher?.();
        return;
      }

      if (st === 'RETURN_COMPLETE_VIEW' || st === 'RETURN_PARTIAL_SCAN') {
        win.processReturnVoucherEmission?.();
        return;
      }

      if (st === 'SALES' || st === 'MAIN_MENU') {
        if (this.caja.currentCart.length === 0) {
          this.auth.showToast('Pasa al menos un producto por el lector antes de presionar TOTAL IMPRIMIR', 'warning');
          return;
        }
        this.caja.currentPaymentBlocks = [];
        win.setPosState('PAYMENT');
        return;
      }

      if (st === 'PAYMENT') {
        const remaining = this.caja.getRemainingToPay();
        const inputVal = parseFloat((document.getElementById('ncr-main-input') as HTMLInputElement).value) || 0;
        if (remaining > 0.009 && inputVal > 0) {
          win.addPartialOrFullPayment('SOLES');
        }
        if (this.caja.getRemainingToPay() > 0.009) {
          this.auth.showToast(`Aún resta cobrar S/ ${this.caja.getRemainingToPay().toFixed(2)}.`, 'warning');
          return;
        }
        this.finalizeSaleVoucherFromPaymentBlocks();
      }
    };

    setTimeout(() => {
      win.updateHeaderStatus?.();
      win.updateNotificationBadges?.();
      win.renderSoftkeysColumn();
      win.renderSalesTable();
    }, 0);
  }

  private finalizeSaleVoucherFromPaymentBlocks(): void {
    const win = window as any;
    const total = this.caja.getCartTotal();
    const totalPaid = this.caja.getTotalPaidInBlocks();
    const vuelto = this.caja.getCalculatedChange();
    const st = this.caja.shiftState;

    let cashReceived = 0;
    this.caja.currentPaymentBlocks.forEach(b => {
      if (b.method === 'SOLES') cashReceived += b.amount;
      else if (b.method === 'QR SIP') {
        st.qrSipTotal += b.amount;
        st.qrSipCount += 1;
      } else if (b.method === 'DEBITO SIP') {
        st.debitSipTotal += b.amount;
        st.debitSipCount += 1;
      } else {
        st.cardBancTotal += b.amount;
        st.cardBancCount += 1;
      }
    });

    if (cashReceived > 0) {
      st.cashSalesTotal += Math.max(0, cashReceived - vuelto);
      st.cashSalesCount += 1;
    }

    this.caja.currentCart.forEach(item => {
      const p = this.inv.productsDB.find(prod => prod.id === item.productId);
      if (p) p.stock = Math.max(0, p.stock - item.qty);
    });

    const savings = this.caja.getCartSavings();
    if (savings > 0) {
      st.discountTotal += savings;
      st.discountCount += 1;
    }

    st.ticketsCount += 1;
    const cfg = this.auth.systemConfig;
    const usr = this.auth.currentUser;
    cfg.currentTranNumber += 1;
    win.updateHeaderStatus?.();

    const uniqueSaleId = String(this.caja.nextUniqueSaleId++);
    const opGravada = total / 1.18;
    const igv = total - opGravada;
    const totalUnits = this.caja.currentCart.reduce((s, i) => s + i.qty, 0);
    const nowStr = this.auth.getFormattedDateTime();

    const itemsLinesHtml = this.caja.currentCart
      .map(item => `<div class="flex justify-between"><span class="truncate max-w-[190px]">${item.barcode} ${item.qty}x ${item.name}</span><span>${(this.caja.getUnitEffectivePrice(item) * item.qty).toFixed(2)}</span></div>`)
      .join('');

    const paymentLinesHtml = this.caja.currentPaymentBlocks
      .map(b => `<div class="flex justify-between"><span>${b.label}</span><span>${b.amount.toFixed(2)}</span></div>`)
      .join('');

    const isFactura = this.caja.currentCustomer.docType === 'Factura';
    const docTitle = isFactura ? 'FACTURA DE VENTA ELECTRONICA' : 'BOLETA DE VENTA ELECTRONICA';
    const docSerie = isFactura ? `FJ83-01178${st.ticketsCount}` : `BJ83-01178${st.ticketsCount}`;

    const html = `
      <div class="text-center space-y-0.5 mb-2">
          <p class="font-bold">${cfg.companyName}</p>
          <p>RUC ${cfg.ruc}</p>
          <p>${cfg.address}</p>
          <p>${cfg.district}</p>
          <p class="font-bold pt-1">${docTitle}</p>
          <p class="font-bold">${docSerie}</p>
          <p class="font-bold text-indigo-800 bg-indigo-50 py-0.5 rounded border border-indigo-200 mt-1">ID ÚNICO BOLETA: ${uniqueSaleId}</p>
      </div>
      <div class="space-y-0.5 mb-2">
          <p>CAJERO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${parseInt(usr.code, 10)}</p>
          ${this.caja.currentCustomer.doc !== '0' ? `<p>CLIENTE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${this.caja.currentCustomer.name} (${this.caja.currentCustomer.doc})</p>` : ''}
          ${itemsLinesHtml}
          <div class="flex justify-between pt-1">
              <span>SUBTOTAL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span>
              <span>${total.toFixed(2)}</span>
          </div>
          <p>${totalUnits} UNIDAD(ES)</p>
      </div>
      <div class="space-y-0.5 border-t border-dashed border-slate-400 pt-1.5 mb-2">
          <div class="flex justify-between"><span>OP. EXONERADA</span><span>0.00</span></div>
          <div class="flex justify-between"><span>OP. INAFECTA</span><span>0.00</span></div>
          <div class="flex justify-between"><span>OP. GRAVADA</span><span>${opGravada.toFixed(2)}</span></div>
          <div class="flex justify-between"><span>I.G.V. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${igv.toFixed(2)}</span></div>
          <div class="flex justify-between font-bold"><span>TOTAL A PAGAR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${total.toFixed(2)}</span></div>
          <div class="border-t border-dotted border-slate-300 my-1 pt-1 space-y-0.5">
              ${paymentLinesHtml}
          </div>
          <div class="flex justify-between font-bold"><span>TOTAL RECIBIDO &nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${totalPaid.toFixed(2)}</span></div>
          <div class="flex justify-between font-bold text-emerald-800"><span>VUELTO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${vuelto.toFixed(2)}</span></div>
      </div>
      <div class="text-center my-2 pt-1 border-t border-dashed border-slate-400">
          <svg class="w-20 h-20 mx-auto text-slate-900" viewBox="0 0 100 100" fill="currentColor">
              <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V70zM20 75h5v5h-5zM45 15h10v15H45zM40 40h20v20H40zM70 45h15v10H70zM45 70h15v20H45zM70 70h20v20H70z"/>
          </svg>
          <p class="font-bold text-xs tracking-widest mt-1">ID QR COMPRA: ${uniqueSaleId}</p>
          <p class="text-[9px] text-slate-600 mt-0.5 leading-tight">
              Para devoluciones parciales o completas digite el código único <strong>${uniqueSaleId}</strong> en la barra principal.
          </p>
      </div>
      <div class="text-[10px] flex justify-between pt-2 mt-1 border-t border-slate-200">
          <span>${cfg.currentTranNumber} ${cfg.localCode}/${cfg.cajaCode}/${usr.shortCode}</span>
          <span>${nowStr} AC-00</span>
      </div>
    `;

    this.caja.salesHistoryDB.unshift({
      uniqueId: uniqueSaleId,
      serie: docSerie,
      docType: this.caja.currentCustomer.docType,
      date: nowStr,
      cashierCode: usr.code,
      cashierName: usr.name,
      customerDoc: this.caja.currentCustomer.doc !== '0' ? this.caja.currentCustomer.doc : 'SIN DOC',
      customerName: this.caja.currentCustomer.name !== '--' ? this.caja.currentCustomer.name : 'CLIENTE MOSTRADOR',
      items: this.caja.currentCart.map(i => ({ productId: i.productId, barcode: i.barcode, sku: i.sku, name: i.name, qty: i.qty, returnedQty: 0, price: this.caja.getUnitEffectivePrice(i) })),
      payments: this.caja.currentPaymentBlocks.map(b => ({ method: b.method, label: b.label, amount: b.amount })),
      total,
      change: vuelto,
      status: 'COMPLETADA',
      voucherHtml: html
    });

    this.caja.currentCart = [];
    this.caja.selectedCartIndex = -1;
    this.caja.currentPaymentBlocks = [];
    this.caja.currentCustomer = { doc: '0', name: '--', docType: 'Boleta', plate: '' };
    win.openVoucherModal(`${docTitle} Digital (ID Único: ${uniqueSaleId})`, html, 'RETURN_SALES');
  }
}
