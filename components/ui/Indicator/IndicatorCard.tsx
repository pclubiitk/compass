import React from 'react';
// Importing the structure of the component 
import { Indicator } from './indicators.types';

interface IndicatorCardProps {
  data: Indicator;
}
// This component expects a data which must match the Indicator interface, title, value and optional actions

const IndicatorCard: React.FC<IndicatorCardProps> = ({ data }) => {
    // extracting the details from the input data
  const { title, value, actions } = data;
  return (
    <div className="min-w-[220px] bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between border border-gray-200 transition hover:shadow-lg">
      <div>
        {/* Display the title and the value */}
        <p className="text-gray-900 text-lg font-bold">{title}</p>
        <p className="text-xl font-medium text-gray-700">{value}</p>
      </div>
    {/* If we have some actions, we execute the below */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 justify-center    ">
            {/* Takes the first 3 actions, action is the individual object having icon,text,onclick function, and index is the unique key for React */}
          {actions.slice(0, 3).map((action, index) => (

            <button
              key={index}
              onClick={action.onClick}
              className="flex icons-center gap-2 text-sm bg-blue-600 text-white px-2 py-1 rounded-md hover:opacity-80 transition-opacity"
              >
                {/* Span renders the icon component, then the text label */}
              <span >{action.icon}</span>
              <span>{action.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default IndicatorCard;
// data object will have an array named actions, which is going to contain icon, text, and the onclick function, if it exists. 
// For flexibility, we don't write any onclick function here, but allow it to be passed as the input