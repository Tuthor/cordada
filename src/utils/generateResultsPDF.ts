import jsPDF from 'jspdf';
import { AssessmentResult, MaturityLevelInfo } from '@/types/assessment';
import { RoleAssessmentResult } from '@/types/roleAssessment';

interface PDFGenerationParams {
  maturityResult: AssessmentResult;
  maturityLevelInfo: MaturityLevelInfo;
  roleResult?: RoleAssessmentResult | null;
  userName?: string;
}

export const generateResultsPDF = ({
  maturityResult,
  maturityLevelInfo,
  roleResult,
  userName = 'Consultor',
}: PDFGenerationParams): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Helper functions
  const addTitle = (text: string, fontSize: number = 18) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(text, margin, yPos);
    yPos += fontSize * 0.5 + 4;
  };

  const addSubtitle = (text: string, fontSize: number = 14) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(text, margin, yPos);
    yPos += fontSize * 0.4 + 3;
  };

  const addText = (text: string, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * fontSize * 0.4 + 4;
  };

  const addBulletList = (items: string[], fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * fontSize * 0.4 + 2;
    });
    yPos += 2;
  };

  const addSpacer = (height: number = 8) => {
    yPos += height;
  };

  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  const addProgressBar = (label: string, value: number, maxValue: number = 5) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin, yPos);
    
    const barWidth = 60;
    const barHeight = 6;
    const barX = margin + 80;
    const percentage = (value / maxValue) * 100;
    
    // Background
    doc.setFillColor(226, 232, 240); // slate-200
    doc.roundedRect(barX, yPos - 5, barWidth, barHeight, 2, 2, 'F');
    
    // Progress
    doc.setFillColor(202, 138, 4); // gold/amber
    doc.roundedRect(barX, yPos - 5, (barWidth * percentage) / 100, barHeight, 2, 2, 'F');
    
    // Value
    doc.text(`${value.toFixed(1)} / ${maxValue}`, barX + barWidth + 5, yPos);
    yPos += 10;
  };

  // === HEADER ===
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('La Cordada', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Resultados de Evaluación', margin, 35);
  
  doc.setFontSize(10);
  doc.text(`${userName} | ${new Date().toLocaleDateString('es-CL')}`, pageWidth - margin - 60, 35);
  
  yPos = 60;

  // === MATURITY TEST RESULTS ===
  addTitle('Test de Madurez del Consultor');
  addSpacer(4);

  // Score badge
  doc.setFillColor(202, 138, 4); // gold
  doc.roundedRect(margin, yPos - 5, 50, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(maturityResult.overallPercentage)}%`, margin + 25, yPos + 7, { align: 'center' });
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.text(maturityLevelInfo.name, margin + 60, yPos + 7);
  yPos += 25;

  addText(`"${maturityLevelInfo.phrase}"`);
  addSpacer(4);

  addSubtitle('Descripción');
  addText(maturityLevelInfo.description);
  addSpacer(4);

  checkPageBreak(60);
  addSubtitle('Fortalezas');
  addBulletList(maturityLevelInfo.strengths);
  addSpacer(4);

  checkPageBreak(60);
  addSubtitle('Áreas de Desarrollo');
  addBulletList(maturityLevelInfo.weaknesses);
  addSpacer(4);

  checkPageBreak(40);
  addSubtitle('Riesgo Principal');
  addText(maturityLevelInfo.mainRisk);
  addSpacer(4);

  checkPageBreak(40);
  addSubtitle('Recomendación');
  addText(maturityLevelInfo.recommendation);
  addSpacer(8);

  // Block scores
  checkPageBreak(80);
  addSubtitle('Puntuación por Bloque');
  addSpacer(4);
  
  maturityResult.categoryScores.forEach((score) => {
    // Calculate average from score/maxScore (5 questions per category with max 5 each = 25)
    const avgScore = (score.score / score.maxScore) * 5;
    addProgressBar(score.categoryName, avgScore, 5);
  });
  addSpacer(8);

  // Enabled roles and support
  checkPageBreak(60);
  addSubtitle('Roles Habilitados');
  addText(maturityLevelInfo.enabledRoles);
  addSpacer(4);

  checkPageBreak(60);
  addSubtitle('Soporte Necesario');
  addText(maturityLevelInfo.supportNeeded);
  addSpacer(4);

  checkPageBreak(60);
  addSubtitle('Herramientas Clave');
  addText(maturityLevelInfo.keyTools);

  // === ROLE TEST RESULTS ===
  if (roleResult) {
    doc.addPage();
    yPos = 20;

    addTitle('Test de Arquetipo de Rol');
    addSpacer(4);

    const dominantInfo = roleResult.dominantArchetype;
    
    // Archetype badge
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(margin, yPos - 5, contentWidth, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(dominantInfo.name, margin + 10, yPos + 7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(dominantInfo.characteristic, margin + 10, yPos + 15);
    yPos += 30;

    addText(`"${dominantInfo.phrase}"`);
    addSpacer(4);

    addSubtitle('Descripción');
    addText(dominantInfo.description);
    addSpacer(4);

    checkPageBreak(60);
    addSubtitle('Fortalezas');
    addBulletList(dominantInfo.strengths);
    addSpacer(4);

    checkPageBreak(60);
    addSubtitle('Puntos de Atención');
    addBulletList(dominantInfo.potentialWeaknesses);
    addSpacer(4);

    checkPageBreak(40);
    addSubtitle('Mejor Contexto');
    addText(dominantInfo.bestContext);
    addSpacer(8);

    // Archetype scores
    checkPageBreak(100);
    addSubtitle('Puntuación por Arquetipo');
    addSpacer(4);
    
    roleResult.archetypeScores.forEach((score) => {
      // Calculate average from score/maxScore (4 questions per archetype with max 5 each = 20)
      const avgScore = (score.score / score.maxScore) * 5;
      addProgressBar(score.archetypeName, avgScore, 5);
    });
    addSpacer(8);

    // Secondary archetype
    if (roleResult.secondaryArchetype) {
      checkPageBreak(60);
      addSubtitle('Arquetipo Secundario');
      addText(`${roleResult.secondaryArchetype.name}: ${roleResult.secondaryArchetype.characteristic}`);
      addSpacer(4);
    }

    // Complementary roles
    checkPageBreak(40);
    addSubtitle('Roles Complementarios');
    const roleNames: Record<string, string> = {
      guia_alta_montana: 'Guía de Alta Montaña',
      primer_de_cuerda: 'Primer de Cuerda',
      asegurador: 'Asegurador',
      explorador: 'Explorador',
      sherpa: 'Sherpa',
      cronista: 'Cronista',
    };
    const complementaryNames = dominantInfo.complementaryRoles.map((r) => roleNames[r] || r).join(', ');
    addText(complementaryNames);
  }

  // === FOOTER ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Página ${i} de ${totalPages} | La Cordada - Ecosistema de Consultores`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `Resultados_LaCordada_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
