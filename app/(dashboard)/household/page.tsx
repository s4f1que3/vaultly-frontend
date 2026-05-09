'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, LogOut, Mail, Crown } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useHouseholdStore } from '@/stores/useHouseholdStore';

export default function HouseholdPage() {
  const {
    household, members, invites, role, pendingInvites, isLoading,
    fetchHousehold, createHousehold, inviteMember, acceptInvite, declineInvite,
    leaveHousehold, deleteHousehold, removeMember,
  } = useHouseholdStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchHousehold(); }, [fetchHousehold]);

  const handleCreate = async () => {
    if (!householdName.trim()) return;
    setActionLoading(true); setError('');
    try { await createHousehold(householdName.trim()); setCreateOpen(false); setHouseholdName(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setActionLoading(true); setError('');
    try { await inviteMember(inviteEmail.trim()); setInviteOpen(false); setInviteEmail(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Household"
        subtitle="Share budgets and track finances together"
        action={!household ? (
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            <Users size={15} /> Create Household
          </button>
        ) : role === 'owner' ? (
          <button onClick={() => setInviteOpen(true)} className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            <UserPlus size={15} /> Invite Member
          </button>
        ) : undefined}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-[var(--color-text-secondary)]">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Pending invites for this user */}
          {pendingInvites.length > 0 && (
            <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-accent)]/30">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Household Invitations</h3>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{inv.household?.name ?? 'A household'}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">You have been invited to join</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptInvite(inv.id)} className="bg-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-lg hover:bg-green-500/30">Accept</button>
                    <button onClick={() => declineInvite(inv.id)} className="bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/30">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!household ? (
            <div className="bg-[var(--color-bg-card)] rounded-2xl p-12 text-center border border-[var(--color-border)]">
              <Users size={40} className="mx-auto mb-4 text-[var(--color-text-secondary)] opacity-40" />
              <p className="text-[var(--color-text-secondary)] mb-4">Create a household to share budgets with a partner or family members.</p>
              <button onClick={() => setCreateOpen(true)} className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                Create Household
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{household.name}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                </div>
                {role === 'owner' ? (
                  <button onClick={() => deleteHousehold()} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                    <Trash2 size={12} /> Delete
                  </button>
                ) : (
                  <button onClick={() => leaveHousehold()} className="text-xs text-[var(--color-text-secondary)] hover:text-red-400 flex items-center gap-1">
                    <LogOut size={12} /> Leave
                  </button>
                )}
              </div>

              {/* Members */}
              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-sm font-bold">
                      {m.role === 'owner' ? <Crown size={14} className="text-yellow-400" /> : '👤'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{m.user_id.slice(0, 8)}…</p>
                      <p className="text-xs text-[var(--color-text-secondary)] capitalize">{m.role}</p>
                    </div>
                    {role === 'owner' && m.role !== 'owner' && (
                      <button onClick={() => removeMember(m.user_id)} className="text-[var(--color-text-secondary)] hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pending invites */}
              {invites.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">Pending Invites</p>
                  {invites.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-2 py-1.5">
                      <Mail size={13} className="text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">{inv.invited_email}</span>
                      <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); setError(''); }} title="Create Household">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Household name</label>
            <input value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder="e.g. Smith Family"
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleCreate} disabled={actionLoading || !householdName.trim()}
            className="w-full bg-[var(--color-accent)] text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {actionLoading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>

      {/* Invite Modal */}
      <Modal isOpen={inviteOpen} onClose={() => { setInviteOpen(false); setError(''); }} title="Invite Member">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Enter the email address of the person you want to invite.</p>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Email address</label>
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="partner@example.com"
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleInvite} disabled={actionLoading || !inviteEmail.trim()}
            className="w-full bg-[var(--color-accent)] text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {actionLoading ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
