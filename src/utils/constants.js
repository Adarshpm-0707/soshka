export const APP_NAME = 'Soshka Store';

export const CATEGORIES = [
  { id: 'rings', name: 'Rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60' },
  { id: 'necklaces', name: 'Necklaces & Pendants', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60' },
  { id: 'earrings', name: 'Earrings', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=60' },
  { id: 'bracelets', name: 'Bracelets & Bangles', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&auto=format&fit=crop&q=60' },
  { id: 'chains', name: 'Chains', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&auto=format&fit=crop&q=60' }
];

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const SHIPPING_CHARGES = 99; // Flat shipping in INR
export const FREE_SHIPPING_THRESHOLD = 999; // Free shipping threshold in INR
export const TAX_RATE = 0.18; // 18% GST
