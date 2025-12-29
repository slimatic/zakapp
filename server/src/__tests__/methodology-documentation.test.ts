/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * User Documentation Validation - T156
 * 
 * Tests to validate that user documentation for methodologies is complete,
 * accurate, and helpful for users making methodology selection decisions.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('User Documentation for Methodologies - T156', () => {
  
  const docsPath = join(process.cwd(), '../docs/methodology-guide.md');
  let documentationContent: string;
  
  beforeAll(() => {
    // Read the methodology guide documentation
    if (existsSync(docsPath)) {
      documentationContent = readFileSync(docsPath, 'utf8');
    } else {
      documentationContent = '';
    }
  });
  
  describe('Documentation Structure and Content', () => {
    
    it('should have comprehensive methodology guide documentation', () => {
      expect(documentationContent).toBeTruthy();
      expect(documentationContent.length).toBeGreaterThan(5000); // Substantial content
      
      // Check for main sections
      expect(documentationContent).toContain('# Zakat Calculation Methodologies Guide');
      expect(documentationContent).toContain('## Overview');
      expect(documentationContent).toContain('## Methodology Selection Guide');
      expect(documentationContent).toContain('## Methodology Comparison');
      expect(documentationContent).toContain('## Choosing the Right Methodology');
    });
    
    it('should document all four methodologies comprehensively', () => {
      const methodologies = [
        'Standard (AAOIFI)',
        'Hanafi School',
        'Shafi\'i School',
        'Custom Methodology'
      ];
      
      methodologies.forEach(methodology => {
        expect(documentationContent).toContain(methodology);
      });
      
      // Check for key features documentation for each methodology
      expect(documentationContent).toContain('Key Features:');
      expect(documentationContent).toContain('Calculation Details:');
      expect(documentationContent).toContain('When to Use:');
    });
    
    it('should provide detailed nisab threshold information', () => {
      // Check nisab information is documented
      expect(documentationContent).toContain('Understanding Nisab Thresholds');
      expect(documentationContent).toContain('What is Nisab?');
      expect(documentationContent).toContain('Current Nisab Values');
      
      // Check specific nisab values are mentioned
      expect(documentationContent).toContain('85 grams of gold');
      expect(documentationContent).toContain('595 grams of silver');
      expect(documentationContent).toContain('$4,340');
      expect(documentationContent).toContain('$2,860');
    });
    
    it('should include practical calculation examples', () => {
      expect(documentationContent).toContain('Calculation Examples');
      expect(documentationContent).toContain('Example 1:');
      expect(documentationContent).toContain('Example 2:');
      expect(documentationContent).toContain('Example 3:');
      
      // Check examples show actual calculations
      expect(documentationContent).toContain('× 2.5%');
      expect(documentationContent).toContain('Zakat Due:');
      expect(documentationContent).toContain('Total Wealth:');
    });
  });
  
  describe('Methodology-Specific Documentation', () => {
    
    it('should document Standard (AAOIFI) methodology completely', () => {
      const aaoifiSection = documentationContent.match(/### 1\. Standard \(AAOIFI\) Methodology[\s\S]*?(?=### 2\.)/);
      expect(aaoifiSection).toBeTruthy();
      
      if (aaoifiSection) {
        const content = aaoifiSection[0];
        expect(content).toContain('internationally recognized standards');
        expect(content).toContain('85 grams of gold');
        expect(content).toContain('2.5% annually');
        expect(content).toContain('Comprehensive coverage');
      }
    });
    
    it('should document Hanafi methodology with school-specific details', () => {
      const hanafiSection = documentationContent.match(/### 2\. Hanafi School Methodology[\s\S]*?(?=### 3\.)/);
      expect(hanafiSection).toBeTruthy();
      
      if (hanafiSection) {
        const content = hanafiSection[0];
        expect(content).toContain('Hanafi school');
        expect(content).toContain('595 grams of silver');
        expect(content).toContain('traditional interpretations');
        expect(content).toContain('Lower Nisab Threshold');
      }
    });
    
    it('should document Shafi\'i methodology with school-specific details', () => {
      const shafiSection = documentationContent.match(/### 3\. Shafi'i School Methodology[\s\S]*?(?=### 4\.)/);
      expect(shafiSection).toBeTruthy();
      
      if (shafiSection) {
        const content = shafiSection[0];
        expect(content).toContain('Shafi\'i school');
        expect(content).toContain('85 grams of gold');
        expect(content).toContain('market values');
        expect(content).toContain('wealth timing requirements');
      }
    });
    
    it('should document Custom methodology with configuration options', () => {
      const customSection = documentationContent.match(/### 4\. Custom Methodology[\s\S]*?(?=## Methodology Comparison)/);
      expect(customSection).toBeTruthy();
      
      if (customSection) {
        const content = customSection[0];
        expect(content).toContain('configure calculation parameters');
        expect(content).toContain('Configurable Features');
        expect(content).toContain('Configuration Options');
        expect(content).toContain('unique circumstances');
      }
    });
  });
  
  describe('Decision-Making Support', () => {
    
    it('should provide clear methodology selection guidance', () => {
      expect(documentationContent).toContain('Quick Decision Guide');
      expect(documentationContent).toContain('Detailed Selection Criteria');
      
      // Check for decision trees and recommendations
      expect(documentationContent).toContain('Choose Standard (AAOIFI) if:');
      expect(documentationContent).toContain('Choose Hanafi if:');
      expect(documentationContent).toContain('Choose Shafi\'i if:');
      expect(documentationContent).toContain('Choose Custom if:');
    });
    
    it('should include comprehensive methodology comparison table', () => {
      expect(documentationContent).toContain('Methodology Comparison');
      expect(documentationContent).toContain('| Feature |');
      expect(documentationContent).toContain('| **Nisab Base** |');
      expect(documentationContent).toContain('| **Calendar Preference** |');
      expect(documentationContent).toContain('| **Complexity** |');
    });
    
    it('should explain asset categories clearly', () => {
      expect(documentationContent).toContain('Asset Categories Explained');
      expect(documentationContent).toContain('Zakatable Assets');
      expect(documentationContent).toContain('Non-Zakatable Assets');
      
      // Check for specific asset category examples
      expect(documentationContent).toContain('Cash and Bank Deposits');
      expect(documentationContent).toContain('Precious Metals');
      expect(documentationContent).toContain('Business Assets');
      expect(documentationContent).toContain('Investment Assets');
    });
  });
  
  describe('Advanced Topics and FAQ', () => {
    
    it('should cover calendar considerations', () => {
      expect(documentationContent).toContain('Calendar Considerations');
      expect(documentationContent).toContain('Lunar (Hijri) Calendar');
      expect(documentationContent).toContain('Solar (Gregorian) Calendar');
      expect(documentationContent).toContain('354-355 days');
      expect(documentationContent).toContain('365-366 days');
    });
    
    it('should include advanced calculation considerations', () => {
      expect(documentationContent).toContain('Advanced Considerations');
      expect(documentationContent).toContain('Debt Handling');
      expect(documentationContent).toContain('Business Asset Valuation');
      expect(documentationContent).toContain('Mixed Asset Portfolios');
    });
    
    it('should provide comprehensive FAQ section', () => {
      expect(documentationContent).toContain('Frequently Asked Questions');
      
      const commonQuestions = [
        'Can I switch methodologies?',
        'What if my wealth fluctuates during the year?',
        'How do I handle cryptocurrency?',
        'What about retirement accounts',
        'How do I handle international assets?'
      ];
      
      commonQuestions.forEach(question => {
        expect(documentationContent).toContain(question);
      });
    });
    
    it('should provide help and support information', () => {
      expect(documentationContent).toContain('Getting Help');
      expect(documentationContent).toContain('Within the App:');
      expect(documentationContent).toContain('External Resources:');
      expect(documentationContent).toContain('qualified Islamic scholars');
    });
  });
  
  describe('Documentation Quality and Usability', () => {
    
    it('should have appropriate documentation length and depth', () => {
      const wordCount = documentationContent.split(/\s+/).length;
      const sectionCount = (documentationContent.match(/^##/gm) || []).length;
      const exampleCount = (documentationContent.match(/Example \d+:/g) || []).length;
      
      expect(wordCount).toBeGreaterThan(2000); // Substantial documentation
      expect(sectionCount).toBeGreaterThan(5); // Multiple major sections
      expect(exampleCount).toBeGreaterThan(2); // Multiple examples
    });
    
    it('should use clear formatting and structure', () => {
      // Check for proper markdown formatting
      expect(documentationContent).toMatch(/^#\s/); // Main title
      expect(documentationContent).toMatch(/^##\s/m); // Section headers
      expect(documentationContent).toMatch(/^###\s/m); // Subsection headers
      
      // Check for lists and emphasis
      expect(documentationContent).toContain('**'); // Bold text
      expect(documentationContent).toMatch(/^-\s/m); // Bullet lists
      expect(documentationContent).toMatch(/^\d+\./m); // Numbered lists
    });
    
    it('should include visual elements and aids', () => {
      // Check for emojis/icons to improve readability
      expect(documentationContent).toContain('📊'); // Charts/data
      expect(documentationContent).toContain('🕌'); // Religious symbols
      expect(documentationContent).toContain('📚'); // Books/learning
      expect(documentationContent).toContain('⚙️'); // Settings/config
      
      // Check for tables
      expect(documentationContent).toContain('|');
      expect(documentationContent).toMatch(/\|.*\|.*\|/); // Table format
    });
    
    it('should provide actionable guidance', () => {
      // Check for checkboxes and clear recommendations
      expect(documentationContent).toContain('✅');
      
      // Check for step-by-step guidance
      expect(documentationContent).toContain('1. ');
      expect(documentationContent).toContain('2. ');
      expect(documentationContent).toContain('3. ');
      
      // Check for clear calls to action
      expect(documentationContent).toContain('→'); // Action indicators
    });
  });
  
  describe('Documentation Accuracy and Completeness', () => {
    
    it('should have accurate financial information', () => {
      // Check that financial values are reasonable and current
      const dollarsRegex = /\$[\d,]+/g;
      const dollarValues = documentationContent.match(dollarsRegex);
      
      if (dollarValues) {
        dollarValues.forEach(value => {
          const numValue = parseInt(value.replace(/[$,]/g, ''));
          if (numValue > 0) { // Only check positive values
            expect(numValue).toBeLessThan(150000); // Reasonable values including examples
          }
        });
      }
      
      // Check percentage values
      expect(documentationContent).toContain('2.5%');
    });
    
    it('should include disclaimers and legal notices', () => {
      expect(documentationContent).toContain('educational purposes');
      expect(documentationContent).toContain('scholarly consultation');
      expect(documentationContent).toContain('qualified Islamic scholars');
      expect(documentationContent).toContain('does not replace');
    });
    
    it('should be culturally and religiously appropriate', () => {
      // Check for appropriate Islamic terminology
      const islamicTerms = ['Zakat', 'Nisab', 'Hijri', 'Islamic', 'jurisprudence'];
      islamicTerms.forEach(term => {
        expect(documentationContent).toContain(term);
      });
      
      // Check for respectful language
      expect(documentationContent).not.toContain('must do');
      expect(documentationContent).toContain('obligation');
      expect(documentationContent).toContain('guidance');
    });
  });
  
  describe('Documentation Validation Summary', () => {
    
    it('should meet all T156 requirements', () => {
      const requirements = {
        methodologyExplanations: documentationContent.includes('Standard (AAOIFI)') &&
                                documentationContent.includes('Hanafi School') &&
                                documentationContent.includes('Shafi\'i School') &&
                                documentationContent.includes('Custom Methodology'),
        
        selectionGuidance: documentationContent.includes('Quick Decision Guide') &&
                          documentationContent.includes('Choose') &&
                          documentationContent.includes('if:'),
        
        comparisonCharts: documentationContent.includes('Methodology Comparison') &&
                         documentationContent.includes('|'),
        
        practicalExamples: documentationContent.includes('Calculation Examples') &&
                          documentationContent.includes('× 2.5%'),
        
        comprehensiveContent: documentationContent.length > 5000,
        
        userFriendly: documentationContent.includes('✅') &&
                     documentationContent.includes('📊'),
        
        accurate: documentationContent.includes('85 grams of gold') &&
                 documentationContent.includes('595 grams of silver'),
        
        completeGuide: documentationContent.includes('FAQ') &&
                      documentationContent.includes('Getting Help')
      };
      
      Object.entries(requirements).forEach(([requirement, met]) => {
        if (!met) {
          console.log(`❌ T156 Requirement: ${requirement} - NOT MET`);
        } else {
          console.log(`✅ T156 Requirement: ${requirement} - Met`);
        }
        expect(met).toBe(true);
      });
      
      // Overall validation
      const requirementsMet = Object.values(requirements).filter(Boolean).length;
      const totalRequirements = Object.values(requirements).length;
      const completionRate = (requirementsMet / totalRequirements) * 100;
      
      expect(completionRate).toBe(100);
      console.log(`🎯 T156 Completion Rate: ${completionRate}%`);
    });
  });
});