# Element.prototype.tagName hotpath in JSDOm

`ByRole` from `@testing-library/dom` makes heavy use of `window.getComputedStyle`.
This makes `Element.prototype.tagName` a hotpath in certain DOM trees.

```bash
$ git checkout master
$ node index.js 10
median: 538.9752ms, average: 574.9476ms, sum: 5749.48ms
```

Where `asciiUppercase` uses 40% of the total time of `performRun`.
See `byrole-table-benchmark-master.cpuprofile` which can be loaded in Chrome's profiler.

Applying

```diff
diff --git a/node_modules/jsdom/lib/jsdom/living/nodes/Element-impl.js b/node_modules/jsdom/lib/jsdom/living/nodes/Element-impl.js
index 4b07e12..49d0434 100644
--- a/node_modules/jsdom/lib/jsdom/living/nodes/Element-impl.js
+++ b/node_modules/jsdom/lib/jsdom/living/nodes/Element-impl.js
@@ -78,6 +78,8 @@ class ElementImpl extends NodeImpl {
     this._attributes = NamedNodeMap.createImpl(this._globalObject, [], {
       element: this
     });
+
+    this._cachedTagName = null;
   }

   _attach() {
@@ -133,11 +135,17 @@ class ElementImpl extends NodeImpl {
     return this._prefix !== null ? this._prefix + ":" + this._localName : this._localName;
   }
   get tagName() {
-    let qualifiedName = this._qualifiedName;
-    if (this.namespaceURI === HTML_NS && this._ownerDocument._parsingMode === "html") {
-      qualifiedName = asciiUppercase(qualifiedName);
+    // This getter can be a hotpath in getComputedStyle.
+    // All these are invariants during the instance lifetime so we can safely cache the computed tagName.
+    // We could create it during construction but since we already identified this as potentially slow we do it lazily.
+    if (this._cachedTagName === null) {
+      if (this.namespaceURI === HTML_NS && this._ownerDocument._parsingMode === "html") {
+        this._cachedTagName = asciiUppercase(this._qualifiedName);
+      } else {
+        this._cachedTagName = this._qualifiedName;
+      }
     }
-    return qualifiedName;
+    return this._cachedTagName;
   }

   get attributes() {
```

safes this time resulting in

```bash
$ git checkout feat/jsdom-tagName-cache
$ node index.js 10
median: 261.3774ms, average: 279.9181ms, sum: 559.84ms
```
