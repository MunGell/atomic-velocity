'use babel';

import fs from 'fs-plus';
import path from 'path';

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

        return '.md';
    },

    /**
     * Check if file is in notes directory
     * and hence is a note
     *
     * @param {String} filePath
     * @returns {Boolean}
     */
    isNote(filePath) {
        if (atom.config.get('atomic-velocity.extensions').indexOf(path.extname(filePath)) < 0) {
            return false;
        }
        filePath = fs.normalize(filePath);
        if (filePath.startsWith(Utility.getNoteDirectory())) {
            return true;
        }
        if (filePath.startsWith(fs.realpathSync(Utility.getNoteDirectory()))) {
            return true;
        }
        if (!fs.existsSync(filePath)) {
            return false;
        }
        filePath = fs.realpathSync(filePath);
        if (filePath.startsWith(Utility.getNoteDirectory())) {
            return true;
        }
        if (filePath.startsWith(fs.realpathSync(Utility.getNoteDirectory()))) {
            return true;
        }
        return false;
    }
};

export default Utility;
