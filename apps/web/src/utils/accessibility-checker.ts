import { run } from 'axe-core';

export interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

export const runAccessibilityCheck = async (): Promise<{
  violations: AccessibilityIssue[];
  passes: number;
  incomplete: number;
}> => {
  try {
    const results = await run();
    
    return {
      violations: results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => {
          let target: string[] = [];
          if (Array.isArray((node as any).target)) {
            target = (node as any).target.flat().filter((t: any) => typeof t === 'string');
          } else if (typeof (node as any).target === 'string') {
            target = [(node as any).target];
          }
          return {
            html: node.html,
            target,
          };
        }),
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.length,
    };
  } catch (error) {
    console.error('Accessibility check failed:', error);
    throw error;
  }
};

export const logAccessibilityIssues = (violations: AccessibilityIssue[]) => {
  if (violations.length === 0) {
    console.log('%c✓ No accessibility issues found!', 'color: green; font-weight: bold;');
    return;
  }

  console.group('%c⚠️ Accessibility Issues Found', 'color: orange; font-weight: bold;');
  
  violations.forEach(violation => {
    const color = {
      minor: 'blue',
      moderate: 'orange',
      serious: 'red',
      critical: 'darkred',
    }[violation.impact];
    
    console.group(`%c[${violation.impact.toUpperCase()}] ${violation.help}`, `color: ${color}; font-weight: bold;`);
    console.log('Description:', violation.description);
    console.log('Help URL:', violation.helpUrl);
    console.log('Affected elements:', violation.nodes.length);
    
    violation.nodes.forEach((node, index) => {
      console.log(`Element ${index + 1}:`, node.html);
      console.log('Selector:', node.target.join(' > '));
    });
    
    console.groupEnd();
  });
  
  console.groupEnd();
};
