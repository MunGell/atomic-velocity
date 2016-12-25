'use babel';

// @todo: consider using pure fs module
import fs from 'fs-plus';
import path from 'path';

// @todo: remove this function
var indexOf = [].indexOf || function (item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this && this[i] === item) return i;
            }
            return -1;
        };

export default class Utility {
    static getNotePath(title) {
        return path.join(Utility.getNoteDirectory(), Utility.trim(title) + Utility.getPrimaryNoteExtension());
    }

    static getNoteDirectory() {
        return fs.normalize(atom.config.get('atomic-velocity.directory'));
    }

    static getPrimaryNoteExtension() {
        if (atom.config.get('atomic-velocity.extensions').length) {
            return atom.config.get('atomic-velocity.extensions')[0];
        } else {
            return '.md';
        }
    }

    static isNote(filePath) {
        var ref;
        if (ref = path.extname(filePath), indexOf.call(atom.config.get('atomic-velocity.extensions'), ref) < 0) {
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

    static trim(str) {
        return str != null ? str.replace(/^\s+|\s+$/g, '') : void 0;
    }
}
