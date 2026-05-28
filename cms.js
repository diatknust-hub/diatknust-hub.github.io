/*
 * DIAT public content loader
 * Loads published JSON content on GitHub Pages without exposing edit mode.
 */
(function () {
  'use strict';

  var CONTENT_URL = 'diat-content.json';
  var ALLOWED_HTML_TAGS = {
    BR: true,
    EM: true,
    STRONG: true,
    B: true,
    I: true,
    SPAN: true
  };

  function sanitizeHtml(value) {
    var template = document.createElement('template');
    template.innerHTML = String(value || '');

    function clean(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (!ALLOWED_HTML_TAGS[child.tagName]) {
            child.replaceWith(document.createTextNode(child.textContent || ''));
            return;
          }

          Array.prototype.slice.call(child.attributes).forEach(function (attr) {
            var keepClass = child.tagName === 'EM' &&
              attr.name === 'class' &&
              attr.value === 'dept-hero__title-accent';

            if (!keepClass) {
              child.removeAttribute(attr.name);
            }
          });
        }

        clean(child);
      });
    }

    clean(template.content);
    return template.innerHTML;
  }

  function applyContent(content) {
    if (!content || typeof content !== 'object') return;

    document.querySelectorAll('[data-cms-key]').forEach(function (el) {
      var key = el.getAttribute('data-cms-key');
      var value = content[key];

      if (value === undefined || value === null || value === '') return;

      if (el.getAttribute('data-cms-type') === 'html') {
        el.innerHTML = sanitizeHtml(value);
      } else if (el.getAttribute('data-cms-type') === 'image') {
        var img = el.matches('img') ? el : el.querySelector('img');
        if (img) img.setAttribute('src', String(value));
      } else {
        el.textContent = String(value);
      }
    });
  }

  function init() {
    fetch(CONTENT_URL + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(applyContent)
      .catch(function () {
        /* Keep the static HTML fallback if JSON is unavailable. */
      });
  }

  window.diatContentRefresh = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
