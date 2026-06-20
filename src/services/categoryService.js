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
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await adminLogService.logAction(
      'created_category',
      'categories',
      data.id,
      { name, slug }
    );

    return data;
  },

  /**
   * Update an existing category.
   */
  async updateCategory(id, { name, slug }) {
    const { data, error } = await supabase
      .from('categories')
      .update({ name, slug })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log action
    await adminLogService.logAction(
      'updated_category',
      'categories',
      id,
      { name, slug }
    );

    return data;
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
