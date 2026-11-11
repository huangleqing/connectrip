export const MASKED_AMOUNT = '****';

export function formatMoney(value: number) {
  return `¥${Number(value || 0).toLocaleString('zh-CN')}`;
}

export function displayMoney(value: number, canViewAmount: boolean) {
  return canViewAmount ? formatMoney(value) : MASKED_AMOUNT;
}

export async function downloadExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = headers.map((header, index) => ({
    wch: Math.min(
      42,
      Math.max(
        12,
        header.length * 2 + 4,
        ...rows
          .slice(0, 30)
          .map((row) => String(row[index] ?? '').length * 1.4 + 2),
      ),
    ),
  }));

  const workbook = XLSX.utils.book_new();
  const safeSheetName = sheetName.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet1';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const excelName = filename.toLowerCase().endsWith('.xlsx')
    ? filename
    : `${filename}.xlsx`;
  link.href = url;
  link.download = excelName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
