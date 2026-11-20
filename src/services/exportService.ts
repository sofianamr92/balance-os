import { exportToCsv } from '../components/common/UIPrimitives';

export function exportReportToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
): void {
  const normalizedFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  exportToCsv(normalizedFilename, headers, rows);
}
