import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Basket Context
const BasketContext = createContext();

// Initial state
const initialState = {
  items: [],
  isOpen: false,
  totalItems: 0,
  totalPrice: 0,
  userId: null,
  isInitialized: false,
};

// Action types
const BASKET_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  UPDATE_NOTE: 'UPDATE_NOTE',
  CLEAR_BASKET: 'CLEAR_BASKET',
  TOGGLE_BASKET: 'TOGGLE_BASKET',
  LOAD_BASKET: 'LOAD_BASKET',
  SET_USER: 'SET_USER',
  RESET_BASKET: 'RESET_BASKET',
  SET_INITIALIZED: 'SET_INITIALIZED',
};

// Generate unique ID for basket items
const generateItemId = (item) => {
  let id = '';
  
  if (item.type === 'plat') {
    id = `plat-${item.plat.id}`;
    if (item.version && item.version.id) {
      id += `-version-${item.version.id}`;
    } else if (item.version && item.version.size) {
      id += `-size-${item.version.size.replace(/\s+/g, '-').toLowerCase()}`;
    }
    if (item.sauce && item.sauce.id) {
      id += `-sauce-${item.sauce.id}`;
    }
    if (item.extras && item.extras.length > 0) {
      const extraIds = item.extras.map(e => e.id || e.nom).sort().join('-');
      id += `-extras-${extraIds}`;
    }
    if (item.removedIngredients && item.removedIngredients.length > 0) {
      const ingredientIds = item.removedIngredients.map(i => i.id || i.name).sort().join('-');
      id += `-removed-${ingredientIds}`;
    }
  } else if (item.type === 'sauce') {
    id = `sauce-${item.sauce.id || item.sauce.name}`;
  } else if (item.type === 'extra') {
    id = `extra-${item.extra.id || item.extra.nom}`;
  }
  
  return id;
};

// Calculate item price
const calculateItemPrice = (item) => {
  let price = 0;
  
  if (item.type === 'plat') {
    price = item.plat.price;
    if (item.version) price += item.version.extraPrice;
    if (item.sauce && item.plat.saucePrice > 0) price += item.plat.saucePrice;
    if (item.extras) {
      price += item.extras.reduce((sum, extra) => sum + extra.price, 0);
    }
  } else if (item.type === 'sauce') {
    price = item.sauce.price;
  } else if (item.type === 'extra') {
    price = item.extra.price;
  }
  
  return price * item.quantity;
};

// Storage utilities
const getBasketStorageKey = (userId) => {
  return userId ? `lmi3-basket-user-${userId}` : 'lmi3-basket-guest';
};

const saveBasketToStorage = (items, userId) => {
  try {
    const storageKey = getBasketStorageKey(userId);
    console.log('Saving basket to storage:', { storageKey, itemCount: items.length });
    if (items.length === 0) {
      localStorage.removeItem(storageKey);
      console.log('Removed empty basket from storage');
    } else {
      localStorage.setItem(storageKey, JSON.stringify(items));
      console.log('Saved basket items to storage');
    }
  } catch (error) {
    console.error('Error saving basket to localStorage:', error);
  }
};

const loadBasketFromStorage = (userId) => {
  try {
    const storageKey = getBasketStorageKey(userId);
    const savedBasket = localStorage.getItem(storageKey);
    return savedBasket ? JSON.parse(savedBasket) : [];
  } catch (error) {
    console.error('Error loading basket from localStorage:', error);
    return [];
  }
};

const clearAllBasketStorage = () => {
  try {
    localStorage.removeItem('lmi3-basket-guest');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('lmi3-basket-user-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing basket storage:', error);
  }
};

// Reducer
const basketReducer = (state, action) => {
  switch (action.type) {
    case BASKET_ACTIONS.ADD_ITEM: {
      const newItem = action.payload;
      const itemId = generateItemId(newItem);
      
      const existingItemIndex = state.items.findIndex(item => 
        generateItemId(item) === itemId
      );
      
      let newItems;
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      } else {
        newItems = [...state.items, { ...newItem, id: itemId }];
      }
      
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      
      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      };
    }
    
    case BASKET_ACTIONS.REMOVE_ITEM: {
      const itemId = action.payload;
      console.log('Removing item from basket:', itemId);
      const newItems = state.items.filter(item => item.id !== itemId);
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      
      console.log('Item removed. New basket:', { itemCount: newItems.length, totalItems, totalPrice });
      
      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      };
    }
    
    case BASKET_ACTIONS.UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return basketReducer(state, { type: BASKET_ACTIONS.REMOVE_ITEM, payload: itemId });
      }
      
      const newItems = state.items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      
      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case BASKET_ACTIONS.UPDATE_NOTE: {
      const { itemId, notes } = action.payload;
      
      const newItems = state.items.map(item => 
        item.id === itemId ? { ...item, notes } : item
      );
      
      return {
        ...state,
        items: newItems,
      };
    }
    
    case BASKET_ACTIONS.CLEAR_BASKET: {
      console.log('Clearing entire basket');
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };
    }
    
    case BASKET_ACTIONS.RESET_BASKET: {
      return {
        ...initialState,
        userId: null,
        isInitialized: true,
      };
    }
    
    case BASKET_ACTIONS.TOGGLE_BASKET: {
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    }
    
    case BASKET_ACTIONS.LOAD_BASKET: {
      const items = action.payload || [];
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      
      return {
        ...state,
        items,
        totalItems,
        totalPrice,
      };
    }
    
    case BASKET_ACTIONS.SET_USER: {
      const { userId, shouldClearBasket } = action.payload;
      
      if (shouldClearBasket) {
        return {
          ...initialState,
          userId,
          isInitialized: true,
        };
      }
      
      return {
        ...state,
        userId,
      };
    }
    
    case BASKET_ACTIONS.SET_INITIALIZED: {
      return {
        ...state,
        isInitialized: true,
      };
    }
    
    default:
      return state;
  }
};

// Provider component
export const BasketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(basketReducer, initialState);
  
  // Initialize basket only once on app start
  useEffect(() => {
    const initializeBasket = () => {
      try {
        const token = localStorage.getItem('authToken');
        let userId = null;
        
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId;
          } catch (e) {
            console.error('Invalid token format:', e);
            localStorage.removeItem('authToken');
          }
        }
        
        const items = loadBasketFromStorage(userId);
        
        dispatch({ type: BASKET_ACTIONS.SET_USER, payload: { userId, shouldClearBasket: false } });
        dispatch({ type: BASKET_ACTIONS.LOAD_BASKET, payload: items });
        dispatch({ type: BASKET_ACTIONS.SET_INITIALIZED });
      } catch (error) {
        console.error('Error initializing basket:', error);
        const items = loadBasketFromStorage(null);
        dispatch({ type: BASKET_ACTIONS.SET_USER, payload: { userId: null, shouldClearBasket: false } });
        dispatch({ type: BASKET_ACTIONS.LOAD_BASKET, payload: items });
        dispatch({ type: BASKET_ACTIONS.SET_INITIALIZED });
      }
    };
    
    initializeBasket();
  }, []); // No dependencies - only run once

  // Save to storage function (only called when basket content changes)
  const saveBasket = useCallback(() => {
    if (state.isInitialized) {
      saveBasketToStorage(state.items, state.userId);
    }
  }, [state.items, state.userId, state.isInitialized]);

  // Auto-save whenever basket items change
  useEffect(() => {
    if (state.isInitialized) {
      saveBasket();
    }
  }, [state.items, saveBasket]);

  // User management functions
  const handleLogin = useCallback((userId) => {
    // When logging in, preserve current basket and associate with user
    dispatch({ type: BASKET_ACTIONS.SET_USER, payload: { userId, shouldClearBasket: false } });
    // Save current basket under new user
    if (state.isInitialized) {
      saveBasketToStorage(state.items, userId);
    }
  }, [state.items, state.isInitialized]);
  
  const handleLogout = useCallback(() => {
    // Clear basket and switch to guest
    dispatch({ type: BASKET_ACTIONS.SET_USER, payload: { userId: null, shouldClearBasket: true } });
  }, []);

  const handleAuthChange = useCallback((newUserId) => {
    if (newUserId !== state.userId) {
      if (newUserId) {
        handleLogin(newUserId);
      } else {
        handleLogout();
      }
    }
  }, [state.userId, handleLogin, handleLogout]);
  
  // Basket action functions
  const addToBasket = useCallback((item) => {
    dispatch({ type: BASKET_ACTIONS.ADD_ITEM, payload: item });
  }, []);
  
  const removeFromBasket = useCallback((itemId) => {
    dispatch({ type: BASKET_ACTIONS.REMOVE_ITEM, payload: itemId });
  }, []);
  
  const updateQuantity = useCallback((itemId, quantity) => {
    dispatch({ type: BASKET_ACTIONS.UPDATE_QUANTITY, payload: { itemId, quantity } });
  }, []);

  const updateItemNote = useCallback((itemId, notes) => {
    dispatch({ type: BASKET_ACTIONS.UPDATE_NOTE, payload: { itemId, notes } });
  }, []);
  
  const clearBasket = useCallback(() => {
    dispatch({ type: BASKET_ACTIONS.CLEAR_BASKET });
  }, []);
  
  const resetBasket = useCallback(() => {
    clearAllBasketStorage();
    dispatch({ type: BASKET_ACTIONS.RESET_BASKET });
  }, []);
  
  const toggleBasket = useCallback(() => {
    dispatch({ type: BASKET_ACTIONS.TOGGLE_BASKET });
    // Don't save for UI state changes
  }, []);
  
  const setUser = useCallback((userId, shouldClearBasket = false) => {
    if (shouldClearBasket) {
      dispatch({ type: BASKET_ACTIONS.SET_USER, payload: { userId, shouldClearBasket: true } });
    } else {
      handleLogin(userId);
    }
  }, [handleLogin]);
  
  // Helper functions
  const getItemDisplayName = useCallback((item) => {
    let name = '';
    
    if (item.type === 'plat') {
      name = item.plat.name;
      if (item.version) name += ` (${item.version.size})`;
    } else if (item.type === 'sauce') {
      name = item.sauce.name;
    } else if (item.type === 'extra') {
      name = item.extra.nom;
    }
    
    return name;
  }, []);
  
  const getItemDescription = useCallback((item) => {
    let description = [];
    
    if (item.type === 'plat') {
      if (item.sauce) {
        description.push(`Sauce: ${item.sauce.name}`);
      }
      if (item.extras && item.extras.length > 0) {
        description.push(`Extras: ${item.extras.map(e => e.nom).join(', ')}`);
      }
      if (item.removedIngredients && item.removedIngredients.length > 0) {
        description.push(`Sans: ${item.removedIngredients.map(i => i.name).join(', ')}`);
      }
    }
    
    return description.join(' | ');
  }, []);
  
  const value = {
    ...state,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    updateItemNote,
    clearBasket,
    resetBasket,
    toggleBasket,
    setUser,
    handleLogin,
    handleLogout,
    handleAuthChange,
    getItemDisplayName,
    getItemDescription,
    calculateItemPrice,
  };
  
  return (
    <BasketContext.Provider value={value}>
      {children}
    </BasketContext.Provider>
  );
};

// Custom hook to use basket context
export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
};





