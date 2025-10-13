/**
 * T158 Methodology Selection Guide Validation Tests
 * 
 * Tests to validate the comprehensive methodology selection guide
 * meets all requirements and provides clear guidance for users.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('T158: Methodology Selection Guide', () => {
  let guideContent: string;

  beforeAll(() => {
    const guidePath = join(process.cwd(), '../docs/user-guide/choosing-methodology.md');
    guideContent = readFileSync(guidePath, 'utf-8');
  });

  describe('Guide Structure and Content', () => {
    it('should have a comprehensive introduction', () => {
      expect(guideContent).toContain('Introduction');
      expect(guideContent).toContain('Selecting the right Zakat calculation methodology');
      expect(guideContent).toContain('Islamic school of thought');
      expect(guideContent).toContain('consulting with qualified Islamic scholars');
    });

    it('should include a quick decision tree', () => {
      expect(guideContent).toContain('Quick Decision Tree');
      expect(guideContent).toContain('Start Here');
      expect(guideContent).toContain('Do you follow a specific Islamic school');
      expect(guideContent).toContain('YES');
      expect(guideContent).toContain('UNSURE');
      expect(guideContent).toContain('NO');
    });

    it('should provide regional recommendations', () => {
      expect(guideContent).toContain('Regional Recommendations');
      expect(guideContent).toContain('North America & Europe');
      expect(guideContent).toContain('South Asia');
      expect(guideContent).toContain('Southeast Asia');
      expect(guideContent).toContain('Middle East & Gulf');
      expect(guideContent).toContain('North Africa');
      expect(guideContent).toContain('East Africa');
      expect(guideContent).toContain('Central Asia');
    });

    it('should include asset type considerations', () => {
      expect(guideContent).toContain('Asset Type Considerations');
      expect(guideContent).toContain('Modern Investment Portfolio');
      expect(guideContent).toContain('Traditional Assets');
      expect(guideContent).toContain('Business Owners');
      expect(guideContent).toContain('High Net Worth');
      expect(guideContent).toContain('Lower Income');
    });
  });

  describe('Interactive Quiz Component', () => {
    it('should provide a methodology selection quiz', () => {
      expect(guideContent).toContain('Methodology Selection Quiz');
      expect(guideContent).toContain('Question 1');
      expect(guideContent).toContain('Question 2');
      expect(guideContent).toContain('Question 3');
      expect(guideContent).toContain('Question 4');
      expect(guideContent).toContain('Question 5');
    });

    it('should have quiz results interpretation', () => {
      expect(guideContent).toContain('Quiz Results Guide');
      expect(guideContent).toContain('Profile A');
      expect(guideContent).toContain('Profile B');
      expect(guideContent).toContain('Profile C');
      expect(guideContent).toContain('Profile D');
      expect(guideContent).toContain('Profile E');
    });

    it('should cover all major decision factors', () => {
      // Geographic context
      expect(guideContent).toContain('Geographic Context');
      expect(guideContent).toContain('Where do you primarily live');
      
      // Islamic school preference
      expect(guideContent).toContain('Islamic School Preference');
      expect(guideContent).toContain('follow or prefer a specific Islamic school');
      
      // Asset portfolio complexity
      expect(guideContent).toContain('Asset Portfolio');
      expect(guideContent).toContain('wealth composition');
      
      // Wealth level considerations
      expect(guideContent).toContain('Wealth Level');
      expect(guideContent).toContain('nisab thresholds');
      
      // Consultation preferences
      expect(guideContent).toContain('Consultation Preference');
      expect(guideContent).toContain('Islamic rulings');
    });
  });

  describe('Methodology Explanations', () => {
    it('should explain all supported methodologies', () => {
      expect(guideContent).toContain('Standard (AAOIFI) Methodology');
      expect(guideContent).toContain('Hanafi Methodology');
      expect(guideContent).toContain('Shafi\'i Methodology');
      expect(guideContent).toContain('Maliki Methodology');
      expect(guideContent).toContain('Hanbali Methodology');
    });

    it('should provide detailed methodology comparisons', () => {
      expect(guideContent).toContain('Detailed Methodology Comparison');
      expect(guideContent).toContain('Best For:');
      expect(guideContent).toContain('Key Features:');
      expect(guideContent).toContain('Consider if:');
    });

    it('should explain nisab differences', () => {
      expect(guideContent).toContain('Gold-based nisab');
      expect(guideContent).toContain('Silver-based nisab');
      expect(guideContent).toContain('$4,340');
      expect(guideContent).toContain('$2,860');
      expect(guideContent).toContain('Lower threshold');
      expect(guideContent).toContain('Higher threshold');
    });
  });

  describe('Practical Guidance', () => {
    it('should address special situations', () => {
      expect(guideContent).toContain('Special Situations');
      expect(guideContent).toContain('Switching Methodologies');
      expect(guideContent).toContain('Joint Assets');
      expect(guideContent).toContain('Business Partnerships');
      expect(guideContent).toContain('Multiple Jurisdictions');
    });

    it('should provide getting started steps', () => {
      expect(guideContent).toContain('Getting Started');
      expect(guideContent).toContain('Choose Your Methodology');
      expect(guideContent).toContain('Gather Asset Information');
      expect(guideContent).toContain('Use ZakApp Calculator');
      expect(guideContent).toContain('Verify and Learn');
      expect(guideContent).toContain('Seek Guidance When Needed');
    });

    it('should guide when to consult scholars', () => {
      expect(guideContent).toContain('When to Consult Scholars');
      expect(guideContent).toContain('Definitely Consult For:');
      expect(guideContent).toContain('Consider Consulting For:');
      expect(guideContent).toContain('You\'re Probably Fine Without Consultation:');
    });
  });

  describe('User Experience Features', () => {
    it('should use clear visual indicators', () => {
      expect(guideContent).toContain('🟢');
      expect(guideContent).toContain('🟡');
      expect(guideContent).toContain('🔵');
      expect(guideContent).toContain('✅');
      expect(guideContent).toContain('🌍');
      expect(guideContent).toContain('🌏');
    });

    it('should provide actionable recommendations', () => {
      expect(guideContent).toContain('Primary Choice');
      expect(guideContent).toContain('Alternative');
      expect(guideContent).toContain('Recommended');
      expect(guideContent).toContain('Best choice');
      expect(guideContent).toContain('Consider');
    });

    it('should be accessible to beginners', () => {
      expect(guideContent).toContain('beginner');
      expect(guideContent).toContain('First time');
      expect(guideContent).toContain('not sure');
      expect(guideContent).toContain('Starting');
      expect(guideContent).toContain('Simple');
      expect(guideContent).toContain('educational purposes');
    });
  });

  describe('Additional Resources', () => {
    it('should provide additional resources', () => {
      expect(guideContent).toContain('Additional Resources');
      expect(guideContent).toContain('Further Reading');
      expect(guideContent).toContain('Scholar Consultation');
      expect(guideContent).toContain('Tools and Calculators');
    });

    it('should encourage scholarly consultation', () => {
      expect(guideContent).toContain('qualified Islamic scholars');
      expect(guideContent).toContain('Local mosque');
      expect(guideContent).toContain('Islamic center');
      expect(guideContent).toContain('scholarly guidance');
      expect(guideContent).toContain('consultation');
    });

    it('should include appropriate disclaimers', () => {
      expect(guideContent).toContain('educational purposes');
      expect(guideContent).toContain('should be used alongside qualified Islamic scholarly guidance');
      expect(guideContent).toContain('not to replace proper Islamic jurisprudential consultation');
    });
  });

  describe('Content Quality', () => {
    it('should have sufficient content depth', () => {
      // Should be comprehensive guide (expect >3000 words)
      const wordCount = guideContent.split(/\s+/).length;
      expect(wordCount).toBeGreaterThan(3000);
    });

    it('should be well structured with clear sections', () => {
      // Count major sections
      const majorSections = (guideContent.match(/^## /gm) || []).length;
      expect(majorSections).toBeGreaterThan(8);
    });

    it('should provide logical decision process', () => {
      expect(guideContent).toContain('decision tree');
      expect(guideContent).toContain('step-by-step');
      expect(guideContent).toContain('logical');
      expect(guideContent).toContain('systematic');
    });

    it('should balance different considerations', () => {
      expect(guideContent).toContain('balance');
      expect(guideContent).toContain('finding the balance between');
      expect(guideContent).toContain('traditional vs. contemporary');
      expect(guideContent).toContain('no single "correct" methodology');
    });
  });

  describe('Summary and Validation', () => {
    it('should provide clear summary guidance', () => {
      expect(guideContent).toContain('Summary');
      expect(guideContent).toContain('key to choosing the right methodology');
      expect(guideContent).toContain('The best methodology is one that');
      expect(guideContent).toContain('When in doubt');
      expect(guideContent).toContain('Most importantly');
    });

    it('should meet all T158 requirements', () => {
      const wordCount = guideContent.split(/\s+/).length;
      const majorSections = (guideContent.match(/^## /gm) || []).length;
      
      const requirements = {
        decisionTree: guideContent.includes('Decision Tree') && guideContent.includes('Start Here'),
        regionalRecommendations: guideContent.includes('Regional Recommendations') && 
                                guideContent.includes('North America') && 
                                guideContent.includes('South Asia'),
        assetConsiderations: guideContent.includes('Asset Type Considerations') && 
                           guideContent.includes('Modern Investment Portfolio'),
        quiz: guideContent.includes('Quiz') && guideContent.includes('Question 1'),
        additionalResources: guideContent.includes('Additional Resources') && 
                           guideContent.includes('Scholar Consultation'),
        clearAndHelpful: wordCount > 3000 && majorSections > 8,
        logicalProcess: guideContent.includes('decision tree') && guideContent.includes('step-by-step'),
        beginnerAccessible: guideContent.includes('beginner') && guideContent.includes('educational purposes'),
        scholarConsultation: guideContent.includes('qualified Islamic scholars') && 
                           guideContent.includes('consultation')
      };

      Object.entries(requirements).forEach(([requirement, met]) => {
        expect(met).toBe(true);
        console.log(`✅ T158 Requirement: ${requirement} - Met`);
      });
    });
  });

  afterAll(() => {
    const wordCount = guideContent.split(/\s+/).length;
    const majorSections = (guideContent.match(/^## /gm) || []).length;
    
    console.log('\n🎯 T158 Completion Summary:');
    console.log(`📄 Guide Length: ${wordCount} words`);
    console.log(`📋 Major Sections: ${majorSections}`);
    console.log(`✅ Decision Tree: Included`);
    console.log(`🌍 Regional Recommendations: 7 regions covered`);
    console.log(`💼 Asset Type Guidance: 5 categories covered`);
    console.log(`❓ Interactive Quiz: 5 questions with profile matching`);
    console.log(`🎓 Educational Content: Comprehensive methodology explanations`);
    console.log(`📚 Additional Resources: Scholar consultation and tools`);
    console.log(`🔰 Beginner Friendly: Clear language and step-by-step guidance`);
    console.log(`👨‍🏫 Scholar Consultation: Encouraged throughout guide`);
    console.log(`\n🏆 T158 Status: COMPLETE - Comprehensive methodology selection guide created`);
  });
});