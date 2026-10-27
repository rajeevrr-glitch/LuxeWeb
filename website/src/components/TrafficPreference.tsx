import { useEffect, useState } from "react";
import {
  browserTrafficPreference,
  chooseTrafficOptOut,
  trafficOptedOut,
} from "@/lib/traffic-preference";

export function TrafficPreference() {
  const [loaded, setLoaded] = useState(false);
  const [excluded, setExcluded] = useState(false);
  const [browserChoice, setBrowserChoice] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      setExcluded(trafficOptedOut(window.localStorage));
    } catch {
      setExcluded(trafficOptedOut());
    }
    setBrowserChoice(browserTrafficPreference(window.navigator));
    setLoaded(true);
  }, []);
  return (
    <div className="my-6 rounded-xl border border-slate-200 bg-white p-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={excluded || browserChoice}
          disabled={!loaded || browserChoice}
          style={{ width: 18, height: 18, padding: 0, marginTop: 5, flexShrink: 0 }}
          onChange={(event) => {
            const next = event.target.checked;
            let saved = false;
            let applied = next;
            try {
              saved = chooseTrafficOptOut(next, window.localStorage);
              applied = trafficOptedOut(window.localStorage);
            } catch {
              chooseTrafficOptOut(next);
              applied = trafficOptedOut();
            }
            setExcluded(applied);
            setMessage(
              saved
                ? "Your choice is saved for this browser."
                : applied !== next
                  ? "Your browser could not change this preference. Your visits remain excluded."
                  : "Applied for this page session. Your browser could not save this preference.",
            );
          }}
        />
        Do not count my future public website visits
      </label>
      <p>
        {browserChoice
          ? "Your browser’s Do Not Track or Global Privacy Control preference already excludes your visits."
          : "This preference applies to this browser. It does not change how a project request you submit is handled."}
      </p>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
