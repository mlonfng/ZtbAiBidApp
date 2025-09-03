import React from 'react';

interface CanvasRulerProps {
  direction: 'horizontal' | 'vertical';
  zoomLevel: number;
}

const CanvasRuler: React.FC<CanvasRulerProps> = ({ direction, zoomLevel }) => {
  const scale = zoomLevel / 100;
  const step = 50; // 基础步长50px
  const actualStep = step * scale;

  const generateMarks = () => {
    const marks = [];
    const maxLength = direction === 'horizontal' ? 2000 : 1500;
    
    for (let i = 0; i <= maxLength; i += step) {
      const position = i * scale;
      const isMainMark = i % (step * 2) === 0;
      
      marks.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            [direction === 'horizontal' ? 'left' : 'top']: position,
            [direction === 'horizontal' ? 'top' : 'left']: isMainMark ? 0 : 5,
            [direction === 'horizontal' ? 'width' : 'height']: 1,
            [direction === 'horizontal' ? 'height' : 'width']: isMainMark ? 20 : 10,
            background: '#999',
            fontSize: 10,
            color: '#666',
          }}
        >
          {isMainMark && (
            <span
              style={{
                position: 'absolute',
                [direction === 'horizontal' ? 'left' : 'top']: 2,
                [direction === 'horizontal' ? 'top' : 'left']: direction === 'horizontal' ? 2 : -15,
                transform: direction === 'vertical' ? 'rotate(-90deg)' : 'none',
                transformOrigin: 'left top',
                whiteSpace: 'nowrap',
              }}
            >
              {i}
            </span>
          )}
        </div>
      );
    }
    
    return marks;
  };

  const rulerStyle: React.CSSProperties = {
    position: 'absolute',
    [direction === 'horizontal' ? 'top' : 'left']: 0,
    [direction === 'horizontal' ? 'left' : 'top']: 20,
    [direction === 'horizontal' ? 'width' : 'height']: '100%',
    [direction === 'horizontal' ? 'height' : 'width']: 20,
    background: '#f5f5f5',
    borderBottom: direction === 'horizontal' ? '1px solid #d9d9d9' : 'none',
    borderRight: direction === 'vertical' ? '1px solid #d9d9d9' : 'none',
    overflow: 'hidden',
    zIndex: 100,
  };

  return (
    <div className={`canvas-ruler-${direction}`} style={rulerStyle}>
      {generateMarks()}
    </div>
  );
};

export default CanvasRuler;
