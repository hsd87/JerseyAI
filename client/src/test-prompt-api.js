// Test utility script for API calls
// Run this from the browser console or use with a button on a test page

async function testGenerateImage() {
  try {
    console.log('Testing /api/generate-image endpoint...');
    
    // Example request data
    const requestData = {
      sport: "soccer",
      kitType: "jersey+shorts",
      primaryColor: "#0062ff", // Blue
      secondaryColor: "#ffffff", // White
      sleeveStyle: "short-sleeved",
      collarType: "crew",
      patternStyle: "geometric",
      designNotes: "A modern, sleek kit with dynamic geometric patterns. The design should feel technical and forward-looking."
    };
    
    console.log('Request payload:', requestData);
    
    // Make the API call
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API response:', data);
    
    // Display the image
    if (data.imageUrl) {
      console.log('Generated image URL:', data.imageUrl);
      
      // Create a preview (if running in a browser context)
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.zIndex = '9999';
        container.style.background = 'white';
        container.style.padding = '10px';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        
        const heading = document.createElement('h3');
        heading.textContent = 'Generated Image';
        
        const image = document.createElement('img');
        image.src = data.imageUrl;
        image.style.maxWidth = '300px';
        image.style.display = 'block';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.marginTop = '10px';
        closeBtn.onclick = () => document.body.removeChild(container);
        
        container.appendChild(heading);
        container.appendChild(image);
        container.appendChild(closeBtn);
        document.body.appendChild(container);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error testing image generation:', error);
  }
}

// Export the test function
window.testGenerateImage = testGenerateImage;

console.log('Test utility loaded. Call testGenerateImage() to test the image generation API.');