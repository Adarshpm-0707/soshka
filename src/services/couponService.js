import { supabase } from '../lib/supabaseClient';

export const couponService = {
  /**
   * Validate coupon code against cart total and user usage history.
   * @param {string} code 
   * @param {number} cartTotal 
   * @param {string} userId 
   */
  async validateCoupon(code, cartTotal, userId, cartItems = []) {
    try {
      if (!code) {
        return { valid: false, error: 'Coupon code is required' };
      }

      // a. SELECT * FROM coupons WHERE code = code AND is_active = true
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (couponError) throw couponError;

      // b. If not found -> return { valid: false, error: 'Invalid coupon code' }
      if (!coupon) {
        return { valid: false, error: 'Invalid coupon code' };
      }

      // c. If expires_at < now() -> return { valid: false, error: 'Coupon expired' }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, error: 'Coupon expired' };
      }

      // Check product restriction if specified
      const restrictedProductIds = coupon.applicable_product_ids;
      let applicableSubtotal = cartTotal;

      if (Array.isArray(restrictedProductIds) && restrictedProductIds.length > 0) {
        if (!cartItems || cartItems.length === 0) {
          return { valid: false, error: 'Coupon is not applicable to any products in your cart' };
        }

        applicableSubtotal = cartItems.reduce((sum, item) => {
          const product = item.product || item;
          const pId = item.product_id || item.product?.id || item.id;

          if (pId && restrictedProductIds.includes(pId)) {
            const originalPrice = product.original_price ?? product.price ?? 0;
            const offerPrice = product.offer_price;
            const isOfferActive = !!(offerPrice && Number(offerPrice) > 0);
            const unitPrice = isOfferActive ? Number(offerPrice) : Number(originalPrice);
            const qty = Number(item.quantity || item.qty || 1);
            return sum + unitPrice * qty;
          }
          return sum;
        }, 0);

        if (applicableSubtotal <= 0) {
          return { valid: false, error: 'Coupon is not applicable to any products in your cart' };
        }
      }

      // d. If min_order_amount > applicableSubtotal -> return { valid: false, error: `Min order ₹${min_order_amount} required` }
      const minAmount = Number(coupon.min_order_amount) || 0;
      if (minAmount > applicableSubtotal) {
        return { valid: false, error: `Min order ₹${minAmount} required for eligible items` };
      }

      // e. If max_uses NOT NULL AND used_count >= max_uses -> return { valid: false, error: 'Coupon limit reached' }
      if (coupon.max_uses !== null && coupon.max_uses !== undefined && coupon.used_count >= coupon.max_uses) {
        return { valid: false, error: 'Coupon limit reached' };
      }

      // f. Check coupon_usage: if row exists for (coupon_id, user_id) -> return { valid: false, error: 'Already used' }
      if (userId) {
        const { data: usage, error: usageError } = await supabase
          .from('coupon_usage')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (usageError) throw usageError;

        if (usage) {
          return { valid: false, error: 'Already used' };
        }
      }

      // g. Calculate discount based on applicableSubtotal
      let discount = 0;
      const couponValue = Number(coupon.value) || 0;

      if (coupon.type === 'percentage') {
        discount = (couponValue / 100) * applicableSubtotal;
      } else if (coupon.type === 'flat') {
        discount = Math.min(couponValue, applicableSubtotal);
      }

      // Ensure discount is rounded to 2 decimal places and non-negative
      discount = Math.max(0, Number(discount.toFixed(2)));

      // h. Return { valid: true, discount, coupon }
      return { valid: true, discount, coupon };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, error: error.message || 'Error validating coupon' };
    }
  },

  /**
   * Record usage of a coupon for a given user and order, and increment used_count.
   * @param {string} couponId 
   * @param {string} userId 
   * @param {string} orderId 
   */
  async applyCouponToOrder(couponId, userId, orderId) {
    // a. INSERT into coupon_usage (coupon_id, user_id, order_id)
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId
      });

    if (usageError) throw usageError;

    // b. UPDATE coupons SET used_count = used_count + 1 WHERE id = couponId
    // Fetch current count to safely increment
    const { data: currentCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('used_count')
      .eq('id', couponId)
      .single();

    if (fetchError) throw fetchError;

    const newCount = (currentCoupon.used_count || 0) + 1;

    const { data, error: updateError } = await supabase
      .from('coupons')
      .update({ used_count: newCount })
      .eq('id', couponId)
      .select()
      .single();

    if (updateError) throw updateError;
    return data;
  },

  /**
   * Fetch all coupons (admin use only).
   */
  async fetchAllCoupons() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Create a new coupon (admin use only).
   * @param {Object} couponData 
   */
  async createCoupon(couponData) {
    const payload = {
      ...couponData,
      code: couponData.code ? couponData.code.trim().toUpperCase() : ''
    };

    const { data, error } = await supabase
      .from('coupons')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing coupon (admin use only).
   * @param {string} id 
   * @param {Object} couponData 
   */
  async updateCoupon(id, couponData) {
    const payload = { ...couponData };
    if (payload.code) {
      payload.code = payload.code.trim().toUpperCase();
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a coupon by ID (admin use only).
   * @param {string} id 
   */
  async deleteCoupon(id) {
    const { data, error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch all coupons for product selection.
   */
  async fetchCouponsForProduct(productId) {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return coupons || [];
  },

  /**
   * Sync coupons assigned to a product across products and coupons tables.
   * @param {string} productId 
   * @param {Array<string>} selectedCouponIds 
   */
  async syncProductCoupons(productId, selectedCouponIds = []) {
    if (!productId) return;

    // 1. Update product table
    await supabase
      .from('products')
      .update({ applicable_coupon_ids: selectedCouponIds })
      .eq('id', productId);

    // 2. Sync coupon records
    const { data: allCoupons } = await supabase
      .from('coupons')
      .select('id, applicable_product_ids');

    if (!allCoupons) return;

    for (const coupon of allCoupons) {
      const currentList = Array.isArray(coupon.applicable_product_ids) ? coupon.applicable_product_ids : [];
      const isSelected = selectedCouponIds.includes(coupon.id);
      const isCurrentlyIn = currentList.includes(productId);

      if (isSelected && !isCurrentlyIn) {
        const newList = [...currentList, productId];
        await supabase
          .from('coupons')
          .update({ applicable_product_ids: newList })
          .eq('id', coupon.id);
      } else if (!isSelected && isCurrentlyIn) {
        const newList = currentList.filter(id => id !== productId);
        await supabase
          .from('coupons')
          .update({ applicable_product_ids: newList })
          .eq('id', coupon.id);
      }
    }
  }
};

export default couponService;

