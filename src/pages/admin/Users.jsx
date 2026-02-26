import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Button from '@/components/ui/Button.jsx';
import { HiUsers, HiFilter, HiCheck, HiX, HiDownload, HiUserAdd, HiBriefcase, HiShieldCheck, HiChevronLeft, HiChevronRight, HiRefresh } from 'react-icons/hi';

export default function AdminUsers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState('');
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    if (!isAuthenticated || role !== 'admin') return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 20);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/users?${params.toString()}`);
      const users = data?.data?.users || [];
      const pg = data?.data?.pagination;
      setItems(users);
      setPages(pg?.pages || 1);
    } catch (e) {
      setError(e?.response?.data?.message || t('admin.users.loadError'));
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); /* eslint-disable-line */ }, [isAuthenticated, role, page, roleFilter, statusFilter]);

  const toggleActive = async (u, nextState) => {
    setUpdating(u._id);
    try {
      await api.put(`/admin/users/${u._id}/status`, { isActive: nextState, reason: nextState ? 'Reactivación' : 'Política de seguridad' });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('admin.users.updateError'));
    } finally { setUpdating(''); }
  };

  const updateRole = async (u, nextRole) => {
    setUpdating(u._id);
    try {
      await api.put(`/admin/users/${u._id}/role`, { role: nextRole });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('admin.users.roleChangeError'));
    } finally { setUpdating(''); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(u => u._id)));
    }
  };

  const bulkUpdateActive = async (nextState) => {
    if (!selected.size) return;
    setUpdating('bulk');
    try {
      await Promise.all(Array.from(selected).map(id => api.put(`/admin/users/${id}/status`, { isActive: nextState, reason: nextState ? 'Reactivación (masivo)' : 'Acción masiva admin' })));
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('admin.users.bulkError'));
    } finally { setUpdating(''); }
  };

  const exportCSV = () => {
    const headers = ['id','email','nombre','rol','estado'];
    const rows = items.map(u => [
      u._id,
      u.email || '',
      (u.profile?.firstName || '') + (u.profile?.lastName ? ' ' + u.profile.lastName : ''),
      u.role,
      u.isActive ? 'Activo' : 'Inactivo'
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_p${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleInfo = (r) => {
    const info = {
      client: { label: t('admin.users.roles.client'), icon: <HiUserAdd className="w-3.5 h-3.5" />, color: 'bg-brand-100 text-brand-700' },
      provider: { label: t('admin.users.roles.provider'), icon: <HiBriefcase className="w-3.5 h-3.5" />, color: 'bg-brand-100 text-brand-700' },
      admin: { label: t('admin.users.roles.admin'), icon: <HiShieldCheck className="w-3.5 h-3.5" />, color: 'bg-indigo-100 text-brand-700' },
    };
    return info[r] || { label: r, icon: null, color: 'bg-gray-100 text-gray-700' };
  };

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (role !== 'admin') return <Alert type="warning">{t('admin.users.adminOnly')}</Alert>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiUsers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{t('admin.users.title')}</h1>
              <p className="text-gray-300 text-sm">{t('admin.users.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all"
            >
              <HiDownload className="w-4 h-4" />
              {t('admin.users.exportCsv')}
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <HiFilter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{t('admin.users.filters.label')}:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">{t('admin.users.filters.allRoles')}</option>
              <option value="client">{t('admin.users.roles.client')}</option>
              <option value="provider">{t('admin.users.roles.provider')}</option>
              <option value="admin">{t('admin.users.roles.admin')}</option>
            </select>
            <select 
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('admin.users.filters.allStatuses')}</option>
              <option value="active">{t('admin.users.status.active')}</option>
              <option value="inactive">{t('admin.users.status.inactive')}</option>
            </select>
            {(roleFilter || statusFilter) && (
              <button 
                onClick={() => { setRoleFilter(''); setStatusFilter(''); }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('admin.users.filters.clear')}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-medium text-brand-700">
              {selected.size} {t('admin.users.bulk.selected', { count: selected.size })}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => bulkUpdateActive(true)}
                disabled={updating === 'bulk'}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {updating === 'bulk' ? <Spinner size="xs" /> : <HiCheck className="w-4 h-4" />}
                {t('admin.users.bulk.activate')}
              </button>
              <button 
                onClick={() => bulkUpdateActive(false)}
                disabled={updating === 'bulk'}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {updating === 'bulk' ? <Spinner size="xs" /> : <HiX className="w-4 h-4" />}
                {t('admin.users.bulk.deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={selected.size === items.length && items.length > 0} 
                onChange={selectAll} 
              />
              <span className="text-sm text-gray-600">{t('admin.users.selectAll')}</span>
            </label>
            {loading && <Spinner size="sm" />}
          </div>
        </div>

        {/* Users List */}
        <div className="divide-y divide-gray-100">
          {items.map(u => {
            const roleInfo = getRoleInfo(u.role);
            return (
              <div 
                key={u._id} 
                className={`p-4 transition-all hover:bg-gray-50 ${selected.has(u._id) ? 'bg-brand-50/50' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      checked={selected.has(u._id)} 
                      onChange={() => toggleSelect(u._id)} 
                    />
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-dark-600 to-dark-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(u.profile?.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {u.profile?.firstName} {u.profile?.lastName || ''}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Role Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
                      {roleInfo.icon}
                      {roleInfo.label}
                    </span>
                    {/* Status */}
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      u.isActive ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.isActive ? t('admin.users.status.active') : t('admin.users.status.inactive')}
                    </span>
                    {/* Role Selector */}
                    <select 
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                      disabled={updating === u._id} 
                      value={u.role} 
                      onChange={(e) => updateRole(u, e.target.value)}
                    >
                      <option value="client">{t('admin.users.roles.client')}</option>
                      <option value="provider">{t('admin.users.roles.provider')}</option>
                      <option value="admin">{t('admin.users.roles.admin')}</option>
                    </select>
                    {/* Action Button */}
                    {u.role !== 'admin' && (
                      u.isActive ? (
                        <button 
                          onClick={() => toggleActive(u, false)}
                          disabled={updating === u._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          {updating === u._id ? <Spinner size="xs" /> : <HiX className="w-3.5 h-3.5" />}
                          {t('admin.users.actions.deactivate')}
                        </button>
                      ) : (
                        <button 
                          onClick={() => toggleActive(u, true)}
                          disabled={updating === u._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          {updating === u._id ? <Spinner size="xs" /> : <HiCheck className="w-3.5 h-3.5" />}
                          {t('admin.users.actions.activate')}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!items.length && !loading && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HiUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">{t('admin.users.empty.title')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('admin.users.empty.subtitle')}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <HiChevronLeft className="w-4 h-4" />
                {t('admin.users.pagination.previous')}
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-linear-to-r from-dark-600 to-dark-700 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('admin.users.pagination.next')}
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
