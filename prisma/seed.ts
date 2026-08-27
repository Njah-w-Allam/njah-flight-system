import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean all tables in order (respect FKs)
  await prisma.$executeRaw`TRUNCATE TABLE activity_logs CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE alerts CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE documents CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE modifications CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE refunds CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE ticket_passengers CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE tickets CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE execution_payments CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE customer_payments CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE passengers CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE flight_segments CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE price_history CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE bookings CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE execution_offers CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE booking_requests CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE airlines CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE execution_companies CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE customers CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;

  // 1. Users
  const user = await prisma.users.create({
    data: { name: "المالك", role: "owner" },
  });
  console.log("✓ User created");

  // 2. Airlines
  const egyptAir = await prisma.airlines.create({
    data: { name: "مصر للطيران", code: "MS" },
  });
  const emirates = await prisma.airlines.create({
    data: { name: "طيران الإمارات", code: "EK" },
  });
  const saudia = await prisma.airlines.create({
    data: { name: "الخطوط السعودية", code: "SV" },
  });
  const royalJordanian = await prisma.airlines.create({
    data: { name: "الملكية الأردنية", code: "RJ" },
  });
  const turkish = await prisma.airlines.create({
    data: { name: "الخطوط التركية", code: "TK" },
  });
  console.log("✓ Airlines created");

  // 3. Customers
  const customers = await Promise.all([
    prisma.customers.create({
      data: {
        name: "أحمد محمد علي",
        phone: "01012345678",
        address: "القاهرة، مصر",
        credit_status: "TRUSTED",
        notes: "عميل مميز",
      },
    }),
    prisma.customers.create({
      data: {
        name: "فاطمة حسن إبراهيم",
        phone: "01123456789",
        address: "الإسكندرية، مصر",
        credit_status: "NEW",
      },
    }),
    prisma.customers.create({
      data: {
        name: "خالد عبدالله سعيد",
        phone: "01234567890",
        address: "الجيزة، مصر",
        credit_status: "TRUSTED",
      },
    }),
    prisma.customers.create({
      data: {
        name: "نورا حسين محمود",
        phone: "01098765432",
        address: "المنصورة، مصر",
        credit_status: "RESTRICTED",
        notes: "متأخر في الدفع",
      },
    }),
    prisma.customers.create({
      data: {
        name: "عمر salud_extend",
        phone: "01155566677",
        address: "طنطا، مصر",
        credit_status: "NEW",
      },
    }),
  ]);
  console.log("✓ Customers created");

  // 4. Execution Companies
  const execCompanies = await Promise.all([
    prisma.execution_companies.create({
      data: {
        name: "شركة الرحلات السياحية",
        contact_person: "محمد رشدي",
        phone: "01011122233",
        address: "وسط البلد، القاهرة",
      },
    }),
    prisma.execution_companies.create({
      data: {
        name: "الTravel Hub",
        contact_person: "سارة أحمد",
        phone: "01222333444",
        address: "مدينة نصر، القاهرة",
      },
    }),
    prisma.execution_companies.create({
      data: {
        name: "شركة الجو السريع",
        contact_person: "عثمان محمود",
        phone: "01333444555",
        address: "الإسكندرية",
      },
    }),
  ]);
  console.log("✓ Execution companies created");

  // 5. Booking Requests
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const requests = await Promise.all([
    prisma.booking_requests.create({
      data: {
        customer_id: customers[0].id,
        origin: "القاهرة",
        destination: "دبي",
        trip_type: "round_trip",
        depart_date: tomorrow,
        return_date: nextWeek,
        passengers_count: 2,
        requirements: "مقاعد بجانب النافذة",
        status: "NEW",
      },
    }),
    prisma.booking_requests.create({
      data: {
        customer_id: customers[1].id,
        origin: "الإسكندرية",
        destination: "لندن",
        trip_type: "one_way",
        depart_date: nextWeek,
        passengers_count: 1,
        status: "WAITING_FOR_OFFERS",
      },
    }),
    prisma.booking_requests.create({
      data: {
        customer_id: customers[2].id,
        origin: "القاهرة",
        destination: "جدة",
        trip_type: "round_trip",
        depart_date: nextMonth,
        return_date: new Date(nextMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
        passengers_count: 4,
        requirements: "4 مقاعد معاً",
        status: "CONVERTED",
      },
    }),
    prisma.booking_requests.create({
      data: {
        customer_id: customers[3].id,
        origin: "القاهرة",
        destination: "إسطنبول",
        trip_type: "one_way",
        depart_date: tomorrow,
        passengers_count: 1,
        status: "NEW",
      },
    }),
    prisma.booking_requests.create({
      data: {
        customer_id: customers[4].id,
        origin: "القاهرة",
        destination: "عمّان",
        trip_type: "round_trip",
        depart_date: nextWeek,
        return_date: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
        passengers_count: 1,
        status: "CANCELLED",
      },
    }),
  ]);
  console.log("✓ Booking requests created");

  // 6. Execution Offers
  const offers = await Promise.all([
    prisma.execution_offers.create({
      data: {
        request_id: requests[0].id,
        execution_company_id: execCompanies[0].id,
        airline_id: emirates.id,
        offer_type: "economy",
        execution_cost: 15000,
        flight_details: "ذهاب وعودة القاهرة-دبي، رحلة مباشرة",
        ticketing_deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        payment_deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: "received",
      },
    }),
    prisma.execution_offers.create({
      data: {
        request_id: requests[0].id,
        execution_company_id: execCompanies[1].id,
        airline_id: egyptAir.id,
        offer_type: "economy",
        execution_cost: 13500,
        flight_details: "ذهاب وعودة القاهرة-دبي، رحلة مباشرة مصر للطيران",
        ticketing_deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        payment_deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: "received",
      },
    }),
    prisma.execution_offers.create({
      data: {
        request_id: requests[1].id,
        execution_company_id: execCompanies[0].id,
        airline_id: emirates.id,
        offer_type: "business",
        execution_cost: 45000,
        flight_details: "الإسكندرية-دبي-لندن، كلاس رجال أعمال",
        ticketing_deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: "received",
      },
    }),
    prisma.execution_offers.create({
      data: {
        request_id: requests[1].id,
        execution_company_id: execCompanies[2].id,
        airline_id: turkish.id,
        offer_type: "economy",
        execution_cost: 22000,
        flight_details: "الإسكندرية-إسطنبول-لندن",
        ticketing_deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: "received",
      },
    }),
    // Offers for converted request
    prisma.execution_offers.create({
      data: {
        request_id: requests[2].id,
        execution_company_id: execCompanies[0].id,
        airline_id: saudia.id,
        offer_type: "economy",
        execution_cost: 28000,
        flight_details: " القاهرة-جدة ذهاب وعودة 4 مقاعد",
        ticketing_deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: "received",
      },
    }),
  ]);
  console.log("✓ Execution offers created");

  // 7. Bookings (from converted request)
  const booking1 = await prisma.bookings.create({
    data: {
      request_id: requests[2].id,
      customer_id: customers[2].id,
      selected_offer_id: offers[4].id,
      execution_company_id: execCompanies[0].id,
      booking_reference: "BK-2026-001",
      booking_status: "WAITING_TICKETING",
      depart_date: nextMonth,
      return_date: new Date(nextMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
      current_purchase_price: 28000,
      current_selling_price: 35000,
      current_profit: 7000,
    },
  });

  const booking2 = await prisma.bookings.create({
    data: {
      request_id: null,
      customer_id: customers[0].id,
      selected_offer_id: offers[0].id,
      execution_company_id: execCompanies[0].id,
      booking_reference: "BK-2026-002",
      booking_status: "NEW",
      depart_date: tomorrow,
      current_purchase_price: 15000,
      current_selling_price: 0,
      current_profit: -15000,
    },
  });

  // Booking departing today (for upcoming tickets)
  const todayDepart = new Date(now);
  todayDepart.setHours(now.getHours() + 4);
  const booking3 = await prisma.bookings.create({
    data: {
      customer_id: customers[1].id,
      selected_offer_id: offers[2].id,
      execution_company_id: execCompanies[1].id,
      booking_reference: "BK-2026-003",
      booking_status: "WAITING_TICKETING",
      depart_date: new Date(),
      current_purchase_price: 45000,
      current_selling_price: 55000,
      current_profit: 10000,
      issued_before_payment: true,
      risk_approved_by: "المالك",
      risk_reason: "عميل ثقة",
    },
  });
  console.log("✓ Bookings created");

  // 8. Price History
  await prisma.price_history.create({
    data: {
      booking_id: booking1.id,
      execution_cost: 28000,
      selling_price: 35000,
      profit: 7000,
      changed_by: "المالك",
      reason: "سعر البيع الأولي",
    },
  });
  console.log("✓ Price history created");

  // 9. Flight Segments
  await Promise.all([
    // Booking 1 - outbound
    prisma.flight_segments.create({
      data: {
        booking_id: booking1.id,
        airline_id: saudia.id,
        segment_order: 1,
        from_location: "القاهرة",
        to_location: "جدة",
        flight_number: "SV306",
        departure_at: nextMonth,
        arrival_at: new Date(nextMonth.getTime() + 4 * 60 * 60 * 1000),
        terminal: "3",
        class: "economy",
        baggage: "23 كجم",
      },
    }),
    prisma.flight_segments.create({
      data: {
        booking_id: booking1.id,
        airline_id: saudia.id,
        segment_order: 2,
        from_location: "جدة",
        to_location: "القاهرة",
        flight_number: "SV305",
        departure_at: new Date(nextMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
        arrival_at: new Date(nextMonth.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        terminal: "3",
        class: "economy",
        baggage: "23 كجم",
      },
    }),
    // Booking 2 - one way
    prisma.flight_segments.create({
      data: {
        booking_id: booking2.id,
        airline_id: emirates.id,
        segment_order: 1,
        from_location: "القاهرة",
        to_location: "دبي",
        flight_number: "EK924",
        departure_at: tomorrow,
        arrival_at: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
        terminal: "3",
        class: "economy",
        baggage: "30 كجم",
      },
    }),
    // Booking 3 - departing soon (for upcoming tickets test)
    prisma.flight_segments.create({
      data: {
        booking_id: booking3.id,
        airline_id: emirates.id,
        segment_order: 1,
        from_location: "القاهرة",
        to_location: "لندن",
        flight_number: "EK054",
        departure_at: todayDepart,
        arrival_at: new Date(todayDepart.getTime() + 6 * 60 * 60 * 1000),
        terminal: "3",
        class: "business",
        baggage: "40 كجم",
      },
    }),
  ]);
  console.log("✓ Flight segments created");

  // 10. Passengers
  const passengers = await Promise.all([
    prisma.passengers.create({
      data: {
        booking_id: booking1.id,
        name: "خالد عبدالله سعيد",
        passport_number: "A12345678",
        nationality: "مصري",
        date_of_birth: new Date("1985-06-15"),
      },
    }),
    prisma.passengers.create({
      data: {
        booking_id: booking1.id,
        name: "أم خالد عبدالله",
        passport_number: "A23456789",
        nationality: "مصرية",
        date_of_birth: new Date("1988-03-22"),
      },
    }),
    prisma.passengers.create({
      data: {
        booking_id: booking1.id,
        name: "يوسف خالد عبدالله",
        passport_number: "A34567890",
        nationality: "مصري",
        date_of_birth: new Date("2015-09-10"),
      },
    }),
    prisma.passengers.create({
      data: {
        booking_id: booking1.id,
        name: "ريم خالد عبدالله",
        passport_number: "A45678901",
        nationality: "مصرية",
        date_of_birth: new Date("2018-12-05"),
      },
    }),
    // Booking 2
    prisma.passengers.create({
      data: {
        booking_id: booking2.id,
        name: "أحمد محمد علي",
        passport_number: "B12345678",
        nationality: "مصري",
        date_of_birth: new Date("1990-01-20"),
      },
    }),
    // Booking 3
    prisma.passengers.create({
      data: {
        booking_id: booking3.id,
        name: "فاطمة حسن إبراهيم",
        passport_number: "C12345678",
        nationality: "مصرية",
        date_of_birth: new Date("1992-07-30"),
      },
    }),
  ]);
  console.log("✓ Passengers created");

  // 11. Tickets
  const tickets = await Promise.all([
    prisma.tickets.create({
      data: {
        booking_id: booking1.id,
        airline_id: saudia.id,
        ticket_number: "057-2401234567",
        pnr: "ABC123",
        ticket_price: 7000,
        status: "pending",
      },
    }),
    prisma.tickets.create({
      data: {
        booking_id: booking1.id,
        airline_id: saudia.id,
        ticket_number: "057-2401234568",
        pnr: "ABC123",
        ticket_price: 7000,
        status: "pending",
      },
    }),
    // Booking 2 tickets
    prisma.tickets.create({
      data: {
        booking_id: booking2.id,
        airline_id: emirates.id,
        ticket_number: "176-2409876543",
        pnr: "XYZ789",
        ticket_price: 15000,
        status: "pending",
      },
    }),
    // Booking 3 - issued ticket (for upcoming test)
    prisma.tickets.create({
      data: {
        booking_id: booking3.id,
        airline_id: emirates.id,
        ticket_number: "176-2401112223",
        pnr: "DEF456",
        ticket_price: 45000,
        issue_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: "issued",
      },
    }),
  ]);
  console.log("✓ Tickets created");

  // 12. Ticket-Passenger links
  await Promise.all([
    // Booking 1 - 4 passengers, 2 tickets (2 passengers per ticket)
    prisma.ticket_passengers.create({
      data: { ticket_id: tickets[0].id, passenger_id: passengers[0].id },
    }),
    prisma.ticket_passengers.create({
      data: { ticket_id: tickets[0].id, passenger_id: passengers[1].id },
    }),
    prisma.ticket_passengers.create({
      data: { ticket_id: tickets[1].id, passenger_id: passengers[2].id },
    }),
    prisma.ticket_passengers.create({
      data: { ticket_id: tickets[1].id, passenger_id: passengers[3].id },
    }),
    // Booking 2
    prisma.ticket_passengers.create({
      data: { ticket_id: tickets[2].id, passenger_id: passengers[4].id },
    }),
    // Booking 3
    prisma.ticket_passengers.create({
      data: { ticket_id: tickets[3].id, passenger_id: passengers[5].id },
    }),
  ]);
  console.log("✓ Ticket-passenger links created");

  // 13. Customer Payments
  await Promise.all([
    prisma.customer_payments.create({
      data: {
        booking_id: booking1.id,
        customer_id: customers[2].id,
        amount: 10000,
        payment_method: "cash",
        status: "paid",
        notes: "دفعة أولى",
      },
    }),
    prisma.customer_payments.create({
      data: {
        booking_id: booking1.id,
        customer_id: customers[2].id,
        amount: 5000,
        payment_method: "instapay",
        status: "paid",
        notes: "دفعة ثانية",
      },
    }),
    prisma.customer_payments.create({
      data: {
        booking_id: booking3.id,
        customer_id: customers[1].id,
        amount: 20000,
        payment_method: "vodafone_cash",
        status: "paid",
      },
    }),
  ]);
  console.log("✓ Customer payments created");

  // 14. Execution Payments
  await Promise.all([
    prisma.execution_payments.create({
      data: {
        booking_id: booking1.id,
        execution_company_id: execCompanies[0].id,
        amount: 14000,
        status: "paid",
        notes: "دفع نصف المبلغ",
      },
    }),
    prisma.execution_payments.create({
      data: {
        booking_id: booking3.id,
        execution_company_id: execCompanies[1].id,
        amount: 45000,
        status: "paid",
        notes: "دفع كامل",
      },
    }),
  ]);
  console.log("✓ Execution payments created");

  // 15. Alerts
  await Promise.all([
    prisma.alerts.create({
      data: {
        booking_id: booking1.id,
        customer_id: customers[2].id,
        type: "customer_payment_due",
        severity: "warning",
        message: "المبلغ المتبقي للعميل: 20,000 ج.م",
        status: "open",
      },
    }),
    prisma.alerts.create({
      data: {
        booking_id: booking3.id,
        ticket_id: tickets[3].id,
        type: "travel_date_near",
        severity: "critical",
        message: "تذكرة فاطمة حسن - رحلة القاهرة-لندن خلال ساعات",
        due_date: todayDepart,
        status: "open",
      },
    }),
    prisma.alerts.create({
      data: {
        booking_id: booking2.id,
        type: "unissued_ticket",
        severity: "warning",
        message: "حجز BK-2026-002 - تذاكر لم تصدر بعد",
        status: "open",
      },
    }),
    prisma.alerts.create({
      data: {
        booking_id: booking1.id,
        type: "unconfirmed_booking",
        severity: "info",
        message: "حجز BK-2026-001 في انتظار إصدار التذاكر",
        status: "open",
      },
    }),
  ]);
  console.log("✓ Alerts created");

  console.log("\n========================================");
  console.log("Seed completed successfully!");
  console.log("========================================");
  console.log(`Users: 1`);
  console.log(`Airlines: 5`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Execution Companies: ${execCompanies.length}`);
  console.log(`Booking Requests: ${requests.length}`);
  console.log(`Execution Offers: ${offers.length}`);
  console.log(`Bookings: 3`);
  console.log(`Flight Segments: 4`);
  console.log(`Passengers: ${passengers.length}`);
  console.log(`Tickets: 4`);
  console.log(`Customer Payments: 3`);
  console.log(`Execution Payments: 2`);
  console.log(`Alerts: 4`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
