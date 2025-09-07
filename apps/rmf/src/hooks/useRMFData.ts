import { useState, useEffect } from 'react';
import type { RMFResource, RMFSupplyChain } from '../types/index.js';

export function useRMFData() {
  const [resources, setResources] = useState<RMFResource[]>([]);
  const [supplyChains, setSupplyChains] = useState<RMFSupplyChain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Implementation will be added when needed
    setLoading(false);
  }, []);

  return {
    resources,
    supplyChains,
    loading,
  };
}