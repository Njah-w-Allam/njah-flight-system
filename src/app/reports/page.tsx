import { prisma } from "@/lib/prisma";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const totalBookings = await prisma.bookings.count();

  const revenueAgg = await prisma.bookings.aggregate({
    _sum: {
      current_selling_price: true,
      current_purchase_price: true,
      current_profit: true,
    },
  });

  const customersWithBalance = await prisma.customers.findMany({
    where: { balance: { gt: 0 } },
    orderBy: { balance: "desc" },
  });

  const companiesWithBalance = await prisma.execution_companies.findMany({
    where: { balance: { gt: 0 } },
    orderBy: { balance: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayBookings = await prisma.bookings.findMany({
    where: { created_at: { gte: today } },
    include: { customer: true },
    orderBy: { created_at: "desc" },
  });

  const todayPayments = await prisma.customer_payments.findMany({
    where: { payment_date: { gte: today } },
    include: { customer: true, booking: true },
    orderBy: { payment_date: "desc" },
  });

  const todayExecPayments = await prisma.execution_payments.findMany({
    where: { payment_date: { gte: today } },
    include: { execution_company: true, booking: true },
    orderBy: { payment_date: "desc" },
  });

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const monthBookingsCount = await prisma.bookings.count({
    where: { created_at: { gte: monthStart } },
  });

  const monthRevenueAgg = await prisma.bookings.aggregate({
    where: { created_at: { gte: monthStart } },
    _sum: {
      current_selling_price: true,
      current_purchase_price: true,
      current_profit: true,
    },
  });

  const monthPaymentsAgg = await prisma.customer_payments.aggregate({
    where: { payment_date: { gte: monthStart } },
    _sum: { amount: true },
  });

  const monthExecPaymentsAgg = await prisma.execution_payments.aggregate({
    where: { payment_date: { gte: monthStart } },
    _sum: { amount: true },
  });

  const allCustomers = await prisma.customers.findMany({
    include: {
      customer_payments: {
        select: { amount: true, status: true },
      },
    },
  });

  const reconciliationData = allCustomers.map((c) => {
    const calculatedBalance = c.customer_payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const storedBalance = Number(c.balance);
    return {
      id: c.id,
      name: c.name,
      storedBalance,
      calculatedBalance,
      discrepancy: storedBalance - calculatedBalance,
    };
  });

  const allExecCompanies = await prisma.execution_companies.findMany({
    include: {
      execution_payments: {
        select: { amount: true, status: true },
      },
      bookings: {
        select: { current_purchase_price: true },
      },
    },
  });

  const execReconciliation = allExecCompanies.map((ec) => {
    const totalPaid = ec.execution_payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOwed = ec.bookings.reduce(
      (sum, b) => sum + Number(b.current_purchase_price),
      0
    );
    const storedBalance = Number(ec.balance);
    const calculatedBalance = totalOwed - totalPaid;
    return {
      id: ec.id,
      name: ec.name,
      storedBalance,
      calculatedBalance,
      totalOwed,
      totalPaid,
      discrepancy: storedBalance - calculatedBalance,
    };
  });

  return (
    <ReportsClient
      summary={{
        totalBookings,
        totalRevenue: Number(revenueAgg._sum.current_selling_price ?? 0),
        totalCost: Number(revenueAgg._sum.current_purchase_price ?? 0),
        totalProfit: Number(revenueAgg._sum.current_profit ?? 0),
      }}
      customerDebts={customersWithBalance.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        balance: Number(c.balance),
        currency: c.currency,
      }))}
      companyDebts={companiesWithBalance.map((c) => ({
        id: c.id,
        name: c.name,
        balance: Number(c.balance),
        currency: c.currency,
      }))}
      daily={{
        bookings: todayBookings.map((b) => ({
          id: b.id,
          customerName: b.customer.name,
          sellingPrice: Number(b.current_selling_price),
          currency: b.currency,
          status: b.booking_status,
          createdAt: b.created_at.toISOString(),
        })),
        payments: todayPayments.map((p) => ({
          id: p.id,
          customerName: p.customer.name,
          amount: Number(p.amount),
          currency: p.currency,
          method: p.payment_method,
          status: p.status,
          date: p.payment_date.toISOString(),
        })),
        execPayments: todayExecPayments.map((p) => ({
          id: p.id,
          companyName: p.execution_company.name,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          date: p.payment_date.toISOString(),
        })),
      }}
      monthly={{
        bookingsCount: monthBookingsCount,
        revenue: Number(monthRevenueAgg._sum.current_selling_price ?? 0),
        cost: Number(monthRevenueAgg._sum.current_purchase_price ?? 0),
        profit: Number(monthRevenueAgg._sum.current_profit ?? 0),
        paymentsCollected: Number(monthPaymentsAgg._sum.amount ?? 0),
        paymentsSent: Number(monthExecPaymentsAgg._sum.amount ?? 0),
      }}
      reconciliation={reconciliationData}
      execReconciliation={execReconciliation}
    />
  );
}
