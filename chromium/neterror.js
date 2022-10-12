// Copyright 2013 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function onDocumentLoad() {
  document.body.classList.add("offline");
  new Runner(".interstitial-wrapper");
}

document.addEventListener("DOMContentLoaded", onDocumentLoad);
