import { redirect } from "next/navigation";
import { CAMPUS_GROUPS_LOGIN } from "../lib/clubKind";

/**
 * Official clubs are not listed here any more.
 *
 * Sacramento State already runs a searchable club directory on CampusGroups,
 * and it is the one that can actually enrol you. Mirroring it here meant a
 * second, staler copy of the same 336 rows, so this path now hands straight
 * over. Kept as a redirect because the old URL is linked from bookmarks and
 * earlier commits.
 */
export default function ClubPageRedirect() {
  redirect(CAMPUS_GROUPS_LOGIN);
}
