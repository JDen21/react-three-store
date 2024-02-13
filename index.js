'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const ThreeStoreContext = createContext();

export function useThreeStore () {
  return useContext(ThreeStoreContext);
}

/**
 * @description Use to default storing to query params, react state and localstore consecutively
 * @param {Object} props
 * @param {JSX} props.children children of context
 * @param {Boolean} props.skipUrl skip storing to url query
 *  @param {Boolean} props.skipLocalStore skip storing to localStore
 * @param {Boolean} props.skipState skip storing to internal state
 * @param {Boolean} props.clearUrlParamsOnUnmount clear url query params that are is recognized by ThreeStore as a state it is managing
 * @param {Boolean} props.clearLocalStoreOnUnmount clear localstore values that are is recognized by ThreeStore as a state it is managing  
 * 
 * @example
 * parent.js
 * <ThreeStoreProvider> // * we can provide props skipUrl, skipState, skipLocalStore directly here which will make it apply to all store attempts down the component tree
 * {children}
 * </ThreeStoreProvider>
 * 
 * child.js
 * const { store, getStored, clearStored } = useThreeStore
 * store([key, value],  options) // * we can also apply skips to specific store action ex. options.skipUrl: true, options.skipState: true, options.SkipLocalStore: true
 * getStored(key) // * getStored function prioritizes getting data from url query, if value is null checks internal react state, then localstore. returns null if none
 * clearStored(key) // * optionally delete a specific key from all the three storages
 */
export default function ThreeStoreProvider ({
  children, 
  skipUrl, 
  skipLocalStore, 
  skipState, 
  clearUrlParamsOnUnmount, 
  clearLocalStoreOnUnmount
}) {
  const [storage, setStorage] = useState({});

  useEffect(() => {
    return () => {
      const cleanupKeys = Object.keys(storage);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        cleanupKeys.forEach(key => {
          url.searchParams.delete(key);
        });
        if (clearUrlParamsOnUnmount) {
          history.pushState({}, '', url);
        }  
      }
      cleanupKeys.forEach(key => {
        if (clearLocalStoreOnUnmount) {
          window.localStorage.delete(key);
        }
      });
    }
  }, []);

  /**
   * 
   * @param {Array[String]} storable index 0  for key, index 1 for value
   * @param {Object}} options locally decide if skipUrl or skipLocalStore
   */
  const store = useCallback(
    function store (storable, options) {
      options = options ?? {};
      if (!skipUrl && !options.skipUrl && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set(storable[0], storable[1]);
        history.pushState({}, '', url);
      }
      if (!skipState && !options.skipState) {
        setStorage(storage => 
          ({...storage, [storable[0]]: storable[1]}));
      }
      if (!skipLocalStore && !options.skipLocalStore) {
        window.localStorage.setItem(storable[0], storable[1]);
      }
    }, []
  );

  const getStored = useCallback(
    function (key) {
      // * priority: url, state, localstore
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const urlValue = url.searchParams.get(key);
        return urlValue;
      }
      const stateValue = storage[key];
      let localStoreValue;
      if (typeof window !== 'undefined') {
        localStoreValue = window.localStorage.getItem(key);
      }
      return stateValue || localStoreValue || null;
    }, []  
  );
  const clearStored = useCallback(
    function (key) {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete(key);
        history.pushState({}, '', url);
      }
      setStorage(storage => {
        const newStorage = { ...storage };
        delete newStorage[key];
        return newStorage;
      });

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    }, []
  )

  return (
    <ThreeStoreContext.Provider
      value={{store, getStored, clearStored}}
    >
      {children}
    </ThreeStoreContext.Provider>
  );
}
