import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Inventario } from '../../../core/services/inventario';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-ingreso-mercaderia',
  styleUrl: './ingreso-mercaderia.css',
  templateUrl: './ingreso-mercaderia.html',
})
export class IngresoMercaderia implements AfterViewInit {
  private auth = inject(Auth);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    const win = window as any;

    win.renderRestockSearchResults = () => {
      const q = ((document.getElementById('restock-search-input') as HTMLInputElement)?.value || '').trim().toLowerCase();
      const container = document.getElementById('restock-search-results');
      if (!container) return;

      const matches = this.inv.productsDB.filter(p => `${p.barcode} ${p.sku} ${p.name} ${p.oem}`.toLowerCase().includes(q));
      container.innerHTML = matches
        .map(p => `
          <div onclick="selectProductForRestock(${p.id})" class="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 cursor-pointer transition-all flex items-center justify-between">
              <div>
                  <span class="font-mono-code text-[10px] font-bold text-indigo-600 block">Cód: ${p.barcode} | SKU: ${p.sku}</span>
                  <span class="font-extrabold text-xs text-slate-900">${p.name}</span>
              </div>
              <div class="text-right font-mono-code">
                  <span class="text-[10px] text-slate-500 block">Stock actual</span>
                  <span class="font-black text-sm text-emerald-700">${p.stock} uds</span>
              </div>
          </div>
        `)
        .join('');
    };

    win.selectProductForRestock = (productId: number) => {
      const p = this.inv.productsDB.find(prod => prod.id === productId);
      if (!p) return;
      (document.getElementById('restock-selected-id') as HTMLInputElement).value = String(p.id);
      document.getElementById('restock-selected-name')!.textContent = p.name;
      document.getElementById('restock-selected-meta')!.textContent = `Código General: ${p.barcode} | SKU: ${p.sku} | Stock Actual: ${p.stock} unidades`;
      document.getElementById('restock-qty-input')?.focus();
    };

    win.confirmMerchandiseEntry = (e: Event) => {
      e.preventDefault();
      const prodId = parseInt((document.getElementById('restock-selected-id') as HTMLInputElement).value, 10);
      const qty = parseInt((document.getElementById('restock-qty-input') as HTMLInputElement).value, 10);
      const docRef = (document.getElementById('restock-doc-input') as HTMLInputElement).value.trim() || 'Ingreso directo almacén';

      const p = this.inv.productsDB.find(prod => prod.id === prodId);
      if (!p) {
        this.auth.showToast('Primero selecciona un producto de la lista superior', 'warning');
        return;
      }
      if (isNaN(qty) || qty <= 0) return;

      p.stock += qty;
      this.inv.merchandiseEntriesDB.unshift({
        date: this.auth.getFormattedDateTime(),
        barcode: p.barcode,
        sku: p.sku,
        name: p.name,
        addedQty: qty,
        docRef,
        operator: this.auth.currentUser.name
      });

      (document.getElementById('restock-qty-input') as HTMLInputElement).value = '';
      (document.getElementById('restock-doc-input') as HTMLInputElement).value = '';
      win.selectProductForRestock(p.id);
      win.renderRestockSearchResults();
      win.renderRestockHistory();
      win.renderInventoryModule?.();
      this.auth.showToast(`🚚 Se sumaron +${qty} unidades a "${p.name}". Nuevo stock: ${p.stock} uds.`, 'success');
    };

    win.renderRestockHistory = () => {
      const list = document.getElementById('restock-history-list');
      if (!list) return;
      list.innerHTML = this.inv.merchandiseEntriesDB
        .map(entry => `
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex justify-between items-center">
                  <span class="font-mono-code font-bold text-emerald-700">+${entry.addedQty} UDS • ${entry.sku}</span>
                  <span class="text-[10px] text-slate-400 font-mono-code">${entry.date}</span>
              </div>
              <p class="font-extrabold text-slate-900">${entry.name}</p>
              <p class="text-[10px] text-slate-500">Cód: ${entry.barcode} • ${entry.docRef} • Por: ${entry.operator}</p>
          </div>
        `)
        .join('');
    };
  }
}
