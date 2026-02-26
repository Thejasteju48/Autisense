const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF report for screening
 */
exports.generatePDFReport = async (screening) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure reports directory exists
      const reportsDir = path.join(__dirname, '../uploads/reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `report-${screening._id}-${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24)
         .fillColor('#2C3E50')
         .text('Autism Screening Report', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(10)
         .fillColor('#7F8C8D')
         .text(`Report Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      
      doc.moveDown(2);

      // Child Information
      doc.fontSize(16)
         .fillColor('#2980B9')
         .text('Child Information');
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#2980B9');
      doc.moveDown(0.5);

      doc.fontSize(11)
         .fillColor('#2C3E50')
         .text(`Name: ${screening.child.name}`, { continued: false });
      
      if (screening.child.nickname) {
        doc.text(`Nickname: ${screening.child.nickname}`);
      }
      
      doc.text(`Age: ${screening.child.ageInMonths} months (${Math.floor(screening.child.ageInMonths / 12)} years)`);
      doc.text(`Gender: ${screening.child.gender.charAt(0).toUpperCase() + screening.child.gender.slice(1)}`);
      doc.text(`Screening Date: ${screening.createdAt.toLocaleDateString()}`);
      
      doc.moveDown(2);

      // Screening Results
      doc.fontSize(16)
         .fillColor('#2980B9')
         .text('Screening Results');
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#2980B9');
      doc.moveDown(0.5);

      // Final Score
      const riskColor = screening.riskLevel === 'Low' ? '#27AE60' : 
                       screening.riskLevel === 'Moderate' ? '#F39C12' : '#E74C3C';
      
      doc.fontSize(14)
         .fillColor('#2C3E50')
         .text(`Risk Level: `, { continued: true })
         .fillColor(riskColor)
         .text(screening.riskLevel);
      
      doc.fillColor('#2C3E50')
         .text(`Autism Likelihood Score: ${screening.finalScore.toFixed(1)}%`);
      
      doc.moveDown(2);

      // Video Analysis Features
         if (screening.liveVideoFeatures) {
        doc.fontSize(14)
           .fillColor('#34495E')
           .text('Video Analysis');
        doc.moveDown(0.5);

        doc.fontSize(11)
           .fillColor('#2C3E50');
            const features = screening.liveVideoFeatures;

            doc.text(`• Eye Contact: ${features.eyeContact || 'N/A'}`);
            doc.text(`• Head Stimming: ${features.headStimming || 'N/A'}`);
            doc.text(`• Hand Stimming: ${features.handStimming || 'N/A'}`);
            doc.text(`• Hand Gesture: ${features.handGesture || 'N/A'}`);
            doc.text(`• Social Reciprocity: ${features.socialReciprocity || 'N/A'}`);
            doc.text(`• Emotion Variation: ${features.emotionVariation || 'N/A'}`);
        
        doc.moveDown();
      }

      // Audio Analysis Features
      if (screening.audioFeatures) {
        doc.fontSize(14)
           .fillColor('#34495E')
           .text('Audio Analysis');
        doc.moveDown(0.5);

        doc.fontSize(11)
           .fillColor('#2C3E50');
        
        doc.text(`• Vocal Activity Ratio: ${(screening.audioFeatures.vocalActivityRatio * 100).toFixed(1)}%`);
        doc.text(`• Energy Level: ${screening.audioFeatures.energyLevel.toFixed(2)}`);
        
        doc.moveDown();
      }

      // Questionnaire Results
      if (screening.questionnaire) {
        doc.fontSize(14)
           .fillColor('#34495E')
           .text('Questionnaire Results');
        doc.moveDown(0.5);

        const yesCount = screening.questionnaire.responses.filter(r => r.answer).length;
        doc.fontSize(11)
           .fillColor('#2C3E50')
           .text(`Positive Responses: ${yesCount} out of ${screening.questionnaire.responses.length}`);
        doc.text(`Score: ${(screening.questionnaire.score * 100).toFixed(1)}%`);
        
        doc.moveDown();
      }

      // Add new page for interpretation
      doc.addPage();

      // Interpretation
      doc.fontSize(16)
         .fillColor('#2980B9')
         .text('Interpretation & Insights');
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#2980B9');
      doc.moveDown(0.5);

      if (screening.interpretation) {
        if (screening.interpretation.summary) {
          doc.fontSize(12)
             .fillColor('#2C3E50')
             .text('Summary:', { underline: true });
          doc.fontSize(11)
             .text(screening.interpretation.summary, { align: 'justify' });
          doc.moveDown();
        }

        if (screening.interpretation.videoInsights) {
          doc.fontSize(12)
             .fillColor('#2C3E50')
             .text('Video Insights:', { underline: true });
          doc.fontSize(11)
             .text(screening.interpretation.videoInsights, { align: 'justify' });
          doc.moveDown();
        }

        if (screening.interpretation.audioInsights) {
          doc.fontSize(12)
             .fillColor('#2C3E50')
             .text('Audio Insights:', { underline: true });
          doc.fontSize(11)
             .text(screening.interpretation.audioInsights, { align: 'justify' });
          doc.moveDown();
        }

        if (screening.interpretation.questionnaireInsights) {
          doc.fontSize(12)
             .fillColor('#2C3E50')
             .text('Questionnaire Insights:', { underline: true });
          doc.fontSize(11)
             .text(screening.interpretation.questionnaireInsights, { align: 'justify' });
          doc.moveDown();
        }
      }

      doc.moveDown(2);

      // Recommendations
      doc.fontSize(16)
         .fillColor('#2980B9')
         .text('Recommendations');
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#2980B9');
      doc.moveDown(0.5);

      if (screening.interpretation && screening.interpretation.recommendations) {
        doc.fontSize(11)
           .fillColor('#2C3E50');
        
        screening.interpretation.recommendations.forEach((rec, index) => {
          doc.text(`${index + 1}. ${rec}`, { align: 'justify' });
          doc.moveDown(0.5);
        });
      }

      doc.moveDown(2);

      // Disclaimer
      doc.fontSize(10)
         .fillColor('#95A5A6')
         .text('IMPORTANT DISCLAIMER:', { underline: true });
      
      doc.fontSize(9)
         .text('This screening tool is for educational and informational purposes only. It is NOT a diagnostic tool and should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. If you have concerns about your child\'s development, please consult with a qualified healthcare professional or developmental pediatrician.', 
         { align: 'justify' });

      // Footer
      doc.moveDown(2);
      doc.fontSize(8)
         .fillColor('#BDC3C7')
         .text(`Report ID: ${screening._id}`, 50, doc.page.height - 50, { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};
