import React, { useState } from 'react';
import {
  Settings,
  Users,
  Building,
  Shield,
  History,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { User, ConstituencySettings, Department, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';

interface SettingsViewProps {
  users?: User[];
  departments?: Department[];
  settings?: ConstituencySettings;
  onRefreshData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  users = [],
  departments = [],
  settings = StorageService.getSettings(),
  onRefreshData = () => {},
}) => {
  const { currentUser, canEditSettings } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'constituency' | 'users' | 'departments' | 'audit_logs' | 'backup'
  >('constituency');

  // Constituency settings form
  const [mlaName, setMlaName] = useState(settings?.mlaName || '');
  const [officeContact, setOfficeContact] = useState(settings?.officeContact || '');
  const [officeEmail, setOfficeEmail] = useState(settings?.officeEmail || '');
  const [officeAddress, setOfficeAddress] = useState(settings?.officeAddress || '');
  const [helpdeskPhone, setHelpdeskPhone] = useState(settings?.helpdeskPhone || '');
  const [savedNotice, setSavedNotice] = useState(false);

  // New user modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('STAFF');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDesignation, setNewUserDesignation] = useState('');

  // Department modal
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptOfficer, setNewDeptOfficer] = useState('');
  const [newDeptPhone, setNewDeptPhone] = useState('');

  // Audit logs state
  const auditLogs = StorageService.getAuditLogs() || [];

  const handleSaveConstituency = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConstituencySettings = {
      ...settings,
      mlaName,
      officeContact,
      officeEmail,
      officeAddress,
      helpdeskPhone,
    };
    StorageService.saveSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: newUserName.trim(),
      email: newUserEmail.trim() || `${newUserName.toLowerCase().replace(/\s+/g, '')}@sindhanur.gov.in`,
      role: newUserRole,
      phone: newUserPhone.trim() || '+91 98450 00000',
      designation: newUserDesignation.trim() || 'Officer',
      active: true,
    };

    StorageService.saveUser(newUser);
    setUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserDesignation('');
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;

    const newDept: Department = {
      id: `dept-${Date.now().toString().slice(-4)}`,
      name: newDeptName.trim(),
      code: newDeptCode.trim().toUpperCase(),
      headOfficer: newDeptOfficer.trim() || 'Designated Officer',
      contactEmail: `${newDeptCode.toLowerCase()}@sindhanur.gov.in`,
      contactPhone: newDeptPhone.trim() || '+91 8535 220000',
      nodalOfficer: newDeptOfficer.trim() || 'Designated Officer',
      contactNumber: newDeptPhone.trim() || '+91 8535 220000',
    };

    StorageService.saveDepartment(newDept);
    setDeptModalOpen(false);
    setNewDeptName('');
    setNewDeptCode('');
    setNewDeptOfficer('');
    setNewDeptPhone('');
  };

  // Export database backup JSON
  const handleExportBackup = () => {
    const backup = StorageService.exportFullBackup();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sindhanur_AC58_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import database backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const success = StorageService.importFullBackup(reader.result as string);
          if (success) {
            alert('Database backup restored successfully!');
            onRefreshData();
          } else {
            alert('Backup JSON parsing failed. Please verify format.');
          }
        } catch (err) {
          alert('Error restoring backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset to default
  const handleResetData = () => {
    if (
      confirm(
        'WARNING: This will reset all issues, field visits, meetings, and works back to initial baseline demo data. Continue?'
      )
    ) {
      StorageService.resetToDefaults();
      onRefreshData();
      alert('Data reset to baseline sample successfully.');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          System Administration &amp; Governance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Constituency parameters, user role-based access control, departmental nodal mapping &amp; audit trails.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('constituency')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'constituency'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Constituency Profile
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User Management ({users?.length ?? 0})
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'departments'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Departments &amp; Nodals ({departments?.length ?? 0})
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'audit_logs'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          System Audit Trail ({auditLogs?.length ?? 0})
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Data Backup &amp; Recovery
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-5 sm:p-6">
        {activeTab === 'constituency' && (
          <form onSubmit={handleSaveConstituency} className="max-w-2xl space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Constituency Name</label>
                <input
                  type="text"
                  value={settings.constituencyName}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assembly Number</label>
                <input
                  type="text"
                  value={settings.constituencyNumber}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">District &amp; State</label>
                <input
                  type="text"
                  value={`${settings.district}, ${settings.state}`}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">MLA / Representative Name</label>
                <input
                  type="text"
                  value={mlaName}
                  onChange={(e) => setMlaName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Office Contact Phone</label>
                <input
                  type="text"
                  value={officeContact}
                  onChange={(e) => setOfficeContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={officeEmail}
                  onChange={(e) => setOfficeEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Constituency Office Address</label>
              <textarea
                rows={2}
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Public Helpline Number</label>
              <input
                type="text"
                value={helpdeskPhone}
                onChange={(e) => setHelpdeskPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              />
            </div>

            {savedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Constituency settings saved successfully.
              </div>
            )}

            {canEditSettings && (
              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Update Constituency Parameters
                </button>
              </div>
            )}
          </form>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Authorized Personnel</h3>
                <p className="text-xs text-slate-500">
                  Role-based access credentials (ADMIN, STAFF, FIELD EXECUTIVE)
                </p>
              </div>
              {canEditSettings && (
                <button
                  onClick={() => setUserModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add User
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 text-slate-600">{u.phone || '—'}</td>
                      <td className="p-3 text-slate-600">{u.designation}</td>
                      <td className="p-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="p-3 text-right">
                        {canEditSettings && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete user ${u.name}?`)) {
                                StorageService.deleteUser(u.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Government Departments &amp; Nodal Officers
                </h3>
                <p className="text-xs text-slate-500">
                  Routing rules and direct officer points of contact for grievance escalation
                </p>
              </div>
              {canEditSettings && (
                <button
                  onClick={() => setDeptModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Department
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Department Name</th>
                    <th className="p-3">Nodal Officer</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-700">{d.code}</td>
                      <td className="p-3 font-medium text-slate-800">{d.name}</td>
                      <td className="p-3 text-slate-700">{d.nodalOfficer}</td>
                      <td className="p-3 text-slate-600">{d.contactNumber}</td>
                      <td className="p-3 text-right">
                        {canEditSettings && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete department ${d.name}?`)) {
                                StorageService.deleteDepartment(d.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Immutable System Audit Logs
              </h3>
              <p className="text-xs text-slate-500">
                Complete forensic history of user edits, status changes, and data creation
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No audit logs recorded yet</div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Entity</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 text-[11px]">
                        <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap">
                          {log.user}
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-indigo-700">{log.entityId}</td>
                        <td className="p-2.5 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="max-w-xl space-y-6 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600" />
                Export Full Database Backup
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Download a complete JSON snapshot containing all issues, villages, gram panchayats, field visits, meetings, and development works.
              </p>
              <button
                onClick={handleExportBackup}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON Backup
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                Restore Database From JSON
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Restore application state from a previously saved JSON snapshot.
              </p>
              <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Choose JSON File
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 space-y-2">
              <h3 className="font-bold text-sm text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Reset Baseline Data
              </h3>
              <p className="text-red-700 leading-relaxed">
                Clear all custom entries and restore the original Sindhanur AC-58 demonstration dataset.
              </p>
              <button
                onClick={handleResetData}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 text-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3">Add Authorized User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="FIELD EXECUTIVE">FIELD EXECUTIVE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={newUserDesignation}
                  onChange={(e) => setNewUserDesignation(e.target.value)}
                  placeholder="E.g. Junior Engineer, Nodal Officer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 text-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3">Add Department</h3>
            <form onSubmit={handleCreateDept} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="E.g. Minor Irrigation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="MI"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nodal Officer</label>
                <input
                  type="text"
                  value={newDeptOfficer}
                  onChange={(e) => setNewDeptOfficer(e.target.value)}
                  placeholder="Assistant Executive Engineer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newDeptPhone}
                  onChange={(e) => setNewDeptPhone(e.target.value)}
                  placeholder="+91 8535 000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
