export const APP_NAME = 'Soshka Store';

export const CATEGORIES = [
  { id: 'rings', name: 'Rings' },
  { id: 'necklaces', name: 'Necklaces & Pendants' },
  { id: 'earrings', name: 'Earrings' },
  { id: 'bracelets', name: 'Bracelets & Bangles' },
  { id: 'chains', name: 'Chains' }
];

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const SHIPPING_CHARGES = 0; // Flat shipping in INR (disabled)
export const FREE_SHIPPING_THRESHOLD = 0; // Free shipping threshold in INR (disabled)
export const TAX_RATE = 0.00; // GST rate (disabled)
