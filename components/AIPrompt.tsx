import React, { useState } from 'react';
import { WandIcon } from './IconComponents';

interface AIPromptProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const examplePrompts = [
  'A strong, functional gear for a high-torque robot arm',
  'A detailed, decorative miniature for tabletop gaming',
  'A waterproof vase with a smooth finish',
  'A fast prototype for fit testing',
  'A flexible and durable phone case',
];

export const AIPrompt: React.FC<AIPromptProps> = ({ onSubmit, isLoading, disabled }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className={`p-6 bg-secondary rounded-lg shadow-lg transition-all duration-300 ${disabled ? 'opacity-50' : ''}`}>
      <h2 className="text-xl font-semibold text-light mb-4 flex items-center">
        <span className="bg-primary text-dark rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">3</span>
        Describe Your Part's Purpose
      </h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading || disabled}
          placeholder="e.g., A waterproof vase with a smooth finish..."
          className="w-full bg-dark/50 border border-gray-600 rounded-lg p-3 text-light focus:ring-primary focus:border-primary resize-none h-28"
        />
        <div className="mt-2 text-sm text-gray-400">
          <p>Not sure what to write? Try an example:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {examplePrompts.map((ex, i) => (
                <button 
                  key={i} 
                  type="button" 
                  onClick={() => handleExampleClick(ex)}
                  disabled={isLoading || disabled}
                  className="bg-dark/50 px-3 py-1 rounded-full text-xs hover:bg-primary hover:text-dark transition-colors"
                >
                  {ex}
                </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !prompt.trim() || disabled}
          className="mt-6 w-full flex items-center justify-center bg-primary text-dark font-bold py-3 px-4 rounded-lg hover:bg-teal-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <WandIcon className="w-6 h-6 mr-2" />
          {isLoading ? 'Generating...' : 'Generate AI Settings'}
        </button>
      </form>
    </div>
  );
};