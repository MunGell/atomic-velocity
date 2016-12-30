'use babel';

import fs from 'fs-plus';
import path from 'path';

const Utility = {
    getNotePath(title) {
        return path.join(Utility.getNoteDirectory(), title.trim() + Utility.getPrimaryNoteExtension());
    },
    getNoteDirectory() {
        return fs.normalize(atom.config.get('atomic-velocity.directory'));
    },
    getPrimaryNoteExtension() {
        if (atom.config.get('atomic-velocity.extensions').length) {
            return atom.config.get('atomic-velocity.extensions')[0];
        } else {
            return '.md';
        }
    },
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
}

export default Utility;
