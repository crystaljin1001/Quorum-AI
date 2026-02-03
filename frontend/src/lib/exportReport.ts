import jsPDF from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, Table, TableCell, TableRow, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface ArticleBreakdown {
  article: string;
  clause: string;
  status: "Safe" | "Warning" | "Hazardous";
  risk_summary: string;
}

interface CriticalOmission {
  missing_provision: string;
  impact: string;
  severity: "High" | "Critical";
}

interface OptimizerOutput {
  conflict_analysis: {
    score: number;
    risk_level: string;
    primary_threat: string;
  };
  article_breakdown: ArticleBreakdown[];
  critical_omissions: CriticalOmission[];
  skeptic_validation: {
    key_catch: string;
    coherence_check: boolean;
  };
}

interface RemediationResult {
  original: string;
  rewritten: string;
  rationale: string;
}

interface DebateMessage {
  agent: string;
  label: string;
  message: string;
  timestamp: string;
}

export function exportAsPDF(
  dealName: string,
  optimizerData: OptimizerOutput,
  remediationResults: Map<string, RemediationResult>,
  debateTranscript: DebateMessage[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += fontSize * 0.5;
    });
    yPos += 5; // Add spacing after paragraph
  };

  // Helper to add section header
  const addSectionHeader = (title: string) => {
    yPos += 10;
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPos - 7, contentWidth, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin + 5, yPos);
    yPos += 15;
  };

  // HEADER
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RED FLAG REPORT', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Risk Assessment', pageWidth / 2, 30, { align: 'center' });

  yPos = 50;

  // Deal Info
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Deal: ${dealName}`, margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPos);
  yPos += 15;

  // SECTION 1: EXECUTIVE SUMMARY
  addSectionHeader('EXECUTIVE SUMMARY');

  addText(`Conflict Score: ${optimizerData.conflict_analysis.score}/100`, 12, true);
  addText(`Risk Level: ${optimizerData.conflict_analysis.risk_level}`, 11, true,
    optimizerData.conflict_analysis.risk_level === 'Critical' || optimizerData.conflict_analysis.risk_level === 'High'
      ? [220, 38, 38] : [0, 0, 0]);
  addText(`Deal-Breaker Risk: ${optimizerData.conflict_analysis.primary_threat}`, 11, false);
  yPos += 5;
  addText('Key Insight from Skeptic:', 11, true);
  addText(`"${optimizerData.skeptic_validation.key_catch}"`, 10, false, [100, 100, 100]);

  // SECTION 2: CRITICAL RISKS
  addSectionHeader('CRITICAL RISKS');

  const criticalItems = optimizerData.article_breakdown.filter(
    item => item.status === 'Hazardous' || item.status === 'Critical'
  );

  if (criticalItems.length === 0) {
    addText('No critical risks identified.', 11, false);
  } else {
    criticalItems.forEach((item, idx) => {
      const cardId = `article-${optimizerData.article_breakdown.indexOf(item)}`;
      const remediation = remediationResults.get(cardId);

      // Format: "Article III Section 3.6"
      const formattedClause = (() => {
        const hasArticle = item.article && item.article !== 'N/A';
        const hasClause = item.clause && item.clause !== 'N/A';
        if (!hasArticle && !hasClause) return 'Unspecified Clause';

        let articleDisplay = item.article;
        // Infer article from section number if article is descriptive
        if (hasArticle && !item.article.match(/^Article\s+[IVX]+$/i)) {
          const sectionMatch = item.clause?.match(/(?:Section\s+)?(\d+)/i);
          if (sectionMatch) {
            const sectionPrefix = parseInt(sectionMatch[1]);
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            if (sectionPrefix > 0 && sectionPrefix <= romanNumerals.length) {
              articleDisplay = `Article ${romanNumerals[sectionPrefix - 1]}`;
            }
          }
        }

        let formatted = hasArticle ? articleDisplay : '';
        if (hasClause) {
          const hasSection = /^section\s+/i.test(item.clause);
          if (hasArticle) formatted += ' ';
          formatted += hasSection ? item.clause.replace(/^section\s+/i, 'Section ') : `Section ${item.clause}`;
        }
        return formatted;
      })();
      addText(`${idx + 1}. ${formattedClause}`, 12, true, [220, 38, 38]);
      addText(`Risk: ${item.risk_summary}`, 10, false);

      if (remediation) {
        yPos += 5;
        addText('Suggested Remediation:', 10, true, [147, 51, 234]);
        addText(remediation.rewritten, 9, false, [34, 197, 94]);
        addText(`Rationale: ${remediation.rationale.split('\n')[0]}`, 9, false, [100, 100, 100]);
      }
      yPos += 5;
    });
  }

  // Critical Omissions
  if (optimizerData.critical_omissions.length > 0) {
    yPos += 10;
    addText('MISSING SAFEGUARDS:', 12, true, [220, 38, 38]);
    optimizerData.critical_omissions.forEach((omission, idx) => {
      addText(`${idx + 1}. ${omission.missing_provision}`, 11, true);
      addText(`Impact: ${omission.impact}`, 10, false);
      yPos += 3;
    });
  }

  // SECTION 3: FULL ANALYSIS (APPENDIX)
  doc.addPage();
  yPos = margin;
  addSectionHeader('FULL ANALYSIS (APPENDIX)');

  // All Findings
  addText('All Contract Clauses Analyzed:', 11, true);
  optimizerData.article_breakdown.forEach((item, idx) => {
    const statusColor: [number, number, number] =
      item.status === 'Hazardous' ? [220, 38, 38] :
      item.status === 'Warning' ? [251, 146, 60] :
      [34, 197, 94];

    // Format: "Article III Section 3.6"
    const formattedClause = (() => {
      const hasArticle = item.article && item.article !== 'N/A';
      const hasClause = item.clause && item.clause !== 'N/A';
      if (!hasArticle && !hasClause) return 'Unspecified Clause';

      let formatted = hasArticle ? item.article : '';
      if (hasClause) {
        const hasSection = /^section\s+/i.test(item.clause);
        if (hasArticle) formatted += ' ';
        formatted += hasSection ? item.clause.replace(/^section\s+/i, 'Section ') : `Section ${item.clause}`;
      }
      return formatted;
    })();

    addText(`${idx + 1}. ${formattedClause} [${item.status}]`, 10, true, statusColor);
    addText(item.risk_summary, 9, false);
    yPos += 3;
  });

  // Debate Transcript
  if (debateTranscript.length > 0) {
    doc.addPage();
    yPos = margin;
    addSectionHeader('DEBATE TRANSCRIPT');
    addText('Internal reasoning process between Creator, Skeptic, and Optimizer agents:', 10, false);

    debateTranscript.forEach(msg => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      addText(`[${msg.timestamp}] ${msg.label}:`, 9, true);
      addText(msg.message, 8, false, [60, 60, 60]);
      yPos += 2;
    });
  }

  // FOOTER - Disclaimer
  const finalPageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= finalPageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'italic');
    const disclaimer = 'Generated by Quorum AI. For informational purposes only; does not constitute legal advice.';
    doc.text(disclaimer, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${finalPageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  doc.save(`${dealName.replace(/[^a-z0-9]/gi, '_')}_RedFlagReport_${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function exportAsWord(
  dealName: string,
  optimizerData: OptimizerOutput,
  remediationResults: Map<string, RemediationResult>,
  debateTranscript: DebateMessage[]
) {
  const sections: any[] = [];

  // HEADER
  sections.push(
    new Paragraph({
      text: 'RED FLAG REPORT',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'AI Risk Assessment',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Deal: ', bold: true }),
        new TextRun(dealName),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      spacing: { after: 400 },
    })
  );

  // SECTION 1: EXECUTIVE SUMMARY
  sections.push(
    new Paragraph({
      text: 'EXECUTIVE SUMMARY',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Conflict Score: ${optimizerData.conflict_analysis.score}/100`, bold: true }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Risk Level: ${optimizerData.conflict_analysis.risk_level}`,
          bold: true,
          color: optimizerData.conflict_analysis.risk_level === 'Critical' || optimizerData.conflict_analysis.risk_level === 'High' ? 'DC2626' : '000000'
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Deal-Breaker Risk: ', bold: true }),
        new TextRun(optimizerData.conflict_analysis.primary_threat),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Key Insight from Skeptic:',
      bold: true,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `"${optimizerData.skeptic_validation.key_catch}"`,
      italics: true,
      spacing: { after: 400 },
    })
  );

  // SECTION 2: CRITICAL RISKS
  sections.push(
    new Paragraph({
      text: 'CRITICAL RISKS',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  const criticalItems = optimizerData.article_breakdown.filter(
    item => item.status === 'Hazardous' || item.status === 'Critical'
  );

  if (criticalItems.length === 0) {
    sections.push(
      new Paragraph({
        text: 'No critical risks identified.',
        spacing: { after: 200 },
      })
    );
  } else {
    criticalItems.forEach((item, idx) => {
      const cardId = `article-${optimizerData.article_breakdown.indexOf(item)}`;
      const remediation = remediationResults.get(cardId);

      // Format: "Article III Section 3.6"
      const formattedClause = (() => {
        const hasArticle = item.article && item.article !== 'N/A';
        const hasClause = item.clause && item.clause !== 'N/A';
        if (!hasArticle && !hasClause) return 'Unspecified Clause';

        let articleDisplay = item.article;
        // Infer article from section number if article is descriptive
        if (hasArticle && !item.article.match(/^Article\s+[IVX]+$/i)) {
          const sectionMatch = item.clause?.match(/(?:Section\s+)?(\d+)/i);
          if (sectionMatch) {
            const sectionPrefix = parseInt(sectionMatch[1]);
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            if (sectionPrefix > 0 && sectionPrefix <= romanNumerals.length) {
              articleDisplay = `Article ${romanNumerals[sectionPrefix - 1]}`;
            }
          }
        }

        let formatted = hasArticle ? articleDisplay : '';
        if (hasClause) {
          const hasSection = /^section\s+/i.test(item.clause);
          if (hasArticle) formatted += ' ';
          formatted += hasSection ? item.clause.replace(/^section\s+/i, 'Section ') : `Section ${item.clause}`;
        }
        return formatted;
      })();

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. ${formattedClause}`, bold: true, color: 'DC2626' }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Risk: ', bold: true }),
            new TextRun(item.risk_summary),
          ],
          spacing: { after: 100 },
        })
      );

      if (remediation) {
        sections.push(
          new Paragraph({
            text: 'Suggested Remediation:',
            bold: true,
            color: '9333EA',
            spacing: { before: 100, after: 50 },
          }),
          new Paragraph({
            text: remediation.rewritten,
            color: '22C55E',
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Rationale: ', bold: true }),
              new TextRun(remediation.rationale.split('\n')[0]),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });
  }

  // Critical Omissions
  if (optimizerData.critical_omissions.length > 0) {
    sections.push(
      new Paragraph({
        text: 'MISSING SAFEGUARDS',
        bold: true,
        color: 'DC2626',
        spacing: { before: 300, after: 200 },
      })
    );

    optimizerData.critical_omissions.forEach((omission, idx) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. ${omission.missing_provision}`, bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Impact: ', bold: true }),
            new TextRun(omission.impact),
          ],
          spacing: { after: 150 },
        })
      );
    });
  }

  // SECTION 3: FULL ANALYSIS (APPENDIX)
  sections.push(
    new Paragraph({
      text: 'FULL ANALYSIS (APPENDIX)',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 200 },
      pageBreakBefore: true,
    }),
    new Paragraph({
      text: 'All Contract Clauses Analyzed:',
      bold: true,
      spacing: { after: 200 },
    })
  );

  optimizerData.article_breakdown.forEach((item, idx) => {
    const statusColor =
      item.status === 'Hazardous' ? 'DC2626' :
      item.status === 'Warning' ? 'FB923C' :
      '22C55E';

    // Format: "Article III Section 3.6"
    const formattedClause = (() => {
      const hasArticle = item.article && item.article !== 'N/A';
      const hasClause = item.clause && item.clause !== 'N/A';
      if (!hasArticle && !hasClause) return 'Unspecified Clause';

      let formatted = hasArticle ? item.article : '';
      if (hasClause) {
        const hasSection = /^section\s+/i.test(item.clause);
        if (hasArticle) formatted += ' ';
        formatted += hasSection ? item.clause.replace(/^section\s+/i, 'Section ') : `Section ${item.clause}`;
      }
      return formatted;
    })();

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${idx + 1}. ${formattedClause} [${item.status}]`, bold: true, color: statusColor }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: item.risk_summary,
        spacing: { after: 150 },
      })
    );
  });

  // Debate Transcript
  if (debateTranscript.length > 0) {
    sections.push(
      new Paragraph({
        text: 'DEBATE TRANSCRIPT',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        pageBreakBefore: true,
      }),
      new Paragraph({
        text: 'Internal reasoning process between Creator, Skeptic, and Optimizer agents:',
        spacing: { after: 200 },
      })
    );

    debateTranscript.forEach(msg => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${msg.timestamp}] ${msg.label}: `, bold: true }),
            new TextRun(msg.message),
          ],
          spacing: { after: 150 },
        })
      );
    });
  }

  // FOOTER - Disclaimer
  sections.push(
    new Paragraph({
      text: '',
      spacing: { before: 600 },
    }),
    new Paragraph({
      text: 'Generated by Quorum AI. For informational purposes only; does not constitute legal advice.',
      italics: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    })
  );

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections,
    }],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${dealName.replace(/[^a-z0-9]/gi, '_')}_RedFlagReport_${new Date().toISOString().split('T')[0]}.docx`);
}
