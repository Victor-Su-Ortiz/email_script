document.addEventListener('DOMContentLoaded', function() {
    // Active navigation links
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (currentPath === href || (href !== '/' && currentPath.startsWith(href))) {
        link.classList.add('active');
      }
    });
  
    // File upload enhancement
    const fileInput = document.getElementById('recipients');
    if (fileInput) {
      const fileLabel = fileInput.nextElementSibling;
      
      fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
          const fileName = this.files[0].name;
          fileLabel.textContent = fileName;
        } else {
          fileLabel.textContent = 'Choose file';
        }
      });
    }
  
    // Drag and drop file upload
    const uploadZone = document.querySelector('.upload-zone');
    if (uploadZone) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
      });
  
      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }
  
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, highlight, false);
      });
  
      ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, unhighlight, false);
      });
  
      function highlight() {
        uploadZone.classList.add('dragover');
      }
  
      function unhighlight() {
        uploadZone.classList.remove('dragover');
      }
  
      uploadZone.addEventListener('drop', handleDrop, false);
  
      function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && fileInput) {
          fileInput.files = files;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }
      }
    }
  
    // Form submission with loading state
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', function() {
        const submitButtons = this.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(button => {
          button.classList.add('btn-loading', 'loading');
          button.disabled = true;
          
          // Add spinner if not already present
          if (!button.querySelector('.spinner-border')) {
            const spinner = document.createElement('span');
            spinner.className = 'spinner-border spinner-border-sm';
            spinner.setAttribute('role', 'status');
            spinner.setAttribute('aria-hidden', 'true');
            button.appendChild(spinner);
          }
        });
      });
    });
  
    // Email template textarea auto-save
    const templateContent = document.getElementById('content');
    const templateSubject = document.getElementById('subject');
    
    if (templateContent && templateSubject) {
      // Auto-save every 30 seconds
      setInterval(() => {
        if (templateContent.value && templateSubject.value) {
          localStorage.setItem('emailTemplate', JSON.stringify({
            subject: templateSubject.value,
            content: templateContent.value,
            timestamp: new Date().toISOString()
          }));
        }
      }, 30000);
      
      // Check for saved template
      const savedTemplate = localStorage.getItem('emailTemplate');
      if (savedTemplate && (!templateContent.value || !templateSubject.value)) {
        try {
          const template = JSON.parse(savedTemplate);
          const savedTime = new Date(template.timestamp);
          const now = new Date();
          const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
          
          // Only restore if saved within the last 24 hours
          if (hoursDiff < 24) {
            if (confirm('Restore your previous draft email template?')) {
              templateSubject.value = template.subject;
              templateContent.value = template.content;
            } else {
              localStorage.removeItem('emailTemplate');
            }
          } else {
            localStorage.removeItem('emailTemplate');
          }
        } catch (e) {
          console.error('Error parsing saved template:', e);
          localStorage.removeItem('emailTemplate');
        }
      }
    }
  
    // Preview template with dynamic placeholders
    const previewButton = document.getElementById('previewButton');
    const previewModal = document.getElementById('previewModal');
    
    if (previewButton && previewModal) {
      previewButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const subject = templateSubject.value || 'Subject with [placeholder]';
        const content = templateContent.value || 'Content with [placeholder]';
        
        const previewSubject = document.getElementById('previewSubject');
        const previewContent = document.getElementById('previewContent');
        
        if (previewSubject && previewContent) {
          previewSubject.textContent = subject;
          
          // Convert markdown and highlight placeholders
          let formattedContent = content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]/g, '<span class="placeholder">[$1]</span>');
            
          previewContent.innerHTML = formattedContent;
        }
      });
    }
  
    // Tooltips initialization
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  });