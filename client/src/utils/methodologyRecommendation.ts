/**
 * Methodology Recommendation Engine
 * 
 * Provides intelligent recommendations for which Zakat calculation methodology
 * to use based on user profile, location, and asset composition.
 */

export interface UserProfile {
  region?: string;
  country?: string;
  assetTypes?: string[];
  preferredApproach?: 'conservative' | 'standard' | 'permissive';
  followsMadhab?: 'hanafi' | 'shafi' | 'maliki' | 'hanbali' | 'none';
  hasComplexAssets?: boolean;
  wantsHigherZakat?: boolean;
}

export interface RecommendationResult {
  recommendedMethodology: 'standard' | 'hanafi' | 'shafi' | 'custom';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  alternatives: Array<{
    methodology: string;
    reason: string;
  }>;
}

/**
 * Regional methodology preferences based on scholarly traditions
 */
const REGIONAL_PREFERENCES: Record<string, string[]> = {
  // Middle East
  'saudi-arabia': ['standard', 'hanbali'],
  'uae': ['standard', 'maliki'],
  'qatar': ['standard', 'hanbali'],
  'kuwait': ['standard', 'maliki'],
  'bahrain': ['standard', 'maliki'],
  'oman': ['standard'],
  'yemen': ['shafi', 'standard'],
  'jordan': ['standard', 'hanafi'],
  'palestine': ['shafi', 'hanafi'],
  'lebanon': ['standard', 'shafi'],
  'syria': ['standard', 'hanafi'],
  'iraq': ['standard', 'hanafi'],
  'egypt': ['standard', 'hanafi'],
  
  // South Asia
  'pakistan': ['hanafi', 'standard'],
  'india': ['hanafi', 'standard'],
  'bangladesh': ['hanafi', 'standard'],
  'afghanistan': ['hanafi', 'standard'],
  'sri-lanka': ['shafi', 'standard'],
  'maldives': ['shafi', 'standard'],
  
  // Southeast Asia
  'indonesia': ['shafi', 'standard'],
  'malaysia': ['shafi', 'standard'],
  'singapore': ['shafi', 'standard'],
  'brunei': ['shafi', 'standard'],
  'thailand': ['shafi', 'standard'],
  'philippines': ['shafi', 'standard'],
  
  // North Africa
  'morocco': ['maliki', 'standard'],
  'algeria': ['maliki', 'standard'],
  'tunisia': ['maliki', 'standard'],
  'libya': ['maliki', 'standard'],
  'mauritania': ['maliki', 'standard'],
  'sudan': ['maliki', 'hanafi', 'standard'],
  
  // East Africa
  'somalia': ['shafi', 'standard'],
  'kenya': ['shafi', 'standard'],
  'tanzania': ['shafi', 'standard'],
  'ethiopia': ['shafi', 'standard'],
  
  // Central Asia
  'turkey': ['hanafi', 'standard'],
  'uzbekistan': ['hanafi', 'standard'],
  'kazakhstan': ['hanafi', 'standard'],
  'tajikistan': ['hanafi', 'standard'],
  'kyrgyzstan': ['hanafi', 'standard'],
  'turkmenistan': ['hanafi', 'standard'],
  'azerbaijan': ['hanafi', 'standard'],
  
  // Europe & Americas (multicultural - default to standard)
  'united-kingdom': ['standard'],
  'france': ['standard'],
  'germany': ['standard'],
  'united-states': ['standard'],
  'canada': ['standard'],
  'australia': ['standard'],
};

/**
 * Map madhab to methodology
 */
const MADHAB_TO_METHODOLOGY: Record<string, string> = {
  'hanafi': 'hanafi',
  'shafi': 'shafi',
  'maliki': 'standard', // Maliki is similar to standard AAOIFI
  'hanbali': 'standard', // Hanbali is similar to standard AAOIFI
  'none': 'standard'
};

/**
 * Get methodology recommendation based on user profile
 */
export const getMethodologyRecommendation = (profile: UserProfile): RecommendationResult => {
  const reasoning: string[] = [];
  const alternatives: Array<{ methodology: string; reason: string }> = [];
  let recommendedMethodology: 'standard' | 'hanafi' | 'shafi' | 'custom' = 'standard';
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  // Factor 1: User explicitly follows a madhab
  if (profile.followsMadhab && profile.followsMadhab !== 'none') {
    const methodologyFromMadhab = MADHAB_TO_METHODOLOGY[profile.followsMadhab];
    
    if (methodologyFromMadhab === 'hanafi') {
      recommendedMethodology = 'hanafi';
      confidence = 'high';
      reasoning.push(`You indicated you follow the Hanafi school of jurisprudence. The Hanafi methodology uses a silver-based nisab, which is more inclusive and benefits more people in need.`);
    } else if (methodologyFromMadhab === 'shafi') {
      recommendedMethodology = 'shafi';
      confidence = 'high';
      reasoning.push(`You indicated you follow the Shafi'i school of jurisprudence. The Shafi'i methodology provides detailed categorization with specific rules for different asset types.`);
    } else {
      recommendedMethodology = 'standard';
      confidence = 'high';
      reasoning.push(`The Standard (AAOIFI) methodology aligns well with ${profile.followsMadhab === 'maliki' ? 'Maliki' : 'Hanbali'} principles and is widely accepted for modern financial instruments.`);
    }
  }
  // Factor 2: Regional tradition
  else if (profile.country) {
    const countryKey = profile.country.toLowerCase().replace(/\s+/g, '-');
    const regionalPreferences = REGIONAL_PREFERENCES[countryKey];
    
    if (regionalPreferences && regionalPreferences.length > 0) {
      const primaryPreference = regionalPreferences[0];
      
      if (primaryPreference === 'hanafi') {
        recommendedMethodology = 'hanafi';
        confidence = 'high';
        reasoning.push(`Based on your region (${profile.country}), the Hanafi methodology is most commonly followed by scholars and communities in your area.`);
        
        if (regionalPreferences.length > 1) {
          alternatives.push({
            methodology: regionalPreferences[1],
            reason: 'Also common in your region'
          });
        }
      } else if (primaryPreference === 'shafi') {
        recommendedMethodology = 'shafi';
        confidence = 'high';
        reasoning.push(`Based on your region (${profile.country}), the Shafi'i methodology is most commonly followed by scholars and communities in your area.`);
        
        if (regionalPreferences.length > 1) {
          alternatives.push({
            methodology: regionalPreferences[1],
            reason: 'Also accepted in your region'
          });
        }
      } else {
        recommendedMethodology = 'standard';
        confidence = 'high';
        reasoning.push(`The Standard (AAOIFI) methodology is widely accepted in your region (${profile.country}) and works well with modern financial instruments.`);
      }
    } else {
      // Unknown region - default to standard
      recommendedMethodology = 'standard';
      confidence = 'medium';
      reasoning.push(`For your region, we recommend the Standard (AAOIFI) methodology, which is the most widely accepted contemporary approach.`);
    }
  }
  // Factor 3: User preference for conservative approach
  else if (profile.wantsHigherZakat || profile.preferredApproach === 'conservative') {
    recommendedMethodology = 'hanafi';
    confidence = 'medium';
    reasoning.push(`You prefer a more conservative approach. The Hanafi methodology uses a silver-based nisab (lower threshold), resulting in more wealth being subject to Zakat and greater benefit to those in need.`);
    
    alternatives.push({
      methodology: 'custom',
      reason: 'Set custom rates higher than 2.5% if your scholar advises it'
    });
  }
  // Factor 4: Complex modern assets
  else if (profile.hasComplexAssets || profile.assetTypes?.some(type => 
    ['cryptocurrency', 'stocks', 'investment', 'business'].includes(type)
  )) {
    recommendedMethodology = 'standard';
    confidence = 'high';
    reasoning.push(`You have modern financial instruments. The Standard (AAOIFI) methodology provides clear, contemporary guidelines for stocks, cryptocurrency, and investment accounts.`);
    
    alternatives.push({
      methodology: 'shafi',
      reason: 'If you prefer detailed categorization of different asset types'
    });
  }
  // Default: Standard methodology
  else {
    recommendedMethodology = 'standard';
    confidence = 'medium';
    reasoning.push(`The Standard (AAOIFI) methodology is the most widely accepted contemporary approach, suitable for most Muslims worldwide.`);
    
    alternatives.push({
      methodology: 'hanafi',
      reason: 'If you want to maximize benefit to the poor (lower nisab threshold)'
    });
    
    alternatives.push({
      methodology: 'shafi',
      reason: 'If you follow Shafi\'i jurisprudence tradition'
    });
  }

  // Add general guidance
  reasoning.push(`Remember: You can always consult with local Islamic scholars for specific guidance on your situation.`);

  return {
    recommendedMethodology,
    confidence,
    reasoning,
    alternatives
  };
};

/**
 * Get quiz questions to help determine appropriate methodology
 */
export const getRecommendationQuizQuestions = () => {
  return [
    {
      id: 'madhab',
      question: 'Do you follow a specific school of Islamic jurisprudence (madhab)?',
      type: 'single-choice' as const,
      options: [
        { value: 'hanafi', label: 'Hanafi' },
        { value: 'shafi', label: 'Shafi\'i' },
        { value: 'maliki', label: 'Maliki' },
        { value: 'hanbali', label: 'Hanbali' },
        { value: 'none', label: 'No specific madhab / Not sure' }
      ]
    },
    {
      id: 'region',
      question: 'Where are you located?',
      type: 'single-choice' as const,
      options: [
        { value: 'middle-east', label: 'Middle East' },
        { value: 'south-asia', label: 'South Asia (Pakistan, India, Bangladesh)' },
        { value: 'southeast-asia', label: 'Southeast Asia (Indonesia, Malaysia, etc.)' },
        { value: 'north-africa', label: 'North Africa' },
        { value: 'europe-americas', label: 'Europe or Americas' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'assets',
      question: 'What types of wealth do you own? (Select all that apply)',
      type: 'multiple-choice' as const,
      options: [
        { value: 'cash', label: 'Cash and savings' },
        { value: 'gold', label: 'Gold and jewelry' },
        { value: 'stocks', label: 'Stocks and shares' },
        { value: 'crypto', label: 'Cryptocurrency' },
        { value: 'business', label: 'Business inventory' },
        { value: 'property', label: 'Investment property' }
      ]
    },
    {
      id: 'approach',
      question: 'What approach do you prefer for Zakat calculation?',
      type: 'single-choice' as const,
      options: [
        { value: 'conservative', label: 'Conservative (I prefer to give more to be safe)' },
        { value: 'standard', label: 'Standard (Follow the most common approach)' },
        { value: 'permissive', label: 'Permissive (I prefer minimum obligatory amount)' }
      ]
    }
  ];
};

/**
 * Process quiz answers to generate recommendation
 */
export const processQuizAnswers = (answers: Record<string, string | string[]>): RecommendationResult => {
  const profile: UserProfile = {
    followsMadhab: (answers.madhab as any) || 'none',
    region: answers.region as string,
    assetTypes: Array.isArray(answers.assets) ? answers.assets : [answers.assets as string],
    preferredApproach: (answers.approach as any) || 'standard',
    hasComplexAssets: Array.isArray(answers.assets) && 
      answers.assets.some(a => ['crypto', 'stocks', 'business'].includes(a)),
    wantsHigherZakat: answers.approach === 'conservative'
  };

  return getMethodologyRecommendation(profile);
};

/**
 * Get regional methodology distribution statistics
 */
export const getRegionalStatistics = (region: string) => {
  const stats: Record<string, { primary: string; secondary?: string; percentage: number }> = {
    'middle-east': {
      primary: 'standard',
      secondary: 'hanafi',
      percentage: 65
    },
    'south-asia': {
      primary: 'hanafi',
      secondary: 'standard',
      percentage: 85
    },
    'southeast-asia': {
      primary: 'shafi',
      secondary: 'standard',
      percentage: 80
    },
    'north-africa': {
      primary: 'maliki',
      secondary: 'standard',
      percentage: 75
    },
    'europe-americas': {
      primary: 'standard',
      percentage: 70
    }
  };

  return stats[region] || { primary: 'standard', percentage: 50 };
};
