const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional hospital-style PDF screening report.
 *
 * @param {Object} screening   - Populated Screening document
 * @param {string} llmAnalysis - Full AI clinical analysis text
 * @param {Object} indicatorExplanations - { eyeContact, headStimming, … } short AI explanations
 * @param {Array}  nearbyCenters - [{ name, address, rating, mapsUrl }]
 */
exports.generateScreeningReport = async (screening, llmAnalysis, indicatorExplanations = {}, nearbyCenters = []) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
      });

      // Create reports directory if it doesn't exist
      const reportsDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `screening-report-${screening._id}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      const C = {
        heading: '#111827',
        text: '#1F2937',
        line: '#D1D5DB',
        muted: '#4B5563',
        headerBg: '#F3F4F6',
      };

      const W = doc.page.width - 100;
      const LM = 50;
      const TOP = 45;
      const BOTTOM = doc.page.height - 70;

      const fmt = (v) => (v === null || v === undefined || v === '' ? 'N/A' : String(v));
      const clean = (v) => fmt(v).replace(/\s+/g, ' ').trim();
      const cleanMultiline = (v) => fmt(v).replace(/\r/g, '').replace(/\t/g, ' ').trim();
      const fmtDate = (v) => {
        if (!v) return 'N/A';
        const d = new Date(v);
        return isNaN(d) ? 'N/A' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      };

      const toSentence = (v) => {
        const text = clean(v);
        if (text === 'N/A') return text;
        return text.charAt(0).toUpperCase() + text.slice(1);
      };

      const indicatorConcern = (key, value) => {
        const val = clean(value).toLowerCase();
        if (val === 'n/a') return 'Not Assessed';

        const concernByKey = {
          eyeContact: ['low', 'reduced', 'limited', 'poor'],
          headStimming: ['present', 'high', 'frequent'],
          handStimming: ['present', 'high', 'frequent'],
          handGesture: ['absent', 'limited', 'low'],
          socialReciprocity: ['low', 'reduced', 'limited'],
          emotionVariation: ['low', 'limited', 'restricted'],
        };

        const markers = concernByKey[key] || [];
        if (markers.some((m) => val.includes(m))) return 'Needs Follow-up';
        return 'Within Expected Range';
      };

      const summarizeLLM = (text, maxChars = 1200) => {
        if (!text) return null;
        const normalized = cleanMultiline(text).replace(/\*\*/g, '').replace(/^[-•]\s*/gm, '');
        if (normalized.length <= maxChars) return normalized;
        return `${normalized.slice(0, maxChars).trim()}...`;
      };

      const addHeader = () => {
        doc.y = TOP;
        doc.fillColor(C.heading).font('Helvetica-Bold').fontSize(17)
          .text('AUTISM SCREENING REPORT', LM, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.2);
        doc.fillColor(C.muted).font('Helvetica').fontSize(9)
          .text(`Generated on ${fmtDate(new Date())}`, LM, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.4);
        doc.strokeColor(C.line).lineWidth(0.7).moveTo(LM, doc.y).lineTo(LM + W, doc.y).stroke();
        doc.moveDown(0.5);
      };

      const ensureSpace = (h = 30) => {
        if (doc.y + h > BOTTOM) {
          doc.addPage();
          addHeader();
        }
      };

      const sectionTitle = (title) => {
        ensureSpace(24);
        doc.fillColor(C.heading).font('Helvetica-Bold').fontSize(11)
          .text(title, LM, doc.y, { width: W });
        doc.moveDown(0.2);
      };

      const keyValueBlock = (rows) => {
        rows.forEach(([label, value]) => {
          ensureSpace(16);
          doc.fillColor(C.text).font('Helvetica-Bold').fontSize(10)
            .text(`${clean(label)}: `, LM, doc.y, { continued: true });
          doc.fillColor(C.text).font('Helvetica').fontSize(10)
            .text(clean(value), { width: W, align: 'left' });
        });
        doc.moveDown(0.35);
      };

      const setTableFont = (isHeader) => {
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.2);
      };

      const cellHeight = (text, width, isHeader = false) => {
        setTableFont(isHeader);
        return doc.heightOfString(clean(text), {
          width: Math.max(20, width - 12),
          align: 'left',
          lineGap: 1,
        }) + 10;
      };

      const drawRow = (cells, widths, isHeader = false) => {
        const heights = cells.map((cell, i) => cellHeight(cell, widths[i], isHeader));
        const rowHeight = Math.max(22, ...heights);
        ensureSpace(rowHeight + 2);

        let x = LM;
        const y = doc.y;

        cells.forEach((cell, i) => {
          const cw = widths[i];
          if (isHeader) {
            doc.rect(x, y, cw, rowHeight).fillAndStroke(C.headerBg, C.line);
          } else {
            doc.rect(x, y, cw, rowHeight).stroke(C.line);
          }

          setTableFont(isHeader);
          doc.fillColor(C.text).text(clean(cell), x + 6, y + 5, {
            width: cw - 12,
            align: 'left',
            lineGap: 1,
          });
          x += cw;
        });

        doc.y = y + rowHeight;
      };

      const drawTable = (headers, rows, widths) => {
        drawRow(headers, widths, true);
        rows.forEach((row) => drawRow(row, widths, false));
        doc.moveDown(0.4);
      };

      const observationMap = {
        eyeContact: {
          typical: 'Maintains eye contact during interaction',
          pattern: 'Avoids or shows limited eye contact',
        },
        handStimming: {
          typical: 'Minimal repetitive hand movement',
          pattern: 'Repetitive hand movements or stimming',
        },
        socialReciprocity: {
          typical: 'Responds actively to social cues',
          pattern: 'Reduced social response and reciprocity',
        },
        emotionVariation: {
          typical: 'Shows varied emotional expressions',
          pattern: 'Restricted or limited expression range',
        },
      };

      const features = screening.liveVideoFeatures || {};
      const riskLevel = clean(screening.riskLevel);
      const questionnaireResponses = screening?.questionnaire?.responses || [];
      const concernResponses = questionnaireResponses.filter((r) => r && r.answer === false).slice(0, 6);

      const indicatorRows = [
        {
          key: 'eyeContact',
          label: 'Eye Contact',
          observation: features.eyeContact,
        },
        {
          key: 'headStimming',
          label: 'Head Movements',
          observation: features.headStimming,
        },
        {
          key: 'handStimming',
          label: 'Hand Movements',
          observation: features.handStimming,
        },
        {
          key: 'handGesture',
          label: 'Communicative Gestures',
          observation: features.handGesture,
        },
        {
          key: 'socialReciprocity',
          label: 'Social Interaction',
          observation: features.socialReciprocity,
        },
        {
          key: 'emotionVariation',
          label: 'Emotional Expression',
          observation: features.emotionVariation,
        },
      ];

      const keyConcerns = indicatorRows
        .filter((row) => indicatorConcern(row.key, row.observation) === 'Needs Follow-up')
        .map((row) => row.label);

      addHeader();

      sectionTitle('Patient Details');
      keyValueBlock([
        ['Name', screening.child?.name || screening.child?.nickname],
        ['Age', `${screening.child?.ageInMonths || 'N/A'} months`],
        ['Gender', screening.child?.gender],
        ['Screening Date', fmtDate(screening.createdAt)],
      ]);

      sectionTitle('Guardian Details');
      keyValueBlock([
        ['Parent Name', screening.user?.name],
        ['Location', [screening.user?.city, screening.user?.state].filter(Boolean).join(', ') || 'N/A'],
      ]);

      sectionTitle('Behavioral Assessment');
      drawTable(
        ['Indicator', 'Observation', 'Typical Development', 'Autism-Related Pattern'],
        [
          ['Eye Contact', features.eyeContact, observationMap.eyeContact.typical, observationMap.eyeContact.pattern],
          ['Hand Movements', features.handStimming, observationMap.handStimming.typical, observationMap.handStimming.pattern],
          ['Social Interaction', features.socialReciprocity, observationMap.socialReciprocity.typical, observationMap.socialReciprocity.pattern],
          ['Emotional Expression', features.emotionVariation, observationMap.emotionVariation.typical, observationMap.emotionVariation.pattern],
        ],
        [100, 110, 170, W - 380]
      );

      sectionTitle('Detailed Behavioral Findings');
      drawTable(
        ['Indicator', 'Observed Status', 'Clinical Note', 'Priority'],
        indicatorRows.map((row) => [
          row.label,
          toSentence(row.observation),
          clean(indicatorExplanations[row.key] || 'Clinical interpretation not available for this indicator.'),
          indicatorConcern(row.key, row.observation),
        ]),
        [110, 95, 220, W - 425]
      );

      sectionTitle('Assessment Summary');
      keyValueBlock([
        ['Risk Level', riskLevel],
        ['Indicators Needing Follow-up', keyConcerns.length > 0 ? keyConcerns.join(', ') : 'No major concerns identified from observed indicators'],
        ['Questionnaire Responses Reviewed', questionnaireResponses.length || 0],
      ]);

      if (concernResponses.length > 0) {
        sectionTitle('Questionnaire Observations Requiring Attention');
        concernResponses.forEach((item, idx) => {
          ensureSpace(20);
          doc.fillColor(C.text).font('Helvetica').fontSize(9.8)
            .text(`${idx + 1}. ${clean(item.question)}`, LM, doc.y, { width: W, align: 'left' });
        });
        doc.moveDown(0.3);
      }

      sectionTitle('Clinical Impression');
      ensureSpace(45);
      doc.fillColor(C.text).font('Helvetica').fontSize(10)
        .text(
          'The observed behavioral characteristics are suggestive of autism spectrum-related developmental differences. '
          + 'Reduced social reciprocity and repetitive behaviors indicate the need for further clinical evaluation.',
          LM,
          doc.y,
          { width: W, align: 'justify', lineGap: 2 }
        );
      doc.moveDown(0.4);

      const llmSummary = summarizeLLM(llmAnalysis);
      if (llmSummary) {
        sectionTitle('Extended Clinical Explanation');
        ensureSpace(60);
        doc.fillColor(C.text).font('Helvetica').fontSize(9.8)
          .text(llmSummary, LM, doc.y, { width: W, align: 'justify', lineGap: 2 });
        doc.moveDown(0.35);
      }

      sectionTitle('Recommendations');
      ensureSpace(50);
      const recommendations =
        riskLevel.toLowerCase() === 'high'
          ? [
              'Arrange specialist evaluation as early as possible.',
              'Initiate early intervention planning with qualified professionals.',
              'Track social communication changes weekly and share updates in follow-up visits.',
            ]
          : riskLevel.toLowerCase() === 'moderate'
            ? [
                'Schedule developmental follow-up with a pediatric specialist.',
                'Begin guided communication and play-based interaction routines at home.',
                'Review progress and re-evaluate within the recommended follow-up period.',
              ]
            : [
                'Continue developmental monitoring during routine pediatric visits.',
                'Maintain interactive communication activities at home.',
                'Repeat screening if new concerns are observed.',
              ];

      recommendations.forEach((item) => {
        ensureSpace(14);
        doc.fillColor(C.text).font('Helvetica').fontSize(10)
          .text(`- ${item}`, LM, doc.y, { width: W, align: 'left' });
      });
      doc.moveDown(0.4);

      sectionTitle('Nearby Autism Support Centers');
      const centerRows = nearbyCenters && nearbyCenters.length > 0
        ? nearbyCenters.slice(0, 3).map((center) => [
            center.name,
            center.address,
            center.distanceText || (center.distanceKm ? `${center.distanceKm.toFixed(1)} km` : 'N/A'),
            'Navigate',
          ])
        : [['No centers available', '-', '-', '-']];

      drawTable(
        ['Center Name', 'Address', 'Distance', 'Action'],
        centerRows,
        [145, 225, 85, W - 455]
      );

      sectionTitle('Disclaimer');
      ensureSpace(24);
      doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(9.5)
        .text('This report is for screening purposes only and does not constitute a medical diagnosis.', LM, doc.y, { width: W });

      // ── PAGE-NUMBER FOOTER (all pages) ───────────────────────────────────────
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor(C.muted).font('Helvetica').fontSize(8)
           .text(
             `Page ${i + 1} of ${pageCount} | Report ID: ${screening._id} | AutiSense Confidential`,
             LM,
             doc.page.height - 28,
             { width: W, align: 'center' }
           );
      }

      doc.end();

      writeStream.on('finish', () => resolve(filepath));
      writeStream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

