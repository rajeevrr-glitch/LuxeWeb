import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { recoveryRedirectScript } from "../src/lib/recovery-redirect.ts";

function run(pathname, hash) {
  const redirects = [];
  vm.runInNewContext(recoveryRedirectScript, {
    URLSearchParams,
    location: { pathname, hash, replace: (value) => redirects.push(value) },
  });
  return redirects;
}

test("legacy recovery fragments go only to the same-origin reset page", () => {
  const hash = "#access_token=synthetic&refresh_token=synthetic&type=recovery";
  assert.deepEqual(run("/", hash), ["/reset-password" + hash]);
  assert.deepEqual(run("/admin", hash), ["/reset-password" + hash]);
  assert.deepEqual(run("/reset-password", hash), []);
  assert.deepEqual(run("/", "#error_code=otp_expired&error_description=ignored"), [
    "/reset-password#error_code=otp_expired&error_description=ignored",
  ]);
});

test("ordinary fragments and oversized untrusted fragments do not redirect", () => {
  for (const hash of ["", "#room-studio", "#type=signup", "#type=magiclink", "#error=random"])
    assert.deepEqual(run("/", hash), []);
  assert.deepEqual(run("/", "#type=recovery&value=" + "x".repeat(16000)), []);
});
