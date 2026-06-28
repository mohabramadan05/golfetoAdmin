import { redirect } from "next/navigation";
import AdminApp from "./AdminApp";
import { getAdminData } from "./lib/data";
import { demoData } from "./lib/demo";
import { isFirebaseConfigured } from "./lib/firebase-admin";
import { getSessionUser } from "./lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Demo mode: no service account yet — run on seed data, no auth required.
  if (!isFirebaseConfigured()) {
    return <AdminApp initialData={demoData()} user={{ uid: "demo", email: "", name: "Rana Adel" }} configured={false} />;
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getAdminData();
  return <AdminApp initialData={data} user={user} configured />;
}
