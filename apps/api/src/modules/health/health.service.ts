// Logic layer: knows nothing about HTTP.
// Milestone 3 adds a database ping here.
export function getHealth() {
  return {
    status: "ok" as const,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
