/* ==========================================================
   LAYOUT: shared navigation bar and footer
   Add a <div id="site-nav"></div> and <div id="site-footer"></div>
   to any page, then include this file. Edit the settings below
   to change the menu or footer for every page.
   ========================================================== */
(function () {
  const SITE = {
    name: "Dumiru",
    accent: "Jayasekara",
    homeUrl: "/",
    bookingUrl: "https://dumiru.me"
  };

  // Menu links (use /#section to point to sections on the homepage)
  const NAV_LINKS = [
    { label: "About", href: "/#about" },
    { label: "Case Studies", href: "/#case-studies" },
    { label: "Projects", href: "/#projects" },
    { label: "Brands", href: "/#brands" },
    { label: "Contact", href: "/#contact" }
  ];

  const PORTAL_BUTTON = { label: "Client Portal", href: "/client-portal" };

  const FOOTER_EXPLORE = [
    { label: "About", href: "/#about" },
    { label: "Case Studies", href: "/#case-studies" },
    { label: "Projects", href: "/#projects" },
    { label: "Brands", href: "/#brands" }
  ];

  const FOOTER_CONNECT = [
    { label: "Book a meeting", href: SITE.bookingUrl, external: true },
    { label: "Client Portal", href: PORTAL_BUTTON.href },
    { label: "Contact", href: "/#contact" }
  ];

  const FOOTER_BLURB = "Brand designer and creative director building clear, memorable brands and websites.";

  const ext = (item) => (item.external ? ' target="_blank" rel="noopener"' : "");

  function buildNav() {
    const mount = document.getElementById("site-nav");
    if (!mount) return;

    mount.innerHTML = `
      <header class="site-header" id="siteHeader">
        <nav class="nav glass" aria-label="Main navigation">
          <a href="${SITE.homeUrl}" class="brand">${SITE.name} <span>${SITE.accent}</span></a>
          <ul class="nav-links">
            ${NAV_LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
          </ul>
          <a href="${PORTAL_BUTTON.href}" class="btn btn-orange nav-cta">${PORTAL_BUTTON.label}</a>
          <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </nav>
      </header>
      <div class="mobile-menu glass" id="mobileMenu">
        ${NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join("")}
        <a href="${PORTAL_BUTTON.href}" class="btn btn-orange">${PORTAL_BUTTON.label}</a>
      </div>`;

    const burger = document.getElementById("burger");
    const menu = document.getElementById("mobileMenu");

    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    };

    burger.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  }

  function buildFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;

    const year = new Date().getFullYear();

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="wrap">
          <div class="foot">
            <div>
              <a href="${SITE.homeUrl}" class="brand">${SITE.name} <span>${SITE.accent}</span></a>
              <p>${FOOTER_BLURB}</p>
            </div>
            <div class="foot-links">
              <div>
                <h5>Explore</h5>
                ${FOOTER_EXPLORE.map(l => `<a href="${l.href}">${l.label}</a>`).join("")}
              </div>
              <div>
                <h5>Connect</h5>
                ${FOOTER_CONNECT.map(l => `<a href="${l.href}"${ext(l)}>${l.label}</a>`).join("")}
              </div>
            </div>
          </div>
          <div class="copy">
            <span>&copy; ${year} ${SITE.name} ${SITE.accent}. All rights reserved.</span>
            <span>dumiru.me</span>
          </div>
        </div>
      </footer>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildNav();
    buildFooter();
  });
})();
