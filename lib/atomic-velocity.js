'use babel';

// @todo: consider using pure fs module
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
        var handleBeforeUnload, handleBlur;
        this.rootDirectory = this.ensureNoteDirectory();
        this.subscriptions = new CompositeDisposable;
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'atomic-velocity:toggle': (function (_this) {
                return function () {
                    return _this.createView(state).toggle();
                };
            })(this)
        }));
        handleBeforeUnload = this.autosaveAll.bind(this);
        window.addEventListener('beforeunload', handleBeforeUnload, true);
        this.subscriptions.add(new Disposable(function () {
            return window.removeEventListener('beforeunload', handleBeforeUnload, true);
        }));
        handleBlur = (function (_this) {
            return function (event) {
                if (event.target === window) {
                    return _this.autosaveAll();
                } else if (event.target.matches('atom-text-editor:not([mini])') && !event.target.contains(event.relatedTarget)) {
                    return _this.autosave(event.target.getModel());
                }
            };
        })(this);
        window.addEventListener('blur', handleBlur, true);
        this.subscriptions.add(new Disposable(function () {
            return window.removeEventListener('blur', handleBlur, true);
        }));
        this.subscriptions.add(atom.workspace.onWillDestroyPaneItem((function (_this) {
            return function (arg) {
                var item;
                item = arg.item;
                if (!_this.autodelete(item)) {
                    return _this.autosave(item);
                }
            };
        })(this)));
        return this.interlink = new Interlink();
    },

    deactivate() {
        var ref1, ref2;
        this.subscriptions.dispose();
        if ((ref1 = this.interlnk) != null) {
            ref1.destroy();
        }
        return (ref2 = this.atomicVelocityView) != null ? ref2.destroy() : void 0;
    },

    serialize() {
        var ref1;
        return {
            atomicVelocityViewState: (ref1 = this.atomicVelocityView) != null ? ref1.serialize() : void 0
        };
    },

    createView(state, docQuery) {
        var AtomicVelocityView;
        if (this.atomicVelocityView == null) {
            AtomicVelocityView = require('./atomic-velocity-view');
            this.atomicVelocityView = new AtomicVelocityView(state.atomicVelocityViewState);
        }
        return this.atomicVelocityView;
    },

    autosave(paneItem) {
        var uri;
        if (!atom.config.get('atomic-velocity.enableAutosave')) {
            return;
        }
        if ((paneItem != null ? typeof paneItem.getURI === "function" ? paneItem.getURI() : void 0 : void 0) == null) {
            return;
        }
        if (!(paneItem != null ? typeof paneItem.isModified === "function" ? paneItem.isModified() : void 0 : void 0)) {
            return;
        }
        uri = paneItem.getURI();
        if (!Utility.isNote(uri)) {
            return;
        }
        return paneItem != null ? typeof paneItem.save === "function" ? paneItem.save() : void 0 : void 0;
    },

    autodelete(paneItem) {
        var noteName, uri;
        if ((paneItem != null ? typeof paneItem.getURI === "function" ? paneItem.getURI() : void 0 : void 0) == null) {
            return false;
        }
        uri = paneItem.getURI();
        if (!Utility.isNote(uri)) {
            return false;
        }
        if (!paneItem.isEmpty()) {
            return false;
        }
        fs.unlinkSync(uri);
        noteName = uri.substring(this.rootDirectory.length + 1);
        atom.notifications.addInfo("Empty note " + noteName + " is deleted.");
        return true;
    },

    autosaveAll() {
        var i, len, paneItem, ref1, results;
        if (!atom.config.get('atomic-velocity.enableAutosave')) {
            return;
        }
        ref1 = atom.workspace.getPaneItems();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            paneItem = ref1[i];
            results.push(this.autosave(paneItem));
        }
        return results;
    },

    ensureNoteDirectory() {
        var defaultNoteDirectory, noteDirectory, packagesDirectory;
        noteDirectory = fs.normalize(atom.config.get('atomic-velocity.directory'));
        packagesDirectory = path.join(process.env.ATOM_HOME, 'packages');
        defaultNoteDirectory = path.join(packagesDirectory, 'atomic-velocity', 'notebook');
        if (noteDirectory.startsWith(packagesDirectory)) {
            throw new Error("Note directory " + noteDirectory + " cannot reside within atom packages directory. Please change its value from package settings.");
        }
        if (!fs.existsSync(noteDirectory)) {
            this.tryMigrateFromAtomicVelocity();
            noteDirectory = atom.config.get('atomic-velocity.directory');
            if (!fs.existsSync(noteDirectory)) {
                fs.makeTreeSync(noteDirectory);
                fs.copySync(defaultNoteDirectory, noteDirectory);
            }
        }
        return fs.realpathSync(noteDirectory);
    },

    tryMigrateFromAtomicVelocity() {
        var currNoteDirectory, defaultNoteDirectory, packagesDirectory, prevNoteDirectory;
        prevNoteDirectory = atom.config.get('atomic-velocity.directory');
        currNoteDirectory = atom.config.get('atomic-velocity.directory');
        packagesDirectory = path.join(process.env.ATOM_HOME, 'packages');
        defaultNoteDirectory = path.join(packagesDirectory, 'atomic-velocity', 'notebook');
        if (prevNoteDirectory === void 0) {
            return;
        }
        atom.notifications.addInfo('Migrating from atomic-velocity package...');
        if (!fs.existsSync(prevNoteDirectory)) {
            atom.notifications.addError("atomic-velocity.directory " + prevNoteDirectory + " does not exists. Migration process is failed.");
            return;
        }
        if (prevNoteDirectory.startsWith(packagesDirectory)) {
            fs.makeTreeSync(currNoteDirectory);
            fs.copySync(prevNoteDirectory, currNoteDirectory);
        } else {
            if (path.join(process.env.ATOM_HOME, 'atomic-velocity-notes') === currNoteDirectory) {
                atom.config.set('atomic-velocity.directory', prevNoteDirectory);
            }
        }
        return atom.notifications.addInfo('Finished migration.');
    }
}