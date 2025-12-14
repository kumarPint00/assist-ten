"use client";
import React from "react";
import "./AdminTeamRoles.scss";

type RoleOption = "Admin" | "Recruiter" | "Interviewer" | "Viewer";

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: RoleOption;
  status: "Active" | "Pending" | "Suspended";
};

const ROLE_DESCRIPTIONS: Record<RoleOption, string> = {
  Admin: "Full access to assessments, users, settings, and reports.",
  Recruiter: "Manage candidates, invites, and view recruiting pipelines.",
  Interviewer: "Join interviews, leave feedback, and see assigned candidates.",
  Viewer: "Read-only visibility into dashboards and candidate progress.",
};

const SAMPLE_USERS: UserRecord[] = [
  { id: 1, name: "Shanice Patel", email: "shanice@assist-ten.com", role: "Admin", status: "Active" },
  { id: 2, name: "Raul Mendoza", email: "raul@assist-ten.com", role: "Recruiter", status: "Active" },
  { id: 3, name: "Anika Bose", email: "anika@assist-ten.com", role: "Interviewer", status: "Pending" },
  { id: 4, name: "Marco Ili", email: "marco@assist-ten.com", role: "Viewer", status: "Active" },
];

const ROLE_OPTIONS: RoleOption[] = ["Admin", "Recruiter", "Interviewer", "Viewer"];

const AdminTeamRoles = () => {
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserRecord | null>(null);
  const [inviteForm, setInviteForm] = React.useState({ name: "", email: "", role: "Viewer" });
  const [editRole, setEditRole] = React.useState<RoleOption>("Viewer");

  const openInvite = () => {
    setInviteForm({ name: "", email: "", role: "Viewer" });
    setInviteOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditOpen(true);
  };

  const openRemove = (user: UserRecord) => {
    setSelectedUser(user);
    setRemoveOpen(true);
  };

  const closeModals = () => {
    setInviteOpen(false);
    setEditOpen(false);
    setRemoveOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="admin-team">
      <header className="team-header">
        <div>
          <p className="eyebrow">Team & Roles</p>
          <h1>Manage your internal users</h1>
          <p className="subhead">Invite collaborators, clarify permissions, and keep role changes auditable.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openInvite}>
          Invite user
        </button>
      </header>

      <section className="table-panel card">
        <div className="panel-heading">
          <h2>Active team</h2>
          <p className="tiny">No platform-wide permissions or password controls are exposed here.</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_USERS.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-pill role-${user.role.toLowerCase()}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`status status-${user.status.toLowerCase()}`}>{user.status}</span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="link" type="button" onClick={() => openEdit(user)}>
                        Edit role
                      </button>
                      <button className="link danger" type="button" onClick={() => openRemove(user)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {inviteOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <header>
              <h3>Invite user</h3>
              <p className="tiny">Select a role, enter email, and the candidate receives an invite link.</p>
            </header>
            <label>
              Name
              <input
                type="text"
                value={inviteForm.name}
                onChange={(event) => setInviteForm({ ...inviteForm, name: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })}
              />
            </label>
            <label>
              Role
              <select
                value={inviteForm.role}
                onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value })}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-roleinfo">
              {ROLE_OPTIONS.map((role) => (
                <article key={role}>
                  <strong>{role}</strong>
                  <p>{ROLE_DESCRIPTIONS[role]}</p>
                </article>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" type="button" onClick={closeModals}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={closeModals}>
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal">
            <header>
              <h3>Edit role</h3>
              <p className="tiny">Updates are audited; changes take effect after saving.</p>
            </header>
            <p>
              <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>
            <label>
              Role
              <select value={editRole} onChange={(event) => setEditRole(event.target.value as RoleOption)}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <p className="tiny muted">{ROLE_DESCRIPTIONS[editRole]}</p>
            <div className="modal-actions">
              <button className="btn btn-outline" type="button" onClick={closeModals}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={closeModals}>
                Save role
              </button>
            </div>
          </div>
        </div>
      )}

      {removeOpen && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal">
            <header>
              <h3>Remove user</h3>
              <p className="tiny">Removal cannot be undone from this UI; use with caution.</p>
            </header>
            <p>
              Remove <strong>{selectedUser.name}</strong> from the team? They will lose access to this workspace immediately.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" type="button" onClick={closeModals}>
                Keep user
              </button>
              <button className="btn btn-danger" type="button" onClick={closeModals}>
                Confirm removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeamRoles;
