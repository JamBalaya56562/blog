import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/en" as never)
}
