import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { Inventario } from '../../../core/services/inventario';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-devoluciones',
  styleUrl: './devoluciones.css',
  templateUrl: './devoluciones.html',
})
export class Devoluciones implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    const win = window as any;

    win.openReturnMenu = () => {
      this.caja.supSelectedIndex = 0;
      win.setPosState?.('RETURN_MENU');
    };

    win.renderReturnMenuList = () => {
      const container = document.getElementById('sup-menu-list');
      if (!container) return;
      container.innerHTML = this.caja.returnOptionsList
        .map((opt, idx) => {
          const isSelected = idx === this.caja.supSelectedIndex;
          return `
            <div onclick="startReturnOption('${opt.code}')"
                 class="px-4 py-3 text-xs font-mono-code font-bold cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-rose-800 text-white' : 'text-slate-800 hover:bg-rose-50'}">
                <span>${opt.label}</span>
                ${isSelected ? '<span class="text-[10px] uppercase bg-black/25 px-2 py-0.5 rounded">Enter ↵</span>' : ''}
            </div>
          `;
        })
        .join('');
    };

    win.startReturnOption = (optionCode: string) => {
      this.caja.returnFlowState.mode = optionCode === '01' ? 'COMPLETA' : 'PARCIAL';
      this.caja.returnFlowState.targetSale = null;
      this.caja.returnFlowState.itemsToReturn = [];
      win.setPosState?.('RETURN_ASK_TICKET');
    };

    win.quickFillDemoReturnTicket = () => {
      if (this.caja.posScreenState !== 'RETURN_ASK_TICKET') {
        this.caja.returnFlowState.mode = 'COMPLETA';
        win.setPosState?.('RETURN_ASK_TICKET');
      }
      const newestSaleId = this.caja.salesHistoryDB[0]?.uniqueId || '880001';
      (document.getElementById('ncr-main-input') as HTMLInputElement).value = newestSaleId;
      win.syncAuthMirror?.();
      win.handleMainEnter?.();
    };

    win.loadSaleForReturn = (saleObj: any) => {
      const rf = this.caja.returnFlowState;
      rf.targetSale = saleObj;
      const paidWithCashOnly = saleObj.payments.every((p: any) => p.method === 'SOLES');
      rf.refundChannel = paidWithCashOnly ? 'EFECTIVO_CAJON' : 'DIGITAL_EXTORNO';

      rf.itemsToReturn = saleObj.items
        .map((item: any) => ({
          productId: item.productId,
          barcode: item.barcode,
          sku: item.sku,
          name: item.name,
          boughtQty: item.qty - (item.returnedQty || 0),
          returnQty: rf.mode === 'COMPLETA' ? Math.max(0, item.qty - (item.returnedQty || 0)) : 0,
          price: item.price
        }))
        .filter((i: any) => i.boughtQty > 0);

      if (rf.itemsToReturn.length === 0) {
        this.auth.showToast('Esta boleta ya fue devuelta en su totalidad.', 'warning');
        win.setPosState?.('SALES');
        return;
      }

      win.setPosState?.(rf.mode === 'COMPLETA' ? 'RETURN_COMPLETE_VIEW' : 'RETURN_PARTIAL_SCAN');
    };

    win.addPartialProductByCode = (code: string) => {
      const rf = this.caja.returnFlowState;
      const item = rf.itemsToReturn.find((i: any) => i.barcode === code || String(i.productId) === code);
      if (!item) {
        this.auth.showToast(`El código "${code}" no pertenece a la Boleta ${rf.targetSale.uniqueId}`, 'warning');
        return;
      }
      if (item.returnQty >= item.boughtQty) {
        this.auth.showToast(`Ya seleccionaste el máximo comprado (${item.boughtQty}) de ${item.name}`, 'warning');
        return;
      }
      item.returnQty += 1;
      win.renderReturnView();
      this.auth.showToast(`✅ "${item.name}" marcado para devolución parcial (${item.returnQty} ud).`, 'success');
    };

    win.togglePartialItemClick = (barcode: string) => {
      if (this.caja.returnFlowState.mode !== 'PARCIAL') return;
      win.addPartialProductByCode(barcode);
    };

    win.selectRefundChannel = (channel: string) => {
      this.caja.returnFlowState.refundChannel = channel;
      win.renderReturnView();
    };

    const getReturnTotalAmount = () => {
      return this.caja.returnFlowState.itemsToReturn.reduce((s: number, i: any) => s + i.returnQty * i.price, 0);
    };

    win.renderReturnView = () => {
      const rf = this.caja.returnFlowState;
      const sale = rf.targetSale;
      if (!sale) return;

      document.getElementById('return-mode-badge')!.textContent = `DEVOLUCIÓN ${rf.mode}`;
      document.getElementById('return-ticket-info')!.textContent = `Compra ID: ${sale.uniqueId} (${sale.serie}) • Cliente: ${sale.customerName}`;
      const methodsSummary = sale.payments.map((p: any) => `${p.method} S/ ${p.amount.toFixed(2)}`).join(' + ');
      document.getElementById('return-original-method')!.textContent = `Pago original: ${methodsSummary}`;

      const tbody = document.getElementById('ncr-return-tbody')!;
      tbody.innerHTML = rf.itemsToReturn
        .map((item: any) => {
          const sub = item.returnQty * item.price;
          const activeRow = item.returnQty > 0 ? 'bg-rose-50 font-bold text-slate-900' : 'text-slate-500';
          return `
            <tr onclick="togglePartialItemClick('${item.barcode}')" class="${activeRow} hover:bg-rose-100/60 cursor-pointer">
                <td class="py-2 px-2.5 font-bold text-rose-900">${item.barcode}</td>
                <td class="py-2 px-2.5">
                    <span>${item.name}</span>
                    ${rf.mode === 'PARCIAL' ? '<span class="block text-[10px] text-indigo-700">Digita este código arriba o haz clic aquí para sumar +1</span>' : ''}
                </td>
                <td class="py-2 px-2 text-center">${item.boughtQty}</td>
                <td class="py-2 px-2 text-center">
                    <span class="px-2 py-0.5 rounded ${item.returnQty > 0 ? 'bg-rose-600 text-white font-black' : 'bg-slate-200 text-slate-600'}">${item.returnQty}</span>
                </td>
                <td class="py-2 px-2.5 text-right font-black">S/ ${sub.toFixed(2)}</td>
            </tr>
          `;
        })
        .join('');

      const refundTotal = getReturnTotalAmount();
      document.getElementById('return-refund-method-box')?.classList.remove('hidden');
      document.getElementById('return-total-refund-label')!.textContent = `Reembolso: S/ ${refundTotal.toFixed(2)}`;

      ['DIGITAL_EXTORNO', 'EFECTIVO_CAJON', 'NOTA_CREDITO'].forEach(ch => {
        const btn = document.getElementById(`ref-btn-${ch}`);
        if (!btn) return;
        btn.className = rf.refundChannel === ch
          ? 'p-2 rounded-lg border-2 border-rose-600 bg-rose-50 text-rose-950 font-bold text-left shadow-sm'
          : 'p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold text-left opacity-80 hover:opacity-100';
      });
    };

    win.processReturnVoucherEmission = () => {
      const rf = this.caja.returnFlowState;
      const activeItems = rf.itemsToReturn.filter((i: any) => i.returnQty > 0);
      if (activeItems.length === 0) {
        this.auth.showToast('Ingresa el código numérico de al menos un producto a devolver', 'warning');
        return;
      }

      const refundAmount = getReturnTotalAmount();
      const sale = rf.targetSale;

      if (rf.refundChannel === 'EFECTIVO_CAJON') {
        const currentCash = this.caja.getCurrentCashInDrawer();
        if (currentCash < refundAmount) {
          this.auth.showToast(`⚠️ En el cajón solo hay S/ ${currentCash.toFixed(2)}. Selecciona "1. Extorno Digital".`, 'warning');
          return;
        }
        this.caja.shiftState.cashRefundsTotal += refundAmount;
        this.caja.shiftState.cashRefundsCount += 1;
      }

      activeItems.forEach((retItem: any) => {
        const prod = this.inv.productsDB.find(p => p.id === retItem.productId || p.barcode === retItem.barcode);
        if (prod) prod.stock += retItem.returnQty;
        const origItem = sale.items.find((i: any) => i.barcode === retItem.barcode);
        if (origItem) origItem.returnedQty = (origItem.returnedQty || 0) + retItem.returnQty;
      });

      const allReturned = sale.items.every((i: any) => (i.returnedQty || 0) >= i.qty);
      sale.status = allReturned ? 'DEVUELTA TOTAL' : 'DEVUELTA PARCIAL';

      const returnUniqueId = String(this.caja.nextUniqueReturnId++);
      const nowStr = this.auth.getFormattedDateTime();
      const cfg = this.auth.systemConfig;
      const usr = this.auth.currentUser;
      cfg.currentTranNumber++;

      const channelLabels: Record<string, string> = {
        DIGITAL_EXTORNO: 'EXTORNO DIGITAL / YAPE / PLIN / TARJETA (NO AFECTA CAJÓN)',
        EFECTIVO_CAJON: 'EFECTIVO DEL CAJÓN FÍSICO (DESCONTADO EN SISTEMA)',
        NOTA_CREDITO: 'NOTA DE CRÉDITO / VALE DE CAMBIO DE REPUESTO'
      };
      const chosenChannelText = channelLabels[rf.refundChannel];

      const itemsHtml = activeItems
        .map((i: any) => `
          <div class="flex justify-between">
              <span class="truncate max-w-[185px]">${i.barcode} ${i.returnQty}x ${i.name}</span>
              <span>-${(i.returnQty * i.price).toFixed(2)}</span>
          </div>
        `)
        .join('');

      const voucherHtml = `
        <div class="text-center space-y-0.5 mb-2">
            <p class="font-bold">${cfg.companyName}</p>
            <p>RUC ${cfg.ruc}</p>
            <p>${cfg.address}</p>
            <p class="font-bold pt-1 text-rose-800">COMPROBANTE DE DEVOLUCIÓN (${rf.mode})</p>
            <p class="font-bold">ID ÚNICO DEVOLUCIÓN: ${returnUniqueId}</p>
        </div>
        <div class="space-y-0.5 mb-2 border-t border-dashed border-slate-400 pt-1">
            <p>BOLETA ORIGEN ID : <strong>${sale.uniqueId}</strong> (${sale.serie})</p>
            <p>MODALIDAD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: DEVOLUCIÓN ${rf.mode}</p>
            <p>CLIENTE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${sale.customerName}</p>
            <p>CAJERO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${usr.name}</p>
        </div>
        <div class="border-t border-dashed border-slate-400 py-1.5 space-y-0.5">${itemsHtml}</div>
        <div class="border-t border-dashed border-slate-400 pt-1.5 space-y-0.5 mb-2">
            <div class="flex justify-between font-bold text-rose-800">
                <span>TOTAL REEMBOLSADO S/</span>
                <span>-${refundAmount.toFixed(2)}</span>
            </div>
            <p class="text-[10px] font-bold pt-1">VÍA DE REEMBOLSO:</p>
            <p class="text-[10px]">${chosenChannelText}</p>
        </div>
        <div class="text-center my-2 pt-1 border-t border-dashed border-slate-400">
            <svg class="w-20 h-20 mx-auto text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V70zM20 75h5v5h-5zM45 15h10v15H45zM40 40h20v20H40zM70 45h15v10H70zM45 70h15v20H45zM70 70h20v20H70z"/>
            </svg>
            <p class="font-bold text-xs tracking-widest mt-1">ID QR DEVOLUCIÓN: ${returnUniqueId}</p>
        </div>
        <div class="text-[10px] flex justify-between pt-2 mt-1 border-t border-slate-200">
            <span>${cfg.currentTranNumber} ${cfg.localCode}/${cfg.cajaCode}/${usr.shortCode}</span>
            <span>${nowStr} DEV-${rf.mode === 'COMPLETA' ? '01' : '02'}</span>
        </div>
      `;

      this.caja.returnsHistoryDB.unshift({
        returnId: returnUniqueId,
        originalSaleId: sale.uniqueId,
        date: nowStr,
        type: rf.mode,
        customerName: sale.customerName,
        customerDoc: sale.customerDoc,
        cashierName: usr.name,
        refundChannel: chosenChannelText,
        totalRefunded: refundAmount,
        items: activeItems.map((i: any) => ({ barcode: i.barcode, name: i.name, qty: i.returnQty, price: i.price })),
        voucherHtml
      });

      win.updateHeaderStatus?.();
      win.openVoucherModal(`Baucher de Devolución ${rf.mode} (ID: ${returnUniqueId})`, voucherHtml, 'RETURN_SALES');
    };
  }
}
