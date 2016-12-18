'use babel';

import NvatomView from './nvatom-view';
import { CompositeDisposable } from 'atom';

export default {

  nvatomView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.nvatomView = new NvatomView(state.nvatomViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.nvatomView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nvatom:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.nvatomView.destroy();
  },

  serialize() {
    return {
      nvatomViewState: this.nvatomView.serialize()
    };
  },

  toggle() {
    console.log('Nvatom was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
