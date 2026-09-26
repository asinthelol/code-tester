export function formatUserSummary(user: { id: number; email: string }): string {
  return `User #${user.id}: ${user.email}`;
}
