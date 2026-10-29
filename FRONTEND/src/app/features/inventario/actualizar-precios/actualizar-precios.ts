import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Inventario } from '../../../core/services/inventario';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-actualizar-precios',
  styleUrl: './actualizar-precios.css',
  templateUrl: './actualizar-precios.html',
})
export class ActualizarPrecios implements AfterViewInit {
  private auth = inject(Auth);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    const win = window as any;

    win.renderPricingSearchResults = () => {
      const q = ((document.getElementById('pricing-search-input') as HTMLInputElement)?.value || '').trim().toLowerCase();
      const container = document.getElementById('pricing-search-results');
      if (!container) return;

      const matches = this.inv.productsDB.filter(p => `${p.barcode} ${p.sku} ${p.name} ${p.oem}`.toLowerCase().includes(q));
      container.innerHTML = matches
        .map(p => {
          const mech = p.mechanicPrice || Math.round(p.price * 0.85 * 100) / 100;
          return `
            <div onclick="selectProductForPricing(${p.id})" class="p-3 rounded-xl border border-slate-200 hover:border-amber-500 bg-white hover:bg-amber-50/40 cursor-pointer transition-all flex items-center justify-between">
                <div>
                    <span class="font-mono-code text-[10px] font-bold text-indigo-600 block">Cód: ${p.barcode} | SKU: ${p.sku}</span>
                    <span class="font-extrabold text-xs text-slate-900">${p.name}</span>
                </div>
                <div class="text-right font-mono-code">
                    <span class="font-black text-xs text-slate-900 block">Púb: S/ ${p.price.toFixed(2)}</span>
                    <span class="text-[10px] font-bold text-amber-700 block">Mec: S/ ${mech.toFixed(2)}</span>
                </div>
            </div>
          `;
        })
        .join('');
    };

    win.selectProductForPricing = (productId: number) => {
      const p = this.inv.productsDB.find(prod => prod.id === productId);
      if (!p) return;
      const mech = p.mechanicPrice || Math.round(p.price * 0.85 * 100) / 100;
      (document.getElementById('pricing-selected-id') as HTMLInputElement).value = String(p.id);
      document.getElementById('pricing-selected-name')!.textContent = p.name;
      document.getElementById('pricing-selected-meta')!.textContent = `Código General: ${p.barcode} | SKU Interno: ${p.sku} | OEM: ${p.oem}`;
      document.getElementById('pricing-current-public')!.textContent = `S/ ${p.price.toFixed(2)}`;
      document.getElementById('pricing-current-mechanic')!.textContent = `S/ ${mech.toFixed(2)}`;
      (document.getElementById('pricing-new-public') as HTMLInputElement).value = p.price.toFixed(2);
      (document.getElementById('pricing-new-mechanic') as HTMLInputElement).value = mech.toFixed(2);
      document.getElementById('pricing-new-public')?.focus();
    };

    win.confirmProductPriceUpdate = (e: Event) => {
      e.preventDefault();
      if (this.auth.currentUser.role !== 'DUENO' && this.auth.currentUser.role !== 'PROGRAMADOR') {
        this.auth.showToast('Solo el Dueño y el Programador pueden actualizar precios', 'warning');
        return;
      }
      const prodId = parseInt((document.getElementById('pricing-selected-id') as HTMLInputElement).value, 10);
      const newPub = parseFloat((document.getElementById('pricing-new-public') as HTMLInputElement).value);
      const newMech = parseFloat((document.getElementById('pricing-new-mechanic') as HTMLInputElement).value);

      const p = this.inv.productsDB.find(prod => prod.id === prodId);
      if (!p) {
        this.auth.showToast('Selecciona primero un producto para actualizar su precio', 'warning');
        return;
      }
      if (isNaN(newPub) || newPub <= 0 || isNaN(newMech) || newMech <= 0) return;

      p.price = newPub;
      p.mechanicPrice = newMech;

      win.selectProductForPricing(p.id);
      win.renderPricingSearchResults();
      win.renderInventoryModule?.();
      win.renderSalesTable?.();
      this.auth.showToast(`🏷️ Precios actualizados en todo el sistema para "${p.name}": Público S/ ${newPub.toFixed(2)} | Mecánico S/ ${newMech.toFixed(2)}`, 'success');
    };
  }
}
