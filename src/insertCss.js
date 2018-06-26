/**
 * Isomorphic CSS style loader for Webpack
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const prefix = 's';
const inserted = {};

// Base64 encoding and decoding - The "Unicode Problem"
// https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
    String.fromCharCode(`0x${p1}`),
  ));
}

/**
 * Remove style/link elements for specified node IDs
 * if they are no longer referenced by UI components.
 */
function removeCss(ids) {
  ids.forEach((id) => {
    if (--inserted[id] <= 0) {
      const elem = document.getElementById(prefix + id);
      if (elem) {
        elem.parentNode.removeChild(elem);
      }
    }
  });
}

/**
 * Example:
 *   // Insert CSS styles object generated by `css-loader` into DOM
 *   var removeCss = insertCss([[1, 'body { color: red; }']]);
 *
 *   // Remove it from the DOM
 *   removeCss();
 */
function insertCss(styles, { replace = false, prepend = false } = {}) {
  const ids = [];
  for (let i = 0; i < styles.length; i++) {
    const [moduleId, css, media, sourceMap] = styles[i];
    let id;
    let notUnique = true;

    do {
      id = `${moduleId}-${i}-${Math.round(Math.random()*1000000000)}`;
      if (!ids.includes(id)) {
          notUnique = !notUnique;
      }
    } while (notUnique);

    ids.push(id);

    if (inserted[id]) {
      if (!replace) {
        inserted[id]++;
        continue;
      }
    }

    inserted[id] = 1;

    let elem = document.getElementById(prefix + id);
    let create = false;

    if (!elem) {
      create = true;

      elem = document.createElement('style');
      elem.setAttribute('type', 'text/css');
      elem.id = prefix + id;

      if (media) {
        elem.setAttribute('media', media);
      }
    }

    let cssText = css;
    if (sourceMap && typeof btoa === 'function') { // skip IE9 and below, see http://caniuse.com/atob-btoa
      cssText += `\n/*# sourceMappingURL=data:application/json;base64,${
        b64EncodeUnicode(JSON.stringify(sourceMap))}*/`;
      cssText += `\n/*# sourceURL=${sourceMap.file}?${id}*/`;
    }

    if ('textContent' in elem) {
      elem.textContent = cssText;
    } else {
      elem.styleSheet.cssText = cssText;
    }

    if (create) {
      if (prepend) {
        document.head.insertBefore(elem, document.head.childNodes[0]);
      } else {
        document.head.appendChild(elem);
      }
    }
  }

  return removeCss.bind(null, ids);
}

module.exports = insertCss;
