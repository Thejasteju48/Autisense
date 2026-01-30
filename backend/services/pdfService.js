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

      // Parent Information Section
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Parent/Guardian Information', { underline: true })
         .moveDown(0.5);

      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Name: ${screening.user?.name || 'N/A'}`)
         .text(`Email: ${screening.user?.email || 'N/A'}`)
         .moveDown(1.5);

      // Child Information Section
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Child Information', { underline: true })
         .moveDown(0.5);

      const childAge = Math.floor(screening.child.ageInMonths / 12);
      const childMonths = screening.child.ageInMonths % 12;
      
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Name: ${screening.child.name || screening.child.nickname}`)
         .text(`Age: ${childAge} years ${childMonths} months (${screening.child.ageInMonths} months total)`)
         .text(`Gender: ${screening.child.gender}`)
         .text(`Date of Birth: ${new Date(screening.child.dateOfBirth).toLocaleDateString()}`)
         .text(`Screening Date: ${new Date(screening.createdAt).toLocaleDateString()}`)
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

      const yesCount = screening.questionnaire.responses.filter(r => r.answer === true).length;
      const noCount = screening.questionnaire.responses.filter(r => r.answer === false).length;

      doc.fontSize(11)
         .fillColor('#374151')
         .text(`Total Questions: ${screening.questionnaire.responses.length}`)
         .text(`Positive Responses (Yes): ${yesCount}`)
         .text(`Concerning Responses (No): ${noCount}`)
         .text(`Questionnaire Score: ${(screening.questionnaire.score * 100).toFixed(1)}%`)
         .text(`Jaundice at Birth: ${screening.questionnaire.jaundice}`)
         .text(`Family History of ASD: ${screening.questionnaire.family_asd}`)
         .moveDown(1);

      // Sample Key Responses
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('Key Questionnaire Responses (Sample):', { underline: false })
         .moveDown(0.3);

      doc.fontSize(10)
         .fillColor('#374151');
      
      screening.questionnaire.responses.slice(0, 10).forEach((response, index) => {
        const responseText = `${index + 1}. ${response.question}: ${response.answer ? '✓ Yes' : '✗ No'}`;
        doc.text(responseText, { lineGap: 2 });
      });
      
      doc.moveDown(1.5);

      // Video Analysis (if available)
      if (screening.liveVideoFeatures) {
        doc.fontSize(14)
           .fillColor('#1f2937')
           .text('Behavioral Observations (Video Analysis)', { underline: true })
           .moveDown(0.3);

        const features = screening.liveVideoFeatures;
        doc.fontSize(11)
           .fillColor('#374151')
           .text(`Session Duration: ${features.sessionDuration ? Math.floor(features.sessionDuration / 60) + ' minutes ' + (features.sessionDuration % 60) + ' seconds' : 'N/A'}`)
           .text(`Total Frames Analyzed: ${features.totalFrames || 'N/A'}`)
           .moveDown(0.5);

        doc.fontSize(12)
           .fillColor('#1f2937')
           .text('Social & Communication Behaviors:', { underline: false })
           .moveDown(0.3);
        
        doc.fontSize(10)
           .fillColor('#374151')
           .text(`• Eye Contact: ${features.eyeContactRatio ? (features.eyeContactRatio * 100).toFixed(1) + '% - ' + (features.eyeContactLevel || 'N/A') : 'N/A'}`)
           .fillColor('#6b7280')
           .text(`  ${features.eyeContactInterpretation || ''}`, { indent: 15, lineGap: 2 })
           .fillColor('#374151')
           .moveDown(0.3)
           .text(`• Blink Rate: ${features.blinkRatePerMinute ? features.blinkRatePerMinute.toFixed(1) + ' blinks/min - ' + (features.blinkLevel || 'N/A') : 'N/A'}`)
           .fillColor('#6b7280')
           .text(`  ${features.blinkInterpretation || ''}`, { indent: 15, lineGap: 2 })
           .fillColor('#374151')
           .moveDown(0.3)
           .text(`• Social Gestures: ${features.socialGestures?.present ? 'Present (' + features.socialGestures.frequency_per_minute.toFixed(1) + '/min)' : 'Absent'}`)
           .fillColor('#6b7280')
           .text(`  ${features.socialGestures?.description || 'No social gestures detected'}`, { indent: 15, lineGap: 2 })
           .fillColor('#374151')
           .moveDown(0.3)
           .text(`• Facial Expression: ${features.facialExpressionVariability ? (features.facialExpressionVariability * 100).toFixed(1) + '% - ' + (features.expressionLevel || 'N/A') : 'N/A'}`)
           .fillColor('#6b7280')
           .text(`  ${features.expressionInterpretation || ''}`, { indent: 15, lineGap: 2 })
           .fillColor('#374151')
           .moveDown(0.5);

        doc.fontSize(12)
           .fillColor('#1f2937')
           .text('Motor Patterns & Repetitive Behaviors:', { underline: false })
           .moveDown(0.3);
        
        doc.fontSize(10)
           .fillColor('#374151')
           .text(`• Head Movement: ${features.headMovementRate ? features.headMovementRate.toFixed(4) + ' - ' + (features.headMovementLevel || 'N/A') : 'N/A'}`)
           .fillColor('#6b7280')
           .text(`  ${features.headMovementInterpretation || ''}`, { indent: 15, lineGap: 2 })
           .fillColor('#374151')
           .moveDown(0.3)
           .text(`• Head Stimming: ${features.headMovements?.repetitive ? 'Present' : 'Absent'}`)
           .fillColor('#6b7280')
           .text(`  ${features.headMovements?.description || 'No repetitive head movements'}`, { indent: 15, lineGap: 2 })
           .fillColor('#374151')
           .moveDown(0.3)
           .text(`• Hand Stimming: ${features.handStimming?.present ? 'Present (' + (features.handStimming.severity || 'N/A') + ')' : 'Absent'}`)
           .fillColor('#6b7280')
           .text(`  ${features.handStimming?.description || 'No repetitive hand movements'}`, { indent: 15, lineGap: 2 })
           .fillColor('#374151')
           .moveDown(1.5);
      }

      // Add a new page for detailed analysis
      doc.addPage();
      
      // Detailed Analysis of Findings
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Detailed Analysis & Classification Basis', { underline: true })
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
        
        // Eye contact
        if (features.eyeContactRatio < 0.4) {
          concerns.push('Limited eye contact (below 40%) - a key social communication marker');
        } else if (features.eyeContactRatio > 0.6) {
          positives.push('Good eye contact maintenance (above 60%)');
        }
        
        // Hand stimming
        if (features.handStimming?.present && features.handStimming.severity !== 'NORMAL') {
          concerns.push(`Hand stimming behaviors detected (${features.handStimming.severity} severity) - repetitive self-stimulatory movements`);
        } else {
          positives.push('No significant repetitive hand movements observed');
        }
        
        // Head movements
        if (features.headMovements?.repetitive) {
          concerns.push('Repetitive head movements observed - may indicate self-regulatory behaviors');
        }
        
        // Social gestures
        if (!features.socialGestures?.present || features.socialGestures.frequency_per_minute < 1) {
          concerns.push('Limited social gestures - pointing, waving, or communicative gestures are minimal');
        } else {
          positives.push(`Active use of social gestures (${features.socialGestures.frequency_per_minute.toFixed(1)}/min)`);
        }
        
        // Facial expressions
        if (features.facialExpressionVariability < 0.2) {
          concerns.push('Reduced facial expression variability - limited emotional expression range');
        } else if (features.facialExpressionVariability > 0.4) {
          positives.push('Good range of facial expressions');
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
      
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('AI-Enhanced Clinical Analysis', { underline: true })
         .moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#6366f1')
         .text('Powered by Advanced AI - Personalized insights based on your child\'s specific behavioral patterns', { 
           align: 'center',
           italic: true
         })
         .moveDown(1);

      if (llmAnalysis) {
        // Display ONLY LLM-generated content (no static recommendations)
        doc.fontSize(11)
           .fillColor('#374151')
           .text(llmAnalysis, {
             align: 'justify',
             lineGap: 5
           });
      } else {
        // Fallback if LLM fails
        doc.fontSize(11)
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
