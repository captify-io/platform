import React, { createContext, useContext } from 'react';
import type { RMFResource, RMFSupplyChain } from '../types/index.js';

interface RMFContextType {
  resources: RMFResource[];
  supplyChains: RMFSupplyChain[];
}

const RMFContext = createContext<RMFContextType | null>(null);

export function useRMFContext() {
  const context = useContext(RMFContext);
  if (!context) {
    throw new Error('useRMFContext must be used within RMFProvider');
  }
  return context;
}