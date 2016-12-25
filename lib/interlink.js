'use babel';

// @todo: consider using pure fs module
import fs from 'fs-plus';
import path from 'path';

import {CompositeDisposable} from 'atom';
import Utility from './utility';

export default class Interlink {
    constructor() {
        Interlink.loadGrammarSync();
        this.subscriptions = new CompositeDisposable;
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'atomic-velocity:openInterlink': (function (_this) {
                return function () {
                    return Interlink.openInterlink();
                };
            })(this)
        }));
        this.subscriptions.add(atom.workspace.observeTextEditors(function (editor) {
            if (Utility.isNote(editor.getPath())) {
                return editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm.atomic-velocity'));
            }
        }));
    }

    destroy() {
        return this.subscriptions.dispose();
    }

    static loadGrammarSync() {
        var grammarPath;
        if (!atom.grammars.grammarForScopeName('source.gfm.atomic-velocity')) {
            grammarPath = path.join(atom.packages.resolvePackagePath('atomic-velocity'), 'grammars', 'atomic-velocity.json');
            return atom.grammars.loadGrammarSync(grammarPath);
        }
    }

    static openInterlink() {
        var editor, notePath, noteTitle;
        editor = atom.workspace.getActiveTextEditor();
        if (editor == null) {
            return;
        }
        if (!Utility.isNote(editor.getPath())) {
            return;
        }
        noteTitle = Interlink.getInterlinkUnderCursor(editor);
        if (noteTitle == null) {
            return;
        }
        if (!noteTitle.length) {
            return;
        }
        notePath = Utility.getNotePath(noteTitle);
        if (!fs.existsSync(notePath)) {
            fs.writeFileSync(notePath, '');
        }
        return atom.workspace.open(notePath);
    }

    static getInterlinkUnderCursor(editor) {
        var cursorPosition, interlink, token;
        cursorPosition = editor.getCursorBufferPosition();
        token = editor.tokenForBufferPosition(cursorPosition);
        if (!token) {
            return;
        }
        if (!token.value) {
            return;
        }
        if (!(token.scopes.indexOf('markup.underline.link.interlink.gfm') > -1)) {
            return;
        }
        interlink = Utility.trim(token.value);
        if (!interlink.length) {
            return;
        }
        return interlink;
    }
}
