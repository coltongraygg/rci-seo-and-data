// Initialize Google Analytics Data Layer
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());

// Configure GA4 with Measurement ID
gtag('config', 'G-ETKD6SCTWP', {
  // When testing, set debug_mode to true and inside the RCI Google Analytics property go to Admin, Property Settings, Data Display, DebugView
  // In the top left corner of this view underneath the search bar is a "Debug Device #" with a dropdown
  // This is the list of current devices on the site - there's a way to filter out all devices except yours...just not sure how to do it :p 
  // So I usually just go through clicking pages and searching for the events I made (ex: clicking home page then a specific service then about page and seeing if that debug device shows the same data)
  // debug_mode: true,
  page_path: window.location.pathname,
  page_title: document.title,
  page_location: window.location.href
});

// Track page views explicitly (GA4 automatic page_view tracking can be unreliable)
gtag('event', 'page_view', {
  page_title: document.title,
  page_location: window.location.href,
  page_path: window.location.pathname
});



/** ----------- FORM SUBMISSION TRACKING WITH DEBUGGING ----------- */
// console.log('🚀 GA4 Form Tracking: Script loaded');

// Prevent duplicate initialization
if (window._ga4FormTrackingInitialized) {
  // console.log('⚠️ GA4 Form Tracking: Already initialized, skipping duplicate setup');
} else {
  window._ga4FormTrackingInitialized = true;

  // // Debug helper function
  // function debugLog(message, data = null) {
  //   const timestamp = new Date().toISOString();
  //   if (data) {
  //     console.log(`[GA4 Debug ${timestamp}] ${message}`, data);
  //   } else {
  //     console.log(`[GA4 Debug ${timestamp}] ${message}`);
  //   }
  // }

  // Track which forms have already sent events to prevent duplicates
  const formSubmissionTracker = new Map();

  // Wait for DOM to be ready
  function initFormTracking() {
  // debugLog('Initializing form tracking...');
  
  // Find all forms on the page
  const forms = document.querySelectorAll('form');
  // debugLog(`Found ${forms.length} forms on the page`);
  
  forms.forEach((form, index) => {
    const formKey = form.id || `form_${index}`;
    
    // debugLog(`Form ${index}:`, {
    //   id: form.id,
    //   className: form.className,
    //   action: form.action,
    //   method: form.method,
    //   fields: form.elements.length
    // });
    
    // Check if this form already has a visible success message (Webflow quirk)
    const existingSuccessElements = [
      ...form.querySelectorAll('.w-form-done'),
      ...form.parentElement?.querySelectorAll('.w-form-done') || []
    ];
    
    const hasVisibleSuccess = existingSuccessElements.some(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    
    // if (hasVisibleSuccess) {
    //   debugLog(`⚠️ Form ${index} has pre-existing visible success state, requiring user interaction for tracking`);
    // }
    
    // Method 1: Traditional submit event listener
    form.addEventListener('submit', function(e) {
      // Check if we've already tracked this submission
      const now = Date.now();
      const lastSubmission = formSubmissionTracker.get(formKey + '_submit');
      if (lastSubmission && (now - lastSubmission) < 1000) {
        // debugLog('Duplicate form submit event detected, skipping');
        return;
      }
      formSubmissionTracker.set(formKey + '_submit', now);
      
      // debugLog(`Form submit event fired for form ${index}`, {
      //   formId: form.id,
      //   formClass: form.className,
      //   submittedAt: new Date().toISOString()
      // });
      
      // Track the submission - may grab values in the future...
      gtag('event', 'form_submit', {
        event_category: 'engagement',
        event_label: form.id || `form_${index}`,
        form_id: form.id || `form_${index}`,
        form_destination: form.action,
        page_path: window.location.pathname
      });
      
      // debugLog('GA4 form_submit event sent');
    });
    
    // Method 2: Webflow success state detection
    // Webflow adds classes like 'w-form-done' or changes display styles
    // Track if we've seen a user interaction with this form
    let hasUserInteracted = false;
    let formSubmittedViaButton = false;
    
    // Mark form as interacted when user clicks or submits
    form.addEventListener('click', () => { hasUserInteracted = true; });
    form.addEventListener('focusin', () => { hasUserInteracted = true; });
    form.addEventListener('submit', () => { formSubmittedViaButton = true; });
    
    // For forms with pre-existing success states, require actual submission
    const requiresActualSubmission = hasVisibleSuccess;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // For problematic forms, only track if form was actually submitted
        if (requiresActualSubmission && !formSubmittedViaButton) {
          // debugLog(`❌ Blocking success tracking for form ${index} - requires actual submission but none detected`);
          return;
        }
        
        // For normal forms, require user interaction
        if (!requiresActualSubmission && !hasUserInteracted) {
          // debugLog(`❌ Blocking success tracking for form ${index} - no user interaction detected`);
          return;
        }
        
        if (mutation.type === 'attributes' || mutation.type === 'childList') {
          // Check for Webflow success indicators
          const target = mutation.target;
          const isSuccessElement = target.classList.contains('w-form-done') || 
                                  target.classList.contains('success-message') ||
                                  target.classList.contains('w-form-success');
          
          // Check if this is a new success state (not pre-existing)
          const isNewlyVisible = (mutation.type === 'attributes' && 
                                 mutation.attributeName === 'style' && 
                                 target.style.display === 'block') ||
                                (mutation.type === 'attributes' && 
                                 mutation.attributeName === 'class' && 
                                 isSuccessElement);
          
          if (isSuccessElement && isNewlyVisible) {
            // Check if we've already tracked this success
            const now = Date.now();
            const lastSuccess = formSubmissionTracker.get(formKey + '_success');
            if (lastSuccess && (now - lastSuccess) < 2000) {
              // debugLog('Duplicate form success event detected, skipping');
              return;
            }
            formSubmissionTracker.set(formKey + '_success', now);
            
            // debugLog('✅ Webflow form success detected!', {
            //   element: target,
            //   classes: target.className,
            //   formIndex: index,
            //   formId: form.id,
            //   mutationType: mutation.type,
            //   attributeName: mutation.attributeName,
            //   hadPreExistingSuccess: requiresActualSubmission,
            //   wasActuallySubmitted: formSubmittedViaButton
            // });
            
            // Track successful submission - again may grab values in the future...
            gtag('event', 'form_submit_success', {
              event_category: 'engagement',
              event_label: form.id || `form_${index}`,
              form_id: form.id || `form_${index}`,
              page_path: window.location.pathname,
              method: 'webflow_success_detection'
            });
            
            // debugLog(`📤 GA4 form_submit_success event sent for: ${form.id || `form_${index}`}`);
          }
        }
      });
    });
    
    // Observe the form and its parent for changes
    observer.observe(form, { attributes: true, childList: true, subtree: true });
    if (form.parentElement) {
      observer.observe(form.parentElement, { attributes: true, childList: true, subtree: true });
    }
    
    // Method 3: Input field monitoring for form completion
    const submitButtons = form.querySelectorAll('input[type="submit"], button[type="submit"], button:not([type])');
    // debugLog(`Found ${submitButtons.length} submit buttons in form ${index}`);
    
    submitButtons.forEach((button, btnIndex) => {
      button.addEventListener('click', function(e) {
        // Only log if this is actually a form submission attempt
        // if (e.target.closest('form') === form) {
        //   debugLog(`Submit button clicked in form ${index}`, {
        //     buttonText: button.textContent || button.value,
        //     buttonIndex: btnIndex,
        //     formId: form.id
        //   });
          
          // Check if form is valid before tracking
          if (form.checkValidity && form.checkValidity()) {
            // debugLog('Form is valid, tracking click as potential submission');
            
            gtag('event', 'form_submit_attempt', {
              event_category: 'engagement',
              event_label: form.id || `form_${index}`,
              form_id: form.id || `form_${index}`,
              button_text: button.textContent || button.value,
              page_path: window.location.pathname
            });
          } else {
            // debugLog('Form validation failed, not tracking as submission');
          }
        }
      });
    });
  });
  
  // Method 4: AJAX request interception for Webflow forms
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, config] = args;
    
    // Check if this might be a form submission
    if (config && config.method && config.method.toUpperCase() === 'POST') {
      // debugLog('POST request detected', {
      //   url: url,
      //   method: config.method,
      //   headers: config.headers
      // });
      
      // Check if it's likely a Webflow form submission
      if (url.includes('webflow.com') || url.includes('submit') || url.includes('form')) {
        // debugLog('Likely form submission detected via fetch');
        
        gtag('event', 'form_submit_ajax', {
          event_category: 'engagement',
          event_label: 'ajax_form',
          form_destination: url,
          page_path: window.location.pathname
        });
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  // debugLog('Form tracking initialization complete');
  
  // Summary of form protection
  // debugLog('📊 Form Tracking Summary:');
  // debugLog(`- Total forms found: ${forms.length}`);
  // debugLog(`- Forms with pre-existing success states will require actual submission`);
  // debugLog(`- All form submissions will be logged before sending to GA4`);
  // debugLog('✅ Only real user form submissions will be tracked');
  // }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormTracking);
  } else {
    // DOM is already ready
    initFormTracking();
  }

  // Also try to reinitialize after a delay in case Webflow adds forms dynamically
  setTimeout(initFormTracking, 2000);

  // debugLog('Form tracking script setup complete');
} // End of initialization check




// Track time on page
// Captures total time spent on page when user navigates away or closes tab
// Sends timing_complete event with duration in seconds
let startTime = Date.now();
window.addEventListener('beforeunload', function () {
  const timeOnPage = Math.round((Date.now() - startTime) / 1000);
  gtag('event', 'timing_complete', {
    name: 'page_load_time',
    value: timeOnPage
  });
});




// Track scroll depth
// Monitors user scroll progress and fires events at 25%, 50%, 75%, and 100% milestones
// GA4 automatically tracks scroll depth at 90%, so this is just extra tracking
// GA4 best practice: use 'scroll' event with percent_scrolled parameter
// Only tracks each milestone once per page view to avoid duplicate events
let maxScroll = 0;
window.addEventListener('scroll', function () {
  const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
  if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
    maxScroll = scrollPercent;
    gtag('event', 'scroll', {
      event_category: 'engagement',
      event_label: `${scrollPercent}%`,
      value: scrollPercent,
      percent_scrolled: scrollPercent
    });
  }
});