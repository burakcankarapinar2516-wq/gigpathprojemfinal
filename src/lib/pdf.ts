import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Invoice, Profile } from '../types';
import { formatCurrency } from './utils';

// Convert non-CP1252 Turkish characters to Latin equivalents to prevent missing glyphs
const trMap: Record<string, string> = {
  'ğ': 'g', 'Ğ': 'G',
  'ı': 'i', 'İ': 'I',
  'ş': 's', 'Ş': 'S',
};

const normalizeStr = (str: string) => {
  if (!str) return '';
  return str.replace(/[ğĞıİşŞ]/g, match => trMap[match] || match);
};

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  primaryColor: string; // Tailwind class equivalent for CSS preview
  badgeColor: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'classic',
    name: 'Klasik Profesyonel',
    description: 'Sade ve kurumsal görünüm sunan geleneksel beyaz tasarım.',
    primaryColor: 'bg-blue-600',
    badgeColor: 'border-blue-200 text-blue-700 bg-blue-50',
  },
  {
    id: 'modern',
    name: 'Modern Akdeniz (Indigo)',
    description: 'Yenilikçi, indigo tonlarında, çizgili tablolu dinamik tasarım.',
    primaryColor: 'bg-indigo-600',
    badgeColor: 'border-indigo-200 text-indigo-700 bg-indigo-50',
  },
  {
    id: 'emerald',
    name: 'Zarif Yeşil (Doğa)',
    description: 'Zarif zümrüt detayları ve ince sade çizgileri olan minimal tasarım.',
    primaryColor: 'bg-emerald-600',
    badgeColor: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  },
  {
    id: 'dark',
    name: 'Premium Slate (Koyu Başlık)',
    description: 'Üst kısımda koyu füme bloklu, altın sarısı vurgulu lüks tasarım.',
    primaryColor: 'bg-slate-800',
    badgeColor: 'border-slate-300 text-slate-800 bg-slate-100',
  }
];

export function generateInvoicePDF(profile: Profile, project: Project, invoice: Invoice, templateId: string = 'classic') {
  const doc = new jsPDF();
  doc.setFont('helvetica');

  // Load design system params depending on selected template
  let primaryRGB: [number, number, number] = [41, 128, 185]; // Classic blue
  let textRGB: [number, number, number] = [33, 37, 41];
  let secondaryTextRGB: [number, number, number] = [100, 100, 100];
  let tableTheme: 'grid' | 'striped' | 'plain' = 'grid';
  let useHeaderBlock = false;
  let useTopAccents = false;
  let useDoubleDividers = false;
  
  if (templateId === 'modern') {
    primaryRGB = [79, 70, 229]; // Indigo
    textRGB = [15, 23, 42];
    secondaryTextRGB = [71, 85, 105];
    tableTheme = 'striped';
    useTopAccents = true;
  } else if (templateId === 'emerald') {
    primaryRGB = [16, 185, 129]; // Emerald
    textRGB = [20, 30, 25];
    secondaryTextRGB = [100, 116, 101];
    tableTheme = 'plain';
    useDoubleDividers = true;
  } else if (templateId === 'dark') {
    primaryRGB = [245, 158, 11]; // Golden amber highlights
    textRGB = [30, 41, 59]; // Slate
    secondaryTextRGB = [100, 116, 139];
    tableTheme = 'grid';
    useHeaderBlock = true; // Spans slate filled block at the top
  }

  // Draw template elements
  if (useTopAccents) {
    // Elegant top border accent line
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 5, 'F');
  }

  let clientY = 75;
  let tableY = 100;
  
  if (useHeaderBlock) {
    // Premium Slate Dark Header Block
    doc.setFillColor(30, 41, 59); // Deep Slate
    doc.rect(0, 0, 210, 60, 'F');
    
    // Highlight Accent Bar
    doc.setFillColor(245, 158, 11); // Amber
    doc.rect(0, 58, 210, 2, 'F');

    // Inside Dark Header Block text
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(normalizeStr(profile.name || 'Freelancer'), 14, 23);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(245, 158, 11); // Amber
    doc.text(normalizeStr(profile.title || 'Profesyonel Hizmetler'), 14, 29);
    
    doc.setTextColor(220, 225, 230);
    let topAddrY = 37;
    if (profile.address) {
      const splitAddress = doc.splitTextToSize(normalizeStr(profile.address), 100);
      doc.text(splitAddress, 14, topAddrY);
      topAddrY += (splitAddress.length * 4.5);
    }
    if (profile.email) {
      doc.text(normalizeStr(profile.email), 14, topAddrY + 2);
    }

    // Invoice Title & Details on right of header block
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FATURA', 140, 23);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 225, 230);
    doc.text(normalizeStr(`Fatura No: ${invoice.invoiceNumber}`), 140, 31);
    doc.text(normalizeStr(`Tarih: ${new Date(invoice.issueDate).toLocaleDateString('tr-TR')}`), 140, 37);
    doc.text(normalizeStr(`Son Odeme: ${new Date(invoice.dueDate).toLocaleDateString('tr-TR')}`), 140, 43);

    clientY = 75;
    tableY = 100;
  } else {
    // Regular text headers
    doc.setTextColor(textRGB[0], textRGB[1], textRGB[2]);

    // Header: Logo / Company Name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeStr(profile.name || 'Freelancer'), 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryTextRGB[0], secondaryTextRGB[1], secondaryTextRGB[2]);
    doc.text(normalizeStr(profile.title || 'Profesyonel Hizmetler'), 14, 32);
    
    let leftY = 40;
    if (profile.address) {
      const splitAddress = doc.splitTextToSize(normalizeStr(profile.address), 85);
      doc.text(splitAddress, 14, leftY);
      leftY += (splitAddress.length * 4.5) + 2;
    }
    if (profile.email) {
      doc.text(normalizeStr(profile.email), 14, leftY);
    }

    // Invoice Details right-aligned
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.text('FATURA', 140, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(normalizeStr(`Fatura No: ${invoice.invoiceNumber}`), 140, 35);
    doc.text(normalizeStr(`D. Tarihi: ${new Date(invoice.issueDate).toLocaleDateString('tr-TR')}`), 140, 42);
    doc.text(normalizeStr(`Son Odeme: ${new Date(invoice.dueDate).toLocaleDateString('tr-TR')}`), 140, 49);

    if (useDoubleDividers) {
      doc.setDrawColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.setLineWidth(0.8);
      doc.line(14, 62, 196, 62);
      doc.setLineWidth(0.2);
      doc.line(14, 64, 196, 64);
      clientY = 75;
      tableY = 102;
    } else {
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.5);
      doc.line(14, 62, 196, 62);
      clientY = 75;
      tableY = 100;
    }
  }

  // Bill To (Sayın Müşteri)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
  doc.text(normalizeStr('Sayin Müşteri:'), 14, clientY);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(normalizeStr(project.clientName || 'Müşteri Adı'), 14, clientY + 7);
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryTextRGB[0], secondaryTextRGB[1], secondaryTextRGB[2]);
  doc.text(`Platform: ${normalizeStr(project.platform)} & Proje: ${normalizeStr(project.title)}`, 14, clientY + 13);

  // Table Data Assembly
  const tableData: any[][] = [];
  if (project.tasks && project.tasks.length > 0) {
    project.tasks.forEach(t => {
      tableData.push([
        normalizeStr(t.description),
        t.hours ? t.hours.toString() : '-',
        formatCurrency(t.amount, project.currency).replace('₺', 'TL')
      ]);
    });
  } else {
    tableData.push([
      normalizeStr(`Verilen hizmet: ${project.title}`),
      '-',
      formatCurrency(invoice.amount, project.currency).replace('₺', 'TL')
    ]);
  }

  // Styled Table Header and Column configuration depending on theme
  let headerFillColor: [number, number, number] = primaryRGB;
  let headerTextColor: [number, number, number] = [255, 255, 255];
  
  if (templateId === 'dark') {
    headerFillColor = [30, 41, 59]; // charcoal header for table
  }

  autoTable(doc, {
    startY: tableY,
    head: [[normalizeStr('Acıklama'), normalizeStr('Saat'), normalizeStr('Tutar')]],
    body: tableData,
    theme: tableTheme,
    headStyles: { 
      fillColor: headerFillColor, 
      textColor: headerTextColor,
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      font: 'helvetica',
      textColor: [50, 50, 50],
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  // Totals calculations
  const finalY = (doc as any).lastAutoTable.finalY || tableY + 20;
  
  const subtotal = invoice.amount;
  const taxRate = profile.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const currencyStr = (num: number) => formatCurrency(num, project.currency).replace('₺', 'TL');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryTextRGB[0], secondaryTextRGB[1], secondaryTextRGB[2]);
  
  doc.text(normalizeStr('Ara Toplam (Net):'), 110, finalY + 10);
  doc.text(currencyStr(subtotal), 196, finalY + 10, { align: 'right' });

  if (taxRate > 0) {
    doc.text(`KDV / Vergi (%${taxRate}):`, 110, finalY + 16);
    doc.text(currencyStr(taxAmount), 196, finalY + 16, { align: 'right' });
  }

  const grossY = taxRate > 0 ? finalY + 26 : finalY + 20;

  // Total Container Block
  if (templateId === 'emerald') {
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(110, grossY - 4, 196, grossY - 4);
  } else if (templateId === 'dark') {
    doc.setFillColor(248, 250, 252);
    doc.rect(106, grossY - 5, 92, 14, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(106, grossY - 5, 92, 14, 'D');
  } else if (templateId === 'modern') {
    doc.setFillColor(245, 247, 255);
    doc.rect(106, grossY - 5, 92, 14, 'F');
    doc.setDrawColor(224, 231, 255);
    doc.setLineWidth(0.5);
    doc.rect(106, grossY - 5, 92, 14, 'D');
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
  doc.text(normalizeStr('Odenecek Toplam (Brüt):'), 110, grossY);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  
  if (templateId === 'dark') {
    doc.setTextColor(217, 119, 6); // Beautiful Dark Amber total
  } else {
    doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  }
  doc.text(currencyStr(totalAmount), 196, grossY, { align: 'right' });

  // Reset text color for footer
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  let currentY = grossY + 18;
  
  if (project.notes) {
    if (templateId === 'classic' || templateId === 'modern') {
      doc.setDrawColor(241, 245, 249);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY - 2, 182, 20, 'F');
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
    doc.text(normalizeStr('Notlar:'), 16, currentY + 3);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryTextRGB[0], secondaryTextRGB[1], secondaryTextRGB[2]);
    const splitNotes = doc.splitTextToSize(normalizeStr(project.notes), 178);
    doc.text(splitNotes, 16, currentY + 8);
    currentY += 12 + (splitNotes.length * 5);
  }
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(secondaryTextRGB[0], secondaryTextRGB[1], secondaryTextRGB[2]);
  doc.text(normalizeStr('Bizi tercih ettiginiz için teşekkür ederiz!'), 14, currentY + 10);

  return doc;
}
