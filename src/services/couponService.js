import { supabase } from '../lib/supabaseClient';

export const couponService = {
  /**
   * Validate coupon code against cart total and user usage history.
   * @param {string} code 
   * @param {number} cartTotal 
   * @param {string} userId 
   * @param {Array} cartItems
   * @param {string} userEmail
   */
  async validateCoupon(code, cartTotal, userId, cartItems = [], userEmail = null) {
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

      // e. If max_uses NOT NULL AND used_count >= max_uses -> return { valid: false, error: 'Coupon total limit reached' }
      if (coupon.max_uses !== null && coupon.max_uses !== undefined && coupon.used_count >= coupon.max_uses) {
        return { valid: false, error: 'Coupon total limit reached' };
      }

      // f. Check coupon_usage against max_uses_per_user (default = 1 use per customer)
      const maxPerUser = (coupon.max_uses_per_user !== null && coupon.max_uses_per_user !== undefined) ? Number(coupon.max_uses_per_user) : 1;

      if (userId || userEmail) {
        let usageQuery = supabase
          .from('coupon_usage')
          .select('id', { count: 'exact', head: false })
          .eq('coupon_id', coupon.id);

        if (userId && userEmail) {
          usageQuery = usageQuery.or(`user_id.eq.${userId},email.eq.${userEmail}`);
        } else if (userId) {
          usageQuery = usageQuery.eq('user_id', userId);
        } else if (userEmail) {
          usageQuery = usageQuery.eq('email', userEmail);
        }

        const { data: usageData, count: userUsageCount, error: usageError } = await usageQuery;

        if (usageError) console.warn('Error checking coupon_usage:', usageError);

        const usagesCount = userUsageCount ?? (usageData ? usageData.length : 0);

        if (usagesCount >= maxPerUser) {
          return { valid: false, error: 'You have already used this coupon code' };
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
   * @param {string} email
   */
  async applyCouponToOrder(couponId, userId, orderId, email = null) {
    try {
      // 1. Try calling the RPC function (handles atomic increment & coupon_usage insert for both logged-in and guest users)
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('increment_coupon_usage', {
        p_coupon_id: couponId,
        p_user_id: userId || null,
        p_order_id: orderId || null,
        p_email: email || null
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return rpcRes;
      }
    } catch (err) {
      console.warn('RPC increment_coupon_usage failed, trying direct fallback:', err);
    }

    // Fallback: Direct table operations
    if (userId || email) {
      const { error: usageError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          user_id: userId || null,
          order_id: orderId || null,
          email: email || null
        });

      if (usageError) console.warn('Direct coupon_usage insert error:', usageError);
    }

    const { data: currentCoupon } = await supabase
      .from('coupons')
      .select('used_count')
      .eq('id', couponId)
      .maybeSingle();

    if (currentCoupon) {
      const newCount = (currentCoupon.used_count || 0) + 1;
      const { data } = await supabase
        .from('coupons')
        .update({ used_count: newCount })
        .eq('id', couponId)
        .select()
        .maybeSingle();
      return data;
    }
    return null;
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

