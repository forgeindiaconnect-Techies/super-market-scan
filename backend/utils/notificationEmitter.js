/**
 * Real-Time Multi-Tenant Notification Emitter for GrocerEase SaaS
 * 
 * Enforces strict tenant isolation for all Socket.io notifications:
 * 1. Emits centrally to "super_admin" room so Super Admin can view all platform notifications.
 * 2. Emits strictly to "tenant:${supermarketId}" and "tenant:${supermarketCode}" rooms for Store Admins.
 * 3. Never broadcasts foreign notifications across tenant supermarket boundaries.
 */

function emitTenantNotification(io, event, data) {
  if (!io || !data) return;

  // Extract tenant identity
  const supermarketId = data.supermarketId || data.order?.supermarket;
  const supermarketIdStr = supermarketId
    ? (typeof supermarketId === "object" && supermarketId !== null
        ? String(supermarketId._id || supermarketId)
        : String(supermarketId))
    : null;

  const supermarketCode = data.supermarketCode || data.order?.supermarketCode;
  const supermarketCodeStr = supermarketCode
    ? String(supermarketCode).trim().toUpperCase()
    : null;

  // Ensure data payload has canonical supermarket identifiers
  const enrichedData = {
    ...data,
    supermarketId: supermarketIdStr,
    supermarketCode: supermarketCodeStr,
  };

  // 1. Centralized delivery: Platform Super Admin receives all supermarket notifications
  io.to("super_admin").emit(event, enrichedData);

  // 2. Isolated delivery: Deliver strictly to target supermarket tenant rooms
  let deliveredToTenant = false;

  if (supermarketIdStr && supermarketIdStr !== "null" && supermarketIdStr !== "undefined") {
    io.to(`tenant:${supermarketIdStr}`).emit(event, enrichedData);
    deliveredToTenant = true;
  }

  if (
    supermarketCodeStr &&
    supermarketCodeStr !== "DEFAULT" &&
    supermarketCodeStr !== "ALL" &&
    supermarketCodeStr !== "NULL" &&
    supermarketCodeStr !== "UNDEFINED"
  ) {
    io.to(`tenant:${supermarketCodeStr}`).emit(event, enrichedData);
    deliveredToTenant = true;
  }

  if (!deliveredToTenant) {
    console.warn(`[Tenant Isolation] Notification "${event}" withheld from generic broadcast: missing valid supermarketId / supermarketCode.`);
  }
}

module.exports = { emitTenantNotification };

