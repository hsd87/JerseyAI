import { generateConfigFiles } from '../utils/config-parser';

// Run the config generator
async function main() {
  console.log('Generating configuration files...');
  const success = await generateConfigFiles();
  
  if (success) {
    console.log('Configuration files generated successfully!');
  } else {
    console.error('Failed to generate configuration files.');
    process.exit(1);
  }
}

// Execute the main function
main().catch(err => {
  console.error('Error generating configuration files:', err);
  process.exit(1);
});