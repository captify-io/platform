// RMF Types - Shared across server and client
export interface RMFResource {
  id: string;
  name: string;
  type: 'supply-chain' | 'logistics' | 'inventory';
  status: 'active' | 'inactive' | 'maintenance';
}

export interface RMFSupplyChain {
  id: string;
  resources: RMFResource[];
  location: string;
}