// src/services/shiprocketService.js
// Dedicated service module for Shiprocket logistics, pickup, and tracking synchronization

export const shiprocketService = {
  /**
   * Dispatch an order to Shiprocket API for pickup scheduling and tracking generation
   * @param {Object} order The order object from Supabase DB
   * @returns {Promise<{success: boolean, shipment_id?: string, awb_code?: string, warning?: string, skipped?: boolean}>}
   */
  async dispatchOrder(order) {
    if (!order || !order.id) {
      throw new Error('Order details missing for Shiprocket dispatch.');
    }

    // Filter out test orders
    const email = (order.profile?.email || order.shipping_address?.email || '').toLowerCase();
    const name = (order.profile?.name || order.shipping_address?.name || '').toLowerCase();
    const orderIdStr = String(order.id).toLowerCase();

    if (
      email.includes('test@') ||
      email.includes('example.com') ||
      name.includes('test customer') ||
      orderIdStr.includes('test')
    ) {
      console.log(`[shiprocketService] Order ${order.id} is a test order. Skipping Shiprocket dispatch.`);
      return { success: false, skipped: true, message: 'Test orders are excluded from Shiprocket dispatch.' };
    }

    try {
      const response = await fetch('/api/shiprocket-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          email: order.profile?.email || order.shipping_address?.email || 'customer@soshka.in'
        })
      });

      const contentType = response.headers.get('content-type') || '';
      let data = {};

      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}));
      } else {
        const text = await response.text().catch(() => '');
        throw new Error(`Server returned status ${response.status}: ${text.slice(0, 80) || response.statusText}`);
      }

      if (response.ok && data.success) {
        return {
          success: true,
          shipment_id: data.shipment_id,
          awb_code: data.awb_code,
          warning: data.warning
        };
      } else {
        throw new Error(data.error || 'Failed to dispatch order to Shiprocket.');
      }
    } catch (err) {
      console.error('[shiprocketService] Dispatch error:', err);
      throw err;
    }
  }
};
