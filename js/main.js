// Michigan Bar & Grill — shared front-end behaviour

document.addEventListener('DOMContentLoaded', function () {
  /* Mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      var expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  /* Menu tabs (menu.html) */
  var tabs = document.querySelectorAll('.menu-tab');
  var panels = document.querySelectorAll('.menu-panel');
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-tab');

        tabs.forEach(function (t) { t.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });

        tab.classList.add('active');
        var panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* Contact form — front-end only.
     Hook this up to your backend endpoint once it's deployed. The backend
     is multi-tenant, so every request needs an X-API-Key header identifying
     this business (generated when the business was onboarded — see the
     backend's scripts/createBusiness.js). Example:

     const res = await fetch('https://your-backend-url.com/api/contact', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'X-API-Key': 'biz_...'   // this business's key
       },
       body: JSON.stringify(data),
     });
  */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(contactForm).entries());
      console.log('Contact form submission (wire to backend):', data);
      var status = document.getElementById('form-status');
      if (status) {
        status.textContent = 'Thanks — this form is ready for the backend to be connected. Your message was logged to the console for now.';
        status.style.display = 'block';
      }
      contactForm.reset();
    });
  }
});
