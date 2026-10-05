/* Renders publications and news from data/publications.js and data/news.js,
   and builds the email link. No dependencies. */
(function () {
  "use strict";

  var ME = "Mert Gezek";
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var SOURCE_LABELS = {
    "players.brightcove.net": "Watch video",
    "doi.org": "Article",
    "linkedin.com": "LinkedIn"
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* Publications */

  function authorsNode(authors) {
    var span = el("span", "pub-authors");
    authors.split(", ").forEach(function (name, i) {
      if (i > 0) span.appendChild(document.createTextNode(", "));
      if (name === ME) {
        span.appendChild(el("strong", null, name));
      } else {
        span.appendChild(document.createTextNode(name));
      }
    });
    return span;
  }

  function venueText(p) {
    var parts = [String(p.year)];
    if (p.volume) parts.push(p.volume + (p.issue ? "(" + p.issue + ")" : ""));
    if (p.pages) parts.push(p.pages);
    return ", " + parts.join(", ") + ".";
  }

  function pubNode(p) {
    var li = el("li", "pub");
    li.id = p.id;
    li.appendChild(el("span", "pub-title", p.title));
    li.appendChild(authorsNode(p.authors));

    var venue = el("span", "pub-venue");
    venue.appendChild(el("em", null, p.journal));
    venue.appendChild(document.createTextNode(venueText(p)));
    li.appendChild(venue);

    var meta = el("span", "pub-meta");
    if (p.type === "review") meta.appendChild(el("span", "badge", "Review"));
    if (p.doi) {
      var a = el("a", "pub-doi", "doi.org/" + p.doi);
      a.href = "https://doi.org/" + p.doi;
      a.rel = "noopener";
      meta.appendChild(a);
    }
    li.appendChild(meta);
    return li;
  }

  function renderPubs() {
    var pubs = window.PUBLICATIONS || [];
    document.querySelectorAll("[data-pubs]").forEach(function (target) {
      var mode = target.getAttribute("data-pubs");
      var list = pubs.filter(function (p) {
        if (mode === "all") return true;
        if (mode === "selected") return p.selected === true;
        return p.theme === mode;
      });
      target.textContent = "";
      list.forEach(function (p) { target.appendChild(pubNode(p)); });
    });
  }

  /* News */

  function formatDate(ym) {
    var bits = String(ym).split("-");
    var month = MONTHS[parseInt(bits[1], 10) - 1];
    return (month ? month + " " : "") + bits[0];
  }

  function sourceLabel(link) {
    try {
      var host = new URL(link).hostname.replace(/^www\./, "");
      return SOURCE_LABELS[host] || host;
    } catch (e) {
      return "Link";
    }
  }

  function newsNode(n) {
    var li = el("li", "news-item");
    var time = el("time", null, formatDate(n.date));
    time.setAttribute("datetime", n.date);
    li.appendChild(time);

    var p = el("p", null, n.text);
    if (n.link) {
      p.appendChild(document.createTextNode(" "));
      var a = el("a", "news-source", sourceLabel(n.link));
      a.href = n.link;
      a.rel = "noopener";
      a.setAttribute("aria-label", sourceLabel(n.link) + ": " + n.text);
      p.appendChild(a);
    }
    li.appendChild(p);
    return li;
  }

  function renderNews() {
    var news = window.NEWS || [];
    document.querySelectorAll("[data-news]").forEach(function (target) {
      var mode = target.getAttribute("data-news");
      var list = mode === "recent" ? news.slice(0, 3) : news;
      target.textContent = "";
      list.forEach(function (n) { target.appendChild(newsNode(n)); });
    });
  }

  /* Activities */

  function activityDate(value) {
    if (!value) return "";
    return String(value).indexOf("-") === -1 ? String(value) : formatDate(value);
  }

  function activityNode(item) {
    var article = el("article", "activity");
    var meta = [activityDate(item.date), item.place].filter(Boolean).join(" · ");
    if (meta) article.appendChild(el("p", "activity-meta", meta));
    article.appendChild(el("h2", null, item.title));
    article.appendChild(el("p", null, item.text));
    var photos = item.photos || [];
    if (photos.length) {
      var grid = el("div", "photos" + (photos.length > 1 ? " many" : ""));
      photos.forEach(function (photo) {
        var a = el("a");
        if (photo.wide) a.className = "wide";
        else if (photo.height > photo.width) a.className = "portrait";
        a.href = photo.src;
        var img = el("img");
        img.src = photo.src;
        img.alt = photo.alt || "";
        img.loading = "lazy";
        if (photo.width) img.width = photo.width;
        if (photo.height) img.height = photo.height;
        a.appendChild(img);
        grid.appendChild(a);
      });
      article.appendChild(grid);
    }
    return article;
  }

  function renderActivities() {
    var items = window.ACTIVITIES || [];
    document.querySelectorAll("[data-activities]").forEach(function (target) {
      target.textContent = "";
      items.forEach(function (item) { target.appendChild(activityNode(item)); });
    });
  }

  /* Email: the address is never in the page source or in the visible text.
     It is put together only when a visitor clicks. */

  function emailOf(node) {
    var user = node.getAttribute("data-user");
    var domain = node.getAttribute("data-domain");
    return user && domain ? user + "@" + domain : "";
  }

  function renderEmail() {
    document.querySelectorAll("a[data-email]").forEach(function (a) {
      a.addEventListener("click", function (event) {
        var address = emailOf(a);
        if (!address) return;
        event.preventDefault();
        window.location.href = "mailto:" + address;
      });
    });

    document.querySelectorAll("[data-reveal-email]").forEach(function (button) {
      var list = document.getElementById(button.getAttribute("aria-controls"));
      if (!list) return;
      button.hidden = false;
      button.addEventListener("click", function () {
        list.querySelectorAll("[data-user]").forEach(function (item) {
          item.textContent = emailOf(item);
        });
        list.hidden = false;
        button.hidden = true;
      });
    });
  }

  /* Videos: nothing is loaded from YouTube until the visitor clicks. */

  function renderVideos() {
    document.querySelectorAll("a[data-video]").forEach(function (a) {
      a.addEventListener("click", function (event) {
        if (location.protocol === "file:") return; /* from disk, just open YouTube */
        event.preventDefault();
        var frame = document.createElement("iframe");
        frame.className = "video-frame";
        frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(a.getAttribute("data-video")) + "?autoplay=1";
        frame.title = a.getAttribute("data-title") || "Video";
        frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        frame.allowFullscreen = true;
        a.parentNode.replaceChild(frame, a);
      });
    });
  }

  function init() {
    renderPubs();
    renderNews();
    renderActivities();
    renderEmail();
    renderVideos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
