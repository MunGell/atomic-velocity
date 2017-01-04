'use babel';

import fs from 'fs-plus';
import path from 'path';
import temp from 'temp';
import Utility from '../lib/utility';

temp.track();

describe('Utility', () => {
    let defaultNoteDirectory = atom.config.get('atomic-velocity.directory');
    let defaultNoteExtensions = atom.config.get('atomic-velocity.extensions');

    afterEach(() => {
        atom.config.set('atomic-velocity.directory', defaultNoteDirectory);
        atom.config.set('atomic-velocity.extensions', defaultNoteExtensions);
    });

    it('getPrimaryNoteExtension', () => {
        atom.config.set('atomic-velocity.extensions', ['.md', '.markdown']);
        expect(Utility.getPrimaryNoteExtension()).toBe('.md');
        atom.config.set('atomic-velocity.extensions', ['.markdown']);
        expect(Utility.getPrimaryNoteExtension()).toBe('.markdown');
        atom.config.set('atomic-velocity.extensions', []);
        expect(Utility.getPrimaryNoteExtension()).toBe('.md');
    });

    it('isNote handles symlinks correctly', () => {
        let noteDirectoryPath, noteDirectoryPathSymlink, notePath, notePathSymlink, tempDirectoryPath;
        atom.config.set('atomic-velocity.extensions', ['.md', '.markdown']);
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
        atom.config.set('atomic-velocity.directory', noteDirectoryPath);
        expect(Utility.isNote(notePath)).toBe(true);
        expect(Utility.isNote(notePathSymlink)).toBe(true);
        atom.config.set('atomic-velocity.directory', noteDirectoryPathSymlink);
        expect(Utility.isNote(notePath)).toBe(true);
        expect(Utility.isNote(notePathSymlink)).toBe(true);
    });

    describe('isNoteFileExtension', () => {
        it('returns true when file extension is in configuration', () => {
            atom.config.set('atomic-velocity.extensions', ['.test']);
            expect(Utility.isNoteFileExtension('/Users/Home/Note.test')).toBe(true);
        });

        it('returns true when file extensions are NOT configured and default to Markdown', () => {
            atom.config.set('atomic-velocity.extensions', []);
            expect(Utility.isNoteFileExtension('/Users/Home/Note.md')).toBe(true);
        });

        it('returns false when configuration is not set', () => {
            expect(Utility.isNoteFileExtension('/Users/Home/Note.md')).toBe(false);
        });

        it('returns false when file extension is not in the config', () => {
            atom.config.set('atomic-velocity.extensions', ['.club']);
            expect(Utility.isNoteFileExtension('/Users/Home/Note.md')).toBe(false);
        });

        it('returns false when configuration is empty and file extension is not the default one', () => {
            atom.config.set('atomic-velocity.extensions', []);
            expect(Utility.isNoteFileExtension('/Users/Home/Note.test')).toBe(false);
        });
    });
});
