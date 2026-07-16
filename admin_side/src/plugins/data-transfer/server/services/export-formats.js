'use strict';

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const FORMAT_META = {
  csv: {
    extension: 'csv',
    mimeType: 'text/csv;charset=utf-8',
    encoding: 'utf8',
  },
  excel: {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    encoding: 'base64',
  },
  pdf: {
    extension: 'pdf',
    mimeType: 'application/pdf',
    encoding: 'base64',
  },
};

function isExportFormat(value) {
  return value === 'csv' || value === 'excel' || value === 'pdf';
}

function humanizeHeader(header) {
  return String(header)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function rowsToExcelBuffer(headers, rows, sheetName = 'Export') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tiger Wear';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || 'Export');
  sheet.addRow(headers.map(humanizeHeader));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.commit();

  for (const row of rows) {
    sheet.addRow(headers.map((header) => {
      const value = row[header];
      return value == null ? '' : value;
    }));
  }

  sheet.columns.forEach((column) => {
    let max = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const length = String(cell.value ?? '').length;
      if (length > max) max = Math.min(length + 2, 40);
    });
    column.width = max;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function rowsToPdfBuffer(headers, rows, title = 'Export') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      layout: headers.length > 8 ? 'landscape' : 'portrait',
    });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { underline: false });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#666666').text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.fillColor('#000000');

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = Math.max(40, pageWidth / Math.max(headers.length, 1));
    const startX = doc.page.margins.left;
    let y = doc.y;

    const drawRow = (values, { bold = false, fill = null } = {}) => {
      const cellHeights = values.map((value) => {
        const text = String(value ?? '');
        return Math.max(16, doc.heightOfString(text, { width: colWidth - 6 }));
      });
      const rowHeight = Math.max(...cellHeights, 16);

      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      if (fill) {
        doc.save();
        doc.rect(startX, y, pageWidth, rowHeight).fill(fill);
        doc.restore();
      }

      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor('#000000');

      values.forEach((value, index) => {
        const x = startX + index * colWidth;
        doc.text(String(value ?? ''), x + 3, y + 3, {
          width: colWidth - 6,
          height: rowHeight - 4,
          ellipsis: true,
        });
      });

      doc
        .strokeColor('#dddddd')
        .moveTo(startX, y + rowHeight)
        .lineTo(startX + pageWidth, y + rowHeight)
        .stroke();

      y += rowHeight;
      doc.x = startX;
      doc.y = y;
    };

    drawRow(headers.map(humanizeHeader), { bold: true, fill: '#f2f2f2' });

    for (const row of rows) {
      drawRow(headers.map((header) => row[header]));
    }

    if (rows.length === 0) {
      doc.moveDown();
      doc.fontSize(10).text('No rows to export.');
    }

    doc.end();
  });
}

module.exports = {
  FORMAT_META,
  isExportFormat,
  rowsToExcelBuffer,
  rowsToPdfBuffer,
};
