// Test script to validate type conversions for Replicate API parameters

// Test extra_lora type validation
function testExtraLoraType(input) {
  console.log(`\nTesting extra_lora conversion: ${input} (type: ${typeof input})`);
  
  // Server-side validation
  if (typeof input !== 'string') {
    console.log(`Server conversion: Converting extra_lora from ${typeof input} to string`);
    input = String(input);
  }
  
  console.log(`Result: ${input} (type: ${typeof input})`);
  return input;
}

// Test extra_lora_scale type validation
function testExtraLoraScaleType(input) {
  console.log(`\nTesting extra_lora_scale conversion: ${input} (type: ${typeof input})`);
  
  // Server-side validation
  if (typeof input !== 'number') {
    console.log(`Server conversion: Converting extra_lora_scale from ${typeof input} to number`);
    input = Number(input) || 0.69; // Use default if conversion fails
  }
  
  console.log(`Result: ${input} (type: ${typeof input})`);
  return input;
}

// Test various input types
console.log("TESTING EXTRA_LORA CONVERSIONS:");
testExtraLoraType("already-a-string");
testExtraLoraType(123);
testExtraLoraType(null);
testExtraLoraType(undefined);
testExtraLoraType(true);

console.log("\nTESTING EXTRA_LORA_SCALE CONVERSIONS:");
testExtraLoraScaleType(0.75); 
testExtraLoraScaleType("0.5");
testExtraLoraScaleType("invalid");
testExtraLoraScaleType(null);
testExtraLoraScaleType(undefined);
testExtraLoraScaleType(true);

console.log("\nAll tests completed");
