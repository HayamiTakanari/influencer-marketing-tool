import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  gradient,
  onClick,
  padding = 'lg',
  shadow = 'md'
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const shadowStyles = {
    sm: '3px 3px 8px rgba(0,0,0,0.06), 1px 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
    md: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    lg: '10px 10px 20px rgba(0,0,0,0.12), 5px 5px 15px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.9)',
    xl: '15px 15px 30px rgba(0,0,0,0.15), 8px 8px 20px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.9)'
  };

  const MotionComponent = hover ? motion.div : 'div';
  const hoverProps = hover ? {
    whileHover: { y: -4 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <MotionComponent
      {...hoverProps}
      onClick={onClick}
      className={`group relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div 
        className={`relative bg-white border border-gray-200 ${paddingClasses[padding]} transition-all group overflow-hidden`}
        style={{
          background: `
            linear-gradient(135deg, transparent 10px, white 10px),
            linear-gradient(-135deg, transparent 10px, white 10px),
            linear-gradient(45deg, transparent 10px, white 10px),
            linear-gradient(-45deg, transparent 10px, white 10px)
          `,
          backgroundPosition: 'top left, top right, bottom right, bottom left',
          backgroundSize: '50% 50%',
          backgroundRepeat: 'no-repeat',
          boxShadow: shadowStyles[shadow]
        }}
      >
        {/* パターン背景 */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05) 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 80px 80px'
        }} />
        
        {/* コンテンツ */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* ホバー時のアクセント */}
        {hover && (
          <div 
            className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" 
            style={{ background: gradient || 'linear-gradient(90deg, #34d399, #14b8a6, #10b981, #059669)' }} 
          />
        )}
      </div>
    </MotionComponent>
  );
};

export default Card;