'use babel';

import path from 'path';
import temp from 'temp';

temp.track();

describe("Atomic Velocity", () => {
    let defaultDirectory = atom.config.get('atomic-velocity.directory');
    let workspaceElement,
        activationPromise;

    beforeEach(() => {
        workspaceElement = atom.views.getView(atom.workspace);
        activationPromise = atom.packages.activatePackage('atomic-velocity');
    });

    afterEach(() => {
        return atom.config.set('atomic-velocity.directory', defaultDirectory);
    });

        // it("attaches and then detaches the view when the atomic-velocity:toggle event is triggered", () => {
        //     var noteDirectory = path.join(temp.mkdirSync());
        //     atom.config.set('atomic-velocity.directory', noteDirectory);
        //
        //     expect(workspaceElement.querySelector('.atomic-velocity')).not.toExist();
        //     atom.commands.dispatch(workspaceElement, 'atomic-velocity:toggle');
        //
        //     waitsForPromise(() => {
        //         return activationPromise;
        //     });
        //
        //     runs(() => {
        //         expect(workspaceElement.querySelector('.atomic-velocity')).toExist();
        //         expect(workspaceElement.querySelector('.atomic-velocity').parentNode.style.display).not.toBe('none');
        //         atom.commands.dispatch(workspaceElement, 'atomic-velocity:toggle');
        //         expect(workspaceElement.querySelector('.atomic-velocity').parentNode.style.display).toBe('none');
        //     });
        // });

        it("checks if we banned the default directory under packages directory when the atomic-velocity:toggle event is triggered", () => {
            let noteDirectory = path.join(process.env.ATOM_HOME, 'packages', 'atomic-velocity', 'notebook');
            atom.config.set('atomic-velocity.directory', noteDirectory);

            atom.commands.dispatch(workspaceElement, 'atomic-velocity:toggle');

            waitsForPromise(() => {
                return Promise.all([
                    atom.packages.activatePackage('atomic-velocity'),
                    atom.packages.activatePackage('notifications')
                ]);
            });

            runs(() => {
                let notificationContainer = workspaceElement.querySelector('atom-notifications');
                let notification = notificationContainer.querySelector('atom-notification.fatal');
                expect(notification).toExist();
            });
        });
});
