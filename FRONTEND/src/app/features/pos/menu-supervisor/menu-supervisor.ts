import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { TicketsSoporte } from '../../../core/services/tickets-soporte';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-menu-supervisor',
  styleUrl: './menu-supervisor.css',
  templateUrl: './menu-supervisor.html',
})
export class MenuSupervisor implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);
  private tickets = inject(TicketsSoporte);

  ngAfterViewInit(): void {
    const win = window as any;

    win.renderSupMenuList = () => {
      const container = document.getElementById('sup-menu-list');
      if (!container) return;
      container.innerHTML = this.caja.supOptionsList
        .map((opt, idx) => {
          const isSelected = idx === this.caja.supSelectedIndex;
          return `
            <div onclick="highlightSupMenuOption(${idx})"
                 ondblclick="selectSupervisorOption('${opt.code}')"
                 class="px-4 py-2 text-xs font-mono-code font-bold cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-[#7c839e] text-white ring-2 ring-amber-400' : 'text-slate-800 hover:bg-slate-100'}">
                <span>${opt.label}</span>
                ${isSelected ? `<button onclick="event.stopPropagation(); selectSupervisorOption('${opt.code}')" class="text-[10px] uppercase bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded shadow">Ingresar (Enter ↵)</button>` : ''}
            </div>
          `;
        })
        .join('');
    };

    win.highlightSupMenuOption = (idx: number) => {
      this.caja.supSelectedIndex = idx;
      (document.getElementById('ncr-main-input') as HTMLInputElement).value = this.caja.supOptionsList[idx].code;
      win.renderSupMenuList();
      document.getElementById('ncr-main-input')?.focus();
    };

    win.moveSupCursor = (delta: number) => {
      if (this.caja.posScreenState === 'SUP_MENU') {
        if (this.caja.supSelectedIndex === -1) {
          this.caja.supSelectedIndex = delta > 0 ? 0 : this.caja.supOptionsList.length - 1;
        } else {
          this.caja.supSelectedIndex = (this.caja.supSelectedIndex + delta + this.caja.supOptionsList.length) % this.caja.supOptionsList.length;
        }
        (document.getElementById('ncr-main-input') as HTMLInputElement).value = this.caja.supOptionsList[this.caja.supSelectedIndex].code;
        win.renderSupMenuList();
      } else if (this.caja.posScreenState === 'RETURN_MENU') {
        this.caja.supSelectedIndex = (this.caja.supSelectedIndex + delta + this.caja.returnOptionsList.length) % this.caja.returnOptionsList.length;
        (document.getElementById('ncr-main-input') as HTMLInputElement).value = this.caja.returnOptionsList[this.caja.supSelectedIndex].code;
        win.renderReturnMenuList?.();
      }
    };

    win.selectSupervisorOption = (optionCode: string) => {
      this.caja.pendingSupOption = optionCode;
      if (optionCode === '11') {
        win.setPosState?.('RETIRO_DNI');
        return;
      }
      win.setPosState?.('AUTH_SUP_CODE');
    };

    win.executeAuthorizedSupOption = () => {
      const op = this.caja.pendingSupOption;
      if (op === '03') win.setPosState?.('AUTH_CASHIER_PASS');
      else if (op === '10') {
        this.caja.tempCashEntries = [];
        win.setPosState?.('FONDO_FIJO_INPUT');
      } else if (op === '21') win.generateCashierReportVoucher(false);
      else if (op === '09') {
        this.caja.tempCashEntries = [];
        win.setPosState?.('ARQUEO_INPUT');
      } else if (op === '19') win.generateCashierReportVoucher(true);
      else if (op === '76') {
        const newPass = prompt('Ingrese nueva clave de 4 dígitos para el cajero actual:', this.auth.currentUser.pass);
        if (newPass && newPass.trim().length >= 4) {
          this.auth.currentUser.pass = newPass.trim();
          this.auth.showToast('Clave de cajero actualizada correctamente', 'success');
        }
        win.setPosState?.('SALES');
      }
    };

    win.renderCashTable = () => {
      const tbody = document.getElementById('ncr-cash-tbody')!;
      const totalEl = document.getElementById('ncr-cash-total')!;
      const sum = this.caja.tempCashEntries.reduce((acc, item) => acc + item.amount, 0);
      tbody.innerHTML = this.caja.tempCashEntries
        .map(item => `<tr><td class="py-2 px-4 font-bold text-slate-800">${item.label}</td><td class="py-2 px-4 text-right font-bold text-slate-900">S/ ${item.amount.toFixed(2)}</td></tr>`)
        .join('');
      totalEl.textContent = `S/ ${sum.toFixed(2)}`;
    };

    win.loadSampleArqueoBatch = () => {
      this.caja.tempCashEntries = [
        { label: 'SOLES', amount: 25.0 },
        { label: 'SOLES', amount: 16.0 },
        { label: 'SOLES', amount: 64.0 },
        { label: 'SOLES', amount: 38.5 },
        { label: 'SOLES', amount: 6.8 },
        { label: 'SOLES', amount: 2.5 },
        { label: 'SOLES', amount: 2.2 }
      ];
      win.renderCashTable();
      this.auth.showToast('Se cargaron los 7 montos de ejemplo (Total S/ 155.00). Presiona TOTAL IMPRIMIR.', 'info');
    };

    win.showFondoFijoVoucher = (amount: number) => {
      const cfg = this.auth.systemConfig;
      const usr = this.auth.currentUser;
      cfg.currentTranNumber++;
      const voucherCode = `FF-${cfg.currentTranNumber}`;
      const nowStr = this.auth.getFormattedDateTime();

      this.tickets.fixedFundRecordsDB.unshift({
        voucherCode,
        cashierCode: usr.code,
        cashierName: usr.name,
        amount,
        date: nowStr,
        status: 'ACTIVO',
        note: amount > 150 ? 'Fondo fijo superior al estándar' : 'Fondo fijo registrado en caja'
      });

      const html = `
        <div class="text-center space-y-0.5 mb-2">
            <p class="font-bold">${cfg.companyName}</p>
            <p>RUC ${cfg.ruc}</p>
            <p>${cfg.address}</p>
            <p>${cfg.district}</p>
        </div>
        <div class="space-y-0.5 mb-2">
            <p class="font-bold">FONDO FIJO</p>
            <p class="font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-center">CÓDIGO BAUCHER: ${voucherCode}</p>
            <div class="flex justify-between pt-1">
                <span>CAJERO</span>
                <span>${usr.shortCode} &nbsp; ${usr.name}</span>
            </div>
        </div>
        <div class="py-1.5 space-y-0.5">
            <div class="flex justify-between"><span>SOLES</span><span>1</span><span>${amount.toFixed(2)}</span></div>
        </div>
        <div class="pt-1.5 space-y-0.5 border-t border-dashed border-slate-400">
            <div class="flex justify-between"><span>SOLES</span><span>${amount.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold"><span>T O T A L</span><span>${amount.toFixed(2)}</span></div>
        </div>
        <div class="text-[10px] flex justify-between pt-2 mt-2 border-t border-slate-200">
            <span>${cfg.currentTranNumber} ${cfg.localCode}/${cfg.cajaCode}/${usr.shortCode}</span>
            <span>${nowStr} AC-10</span>
        </div>
      `;
      win.openVoucherModal(`Baucher de Fondo Fijo (${voucherCode})`, html, 'RETURN_SALES');
    };

    win.showRetiroVoucher = (amount: number) => {
      const cfg = this.auth.systemConfig;
      const usr = this.auth.currentUser;
      cfg.currentTranNumber++;
      const voucherCode = `RET-${cfg.currentTranNumber}`;
      const nowStr = this.auth.getFormattedDateTime();

      this.tickets.withdrawalRecordsDB.unshift({
        voucherCode,
        cashierCode: usr.code,
        cashierName: usr.name,
        cashierDni: usr.dni,
        amount,
        date: nowStr,
        status: 'ACTIVO',
        note: amount % 10 !== 0 ? 'Retiro con monto no redondo' : 'Retiro estándar'
      });

      const html = `
        <div class="text-center space-y-0.5 mb-2">
            <p class="font-bold">${cfg.companyName}</p>
            <p>RUC ${cfg.ruc}</p>
            <p>${cfg.address}</p>
            <p>${cfg.district}</p>
        </div>
        <div class="space-y-0.5 mb-2">
            <p class="font-bold">RETIRO</p>
            <p class="font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-center">CÓDIGO ÚNICO BAUCHER: ${voucherCode}</p>
            <div class="flex justify-between pt-1">
                <span>CAJERO</span>
                <span>${usr.shortCode} &nbsp; ${usr.name}</span>
            </div>
        </div>
        <div class="py-1.5 space-y-0.5">
            <div class="flex justify-between"><span>SOLES</span><span>1</span><span>${amount.toFixed(2)}</span></div>
        </div>
        <div class="pt-1.5 space-y-0.5 border-t border-dashed border-slate-400 mb-2">
            <div class="flex justify-between"><span>SOLES</span><span>${amount.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold"><span>T O T A L</span><span>${amount.toFixed(2)}</span></div>
        </div>
        <div class="text-center my-2">
            <div class="h-10 bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_2px,transparent_2px,transparent_4px)] w-full"></div>
            <p class="text-[9px] tracking-widest mt-0.5">${voucherCode}-18880022010265669</p>
        </div>
        <div class="text-[10px] space-y-0.5 pt-1 border-t border-slate-200">
            <div class="flex justify-between">
                <span>${cfg.currentTranNumber} ${cfg.localCode}/${cfg.cajaCode}/${usr.shortCode}</span>
                <span>${nowStr} AC-11</span>
            </div>
            <p class="font-bold">DNI: ${usr.dni}</p>
        </div>
      `;
      win.openVoucherModal(`Baucher de Retiro de Caja (${voucherCode})`, html, 'RETURN_SALES');
    };

    win.showArqueoVoucher = () => {
      const cfg = this.auth.systemConfig;
      const usr = this.auth.currentUser;
      const st = this.caja.shiftState;
      cfg.currentTranNumber++;
      const nowStr = this.auth.getFormattedDateTime();
      const linesHtml = st.arqueoLines
        .map(l => `<div class="flex justify-between"><span>SOLES</span><span>1</span><span>${l.amount.toFixed(2)}</span></div>`)
        .join('');

      const html = `
        <div class="text-center space-y-0.5 mb-2">
            <p class="font-bold">${cfg.companyName}</p>
            <p>RUC ${cfg.ruc}</p>
            <p>${cfg.address}</p>
            <p>${cfg.district}</p>
        </div>
        <div class="space-y-0.5 mb-2">
            <p class="font-bold">ARQUEO DE CAJA</p>
            <div class="flex justify-between"><span>CAJERO</span><span>${usr.shortCode} &nbsp; ${usr.name}</span></div>
        </div>
        <div class="py-1.5 space-y-0.5">${linesHtml}</div>
        <div class="pt-1.5 space-y-0.5 border-t border-dashed border-slate-400 mb-2">
            <div class="flex justify-between"><span>SOLES</span><span>${st.arqueoTotal.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold"><span>T O T A L</span><span>${st.arqueoTotal.toFixed(2)}</span></div>
        </div>
        <div class="text-[10px] flex justify-between py-1 border-t border-slate-200">
            <span>${cfg.currentTranNumber} ${cfg.localCode}/${cfg.cajaCode}/${usr.shortCode}</span>
            <span>${nowStr} AC-09</span>
        </div>
        <div class="text-[10px] leading-tight space-y-1 pt-1 text-justify">
            <p>Yo, __________________________, identificado(a) con DNI N.° ____________, autorizo a ${cfg.companyName} a descontar de mis remuneraciones el monto de S/ _________ correspondiente al faltante generado por mi persona. En caso de cese, autorizo el descuento del saldo pendiente de mi liquidacion de beneficios sociales y/o CTS, comprometiendome a cubrir cualquier diferencia.</p>
            <p class="pt-3">Firma y huella: ______________________</p>
        </div>
      `;
      win.openVoucherModal('Baucher de Arqueo de Caja (AC-09)', html, 'RETURN_SALES');
    };

    win.generateCashierReportVoucher = (isFinalClosing: boolean) => {
      const cfg = this.auth.systemConfig;
      const usr = this.auth.currentUser;
      const st = this.caja.shiftState;
      cfg.currentTranNumber++;
      const nowStr = this.auth.getFormattedDateTime();
      const netSales = st.cashSalesTotal + st.qrSipTotal + st.cardBancTotal + st.debitSipTotal;
      const grossSales = netSales + st.discountTotal;
      const totalDigital = st.qrSipTotal + st.cardBancTotal + st.debitSipTotal;
      const expectedCash = st.cashSalesTotal + st.fixedFund - st.cashRefundsTotal;
      const declaredCash = st.withdrawalsTotal + st.arqueoTotal;
      const cashDifference = isFinalClosing ? declaredCash - expectedCash : -expectedCash;

      let diffNoteHtml = '';
      if (isFinalClosing) {
        if (Math.abs(cashDifference) < 0.01) {
          diffNoteHtml = `<div class="bg-emerald-100 text-emerald-900 p-1.5 rounded text-center font-bold text-[10px] my-1">✅ CUADRE PERFECTO (DIFERENCIA 0.00)</div>`;
        } else if (cashDifference > 0) {
          diffNoteHtml = `<div class="bg-blue-100 text-blue-900 p-1.5 rounded text-center font-bold text-[10px] my-1">ℹ️ SOBRANTE EN CAJA: +S/ ${cashDifference.toFixed(2)}</div>`;
        } else {
          diffNoteHtml = `<div class="bg-rose-100 text-rose-900 p-1.5 rounded text-center font-bold text-[10px] my-1">⚠️ FALTANTE EN CAJA (DESCUENTO): S/ ${cashDifference.toFixed(2)}</div>`;
        }
      }

      const html = `
        <div class="text-center space-y-0.5 mb-2">
            <p class="font-bold">${cfg.companyName}</p>
            <p>RUC ${cfg.ruc}</p>
            <p>${cfg.address}</p>
            <p>${cfg.district}</p>
        </div>
        <div class="space-y-0.5 mb-1">
            <p class="font-bold">${isFinalClosing ? 'CIERRE DE CAJERO' : 'REPORTE DE CAJEROS'}</p>
            <div class="flex justify-between"><span>CAJERO</span><span>${usr.shortCode} &nbsp; ${usr.name}</span></div>
            ${!isFinalClosing ? `<div class="flex justify-between"><span>CAJA</span><span>002</span></div>` : ''}
        </div>
        <p class="tracking-tighter">****TOT.DIARIOS ************************</p>
        <div class="space-y-0.5 mb-1">
            <div class="flex justify-between"><span>TOTAL BRUTO</span><span>${st.ticketsCount}</span><span>${grossSales.toFixed(2)}</span></div>
            <div class="flex justify-between"><span>DESC. PROMO</span><span>${st.discountCount}</span><span>-${st.discountTotal.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold"><span>VENTA NETA</span><span></span><span>${netSales.toFixed(2)}</span></div>
        </div>
        <p class="tracking-tighter">****MEDIOS PAGO ************************</p>
        <div class="space-y-0.5 mb-1">
            <div class="flex justify-between"><span>SOLES (VENTAS)</span><span>${st.cashSalesCount}</span><span>${st.cashSalesTotal.toFixed(2)}</span></div>
            <div class="flex justify-between"><span>FONDO FIJO</span><span>${st.fixedFund > 0 ? 1 : 0}</span><span>${st.fixedFund.toFixed(2)}</span></div>
            ${st.cashRefundsTotal > 0 ? `<div class="flex justify-between text-rose-700"><span>DEVOL. EFECTIVO</span><span>${st.cashRefundsCount}</span><span>-${st.cashRefundsTotal.toFixed(2)}</span></div>` : ''}
            ${isFinalClosing ? `
                <div class="flex justify-between"><span>RETIRO</span><span>${st.withdrawalsCount}</span><span>${st.withdrawalsTotal.toFixed(2)}</span></div>
                <div class="flex justify-between"><span>ARQUEO</span><span>${st.arqueoLines.length > 0 ? 1 : 0}</span><span>${st.arqueoTotal.toFixed(2)}</span></div>
            ` : ''}
            <div class="border-t border-dashed border-slate-500 pt-0.5 flex justify-between font-bold">
                <span>DIFERENCIA</span><span>${cashDifference.toFixed(2)}</span>
            </div>
        </div>
        ${diffNoteHtml}
        <p class="tracking-tighter mt-1">****TARJETAS / DIGITALES ***************</p>
        <div class="space-y-0.5 mb-1">
            <div class="flex justify-between"><span>QR SIP / YAPE / PLIN</span><span>${st.qrSipCount}</span><span>${st.qrSipTotal.toFixed(2)}</span></div>
            <div class="flex justify-between"><span>TARJ BANC</span><span>${st.cardBancCount}</span><span>${st.cardBancTotal.toFixed(2)}</span></div>
            <div class="flex justify-between"><span>DEBITO SIP</span><span>${st.debitSipCount}</span><span>${st.debitSipTotal.toFixed(2)}</span></div>
        </div>
        <div class="border-t border-dashed border-slate-500 pt-0.5 flex justify-between">
            <span>TOTAL DIGITAL</span><span>-${totalDigital.toFixed(2)}</span>
        </div>
        ${isFinalClosing ? `<p class="font-bold mt-2">DESLOGUEO</p>` : ''}
        <div class="text-[10px] flex justify-between pt-2 mt-1 border-t border-slate-200">
            <span>${cfg.currentTranNumber} ${cfg.localCode}/${cfg.cajaCode}/${usr.shortCode}</span>
            <span>${nowStr} ${isFinalClosing ? 'AC-19' : 'AC-21'}</span>
        </div>
      `;

      win.openVoucherModal(
        isFinalClosing ? 'Cierre Total de Caja del Cajero (AC-19)' : 'Reporte de Cajeros en Turno (AC-21)',
        html,
        isFinalClosing ? 'LOGOUT_SHIFT' : 'RETURN_SALES'
      );
    };
  }
}
