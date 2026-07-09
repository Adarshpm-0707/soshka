import { supabase } from "../lib/supabaseClient";

export const adminLogService = {
  /**
   * Log an administrator or superadministrator action.
   * Grabs the logged-in user dynamically to assign actor_id.
   */
  async logAction(action, targetTable, targetId = null, details = null) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const actorId = user?.id;

      // Prepare payload
      const payload = {
        actor_id: actorId || null,
        action,
        target_table: targetTable,
        target_id: targetId || null,
        details: details || null,
      };

      const { error } = await supabase.from("admin_logs").insert(payload);

      if (error) throw error;
    } catch (err) {
      console.error("Error writing admin action log:", err.message);
      // Suppress logging errors to avoid blocking the primary mutation flow
    }
  },

  /**
   * Fetch action logs with filters and pagination.
   */
  async fetchLogs(filters = {}, page = 1, limit = 20) {
    let query = supabase
      .from("admin_logs")
      .select("*, profile:profiles(email, name)", { count: "exact" });

    if (filters.action) {
      query = query.eq("action", filters.action);
    }
    if (filters.targetTable) {
      query = query.eq("target_table", filters.targetTable);
    }
    if (filters.actorId) {
      query = query.eq("actor_id", filters.actorId);
    }
    if (filters.startDate) {
      query = query.gte(
        "created_at",
        new Date(filters.startDate).toISOString(),
      );
    }
    if (filters.endDate) {
      query = query.lte("created_at", new Date(filters.endDate).toISOString());
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      logs: data || [],
      count: count || 0,
    };
  },
};
