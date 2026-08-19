document.addEventListener('DOMContentLoaded', () => {
  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     NAVBAR SCROLL BEHAVIOR
     ========================================================================== */
  const navbar = document.querySelector('.custom-nav');
  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  // Initial check in case page is loaded scrolled down
  handleScroll();

  /* ==========================================================================
     ACTIVE NAVIGATION HIGHLIGHTING (INTERSECTION OBSERVER)
     ========================================================================== */
  const sections = document.querySelectorAll('section, header');
  const navLinks = document.querySelectorAll('.custom-nav .nav-link');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -60% 0px', // Trigger when section is in middle of viewport
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => {
      if (section.getAttribute('id')) {
        sectionObserver.observe(section);
      }
    });
  }

  /* ==========================================================================
     AOS INITIALIZATION
     ========================================================================== */
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: false,
    offset: 100,
    disable: prefersReducedMotion // Respect reduced motion preference
  });

  /* ==========================================================================
     COLLAPSE MOBILE NAVBAR ON NAV LINK CLICK
     ========================================================================== */
  const navbarCollapse = document.getElementById('navbarNav');
  const bsCollapse = navbarCollapse ? bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false }) : null;
  const navItems = document.querySelectorAll('.custom-nav .nav-link, .custom-nav .btn-custom');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      if (navbarCollapse && navbarCollapse.classList.contains('show') && bsCollapse) {
        bsCollapse.hide();
      }
    });
  });

  /* ==========================================================================
     CONTACT FORM VALIDATION
     ========================================================================== */
  const contactForm = document.getElementById('contactForm');
  const successMessage = document.getElementById('formSuccessMessage');

  if (contactForm) {
    const inputs = {
      name: {
        el: document.getElementById('contactName'),
        validate: (val) => val.trim().length > 0,
        errorMsg: 'Please enter your name.'
      },
      email: {
        el: document.getElementById('contactEmail'),
        validate: (val) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(val.trim());
        },
        errorMsg: 'Please enter a valid email address.'
      },
      projectType: {
        el: document.getElementById('contactProjectType'),
        validate: (val) => val !== '' && val !== null,
        errorMsg: 'Please select a project type.'
      },
      message: {
        el: document.getElementById('contactMessage'),
        validate: (val) => val.trim().length >= 10,
        errorMsg: 'Please write a message (at least 10 characters).'
      }
    };

    // Helper to validate a specific group
    const validateField = (fieldKey) => {
      const field = inputs[fieldKey];
      const group = field.el.closest('.form-group-custom');
      const val = field.el.value;
      const isValid = field.validate(val);

      if (!isValid) {
        group.classList.add('invalid');
        field.el.setAttribute('aria-invalid', 'true');
      } else {
        group.classList.remove('invalid');
        field.el.removeAttribute('aria-invalid');
      }
      return isValid;
    };

    // Attach real-time validation listeners on blur and input change
    Object.keys(inputs).forEach((key) => {
      const field = inputs[key];
      field.el.addEventListener('blur', () => validateField(key));
      field.el.addEventListener('input', () => {
        // Only clear the error if it was already marked as invalid
        const group = field.el.closest('.form-group-custom');
        if (group.classList.contains('invalid') && field.validate(field.el.value)) {
          group.classList.remove('invalid');
          field.el.removeAttribute('aria-invalid');
        }
      });
    });

    // Form submit listener
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent standard page redirect submission

      let formIsValid = true;
      Object.keys(inputs).forEach((key) => {
        const isFieldValid = validateField(key);
        if (!isFieldValid) {
          formIsValid = false;
        }
      });

      if (!formIsValid) {
        // Focus the first invalid field for accessibility
        const firstInvalidKey = Object.keys(inputs).find((key) => !inputs[key].validate(inputs[key].el.value));
        if (firstInvalidKey) {
          inputs[firstInvalidKey].el.focus();
        }
        
        const liveRegion = document.getElementById('formLiveRegion');
        if (liveRegion) {
          liveRegion.textContent = 'Please correct the highlighted errors in the form before submitting.';
        }
      } else {
        // Form is valid! Perform AJAX submission to Formspree
        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerHTML;
        
        // Update button status
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
        
        // Prepare FormData
        const formData = new FormData(contactForm);

        fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        })
        .then(response => {
          if (response.ok) {
            // Show Success Message
            if (successMessage) {
              successMessage.style.display = 'block';
              successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            // Reset the form values
            contactForm.reset();
            
            // Remove any leftover validation highlights
            Object.keys(inputs).forEach((key) => {
              const group = inputs[key].el.closest('.form-group-custom');
              group.classList.remove('invalid');
              inputs[key].el.removeAttribute('aria-invalid');
            });
            
            // Screen reader announcement
            const liveRegion = document.getElementById('formLiveRegion');
            if (liveRegion) {
              liveRegion.textContent = 'Thank you! Your message has been sent successfully.';
            }
            
            // Auto hide success banner after 8 seconds
            setTimeout(() => {
              if (successMessage) successMessage.style.display = 'none';
            }, 8000);
          } else {
            alert('There was a problem submitting your message. Please verify your form action endpoint or try again later.');
          }
        })
        .catch(error => {
          alert('Network connection error. Please try again.');
        })
        .finally(() => {
          // Restore button
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        });
      }
    });
  }

  /* ==========================================================================
     MODAL ACCESSIBILITY (FOCUS MANAGEMENT)
     ========================================================================== */
  const modalElList = document.querySelectorAll('.modal');
  modalElList.forEach((modalEl) => {
    let lastTriggerButton = null;

    modalEl.addEventListener('show.bs.modal', (e) => {
      // Keep track of what button opened the modal
      lastTriggerButton = e.relatedTarget;
    });

    modalEl.addEventListener('shown.bs.modal', () => {
      // Focus close button inside the modal for accessibility
      const closeBtn = modalEl.querySelector('.modal-close-btn');
      if (closeBtn) closeBtn.focus();
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      // Focus back to the trigger button when modal is closed
      if (lastTriggerButton) {
        lastTriggerButton.focus();
      }
    });
  });
});
