import { redirect } from "next/navigation";

// /home was a scratch route that duplicated the landing page. Keep the URL
// working, but serve the real thing.
export default function HomePage() {
  redirect("/");
}
