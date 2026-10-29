import { Component, AfterViewInit, inject } from '@angular/core';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { Inventario } from '../../../core/services/inventario';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-catalogo-equivalencias',
  styleUrl: './catalogo-equivalencias.css',
  templateUrl: './catalogo-equivalencias.html',
})
export class CatalogoEquivalencias implements AfterViewInit {
  private inv = inject(Inventario);
  private caja = inject(CajaNcr);

  ngAfterViewInit(): void {
    const win = window as any;

    win.toggleCatalogDrawer = () => {
      const drawer = document.getElementById('catalog-drawer');
      if (!drawer) return;
      drawer.classList.toggle('hidden');
      if (!drawer.classList.contains('hidden')) {
        win.renderVisualCatalog();
        document.getElementById('cat-search-input')?.focus();
      }
    };

    win.filterCatalogByOEM = (oemCode: string) => {
      this.inv.catalogOEMFilter = oemCode;
      document.getElementById('catalog-drawer')?.classList.remove('hidden');
      win.renderVisualCatalog();
    };

    win.clearCatalogOEMFilter = () => {
      this.inv.catalogOEMFilter = null;
      (document.getElementById('cat-search-input') as HTMLInputElement).value = '';
      (document.getElementById('cat-brand-filter') as HTMLSelectElement).value = '';
      win.renderVisualCatalog();
    };

    win.renderVisualCatalog = () => {
      const q = ((document.getElementById('cat-search-input') as HTMLInputElement)?.value || '').trim().toLowerCase();
      const brand = ((document.getElementById('cat-brand-filter') as HTMLSelectElement)?.value || '').trim().toLowerCase();
      const grid = document.getElementById('visual-catalog-grid');
      if (!grid) return;

      const filtered = this.inv.productsDB.filter(p => {
        if (this.inv.catalogOEMFilter && p.oem !== this.inv.catalogOEMFilter) return false;
        if (brand && !p.vehicles.toLowerCase().includes(brand)) return false;
        if (q && !`${p.barcode} ${p.sku} ${p.oem} ${p.name} ${p.vehicles} ${p.brand}`.toLowerCase().includes(q)) return false;
        return true;
      });

      grid.innerHTML = filtered
        .map(p => {
          const effPrice = this.caja.isMechanicPrice ? p.mechanicPrice || p.price * 0.85 : p.price;
          const badge = p.stock === 0
            ? `<span class="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black px-2 py-0.5 rounded">🔴 AGOTADO (0)</span>`
            : p.stock <= p.minStock
              ? `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded">🟡 BAJO STOCK (${p.stock})</span>`
              : `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded">🟢 STOCK: ${p.stock}</span>`;

          return `
            <div class="bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl p-3 flex flex-col justify-between gap-2 transition-all">
                <div>
                    <div class="flex items-center justify-between gap-1 mb-1">
                        <span class="font-mono-code text-[10px] font-bold text-amber-400">Cód: ${p.barcode} • ${p.sku}</span>
                        ${badge}
                    </div>
                    <h4 class="font-extrabold text-xs text-white">${p.name}</h4>
                    <p class="text-[11px] text-slate-400 mt-0.5">Marca: <strong>${p.brand}</strong> • OEM: <span class="font-mono-code text-indigo-300">${p.oem}</span></p>
                    <p class="text-[10px] text-slate-400 mt-0.5"><i class="fa-solid fa-car mr-1 text-slate-500"></i>${p.vehicles}</p>
                    <p class="text-[10px] text-amber-300/90 mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>${p.location}</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span class="font-mono-code font-black text-sm text-white">S/ ${effPrice.toFixed(2)}</span>
                    ${p.stock > 0
                      ? `<button onclick="addProductToPosCart(${p.id}); toggleCatalogDrawer();" class="px-3 py-1.5 bg-[#d96b27] hover:bg-[#c25a1b] text-white font-black rounded-lg text-[11px]">
                          + Pasar por Caja
                         </button>`
                      : `<button onclick="filterCatalogByOEM('${p.oem}')" class="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px]">
                          Ver Equivalente OEM
                         </button>`}
                </div>
            </div>
          `;
        })
        .join('');
    };
  }
}
