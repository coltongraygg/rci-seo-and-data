// Form Diagnostic Script - Run this in browser console to find forms with issues
console.log('🔍 Running Webflow Form Diagnostic...\n');

// Find all forms
const forms = document.querySelectorAll('form');
console.log(`Found ${forms.length} forms on this page:\n`);

forms.forEach((form, index) => {
  console.log(`\n========== FORM ${index} ==========`);
  console.log(`ID: ${form.id || 'No ID'}`);
  console.log(`Classes: ${form.className || 'No classes'}`);
  console.log(`Action: ${form.action || 'No action'}`);
  
  // Check for success messages within or near the form
  const successIndicators = [
    ...form.querySelectorAll('.w-form-done'),
    ...form.querySelectorAll('.success-message'),
    ...form.querySelectorAll('.w-form-success')
  ];
  
  // Also check the form's parent and siblings
  if (form.parentElement) {
    successIndicators.push(
      ...form.parentElement.querySelectorAll('.w-form-done'),
      ...form.parentElement.querySelectorAll('.success-message'),
      ...form.parentElement.querySelectorAll('.w-form-success')
    );
  }
  
  if (successIndicators.length > 0) {
    console.log(`⚠️  ISSUE FOUND: This form has ${successIndicators.length} success indicator(s)!`);
    
    successIndicators.forEach((element, i) => {
      console.log(`\n  Success Element ${i + 1}:`);
      console.log(`  - Tag: ${element.tagName}`);
      console.log(`  - Classes: ${element.className}`);
      console.log(`  - Display: ${window.getComputedStyle(element).display}`);
      console.log(`  - Visibility: ${window.getComputedStyle(element).visibility}`);
      console.log(`  - Opacity: ${window.getComputedStyle(element).opacity}`);
      console.log(`  - Text: "${element.textContent.trim().substring(0, 50)}..."`);
      
      // Check if it's visible
      const isVisible = window.getComputedStyle(element).display !== 'none' && 
                       window.getComputedStyle(element).visibility !== 'hidden' &&
                       window.getComputedStyle(element).opacity !== '0';
      
      if (isVisible) {
        console.log(`  ❌ This success message is VISIBLE on page load!`);
      } else {
        console.log(`  ✅ This success message is hidden`);
      }
    });
  } else {
    console.log('✅ No success indicators found for this form');
  }
  
  // Check form fields
  const fields = form.querySelectorAll('input, textarea, select');
  console.log(`\nForm has ${fields.length} input fields`);
  
  // Check for Webflow form wrapper
  const formWrapper = form.closest('.w-form');
  if (formWrapper) {
    console.log('\nWebflow form wrapper found');
    // Check all children of the wrapper
    const allChildren = formWrapper.querySelectorAll('*');
    const doneElements = Array.from(allChildren).filter(el => 
      el.className.includes('done') || 
      el.className.includes('success') ||
      el.style.display === 'block'
    );
    if (doneElements.length > 0) {
      console.log(`Found ${doneElements.length} elements with 'done' or 'success' in wrapper`);
    }
  }
});

console.log('\n\n🔍 Diagnostic complete!');
console.log('\nTo fix forms with visible success messages in Webflow:');
console.log('1. Go to Webflow Designer');
console.log('2. Find the form with the issue (check the ID/classes above)');
console.log('3. Look for the success message element');
console.log('4. Make sure it has "Display: None" set as default');
console.log('5. Publish your changes');