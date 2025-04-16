import { Express, Request, Response } from 'express';
import { 
  sports, 
  kitTypes, 
  schemas, 
  pricing, 
  calculatePricing 
} from '../utils/config-parser';
import { generateConfigs } from '../scripts/generate-configs';

// Initialize configurations
let configsGenerated = false;

export function initializeConfigs() {
  if (!configsGenerated) {
    configsGenerated = generateConfigs();
  }
  return configsGenerated;
}

export function registerKitConfigRoutes(app: Express) {
  // Initialize configurations
  initializeConfigs();

  // Get all available sports
  app.get('/api/kit-config/sports', (req: Request, res: Response) => {
    res.json(sports);
  });

  // Get kit types for a sport
  app.get('/api/kit-config/kit-types/:sport', (req: Request, res: Response) => {
    const sportName = req.params.sport?.toLowerCase();
    if (!sportName || !kitTypes[sportName]) {
      return res.status(404).json({ error: 'Sport not found' });
    }
    res.json(kitTypes[sportName]);
  });

  // Get schema for a sport and kit type
  app.get('/api/kit-config/schema/:sport/:kitType', (req: Request, res: Response) => {
    const sportName = req.params.sport?.toLowerCase();
    const kitTypeName = req.params.kitType;
    
    if (!sportName || !kitTypeName || !schemas[sportName] || !schemas[sportName][kitTypeName]) {
      return res.status(404).json({ error: 'Schema not found' });
    }
    
    res.json(schemas[sportName][kitTypeName]);
  });

  // Calculate pricing for a configuration
  app.post('/api/kit-config/configure', (req: Request, res: Response) => {
    const config = req.body;
    
    if (!config || !config.sport || !config.kitType) {
      return res.status(400).json({ error: 'Invalid configuration' });
    }
    
    const result = calculatePricing({
      sports,
      kitTypes,
      schemas,
      pricing
    }, config);
    
    res.json(result);
  });

  // Regenerate configurations (admin only)
  app.post('/api/kit-config/regenerate', (req: Request, res: Response) => {
    // Check if the user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const success = generateConfigs();
    
    if (success) {
      res.json({ message: 'Configuration files generated successfully!' });
    } else {
      res.status(500).json({ error: 'Failed to generate configuration files' });
    }
  });

  console.log('Kit configuration routes registered successfully');
}