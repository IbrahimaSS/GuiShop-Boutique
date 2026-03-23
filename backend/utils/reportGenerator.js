const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateFinancialReport = (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `Report_${Date.now()}.pdf`;
    const uploadDir = path.join(__dirname, '../uploads/reports');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fillColor('#0f172a').fontSize(20).text('BILAN FINANCIER', { align: 'center' });
    doc.fontSize(10).text(new Date().toLocaleDateString('fr-FR'), { align: 'center' });
    doc.moveDown(2);

    // Summary Box
    doc.rect(50, 120, 500, 150).fill('#f8fafc');
    doc.fillColor('#1e40af').fontSize(14).text('RÉSUMÉ GÉNÉRAL', 70, 140);
    
    doc.fillColor('#475569').fontSize(12);
    doc.text(`Total des Ventes :`, 70, 170);
    doc.fillColor('#059669').text(`${data.totalRevenue.toLocaleString()} GNF`, 350, 170, { align: 'right', width: 150 });
    
    doc.fillColor('#475569').text(`Total des Dépenses :`, 70, 200);
    doc.fillColor('#dc2626').text(`${data.totalExpenses.toLocaleString()} GNF`, 350, 200, { align: 'right', width: 150 });
    
    doc.fillColor('#475569').text(`Total des Dettes :`, 70, 230);
    doc.fillColor('#ea580c').text(`${data.totalDebts.toLocaleString()} GNF`, 350, 230, { align: 'right', width: 150 });

    doc.moveDown(10);
    doc.fillColor('#0f172a').text('Généré par GUITECII Management', { align: 'center', italic: true });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
};

module.exports = { generateFinancialReport };
