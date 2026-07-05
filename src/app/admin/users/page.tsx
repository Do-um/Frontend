import { AdminUsersPage } from "@/components/pages/admin-users-page"
import { requireServerAdminUser } from "@/lib/server-auth"

export default async function AdminUsersRoutePage() {
  await requireServerAdminUser("/admin/users")

  return <AdminUsersPage />
}
