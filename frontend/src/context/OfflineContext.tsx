import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  offlineData: any;
  saveOfflineData: (key: string, data: any) => void;
  getOfflineData: (key: string) => any;
  clearOfflineData: (key?: string) => void;
  pendingActions: any[];
  addPendingAction: (action: any) => void;
  processPendingActions: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  offlineData: {},
  saveOfflineData: () => {},
  getOfflineData: () => null,
  clearOfflineData: () => {},
  pendingActions: [],
  addPendingAction: () => {},
  processPendingActions: async () => {},
});

export const useOffline = () => useContext(OfflineContext);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineData, setOfflineData] = useState<any>(() => {
    const storedData = localStorage.getItem('offlineData');
    return storedData ? JSON.parse(storedData) : {};
  });
  const [pendingActions, setPendingActions] = useState<any[]>(() => {
    const storedActions = localStorage.getItem('pendingActions');
    return storedActions ? JSON.parse(storedActions) : [];
  });

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save offline data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }, [offlineData]);

  // Save pending actions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Handle auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      processPendingActions();
    }
  }, [isOnline]);

  const saveOfflineData = (key: string, data: any) => {
    setOfflineData(prev => ({
      ...prev,
      [key]: data
    }));
  };

  const getOfflineData = (key: string) => {
    return offlineData[key] || null;
  };

  const clearOfflineData = (key?: string) => {
    if (key) {
      setOfflineData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    } else {
      setOfflineData({});
    }
  };

  const addPendingAction = (action: any) => {
    setPendingActions(prev => [...prev, action]);
  };

  const processPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const actions = [...pendingActions];
    setPendingActions([]);

    for (const action of actions) {
      try {
        // Process the action - in a real app, this would make API calls
        console.log('Processing action:', action);
        // await api.process(action);
      } catch (error) {
        console.error('Failed to process action:', error);
        // Add back to pending actions if failed
        addPendingAction(action);
      }
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        offlineData,
        saveOfflineData,
        getOfflineData,
        clearOfflineData,
        pendingActions,
        addPendingAction,
        processPendingActions,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
