import MicroModal from 'micromodal';

import Component, { ComponentProps } from '../Component';
import { extend } from '../extend';
import Modal from './Modal';

/**
 * The `ModalManager` component manages a modal dialog. Only one modal dialog
 * can be shown at once; loading a new component into the ModalManager will
 * overwrite the previous one.
 */
export default class ModalManager extends Component {
    showing!: boolean;
    hideTimeout!: number;

    modal: (new () => Modal) | null = null;
    modalProps: ComponentProps = {};

    component: Modal | null = null;

    oncreate(vnode) {
        super.oncreate(vnode);

        app.modal = this;
    }

    view() {
        return (
            <div className="ModalManager modal" id="Modal" onclick={this.onclick.bind(this)} key="modal">
                {this.modal && m(this.modal, this.modalProps)}
            </div>
        );
    }

    /**
     * Show a modal dialog.
     */
    show(component: new () => Modal, props: ComponentProps = {}) {
        clearTimeout(this.hideTimeout);

        this.showing = true;
        this.modal = component;
        this.modalProps = props;
        this.component = null;

        // Store the vnode state in app.modal.component
        extend(this.modalProps, 'oninit', (v, vnode) => (this.component = vnode.state));

        // if (app.current) app.current.retain = true;

        m.redraw();

        if (!$('.modal-backdrop').length) {
            $('<div />').addClass('modal-backdrop').appendTo('body');
        }

        MicroModal.show('Modal', {
            awaitCloseAnimation: true,
            awaitOpenAnimation: true,
            disableFocus: true,
            onShow: () => $('body').addClass('modal-open'),
            onClose: () => {
                $('body').removeClass('modal-open');

                const backdrop = $('.modal-backdrop');

                backdrop.fadeOut(200, () => {
                    backdrop.remove();

                    this.clear();
                });

                this.showing = false;
            },
        });

        this.$().one('animationend', () => this.onready());
    }

    onclick(e) {
        if (e.target === this.element) {
            this.close();
        }
    }

    /**
     * Close the modal dialog.
     */
    close() {
        if (!this.showing) return;

        // Don't hide the modal immediately, because if the consumer happens to call
        // the `show` method straight after to show another modal dialog, it will
        // cause the new modal dialog to disappear. Instead we will wait for a tiny
        // bit to give the `show` method the opportunity to prevent this from going
        // ahead.
        this.hideTimeout = setTimeout(() => MicroModal.close('Modal'));
    }

    /**
     * Clear content from the modal area.
     */
    protected clear() {
        if (this.component) {
            this.component.onhide();
        }

        this.modal = null;
        this.component = null;
        this.modalProps = {};

        // app.current.retain = false;

        m.redraw();
    }

    /**
     * When the modal dialog is ready to be used, tell it!
     */
    protected onready() {
        if (this.component) {
            this.component.onready();
        }
    }
}
