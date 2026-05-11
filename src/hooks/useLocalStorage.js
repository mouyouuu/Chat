import { useCallback, useEffect, useState } from 'react';
import { clearEncryptedItem, loadEncryptedItem, saveEncryptedItem } from '../utils/storage';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let mounted = true;

    loadEncryptedItem(key, initialValue)
      .then((storedValue) => {
        if (mounted) {
          setValue(storedValue);
        }
      })
      .catch((error) => {
        if (mounted) {
          setStorageError(error.message);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [initialValue, key]);

  const saveValue = useCallback(
    async (nextValue) => {
      setValue(nextValue);
      await saveEncryptedItem(key, nextValue);
    },
    [key],
  );

  const clearValue = useCallback(async () => {
    clearEncryptedItem(key);
    setValue(initialValue);
  }, [initialValue, key]);

  return {
    value,
    setValue,
    saveValue,
    clearValue,
    isHydrated,
    storageError,
  };
}
