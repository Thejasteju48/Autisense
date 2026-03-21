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

      // ── Colour palette ──────────────────────────────────────────────────────
      const C = {
        primary:   '#4C1D95',   // deep purple header
        accent:    '#7C3AED',   // section rule colour
        riskLow:   '#065F46',   // dark green
        riskMod:   '#92400E',   // amber
        riskHigh:  '#991B1B',   // red
        bgLow:     '#D1FAE5',
        bgMod:     '#FEF3C7',
        bgHigh:    '#FEE2E2',
        ink:       '#1F2937',
        muted:     '#6B7280',
        rule:      '#E5E7EB',
        white:     '#FFFFFF',
      };

      const riskColor  = screening.riskLevel === 'Low' ? C.riskLow  : screening.riskLevel === 'Moderate' ? C.riskMod  : C.riskHigh;
      const riskBg     = screening.riskLevel === 'Low' ? C.bgLow    : screening.riskLevel === 'Moderate' ? C.bgMod    : C.bgHigh;

      // ── Helper utilities ─────────────────────────────────────────────────────
      const fmt = (v) => {
        if (v === null || v === undefined || v === '') return 'N/A';
        return String(v);
      };
      const fmtDate = (v) => {
        if (!v) return 'N/A';
        const d = new Date(v);
        return isNaN(d) ? 'N/A' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      };

      const W  = doc.page.width  - 100;   // usable width (l+r margin = 100)
      const LM = 50;                       // left margin

      // Draw a horizontal rule
      const rule = (y) => {
        doc.strokeColor(C.rule).lineWidth(0.5).moveTo(LM, y || doc.y).lineTo(LM + W, y || doc.y).stroke();
      };

      // Section heading (e.g. "SECTION 1 – CHILD INFORMATION")
      const sectionHead = (text) => {
        doc.moveDown(0.6);
        const y = doc.y;
        doc.rect(LM, y, W, 22).fill(C.accent);
        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(10)
           .text(text, LM + 10, y + 6, { width: W - 20, lineBreak: false });
        doc.moveDown(1.1);
        doc.fillColor(C.ink).font('Helvetica').fontSize(10);
      };

      // Key-value row
      const kv = (label, value, bold = false) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.muted)
           .text(`${label}:`, LM, doc.y, { continued: true, width: 160 });
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor(C.ink)
           .text(`  ${fmt(value)}`);
      };

      // ── PAGE 1 ───────────────────────────────────────────────────────────────

      // ── HEADER BANNER ────────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill(C.primary);

      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(22)
         .text('AUTISENSE', LM, 18, { lineBreak: false });
      doc.fillColor('#DDD6FE').font('Helvetica').fontSize(11)
         .text('AI-Powered Autism Screening System', LM, 44, { lineBreak: false });

      // Right side: report meta
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
         .text('AUTISM SCREENING REPORT', LM, 22, { align: 'right', width: W });
      doc.fillColor('#DDD6FE').font('Helvetica').fontSize(8)
         .text(`Report Date: ${fmtDate(new Date())}`, LM, 35, { align: 'right', width: W })
         .text(`Report ID: ${screening._id}`, LM, 47, { align: 'right', width: W });

      doc.moveDown(4.5);

      // ── DIVIDER LINE ─────────────────────────────────────────────────────────
      rule();
      doc.moveDown(0.6);

      // ── SECTION 1 – CHILD INFORMATION ───────────────────────────────────────
      sectionHead('SECTION 1  –  CHILD INFORMATION');

      const childAge   = Math.floor(screening.child.ageInMonths / 12);
      const childMonth = screening.child.ageInMonths % 12;
      const ageStr     = childAge > 0
        ? `${childAge} year${childAge > 1 ? 's' : ''} ${childMonth} month${childMonth !== 1 ? 's' : ''} (${screening.child.ageInMonths} months)`
        : `${childMonth} month${childMonth !== 1 ? 's' : ''} (${screening.child.ageInMonths} months)`;

      kv('Child Name',      screening.child.name || screening.child.nickname);
      kv('Age',             ageStr);
      kv('Gender',          screening.child.gender ? screening.child.gender.charAt(0).toUpperCase() + screening.child.gender.slice(1) : 'N/A');
      kv('Date of Birth',   fmtDate(screening.child.dateOfBirth));
      kv('Screening Date',  fmtDate(screening.createdAt));
      doc.moveDown(0.4);

      // ── SECTION 2 – PARENT INFORMATION ──────────────────────────────────────
      sectionHead('SECTION 2  –  PARENT / GUARDIAN INFORMATION');

      kv('Parent Name',    screening.user?.name);
      kv('Email',          screening.user?.email);
      kv('City',           screening.user?.city);
      kv('State',          screening.user?.state);
      kv('Country',        screening.user?.country);
      doc.moveDown(0.4);

      // ── SECTION 3 – SCREENING SUMMARY ───────────────────────────────────────
      sectionHead('SECTION 3  –  SCREENING SUMMARY');

      // Score box
      const boxY  = doc.y;
      const bW    = (W - 10) / 3;
      const bH    = 58;
      const labelY = boxY + 8;
      const valY   = boxY + 22;

      // Questionnaire box
      doc.rect(LM, boxY, bW, bH).fillAndStroke('#EDE9FE', C.rule);
      doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8.5)
         .text('QUESTIONNAIRE SCORE', LM + 6, labelY, { width: bW - 12, align: 'center' });
      doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(22)
         .text(`${Math.round(screening.mlQuestionnaireScore || 0)}`, LM + 6, valY, { width: bW - 12, align: 'center' });
      doc.fillColor(C.muted).font('Helvetica').fontSize(8)
         .text('out of 100', LM + 6, valY + 26, { width: bW - 12, align: 'center' });

      // Video box
      const b2X = LM + bW + 5;
      doc.rect(b2X, boxY, bW, bH).fillAndStroke('#EFF6FF', C.rule);
      doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8.5)
         .text('VIDEO ANALYSIS SCORE', b2X + 6, labelY, { width: bW - 12, align: 'center' });
      doc.fillColor('#1D4ED8').font('Helvetica-Bold').fontSize(22)
         .text(`${Math.round(screening.videoScore || 0)}`, b2X + 6, valY, { width: bW - 12, align: 'center' });
      doc.fillColor(C.muted).font('Helvetica').fontSize(8)
         .text('out of 100', b2X + 6, valY + 26, { width: bW - 12, align: 'center' });

      // Risk box
      const b3X = LM + (bW + 5) * 2;
      doc.rect(b3X, boxY, bW, bH).fillAndStroke(riskBg, C.rule);
      doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8.5)
         .text('FINAL RISK SCORE', b3X + 6, labelY, { width: bW - 12, align: 'center' });
      doc.fillColor(riskColor).font('Helvetica-Bold').fontSize(22)
         .text(`${Math.round(screening.finalScore || 0)}`, b3X + 6, valY, { width: bW - 12, align: 'center' });
      doc.fillColor(riskColor).font('Helvetica-Bold').fontSize(9)
         .text(screening.riskLevel + ' Risk', b3X + 6, valY + 26, { width: bW - 12, align: 'center' });

      doc.y = boxY + bH + 12;
      doc.moveDown(0.3);

      // Risk level badge (text)
      doc.rect(LM, doc.y, W, 26).fill(riskBg);
      doc.fillColor(riskColor).font('Helvetica-Bold').fontSize(11)
         .text(
           `Risk Level: ${screening.riskLevel.toUpperCase()}  |  Final Score: ${(screening.finalScore || 0).toFixed(1)} / 100  |  50% Questionnaire  +  50% Video Analysis`,
           LM + 10, doc.y + 7, { width: W - 20, lineBreak: false }
         );
      doc.moveDown(1.4);

      // ── SECTION 4 – BEHAVIORAL INDICATORS ───────────────────────────────────
      sectionHead('SECTION 4  –  BEHAVIORAL INDICATORS  (Video Analysis)');

      const indicators = [
        { key: 'eyeContact',        label: 'Eye Contact',        icon: '👀' },
        { key: 'headStimming',      label: 'Head Stimming',      icon: '🔄' },
        { key: 'handStimming',      label: 'Hand Stimming',      icon: '✋' },
        { key: 'handGesture',       label: 'Hand Gesture',       icon: '🤲' },
        { key: 'socialReciprocity', label: 'Social Reciprocity', icon: '🔁' },
        { key: 'emotionVariation',  label: 'Emotion Variation',  icon: '😊' },
      ];

      for (const ind of indicators) {
        const rawVal = (screening.liveVideoFeatures || {})[ind.key] || 'N/A';
        const explanation = indicatorExplanations[ind.key] || '';

        // Concern flag
        const isConcern = ['Low Eye Contact', 'Present', 'Low', 'Absent'].includes(rawVal);
        const rowBg = isConcern ? '#FFF7F7' : '#F7FFF9';
        const dotColor = isConcern ? '#EF4444' : '#10B981';

        const rowTop  = doc.y;
        const rowH    = explanation ? Math.max(50, 16 + Math.ceil(explanation.length / 95) * 14) : 36;

        // Row background
        doc.rect(LM, rowTop, W, rowH).fillAndStroke(rowBg, C.rule);

        // Status dot
        doc.circle(LM + 14, rowTop + rowH / 2, 5).fill(dotColor);

        // Indicator name
        doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(10)
           .text(`${ind.icon}  ${ind.label}`, LM + 24, rowTop + 6, { width: 140, lineBreak: false });

        // Result value
        doc.fillColor(isConcern ? C.riskHigh : C.riskLow).font('Helvetica-Bold').fontSize(10)
           .text(rawVal, LM + 170, rowTop + 6, { width: 120, lineBreak: false });

        // AI explanation (right column)
        if (explanation) {
          doc.fillColor(C.muted).font('Helvetica').fontSize(8.5)
             .text(explanation, LM + 295, rowTop + 6, { width: W - 295, lineGap: 2 });
        }

        doc.y = rowTop + rowH + 3;
      }

      doc.moveDown(0.6);

      // ── PAGE 2 – AI ANALYSIS ─────────────────────────────────────────────────
      doc.addPage();

      // Repeat mini-header on page 2
      doc.rect(0, 0, doc.page.width, 40).fill(C.primary);
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(13)
         .text('AUTISENSE – AUTISM SCREENING REPORT (continued)', LM, 13, { width: W });
      doc.moveDown(3);

      // ── SECTION 5 – AI GENERATED EXPLANATION ────────────────────────────────
      sectionHead('SECTION 5  –  AI GENERATED CLINICAL EXPLANATION  (Powered by Groq Llama 3)');

      if (llmAnalysis) {
        doc.fillColor(C.ink).font('Helvetica').fontSize(9.5)
           .text(llmAnalysis, LM, doc.y, { width: W, align: 'justify', lineGap: 3 });
      } else {
        doc.fillColor(C.muted).font('Helvetica').fontSize(10)
           .text('AI analysis is not available for this report. Please consult a qualified healthcare professional for detailed interpretation.', LM, doc.y, { width: W, align: 'justify' });
      }

      doc.moveDown(1.2);

      // ── SECTION 6 – NEARBY AUTISM CENTERS ───────────────────────────────────
      sectionHead('SECTION 6  –  SUGGESTED NEARBY AUTISM CENTERS');

      const location = [screening.user?.city, screening.user?.state, screening.user?.country]
        .filter(Boolean).join(', ');

      if (location) {
        doc.fillColor(C.muted).font('Helvetica').fontSize(9)
           .text(`Based on your registered location: ${location}`, LM, doc.y);
        doc.moveDown(0.5);
      }

      if (nearbyCenters && nearbyCenters.length > 0) {
        nearbyCenters.forEach((center, i) => {
          const cY = doc.y;
               doc.rect(LM, cY, W, 58).fillAndStroke('#F5F3FF', C.rule);

          doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(10)
             .text(`${i + 1}.  ${center.name}`, LM + 10, cY + 6, { width: W - 20, lineBreak: false });
          doc.fillColor(C.ink).font('Helvetica').fontSize(9)
                   .text(`Address: ${center.address}`, LM + 10, cY + 20, { width: W - 20, lineBreak: false });
          doc.fillColor(C.muted).font('Helvetica').fontSize(9)
                   .text(`Coordinates: ${center.latitude}, ${center.longitude}`, LM + 10, cY + 34, { width: W - 20, lineBreak: false });

               doc.y = cY + 64;
        });
      } else {
        doc.rect(LM, doc.y, W, 38).fillAndStroke('#F9FAFB', C.rule);
        doc.fillColor(C.muted).font('Helvetica').fontSize(9.5)
           .text(
             location
                      ? `No centers were retrieved automatically. Search OpenStreetMap for "Autism therapy center in ${location}" to find local specialists.`
               : 'Location information not available. Please update your profile with city, state, and country to receive nearby center suggestions.',
             LM + 10, doc.y + 10, { width: W - 20, align: 'justify' }
           );
        doc.moveDown(2.8);
      }

      doc.moveDown(1);

      // ── DISCLAIMER ───────────────────────────────────────────────────────────
      rule();
      doc.moveDown(0.5);
      doc.fillColor(C.riskMod).font('Helvetica-Bold').fontSize(8.5)
         .text('IMPORTANT DISCLAIMER', LM);
      doc.fillColor(C.muted).font('Helvetica').fontSize(8)
         .text(
           'This report is generated by an AI-assisted screening tool and is intended for informational purposes only. ' +
           'It is NOT a clinical diagnosis. Only licensed healthcare professionals — such as a developmental pediatrician, ' +
           'clinical psychologist, or child psychiatrist — can diagnose Autism Spectrum Disorder (ASD). ' +
           'Early professional evaluation is strongly recommended when any concern is identified.',
           LM, doc.y, { width: W, align: 'justify', lineGap: 2 }
         );

      // ── PAGE-NUMBER FOOTER (all pages) ───────────────────────────────────────
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
           .text(
             `Page ${i + 1} of ${pageCount}  |  Report ID: ${screening._id}  |  Autisense – Confidential`,
             LM, doc.page.height - 28, { width: W, align: 'center' }
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

