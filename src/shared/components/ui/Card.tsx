import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  ...props
}) => {
  return (
    <div
      className={`bg-[#121615] border border-[#1e2623] rounded-xl p-5 ${
        hover ? 'transition-all duration-200 hover:border-[#2b3732] hover:bg-[#141a18]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
