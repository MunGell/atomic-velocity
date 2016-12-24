'use babel';

import path from 'path';
import temp from 'temp';

temp.track();

describe("nvAtom", () => {
    var defaultDirectory = atom.config.get('nvatom.directory');
    var workspaceElement,
        activationPromise;

    beforeEach(() => {
        workspaceElement = atom.views.getView(atom.workspace);
        activationPromise = atom.packages.activatePackage('nvatom');
    });

    afterEach(() => {
        return atom.config.set('nvatom.directory', defaultDirectory);
    });

        // it("attaches and then detaches the view when the nvatom:toggle event is triggered", () => {
        //     var noteDirectory = path.join(temp.mkdirSync());
        //     atom.config.set('nvatom.directory', noteDirectory);
        //
        //     expect(workspaceElement.querySelector('.nvatom')).not.toExist();
        //     atom.commands.dispatch(workspaceElement, 'nvatom:toggle');
        //
        //     waitsForPromise(() => {
        //         return activationPromise;
        //     });
        //
        //     runs(() => {
        //         expect(workspaceElement.querySelector('.nvatom')).toExist();
        //         expect(workspaceElement.querySelector('.nvatom').parentNode.style.display).not.toBe('none');
        //         atom.commands.dispatch(workspaceElement, 'nvatom:toggle');
        //         expect(workspaceElement.querySelector('.nvatom').parentNode.style.display).toBe('none');
        //     });
        // });

        it("checks if we banned the default directory under packages directory when the nvatom:toggle event is triggered", () => {
            var noteDirectory = path.join(process.env.ATOM_HOME, 'packages', 'nvatom', 'notebook');
            atom.config.set('nvatom.directory', noteDirectory);

            atom.commands.dispatch(workspaceElement, 'nvatom:toggle');

            waitsForPromise(() => {
                return Promise.all([
                    atom.packages.activatePackage('nvatom'),
                    atom.packages.activatePackage('notifications')
                ]);
            });

            runs(() => {
                var notificationContainer = workspaceElement.querySelector('atom-notifications');
                var notification = notificationContainer.querySelector('atom-notification.fatal');
                expect(notification).toExist();
            });
        });
});
