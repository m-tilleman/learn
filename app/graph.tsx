import { Redirect } from "expo-router";
// Knowledge-graph screen not part of the current build; route kept as a redirect.
export default function Graph() {
  return <Redirect href="/stats" />;
}
