/* Light and dark mode, the fade-in of sections, and the menu button on phones.
   The site follows the device setting until the visitor picks a mode with the
   switch in the header. The choice is kept in this browser only.
   This file is loaded in the <head>, so everything here is set before the page
   is drawn. */
(function () {
  "use strict";

  var KEY = "theme";
  var root = document.documentElement;
  root.classList.add("has-js");
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function stored() {
    try {
      var value = window.localStorage.getItem(KEY);
      return value === "dark" || value === "light" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function system() {
    return media && media.matches ? "dark" : "light";
  }

  function label(button, theme) {
    /* The button is a switch named "Dark mode": on in dark mode, off in light mode. */
    button.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
    button.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      label(button, theme);
    });
  }

  /* Runs in the head, before the page is drawn, so the page does not flash. */
  apply(stored() || system());

  if (media && media.addEventListener) {
    media.addEventListener("change", function () {
      if (!stored()) apply(system());
    });
  }

  /* Sections fade in once when they scroll into view. The class is set only if
     the browser supports it and the visitor has not asked for less motion, so
     without this script nothing is ever hidden. */
  var lessMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canReveal = "IntersectionObserver" in window && !lessMotion;
  if (canReveal) root.classList.add("reveal-on");

  function reveal() {
    if (!canReveal) return;
    var sections = document.querySelectorAll("main > .section");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
    /* Safety net: after a jump to an anchor or a failed check, show everything. */
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        sections.forEach(function (section) {
          var box = section.getBoundingClientRect();
          if (box.top < window.innerHeight) section.classList.add("is-visible");
        });
      }, 400);
    });
  }

  /* Phones: the "Menu" button opens and closes the list of pages. */
  function menu() {
    var header = document.querySelector(".site-header");
    var button = document.querySelector("[data-nav-toggle]");
    if (!header || !button) return;
    function set(open) {
      header.classList.toggle("nav-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    }
    button.addEventListener("click", function () {
      set(!header.classList.contains("nav-open"));
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("nav-open")) {
        set(false);
        button.focus();
      }
    });
  }

  function init() {
    reveal();
    menu();
    var current = root.getAttribute("data-theme");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      label(button, current);
      button.hidden = false;
      button.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        try { window.localStorage.setItem(KEY, next); } catch (e) { /* the choice lasts for this page only */ }
        root.classList.add("theme-anim");
        window.setTimeout(function () { root.classList.remove("theme-anim"); }, 350);
        apply(next);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
