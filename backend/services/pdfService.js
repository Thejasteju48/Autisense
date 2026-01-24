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

      // Header
      doc.fontSize(24)
         .fillColor('#6366f1')
         .text('AutiSense Screening Report', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(12)
         .fillColor('#666')
         .text(`Report Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
         .moveDown(1.5);

      // Child Information Section
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Child Information', { underline: true })
         .moveDown(0.5);

      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Name: ${screening.child.name}`)
         .text(`Age: ${Math.floor(screening.child.ageInMonths / 12)} years ${screening.child.ageInMonths % 12} months`)
         .text(`Gender: ${screening.child.gender}`)
         .text(`Date of Birth: ${new Date(screening.child.dateOfBirth).toLocaleDateString()}`)
         .moveDown(1.5);

      // Assessment Results Section
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Assessment Results', { underline: true })
         .moveDown(0.5);

      // Risk Level Box
      const riskColor = screening.riskLevel === 'Low' ? '#10b981' : 
                        screening.riskLevel === 'Moderate' ? '#f59e0b' : '#ef4444';
      
      doc.roundedRect(50, doc.y, 500, 80, 10)
         .fillAndStroke(riskColor, riskColor);

      doc.fontSize(14)
         .fillColor('#ffffff')
         .text('Risk Assessment', 60, doc.y - 70, { align: 'left' })
         .fontSize(32)
         .text(`${screening.finalScore.toFixed(1)}%`, 60, doc.y + 10)
         .fontSize(16)
         .text(`${screening.riskLevel} Risk Level`, 60, doc.y + 5);

      doc.moveDown(2);

      // Questionnaire Summary
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Questionnaire Summary', { underline: true })
         .moveDown(0.3);

      doc.fontSize(11)
         .fillColor('#374151')
         .text(`Total Questions: ${screening.questionnaire.responses.length}`)
         .text(`Questionnaire Score: ${(screening.questionnaire.score * 100).toFixed(1)}%`)
         .text(`Jaundice at Birth: ${screening.questionnaire.jaundice}`)
         .text(`Family History of ASD: ${screening.questionnaire.family_asd}`)
         .moveDown(1.5);

      // Video Analysis (if available)
      if (screening.liveVideoFeatures) {
        doc.fontSize(14)
           .fillColor('#1f2937')
           .text('Behavioral Observations (Video Analysis)', { underline: true })
           .moveDown(0.3);

        const features = screening.liveVideoFeatures;
        doc.fontSize(11)
           .fillColor('#374151')
           .text(`Eye Contact Ratio: ${features.eye_contact_ratio ? (features.eye_contact_ratio * 100).toFixed(1) + '%' : 'N/A'}`)
           .text(`Blink Rate: ${features.blink_rate || 'N/A'}`)
           .text(`Head Movement: ${features.head_movement_rate || 'N/A'}`)
           .text(`Gestures Detected: ${features.gesture_count || 0}`)
           .text(`Expression Variability: ${features.expression_variability || 'N/A'}`)
           .moveDown(1.5);
      }

      // LLM-Generated Analysis
      doc.addPage();
      
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Clinical Analysis & Recommendations', { underline: true })
         .moveDown(1);

      if (llmAnalysis) {
        doc.fontSize(11)
           .fillColor('#374151')
           .text(llmAnalysis, {
             align: 'justify',
             lineGap: 5
           });
      } else {
        doc.fontSize(11)
           .fillColor('#374151')
           .text(screening.interpretation.summary || 'Analysis pending');
      }

      // Disclaimer
      doc.moveDown(2);
      doc.fontSize(10)
         .fillColor('#666')
         .text('IMPORTANT DISCLAIMER:', { underline: true })
         .fontSize(9)
         .text('This screening tool is designed for early detection purposes only and is NOT a diagnostic instrument. The results should be interpreted by qualified healthcare professionals. A comprehensive clinical evaluation by a pediatrician, psychologist, or developmental specialist is necessary for an accurate diagnosis of Autism Spectrum Disorder (ASD). Early intervention has been shown to significantly improve outcomes for children with ASD.', {
           align: 'justify',
           lineGap: 3
         });

      // Footer
      doc.fontSize(8)
         .fillColor('#999')
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
