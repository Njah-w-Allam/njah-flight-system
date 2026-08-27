-- ============================================================
-- نظام إدارة حجوزات الطيران — Final Schema
-- PostgreSQL DDL — جاهز للتنفيذ المباشر
-- العملة الافتراضية: EGP
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE trip_type_enum AS ENUM ('one_way', 'round_trip');

CREATE TYPE credit_status_enum AS ENUM ('NEW', 'TRUSTED', 'RESTRICTED');

CREATE TYPE booking_request_status_enum AS ENUM (
  'NEW', 'WAITING_FOR_OFFERS', 'OFFER_SELECTED', 'CONVERTED', 'CANCELLED'
);

CREATE TYPE offer_type_enum AS ENUM ('economy', 'business', 'other');

CREATE TYPE offer_status_enum AS ENUM ('received', 'rejected', 'expired', 'cancelled');
-- ملاحظة: تم حذف status = 'selected' عمدًا. مصدر الحقيقة الوحيد للعرض المختار هو bookings.selected_offer_id

CREATE TYPE booking_status_enum AS ENUM (
  'NEW', 'WAITING_PAYMENT', 'WAITING_TICKETING', 'TICKETED',
  'COMPLETED', 'CANCELLED', 'PARTIALLY_CANCELLED', 'MODIFIED', 'AT_RISK'
);
-- ملاحظة: هذا الحقل مشتق تلقائيًا عبر Trigger من حالة التذاكر المرتبطة. لا يُكتب يدويًا من الواجهة.

CREATE TYPE ticket_status_enum AS ENUM (
  'pending', 'issued', 'modified', 'cancelled',
  'refund_pending', 'partially_refunded', 'refunded'
);

CREATE TYPE payment_method_enum AS ENUM ('cash', 'instapay', 'vodafone_cash');

CREATE TYPE payment_status_enum AS ENUM ('pending', 'partially_paid', 'paid', 'overdue');

CREATE TYPE responsible_party_enum AS ENUM ('customer', 'execution_company', 'owner', 'shared');

CREATE TYPE refund_status_enum AS ENUM ('pending', 'approved', 'processed', 'rejected');

CREATE TYPE alert_type_enum AS ENUM (
  'customer_payment_due', 'execution_payment_due', 'ticket_issue_due',
  'travel_date_near', 'unconfirmed_booking', 'unissued_ticket',
  'overdue_payment', 'booking_risk', 'refund_pending'
);

CREATE TYPE alert_severity_enum AS ENUM ('info', 'warning', 'critical');

CREATE TYPE alert_status_enum AS ENUM ('open', 'resolved');


-- ============================================================
-- 2. USERS (بديل عن user_name كنص حر)
-- ============================================================

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'owner',
  created_at    TIMESTAMP    NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id             BIGSERIAL PRIMARY KEY,
  name           VARCHAR(150)   NOT NULL,
  phone          VARCHAR(20)    NOT NULL,
  address        TEXT,
  balance        DECIMAL(15,2)  NOT NULL DEFAULT 0, -- يُحدَّث فقط عبر Trigger
  credit_status  credit_status_enum NOT NULL DEFAULT 'NEW',
  currency       VARCHAR(3)     NOT NULL DEFAULT 'EGP',
  notes          TEXT,
  created_at     TIMESTAMP      NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP      NOT NULL DEFAULT now()
);


-- ============================================================
-- 4. EXECUTION_COMPANIES
-- ============================================================

CREATE TABLE execution_companies (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  contact_person  VARCHAR(150),
  phone           VARCHAR(20),
  address         TEXT,
  balance         DECIMAL(15,2) NOT NULL DEFAULT 0, -- يُحدَّث فقط عبر Trigger
  currency        VARCHAR(3)    NOT NULL DEFAULT 'EGP',
  created_at      TIMESTAMP     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP     NOT NULL DEFAULT now()
);


-- ============================================================
-- 5. AIRLINES (بيانات وصفية فقط)
-- ============================================================

CREATE TABLE airlines (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  code        VARCHAR(20),
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP NOT NULL DEFAULT now()
);


-- ============================================================
-- 6. BOOKING_REQUESTS
-- ============================================================

CREATE TABLE booking_requests (
  id                BIGSERIAL PRIMARY KEY,
  customer_id       BIGINT NOT NULL REFERENCES customers(id),
  origin            VARCHAR(100) NOT NULL,
  destination       VARCHAR(100) NOT NULL,
  trip_type         trip_type_enum NOT NULL,
  depart_date       DATE NOT NULL,
  return_date       DATE,
  passengers_count  INT NOT NULL DEFAULT 1,
  requirements      TEXT,
  status            booking_request_status_enum NOT NULL DEFAULT 'NEW',
  notes             TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_requests_customer ON booking_requests(customer_id);


-- ============================================================
-- 7. EXECUTION_OFFERS
-- ============================================================

CREATE TABLE execution_offers (
  id                     BIGSERIAL PRIMARY KEY,
  request_id             BIGINT NOT NULL REFERENCES booking_requests(id),
  execution_company_id   BIGINT NOT NULL REFERENCES execution_companies(id),
  airline_id             BIGINT NOT NULL REFERENCES airlines(id),
  offer_type             offer_type_enum NOT NULL DEFAULT 'economy',
  execution_cost         DECIMAL(15,2) NOT NULL,
  currency               VARCHAR(3) NOT NULL DEFAULT 'EGP',
  flight_details         TEXT,
  ticketing_deadline     TIMESTAMP,
  payment_deadline       TIMESTAMP,
  received_at            TIMESTAMP NOT NULL DEFAULT now(),
  status                 offer_status_enum NOT NULL DEFAULT 'received',
  notes                  TEXT,
  created_at             TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_execution_offers_request ON execution_offers(request_id);
CREATE INDEX idx_execution_offers_company ON execution_offers(execution_company_id);


-- ============================================================
-- 8. BOOKINGS (الجدول المركزي)
-- ============================================================

CREATE TABLE bookings (
  id                       BIGSERIAL PRIMARY KEY,
  request_id               BIGINT REFERENCES booking_requests(id),
  customer_id               BIGINT NOT NULL REFERENCES customers(id),
  selected_offer_id         BIGINT NOT NULL REFERENCES execution_offers(id),
  execution_company_id      BIGINT NOT NULL REFERENCES execution_companies(id), -- مشتق تلقائيًا، لا يُكتب يدويًا
  booking_reference         VARCHAR(100),
  booking_status            booking_status_enum NOT NULL DEFAULT 'NEW', -- مشتق عبر Trigger من التذاكر
  depart_date                DATE NOT NULL,
  return_date                DATE,
  current_purchase_price     DECIMAL(15,2) NOT NULL DEFAULT 0, -- snapshot من price_history
  current_selling_price      DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_profit             DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency                   VARCHAR(3) NOT NULL DEFAULT 'EGP',
  issued_before_payment      BOOLEAN NOT NULL DEFAULT false,
  risk_approved_by           VARCHAR(150),
  risk_reason                TEXT,
  notes                      TEXT,
  created_at                 TIMESTAMP NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_execution_company ON bookings(execution_company_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_depart_date ON bookings(depart_date);


-- ============================================================
-- 9. PRICE_HISTORY
-- ============================================================

CREATE TABLE price_history (
  id                BIGSERIAL PRIMARY KEY,
  booking_id        BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  execution_cost    DECIMAL(15,2) NOT NULL,
  selling_price     DECIMAL(15,2) NOT NULL,
  profit            DECIMAL(15,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'EGP',
  changed_at        TIMESTAMP NOT NULL DEFAULT now(),
  changed_by        VARCHAR(150),
  reason            TEXT
);

CREATE INDEX idx_price_history_booking ON price_history(booking_id);


-- ============================================================
-- 10. FLIGHT_SEGMENTS
-- ============================================================

CREATE TABLE flight_segments (
  id             BIGSERIAL PRIMARY KEY,
  booking_id     BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  airline_id     BIGINT NOT NULL REFERENCES airlines(id),
  segment_order  INT NOT NULL,
  from_location  VARCHAR(100) NOT NULL,
  to_location    VARCHAR(100) NOT NULL,
  flight_number  VARCHAR(50),
  departure_at   TIMESTAMP NOT NULL,
  arrival_at     TIMESTAMP NOT NULL,
  terminal       VARCHAR(50),
  class          VARCHAR(50),
  baggage        VARCHAR(50),
  notes          TEXT
);

CREATE INDEX idx_flight_segments_booking ON flight_segments(booking_id);
CREATE INDEX idx_flight_segments_departure ON flight_segments(departure_at);


-- ============================================================
-- 11. PASSENGERS
-- ============================================================

CREATE TABLE passengers (
  id               BIGSERIAL PRIMARY KEY,
  booking_id       BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name             VARCHAR(150) NOT NULL,
  passport_number  VARCHAR(50),
  nationality      VARCHAR(100),
  date_of_birth    DATE,
  notes            TEXT
);

CREATE INDEX idx_passengers_booking ON passengers(booking_id);


-- ============================================================
-- 12. TICKETS
-- ============================================================

CREATE TABLE tickets (
  id             BIGSERIAL PRIMARY KEY,
  booking_id     BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  airline_id     BIGINT NOT NULL REFERENCES airlines(id),
  ticket_number  VARCHAR(100),
  pnr            VARCHAR(100),
  ticket_price   DECIMAL(15,2) NOT NULL,
  currency       VARCHAR(3) NOT NULL DEFAULT 'EGP',
  issue_date     TIMESTAMP,
  status         ticket_status_enum NOT NULL DEFAULT 'pending',
  notes          TEXT
);

CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_status ON tickets(status);


-- ============================================================
-- 13. TICKET_PASSENGERS (Bridge Table — علاقة N:M)
-- ============================================================

CREATE TABLE ticket_passengers (
  ticket_id     BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  passenger_id  BIGINT NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (ticket_id, passenger_id)
);


-- ============================================================
-- 14. CUSTOMER_PAYMENTS
-- ============================================================

CREATE TABLE customer_payments (
  id              BIGSERIAL PRIMARY KEY,
  booking_id      BIGINT NOT NULL REFERENCES bookings(id),
  customer_id     BIGINT NOT NULL REFERENCES customers(id),
  amount          DECIMAL(15,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
  payment_method  payment_method_enum NOT NULL,
  payment_date    TIMESTAMP NOT NULL DEFAULT now(),
  status          payment_status_enum NOT NULL DEFAULT 'paid',
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id);
CREATE INDEX idx_customer_payments_booking ON customer_payments(booking_id);


-- ============================================================
-- 15. EXECUTION_PAYMENTS
-- ============================================================

CREATE TABLE execution_payments (
  id                     BIGSERIAL PRIMARY KEY,
  booking_id             BIGINT NOT NULL REFERENCES bookings(id),
  execution_company_id   BIGINT NOT NULL REFERENCES execution_companies(id),
  amount                 DECIMAL(15,2) NOT NULL,
  currency               VARCHAR(3) NOT NULL DEFAULT 'EGP',
  payment_date           TIMESTAMP NOT NULL DEFAULT now(),
  status                 payment_status_enum NOT NULL DEFAULT 'paid',
  notes                  TEXT,
  created_at             TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_execution_payments_company ON execution_payments(execution_company_id);
CREATE INDEX idx_execution_payments_booking ON execution_payments(booking_id);


-- ============================================================
-- 16. REFUNDS
-- ============================================================

CREATE TABLE refunds (
  id                  BIGSERIAL PRIMARY KEY,
  ticket_id           BIGINT NOT NULL REFERENCES tickets(id),
  expected_amount     DECIMAL(15,2) NOT NULL,
  actual_amount       DECIMAL(15,2),
  refund_fee          DECIMAL(15,2),
  currency            VARCHAR(3) NOT NULL DEFAULT 'EGP',
  responsible_party   responsible_party_enum NOT NULL,
  status              refund_status_enum NOT NULL DEFAULT 'pending',
  refund_date         TIMESTAMP,
  notes               TEXT
);

CREATE INDEX idx_refunds_ticket ON refunds(ticket_id);


-- ============================================================
-- 17. MODIFICATIONS
-- ============================================================

CREATE TABLE modifications (
  id                  BIGSERIAL PRIMARY KEY,
  ticket_id           BIGINT NOT NULL REFERENCES tickets(id),
  old_data            JSONB,
  new_data            JSONB,
  fee                 DECIMAL(15,2),
  currency            VARCHAR(3) NOT NULL DEFAULT 'EGP',
  paid_by             responsible_party_enum,
  modification_date   TIMESTAMP NOT NULL DEFAULT now(),
  notes               TEXT
);

CREATE INDEX idx_modifications_ticket ON modifications(ticket_id);


-- ============================================================
-- 18. DOCUMENTS (موحّد)
-- ============================================================

CREATE TABLE documents (
  id              BIGSERIAL PRIMARY KEY,
  customer_id     BIGINT REFERENCES customers(id),
  passenger_id    BIGINT REFERENCES passengers(id),
  booking_id      BIGINT REFERENCES bookings(id),
  document_type   VARCHAR(100) NOT NULL,
  file_url        VARCHAR(500) NOT NULL,
  uploaded_at     TIMESTAMP NOT NULL DEFAULT now(),
  notes           TEXT,
  CONSTRAINT chk_documents_owner CHECK (
    customer_id IS NOT NULL OR passenger_id IS NOT NULL OR booking_id IS NOT NULL
  )
);


-- ============================================================
-- 19. ALERTS
-- ============================================================

CREATE TABLE alerts (
  id                     BIGSERIAL PRIMARY KEY,
  booking_id             BIGINT REFERENCES bookings(id),
  ticket_id              BIGINT REFERENCES tickets(id),
  customer_id            BIGINT REFERENCES customers(id),
  execution_company_id   BIGINT REFERENCES execution_companies(id),
  type                   alert_type_enum NOT NULL,
  severity               alert_severity_enum NOT NULL DEFAULT 'info',
  due_date               TIMESTAMP,
  status                 alert_status_enum NOT NULL DEFAULT 'open',
  message                TEXT NOT NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT now(),
  read_at                TIMESTAMP
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_booking ON alerts(booking_id);
CREATE INDEX idx_alerts_due_date ON alerts(due_date);


-- ============================================================
-- 20. ACTIVITY_LOGS
-- ============================================================

CREATE TABLE activity_logs (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id),
  entity_type  VARCHAR(50) NOT NULL,
  entity_id    BIGINT NOT NULL,
  action       VARCHAR(100) NOT NULL,
  old_data     JSONB,
  new_data     JSONB,
  created_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);


-- ============================================================
-- 21. TRIGGERS
-- ============================================================

-- Trigger 1: تحديث رصيد العميل عند أي دفعة جديدة
CREATE OR REPLACE FUNCTION fn_update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET balance = balance - NEW.amount,
      updated_at = now()
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_payment_insert
AFTER INSERT ON customer_payments
FOR EACH ROW EXECUTE FUNCTION fn_update_customer_balance();


-- Trigger 2: تحديث رصيد شركة التنفيذ عند أي دفعة جديدة
CREATE OR REPLACE FUNCTION fn_update_execution_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE execution_companies
  SET balance = balance - NEW.amount,
      updated_at = now()
  WHERE id = NEW.execution_company_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_execution_payment_insert
AFTER INSERT ON execution_payments
FOR EACH ROW EXECUTE FUNCTION fn_update_execution_balance();


-- Trigger 3: تحديث snapshot السعر الحالي على bookings عند إضافة صف جديد في price_history
CREATE OR REPLACE FUNCTION fn_update_booking_current_price()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bookings
  SET current_purchase_price = NEW.execution_cost,
      current_selling_price  = NEW.selling_price,
      current_profit         = NEW.profit,
      updated_at              = now()
  WHERE id = NEW.booking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_price_history_insert
AFTER INSERT ON price_history
FOR EACH ROW EXECUTE FUNCTION fn_update_booking_current_price();


-- Trigger 4: اشتقاق booking_status من حالة التذاكر المرتبطة، عند أي تغيير على tickets.status
CREATE OR REPLACE FUNCTION fn_derive_booking_status()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_id BIGINT;
  v_total INT;
  v_cancelled INT;
  v_issued INT;
  v_pending INT;
  v_new_status booking_status_enum;
BEGIN
  v_booking_id := COALESCE(NEW.booking_id, OLD.booking_id);

  SELECT COUNT(*) INTO v_total FROM tickets WHERE booking_id = v_booking_id;
  SELECT COUNT(*) INTO v_cancelled FROM tickets WHERE booking_id = v_booking_id AND status = 'cancelled';
  SELECT COUNT(*) INTO v_issued FROM tickets WHERE booking_id = v_booking_id AND status = 'issued';
  SELECT COUNT(*) INTO v_pending FROM tickets WHERE booking_id = v_booking_id AND status = 'pending';

  IF v_total = 0 THEN
    v_new_status := 'NEW';
  ELSIF v_cancelled = v_total THEN
    v_new_status := 'CANCELLED';
  ELSIF v_cancelled > 0 AND v_cancelled < v_total THEN
    v_new_status := 'PARTIALLY_CANCELLED';
  ELSIF v_issued = v_total THEN
    v_new_status := 'TICKETED';
  ELSIF v_pending = v_total THEN
    v_new_status := 'WAITING_TICKETING';
  ELSE
    v_new_status := 'MODIFIED';
  END IF;

  UPDATE bookings SET booking_status = v_new_status, updated_at = now() WHERE id = v_booking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_status_change
AFTER INSERT OR UPDATE OF status OR DELETE ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_derive_booking_status();


-- Trigger 5: Cascade عند إلغاء الحجز — إغلاق التنبيهات وتحويل العروض المرتبطة لـ rejected
CREATE OR REPLACE FUNCTION fn_booking_cancellation_cascade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_status = 'CANCELLED' AND OLD.booking_status IS DISTINCT FROM 'CANCELLED' THEN
    UPDATE alerts
    SET status = 'resolved'
    WHERE booking_id = NEW.id AND status = 'open';

    UPDATE execution_offers
    SET status = 'rejected'
    WHERE request_id = NEW.request_id AND status = 'received';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_status_cancelled
AFTER UPDATE OF booking_status ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_booking_cancellation_cascade();


-- ============================================================
-- ملاحظة تنفيذية: شاشة "التذاكر القريبة" (Upcoming Tickets)
-- تُبنى بـ Query مباشر (ليس Trigger)، مثال:
--
-- SELECT t.*, fs.departure_at, c.name AS customer_name
-- FROM tickets t
-- JOIN bookings b ON b.id = t.booking_id
-- JOIN customers c ON c.id = b.customer_id
-- JOIN flight_segments fs ON fs.booking_id = b.id
-- WHERE fs.departure_at BETWEEN now() AND now() + INTERVAL '1 day'
--   AND t.status != 'cancelled'
-- ORDER BY fs.departure_at ASC;
-- ============================================================
