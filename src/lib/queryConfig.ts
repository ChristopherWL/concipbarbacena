import { UseQueryOptions } from "@tanstack/react-query";

/**
 * Query options for critical routes that need fresh data
 * Use these for stock, movements, and other real-time data
 */
export const criticalQueryOptions: Partial<UseQueryOptions> = {
  staleTime: 10 * 1000, // 10 seconds - even fresher for critical data
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchInterval: false,
};

/**
 * Query keys for the application
 * Centralized for consistent invalidation
 */
export const queryKeys = {
  // Stock related
  products: (tenantId?: string, branchId?: string | null) => 
    ["products", tenantId, branchId].filter(Boolean),
  serialNumbers: (productId?: string) => 
    ["serialNumbers", productId].filter(Boolean),
  stockMovements: (tenantId?: string, branchId?: string | null) => 
    ["stockMovements", tenantId, branchId].filter(Boolean),
  stockAudits: (tenantId?: string) => 
    ["stockAudits", tenantId].filter(Boolean),
  
  // Fleet related
  vehicles: (tenantId?: string, branchId?: string | null) => 
    ["vehicles", tenantId, branchId].filter(Boolean),
  fuelLogs: (tenantId?: string) => 
    ["fuelLogs", tenantId].filter(Boolean),
  maintenances: (tenantId?: string) => 
    ["maintenances", tenantId].filter(Boolean),
  
  // HR related
  employees: (tenantId?: string, branchId?: string | null) => 
    ["employees", tenantId, branchId].filter(Boolean),
  leaves: (tenantId?: string) => 
    ["leaves", tenantId].filter(Boolean),
  vacations: (tenantId?: string) => 
    ["vacations", tenantId].filter(Boolean),
  payrolls: (tenantId?: string) => 
    ["payrolls", tenantId].filter(Boolean),
  
  // Obras related
  obras: (tenantId?: string, branchId?: string | null) => 
    ["obras", tenantId, branchId].filter(Boolean),
  obraEtapas: (obraId?: string) => 
    ["obraEtapas", obraId].filter(Boolean),
  diarioObras: (tenantId?: string) => 
    ["diarioObras", tenantId].filter(Boolean),
  
  // Service orders
  serviceOrders: (tenantId?: string, branchId?: string | null) => 
    ["serviceOrders", tenantId, branchId].filter(Boolean),
  serviceOrderEtapas: (orderId?: string) => 
    ["serviceOrderEtapas", orderId].filter(Boolean),
  
  // Other
  customers: (tenantId?: string, branchId?: string | null) => 
    ["customers", tenantId, branchId].filter(Boolean),
  suppliers: (tenantId?: string) => 
    ["suppliers", tenantId].filter(Boolean),
  teams: (tenantId?: string, branchId?: string | null) => 
    ["teams", tenantId, branchId].filter(Boolean),
  invoices: (tenantId?: string) => 
    ["invoices", tenantId].filter(Boolean),
  fiscalNotes: (tenantId?: string) => 
    ["fiscalNotes", tenantId].filter(Boolean),
  notifications: (tenantId?: string) => 
    ["notifications", tenantId].filter(Boolean),
} as const;

/**
 * Helper to invalidate related queries after mutations
 */
export const invalidationGroups = {
  stock: ["products", "serialNumbers", "stockMovements", "stockAudits"],
  fleet: ["vehicles", "fuelLogs", "maintenances"],
  hr: ["employees", "leaves", "vacations", "payrolls"],
  obras: ["obras", "obraEtapas", "diarioObras"],
  serviceOrders: ["serviceOrders", "serviceOrderEtapas"],
} as const;
