export type RoadmapTemplate = { name: string; category: string; description: string; nodes: string[] }

export const roadmapTemplates: RoadmapTemplate[] = [
  { name: 'Backend development', category: 'Engineering', description: 'Build reliable APIs and services from fundamentals to deployment.', nodes: ['HTTP & networking', 'Linux & shell', 'Databases', 'API design', 'Authentication', 'Testing & observability', 'Deployment'] },
  { name: 'Machine learning', category: 'Engineering', description: 'Move from mathematical foundations to production model deployment.', nodes: ['Python foundations', 'Linear algebra', 'Statistics', 'Data cleaning', 'Classical machine learning', 'Neural networks', 'Model deployment'] },
  { name: 'Product launch', category: 'Product', description: 'Turn a validated problem into a measured, iterative launch.', nodes: ['User research', 'Problem definition', 'Prototype', 'Validation', 'Build', 'Launch plan', 'Measure & iterate'] },
]
