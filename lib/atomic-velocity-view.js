'use babel';

import fs from 'fs-plus';
import {$, $$, SelectListView} from 'atom-space-pen-views';
import _ from 'underscore-plus';
import {CompositeDisposable, Disposable} from 'atom';
import DocQuery from 'docquery';
import Utility from './utility';

class AtomicVelocityView extends SelectListView {
    initialize(state) {
        super.initialize(arguments);
        this.initializedAt = new Date();
        this.addClass('atomic-velocity');
        this.rootDirectory = Utility.getNoteDirectory();
        if (!fs.existsSync(this.rootDirectory)) {
            throw new Error("The given directory " + this.rootDirectory + " does not exist. ", +"Set the note directory to the existing one from Settings.");
        }
        this.skipPopulateList = false;
        this.prevCursorPosition = 0;
        this.documentsLoaded = false;
        this.docQuery = new DocQuery(this.rootDirectory, {
            recursive: true,
            extensions: atom.config.get('atomic-velocity.extensions')
        });
        this.docQuery.on("ready", (function (_this) {
            return function () {
                _this.documentsLoaded = true;
                _this.setLoading();
                return _this.populateList();
            };
        })(this));
        this.docQuery.on("added", (function (_this) {
            return function (fileDetails) {
                if (_this.documentsLoaded) {
                    return _this.populateList();
                }
            };
        })(this));
        this.docQuery.on("updated", (function (_this) {
            return function (fileDetails) {
                if (_this.documentsLoaded) {
                    return _this.populateList();
                }
            };
        })(this));
        this.docQuery.on("removed", (function (_this) {
            return function (fileDetails) {
                if (_this.documentsLoaded) {
                    return _this.populateList();
                }
            };
        })(this));
        if (!atom.config.get('atomic-velocity.enableLunrPipeline')) {
            return this.docQuery.searchIndex.pipeline.reset();
        }
    }

    isCursorProceeded() {
        let currCursorPosition, editor, isCursorProceeded;
        editor = this.filterEditorView.model;
        currCursorPosition = editor.getCursorBufferPosition().column;
        isCursorProceeded = this.prevCursorPosition < currCursorPosition;
        this.prevCursorPosition = currCursorPosition;
        return isCursorProceeded;
    }

    selectItem(filteredItems, filterQuery) {
        let editor, isCursorProceeded, item, j, k, len, len1, n, results;
        isCursorProceeded = this.isCursorProceeded();
        for (j = 0, len = filteredItems.length; j < len; j++) {
            item = filteredItems[j];
            if (item.title.toLowerCase() === filterQuery.toLowerCase()) {
                n = filteredItems.indexOf(item) + 1;
                this.selectItemView(this.list.find("li:nth-child(" + n + ")"));
                return;
            }
        }
        results = [];
        for (k = 0, len1 = filteredItems.length; k < len1; k++) {
            item = filteredItems[k];
            if (item.title.toLowerCase().startsWith(filterQuery.toLowerCase()) && isCursorProceeded) {
                this.skipPopulateList = true;
                editor = this.filterEditorView.model;
                editor.setText(filterQuery + item.title.slice(filterQuery.length));
                editor.selectLeft(item.title.length - filterQuery.length);
                n = filteredItems.indexOf(item) + 1;
                results.push(this.selectItemView(this.list.find("li:nth-child(" + n + ")")));
            } else {
                results.push(void 0);
            }
        }
        return results;
    }

    filter(filterQuery) {
        if ((filterQuery === "") || (filterQuery === void 0)) {
            return this.docQuery.documents;
        }
        return this.docQuery.search(filterQuery);
    }

    getFilterKey() {
        return 'filetext';
    }

    toggle() {
        let ref1;
        if ((ref1 = this.panel) != null ? ref1.isVisible() : void 0) {
            return this.hide();
        } else if (this.documentsLoaded) {
            this.populateList();
            return this.show();
        } else {
            this.setLoading("Loading documents");
            return this.show();
        }
    }

    viewForItem(item) {
        let content = item.body.slice(0, 100);
        return $$(function () {
            return this.li({
                "class": 'two-lines'
            }, (function (_this) {
                return function () {
                    _this.div({
                        "class": 'primary-line'
                    }, function () {
                        _this.span("" + item.title);
                        return _this.div({
                            "class": 'metadata'
                        }, "" + (item.modifiedAt.toLocaleDateString()));
                    });
                    return _this.div({
                        "class": 'secondary-line'
                    }, "" + content);
                };
            })(this));
        });
    }

    confirmSelection() {
        let calculatedPath, filePath, item, sanitizedQuery;
        item = this.getSelectedItem();
        sanitizedQuery = Utility.trim(this.getFilterQuery());
        calculatedPath = Utility.getNotePath(sanitizedQuery);
        filePath = null;
        if (item != null) {
            filePath = item.filePath;
        } else if (fs.existsSync(calculatedPath)) {
            filePath = calculatedPath;
        } else if (sanitizedQuery.length > 0) {
            filePath = calculatedPath;
            fs.writeFileSync(filePath, '');
        }
        if (filePath) {
            atom.workspace.open(filePath).then(function (editor) {
                let debouncedSave, save;
                save = function () {
                    let isWhiteSpaceActive = atom.packages.isPackageActive('whitespace');
                    if (isWhiteSpaceActive) {
                        atom.packages.deactivatePackage('whitespace');
                    }
                    editor.save();
                    if (isWhiteSpaceActive) {
                        return atom.packages.activatePackage('whitespace');
                    }
                };
                debouncedSave = _.debounce(save, 1000);
                return editor.onDidStopChanging(function () {
                    if (editor.isModified()) {
                        return debouncedSave();
                    }
                });
            });
        }
        return this.cancel();
    }

    destroy() {
        let ref1;
        this.cancel();
        return (ref1 = this.panel) != null ? ref1.destroy() : void 0;
    }

    show() {
        this.storeFocusedElement();
        if (this.panel == null) {
            this.panel = atom.workspace.addModalPanel({
                item: this
            });
        }
        this.panel.show();
        return this.focusFilterEditor();
    }

    cancelled() {
        return this.hide();
    }

    hide() {
        let ref1;
        return (ref1 = this.panel) != null ? ref1.hide() : void 0;
    }

    getFilterQuery() {
        let editor, fullText, selectedText;
        editor = this.filterEditorView.model;
        fullText = editor.getText();
        selectedText = editor.getSelectedText();
        return fullText.substring(0, fullText.length - selectedText.length);
    }

    populateList() {
        let filterQuery, filteredItems, i, item, itemView, j, ref1;
        filterQuery = this.getFilterQuery();
        filteredItems = this.filter(filterQuery);
        this.list.empty();
        if (filteredItems.length) {
            this.setError(null);
            for (i = j = 0, ref1 = Math.min(filteredItems.length, this.maxItems); 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                item = filteredItems[i];
                itemView = $(this.viewForItem(item));
                itemView.data('select-list-item', item);
                this.list.append(itemView);
            }
            return this.selectItem(filteredItems, filterQuery);
        } else {
            return this.setError(this.getEmptyMessage(this.docQuery.documents.length, filteredItems.length));
        }
    }

    schedulePopulateList() {
        if (!this.skipPopulateList) {
            super.schedulePopulateList(arguments);
        }
        return this.skipPopulateList = false;
    }
}

export default AtomicVelocityView;
