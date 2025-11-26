"use client";

import { useEffect, useState } from "react";
import { fetchUsers } from "./actions/fetchUsers";
import { deleteUser } from "./actions/deleteUser";
import { generateOtp } from "./actions/generateOtp";
import { approveOtp } from "./actions/approveOtp";
import UserList from "./UserList";
import "./UserManagement.css";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const allUsers = await fetchUsers();
      if (allUsers) setUsers(allUsers);
      setLoading(false);
    };
    load();
  }, []);

  // 🔄 Delete handler sasa inakubali id na username
  const handleDelete = async (userId: number, username: string) => {
    setSaving(true);
    await deleteUser(userId, username); // 👈 sasa tunapitisha zote
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setSaving(false);
  };

  const handleGenerateOtp = async (userId: number, phoneNumberWithCode: string, currentMeta: any) => {
    setSaving(true);
    const updatedUser = await generateOtp(userId, phoneNumberWithCode, currentMeta);
    if (updatedUser) setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    setSaving(false);
  };

  const handleApprove = async (userId: number, currentMeta: any) => {
    setSaving(true);
    const updatedUser = await approveOtp(userId, currentMeta);
    if (updatedUser) setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    setSaving(false);
  };

  if (loading) return <p>⏳ Inapakia orodha ya watumiaji...</p>;

  return (
    <div className="user-management-panel">
      <h2>👥 User Management</h2>
      <UserList
        users={users}
        onDelete={handleDelete} // 👈 sasa inapitisha id + username
        onGenerateOtp={handleGenerateOtp}
        onApprove={handleApprove}
        saving={saving}
      />
    </div>
  );
}
