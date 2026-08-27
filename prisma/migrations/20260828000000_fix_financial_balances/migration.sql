-- ============================================================
-- Migration: fix financial balance computation (Layer 3)
--
-- Problem: customers.balance and execution_companies.balance were
-- only decremented on payment INSERT and never incremented when a
-- booking's selling/purchase price was set. As a result balances
-- never reflected the amount owed and the "customers in debt"
-- dashboard query (balance > 0) returned nothing.
--
-- Correct semantics (idempotent recompute from source data):
--   customers.balance           = SUM(bookings.current_selling_price)  - SUM(customer_payments.amount)
--   execution_companies.balance = SUM(bookings.current_purchase_price) - SUM(execution_payments.amount)
--
-- Balances are recomputed on change via triggers (no drift):
--   - customer_payments    INSERT/UPDATE/DELETE
--   - execution_payments   INSERT/UPDATE/DELETE
--   - bookings             UPDATE of current_selling_price / current_purchase_price
-- ============================================================

-- 1) Recompute helper functions (idempotent: CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION fn_recompute_customer_balance(p_customer_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE customers c
  SET balance = (
        (SELECT COALESCE(SUM(b.current_selling_price), 0)
           FROM bookings b WHERE b.customer_id = p_customer_id)
        -
        (SELECT COALESCE(SUM(cp.amount), 0)
           FROM customer_payments cp WHERE cp.customer_id = p_customer_id)
      ),
      updated_at = now()
  WHERE c.id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_recompute_execution_balance(p_company_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE execution_companies ec
  SET balance = (
        (SELECT COALESCE(SUM(b.current_purchase_price), 0)
           FROM bookings b WHERE b.execution_company_id = p_company_id)
        -
        (SELECT COALESCE(SUM(ep.amount), 0)
           FROM execution_payments ep WHERE ep.execution_company_id = p_company_id)
      ),
      updated_at = now()
  WHERE ec.id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger functions
CREATE OR REPLACE FUNCTION fn_balance_on_customer_payment()
RETURNS TRIGGER AS $$
DECLARE v_customer_id BIGINT;
BEGIN
  v_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
  PERFORM fn_recompute_customer_balance(v_customer_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_balance_on_execution_payment()
RETURNS TRIGGER AS $$
DECLARE v_company_id BIGINT;
BEGIN
  v_company_id := COALESCE(NEW.execution_company_id, OLD.execution_company_id);
  PERFORM fn_recompute_execution_balance(v_company_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_balance_on_booking_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_selling_price IS DISTINCT FROM OLD.current_selling_price THEN
    PERFORM fn_recompute_customer_balance(NEW.customer_id);
  END IF;
  IF NEW.current_purchase_price IS DISTINCT FROM OLD.current_purchase_price THEN
    PERFORM fn_recompute_execution_balance(NEW.execution_company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Replace the faulty incremental payment triggers with recompute triggers
DROP TRIGGER IF EXISTS trg_customer_payment_insert ON customer_payments;
DROP TRIGGER IF EXISTS trg_customer_payment_balance ON customer_payments;
CREATE TRIGGER trg_customer_payment_balance
AFTER INSERT OR UPDATE OR DELETE ON customer_payments
FOR EACH ROW EXECUTE FUNCTION fn_balance_on_customer_payment();

DROP TRIGGER IF EXISTS trg_execution_payment_insert ON execution_payments;
DROP TRIGGER IF EXISTS trg_execution_payment_balance ON execution_payments;
CREATE TRIGGER trg_execution_payment_balance
AFTER INSERT OR UPDATE OR DELETE ON execution_payments
FOR EACH ROW EXECUTE FUNCTION fn_balance_on_execution_payment();

-- 4) New trigger so booking price changes update balances
DROP TRIGGER IF EXISTS trg_booking_price_balance ON bookings;
CREATE TRIGGER trg_booking_price_balance
AFTER UPDATE OF current_selling_price, current_purchase_price ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_balance_on_booking_price();

-- 5) Backfill: recompute every existing balance from source data
UPDATE customers c SET balance = (
        (SELECT COALESCE(SUM(b.current_selling_price), 0)
           FROM bookings b WHERE b.customer_id = c.id)
        -
        (SELECT COALESCE(SUM(cp.amount), 0)
           FROM customer_payments cp WHERE cp.customer_id = c.id)
      ),
      updated_at = now();

UPDATE execution_companies ec SET balance = (
        (SELECT COALESCE(SUM(b.current_purchase_price), 0)
           FROM bookings b WHERE b.execution_company_id = ec.id)
        -
        (SELECT COALESCE(SUM(ep.amount), 0)
           FROM execution_payments ep WHERE ep.execution_company_id = ec.id)
      ),
      updated_at = now();
