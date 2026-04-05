const puppeteer = require('puppeteer');

class PDFGenerator {
  async generatePDF(htmlContent, options = {}) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: {
          top: options.marginTop || '10mm',
          bottom: options.marginBottom || '10mm',
          left: options.marginLeft || '5mm',
          right: options.marginRight || '5mm'
        }
      });
      
      await browser.close();
      return pdf;
    } catch (error) {
      if (browser) await browser.close();
      throw error;
    }
  }
}

module.exports = new PDFGenerator();
