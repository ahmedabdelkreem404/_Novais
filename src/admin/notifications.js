import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LuBell, LuSend } from 'react-icons/lu';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const AdminNotifications = () => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    target: 'all',
    user_id: '',
    type: 'info',
    title: '',
    title_ar: '',
    body: '',
    body_ar: '',
    scheduled_at: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [notificationsRes, usersRes] = await Promise.all([
        axios.get(`${serverURL}/admin/notifications`, authConfig()),
        axios.get(`${serverURL}/admin/users`, authConfig()),
      ]);
      setItems(notificationsRes.data?.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load notifications'));
  }, []);

  const send = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    if (form.target === 'user' && !form.user_id) {
      toast.error('Select a target user');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        user_id: form.target === 'user' ? Number(form.user_id) : null,
      };
      const res = await axios.post(`${serverURL}/admin/notifications`, payload, authConfig());
      toast.success(`Notification queued for ${res.data.created_count || 1} user(s)`);
      setForm((current) => ({ ...current, title: '', title_ar: '', body: '', body_ar: '', scheduled_at: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
      <Card className="p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-2 text-white">
            <LuBell size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">Send Notification</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">API inbox, read/unread, scheduling, and mobile badges. FCM push requires Firebase config.</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Target</span>
            <select
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="all">All users</option>
              <option value="user">Specific user</option>
            </select>
          </label>

          {form.target === 'user' && (
            <label className="block space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">User</span>
              <select
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} ({user.email})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {['info', 'success', 'warning', 'error', 'payment', 'course', 'system'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Title English</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Title Arabic</span>
            <input
              value={form.title_ar}
              onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Body English</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Body Arabic</span>
            <textarea
              value={form.body_ar}
              onChange={(e) => setForm({ ...form, body_ar: e.target.value })}
              className="min-h-[90px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Schedule</span>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <Button onClick={send} disabled={saving} className="w-full gap-2">
            <LuSend size={18} />
            {saving ? 'Sending...' : 'Send notification'}
          </Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-black text-gray-900 dark:text-white">Recent Notifications</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            {items.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
                  <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase text-blue-600 dark:text-blue-300">
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.body}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {item.is_broadcast ? 'Broadcast' : item.user?.email || 'User'} - {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminNotifications;
