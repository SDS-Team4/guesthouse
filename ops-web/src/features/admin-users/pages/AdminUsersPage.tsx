import { adminUsers } from '../../admin-core/mock';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function AdminUsersPage() {
  return (
    <SectionCard title="Users" subtitle="Admin user management list from the draft.">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="pb-3">Login ID</th>
              <th className="pb-3">Name</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 text-slate-700">
                <td className="py-4">{user.loginId}</td>
                <td className="py-4">{user.name}</td>
                <td className="py-4">{user.role}</td>
                <td className="py-4">{user.status}</td>
                <td className="py-4">{user.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
