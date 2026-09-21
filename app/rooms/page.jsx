import { redirect } from "next/navigation";

/**
 * /rooms was an earlier, thinner version of this idea: the Euler map plus a
 * link out to a separately-run chat server. /chat does the whole thing —
 * same map, with the conversation in the page — so this path forwards there
 * rather than leaving two doors onto one feature.
 */
export default function RoomsRedirect() {
  redirect("/chat");
}
