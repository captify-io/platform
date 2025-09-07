import React from 'react';
import type { RMFSupplyChain } from '../types/index.js';

interface SupplyChainViewProps {
  supplyChain: RMFSupplyChain;
}

export function SupplyChainView({ supplyChain }: SupplyChainViewProps) {
  return (
    <div className="supply-chain-view">
      <h2>{supplyChain.location} Supply Chain</h2>
      <p>Resources: {supplyChain.resources.length}</p>
    </div>
  );
}