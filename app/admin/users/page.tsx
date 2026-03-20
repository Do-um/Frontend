import { requireServerAdminUser } from "@/lib/server-auth"
import AdminUsersPage from "../../../src/app/admin/users/page"

export default async function AdminUsersPageEntry() {
  await requireServerAdminUser("/admin/users")
  return <AdminUsersPage />
}
