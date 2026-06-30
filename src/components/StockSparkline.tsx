interface StockSparklineProps {
  values: number[];
  positive?: boolean;
  large?: boolean;
}

export function StockSparkline({ values, positive = true, large = false }: StockSparklineProps) {
  const width = large ? 520 : 150;
  const height = large ? 180 : 54;
  const safeValues = values.filter((value) => Number.isFinite(value) && value > 0);
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(0.01, max - min);
  const points = safeValues.map((value, index) => {
    const x = safeValues.length <= 1 ? 0 : (index / (safeValues.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  if (safeValues.length < 2) {
    return <div className={`stock-sparkline ${large ? 'stock-sparkline--large' : ''}`} />;
  }

  return (
    <svg
      className={`stock-sparkline ${large ? 'stock-sparkline--large' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Stock price chart"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={positive ? 'var(--success)' : 'var(--danger)'}
        strokeWidth={large ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
