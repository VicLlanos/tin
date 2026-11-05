/* Justine Nagrampa — CAD Portfolio Interactions */

document.addEventListener('DOMContentLoaded', () => {
  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => revealObserver.observe(el));

  // Gallery filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      projectCards.forEach(card => {
        const category = card.dataset.category;
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Upload zone (static demo)
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const uploadPreview = document.getElementById('uploadPreview');

  browseBtn?.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone?.addEventListener(eventName, () => uploadZone.classList.add('dragover'));
  });
  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone?.addEventListener(eventName, () => uploadZone.classList.remove('dragover'));
  });

  uploadZone?.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
  });

  fileInput?.addEventListener('change', () => {
    handleFiles(fileInput.files);
  });

  function handleFiles(files) {
    if (!files || !files.length) return;
    [...files].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
          <img src="${e.target.result}" alt="${file.name}">
          <button class="remove" aria-label="Remove">×</button>
        `;
        item.querySelector('.remove').addEventListener('click', () => item.remove());
        uploadPreview.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  }

  // Contact form (mailto)
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:justine.nagrampa@example.com?subject=${subject}&body=${body}`;

    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Opening email…';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 2000);
  });
});
