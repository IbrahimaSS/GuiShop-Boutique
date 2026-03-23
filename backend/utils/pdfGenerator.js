const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Settings = require('../models/Setting');

const generatePDF = async (docData, filePath) => {
  // Fetch shop settings for logo and info
  let settings = null;
  try {
    settings = await Settings.findOne();
  } catch (err) {
    console.error('[PDF] Impossible de charger les settings:', err.message);
  }

  const shopName = settings?.shopName || 'Projet GB';
  const shopLocation = settings?.location || 'Conakry, Guinée';
  const shopPhone = settings?.contactPhone || '+224 620 00 00 00';
  const currency = settings?.currency || 'GNF';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);

    let headerY = 50;
    let logoDisplayed = false;

    // Try to display logo if available
    if (settings?.logo) {
      const logoPath = path.join(__dirname, '..', settings.logo);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, headerY, { width: 60, height: 60 });
          logoDisplayed = true;
        } catch (err) {
          console.error('[PDF] Erreur lors du chargement du logo:', err.message);
        }
      }
    }

    // Header text
    const textX = logoDisplayed ? 120 : 50;
    doc
      .fillColor('#1a365d')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(shopName, textX, headerY + 5)
      .fontSize(9)
      .fillColor('#666666')
      .font('Helvetica')
      .text(shopLocation, textX, headerY + 30)
      .text(shopPhone, textX, headerY + 42);

    // Right side: Invoice info
    doc
      .fontSize(10)
      .fillColor('#b8860b')
      .font('Helvetica-Bold')
      .text(docData.type === 'receipt' ? 'REÇU' : 'FACTURE', 400, headerY, { align: 'right', width: 150 })
      .fontSize(9)
      .fillColor('#444444')
      .font('Helvetica')
      .text(`N°: ${docData.invoiceNumber}`, 400, headerY + 18, { align: 'right', width: 150 })
      .text(`Date: ${new Date(docData.issuedAt).toLocaleDateString('fr-FR')}`, 400, headerY + 32, { align: 'right', width: 150 });

    // Horizontal Line
    const lineY = headerY + 70;
    doc.strokeColor('#d4a843').lineWidth(2).moveTo(50, lineY).lineTo(550, lineY).stroke();

    // Client Info Box
    const clientY = lineY + 15;
    doc
      .roundedRect(350, clientY, 200, 55, 5)
      .fillColor('#f8f4e8')
      .fill();

    doc
      .fillColor('#1a365d')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('DÉTAILS CLIENT', 360, clientY + 8)
      .fontSize(10)
      .fillColor('#333333')
      .text(docData.clientName || 'Client Comptant', 360, clientY + 22)
      .fontSize(9)
      .fillColor('#b8860b')
      .text(docData.clientPhone || '', 360, clientY + 36);

    // Table Header
    const tableY = clientY + 75;
    doc
      .roundedRect(50, tableY, 500, 25, 3)
      .fillColor('#1a365d')
      .fill();

    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('ARTICLE', 60, tableY + 7)
      .text('QTÉ', 280, tableY + 7, { width: 60, align: 'center' })
      .text('P.U.', 340, tableY + 7, { width: 80, align: 'right' })
      .text('MONTANT', 430, tableY + 7, { width: 110, align: 'right' });

    // Table Rows
    let y = tableY + 30;
    const items = docData.items || [];
    items.forEach((item, idx) => {
      // Alternate row background
      if (idx % 2 === 0) {
        doc.rect(50, y - 5, 500, 22).fillColor('#fafafa').fill();
      }

      doc
        .fillColor('#333333')
        .font('Helvetica')
        .fontSize(9)
        .text(item.name || '-', 60, y)
        .text(String(item.quantity || '-'), 280, y, { width: 60, align: 'center' })
        .text(`${(item.price || 0).toLocaleString('fr-FR')} ${currency}`, 340, y, { width: 80, align: 'right' })
        .font('Helvetica-Bold')
        .text(`${(item.totalPrice || item.total || 0).toLocaleString('fr-FR')} ${currency}`, 430, y, { width: 110, align: 'right' });
      y += 22;
    });

    // Bottom line
    doc.strokeColor('#d4a843').lineWidth(1).moveTo(50, y + 5).lineTo(550, y + 5).stroke();

    // Total box
    const totalBoxY = y + 15;
    doc
      .roundedRect(350, totalBoxY, 200, 45, 5)
      .fillColor('#1a365d')
      .fill();

    doc
      .fillColor('#ffffff')
      .fontSize(8)
      .font('Helvetica')
      .text('TOTAL À PAYER', 360, totalBoxY + 8)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(`${(docData.totalAmount || 0).toLocaleString('fr-FR')} ${currency}`, 360, totalBoxY + 20, { width: 180, align: 'center' });

    // Footer
    const footerY = totalBoxY + 80;
    doc.strokeColor('#eeeeee').lineWidth(0.5).moveTo(50, footerY).lineTo(550, footerY).stroke();
    doc
      .fillColor('#999999')
      .fontSize(8)
      .font('Helvetica')
      .text('Merci pour votre confiance !', 50, footerY + 10, { align: 'center', width: 500 })
      .text(`${shopName} — ${shopLocation} — ${shopPhone}`, 50, footerY + 22, { align: 'center', width: 500 });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

module.exports = { generatePDF };
