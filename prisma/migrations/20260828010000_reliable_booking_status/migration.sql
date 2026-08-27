-- ============================================================
-- Migration: reliable booking_status derivation
--
-- Problem:
--   booking_status was derived ONLY from tickets (fn_derive_booking_status),
--   so WAITING_PAYMENT / COMPLETED / AT_RISK / MODIFIED were never produced
--   and a booking could never become "waiting for payment" or "completed".
--   Status depended entirely on ticket rows.
--
-- Fix:
--   A single recompute function derives booking_status from the full,
--   unambiguous business lifecycle:
--     CANCELLED            all tickets cancelled
--     PARTIALLY_CANCELLED  some tickets cancelled, some active
--     COMPLETED            all tickets issued/resolved AND all segments departed
--     MODIFIED             at least one ticket modified
--     TICKETED             all tickets issued/resolved, not yet departed
--     WAITING_TICKETING    at least one pending ticket
--     WAITING_PAYMENT      no tickets, selling_price > 0 and paid < selling_price
--     NEW                  no tickets (fully paid or zero price)
--
-- Risk ("needs attention": issued-before-payment unsettled, refund in
-- progress, overdue payment, near-travel unpaid) is a separate UI-level
-- derived flag, NOT a stored booking_status, so the lifecycle stepper
-- stays unambiguous.
--
-- Triggers fire on:
--   bookings          INSERT, UPDATE OF depart_date/return_date/
--                     issued_before_payment/current_selling_price
--   flight_segments   INSERT/UPDATE/DELETE
--   tickets           INSERT/UPDATE OF status/DELETE
--   customer_payments INSERT/UPDATE/DELETE
-- Re-runnable (idempotent).
-- ============================================================

-- 1) Recompute function (CREATE OR REPLACE: idempotent)
CREATE OR REPLACE FUNCTION fn_recompute_booking_status(p_booking_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_new_status   booking_status_enum;
  v_total        INT;
  v_cancelled    INT;
  v_pending      INT;
  v_modified     INT;
  v_issued_like  INT;
  v_departed     TIMESTAMP;
  v_selling      NUMERIC;
  v_paid         NUMERIC;
  v_departed_flag BOOLEAN;
BEGIN
  IF p_booking_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_total FROM tickets WHERE booking_id = p_booking_id;
  SELECT COUNT(*) INTO v_cancelled FROM tickets WHERE booking_id = p_booking_id AND status = 'cancelled';
  SELECT COUNT(*) INTO v_pending FROM tickets WHERE booking_id = p_booking_id AND status = 'pending';
  SELECT COUNT(*) INTO v_modified FROM tickets WHERE booking_id = p_booking_id AND status = 'modified';
  -- issued-like = issued/refunded/partially_refunded (were issued)
  SELECT COUNT(*) INTO v_issued_like FROM tickets
    WHERE booking_id = p_booking_id AND status IN ('issued','refunded','partially_refunded');

  SELECT MAX(departure_at) INTO v_departed FROM flight_segments WHERE booking_id = p_booking_id;
  v_departed_flag := (v_departed IS NOT NULL AND v_departed <= now());

  SELECT COALESCE(current_selling_price, 0) INTO v_selling FROM bookings WHERE id = p_booking_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM customer_payments WHERE booking_id = p_booking_id;

  IF v_total = 0 THEN
    -- No ticket records yet: payment stage
    IF v_selling > 0 AND v_paid < v_selling THEN
      v_new_status := 'WAITING_PAYMENT';
    ELSE
      v_new_status := 'NEW';
    END IF;
  ELSIF v_cancelled = v_total THEN
    v_new_status := 'CANCELLED';
  ELSIF v_cancelled > 0 AND (v_total - v_cancelled) > 0 THEN
    v_new_status := 'PARTIALLY_CANCELLED';
  ELSIF v_issued_like = v_total AND v_departed_flag THEN
    v_new_status := 'COMPLETED';
  ELSIF v_modified > 0 THEN
    v_new_status := 'MODIFIED';
  ELSIF v_issued_like = v_total THEN
    v_new_status := 'TICKETED';
  ELSIF v_pending > 0 THEN
    v_new_status := 'WAITING_TICKETING';
  ELSE
    v_new_status := 'NEW';
  END IF;

  UPDATE bookings SET booking_status = v_new_status, updated_at = now() WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger function for child tables (tickets / payments / segments), key = booking_id
CREATE OR REPLACE FUNCTION fn_booking_status_on_change()
RETURNS TRIGGER AS $$
DECLARE v_booking_id BIGINT;
BEGIN
  v_booking_id := COALESCE(NEW.booking_id, OLD.booking_id);
  PERFORM fn_recompute_booking_status(v_booking_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3) Trigger function for the bookings table itself (key = id)
CREATE OR REPLACE FUNCTION fn_booking_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM fn_recompute_booking_status(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Replace old ticket-derived trigger with the reliable recompute triggers
DROP TRIGGER IF EXISTS trg_ticket_status_change ON tickets;
DROP TRIGGER IF EXISTS trg_booking_status_on_ticket ON tickets;
CREATE TRIGGER trg_booking_status_on_ticket
AFTER INSERT OR UPDATE OF status OR DELETE ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_booking_status_on_change();

-- Planes/segments changes can flip TICKETED/COMPLETED
DROP TRIGGER IF EXISTS trg_booking_status_on_segment ON flight_segments;
CREATE TRIGGER trg_booking_status_on_segment
AFTER INSERT OR UPDATE OR DELETE ON flight_segments
FOR EACH ROW EXECUTE FUNCTION fn_booking_status_on_change();

-- Payment changes move a booking out of WAITING_PAYMENT once fully paid
DROP TRIGGER IF EXISTS trg_customer_payment_booking_status ON customer_payments;
CREATE TRIGGER trg_customer_payment_booking_status
AFTER INSERT OR UPDATE OR DELETE ON customer_payments
FOR EACH ROW EXECUTE FUNCTION fn_booking_status_on_change();

-- Booking creation / date / risk / price changes drive WAITING_PAYMENT & completion
DROP TRIGGER IF EXISTS trg_booking_status_on_booking ON bookings;
CREATE TRIGGER trg_booking_status_on_booking
AFTER INSERT OR UPDATE OF depart_date, return_date, issued_before_payment, current_selling_price ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_booking_status_on_booking();

-- 5) Backfill: recompute every booking from source data
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM bookings LOOP
    PERFORM fn_recompute_booking_status(r.id);
  END LOOP;
END $$;
