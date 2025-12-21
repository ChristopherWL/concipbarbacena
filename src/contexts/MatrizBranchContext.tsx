import { createContext, useContext, useState, ReactNode } from 'react';

interface MatrizBranchContextType {
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
}

const MatrizBranchContext = createContext<MatrizBranchContextType | undefined>(undefined);

export function MatrizBranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  return (
    <MatrizBranchContext.Provider value={{ selectedBranchId, setSelectedBranchId }}>
      {children}
    </MatrizBranchContext.Provider>
  );
}

export function useMatrizBranch() {
  const context = useContext(MatrizBranchContext);
  if (context === undefined) {
    throw new Error('useMatrizBranch must be used within a MatrizBranchProvider');
  }
  return context;
}
