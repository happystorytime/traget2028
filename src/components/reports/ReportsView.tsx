import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  CheckCircle2,
  Building,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Issue, Village, DevelopmentWork, PublicMeeting, FieldVisit, Department } from '../../types';

interface ReportsViewProps {
  issues?: Issue[];
  villages?: Village[];
  developmentWorks?: DevelopmentWork[];
  publicMeetings?: PublicMeeting[];
  fieldVisits?: FieldVisit[];
  departments?: Department[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  issues = [],
  villages = [],
  developmentWorks = [],
  publicMeetings = [],
  fieldVisits = [],
  departments = [],
}) => {
  const [reportType, setReportType] = useState<
    'issues_master' | 'village_summary' | 'department_perf' | 'development_works' | 'field_visits'
  >('issues_master');

  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Filtered issues for report
  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (selectedVillage !== 'all' && i.village !== selectedVillage) return false;
      if (selectedDepartment !== 'all' && i.department !== selectedDepartment) return false;
      if (i.dateReported < dateFrom || i.dateReported > dateTo) return false;
      return true;
    });
  }, [issues, selectedVillage, selectedDepartment, dateFrom, dateTo]);

  // Village summary calculation
  const villageSummaries = useMemo(() => {
    return villages.map((v) => {
      const vIssues = issues.filter((i) => i.village === v.name);
      const open = vIssues.filter(
        (i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)
      ).length;
      const resolved = vIssues.filter((i) => i.status === 'Resolved').length;
      const works = developmentWorks.filter((w) => w.village === v.name).length;
      const rate = vIssues.length > 0 ? Math.round((resolved / vIssues.length) * 100) : 0;
      return {
        village: v.name,
        gp: v.gramPanchayat,
        totalIssues: vIssues.length,
        open,
        resolved,
        works,
        rate,
      };
    });
  }, [villages, issues, developmentWorks]);

  // Department performance calculation
  const deptPerformance = useMemo(() => {
    return departments.map((d) => {
      const dIssues = issues.filter((i) => i.department === d.name);
      const resolved = dIssues.filter((i) => i.status === 'Resolved').length;
      const pending = dIssues.length - resolved;
      const rate = dIssues.length > 0 ? Math.round((resolved / dIssues.length) * 100) : 0;
      return {
        name: d.name,
        code: d.code,
        head: d.nodalOfficer,
        phone: d.contactNumber,
        total: dIssues.length,
        resolved,
        pending,
        rate,
      };
    });
  }, [departments, issues]);

  // CSV Export for the current report
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'issues_master') {
      headers = ['ID', 'Date', 'Village', 'GP', 'Category', 'Priority', 'Status', 'Department', 'Reporter', 'Assigned'];
      rows = filteredIssues.map((i) => [
        i.id,
        i.dateReported,
        `"${i.village}"`,
        `"${i.gramPanchayat}"`,
        `"${i.category}"`,
        i.priority,
        i.status,
        `"${i.department}"`,
        `"${i.reporterName}"`,
        `"${i.assignedStaff || ''}"`,
      ]);
    } else if (reportType === 'village_summary') {
      headers = ['Village', 'Gram Panchayat', 'Total Issues', 'Open', 'Resolved', 'Resolution Rate (%)', 'Works Count'];
      rows = villageSummaries.map((s) => [
        `"${s.village}"`,
        `"${s.gp}"`,
        s.totalIssues.toString(),
        s.open.toString(),
        s.resolved.toString(),
        `${s.rate}%`,
        s.works.toString(),
      ]);
    } else if (reportType === 'department_perf') {
      headers = ['Department', 'Code', 'Nodal Officer', 'Contact', 'Total Assigned', 'Resolved', 'Pending', 'Resolution Rate (%)'];
      rows = deptPerformance.map((d) => [
        `"${d.name}"`,
        d.code,
        `"${d.head}"`,
        d.phone,
        d.total.toString(),
        d.resolved.toString(),
        d.pending.toString(),
        `${d.rate}%`,
      ]);
    } else if (reportType === 'development_works') {
      headers = ['Work ID', 'Work Name', 'Village', 'Scheme', 'Approved (INR)', 'Spent (INR)', 'Status', 'Progress (%)'];
      rows = developmentWorks.map((w) => [
        w.id,
        `"${w.workName}"`,
        `"${w.village}"`,
        `"${w.schemeName}"`,
        w.approvedAmount.toString(),
        w.expenditureAmount.toString(),
        w.status,
        `${w.progress}%`,
      ]);
    } else if (reportType === 'field_visits') {
      headers = ['Visit ID', 'Date', 'Village', 'Purpose', 'Status', 'Attendees Count', 'Follow Up'];
      rows = fieldVisits.map((f) => [
        f.id,
        f.date,
        `"${f.village}"`,
        `"${f.purpose}"`,
        f.status,
        (f.attendees?.length ?? f.team?.length ?? 0).toString(),
        f.followUpRequired ? 'Yes' : 'No',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Official Constituency Reports &amp; Dossiers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready, exportable summaries for Karnataka Legislative Assembly AC-58 Sindhanur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Official PDF Dossier
          </button>
        </div>
      </div>

      {/* Filter & Selector Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setReportType('issues_master')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              reportType === 'issues_master'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Grievances Master Log
          </button>

          <button
            onClick={() => setReportType('village_summary')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              reportType === 'village_summary'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Village-wise Audit Summary
          </button>

          <button
            onClick={() => setReportType('department_perf')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              reportType === 'department_perf'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Department SLA Performance
          </button>

          <button
            onClick={() => setReportType('development_works')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              reportType === 'development_works'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Development Works &amp; Schemes
          </button>

          <button
            onClick={() => setReportType('field_visits')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              reportType === 'field_visits'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Field Inspections Dossier
          </button>
        </div>

        {/* Date & Village filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
              Village Scope
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 truncate"
            >
              <option value="all">All Villages</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
              Department Scope
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 truncate"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Document Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Official Letterhead */}
        <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              GOVERNMENT OF KARNATAKA • LEGISLATIVE ASSEMBLY
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              SINDHANUR AC-58 CONSTITUENCY CONNECT
            </h2>
            <div className="text-xs text-slate-600 font-medium">
              Office of the Member of Legislative Assembly (MLA) • Raichur District
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 shrink-0">
            <div><strong>Report Generated:</strong> {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
            <div><strong>Scope:</strong> {dateFrom} to {dateTo}</div>
            <div className="font-mono text-[10px] text-slate-400">REF: CC-REP-{Date.now().toString().slice(-6)}</div>
          </div>
        </div>

        {/* Report Content based on selected type */}
        {reportType === 'issues_master' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                Grievance Redressal Master Register ({filteredIssues.length} Records)
              </h3>
              <div className="text-xs text-slate-500">
                Resolved: {filteredIssues.filter((i) => i.status === 'Resolved').length} | Open: {filteredIssues.filter((i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)).length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-2 border-r border-slate-200">ID</th>
                    <th className="p-2 border-r border-slate-200">Date</th>
                    <th className="p-2 border-r border-slate-200">Village (GP)</th>
                    <th className="p-2 border-r border-slate-200">Category</th>
                    <th className="p-2 border-r border-slate-200">Priority</th>
                    <th className="p-2 border-r border-slate-200">Status</th>
                    <th className="p-2 border-r border-slate-200">Department</th>
                    <th className="p-2">Reporter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredIssues.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-semibold text-indigo-700 border-r border-slate-200">
                        {i.id}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                        {i.dateReported}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-800">
                        {i.village} <span className="text-[10px] text-slate-400">({i.gramPanchayat})</span>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700 font-medium">
                        {i.category}
                      </td>
                      <td className="p-2 border-r border-slate-200">{i.priority}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{i.status}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600 truncate max-w-[140px]">
                        {i.department}
                      </td>
                      <td className="p-2 text-slate-700">{i.reporterName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'village_summary' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
              Village-Wise Grievance &amp; Works Resolution Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Village</th>
                    <th className="p-2 border-r border-slate-200">Gram Panchayat</th>
                    <th className="p-2 border-r border-slate-200 text-center">Total Issues</th>
                    <th className="p-2 border-r border-slate-200 text-center">Open</th>
                    <th className="p-2 border-r border-slate-200 text-center">Resolved</th>
                    <th className="p-2 border-r border-slate-200 text-center">Resolution Rate</th>
                    <th className="p-2 text-center">Active Works</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {villageSummaries.map((s) => (
                    <tr key={s.village} className="hover:bg-slate-50">
                      <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">
                        {s.village}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{s.gp}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">
                        {s.totalIssues}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-amber-700 font-bold">
                        {s.open}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-700 font-bold">
                        {s.resolved}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span className="font-mono font-bold">{s.rate}%</span>
                      </td>
                      <td className="p-2 text-center font-bold text-purple-700">{s.works}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'department_perf' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
              Departmental Grievance SLA Performance Scorecard
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Department Name</th>
                    <th className="p-2 border-r border-slate-200">Code</th>
                    <th className="p-2 border-r border-slate-200">Nodal Officer</th>
                    <th className="p-2 border-r border-slate-200 text-center">Total Referred</th>
                    <th className="p-2 border-r border-slate-200 text-center">Resolved</th>
                    <th className="p-2 border-r border-slate-200 text-center">Pending</th>
                    <th className="p-2 text-center">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {deptPerformance.map((d) => (
                    <tr key={d.code} className="hover:bg-slate-50">
                      <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">
                        {d.name}
                      </td>
                      <td className="p-2 font-mono text-slate-500 border-r border-slate-200">
                        {d.code}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">
                        {d.head} ({d.phone})
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">
                        {d.total}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-700 font-bold">
                        {d.resolved}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-amber-700 font-bold">
                        {d.pending}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-indigo-700">
                        {d.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'development_works' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
              Constituency Development Sanctions Register
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-2 border-r border-slate-200">ID</th>
                    <th className="p-2 border-r border-slate-200">Work Name</th>
                    <th className="p-2 border-r border-slate-200">Village</th>
                    <th className="p-2 border-r border-slate-200">Scheme</th>
                    <th className="p-2 border-r border-slate-200 text-right">Sanction (₹)</th>
                    <th className="p-2 border-r border-slate-200 text-right">Expenditure (₹)</th>
                    <th className="p-2 border-r border-slate-200">Status</th>
                    <th className="p-2 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {developmentWorks.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-semibold text-purple-700 border-r border-slate-200">
                        {w.id}
                      </td>
                      <td className="p-2 font-medium text-slate-900 border-r border-slate-200">
                        {w.workName}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{w.village}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{w.schemeName}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">
                        ₹{(w.approvedAmount / 100000).toFixed(1)}L
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono text-emerald-700">
                        ₹{(w.expenditureAmount / 100000).toFixed(1)}L
                      </td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{w.status}</td>
                      <td className="p-2 text-center font-bold">{w.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'field_visits' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
              Legislator Field Inspections &amp; Directive Log
            </h3>

            <div className="space-y-3">
              {fieldVisits.map((f) => (
                <div key={f.id} className="p-3 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>
                      {f.id} • {f.purpose}
                    </span>
                    <span className="text-indigo-600">{f.date}</span>
                  </div>
                  <div className="text-slate-500">
                    Village: {f.village} | Status: {f.status} | Attendees: {(f.attendees || f.team || []).join(', ')}
                  </div>
                  {(f.keyObservations || f.notes) && (
                    <div className="text-slate-700 bg-slate-50 p-2 rounded">
                      <strong>Observations:</strong> {f.keyObservations || f.notes}
                    </div>
                  )}
                  {(f.actionItems?.length ?? 0) > 0 && (
                    <div className="text-emerald-800">
                      <strong>Directives Issued:</strong> {(f.actionItems || []).join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer & Signature block for printed version */}
        <div className="pt-8 border-t border-slate-300 mt-8 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div>Verified by: Office of MLA Sindhanur AC-58</div>
            <div>Constituency Engagement &amp; Grievance Tracking Cell</div>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-slate-400 w-44 mb-1"></div>
            <div>Authorized Signature &amp; Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
};
