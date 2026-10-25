import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkEnquiryDelivery,
  createEnquiryDeliveryRequest,
  EnquiryDeliveryError,
  enquiryDeliveryError,
  submitEnquiryDelivery,
  type EnquiryDeliveryInput,
  type EnquiryDeliveryRequest,
  type EnquiryDeliveryResult,
} from "../lib/enquiry-delivery.ts";

export function useEnquiryDelivery() {
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<EnquiryDeliveryResult | null>(null);
  const [error, setError] = useState("");
  const [pendingReference, setPendingReference] = useState("");
  const mounted = useRef(false);
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const attempt = useRef<EnquiryDeliveryRequest | null>(null);

  useEffect(() => {
    mounted.current = true;
    const status = new AbortController();
    void checkEnquiryDelivery({ signal: status.signal }).then((available) => {
      if (!mounted.current || status.signal.aborted) return;
      setEnabled(available);
      setChecking(false);
    });
    return () => {
      mounted.current = false;
      generation.current += 1;
      status.abort();
      active.current?.abort();
      active.current = null;
      locked.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    generation.current += 1;
    active.current?.abort();
    active.current = null;
    locked.current = false;
    attempt.current = null;
    if (!mounted.current) return;
    setSending(false);
    setResult(null);
    setError("");
    setPendingReference("");
  }, []);

  const submit = useCallback(
    async (input: EnquiryDeliveryInput): Promise<boolean> => {
      if (!mounted.current || locked.current) return false;
      if (!enabled || checking) {
        setError(enquiryDeliveryError);
        return false;
      }
      locked.current = true;
      const current = ++generation.current;
      const controller = new AbortController();
      active.current = controller;
      setSending(true);
      setError("");
      setResult(null);
      try {
        const request = createEnquiryDeliveryRequest(input, attempt.current);
        if (attempt.current?.id !== request.id) setPendingReference("");
        attempt.current = request;
        const accepted = await submitEnquiryDelivery(request, { signal: controller.signal });
        if (!mounted.current || generation.current !== current) return false;
        setResult(accepted);
        setPendingReference("");
        return true;
      } catch (failure) {
        if (mounted.current && generation.current === current) {
          setError(enquiryDeliveryError);
          if (failure instanceof EnquiryDeliveryError && failure.reference)
            setPendingReference(failure.reference);
        }
        return false;
      } finally {
        if (active.current === controller) {
          active.current = null;
          locked.current = false;
        }
        if (mounted.current && generation.current === current) setSending(false);
      }
    },
    [enabled, checking],
  );

  return { enabled, checking, sending, result, error, pendingReference, submit, reset };
}
