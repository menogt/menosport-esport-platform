import { PackagePlus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@shared/phase4";
import { formatCurrency } from "@shared/phase4";

export function ProductCard({ product, onAdd }: { product: StoreProduct; onAdd: (product: StoreProduct) => void }) {
  return (
    <article className="group grid gap-4 border-t border-white/10 py-5 md:grid-cols-[7.75rem_1fr_auto] md:items-center">
      <div className="relative grid aspect-[5/4] place-items-center overflow-hidden bg-[#121712] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_75%_20%,rgba(206,255,101,0.25),transparent_40%)]">
        <span className="relative font-display text-4xl tracking-[-0.08em] text-white/75">{product.org.split(" ").map(part => part[0]).join("").slice(0, 2)}</span>
        {product.badge && <span className="absolute bottom-2 left-2 bg-lime-300 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black">{product.badge}</span>}
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lime-300">{product.org}</p>
        <h3 className="mt-2 font-display text-xl tracking-[-0.03em] text-white">{product.name}</h3>
        <p className="mt-1 text-xs text-white/45">{product.color} · {product.inventoryLabel}</p>
      </div>
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
        <strong className="font-mono text-sm text-white">{formatCurrency(product.priceCents)}</strong>
        <Button onClick={() => onAdd(product)} size="sm" className="bg-lime-300 text-black hover:bg-lime-200 active:scale-[0.98]"><PackagePlus className="mr-2 h-4 w-4" />Add</Button>
      </div>
      <span className="sr-only"><ShoppingBag /> Product available in the demo catalog</span>
    </article>
  );
}
