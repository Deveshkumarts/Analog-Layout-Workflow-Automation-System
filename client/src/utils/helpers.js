export const STATUS_COLORS = {
  'Not Started': '#94a3b8', 'In Progress': '#3b82f6', 'DRC': '#f59e0b',
  'LVS': '#a855f7', 'Review': '#00f0ff', 'Completed': '#10b981',
};
export const STATUS_LIST = ['Not Started', 'In Progress', 'DRC', 'LVS', 'Review', 'Completed'];
export const BLOCK_TYPES = ['Inverter', 'Current Mirror', 'Differential Pair', 'Bandgap', 'OTA', 'LDO', 'PLL', 'ADC', 'DAC', 'Comparator'];
export const TECH_NODES = ['180nm', '130nm', '90nm', '65nm', '45nm', '28nm', '22nm', '14nm', '7nm', '5nm'];
export const COMPLEXITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export function getStatusClass(status) {
  return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
}
export function getPriorityClass(priority) {
  return 'priority-' + priority.toLowerCase();
}
export function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}
export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}
