import type { FloatingTextItem } from '../types/game';

interface FloatingTextProps {
  items: FloatingTextItem[];
}

export function FloatingText({ items }: FloatingTextProps) {
  return (
    <div className="floating-text-layer" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="floating-text"
          style={{ left: item.x, top: item.y }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
