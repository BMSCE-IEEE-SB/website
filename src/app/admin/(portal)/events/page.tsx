'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Edit, Plus, Trash2, MapPin, Clock, Tag } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import {
  getAdminUser,
  loadAdminEvents,
  saveAdminEvent,
  deleteAdminEvent,
  type AdminEvent,
} from '@/lib/auth';
import { Alert, Field, Input, Modal, PageLoader, Select, Spinner } from '@/components/ui/form';
import { errorMessage } from '@/lib/utils';
import { adminFetch } from '@/lib/admin-api';

const emptyEvent: AdminEvent = {
  id: '',
  title: '',
  category: 'workshop',
  chapter: 'branch',
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  venue: 'BMSCE Campus',
  image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=600&fit=crop&auto=format&q=70',
  description: '',
  registration_url: '#',
  is_featured: false,
};

const chapters = [
  { code: 'branch', name: 'Branch Sitewide' },
  { code: 'cs', name: 'Computer Society' },
  { code: 'pes', name: 'Power & Energy Society' },
  { code: 'pels-ies', name: 'PELS & IES Joint Chapter' },
  { code: 'wie', name: 'Women in Engineering' },
  { code: 'ssit', name: 'Social Implications of Tech' },
];

export default function AdminEventsPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [adminEmail, setAdminEmail] = useState('');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const showToast = (tone: 'success' | 'error', text: string) => {
    setToast({ tone, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      let list: AdminEvent[];
      if (demo) list = await loadAdminEvents();
      else {
        const response = await adminFetch('/api/admin/events');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load events.');
        list = result.events;
      }
      setEvents(list);
    } catch (err) {
      showToast('error', `Failed to load events: ${errorMessage(err)}`);
    }
  }, [demo]);

  useEffect(() => {
    (async () => {
      const admin = await getAdminUser().catch(() => null);
      if (!admin) {
        router.replace('/admin/login');
        return;
      }
      setAdminEmail(admin.email);
      await load();
      setIsLoading(false);
    })();
  }, [router, load]);

  const openCreate = () => {
    setIsNew(true);
    setEditingEvent({
      ...emptyEvent,
      id: `evt-${Date.now().toString(36)}`,
    });
  };

  const openEdit = (e: AdminEvent) => {
    setIsNew(false);
    setEditingEvent({ ...e });
  };

  const closeEditor = () => {
    setEditingEvent(null);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;
    if (!editingEvent.title.trim() || !editingEvent.venue.trim()) {
      showToast('error', 'Please enter a title and venue.');
      return;
    }
    setIsSaving(true);
    try {
      if (demo) await saveAdminEvent(editingEvent);
      else {
        const response = await adminFetch('/api/admin/events', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingEvent) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not save event.');
      }
      showToast('success', `${editingEvent.title} saved successfully.`);
      closeEditor();
      await load();
    } catch (err) {
      showToast('error', `Could not save event: ${errorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      if (demo) await deleteAdminEvent(id);
      else {
        const response = await adminFetch(`/api/admin/events?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not delete event.');
      }
      showToast('success', `Deleted "${title}".`);
      await load();
    } catch (err) {
      showToast('error', `Could not delete: ${errorMessage(err)}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="pb-10">
      <div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="display text-4xl text-ink sm:text-5xl">Events & Hackathons</h1>
            <p className="mt-2 text-sm text-muted">
              Add, update, or schedule branch technical workshops, IEEEXtreme, and society summits.
            </p>
          </div>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Add Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="panel mt-8 p-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 font-semibold text-ink">No events found</p>
            <p className="mt-1 text-sm text-muted">Create the first workshop or hackathon for this session.</p>
            <button type="button" onClick={openCreate} className="btn btn-dark mt-4">
              <Plus className="h-4 w-4" /> Create Event
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => (
              <div key={evt.id} className="panel flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative h-44 w-full bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={evt.image} alt={evt.title} className="h-full w-full object-cover" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-night/85 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur">
                      {evt.category}
                    </span>
                    {evt.is_featured && (
                      <span className="rounded-full bg-brand-orange px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-navy">
                    <Tag className="h-3 w-3" />
                    <span>{chapters.find((c) => c.code === evt.chapter)?.name ?? evt.chapter}</span>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-ink line-clamp-1">{evt.title}</h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-soft line-clamp-2">
                    {evt.description}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span>{evt.date} {evt.time ? `· ${evt.time}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(evt)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:text-brand-orange"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === evt.id}
                      onClick={() => handleDelete(evt.id, evt.title)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      {deletingId === evt.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingEvent && (
          <Modal title={isNew ? 'Create New Event' : `Edit: ${editingEvent.title}`} onClose={closeEditor} wide>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Event Title" htmlFor="evt-title" required>
                  <Input
                    id="evt-title"
                    required
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    placeholder="IEEEXtreme 20.0 Hackathon"
                  />
                </Field>

                <Field label="Category" htmlFor="evt-cat" required>
                  <Select
                    id="evt-cat"
                    required
                    value={editingEvent.category}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        category: e.target.value as AdminEvent['category'],
                      })
                    }
                  >
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="summit">Summit</option>
                    <option value="talk">Technical Talk</option>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Host Chapter / Group" htmlFor="evt-ch" required>
                  <Select
                    id="evt-ch"
                    required
                    value={editingEvent.chapter}
                    onChange={(e) => setEditingEvent({ ...editingEvent, chapter: e.target.value })}
                  >
                    {chapters.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Venue / Location" htmlFor="evt-venue" required>
                  <Input
                    id="evt-venue"
                    required
                    value={editingEvent.venue}
                    onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                    placeholder="BMSCE Main Auditorium"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Event Date" htmlFor="evt-date" required>
                  <Input
                    id="evt-date"
                    type="date"
                    required
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  />
                </Field>

                <Field label="Start Time" htmlFor="evt-time" optional>
                  <Input
                    id="evt-time"
                    type="time"
                    value={editingEvent.time ?? '10:00'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Image URL" htmlFor="evt-img" required hint="Direct image link (Unsplash or hosted banner).">
                <Input
                  id="evt-img"
                  type="url"
                  required
                  value={editingEvent.image}
                  onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </Field>

              <Field label="Description" htmlFor="evt-desc" required>
                <textarea
                  id="evt-desc"
                  rows={3}
                  required
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="input resize-none"
                  placeholder="Summary of the event, learning outcomes, and schedule..."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="External Registration Link" htmlFor="evt-reg" optional hint="Leave '#' if internal or free.">
                  <Input
                    id="evt-reg"
                    value={editingEvent.registration_url ?? '#'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, registration_url: e.target.value })}
                    placeholder="https://forms.gle/... or #"
                  />
                </Field>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="evt-feat"
                    checked={editingEvent.is_featured ?? false}
                    onChange={(e) => setEditingEvent({ ...editingEvent, is_featured: e.target.checked })}
                    className="h-4 w-4 rounded border-line text-brand-navy focus:ring-brand-navy"
                  />
                  <label htmlFor="evt-feat" className="text-sm font-medium text-ink">
                    Highlight as Featured Event on landing page
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-line pt-4">
                <button type="button" onClick={closeEditor} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-dark">
                  {isSaving && <Spinner />}
                  {isNew ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {toast && (
          <div className="fixed inset-x-4 bottom-4 z-[70] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm">
            <Alert tone={toast.tone} className="shadow-xl">
              {toast.text}
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
