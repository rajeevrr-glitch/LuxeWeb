export const trafficPreferenceKey = "luxeinfra:traffic-opt-out:v1";
type StorageChoice = Pick<Storage, "getItem" | "setItem">;
let currentChoice: boolean | null = null;

export function trafficOptedOut(storage?: StorageChoice | null): boolean {
  try {
    if (storage) return storage.getItem(trafficPreferenceKey) === "true" || currentChoice === true;
  } catch {
    // Honour a page-local choice when persistence is blocked.
  }
  return currentChoice ?? true;
}

export function chooseTrafficOptOut(value: boolean, storage?: StorageChoice | null): boolean {
  currentChoice = value;
  try {
    if (!storage) return false;
    storage.setItem(trafficPreferenceKey, String(value));
    currentChoice = null;
    return true;
  } catch {
    return false;
  }
}

export function browserTrafficPreference(navigator: {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}): boolean {
  return navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true;
}
