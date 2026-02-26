const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a comprehensive PDF report for screening results
 */
exports.generateScreeningReport = async (screening, llmAnalysis) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
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

      const brand = {
        primary: '#5b21b6',
        primaryLight: '#ede9fe',
        ink: '#111827',
        muted: '#6b7280',
        line: '#e5e7eb'
      };

      const formatDate = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString();
      };

      const formatDuration = (seconds) => {
        if (seconds === undefined || seconds === null) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
      };

      const sectionTitle = (title) => {
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor(brand.ink)
           .text(title.toUpperCase(), { characterSpacing: 1 });
        doc.moveDown(0.2);
        doc.strokeColor(brand.line).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.6);
      };

      const keyValue = (label, value) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(brand.ink).text(`${label}: `, { continued: true });
        doc.font('Helvetica').fillColor(brand.muted).text(value || 'N/A');
      };

      // Header
      doc.rect(0, 0, doc.page.width, 90).fill(brand.primary);
      doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('Autisense', 50, 30);
      doc.font('Helvetica')
        .fontSize(11)
        .text('Autism Screening Report', 50, 54);
      doc.font('Helvetica')
        .fontSize(9)
        .text(`Report Generated: ${formatDate(new Date())}`, 400, 40, { align: 'right' });

      doc.moveDown(4.5);
      doc.font('Helvetica').fontSize(10).fillColor(brand.ink);

      // Patient summary block
      const childAge = Math.floor(screening.child.ageInMonths / 12);
      const childMonths = screening.child.ageInMonths % 12;

      sectionTitle('Patient & Guardian');
      const startY = doc.y;
      const colX = 50;
      const colWidth = 245;
      const colX2 = 305;

      doc.font('Helvetica-Bold').fontSize(11).fillColor(brand.ink).text('Guardian', colX, startY);
      doc.font('Helvetica').fontSize(10).fillColor(brand.muted);
      doc.text(`Name: ${screening.user?.name || 'N/A'}`, colX, startY + 18);
      doc.text(`Email: ${screening.user?.email || 'N/A'}`, colX, startY + 34);

      doc.font('Helvetica-Bold').fontSize(11).fillColor(brand.ink).text('Child', colX2, startY);
      doc.font('Helvetica').fontSize(10).fillColor(brand.muted);
      doc.text(`Name: ${screening.child.name || screening.child.nickname || 'N/A'}`, colX2, startY + 18);
      doc.text(`Age: ${childAge} years ${childMonths} months`, colX2, startY + 34);
      doc.text(`Gender: ${screening.child.gender || 'N/A'}`, colX2, startY + 50);
      doc.text(`DOB: ${formatDate(screening.child.dateOfBirth)}`, colX2, startY + 66);
      doc.text(`Screening Date: ${formatDate(screening.createdAt)}`, colX2, startY + 82);
      doc.moveDown(4.5);

      // Assessment Results
      sectionTitle('Assessment Summary');
      const riskColor = screening.riskLevel === 'Low' ? '#10b981' : 
                  screening.riskLevel === 'Moderate' ? '#f59e0b' : '#ef4444';

      doc.roundedRect(50, doc.y, 500, 70, 8)
        .fillAndStroke('#ffffff', brand.line);
      doc.rect(50, doc.y, 500, 70).stroke(brand.line);

      doc.font('Helvetica-Bold').fontSize(11).fillColor(brand.ink).text('Overall Risk', 70, doc.y + 12);
      doc.font('Helvetica-Bold').fontSize(24).fillColor(riskColor).text(`${screening.riskLevel} Risk`, 70, doc.y + 28);
      doc.font('Helvetica').fontSize(10).fillColor(brand.muted).text(`Score: ${screening.finalScore.toFixed(1)}%`, 70, doc.y + 55);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(brand.ink).text('Report ID', 380, doc.y - 47);
      doc.font('Helvetica').fontSize(9).fillColor(brand.muted).text(`${screening._id}`, 380, doc.y - 35, { width: 150 });
      doc.moveDown(4.5);

      // Questionnaire Summary
      sectionTitle('Questionnaire Summary');

      const yesCount = screening.questionnaire.responses.filter(r => r.answer === true).length;
      const noCount = screening.questionnaire.responses.filter(r => r.answer === false).length;

      doc.font('Helvetica').fontSize(10).fillColor(brand.muted);
      keyValue('Total Questions', screening.questionnaire.responses.length);
      keyValue('Positive Responses (Yes)', yesCount);
      keyValue('Concerning Responses (No)', noCount);
      keyValue('Questionnaire Score', `${(screening.questionnaire.score * 100).toFixed(1)}%`);
      keyValue('Jaundice at Birth', screening.questionnaire.jaundice);
      keyValue('Family History of ASD', screening.questionnaire.family_asd);
      doc.moveDown(0.6);

      // Sample Key Responses
      doc.font('Helvetica-Bold').fontSize(11).fillColor(brand.ink)
        .text('Key Questionnaire Responses (Sample)');
      doc.moveDown(0.2);

      doc.font('Helvetica').fontSize(9).fillColor(brand.muted);
      
      screening.questionnaire.responses.slice(0, 10).forEach((response, index) => {
        const responseText = `${index + 1}. ${response.question}: ${response.answer ? '✓ Yes' : '✗ No'}`;
        doc.text(responseText, { lineGap: 2 });
      });
      
      doc.moveDown(1.5);

      // Video Analysis (if available)
      if (screening.liveVideoFeatures) {
        sectionTitle('Recorded Video Analysis');

        const features = screening.liveVideoFeatures;
        doc.font('Helvetica').fontSize(10).fillColor(brand.muted);
        keyValue('Session Duration', formatDuration(features.sessionDuration));
        keyValue('Total Frames Analyzed', features.totalFrames || 'N/A');
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').fontSize(11).fillColor(brand.ink)
          .text('Observed Signals');
        doc.moveDown(0.2);

        doc.font('Helvetica').fontSize(10).fillColor(brand.muted);
        doc.text(`• Eye Contact: ${features.eyeContact || 'N/A'}`);
        doc.moveDown(0.2);
        doc.text(`• Hand Gesture: ${features.handGesture || 'N/A'}`);
        doc.moveDown(0.2);
        doc.text(`• Social Reciprocity: ${features.socialReciprocity || 'N/A'}`);
        doc.moveDown(0.2);
        doc.text(`• Emotion Variation: ${features.emotionVariation || 'N/A'}`);
        doc.moveDown(0.2);
        doc.text(`• Head Stimming: ${features.headStimming || 'N/A'}`);
        doc.moveDown(0.2);
        doc.text(`• Hand Stimming: ${features.handStimming || 'N/A'}`);
        doc.moveDown(1.2);
      }

      // Add a new page for detailed analysis
      doc.addPage();
      
      // Detailed Analysis of Findings
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(brand.ink)
        .text('Detailed Analysis & Classification Basis')
        .moveDown(0.5);

      doc.fontSize(11)
         .fillColor('#374151')
         .text('Classification Rationale:', { underline: true })
         .moveDown(0.3);

      // Build classification reasons
      const concerns = [];
      const positives = [];

      if (screening.liveVideoFeatures) {
        const features = screening.liveVideoFeatures;

        if (features.eyeContact === 'Low Eye Contact') {
          concerns.push('Limited eye contact - a key social communication marker');
        } else if (features.eyeContact === 'Normal Eye Contact') {
          positives.push('Consistent eye contact during interaction');
        }

        if (features.handStimming === 'Present') {
          concerns.push('Repetitive hand stimming behaviors observed');
        } else if (features.handStimming === 'Absent') {
          positives.push('No significant hand stimming observed');
        }

        if (features.headStimming === 'Present') {
          concerns.push('Repetitive head stimming behaviors observed');
        } else if (features.headStimming === 'Absent') {
          positives.push('No significant head stimming observed');
        }

        if (features.handGesture === 'Absent') {
          concerns.push('Limited communicative hand gestures observed');
        } else if (features.handGesture === 'Present') {
          positives.push('Uses communicative hand gestures');
        }

        if (features.socialReciprocity === 'Low') {
          concerns.push('Reduced social reciprocity during interaction');
        } else if (features.socialReciprocity === 'Normal') {
          positives.push('Age-appropriate social reciprocity observed');
        }

        if (features.emotionVariation === 'Low') {
          concerns.push('Reduced emotion variation across expressions');
        } else if (features.emotionVariation === 'Normal') {
          positives.push('Healthy variation in emotional expressions');
        }
      }

      // Questionnaire concerns
      const highRiskResponses = screening.questionnaire.responses.filter(r => !r.answer).length;
      if (highRiskResponses > 5) {
        concerns.push(`${highRiskResponses} concerning questionnaire responses indicating developmental delays in communication, social interaction, or behavioral flexibility`);
      }

      if (screening.questionnaire.family_asd === 'yes') {
        concerns.push('Family history of Autism Spectrum Disorder increases genetic risk');
      }

      doc.fontSize(10)
         .fillColor('#dc2626');
      
      if (concerns.length > 0) {
        doc.text('Concerning Indicators:', { underline: true })
           .fillColor('#374151');
        concerns.forEach((concern, index) => {
          doc.text(`${index + 1}. ${concern}`, { lineGap: 3, indent: 10 });
        });
        doc.moveDown(0.5);
      }

      doc.fontSize(10)
         .fillColor('#10b981');
      
      if (positives.length > 0) {
        doc.text('Positive Indicators:', { underline: true })
           .fillColor('#374151');
        positives.forEach((positive, index) => {
          doc.text(`${index + 1}. ${positive}`, { lineGap: 3, indent: 10 });
        });
        doc.moveDown(1);
      }

      // AI-Generated Clinical Analysis (ALL content from LLM)
      doc.addPage();
      
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(brand.ink)
        .text('AI Clinical Summary')
        .moveDown(0.5);

      doc.font('Helvetica')
        .fontSize(9)
        .fillColor(brand.primary)
        .text('AI-generated summary based on the submitted recorded video and questionnaire', { 
           align: 'center',
           italic: true
         })
         .moveDown(1);

      if (llmAnalysis) {
        // Display ONLY LLM-generated content (no static recommendations)
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#374151')
           .text(llmAnalysis, {
             align: 'justify',
             lineGap: 4
           });
      } else {
        // Fallback if LLM fails
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#dc2626')
           .text('AI Analysis unavailable. Please consult with a healthcare professional for detailed interpretation.', {
             align: 'justify'
           })
           .moveDown(1)
           .fillColor('#374151')
           .text(screening.interpretation.summary || 'Based on the assessment, please schedule a consultation with a developmental pediatrician or child psychologist for comprehensive evaluation and personalized guidance.');
      }

      doc.moveDown(1.5);

      // Disclaimer
      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#6b7280')
        .text('IMPORTANT DISCLAIMER:')
        .font('Helvetica')
        .fontSize(8)
        .text('This screening tool is designed for early detection purposes only and is NOT a diagnostic instrument. The results should be interpreted by qualified healthcare professionals. A comprehensive clinical evaluation by a pediatrician, psychologist, or developmental specialist is necessary for an accurate diagnosis of Autism Spectrum Disorder (ASD). Early intervention has been shown to significantly improve outcomes for children with ASD.', {
           align: 'justify',
           lineGap: 3
         });

      // Footer
      doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(`Report ID: ${screening._id}`, 50, doc.page.height - 30, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(filepath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};
