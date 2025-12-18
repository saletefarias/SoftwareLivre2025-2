import { EventInput } from "./eventMapper";

export async function twoWaySync() {
  // High level coordinator: fetch events from Google, map to blocks, update Logseq;
  // fetch Logseq changes and push to Google.
  console.log("twoWaySync: not implemented");
}

export async function syncFromGoogle() {
  console.log("syncFromGoogle: not implemented");
}

export async function syncToGoogle() {
  console.log("syncToGoogle: not implemented");
}
