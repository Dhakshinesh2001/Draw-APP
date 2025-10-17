// ToolSelector.tsx
"use client";

import React, { Dispatch, SetStateAction } from "react";

// Define the available shapes/tools
type Shape =
  | "select"
  | "rectangle"
  | "diamond"
  | "circle"
  | "arrow"
  | "text"
  | "freeHand"
  | "line";

// Define the props for the ToolSelector component
interface ToolSelectorProps {
  selectedShape: Shape;
  setSelectedShape: Dispatch<SetStateAction<Shape>>;
}

const tools = [
  { id: "select", label: "Select", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.9231 2.5L20.5 10.0769V20.5H2.5V2.5H12.9231Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M16 11L11 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: "rectangle", label: "Rectangle", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5.5" y="5.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )},
  { id: "diamond", label: "Diamond", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L20 12L12 20L4 12L12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )},
  { id: "circle", label: "Circle", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )},
  { id: "arrow", label: "Arrow", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.75 20.25L20.25 3.75M20.25 3.75L14.25 3.75M20.25 3.75V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: "text", label: "Text", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20L20 20M12 4V20M12 4L12 20M9 4H15M9 4L15 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: "freeHand", label: "Freehand", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 6C17.5 7 19.5 9 19.5 12C19.5 15 17.5 17 14 18M14 18C10.5 17 8.5 15 8.5 12C8.5 9 10.5 7 14 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 12H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.5 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  )},
];

export const ToolSelector = ({ selectedShape, setSelectedShape }: ToolSelectorProps) => {
  return (
    <div className="flex bg-gray-100 rounded-lg shadow-sm p-1 gap-1 border border-gray-300">
      {tools.map((tool) => (
        <button
          key={tool.id}
          aria-label={tool.label}
          onClick={() => setSelectedShape(tool.id as Shape)}
          className={`
            p-2 rounded-md transition-colors duration-150 ease-in-out
            ${selectedShape === tool.id ? "bg-blue-300 text-blue-900" : "bg-white text-gray-700 hover:bg-gray-200"}
          `}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};