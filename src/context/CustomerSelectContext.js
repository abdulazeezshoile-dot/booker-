import React, { createContext, useContext, useState } from 'react';

const CustomerSelectContext = createContext();

export function CustomerSelectProvider({ children }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  return (
    <CustomerSelectContext.Provider value={{ selectedCustomer, setSelectedCustomer }}>
      {children}
    </CustomerSelectContext.Provider>
  );
}

export function useCustomerSelect() {
  return useContext(CustomerSelectContext);
}
