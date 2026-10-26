// Supabase links sent before the dedicated reset page can land on the homepage.
// Move the fragment before public scripts run; it never reaches a server or storage.
export const recoveryRedirectScript = `(function(){try{var h=location.hash;if(location.pathname!=="/reset-password"&&h.length<16000){var p=new URLSearchParams(h.slice(1));if(p.get("type")==="recovery"||p.get("error_code")==="otp_expired"){location.replace("/reset-password"+h);}}}catch{}})();`;
