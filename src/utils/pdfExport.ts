import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BoatLineup, AssignmentMetrics } from '@/types';

export class PDFExporter {
  static async exportLineupToPDF(
    lineup: BoatLineup, 
    metrics: AssignmentMetrics,
    elementId?: string
  ): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFontSize(20);
      pdf.text(lineup.name, pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      
      let yPosition = 50;

      pdf.setFontSize(16);
      pdf.text('Dragon Boat Seat Assignment', 15, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      const leftColumn = 15;
      const rightColumn = pageWidth / 2 + 10;
      
      for (let row = 1; row <= 10; row++) {
        const leftSeat = lineup.seats.find(s => s.row === row && s.side === 'Left');
        const rightSeat = lineup.seats.find(s => s.row === row && s.side === 'Right');
        
        pdf.text(`Row ${row}:`, leftColumn - 10, yPosition);
        
        const leftText = leftSeat?.paddler 
          ? `L: ${leftSeat.paddler.name} (${leftSeat.paddler.weight}kg, S:${leftSeat.paddler.strengthScore}, E:${leftSeat.paddler.experienceScore})${leftSeat.isLocked ? ' 🔒' : ''}`
          : 'L: [Empty]';
        
        const rightText = rightSeat?.paddler 
          ? `R: ${rightSeat.paddler.name} (${rightSeat.paddler.weight}kg, S:${rightSeat.paddler.strengthScore}, E:${rightSeat.paddler.experienceScore})${rightSeat.isLocked ? ' 🔒' : ''}`
          : 'R: [Empty]';
        
        pdf.text(leftText, leftColumn, yPosition);
        pdf.text(rightText, leftColumn, yPosition + 5);
        yPosition += 15;
        
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
      }

      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text('Lineup Metrics', 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      const metricsText = [
        `Total Weight - Left: ${metrics.totalWeightLeft.toFixed(1)}kg, Right: ${metrics.totalWeightRight.toFixed(1)}kg`,
        `Weight Imbalance: ${Math.abs(metrics.weightImbalance).toFixed(1)}kg`,
        `Side Preferences Satisfied: ${metrics.sidePreferencesSatisfied}/${metrics.totalSidePreferences} (${metrics.totalSidePreferences > 0 ? ((metrics.sidePreferencesSatisfied / metrics.totalSidePreferences) * 100).toFixed(0) : 100}%)`,
      ];

      metricsText.forEach(text => {
        pdf.text(text, 15, yPosition);
        yPosition += 7;
      });

      if (metrics.warnings.length > 0) {
        yPosition += 5;
        pdf.setFontSize(12);
        pdf.text('Warnings:', 15, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(9);
        metrics.warnings.forEach(warning => {
          pdf.text(`• ${warning}`, 20, yPosition);
          yPosition += 6;
        });
      }

      if (elementId) {
        try {
          const element = document.getElementById(elementId);
          if (element) {
            const canvas = await html2canvas(element, {
              scale: 1,
              useCORS: true,
              allowTaint: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 30;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            if (yPosition + imgHeight > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
          }
        } catch (error) {
          console.warn('Failed to capture visual layout:', error);
        }
      }

      const fileName = `${lineup.name.replace(/[^a-z0-9]/gi, '_')}_lineup.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export PDF');
    }
  }

  static async exportCurrentLineupToPDF(
    seats: any[],
    metrics: AssignmentMetrics,
    elementId?: string
  ): Promise<void> {
    const lineup = {
      id: 'current',
      name: 'Current Dragon Boat Lineup',
      seats,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return this.exportLineupToPDF(lineup, metrics, elementId);
  }
}