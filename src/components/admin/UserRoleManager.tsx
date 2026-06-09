"use client";

import React, { useState, useEffect } from "react";
import { Shield, Users, X, Plus, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

// MEMBER is not a global role — club membership is per-event via the Membership button
const ROLES = ["VIEWER", "PHOTOGRAPHER", "CLUB_ADMIN", "ADMIN"];

interface Event {
  id: string;
  name: string;
}

interface EventAdmin {
  id: string;
  eventId: string;
  event: { id: string; name: string };
}

interface EventMember {
  id: string;
  eventId: string;
  event: { id: string; name: string };
}

interface Props {
  userId: string;
  currentRole: string;
  userName: string;
}

export default function UserRoleManager({ userId, currentRole, userName }: Props) {
  // MEMBER is deprecated — treat as VIEWER for display/assignment
  const [role, setRole] = useState(currentRole === "MEMBER" ? "VIEWER" : currentRole);
  const [saving, setSaving] = useState(false);
  const [showEventAdmin, setShowEventAdmin] = useState(false);
  const [showEventMember, setShowEventMember] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventAdmins, setEventAdmins] = useState<EventAdmin[]>([]);
  const [eventMembers, setEventMembers] = useState<EventMember[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedMemberEventId, setSelectedMemberEventId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assigningMember, setAssigningMember] = useState(false);

  useEffect(() => {
    if (showEventAdmin || showEventMember) {
      fetch("/api/events").then(r => r.json()).then(d => setEvents(d.events || []));
    }
    if (showEventAdmin) {
      fetch(`/api/admin/event-admin?userId=${userId}`).then(r => r.json()).then(d => {
        setEventAdmins(d.eventAdmins || []);
      });
    }
    if (showEventMember) {
      fetch(`/api/admin/event-member?userId=${userId}`).then(r => r.json()).then(d => {
        setEventMembers(d.members || []);
      });
    }
  }, [showEventAdmin, showEventMember, userId]);

  async function updateRole(newRole: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setRole(newRole);
        toast.success(`Role updated to ${newRole}`);
      } else {
        toast.error("Failed to update role");
      }
    } finally {
      setSaving(false);
    }
  }

  async function assignEventAdmin() {
    if (!selectedEventId) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/event-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventId: selectedEventId }),
      });
      const data = await res.json();
      if (res.ok) {
        const eventName = data.eventAdmin.event.name;
        if (data.roleUpgraded) {
          setRole("CLUB_ADMIN");
          toast.success(`${userName} is now Club Admin of "${eventName}"`);
        } else {
          toast.success(`${userName} is now Club Admin of "${eventName}"`);
        }
        setEventAdmins(prev => [...prev, data.eventAdmin]);
        setSelectedEventId("");
      } else {
        toast.error(data.error || "Failed to assign");
      }
    } finally {
      setAssigning(false);
    }
  }

  async function removeEventAdmin(eventId: string, eventName: string) {
    try {
      await fetch("/api/admin/event-admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventId }),
      });
      setEventAdmins(prev => prev.filter(ea => ea.eventId !== eventId));
      toast.success(`Removed from ${eventName}`);
    } catch {
      toast.error("Failed to remove");
    }
  }

  async function assignEventMember() {
    if (!selectedMemberEventId) return;
    setAssigningMember(true);
    try {
      const res = await fetch("/api/admin/event-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventId: selectedMemberEventId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${userName} added to "${data.member.event.name}"`);
        setEventMembers(prev => [...prev, data.member]);
        setSelectedMemberEventId("");
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } finally {
      setAssigningMember(false);
    }
  }

  async function removeEventMember(eventId: string, eventName: string) {
    try {
      await fetch("/api/admin/event-member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventId }),
      });
      setEventMembers(prev => prev.filter(m => m.eventId !== eventId));
      toast.success(`Removed from ${eventName}`);
    } catch {
      toast.error("Failed to remove");
    }
  }

  return (
    <div className="space-y-2">
      {/* Controls row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Role dropdown */}
        <div className="relative">
          <select
            value={role}
            onChange={(e) => updateRole(e.target.value)}
            disabled={saving}
            className="appearance-none rounded-lg border border-gray-200 bg-gray-50 py-1 pl-2.5 pr-6 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer disabled:opacity-60"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-white">{r}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Club Admin button */}
        <button
          onClick={() => { setShowEventAdmin(!showEventAdmin); setShowEventMember(false); }}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
            showEventAdmin
              ? "border-blue-400 bg-blue-100 text-blue-700"
              : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
        >
          <Shield className="h-3 w-3" />
          Club Admin
        </button>

        {/* Club Membership button */}
        <button
          onClick={() => { setShowEventMember(!showEventMember); setShowEventAdmin(false); }}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
            showEventMember
              ? "border-green-400 bg-green-100 text-green-700"
              : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
          }`}
        >
          <Users className="h-3 w-3" />
          Members
        </button>
      </div>

      {/* Club Admin panel */}
      {showEventAdmin && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-3 text-xs">
          <p className="font-medium text-blue-800">
            Assign <span className="font-bold">{userName}</span> as admin of a specific club/event:
          </p>

          {/* Assign form */}
          <div className="flex gap-2">
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a club/event...</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
            <button
              onClick={assignEventAdmin}
              disabled={!selectedEventId || assigning}
              className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-white disabled:opacity-50 hover:bg-blue-700 transition"
            >
              <Plus className="h-3 w-3" />
              {assigning ? "Assigning..." : "Assign"}
            </button>
          </div>

          {/* Current event admin assignments */}
          {eventAdmins.length > 0 && (
            <div>
              <p className="text-blue-700 font-medium mb-1">Currently admin of:</p>
              <div className="space-y-1">
                {eventAdmins.map(ea => (
                  <div key={ea.eventId} className="flex items-center justify-between rounded bg-white border border-blue-100 px-2 py-1">
                    <span className="text-gray-700">{ea.event.name}</span>
                    <button
                      onClick={() => removeEventAdmin(ea.eventId, ea.event.name)}
                      className="text-red-400 hover:text-red-600 transition"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventAdmins.length === 0 && (
            <p className="text-blue-500 italic">Not admin of any club yet.</p>
          )}
        </div>
      )}

      {/* Club Member panel */}
      {showEventMember && (
        <div className="rounded-lg border border-green-100 bg-green-50 p-3 space-y-3 text-xs">
          <p className="font-medium text-green-800">
            Add <span className="font-bold">{userName}</span> as member of a club/event:
          </p>

          {/* Add member form */}
          <div className="flex gap-2">
            <select
              value={selectedMemberEventId}
              onChange={e => setSelectedMemberEventId(e.target.value)}
              className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">Select a club/event...</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
            <button
              onClick={assignEventMember}
              disabled={!selectedMemberEventId || assigningMember}
              className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-white disabled:opacity-50 hover:bg-green-700 transition"
            >
              <Plus className="h-3 w-3" />
              {assigningMember ? "Adding..." : "Add"}
            </button>
          </div>

          {/* Current memberships */}
          {eventMembers.length > 0 && (
            <div>
              <p className="text-green-700 font-medium mb-1">Member of:</p>
              <div className="space-y-1">
                {eventMembers.map(m => (
                  <div key={m.eventId} className="flex items-center justify-between rounded bg-white border border-green-100 px-2 py-1">
                    <span className="text-gray-700">{m.event.name}</span>
                    <button
                      onClick={() => removeEventMember(m.eventId, m.event.name)}
                      className="text-red-400 hover:text-red-600 transition"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventMembers.length === 0 && (
            <p className="text-green-500 italic">Not a member of any club yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
