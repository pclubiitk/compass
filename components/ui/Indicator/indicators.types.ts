import { ReactNode } from 'react';

export interface IndicatorAction {
    // ReactNode is a type from React that represents anything React can render
  icon: ReactNode;          // Icon component (e.g., from Lucide or Heroicons)
  text: string;             // Label for the action
// void means that the function does not takes any arguments, and returns nothing
  onClick: () => void;      // Function to execute
}

export interface Indicator {
  title: string;            // E.g., "Active Users"
  value: string | number;   // E.g., "2.4K"
//   ? means that it's optional, a card can be made without actions array
  actions?: IndicatorAction[]; // Optional array (max 3 actions)
}