'use babel';

import fs from 'fs-plus';
import path from 'path';
import ref from 'atom';
import {CompositeDisposable, Disposable} from 'atom';
import Interlink from './interlink';
import Utility from './utility';

export default {
    config: {
        directory: {
            title: 'Note Directory',
            description: 'The directory to archive notes',
            type: 'string',
            "default": path.join(process.env.ATOM_HOME, 'av-notes')
        },
        extensions: {
            title: 'Extensions',
            description: 'The first extension will be used for newly created notes.',
            type: 'array',
            "default": ['.md', '.txt'],
            items: {
                type: 'string'
            }
        },
        enableLunrPipeline: {
            title: 'Enable Lunr Pipeline',
            description: 'Lunr pipeline preprocesses query to make search faster. However, it will skip searching some of stop words such as "an" or "be".',
            type: 'boolean',
            "default": true
        },
        enableAutosave: {
            title: 'Enable Autosave',
            description: 'Enable saving the document automatically whenever the user leaves the window or change the tab.',
            type: 'boolean',
            "default": true
        }
    },

    activate(state) {
        this.rootDirectory = this.ensureNoteDirectory();
        this.subscriptions = new CompositeDisposable;
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'atomic-velocity:toggle': ()  => {
                return this.createView(state).toggle();
            }
        }));
        let handleBeforeUnload = this.autosaveAll.bind(this);
        window.addEventListener('beforeunload', handleBeforeUnload, true);
        this.subscriptions.add(new Disposable(function () {
            return window.removeEventListener('beforeunload', handleBeforeUnload, true);
        }));
        let handleBlur = (event) => {
            if (event.target === window) {
                return this.autosaveAll();
            } else if (event.target.matches('atom-text-editor:not([mini])') && !event.target.contains(event.relatedTarget)) {
                return this.autosave(event.target.getModel());
            }
        };
        window.addEventListener('blur', handleBlur, true);
        this.subscriptions.add(new Disposable(function () {
            return window.removeEventListener('blur', handleBlur, true);
        }));
        this.subscriptions.add(atom.workspace.onWillDestroyPaneItem((arg) => {
            let item = arg.item;
            if (!this.autodelete(item)) {
                return this.autosave(item);
            }
        }));
        return this.interlink = new Interlink();
    },

    deactivate() {
        let ref1, ref2;
        this.subscriptions.dispose();
        if ((ref1 = this.interlnk) != null) {
            ref1.destroy();
        }
        return (ref2 = this.atomicVelocityView) != null ? ref2.destroy() : void 0;
    },

    serialize() {
        let ref1;
        return {
            atomicVelocityViewState: (ref1 = this.atomicVelocityView) != null ? ref1.serialize() : void 0
        };
    },

    createView(state, docQuery) {
        if (this.atomicVelocityView == null) {
            let AtomicVelocityView = require('./atomic-velocity-view');
            this.atomicVelocityView = new AtomicVelocityView(state.atomicVelocityViewState);
        }
        return this.atomicVelocityView;
    },

    autosave(paneItem) {
        if (!atom.config.get('atomic-velocity.enableAutosave')) {
            return;
        }
        if ((paneItem != null ? typeof paneItem.getURI === "function" ? paneItem.getURI() : void 0 : void 0) == null) {
            return;
        }
        if (!(paneItem != null ? typeof paneItem.isModified === "function" ? paneItem.isModified() : void 0 : void 0)) {
            return;
        }
        let uri = paneItem.getURI();
        if (!Utility.isNote(uri)) {
            return;
        }
        return paneItem != null ? typeof paneItem.save === "function" ? paneItem.save() : void 0 : void 0;
    },

    autodelete(paneItem) {
        if ((paneItem != null ? typeof paneItem.getURI === "function" ? paneItem.getURI() : void 0 : void 0) == null) {
            return false;
        }
        let uri = paneItem.getURI();
        if (!Utility.isNote(uri)) {
            return false;
        }
        if (!paneItem.isEmpty()) {
            return false;
        }
        fs.unlinkSync(uri);
        let noteName = uri.substring(this.rootDirectory.length + 1);
        atom.notifications.addInfo("Empty note " + noteName + " is deleted.");
        return true;
    },

    autosaveAll() {
        if (!atom.config.get('atomic-velocity.enableAutosave')) {
            return;
        }
        let ref1 = atom.workspace.getPaneItems();
        let results = [];
        for (let i = 0, len = ref1.length; i < len; i++) {
            results.push(this.autosave(ref1[i]));
        }
        return results;
    },

    ensureNoteDirectory() {
        let noteDirectory = fs.normalize(atom.config.get('atomic-velocity.directory'));
        let packagesDirectory = path.join(process.env.ATOM_HOME, 'packages');
        let defaultNoteDirectory = path.join(packagesDirectory, 'atomic-velocity', 'notebook');
        if (noteDirectory.startsWith(packagesDirectory)) {
            throw new Error("Note directory " + noteDirectory + " cannot reside within atom packages directory. Please change its value from package settings.");
        }
        if (!fs.existsSync(noteDirectory)) {
            noteDirectory = atom.config.get('atomic-velocity.directory');
            if (!fs.existsSync(noteDirectory)) {
                fs.makeTreeSync(noteDirectory);
                fs.copySync(defaultNoteDirectory, noteDirectory);
            }
        }
        return fs.realpathSync(noteDirectory);
    }
}
