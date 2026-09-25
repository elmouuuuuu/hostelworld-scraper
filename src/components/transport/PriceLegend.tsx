import { PRICE_COLORS } from '@/lib/transport/pricing';

export function PriceLegend() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 p-3 text-xs shadow-sm backdrop-blur">
      <p className="mb-1.5 font-medium text-gray-500">Price</p>
      <div className="flex flex-col gap-1">
        <LegendRow color={PRICE_COLORS.cheapest} label="Cheapest" />
        <LegendRow color={PRICE_COLORS.cheap} label="Cheap" />
        <LegendRow color={PRICE_COLORS.moderate} label="Moderate" />
        <LegendRow color={PRICE_COLORS.expensive} label="Expensive" />
      </div>
      <p className="mb-1.5 mt-3 font-medium text-gray-500">Mode</p>
      <div className="flex flex-col gap-1.5 text-gray-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-gray-500" />
          Bus
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 bg-gray-500" />
          Train
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1 w-5 bg-gray-500" />
          High-speed train
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 rounded-full bg-gray-500" style={{ transform: 'scaleY(1.5) skewY(-8deg)' }} />
          Flight (curved)
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
