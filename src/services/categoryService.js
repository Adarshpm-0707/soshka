import { supabase } from '../lib/supabaseClient';
import { adminLogService } from './adminLogService';

export const categoryService = {
  /**
   * Fetch all categories ordered by name.
   */
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new category.
   */
  async createCategory({ name, slug }) {
    let res = null;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select();

    if (error) {
      console.warn('createCategory select error, falling back to direct insert:', error.message);
      const { error: directErr } = await supabase
        .from('categories')
        .insert({ name, slug });
      if (directErr) throw directErr;
      res = { name, slug };
    } else {
      res = data?.[0] || { name, slug };
    }

    // Log action
    if (res) {
      await adminLogService.logAction(
        'created_category',
        'categories',
        res.id || null,
        { name, slug }
      );
    }

    return res;
  },

  /**
   * Update an existing category.
   */
  async updateCategory(id, { name, slug }) {
    let res = null;
    const { data, error } = await supabase
      .from('categories')
      .update({ name, slug })
      .eq('id', id)
      .select();

    if (error) {
      console.warn('updateCategory select error, falling back to direct update:', error.message);
      const { error: directErr } = await supabase
        .from('categories')
        .update({ name, slug })
        .eq('id', id);
      if (directErr) throw directErr;
      res = { id, name, slug };
    } else {
      res = data?.[0] || { id, name, slug };
    }

    // Log action
    await adminLogService.logAction(
      'updated_category',
      'categories',
      id,
      { name, slug }
    );

    return res;
  },

  /**
   * Delete a category.
   */
  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log action
    await adminLogService.logAction(
      'deleted_category',
      'categories',
      id,
      null
    );

    return true;
  }
};
