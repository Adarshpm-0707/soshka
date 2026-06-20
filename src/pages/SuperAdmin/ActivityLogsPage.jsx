import React, { useState, useEffect } from 'react';
import { adminLogService } from '../../services/adminLogService';
import { supabase } from '../../lib/supabaseClient';
import { Activity, Search, Calendar, Filter, Loader2, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters state
  const [actionFilter, setActionFilter] = useState('');
  const [targetTableFilter, setTargetTableFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expandable details slot
  const [expandedLogs, setExpandedLogs] = useState({});

  // Actors list for filter dropdown
  const [actorsList, setActorsList] = useState([]);

  const fetchActors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('role', ['admin', 'superadmin']);
      if (error) throw error;
      setActorsList(data || []);
    } catch (err) {
      console.error('Error fetching admin profiles for filters:', err);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (actionFilter) filters.action = actionFilter;
      if (targetTableFilter) filters.targetTable = targetTableFilter;
      if (actorFilter) filters.actorId = actorFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await adminLogService.fetchLogs(filters, page, limit);
      setLogs(result.logs || []);
      setCount(result.count || 0);
    } catch (err) {
      console.error('Error loading activity logs:', err);
      showToast('Error loading activity audit trails.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActors();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, targetTableFilter, actorFilter, startDate, endDate]);

  const toggleDetails = (id) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Security Audit Logs</h1>
        <p className="text-slate-450 text-xs mt-1 font-semibold">
          Audit trail: read-only records of all administrator and super administrator mutations.
        </p>
      </div>

      {/* Filters Accordion/Bar */}
      <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
          <Filter size={14} className="text-[#ff2a85]" />
          <span>Filter Records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 text-xs">
          {/* Action Filter */}
          <div className="flex flex-col space-y-1">
            <label className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px]">Operation Type</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-[#26262a] text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-[#ff2a85]"
            >
              <option value="">All Operations</option>
              <option value="created_admin">created_admin</option>
              <option value="activated_admin">activated_admin</option>
              <option value="deactivated_admin">deactivated_admin</option>
              <option value="updated_admin_role">updated_admin_role</option>
              <option value="deleted_admin">deleted_admin</option>
              <option value="deleted_product">deleted_product</option>
              <option value="updated_order_status">updated_order_status</option>
              <option value="updated_payment_settings">updated_payment_settings</option>
            </select>
          </div>

          {/* Target Table */}
          <div className="flex flex-col space-y-1">
            <label className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px]">Affected Table</label>
            <select
              value={targetTableFilter}
              onChange={(e) => { setTargetTableFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-[#26262a] text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-[#ff2a85]"
            >
              <option value="">All Tables</option>
              <option value="profiles">profiles (Admins)</option>
              <option value="products">products (Catalogue)</option>
              <option value="orders">orders (Sales)</option>
              <option value="payment_settings">payment_settings (Billing)</option>
              <option value="offers">offers (Campaigns)</option>
              <option value="categories">categories (Taxonomy)</option>
            </select>
          </div>

          {/* Actor Dropdown */}
          <div className="flex flex-col space-y-1">
            <label className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px]">Responsible Actor</label>
            <select
              value={actorFilter}
              onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-[#26262a] text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-[#ff2a85]"
            >
              <option value="">All Operators</option>
              {actorsList.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name || actor.email}
                </option>
              ))}
            </select>
          </div>

          {/* Date range filters */}
          <div className="flex flex-col space-y-1">
            <label className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px]">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-[#26262a] text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-[#ff2a85]"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px]">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-[#26262a] text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-[#ff2a85]"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Loading audit records...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
          No records match the current filter selection.
        </div>
      ) : (
        <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden space-y-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-4 px-6 w-[20%]">Timestamp</th>
                  <th className="py-4 px-6 w-[20%]">Operator Profile</th>
                  <th className="py-4 px-6 w-[20%]">Action Key</th>
                  <th className="py-4 px-6 w-[15%]">Table Affected</th>
                  <th className="py-4 px-6 w-[15%]">Target Ref ID</th>
                  <th className="py-4 px-6 w-[10%] text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                {logs.map((log) => {
                  const isExpanded = !!expandedLogs[log.id];
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-105 font-bold block">{log.profile?.name || 'System Actor'}</span>
                          <span className="text-[10px] text-slate-500 block font-normal">{log.profile?.email || 'automated@soshka.com'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-pink-400 text-[10px] uppercase font-bold font-mono border border-[#ff2a85]/10">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-405 font-mono">
                          {log.target_table}
                        </td>
                        <td className="py-4 px-6 font-mono text-[10px] text-slate-500 select-all">
                          {log.target_id || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => toggleDetails(log.id)}
                            className="p-1.5 rounded bg-slate-950 hover:bg-[#ff2a85]/10 text-slate-400 hover:text-pink-400 border border-[#26262a] hover:border-[#ff2a85]/20 transition-all"
                            title="Expand Payload Parameters"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-955/50 px-8 py-4 border-t border-b border-[#1c1c1e]">
                            <div className="bg-slate-950 border border-[#26262a] p-4 rounded-xl font-mono text-[11px] text-slate-350 leading-relaxed overflow-x-auto">
                              <p className="font-extrabold text-[#ff2a85] mb-2 uppercase text-[9px] tracking-widest">Metadata Payload JSON</p>
                              <pre className="select-all">{JSON.stringify(log.details || {}, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 pt-4 border-t border-[#1c1c1e] text-xs">
              <span className="text-slate-500 font-bold">
                Showing logs page {page} of {totalPages} ({count} total records)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-[#26262a] hover:bg-white/5 transition font-extrabold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-[#26262a] hover:bg-white/5 transition font-extrabold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLogsPage;