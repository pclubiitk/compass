import React from 'react';
// Indicator type and Indicator card being imported
import IndicatorCard from './IndicatorCard';
import { Indicator } from './indicators.types';

interface IndicatorsProps {
  indicators: Indicator[];
}
// React function component
const Indicators: React.FC<IndicatorsProps> = ({ indicators }) => {
  return (
    // overflow makes the row horizontally scrollable
    <div className="overflow-x-auto w-full py-2">
      <div className="flex gap-4 min-w-max px-4">
        {/* Loops through each Indicator object, and renders a card for each */}
        {indicators.map((indicator, index) => (
          <IndicatorCard key={index} data={indicator} />
        ))}
      </div>
    </div>
  );
};

export default Indicators;
