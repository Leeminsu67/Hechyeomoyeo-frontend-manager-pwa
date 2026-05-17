import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function RootPage() {
  const authFlag = cookies().get("auth_flag");

  redirect(authFlag ? "/dashboard" : "/login");
}
