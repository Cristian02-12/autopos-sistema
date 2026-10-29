import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { Inventario } from '../../../core/services/inventario';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-cotizador-a4',
  styleUrl: './cotizador-a4.css',
  templateUrl: './cotizador-a4.html',
})
export class CotizadorA4 implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    const win = window as any;

    win.renderQuotesModule = () => {
      const grid = document.getElementById('quotes-module-grid');
      if (!grid) return;
      grid.innerHTML = this.caja.savedQuotes
        .map((q, idx) => {
          const total = q.items.reduce((s, i) => s + i.qty * i.price, 0);
          return `
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span class="font-mono-code font-black text-sm text-indigo-600">${q.id}</span>
                        <span class="text-[11px] text-slate-400">${q.date}</span>
                    </div>
                    <p class="font-bold text-xs text-slate-900 mt-2">${q.customerName}</p>
                    <p class="text-[11px] text-slate-500">Doc: ${q.customerDoc} • Vendedor: ${q.operator}</p>
                    <ul class="mt-2 space-y-1 text-xs border-t border-slate-100 pt-2">
                        ${q.items.map(i => `<li class="flex justify-between"><span>${i.qty}x ${i.name}</span><span class="font-mono-code font-bold">S/ ${(i.qty * i.price).toFixed(2)}</span></li>`).join('')}
                    </ul>
                </div>
                <div class="pt-3 border-t border-slate-200 space-y-2">
                    <div class="flex justify-between items-baseline">
                        <span class="text-xs font-bold text-slate-500">TOTAL PROFORMA:</span>
                        <span class="font-mono-code font-black text-base text-slate-900">S/ ${total.toFixed(2)}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="openA4QuotePreview(${idx})" class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                            <i class="fa-solid fa-print"></i> Imprimir A4 / WSP
                        </button>
                        <button onclick="loadQuoteIntoPos(${idx})" class="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl">
                            Pasar a Caja
                        </button>
                    </div>
                </div>
            </div>
          `;
        })
        .join('');
    };

    win.loadQuoteIntoPos = (idx: number) => {
      const q = this.caja.savedQuotes[idx];
      if (!q) return;
      this.caja.currentCart = q.items.map(item => {
        const found = this.inv.productsDB.find(p => p.sku === item.sku) || this.inv.productsDB[0];
        return {
          productId: found.id,
          barcode: found.barcode,
          sku: item.sku,
          name: item.name,
          location: found.location,
          qty: item.qty,
          price: item.price
        };
      });
      this.caja.currentCustomer = { doc: q.customerDoc, name: q.customerName, docType: 'Boleta', plate: q.plate };
      win.switchModule?.('pos');
      win.setPosState?.('SALES');
      this.auth.showToast(`Cotización ${q.id} cargada en la pantalla de caja`, 'success');
    };

    win.saveCurrentCartAsQuote = () => {
      if (this.caja.currentCart.length === 0) {
        this.auth.showToast('Agrega al menos un repuesto a la pantalla para generar una Cotización A4', 'warning');
        return;
      }
      const newQuote = {
        id: `COT-A4-00${this.caja.savedQuotes.length + 1}`,
        date: this.auth.getFormattedDateTime(),
        customerName: this.caja.currentCustomer.name !== '--' ? this.caja.currentCustomer.name : 'CLIENTE MOSTRADOR / PARTICULAR',
        customerDoc: this.caja.currentCustomer.doc !== '0' ? this.caja.currentCustomer.doc : 'SIN DOC',
        plate: this.caja.currentCustomer.plate || 'Multimarca',
        operator: this.auth.currentUser.name,
        items: this.caja.currentCart.map(i => ({
          sku: i.sku,
          name: i.name,
          brand: 'Autopartes',
          qty: i.qty,
          price: this.caja.getUnitEffectivePrice(i)
        }))
      };
      this.caja.savedQuotes.unshift(newQuote);
      document.getElementById('quotes-count-badge')!.textContent = String(this.caja.savedQuotes.length);
      const mobQuotesBadge = document.getElementById('mob-quotes-count-badge');
      if (mobQuotesBadge) mobQuotesBadge.textContent = String(this.caja.savedQuotes.length);
      win.openA4QuotePreview(0);
      this.auth.showToast(`📄 Cotización ${newQuote.id} generada en formato Hoja A4`, 'success');
    };

    win.openA4QuotePreview = (idx: number) => {
      const q = this.caja.savedQuotes[idx];
      if (!q) return;
      const total = q.items.reduce((s, i) => s + i.qty * i.price, 0);
      const subtotal = total / 1.18;
      const igv = total - subtotal;
      const cfg = this.auth.systemConfig;

      const rows = q.items
        .map((item, i) => `
          <tr class="border-b border-slate-200">
              <td class="py-2.5 px-3 text-center font-mono-code">${i + 1}</td>
              <td class="py-2.5 px-3 font-mono-code font-bold">${item.sku}</td>
              <td class="py-2.5 px-3 font-bold">${item.name}</td>
              <td class="py-2.5 px-3 text-center font-mono-code font-bold">${item.qty}</td>
              <td class="py-2.5 px-3 text-right font-mono-code">S/ ${item.price.toFixed(2)}</td>
              <td class="py-2.5 px-3 text-right font-mono-code font-black">S/ ${(item.qty * item.price).toFixed(2)}</td>
          </tr>
        `)
        .join('');

      document.getElementById('a4-quote-printable')!.innerHTML = `
        <div class="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">${cfg.companyName}</h1>
                <p class="text-xs text-slate-600">RUC: ${cfg.ruc} • ${cfg.address} - ${cfg.district}</p>
                <p class="text-xs font-bold text-[#d96b27] mt-1">COTIZACIÓN / PROFORMA OFICIAL DE AUTOPARTES (FORMATO IMPRESORA A4)</p>
            </div>
            <div class="border-2 border-slate-900 rounded-xl p-3 text-center font-mono-code">
                <span class="text-[10px] font-bold uppercase block text-slate-500">N° COTIZACIÓN</span>
                <span class="text-lg font-black text-indigo-700">${q.id}</span>
                <span class="text-[10px] block text-slate-500">${q.date}</span>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
                <p><strong class="text-slate-600">CLIENTE / RAZÓN SOCIAL:</strong> ${q.customerName}</p>
                <p class="mt-1"><strong class="text-slate-600">DNI / RUC:</strong> <span class="font-mono-code">${q.customerDoc}</span></p>
            </div>
            <div>
                <p><strong class="text-slate-600">VEHÍCULO / REFERENCIA:</strong> ${q.plate}</p>
                <p class="mt-1"><strong class="text-slate-600">ASESOR DE VENTAS:</strong> ${q.operator}</p>
            </div>
        </div>

        <table class="w-full text-left border-collapse text-xs">
            <thead>
                <tr class="bg-slate-900 text-white uppercase text-[11px]">
                    <th class="py-2.5 px-3 text-center">#</th>
                    <th class="py-2.5 px-3">SKU</th>
                    <th class="py-2.5 px-3">Descripción del Repuesto</th>
                    <th class="py-2.5 px-3 text-center">Cant.</th>
                    <th class="py-2.5 px-3 text-right">P. Unitario</th>
                    <th class="py-2.5 px-3 text-right">Importe Total</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>

        <div class="flex justify-end pt-3">
            <div class="w-64 space-y-1 font-mono-code text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div class="flex justify-between"><span>OP. GRAVADA:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
                <div class="flex justify-between"><span>I.G.V. (18%):</span><span>S/ ${igv.toFixed(2)}</span></div>
                <div class="flex justify-between font-black text-sm border-t border-slate-300 pt-1.5 text-slate-950">
                    <span>TOTAL COTIZADO:</span><span>S/ ${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <p class="text-[11px] text-slate-500 italic border-t border-slate-200 pt-3">
            * Cotización válida por 7 días calendario. Sujeta a disponibilidad de stock en tienda.
        </p>
      `;
      document.getElementById('a4-quote-modal')?.classList.remove('hidden');
    };

    win.closeA4QuoteModal = () => document.getElementById('a4-quote-modal')?.classList.add('hidden');
    win.sendQuoteWhatsApp = () => this.auth.showToast('📲 Cotización en PDF enviada por WhatsApp al cliente', 'success');
  }
}
