import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { get, set, del, createStore } from 'idb-keyval'

// Custom store for offline data
const offlineStore = createStore('qc-standards-offline', 'offline-store')

interface OfflineContextType {
  isOnline: boolean
  isPendingSync: boolean
  lastSyncTime: Date | null
  syncData: () => Promise<void>
  saveOfflineData: (key: string, data: any) => Promise<void>
  getOfflineData: <T>(key: string) => Promise<T | null>
  removeOfflineData: (key: string) => Promise<void>
  pendingSyncCount: number
}

const OfflineContext = createContext<OfflineContextType | null>(null)

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}

interface OfflineProviderProps {
  children: ReactNode
}

export const OfflineProvider = ({ children }: OfflineProviderProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isPendingSync, setIsPendingSync] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  // Load last sync time from localStorage
  useEffect(() => {
    const storedSyncTime = localStorage.getItem('lastSyncTime')
    if (storedSyncTime) {
      setLastSyncTime(new Date(storedSyncTime))
    }

    // Check for pending sync items
    const checkPendingSync = async () => {
      try {
        const syncQueue = await get('syncQueue', offlineStore) || []
        setPendingSyncCount(syncQueue.length)
      } catch (error) {
        console.error('Error checking pending sync:', error)
      }
    }

    checkPendingSync()
  }, [])

  // Set up online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Attempt to sync when coming back online
      syncData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Save offline data to IndexedDB
  const saveOfflineData = async (key: string, data: any) => {
    try {
      await set(key, data, offlineStore)
    } catch (error) {
      console.error('Error saving offline data:', error)
      throw error
    }
  }

  // Get offline data from IndexedDB
  const getOfflineData = async <T,>(key: string): Promise<T | null> => {
    try {
      return await get(key, offlineStore)
    } catch (error) {
      console.error('Error getting offline data:', error)
      return null
    }
  }

  // Remove offline data from IndexedDB
  const removeOfflineData = async (key: string) => {
    try {
      await del(key, offlineStore)
    } catch (error) {
      console.error('Error removing offline data:', error)
      throw error
    }
  }

  // Sync data with server
  const syncData = async () => {
    if (!isOnline) {
      return
    }

    setIsPendingSync(true)

    try {
      // Get sync queue from IndexedDB
      const syncQueue = await get('syncQueue', offlineStore) || []
      
      if (syncQueue.length === 0) {
        setIsPendingSync(false)
        return
      }

      // Process each item in the queue
      const remainingItems = [];
      
      for (const item of syncQueue) {
        try {
          // Execute the API call
          await fetch(item.url, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
              ...(item.headers || {}),
            },
            body: item.body ? JSON.stringify(item.body) : undefined,
          })
          
          // If there was specific local data related to this sync item, clean it up
          if (item.localDataKey) {
            await removeOfflineData(item.localDataKey)
          }
        } catch (error) {
          console.error('Error syncing item:', error)
          // Keep failed items in the queue to retry later
          remainingItems.push(item)
        }
      }

      // Update the sync queue with remaining items
      await set('syncQueue', remainingItems, offlineStore)
      setPendingSyncCount(remainingItems.length)
      
      // Update last sync time
      const now = new Date()
      localStorage.setItem('lastSyncTime', now.toISOString())
      setLastSyncTime(now)
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setIsPendingSync(false)
    }
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isPendingSync,
        lastSyncTime,
        syncData,
        saveOfflineData,
        getOfflineData,
        removeOfflineData,
        pendingSyncCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}
