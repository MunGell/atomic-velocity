'use babel';

// @todo: consider using pure fs module
import fs from 'fs-plus';
import path from 'path';
import temp from 'temp';
import Interlink from '../lib/interlink';

temp.track();

describe('Interlink', () => {
    var interLinkInstance;
    var defaultDirectory = atom.config.get('nvatom.directory');
    var noteDirectory = null;

    var activationPromise;
    var openFilePromise;
    var workspaceElement;
    var editor;

    beforeEach(function () {
        workspaceElement = atom.views.getView(atom.workspace);
        noteDirectory = temp.mkdirSync();
        activationPromise = atom.packages.activatePackage('nvatom');
        openFilePromise = atom.workspace.open(path.join(noteDirectory, 'Interlink.md'))
            .then(function (o) {
                return editor = o;
            });
        atom.config.set('nvatom.directory', noteDirectory);
    });

    afterEach(function () {
        return atom.config.set('nvatom.directory', defaultDirectory);
    });

    it('returns a trimmed interlink text', function () {
        let testdata = [
            {
                position: [0, 2],
                text: '[[Car]]',
                expected: 'Car'
            },
            {
                position: [0, 2],
                text: '[[Notational Velocity]]',
                expected: 'Notational Velocity'
            },
            {
                position: [0, 2],
                text: '[[한글 Alphabet Test]]',
                expected: '한글 Alphabet Test'
            },
            {
                position: [0, 2],
                text: '[[ Car ]]',
                expected: 'Car'
            },
            {
                position: [0, 2],
                text: '[[Car/Mini]]',
                expected: 'Car/Mini'
            }
        ];

        atom.commands.dispatch(workspaceElement, 'nvatom:toggle');

        waitsForPromise(() => {
            return Promise.all([
                activationPromise,
                openFilePromise
            ]);
        });

        runs(() => {
            interLinkInstance = new Interlink();

            for (let i = 0, len = testdata.length; i < len; i++) {
                let testitem = testdata[i];
                editor.setText(testitem.text);
                editor.setCursorBufferPosition(testitem.position);

                expect(Interlink.getInterlinkUnderCursor(editor)).toBe(testitem.expected);
            }
        });
    });

    it('returns undefined for invalid text', function () {
        let testdata = [
            {
                position: [0, 2],
                text: '[[]]'
            },
            {
                position: [0, 3],
                text: '[[]]'
            },
            {
                position: [0, 2],
                text: '[[   ]]'
            },
            {
                position: [0, 1],
                text: '[Car]'
            },
            {
                position: [0, 2],
                text: '[[[Car]]]'
            },
            {
                position: [0, 2],
                text: '[[Car]'
            },
            {
                position: [0, 2],
                text: '[[Car]]]'
            },
            {
                position: [0, 1],
                text: 'Car'
            }
        ];

        atom.commands.dispatch(workspaceElement, 'nvatom:toggle');

        waitsForPromise(() => {
            return Promise.all([
                activationPromise,
                openFilePromise
            ]);
        });

        runs(() => {
            interLinkInstance = new Interlink();

            for (let i = 0, len = testdata.length; i < len; i++) {
                let testitem = testdata[i];
                editor.setText(testitem.text);
                editor.setCursorBufferPosition(testitem.position);

                expect(Interlink.getInterlinkUnderCursor(editor)).toBe(void 0);
            }
        });
    });

    it('does not apply the grammar under random directory', () => {
        atom.commands.dispatch(workspaceElement, 'nvatom:toggle');

        waitsForPromise(() => {
            let openRandomFilePromise = atom.workspace.open(path.join(temp.mkdirSync(), 'Interlink.md'))
                .then(o => {
                    return editor = o;
                });
            return Promise.all([
                activationPromise,
                openRandomFilePromise
            ]);
        });

        runs(() => {
            interLinkInstance = new Interlink();

            editor.setText('[[Car]]');
            editor.setCursorBufferPosition([0, 2]);
            expect(Interlink.getInterlinkUnderCursor(editor)).toBe(void 0);
        });

    });

    it('opens the referred notes when the editor path is under the note directory', () => {
        atom.commands.dispatch(workspaceElement, 'nvatom:toggle');

        waitsForPromise(() => {
            return Promise.all([
                activationPromise,
                openFilePromise
            ]);
        });

        runs(() => {
            editor.setText('[[Car]]');
            editor.setCursorBufferPosition([0, 2]);
        });

        waitsForPromise(() => {
            return Interlink.openInterlink();
        });

        runs(() => {
            expect(atom.workspace.getActiveTextEditor().getPath().endsWith('Car.md')).toBe(true);
        });
    });

    it('does nothing when the editor path is not under the note directory', function () {
        atom.commands.dispatch(workspaceElement, 'nvatom:toggle');

        waitsForPromise(() => {
            let openRandomFilePromise = atom.workspace.open(path.join(temp.mkdirSync(), 'Interlink.md'))
                .then(o => {
                    return editor = o;
                });
            return Promise.all([
                activationPromise,
                openRandomFilePromise
            ]);
        });

        runs(() => {
            editor.setText('[[Car]]');
            editor.setCursorBufferPosition([0, 2]);
        });

        return expect(Interlink.openInterlink()).toBe(void 0);
    });
});
