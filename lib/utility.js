'use babel';

import fs from 'fs-plus';
import path from 'path';

const DEFAULT_FILE_EXTENSION = '.md';

const Utility = {
    /**
     * Get path to the note by it's title
     * @param {String} title
     * @returns {String}
     */
    getNotePath(title) {
        return path.join(Utility.getNoteDirectory(), title.trim() + Utility.getPrimaryNoteExtension());
    },

    /**
     * Get path to notes directory
     * @returns {String}
     */
    getNoteDirectory() {
        return fs.normalize(atom.config.get('atomic-velocity.directory'));
    },

    /**
     * Get primary note file extension
     * Default to '.md' Markdown
     * @returns {String}
     */
    getPrimaryNoteExtension() {
        if (atom.config.get('atomic-velocity.extensions').length > 0) {
            return atom.config.get('atomic-velocity.extensions')[0];
        }

        return DEFAULT_FILE_EXTENSION;
    },

    /**
     * Check if file extension is configured to be a note
     * @param {String} filePath
     * @returns {Boolean}
     */
    isNoteFileExtension(filePath) {
        let extension = path.extname(filePath);
        let config = atom.config.get('atomic-velocity.extensions');

        // If config was not set or is corrupted
        if (!Array.isArray(config)) {
            return false;
        }

        // Return true if config includes file extension
        // Or config is empty and file extension is equal to the default one
        return config.includes(extension) || (config.length === 0 && extension === DEFAULT_FILE_EXTENSION);
    },

    /**
     * Check if file is in notes directory
     * @param {String} filePath
     * @param {String} notesDir
     * @returns {Boolean}
     */
    isNotePath(filePath, notesDir) {
        let normalizedFilePath = fs.normalize(filePath);
        let realDirectoryPath = fs.realpathSync(notesDir);

        if (normalizedFilePath.startsWith(notesDir) || normalizedFilePath.startsWith(realDirectoryPath)) {
            return true;
        }

        if (!fs.existsSync(normalizedFilePath)) {
            return false;
        }

        let realFilePath = fs.realpathSync(normalizedFilePath);

        return realFilePath.startsWith(notesDir) || realFilePath.startsWith(realDirectoryPath);
    },

    /**
     * Check if file is in notes directory
     * and hence is a note
     *
     * @param {String} filePath
     * @returns {Boolean}
     */
    isNote(filePath) {
        let notesDir = Utility.getNoteDirectory();

        if (!this.isNoteFileExtension(filePath)) {
            return false;
        }

        return this.isNotePath(filePath, notesDir);
    }
};

export default Utility;
