import { PageTitle } from "@/components/admin/sidebar";
import { UsersManager } from "@/components/admin/users-manager";
import { requirePageUser } from "@/lib/auth";
import { listUsers } from "@/lib/data/users";

export const metadata = { title: "Usuários" };

export default async function AdminUsers() {
  const me = await requirePageUser("admin");
  const users = await listUsers();
  return (
    <>
      <PageTitle title="Usuários" description="Quem pode acessar o painel e o que cada pessoa pode fazer." />
      <UsersManager initial={users} meId={me.id} />
    </>
  );
}
