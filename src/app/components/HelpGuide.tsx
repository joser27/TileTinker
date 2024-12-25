"use client";
import { useState } from 'react';

interface HelpContent {
  title: string;
  sections: {
    title: string;
    content: string[];
  }[];
}

interface HelpGuideProps {
  content: HelpContent;
}

export default function HelpGuide({ content }: HelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-20 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg"
      >
        {isOpen ? '✕' : '?'}
      </button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-gray-800 rounded-lg shadow-xl p-4 text-white">
          <h2 className="text-xl font-bold mb-4">{content.title}</h2>
          {content.sections.map((section, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <ul className="list-disc pl-4 space-y-1">
                {section.content.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
