import React from 'react';

interface RMFButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function RMFButton({ children, onClick }: RMFButtonProps) {
  return (
    <button className="rmf-button" onClick={onClick}>
      {children}
    </button>
  );
}