import { redirect } from "next/navigation";

/**
 * Students no longer create "clubs" — official clubs come from the university
 * roster and only prisma/seedClubs.js writes them. What this page used to do
 * is now creating a hive.
 *
 * Kept as a redirect because the old path is linked from bookmarks, earlier
 * commits and the previous header menu.
 */
export default function CreateClubRedirect() {
  redirect("/createHive");
}
