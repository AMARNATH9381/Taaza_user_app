import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backPath?: string;
  rightAction?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = true, 
  onBack, 
  backPath,
  rightAction, 
  className = "bg-zepto-blue text-white",
  transparent = false
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`sticky top-0 z-20 shadow-md ${className} ${transparent ? 'bg-transparent shadow-none absolute w-full' : ''} px-4 py-3 transition-all`}>
      <div className="relative flex items-center justify-between min-h-[40px]">
        
        {/* Left Side (Back Button) */}
        <div className="flex-shrink-0 w-12 flex items-center justify-start z-10">
          {showBack && (
            <button 
              onClick={handleBack} 
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
        </div>
        
        {/* Center Title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {title && <h1 className="text-lg font-bold truncate max-w-[60%] animate-fade-in">{title}</h1>}
        </div>

        {/* Right Side (Action) */}
        <div className="flex-shrink-0 w-12 flex items-center justify-end z-10">
          {rightAction ? rightAction : null}
        </div>
      </div>
    </header>
  );
};

interface FooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ children, className = "bg-white border-t border-gray-200" }) => {
  return (
    <footer className={`p-4 sticky bottom-0 z-20 ${className}`}>
      {children}
    </footer>
  );
};