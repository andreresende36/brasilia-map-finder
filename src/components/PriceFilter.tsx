import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  onFilterChange: (min: number, max: number) => void;
}

export const PriceFilter = ({ minPrice, maxPrice, onFilterChange }: PriceFilterProps) => {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);

  useEffect(() => {
    setMin(minPrice);
    setMax(maxPrice);
  }, [minPrice, maxPrice]);

  const handleApply = () => {
    onFilterChange(min, max);
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    });
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Filtrar por preço</span>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Mínimo</label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            min={0}
          />
        </div>

        <span className="text-muted-foreground mt-5">—</span>

        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Máximo</label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            min={0}
          />
        </div>

        <button
          onClick={handleApply}
          className="btn-accent mt-5"
        >
          Aplicar
        </button>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        {formatPrice(min)} — {formatPrice(max)}
      </div>
    </div>
  );
};
