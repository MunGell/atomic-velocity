'use babel';

// @todo: consider using pure fs module
import fs from 'fs-plus';
import path from 'path';
import temp from 'temp';
import Utility from '../lib/utility';

temp.track();

describe("Utility", () => {
    var defaultNoteDirectory = atom.config.get('nvatom.directory');
    var defaultNoteExtensions = atom.config.get('nvatom.extensions');

    afterEach(() => {
        atom.config.set('nvatom.directory', defaultNoteDirectory);
        atom.config.set('nvatom.extensions', defaultNoteExtensions);
    });

    it('trim', () => {
        expect(Utility.trim(null)).toBe(void 0);
        expect(Utility.trim(void 0)).toBe(void 0);
        expect(Utility.trim('')).toBe('');
        expect(Utility.trim('  ')).toBe('');
        expect(Utility.trim('  hello world  ')).toBe('hello world');
        expect(Utility.trim('  hello world\t\n\r  ')).toBe('hello world');
    });

    it('getPrimaryNoteExtension', () => {
        atom.config.set('nvatom.extensions', ['.md', '.markdown']);
        expect(Utility.getPrimaryNoteExtension()).toBe('.md');
        atom.config.set('nvatom.extensions', ['.markdown']);
        expect(Utility.getPrimaryNoteExtension()).toBe('.markdown');
        atom.config.set('nvatom.extensions', []);
        expect(Utility.getPrimaryNoteExtension()).toBe('.md');
    });

    it('isNote handles symlinks correctly', () => {
        var noteDirectoryPath, noteDirectoryPathSymlink, notePath, notePathSymlink, tempDirectoryPath;
        atom.config.set('nvatom.extensions', ['.md', '.markdown']);
        tempDirectoryPath = path.join(temp.mkdirSync());
        noteDirectoryPath = path.join(temp.mkdirSync());
        noteDirectoryPathSymlink = path.join(tempDirectoryPath, 'note book');
        notePath = path.join(noteDirectoryPath, 'note.md');
        notePathSymlink = path.join(noteDirectoryPathSymlink, 'note symlink.md');
        fs.writeFileSync(notePath, 'dummy');
        fs.symlinkSync(noteDirectoryPath, noteDirectoryPathSymlink);
        fs.symlinkSync(notePath, notePathSymlink);
        expect(fs.existsSync(notePath)).toBe(true);
        expect(fs.existsSync(fs.normalize(notePath))).toBe(true);
        atom.config.set('nvatom.directory', noteDirectoryPath);
        expect(Utility.isNote(notePath)).toBe(true);
        expect(Utility.isNote(notePathSymlink)).toBe(true);
        atom.config.set('nvatom.directory', noteDirectoryPathSymlink);
        expect(Utility.isNote(notePath)).toBe(true);
        expect(Utility.isNote(notePathSymlink)).toBe(true);
    });
});